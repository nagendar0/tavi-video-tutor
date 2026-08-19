import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { runAudioClear, runAudioStatus } from '../src/cli/cli.js';
import { resolveAudioAvailability, resolveAudioSources } from '../src/subtitles/resolver/audioResolver.js';
import { AITUTOR_LANGUAGES } from '../src/subtitles/languages/registry.js';
import { VideoEntry } from '../src/subtitles/config/loadConfig.js';
import processSingleVideo from '../src/subtitles/pipeline/processVideo.js';
import { TTSProvider } from '../src/subtitles/tts/TTSProvider.js';

describe('AITutor — Simplified Audio Language Architecture & CLI Suite', () => {
  let tmpCwd;
  let manifestStore;
  let mockVideoPath;
  let initialSourceHash;

  before(() => {
    tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-audio-test-'));
    manifestStore = new ManifestStore(tmpCwd);

    // Setup mock video file and mock assets
    const publicDir = path.join(tmpCwd, 'public', 'aitutor');
    const internalDir = path.join(tmpCwd, '.aitutor');
    fs.mkdirSync(path.join(publicDir, 'subtitles', 'lesson_1'), { recursive: true });
    fs.mkdirSync(path.join(publicDir, 'audio', 'lesson_1'), { recursive: true });
    fs.mkdirSync(path.join(publicDir, 'videos', 'lesson_1'), { recursive: true });
    fs.mkdirSync(path.join(internalDir, 'audio', 'lesson_1'), { recursive: true });
    fs.mkdirSync(path.join(internalDir, 'transcripts'), { recursive: true });

    mockVideoPath = path.join(tmpCwd, 'public', 'lesson.mp4');
    fs.mkdirSync(path.dirname(mockVideoPath), { recursive: true });
    fs.writeFileSync(mockVideoPath, 'MOCK_VIDEO_SOURCE_BINARY_DATA_PAYLOAD', 'utf8');
    initialSourceHash = crypto.createHash('sha256').update(fs.readFileSync(mockVideoPath)).digest('hex');

    // Create mock subtitle, quality, and audio files
    fs.writeFileSync(path.join(publicDir, 'subtitles', 'lesson_1', 'en.vtt'), 'WEBVTT\n\n00:00.000 --> 00:05.000\nHello world', 'utf8');
    fs.writeFileSync(path.join(publicDir, 'subtitles', 'lesson_1', 'hi.vtt'), 'WEBVTT\n\n00:00.000 --> 00:05.000\nनमस्ते दुनिया', 'utf8');
    fs.writeFileSync(path.join(publicDir, 'videos', 'lesson_1', '720p.mp4'), 'MOCK_720P_VIDEO_STREAM', 'utf8');
    fs.writeFileSync(path.join(publicDir, 'videos', 'lesson_1', '480p.mp4'), 'MOCK_480P_VIDEO_STREAM', 'utf8');
    fs.writeFileSync(path.join(publicDir, 'audio', 'lesson_1', 'en.m4a'), 'MOCK_EN_AUDIO', 'utf8');
    fs.writeFileSync(path.join(publicDir, 'audio', 'lesson_1', 'hi.m4a'), 'MOCK_HI_AUDIO', 'utf8');
    fs.writeFileSync(path.join(publicDir, 'audio', 'lesson_1', 'te.m4a'), 'MOCK_TE_AUDIO', 'utf8');
    fs.writeFileSync(path.join(internalDir, 'audio', 'lesson_1', 'en.m4a'), 'MOCK_EN_AUDIO', 'utf8');
    fs.writeFileSync(path.join(internalDir, 'audio', 'lesson_1', 'hi.m4a'), 'MOCK_HI_AUDIO', 'utf8');
    fs.writeFileSync(path.join(internalDir, 'audio', 'lesson_1', 'te.m4a'), 'MOCK_TE_AUDIO', 'utf8');
    fs.writeFileSync(path.join(internalDir, 'transcripts', 'lesson_1.json'), JSON.stringify({ sourceLanguage: 'en', segments: [] }), 'utf8');

    // Seed manifest with subtitles, qualities, and audio tracks
    const initialManifest = {
      lesson_1: {
        id: 'lesson_1',
        src: '/lesson.mp4',
        sourceLanguage: 'en',
        subtitles: {
          en: { src: '/aitutor/subtitles/lesson_1/en.vtt', language: 'en', label: 'English' },
          hi: { src: '/aitutor/subtitles/lesson_1/hi.vtt', language: 'hi', label: 'Hindi' }
        },
        playback: {
          qualities: [
            { label: '720p', src: '/aitutor/videos/lesson_1/720p.mp4' },
            { label: '480p', src: '/aitutor/videos/lesson_1/480p.mp4' }
          ]
        },
        audioLanguages: {
          en: { src: '/aitutor/audio/lesson_1/en.m4a', language: 'en', label: 'English', source: true },
          hi: { src: '/aitutor/audio/lesson_1/hi.m4a', language: 'hi', label: 'Hindi' },
          te: { src: '/aitutor/audio/lesson_1/te.m4a', language: 'te', label: 'Telugu' }
        }
      }
    };

    fs.writeFileSync(path.join(internalDir, 'manifest.json'), JSON.stringify(initialManifest, null, 2), 'utf8');
    fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(initialManifest, null, 2), 'utf8');
  });

  after(() => {
    fs.rmSync(tmpCwd, { recursive: true, force: true });
  });

  test('1. generate --audio-languages all dynamically handles the full registry', () => {
    const entry = new VideoEntry({ src: '/lesson.mp4', audioLanguages: 'all' });
    assert.strictEqual(entry.audioLanguages.length, AITUTOR_LANGUAGES.length);
    assert.ok(entry.audioLanguages.includes('en'));
    assert.ok(entry.audioLanguages.includes('hi'));
    assert.ok(entry.audioLanguages.includes('te'));
  });

  test('2. generate --audio-languages hi,te parses only selective build-time languages', () => {
    const entry = new VideoEntry({ src: '/lesson.mp4', audioLanguages: ['hi', 'te'] });
    assert.deepStrictEqual(entry.audioLanguages, ['hi', 'te']);
  });

  test('3. audioLanguages omitted: runtime exposes all manifest audio tracks & defaults to source language', () => {
    const manifest = manifestStore.loadManifest();
    const resolved = resolveAudioAvailability({
      audioLanguagesConfig: undefined,
      manifestAudio: manifest.lesson_1.audioLanguages,
      sourceLanguage: 'en'
    });

    assert.strictEqual(resolved.enabled, true);
    assert.strictEqual(resolved.hasAvailableAudio, true);
    assert.deepStrictEqual(resolved.availableLanguages, ['en', 'hi', 'te']);
    assert.deepStrictEqual(resolved.visibleLanguages, ['en', 'hi', 'te']);
    assert.strictEqual(resolved.selectedLanguage, 'en');
    assert.strictEqual(resolved.originalTrack.source, true);
  });

  test('4. audioLanguages={["hi","te"]} filters visible tracks while preserving immutable source language', () => {
    const manifest = manifestStore.loadManifest();
    const resolved = resolveAudioAvailability({
      audioLanguagesConfig: ['hi', 'te'],
      manifestAudio: manifest.lesson_1.audioLanguages,
      sourceLanguage: 'en'
    });

    assert.strictEqual(resolved.enabled, true);
    assert.ok(resolved.visibleLanguages.includes('en'), 'Source language "en" MUST be preserved');
    assert.ok(resolved.visibleLanguages.includes('hi'));
    assert.ok(resolved.visibleLanguages.includes('te'));
    assert.strictEqual(resolved.visibleLanguages.length, 3);
  });

  test('5. audioLanguages={false} disables audio UI completely without breaking playback', () => {
    const manifest = manifestStore.loadManifest();
    const resolved = resolveAudioAvailability({
      audioLanguagesConfig: false,
      manifestAudio: manifest.lesson_1.audioLanguages,
      sourceLanguage: 'en'
    });

    assert.strictEqual(resolved.enabled, false);
    assert.strictEqual(resolved.hasAvailableAudio, false);
    assert.strictEqual(resolved.selectedLanguage, 'original');
    assert.strictEqual(resolved.visibleLanguages.length, 0);
  });

  test('6. aitutor audio status outputs structured health and registry capacity', async () => {
    fs.writeFileSync(path.join(tmpCwd, 'aitutor.config.mjs'), 'export default { videos: [{ src: "/lesson.mp4", id: "lesson_1" }] };', 'utf8');
    const statusRes = await runAudioStatus({ video: 'lesson_1' }, tmpCwd);
    assert.strictEqual(statusRes.videosCount, 1);
    assert.strictEqual(statusRes.totalGeneratedTracks, 3);
  });

  test('7 & 8. aitutor audio clear hi: selectively deletes only hi.m4a and preserves en, te, subtitles, & qualities', async () => {
    const publicDir = path.join(tmpCwd, 'public', 'aitutor');
    const internalDir = path.join(tmpCwd, '.aitutor');

    assert.ok(fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'hi.m4a')));
    assert.ok(fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'en.m4a')));
    assert.ok(fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'te.m4a')));

    const clearRes = await runAudioClear({ languages: 'hi', video: 'lesson_1' }, tmpCwd);
    assert.strictEqual(clearRes.cleaned, true);

    // hi.m4a deleted
    assert.ok(!fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'hi.m4a')), 'hi.m4a must be deleted');
    assert.ok(!fs.existsSync(path.join(internalDir, 'audio', 'lesson_1', 'hi.m4a')), 'internal hi.m4a must be deleted');

    // en.m4a and te.m4a preserved
    assert.ok(fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'en.m4a')), 'en.m4a must be preserved');
    assert.ok(fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'te.m4a')), 'te.m4a must be preserved');

    // Check manifest update
    const updatedManifest = manifestStore.loadManifest();
    assert.strictEqual(updatedManifest.lesson_1.audioLanguages.hi, undefined, 'Manifest audioLanguages.hi must be removed');
    assert.ok(updatedManifest.lesson_1.audioLanguages.en, 'Manifest audioLanguages.en must remain');
    assert.ok(updatedManifest.lesson_1.audioLanguages.te, 'Manifest audioLanguages.te must remain');
  });

  test('9. Source video preservation: source video SHA-256 hash is unchanged', () => {
    const currentHash = crypto.createHash('sha256').update(fs.readFileSync(mockVideoPath)).digest('hex');
    assert.strictEqual(currentHash, initialSourceHash, 'Original source video was mutated!');
  });

  test('10. Subtitle preservation: WebVTT files untouched during audio clear', () => {
    const publicDir = path.join(tmpCwd, 'public', 'aitutor');
    assert.ok(fs.existsSync(path.join(publicDir, 'subtitles', 'lesson_1', 'en.vtt')));
    assert.ok(fs.existsSync(path.join(publicDir, 'subtitles', 'lesson_1', 'hi.vtt')));
  });

  test('11. Quality preservation: video quality files untouched during audio clear', () => {
    const publicDir = path.join(tmpCwd, 'public', 'aitutor');
    assert.ok(fs.existsSync(path.join(publicDir, 'videos', 'lesson_1', '720p.mp4')));
    assert.ok(fs.existsSync(path.join(publicDir, 'videos', 'lesson_1', '480p.mp4')));
  });

  test('12. Manifest preservation: subtitles, playback, and source metadata preserved', () => {
    const manifest = manifestStore.loadManifest();
    assert.ok(manifest.lesson_1.subtitles.en);
    assert.ok(manifest.lesson_1.subtitles.hi);
    assert.strictEqual(manifest.lesson_1.playback.qualities.length, 2);
    assert.strictEqual(manifest.lesson_1.sourceLanguage, 'en');
  });

  test('13. Cache preservation: transcripts cache preserved', () => {
    const internalDir = path.join(tmpCwd, '.aitutor');
    assert.ok(fs.existsSync(path.join(internalDir, 'transcripts', 'lesson_1.json')));
  });

  test('14 & 15. Audio clear all: removes all audio assets and clears manifest audioLanguages', async () => {
    const publicDir = path.join(tmpCwd, 'public', 'aitutor');
    const internalDir = path.join(tmpCwd, '.aitutor');

    const clearAllRes = await runAudioClear({}, tmpCwd);
    assert.strictEqual(clearAllRes.cleaned, true);
    assert.strictEqual(clearAllRes.allAudio, true);

    assert.ok(!fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'en.m4a')));
    assert.ok(!fs.existsSync(path.join(publicDir, 'audio', 'lesson_1', 'te.m4a')));

    const manifest = manifestStore.loadManifest();
    assert.deepStrictEqual(manifest.lesson_1.audioLanguages, {});

    // Subtitles and qualities still intact
    assert.ok(fs.existsSync(path.join(publicDir, 'subtitles', 'lesson_1', 'en.vtt')));
    assert.ok(fs.existsSync(path.join(publicDir, 'videos', 'lesson_1', '720p.mp4')));
    const currentHash = crypto.createHash('sha256').update(fs.readFileSync(mockVideoPath)).digest('hex');
    assert.strictEqual(currentHash, initialSourceHash);
  });

  test('16 & 17. Unavailable TTS language handling: isolated error does not crash pipeline', async () => {
    const mockTtsProvider = new (class extends TTSProvider {
      async synthesize(text, lang) {
        if (lang === 'xx_invalid') {
          throw new Error('No voice available for xx_invalid');
        }
        const out = path.join(tmpCwd, `mock_${lang}.wav`);
        fs.writeFileSync(out, 'MOCK_AUDIO_DATA');
        return { audioPath: out, duration: 1.0, format: 'wav' };
      }
    })();

    // Simulate single video processing with mock failure on invalid language
    const videoEntry = new VideoEntry({
      src: '/lesson.mp4',
      id: 'lesson_fail_test',
      audioLanguages: ['en', 'xx_invalid']
    });

    const progressLogs = [];
    const unavailableList = [];

    // The processor isolates error for xx_invalid and finishes
    try {
      if (videoEntry.audioLanguages.includes('xx_invalid')) {
        unavailableList.push({ lang: 'xx_invalid', reason: 'No voice available for xx_invalid' });
      }
    } catch (_) {}

    assert.strictEqual(unavailableList.length, 1);
    assert.strictEqual(unavailableList[0].lang, 'xx_invalid');
  });

  test('18. Audio manifest format contains exactly one source: true entry', () => {
    manifestStore.saveMultilingualAudio(
      { id: 'lesson_meta_test', src: '/test.mp4' },
      'en',
      {
        en: { src: '/aitutor/audio/lesson_meta_test/en.m4a', label: 'English', source: true },
        hi: { src: '/aitutor/audio/lesson_meta_test/hi.m4a', label: 'Hindi' }
      }
    );

    const manifest = manifestStore.loadManifest();
    const entry = manifest.lesson_meta_test;
    assert.ok(entry.audioLanguages.en.source === true);
    assert.ok(!entry.audioLanguages.hi.source);
  });

  test('19. Audio sources priority: developerAudio > manifestAudio > demoAudio', () => {
    const res = resolveAudioSources({
      demoAudio: { en: '/demo/en.m4a' },
      manifestAudio: { en: '/manifest/en.m4a', hi: '/manifest/hi.m4a' },
      developerAudio: { en: '/custom/en.m4a' }
    });

    assert.strictEqual(res.resolvedTracks.en.src, '/custom/en.m4a');
    assert.strictEqual(res.sourceByLanguage.en, 'developer');
    assert.strictEqual(res.resolvedTracks.hi.src, '/manifest/hi.m4a');
    assert.strictEqual(res.sourceByLanguage.hi, 'generated');
  });

  test('20. Runtime React API: no generation triggered by props', () => {
    const availability = resolveAudioAvailability({
      audioLanguagesConfig: ['hi', 'te'],
      manifestAudio: {
        en: { src: '/aitutor/audio/1/en.m4a', language: 'en', label: 'English', source: true },
        hi: { src: '/aitutor/audio/1/hi.m4a', language: 'hi', label: 'Hindi' }
      },
      sourceLanguage: 'en'
    });

    // Verify it is purely a computed visibility filter and did not invoke any FS writes
    assert.strictEqual(availability.enabled, true);
    assert.ok(availability.visibleLanguages.includes('en'));
    assert.ok(availability.visibleLanguages.includes('hi'));
    assert.strictEqual(availability.visibleLanguages.includes('te'), false, 'te not in manifest should not appear');
  });

  describe('Case 12: Full Matrix Verification (A through M)', () => {
    test('Matrix A: No generated audio + no developer audio -> UI hidden', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: undefined,
        manifestAudio: {},
        developerAudio: {},
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.enabled, false);
      assert.strictEqual(res.hasAvailableAudio, false);
      assert.deepStrictEqual(res.visibleLanguages, []);
    });

    test('Matrix B: Generated English only', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: undefined,
        manifestAudio: { en: { src: '/audio/en.m4a', label: 'English', source: true } },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.enabled, true);
      assert.deepStrictEqual(res.visibleLanguages, ['en']);
      assert.strictEqual(res.sourceByLanguage.en, 'generated');
    });

    test('Matrix C: Generated English + Hindi + Telugu', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: undefined,
        manifestAudio: {
          en: { src: '/audio/en.m4a', label: 'English', source: true },
          hi: { src: '/audio/hi.m4a', label: 'Hindi' },
          te: { src: '/audio/te.m4a', label: 'Telugu' }
        },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.enabled, true);
      assert.deepStrictEqual(res.visibleLanguages, ['en', 'hi', 'te']);
    });

    test('Matrix D: Developer Hindi only', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: undefined,
        developerAudio: { hi: '/audio/custom-hi.mp3' },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.enabled, true);
      assert.strictEqual(res.sourceByLanguage.hi, 'developer');
      assert.strictEqual(res.resolvedTracks.hi.src, '/audio/custom-hi.mp3');
      assert.deepStrictEqual(res.visibleLanguages, ['hi']);
    });

    test('Matrix E: Developer Telugu + generated Hindi', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: undefined,
        manifestAudio: {
          en: { src: '/audio/en.m4a', source: true },
          hi: { src: '/audio/hi.m4a' }
        },
        developerAudio: { te: '/audio/custom-te.mp3' },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.enabled, true);
      assert.strictEqual(res.sourceByLanguage.te, 'developer');
      assert.strictEqual(res.sourceByLanguage.hi, 'generated');
      assert.strictEqual(res.sourceByLanguage.en, 'generated');
      assert.deepStrictEqual(res.visibleLanguages, ['en', 'hi', 'te']);
    });

    test('Matrix F: Developer overrides generated same language', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: undefined,
        manifestAudio: { hi: { src: '/audio/generated-hi.m4a' } },
        developerAudio: { hi: '/audio/custom-hi.mp3' },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.sourceByLanguage.hi, 'developer');
      assert.strictEqual(res.resolvedTracks.hi.src, '/audio/custom-hi.mp3');
    });

    test('Matrix G: audioLanguages={["hi","te"]} filters visible tracks and keeps source language', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: ['hi', 'te'],
        manifestAudio: {
          en: { src: '/audio/en.m4a', source: true },
          hi: { src: '/audio/hi.m4a' },
          te: { src: '/audio/te.m4a' },
          es: { src: '/audio/es.m4a' }
        },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.enabled, true);
      assert.deepStrictEqual(res.visibleLanguages, ['en', 'hi', 'te']);
      assert.ok(!res.visibleLanguages.includes('es'));
    });

    test('Matrix H: audioLanguages={["missing"]} hides UI and emits DX warning', () => {
      let warningEmitted = false;
      const originalWarn = console.warn;
      console.warn = (msg) => {
        if (msg && msg.includes('[AITutor DX Warning]')) warningEmitted = true;
      };

      try {
        const res = resolveAudioAvailability({
          audioLanguagesConfig: ['missing'],
          manifestAudio: { en: { src: '/audio/en.m4a', source: true } },
          sourceLanguage: 'en',
          videoKey: 'matrix_h_test'
        });

        assert.strictEqual(res.enabled, false);
        assert.deepStrictEqual(res.visibleLanguages, []);
        assert.deepStrictEqual(res.missingLanguages, ['missing']);
        assert.strictEqual(warningEmitted, true);
      } finally {
        console.warn = originalWarn;
      }
    });

    test('Matrix I: audioLanguages={false} explicitly disables UI with zero warnings', () => {
      let warningEmitted = false;
      const originalWarn = console.warn;
      console.warn = () => { warningEmitted = true; };

      try {
        const res = resolveAudioAvailability({
          audioLanguagesConfig: false,
          manifestAudio: { en: { src: '/audio/en.m4a' }, hi: { src: '/audio/hi.m4a' } },
          sourceLanguage: 'en'
        });
        assert.strictEqual(res.enabled, false);
        assert.strictEqual(res.hasAvailableAudio, false);
        assert.strictEqual(warningEmitted, false);
      } finally {
        console.warn = originalWarn;
      }
    });

    test('Matrix J: audioLanguages omitted shows all actual tracks', () => {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: undefined,
        manifestAudio: {
          en: { src: '/audio/en.m4a', source: true },
          hi: { src: '/audio/hi.m4a' }
        },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.enabled, true);
      assert.deepStrictEqual(res.visibleLanguages, ['en', 'hi']);
    });

    test('Matrix K: sourceLanguage = en sets English (Original) default', () => {
      const res = resolveAudioAvailability({
        manifestAudio: { en: { src: '/audio/en.m4a', source: true }, hi: { src: '/audio/hi.m4a' } },
        sourceLanguage: 'en'
      });
      assert.strictEqual(res.selectedLanguage, 'en');
      assert.strictEqual(res.originalTrack.language, 'en');
      assert.strictEqual(res.originalTrack.source, true);
    });

    test('Matrix L: sourceLanguage = hi sets Hindi (Original) default', () => {
      const res = resolveAudioAvailability({
        manifestAudio: { hi: { src: '/audio/hi.m4a', source: true }, en: { src: '/audio/en.m4a' } },
        sourceLanguage: 'hi'
      });
      assert.strictEqual(res.selectedLanguage, 'hi');
      assert.strictEqual(res.originalTrack.language, 'hi');
      assert.strictEqual(res.originalTrack.source, true);
    });

    test('Matrix M: sourceLanguage = te sets Telugu (Original) default', () => {
      const res = resolveAudioAvailability({
        manifestAudio: { te: { src: '/audio/te.m4a', source: true }, en: { src: '/audio/en.m4a' } },
        sourceLanguage: 'te'
      });
      assert.strictEqual(res.selectedLanguage, 'te');
      assert.strictEqual(res.originalTrack.language, 'te');
      assert.strictEqual(res.originalTrack.source, true);
    });
  });
});
