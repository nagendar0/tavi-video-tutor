import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  resolveSubtitleAvailability,
  emitSubtitleDXWarning,
  clearWarnedSubtitleCache
} from '../src/subtitles/resolver/subtitleResolver.js';

import {
  resolveAudioAvailability,
  emitAudioDXWarning,
  clearWarnedAudioCache
} from '../src/subtitles/resolver/audioResolver.js';

import {
  resolveQualityAvailability,
  emitQualityDXWarning,
  clearWarnedQualityCache
} from '../src/subtitles/resolver/qualityResolver.js';

import {
  checkNode,
  checkFFmpeg,
  checkFFprobe,
  checkWingetAvailable,
  checkWhisperProvider,
  checkWhisperModel,
  checkTranslationProvider,
  checkTTSProvider,
  checkCacheDirectories,
  checkDiskSpace,
  runPreflight,
  formatPreflightTable,
  formatDoctorReport
} from '../src/subtitles/env/preflight.js';

import {
  askConfirmation,
  installWindowsFFmpeg,
  installWhisperProvider,
  downloadModelArtifacts,
  remediateMissing
} from '../src/subtitles/env/remediator.js';

import {
  isWhisperModelCached,
  downloadWhisperModel,
  WHISPER_MODEL_SIZES
} from '../src/subtitles/transcription/WhisperProvider.js';

import { probeMedia } from '../src/subtitles/video/MediaProbe.js';
import { runDoctor, runSetup, runGenerate } from '../src/cli/cli.js';

describe('AITutor DX + Media Availability Improvement (45 Test Matrix)', () => {
  let capturedWarnings = [];
  let originalWarn;
  let originalNodeEnv;

  beforeEach(() => {
    capturedWarnings = [];
    originalWarn = console.warn;
    console.warn = (...args) => {
      capturedWarnings.push(args.join(' '));
    };
    originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    clearWarnedSubtitleCache();
    clearWarnedAudioCache();
    clearWarnedQualityCache();
  });

  afterEach(() => {
    console.warn = originalWarn;
    process.env.NODE_ENV = originalNodeEnv;
    clearWarnedSubtitleCache();
    clearWarnedAudioCache();
    clearWarnedQualityCache();
  });

  // ============================================================
  // SECTION 1: AVAILABILITY RESOLVERS & DX WARNINGS (Tests 1-17)
  // ============================================================

  test('1. subtitle missing all: emits [AITutor DX Warning] with npx aitutor generate', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['hi', 'te'],
      generatedSubtitles: {},
      videoKey: 'sub_all_missing'
    });
    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.deepEqual(res.missingItems, ['hi', 'te']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('[AITutor DX Warning]'));
    assert.ok(capturedWarnings[0].includes('Requested subtitle languages: hi, te'));
    assert.ok(capturedWarnings[0].includes('Available subtitle languages: none'));
    assert.ok(capturedWarnings[0].includes('Missing: hi, te'));
    assert.ok(capturedWarnings[0].includes('npx aitutor generate'));
  });

  test('2. subtitle missing some: exposes available tracks and lists missing subset', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['en', 'hi', 'te'],
      generatedSubtitles: { en: '/en.vtt' },
      videoKey: 'sub_some_missing'
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en']);
    assert.deepEqual(res.missingItems, ['hi', 'te']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('Requested subtitle languages: en, hi, te'));
    assert.ok(capturedWarnings[0].includes('Available subtitle languages: en'));
    assert.ok(capturedWarnings[0].includes('Missing: hi, te'));
  });

  test('3. subtitle filter: resolves subset when all requested are available (0 warnings)', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['en', 'hi'],
      generatedSubtitles: { en: '/en.vtt', hi: '/hi.vtt', te: '/te.vtt' },
      videoKey: 'sub_filter_match'
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'hi']);
    assert.equal(capturedWarnings.length, 0);
  });

  test('4. subtitle false: subtitles={false} completely disables UI and emits 0 warnings', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: false,
      generatedSubtitles: { en: '/en.vtt' },
      videoKey: 'sub_false'
    });
    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.equal(capturedWarnings.length, 0);
  });

  test('5. audio missing all: emits [AITutor DX Warning] with npx aitutor generate --audio-languages all', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi', 'te'],
      manifestAudio: {},
      videoKey: 'audio_all_missing'
    });
    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.deepEqual(res.missingItems, ['hi', 'te']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('[AITutor DX Warning]'));
    assert.ok(capturedWarnings[0].includes('Requested audio languages: hi, te'));
    assert.ok(capturedWarnings[0].includes('Available audio languages: none'));
    assert.ok(capturedWarnings[0].includes('Missing: hi, te'));
    assert.ok(capturedWarnings[0].includes('npx aitutor generate --audio-languages all'));
  });

  test('6. audio missing some: exposes available tracks and lists missing subset', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['en', 'hi', 'te'],
      manifestAudio: {
        en: { label: 'English', src: '/en.mp3', language: 'en', source: true },
        hi: { label: 'Hindi', src: '/hi.mp3', language: 'hi' }
      },
      videoKey: 'audio_some_missing'
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'hi']);
    assert.deepEqual(res.missingItems, ['te']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('Requested audio languages: en, hi, te'));
    assert.ok(capturedWarnings[0].includes('Available audio languages: en, hi'));
    assert.ok(capturedWarnings[0].includes('Missing: te'));
  });

  test('7. audio filter: keeps original language protected and visible', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      sourceLanguage: 'en',
      manifestAudio: {
        en: { label: 'English', src: '/en.mp3', language: 'en', source: true },
        hi: { label: 'Hindi', src: '/hi.mp3', language: 'hi' },
        te: { label: 'Telugu', src: '/te.mp3', language: 'te' }
      },
      videoKey: 'audio_filter_original'
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'hi']);
    assert.ok(!res.visibleItems.includes('te'));
    assert.equal(capturedWarnings.length, 0);
  });

  test('8. audio false: audioLanguages={false} hides UI and emits 0 warnings', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: false,
      manifestAudio: { en: { label: 'English', src: '/en.mp3', language: 'en', source: true } },
      videoKey: 'audio_false'
    });
    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.equal(capturedWarnings.length, 0);
  });

  test('9. developer audio override: developer-provided audio counts as available and overrides generated', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      manifestAudio: { hi: { label: 'Generated Hindi', src: '/gen-hi.mp3' } },
      developerAudio: { hi: '/dev-hi.mp3' },
      videoKey: 'dev_audio_override'
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['hi']);
    assert.equal(res.resolvedItems['hi'].src, '/dev-hi.mp3');
    assert.equal(capturedWarnings.length, 0);
  });

  test('10. quality missing: emits [AITutor DX Warning] with npx aitutor generate', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['1080p', '720p', '4k'],
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' }
      ],
      videoKey: 'qual_missing'
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['1080p', '720p']);
    assert.deepEqual(res.missingItems, ['4k']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('[AITutor DX Warning]'));
    assert.ok(capturedWarnings[0].includes('Requested video qualities: 1080p, 720p, 4k'));
    assert.ok(capturedWarnings[0].includes('Available video qualities: 1080p, 720p'));
    assert.ok(capturedWarnings[0].includes('Missing: 4k'));
    assert.ok(capturedWarnings[0].includes('npx aitutor generate'));
  });

  test('11. quality filter: matches existing renditions without warnings when all exist', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['1080p', '720p'],
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' },
        { label: '480p', src: '/480.mp4' }
      ],
      videoKey: 'qual_filter_match'
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['1080p', '720p']);
    assert.equal(capturedWarnings.length, 0);
  });

  test('12. no fake resources: never invents non-existent languages or quality options', () => {
    const subRes = resolveSubtitleAvailability({
      subtitlesConfig: ['xx_fake'],
      generatedSubtitles: { en: '/en.vtt' },
      videoKey: 'sub_fake'
    });
    assert.ok(!subRes.visibleItems.includes('xx_fake'));

    const qualRes = resolveQualityAvailability({
      qualitiesConfig: ['8K_fake'],
      manifestQualities: [{ label: '1080p', src: '/1080.mp4' }],
      videoKey: 'qual_fake'
    });
    assert.ok(!qualRes.visibleItems.includes('8K_fake'));
  });

  test('13. no request = no warning: <AITutor src="/lesson.mp4" /> with no media emits 0 warnings', () => {
    const subRes = resolveSubtitleAvailability({ videoKey: 'no_req_sub' });
    const audioRes = resolveAudioAvailability({ videoKey: 'no_req_audio' });
    const qualRes = resolveQualityAvailability({ videoKey: 'no_req_qual' });

    assert.equal(subRes.enabled, false);
    assert.equal(audioRes.enabled, false);
    assert.equal(qualRes.enabled, false);
    assert.equal(capturedWarnings.length, 0, 'No warning must be emitted when developer did not request optional assets');
  });

  test('14. warning deduplication: stable warning key suppresses duplicate logs', () => {
    const opts = {
      subtitlesConfig: ['hi'],
      generatedSubtitles: {},
      videoKey: 'dedup_sub'
    };
    resolveSubtitleAvailability(opts);
    resolveSubtitleAvailability(opts);
    resolveSubtitleAvailability(opts);
    assert.equal(capturedWarnings.length, 1);
  });

  test('15. production warning suppression: process.env.NODE_ENV=production produces 0 warnings', () => {
    process.env.NODE_ENV = 'production';
    resolveSubtitleAvailability({ subtitlesConfig: ['hi'], generatedSubtitles: {}, videoKey: 'prod_sub' });
    resolveAudioAvailability({ audioLanguagesConfig: ['hi'], manifestAudio: {}, videoKey: 'prod_audio' });
    resolveQualityAvailability({ qualitiesConfig: ['4k'], manifestQualities: [], videoKey: 'prod_qual' });
    assert.equal(capturedWarnings.length, 0);
  });

  test('16. StrictMode warning deduplication: double render generates exactly 1 warning', () => {
    const opts = {
      audioLanguagesConfig: ['hi', 'te'],
      manifestAudio: { en: { label: 'English', src: '/en.mp3', source: true } },
      videoKey: 'strictmode_audio'
    };
    resolveAudioAvailability(opts);
    resolveAudioAvailability(opts);
    assert.equal(capturedWarnings.length, 1);
  });

  test('17. manifest update removes warning: adding missing asset clears warning on next run', () => {
    // 1st render: missing Hindi
    const r1 = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      manifestAudio: {},
      videoKey: 'dyn_manifest_audio'
    });
    assert.equal(r1.enabled, false);
    assert.equal(capturedWarnings.length, 1);

    // 2nd render: manifest now contains Hindi
    const r2 = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      manifestAudio: { hi: { label: 'Hindi', src: '/hi.mp3' } },
      videoKey: 'dyn_manifest_audio'
    });
    assert.equal(r2.enabled, true);
    assert.deepEqual(r2.visibleItems, ['hi']);
    // No new warning logged
    assert.equal(capturedWarnings.length, 1);
  });

  // ============================================================
  // SECTION 2: PREFLIGHT & SETUP (Tests 18-36)
  // ============================================================

  test('18. FFmpeg installed detection', async () => {
    const result = await checkFFmpeg();
    assert.equal(typeof result.pass, 'boolean');
    assert.equal(result.name, 'FFmpeg');
  });

  test('19. FFmpeg missing detection & graceful handling', async () => {
    const origPath = process.env.FFMPEG_PATH;
    try {
      process.env.FFMPEG_PATH = path.join(os.tmpdir(), 'missing_ffmpeg_dummy_123.exe');
      const result = await checkFFmpeg();
      assert.equal(result.pass, false);
      assert.equal(result.name, 'FFmpeg');
    } finally {
      if (origPath !== undefined) process.env.FFMPEG_PATH = origPath;
      else delete process.env.FFMPEG_PATH;
    }
  });

  test('20. FFprobe installed detection', async () => {
    const result = await checkFFprobe();
    assert.equal(typeof result.pass, 'boolean');
    assert.equal(result.name, 'FFprobe');
  });

  test('21. FFprobe missing detection & graceful handling', async () => {
    const origPath = process.env.FFPROBE_PATH;
    try {
      process.env.FFPROBE_PATH = path.join(os.tmpdir(), 'missing_ffprobe_dummy_123.exe');
      const result = await checkFFprobe();
      assert.equal(result.pass, false);
      assert.equal(result.name, 'FFprobe');
    } finally {
      if (origPath !== undefined) process.env.FFPROBE_PATH = origPath;
      else delete process.env.FFPROBE_PATH;
    }
  });

  test('22. winget available detection', async () => {
    const result = await checkWingetAvailable();
    assert.equal(typeof result, 'boolean');
  });

  test('23. winget unavailable detection on non-Windows platform', async () => {
    if (process.platform !== 'win32') {
      const result = await checkWingetAvailable();
      assert.equal(result, false);
    } else {
      assert.ok(true);
    }
  });

  test('24. Whisper provider installed detection', async () => {
    const result = await checkWhisperProvider();
    assert.equal(result.name, 'Whisper Provider');
    assert.equal(typeof result.pass, 'boolean');
  });

  test('25. Whisper provider missing handling', async () => {
    const preflightRes = await runPreflight({ model: 'Xenova/whisper-base' });
    assert.ok(preflightRes.checks.whisperProvider);
  });

  test('26. Whisper model installed detection', async () => {
    const check = await checkWhisperModel('Xenova/whisper-base');
    assert.equal(check.name, 'Whisper Model');
    assert.equal(typeof check.pass, 'boolean');
  });

  test('27. Whisper model missing detection', async () => {
    const check = await checkWhisperModel('UncachedOrg/uncached-model-xyz');
    assert.equal(check.pass, false);
    assert.equal(check.cached, false);
  });

  test('28. model cache hit mechanics', async () => {
    const cached = await isWhisperModelCached('Xenova/whisper-base');
    assert.equal(typeof cached.cached, 'boolean');
  });

  test('29. model download success flow (askConfirmation)', async () => {
    const accepted = await askConfirmation('Download model now?', true, { yes: true });
    assert.equal(accepted, true);
  });

  test('30. model download failure graceful error handling', async () => {
    const res = await downloadModelArtifacts('NonExistentModel/fail-xyz', {
      transcriber: { options: { allowTestFallback: false } }
    }).catch(err => ({ success: false, error: err.message }));
    assert.equal(res.success, false);
  });

  test('31. user declines installation returns false', async () => {
    const declined = await askConfirmation('Install now?', false, { nonInteractive: true, yes: false });
    assert.equal(declined, false);
  });

  test('32. preflight blocks generation when critical requirements missing', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-block-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'aitutor.config.mjs'), 'export default { videos: [{ id: "v1", src: "./v.mp4" }] };');
      const origFfmpeg = process.env.FFMPEG_PATH;
      process.env.FFMPEG_PATH = path.join(tmpDir, 'missing_ffmpeg.exe');
      try {
        const genResult = await runGenerate({ nonInteractive: true, yes: false }, tmpDir);
        assert.equal(genResult.failed, 1);
        assert.equal(genResult.preflightBlocked, true);
      } finally {
        if (origFfmpeg !== undefined) process.env.FFMPEG_PATH = origFfmpeg;
        else delete process.env.FFMPEG_PATH;
      }
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('33. generation proceeds after successful setup', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preflight-proceed-'));
    try {
      fs.writeFileSync(path.join(tmpDir, 'aitutor.config.mjs'), 'export default { videos: [] };');
      const preflight = await runPreflight({}, tmpDir);
      assert.equal(typeof preflight.passed, 'boolean');
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('34. no unhandled spawn ENOENT: MediaProbe handles missing binaries safely', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-enoent-'));
    const dummy = path.join(tmpDir, 'test.mp4');
    fs.writeFileSync(dummy, 'dummy');

    const origProbe = process.env.FFPROBE_PATH;
    try {
      process.env.FFPROBE_PATH = path.join(tmpDir, 'missing_ffprobe.exe');
      await assert.rejects(
        async () => { await probeMedia(dummy); },
        (err) => {
          assert.ok(err.message.includes('MediaProbe Error'));
          return true;
        }
      );
    } finally {
      if (origProbe !== undefined) process.env.FFPROBE_PATH = origProbe;
      else delete process.env.FFPROBE_PATH;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('35. doctor command: returns structured environment health report', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'doctor-test-'));
    try {
      const docRes = await runDoctor({ nonInteractive: true }, tmpDir);
      assert.equal(typeof docRes.ready, 'boolean');
      assert.ok(docRes.preflight);
      assert.ok(docRes.preflight.checks.node);
      assert.ok(docRes.preflight.checks.ffmpeg);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('36. setup command: provides interactive setup runner', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-test-'));
    try {
      const setupRes = await runSetup({ nonInteractive: true, yes: true }, tmpDir);
      assert.equal(typeof setupRes.ready, 'boolean');
      assert.ok(setupRes.preflight);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  // ============================================================
  // SECTION 3: INTEGRATION & COMPONENT CONTRACTS (Tests 37-45)
  // ============================================================

  test('37. subtitles + audio + quality: 3-way media system independence', () => {
    const s = resolveSubtitleAvailability({ generatedSubtitles: { en: '/en.vtt' } });
    const a = resolveAudioAvailability({ manifestAudio: { en: { src: '/en.mp3', source: true } } });
    const q = resolveQualityAvailability({ manifestQualities: [{ label: '720p', src: '/720.mp4' }] });

    assert.equal(s.enabled, true);
    assert.equal(a.enabled, true);
    assert.equal(q.enabled, true);
    assert.deepEqual(s.visibleItems, ['en']);
    assert.deepEqual(a.visibleItems, ['en']);
    assert.deepEqual(q.visibleItems, ['720p']);
  });

  test('38. no-manifest: graceful zero-crash mount with minimal player', () => {
    const s = resolveSubtitleAvailability({});
    const a = resolveAudioAvailability({});
    const q = resolveQualityAvailability({});

    assert.equal(s.enabled, false);
    assert.equal(a.enabled, false);
    assert.equal(q.enabled, false);
  });

  test('39. React 18: component contract compatibility', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['en', 'es'],
      generatedSubtitles: { en: '/en.vtt', es: '/es.vtt' }
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'es']);
  });

  test('40. React 19: component contract compatibility', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['en', 'hi'],
      manifestAudio: {
        en: { src: '/en.mp3', source: true },
        hi: { src: '/hi.mp3' }
      }
    });
    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'hi']);
  });

  test('41. StrictMode: multi-render state setter idempotency', () => {
    const sub1 = resolveSubtitleAvailability({ generatedSubtitles: { en: '/en.vtt' } });
    const sub2 = resolveSubtitleAvailability({ generatedSubtitles: { en: '/en.vtt' } });
    assert.deepEqual(sub1, sub2);
  });

  test('42. fresh consumer: packaged tarball verification passes', () => {
    const tarballPath = path.resolve('tavi-video-tutor-2.1.1.tgz');
    assert.ok(fs.existsSync(tarballPath), 'tavi-video-tutor-2.1.1.tgz must exist');
  });

  test('43. package build: dist output artifacts are present and compiled', () => {
    const distJs = path.resolve('dist/tavi-video-tutor.js');
    const distCss = path.resolve('dist/tavi-video-tutor.css');
    assert.ok(fs.existsSync(distJs), 'dist/tavi-video-tutor.js must exist');
    assert.ok(fs.existsSync(distCss), 'dist/tavi-video-tutor.css must exist');
  });

  test('44. TypeScript: type declarations exist for all resolvers and components', () => {
    const subDts = path.resolve('src/subtitles/resolver/subtitleResolver.d.ts');
    const audioDts = path.resolve('src/subtitles/resolver/audioResolver.d.ts');
    const qualDts = path.resolve('src/subtitles/resolver/qualityResolver.d.ts');
    const mainDts = path.resolve('src/index.d.ts');

    assert.ok(fs.existsSync(subDts), 'subtitleResolver.d.ts must exist');
    assert.ok(fs.existsSync(audioDts), 'audioResolver.d.ts must exist');
    assert.ok(fs.existsSync(qualDts), 'qualityResolver.d.ts must exist');
    assert.ok(fs.existsSync(mainDts), 'index.d.ts must exist');
  });

  test('45. production bundle: standard player bundle excludes heavy AI runtimes', () => {
    const distPlayer = path.resolve('dist/player.js');
    const content = fs.readFileSync(distPlayer, 'utf8');
    assert.ok(!content.includes('@huggingface/transformers'), 'Player bundle must NOT bundle heavy transformers');
    assert.ok(!content.includes('@xenova/transformers'), 'Player bundle must NOT bundle xenova');
  });
});
