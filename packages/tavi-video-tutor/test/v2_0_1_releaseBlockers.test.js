import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { resolveSubtitleSources, resolveSubtitleVisibility, resolveSubtitleAvailability } from '../src/subtitles/resolver/subtitleResolver.js';
import { TranslationRouter } from '../src/subtitles/translation/TranslationRouter.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { processAllVideos } from '../src/subtitles/pipeline/processVideos.js';
import { processVideoQuality } from '../src/subtitles/video/processVideoQuality.js';
import { isPrivateHost, validateRemoteUrl, parseIPv4ToUint32, isPrivateIPv4Uint32, expandIPv6 } from '../src/subtitles/video/resolveVideo.js';
import { runClean, main } from '../src/cli/cli.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { TranscriptCache } from '../src/subtitles/transcript/transcriptCache.js';

// ==========================================
// GATE 1: Critical Player Crash & Manifest State Single Source of Truth
// ==========================================
test('Gate 1: Subtitle availability & source priority matrix resolves without uninitialized variables', () => {
  assert.ok(typeof resolveSubtitleSources === 'function', 'resolveSubtitleSources must be a function');
  assert.ok(typeof resolveSubtitleVisibility === 'function', 'resolveSubtitleVisibility must be a function');
  assert.ok(typeof resolveSubtitleAvailability === 'function', 'resolveSubtitleAvailability must be a function');

  const result1 = resolveSubtitleAvailability({
    subtitlesConfig: false,
    generatedSubtitles: { en: '/en.vtt' }
  });
  assert.equal(result1.hasAvailableSubtitles, false, 'subtitles=false must disable subtitles');

  const result2 = resolveSubtitleAvailability({
    subtitlesConfig: { en: '/custom-en.vtt' },
    generatedSubtitles: { en: '/gen-en.vtt', te: '/gen-te.vtt' }
  });
  assert.equal(result2.hasAvailableSubtitles, true);
  assert.equal(result2.resolvedTracks.en, '/custom-en.vtt', 'Developer track should override generated track');
  assert.equal(result2.resolvedTracks.te, '/gen-te.vtt', 'Generated track should remain available');
});

test('Gate 1: TaviVideoPlayer source code uses single source of truth without uninitialized manifestSubtitles', () => {
  const playerCode = fs.readFileSync(path.resolve('src/components/TaviVideoPlayer.jsx'), 'utf8');
  assert.ok(!playerCode.includes('setManifestSubtitles('), 'Player must not have conflicting setManifestSubtitles without state');
  assert.ok(playerCode.includes('internalManifestSubtitles'), 'Player must declare internalManifestSubtitles state');
  assert.ok(playerCode.includes('effectiveManifestSubtitles'), 'Player must compute effectiveManifestSubtitles single source of truth');
});

// ==========================================
// GATE 2: Package Exports & Compiled Player Entrypoint
// ==========================================
test('Gate 2: Compiled dist bundles exist and export required runtime modules', () => {
  const distPlayerJs = path.resolve('dist/player.js');
  const distPlayerCjs = path.resolve('dist/player.cjs');
  const distMainJs = path.resolve('dist/tavi-video-tutor.js');
  const distMainCjs = path.resolve('dist/tavi-video-tutor.cjs');

  assert.ok(fs.existsSync(distPlayerJs), 'dist/player.js must exist');
  assert.ok(fs.existsSync(distPlayerCjs), 'dist/player.cjs must exist');
  assert.ok(fs.existsSync(distMainJs), 'dist/tavi-video-tutor.js must exist');
  assert.ok(fs.existsSync(distMainCjs), 'dist/tavi-video-tutor.cjs must exist');

  const playerJsContent = fs.readFileSync(distPlayerJs, 'utf8');
  assert.ok(playerJsContent.includes('AITutor') || playerJsContent.includes('TaviVideoPlayer'), 'player.js must contain player components');
});

test('Gate 2: package.json exports map points to compiled dist files, not raw JSX source', () => {
  const pkgPath = path.resolve('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.equal(pkg.exports['./player'].import, './dist/player.js');
  assert.equal(pkg.exports['./player'].require, './dist/player.cjs');
  assert.equal(pkg.exports['.'].import, './dist/tavi-video-tutor.js');
  assert.equal(pkg.exports['.'].require, './dist/tavi-video-tutor.cjs');
  assert.ok(pkg.version === '2.0.1' || pkg.version === '2.0.2', 'Version must be 2.0.1 or 2.0.2');
});

// ==========================================
// GATE 3: TranslationRouter & Pipeline Error Isolation
// ==========================================
test('Gate 3: TranslationRouter supports offline/online language routing and targetLang variable is valid', async () => {
  const mockOnlineProvider = {
    supports: () => true,
    translateSegments: async () => {
      throw new Error('NETWORK_TIMEOUT: Online provider offline');
    }
  };

  const mockLocalProvider = {
    supports: (src, tgt) => tgt === 'hi' || tgt === 'es',
    translateSegments: async (segments, src, tgt) => {
      return segments.map(s => ({ ...s, text: `[LOCAL_${tgt.toUpperCase()}] ${s.text}` }));
    }
  };

  const router = new TranslationRouter({
    mode: 'auto',
    onlineProvider: mockOnlineProvider,
    localProvider: mockLocalProvider
  });

  // Target language supported by local fallback -> should seamlessly fallback without throwing targetLanguage ReferenceError
  const segments = [{ id: '1', start: 0, end: 2, text: 'Hello world' }];
  const resultHi = await router.translateSegments(segments, 'en', 'hi');
  assert.equal(resultHi[0].text, '[LOCAL_HI] Hello world');

  // Unsupported offline language -> should throw clear error mentioning targetLang
  await assert.rejects(
    async () => {
      await router.translateSegments(segments, 'en', 'xyz_unsupported');
    },
    (err) => {
      assert.ok(err.message.includes('UNSUPPORTED_OFFLINE'), 'Error should report UNSUPPORTED_OFFLINE');
      assert.ok(err.message.includes('xyz_unsupported'), 'Error should reference the targetLang correctly');
      return true;
    }
  );
});

test('Gate 3: Partial language translation failure does not destroy or abort successful languages', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-trans-fail-'));

  try {
    const manifestStore = new ManifestStore(tempDir);
    const mockTranslator = {
      supports: () => true,
      translateSegments: async (segs, src, tgt) => {
        if (tgt === 'broken_lang') {
          throw new Error('Simulated upstream failure for broken_lang');
        }
        return segs.map(s => ({ ...s, text: `Translated in ${tgt}` }));
      }
    };

    const mockTranscriber = {
      transcribe: async () => ({
        language: 'en',
        segments: [{ id: '1', start: 0, end: 2, text: 'Hello lesson' }]
      })
    };

    const dummyWavSource = path.resolve('dummy.wav');
    const dummyVideo = path.join(tempDir, 'dummy.wav');
    fs.copyFileSync(dummyWavSource, dummyVideo);

    const videoEntry = {
      id: 'test_vid',
      src: dummyVideo,
      languages: ['es', 'broken_lang', 'hi']
    };

    const logMessages = [];
    const result = await processSingleVideo(videoEntry, manifestStore, {
      translator: mockTranslator,
      transcriber: mockTranscriber,
      force: true
    }, (evt) => {
      logMessages.push(evt.message || evt);
    });

    assert.equal(result.status, 'completed');
    const loadedManifest = manifestStore.loadManifest();
    assert.ok(loadedManifest.test_vid, 'Manifest entry should be saved for successful languages');
    assert.ok(loadedManifest.test_vid.subtitles.es, 'es.vtt should exist');
    assert.ok(loadedManifest.test_vid.subtitles.hi, 'hi.vtt should exist');
    assert.equal(loadedManifest.test_vid.subtitles.broken_lang, undefined, 'broken_lang should not be in manifest');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ==========================================
// GATE 4: CLI --no-quality Option Execution
// ==========================================
test('Gate 4: processVideoQuality skips transcoding when noQuality option is true', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-noq-'));

  try {
    const manifestStore = new ManifestStore(tempDir);
    const dummyVideo = path.join(tempDir, 'video.mp4');
    fs.writeFileSync(dummyVideo, 'dummy video');

    const videoEntry = { id: 'sample', src: dummyVideo };
    let skippedEvt = null;

    const res = await processVideoQuality(videoEntry, manifestStore, { noQuality: true }, (evt) => {
      if (evt.type === 'quality-skipped') skippedEvt = evt;
    });

    assert.equal(res.status, 'skipped');
    assert.equal(res.reason, 'no-quality');
    assert.ok(skippedEvt, 'Should emit quality-skipped progress event');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ==========================================
// GATE 5: CLI Clean Command Asset Removal & Source Preservation
// ==========================================
test('Gate 5: runClean cleans all generated artifacts while leaving original source video untouched', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-clean-'));

  try {
    // 1. Create source media
    const publicDir = path.join(tempDir, 'public');
    fs.mkdirSync(publicDir, { recursive: true });
    const sourceVideoPath = path.join(publicDir, 'lesson_1.mp4');
    fs.writeFileSync(sourceVideoPath, 'ORIGINAL SOURCE MEDIA CONTENT');

    // 2. Create generated artifacts in public/aitutor and .aitutor
    const pubSubDir = path.join(publicDir, 'aitutor', 'subtitles', 'lesson_1');
    fs.mkdirSync(pubSubDir, { recursive: true });
    fs.writeFileSync(path.join(pubSubDir, 'en.vtt'), 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHi');
    fs.writeFileSync(path.join(pubSubDir, 'es.vtt'), 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHola');

    const pubQualDir = path.join(publicDir, 'aitutor', 'videos', 'lesson_1');
    fs.mkdirSync(pubQualDir, { recursive: true });
    fs.writeFileSync(path.join(pubQualDir, '720.mp4'), '720p rendition');

    const internalDir = path.join(tempDir, '.aitutor');
    const transDir = path.join(internalDir, 'transcripts');
    fs.mkdirSync(transDir, { recursive: true });
    fs.writeFileSync(path.join(transDir, 'lesson_1.json'), JSON.stringify({ segments: [] }));

    const manifestData = {
      lesson_1: {
        id: 'lesson_1',
        src: '/lesson_1.mp4',
        subtitles: {
          en: { src: '/aitutor/subtitles/lesson_1/en.vtt' },
          es: { src: '/aitutor/subtitles/lesson_1/es.vtt' }
        }
      },
      other_lesson: {
        id: 'other_lesson',
        src: '/other.mp4'
      }
    };
    fs.writeFileSync(path.join(internalDir, 'manifest.json'), JSON.stringify(manifestData, null, 2));

    // 3. Run selective clean for lesson_1
    await runClean({ video: 'lesson_1' }, tempDir);

    // Assert: Generated assets for lesson_1 must be removed
    assert.equal(fs.existsSync(pubSubDir), false, 'public/aitutor/subtitles/lesson_1 must be removed');
    assert.equal(fs.existsSync(pubQualDir), false, 'public/aitutor/videos/lesson_1 must be removed');
    assert.equal(fs.existsSync(path.join(transDir, 'lesson_1.json')), false, '.aitutor/transcripts/lesson_1.json must be removed');

    const updatedManifest = JSON.parse(fs.readFileSync(path.join(internalDir, 'manifest.json'), 'utf8'));
    assert.equal(updatedManifest.lesson_1, undefined, 'lesson_1 must be removed from manifest');
    assert.ok(updatedManifest.other_lesson, 'other_lesson must remain in manifest');

    // CRITICAL ASSERTION: Source media MUST NOT be touched!
    assert.equal(fs.existsSync(sourceVideoPath), true, 'Original source video MUST NOT be deleted');
    assert.equal(fs.readFileSync(sourceVideoPath, 'utf8'), 'ORIGINAL SOURCE MEDIA CONTENT', 'Source video content must remain intact');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ==========================================
// GATE 6: Security SSRF Hardening Matrix
// ==========================================
test('Gate 6: SSRF Hardening blocks all private IPv4, IPv6, IPv4-mapped IPv6, and protocol attacks', () => {
  // 1. IPv4 private ranges
  assert.equal(isPrivateHost('127.0.0.1'), true, '127.0.0.1 is private');
  assert.equal(isPrivateHost('127.1.2.3'), true, '127.x.x.x loopback range is private');
  assert.equal(isPrivateHost('0.0.0.0'), true, '0.0.0.0 is private');
  assert.equal(isPrivateHost('10.0.0.1'), true, '10.x.x.x is private');
  assert.equal(isPrivateHost('172.16.0.1'), true, '172.16.x.x is private');
  assert.equal(isPrivateHost('172.31.255.254'), true, '172.31.x.x is private');
  assert.equal(isPrivateHost('192.168.1.1'), true, '192.168.x.x is private');
  assert.equal(isPrivateHost('169.254.169.254'), true, '169.254.x.x link-local is private');
  assert.equal(isPrivateHost('100.64.0.1'), true, '100.64.x.x CGNAT is private');
  assert.equal(isPrivateHost('224.0.0.1'), true, 'Multicast is blocked');
  assert.equal(isPrivateHost('240.0.0.1'), true, 'Reserved IP is blocked');

  // Decimal / Hex integer representations of 127.0.0.1
  assert.equal(isPrivateHost('2130706433'), true, 'Decimal integer 2130706433 (127.0.0.1) is blocked');
  assert.equal(isPrivateHost('0x7f000001'), true, 'Hex 0x7f000001 (127.0.0.1) is blocked');

  // 2. Hostname domains
  assert.equal(isPrivateHost('localhost'), true, 'localhost is blocked');
  assert.equal(isPrivateHost('sub.localhost'), true, '*.localhost is blocked');
  assert.equal(isPrivateHost('server.local'), true, '*.local is blocked');
  assert.equal(isPrivateHost('api.internal'), true, '*.internal is blocked');

  // 3. IPv6 loopback & private
  assert.equal(isPrivateHost('::1'), true, '::1 loopback is blocked');
  assert.equal(isPrivateHost('[::1]'), true, '[::1] is blocked');
  assert.equal(isPrivateHost('0:0:0:0:0:0:0:1'), true, '0:0:0:0:0:0:0:1 is blocked');
  assert.equal(isPrivateHost('::'), true, ':: unspecified is blocked');
  assert.equal(isPrivateHost('fe80::1'), true, 'fe80:: link-local is blocked');
  assert.equal(isPrivateHost('fc00::1'), true, 'fc00:: unique local is blocked');
  assert.equal(isPrivateHost('fd00::1'), true, 'fd00:: unique local is blocked');

  // 4. IPv4-mapped IPv6
  assert.equal(isPrivateHost('::ffff:127.0.0.1'), true, '::ffff:127.0.0.1 is blocked');
  assert.equal(isPrivateHost('[::ffff:127.0.0.1]'), true, '[::ffff:127.0.0.1] is blocked');
  assert.equal(isPrivateHost('::ffff:10.0.0.1'), true, '::ffff:10.0.0.1 is blocked');
  assert.equal(isPrivateHost('::ffff:192.168.1.1'), true, '::ffff:192.168.1.1 is blocked');

  // 5. Valid public hostnames
  assert.equal(isPrivateHost('example.com'), false, 'example.com is public');
  assert.equal(isPrivateHost('8.8.8.8'), false, '8.8.8.8 is public');
  assert.equal(isPrivateHost('1.1.1.1'), false, '1.1.1.1 is public');

  // 6. Protocol checks
  assert.throws(() => validateRemoteUrl('file:///etc/passwd'), /BLOCKED_PROTOCOL/);
  assert.throws(() => validateRemoteUrl('gopher://127.0.0.1/'), /BLOCKED_PROTOCOL/);
  assert.throws(() => validateRemoteUrl('ftp://example.com/video.mp4'), /BLOCKED_PROTOCOL/);
  assert.throws(() => validateRemoteUrl('http://127.0.0.1/video.mp4'), /SSRF_BLOCKED/);
  assert.throws(() => validateRemoteUrl('http://[::1]/video.mp4'), /SSRF_BLOCKED/);
  assert.throws(() => validateRemoteUrl('http://[::ffff:127.0.0.1]/video.mp4'), /SSRF_BLOCKED/);

  // Valid remote URL passes
  const validUrl = validateRemoteUrl('https://example.com/video.mp4');
  assert.equal(validUrl.hostname, 'example.com');
});

// ==========================================
// GATE 7: Dynamic Transcriber Isolation
// ==========================================
test('Gate 7: Standard player bundle does NOT statically bundle AITranscriber', () => {
  const distPlayerJs = path.resolve('dist/player.js');
  const distPlayerContent = fs.readFileSync(distPlayerJs, 'utf8');

  // Verify that player bundle is tiny (<1KB) and points to chunk
  assert.ok(distPlayerContent.length < 2000, 'player.js bundle size must be under 2KB');
  
  // Verify that AITranscriber is in a separate async chunk
  const distFiles = fs.readdirSync(path.resolve('dist'));
  const transcriberChunk = distFiles.find(f => f.startsWith('AITranscriber-'));
  assert.ok(transcriberChunk, 'AITranscriber must be in an isolated asynchronous chunk');
});
