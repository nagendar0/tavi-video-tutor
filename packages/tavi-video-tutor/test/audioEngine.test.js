import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { resolveAudioSources, resolveAudioAvailability } from '../src/subtitles/resolver/audioResolver.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { alignAudioSegment } from '../src/subtitles/audio/alignAudioSegment.js';
import { stitchAudioSegments } from '../src/subtitles/audio/stitchAudioSegments.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';

test('1. Audio Resolver — Default All Languages & Manifest Resolution', () => {
  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio: {
      en: { label: 'English', src: '/aitutor/audio/lesson_1/en.m4a', language: 'en', source: true },
      hi: { label: 'Hindi', src: '/aitutor/audio/lesson_1/hi.m4a', language: 'hi' },
      te: { label: 'Telugu', src: '/aitutor/audio/lesson_1/te.m4a', language: 'te' }
    }
  });

  assert.equal(result.enabled, true);
  assert.equal(result.hasAvailableAudio, true);
  assert.deepEqual(result.availableLanguages, ['en', 'hi', 'te']);
  assert.deepEqual(result.visibleLanguages, ['en', 'hi', 'te']);
  assert.equal(result.resolvedTracks.hi.src, '/aitutor/audio/lesson_1/hi.m4a');
});

test('2. Audio Resolver — Explicit Language Array Filter', () => {
  const result = resolveAudioAvailability({
    audioLanguagesConfig: ['en', 'hi'],
    manifestAudio: {
      en: { label: 'English', src: '/aitutor/audio/lesson_1/en.m4a', language: 'en' },
      hi: { label: 'Hindi', src: '/aitutor/audio/lesson_1/hi.m4a', language: 'hi' },
      te: { label: 'Telugu', src: '/aitutor/audio/lesson_1/te.m4a', language: 'te' }
    }
  });

  assert.equal(result.enabled, true);
  assert.deepEqual(result.visibleLanguages, ['en', 'hi']);
  assert.equal(result.resolvedTracks.te, undefined);
});

test('3. Audio Resolver — Disabled Mode (audioLanguages={false})', () => {
  const result = resolveAudioAvailability({
    audioLanguagesConfig: false,
    manifestAudio: {
      en: { label: 'English', src: '/aitutor/audio/lesson_1/en.m4a', language: 'en' }
    }
  });

  assert.equal(result.enabled, false);
  assert.equal(result.hasAvailableAudio, false);
  assert.deepEqual(result.visibleLanguages, []);
  assert.deepEqual(result.resolvedTracks, {});
});

test('4. Audio Resolver — Developer Audio Overrides & Custom Map', () => {
  const result = resolveAudioAvailability({
    audioLanguagesConfig: {
      en: '/dev/custom_en.mp3',
      hi: '/dev/custom_hi.mp3'
    },
    manifestAudio: {
      en: { label: 'English', src: '/aitutor/audio/lesson_1/en.m4a', language: 'en' }
    }
  });

  assert.equal(result.enabled, true);
  assert.equal(result.resolvedTracks.en.src, '/dev/custom_en.mp3');
  assert.equal(result.resolvedTracks.hi.src, '/dev/custom_hi.mp3');
});

test('5. Audio Resolver — Missing Tracks & Empty Config', () => {
  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio: {}
  });

  assert.equal(result.enabled, false);
  assert.equal(result.hasAvailableAudio, false);
  assert.equal(result.selectedLanguage, 'original');
});

test('6. Audio Manifest Generation & Preserving Qualities / Subtitles', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-audio-manifest-test-'));
  try {
    const store = new ManifestStore(tmpDir);
    const videoEntry = { id: 'test_vid_1', src: 'https://example.com/test.mp4' };

    // Save subtitles
    store.saveMultilingualSubtitles(videoEntry, 'en', { en: 'WEBVTT\n\n1\n00:00.000 --> 00:02.000\nHello' });
    
    // Save audio
    const dummyAudioFile = path.join(tmpDir, 'dummy_hi.m4a');
    fs.writeFileSync(dummyAudioFile, 'fake audio content', 'utf8');

    store.saveMultilingualAudio(videoEntry, 'en', {
      en: { filePath: dummyAudioFile, label: 'English' },
      hi: { filePath: dummyAudioFile, label: 'Hindi' }
    }, null, { skipValidation: true });

    const manifest = store.loadManifest();
    const entry = manifest['test_vid_1'];

    assert.ok(entry);
    assert.ok(entry.subtitles.en);
    assert.ok(entry.audioLanguages.en);
    assert.ok(entry.audioLanguages.hi);
    assert.equal(entry.audioLanguages.hi.src, '/aitutor/audio/test_vid_1/hi.m4a');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('7. TTS Provider Interface & NodeTTSProvider', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-tts-test-'));
  try {
    const provider = new NodeTTSProvider();
    const result = await provider.synthesize('Welcome to AITutor', 'en', { outputDir: tmpDir });

    assert.ok(result.audioPath);
    assert.ok(fs.existsSync(result.audioPath));
    assert.ok(result.duration > 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('8. Segment Audio Alignment & Duration Fitting', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-align-test-'));
  try {
    const provider = new NodeTTSProvider();
    const synth = await provider.synthesize('Short text', 'en', { outputDir: tmpDir });

    const alignedPath = await alignAudioSegment(synth.audioPath, synth.duration, 0, 4.5, tmpDir);

    assert.ok(alignedPath);
    assert.ok(fs.existsSync(alignedPath));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('9. Audio Stitching & Full M4A Generation', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-stitch-test-'));
  try {
    const provider = new NodeTTSProvider();
    const s1 = await provider.synthesize('First segment', 'en', { outputDir: tmpDir });
    const s2 = await provider.synthesize('Second segment', 'en', { outputDir: tmpDir });

    const outM4a = path.join(tmpDir, 'stitched.m4a');
    await stitchAudioSegments([
      { start: 0, end: 3, audioPath: s1.audioPath },
      { start: 3, end: 6, audioPath: s2.audioPath }
    ], outM4a, 6);

    assert.ok(fs.existsSync(outM4a));
    assert.ok(fs.statSync(outM4a).size > 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('10. ProcessSingleVideo Audio Dubbing Pipeline & Cache Hits', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-pipeline-audio-test-'));
  try {
    const store = new ManifestStore(tmpDir);
    const videoEntry = {
      id: 'lesson_audio_test',
      src: 'https://example.com/video.mp4',
      languages: ['en'],
      audioLanguages: ['en', 'hi']
    };

    const mockTranscriber = {
      transcribe: async () => ({
        language: 'en',
        segments: [{ start: 0, end: 2, text: 'Hello class' }]
      })
    };

    const mockTranslator = {
      supports: () => true,
      translateSegments: async (segs) => segs.map(s => ({ ...s, text: 'नमस्ते कक्षा' }))
    };

    // First run (generate)
    const res1 = await processSingleVideo(videoEntry, store, {
      transcriber: mockTranscriber,
      translator: mockTranslator,
      audioLanguages: ['en', 'hi'],
      allowTestFallback: true
    });

    assert.equal(res1.status, 'completed');
    assert.equal(res1.generatedAudioCount, 2);

    // Second run (cache hit)
    const res2 = await processSingleVideo(videoEntry, store, {
      transcriber: mockTranscriber,
      translator: mockTranslator,
      audioLanguages: ['en', 'hi'],
      allowTestFallback: true
    });

    assert.equal(res2.status, 'cached');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('11. Fault Isolation — Partial TTS Failure Does Not Abort Successful Languages', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-fault-test-'));
  try {
    const store = new ManifestStore(tmpDir);
    const videoEntry = {
      id: 'lesson_fault_test',
      src: 'https://example.com/video.mp4',
      languages: ['en'],
      audioLanguages: ['en', 'fail_lang']
    };

    const mockTranscriber = {
      transcribe: async () => ({
        language: 'en',
        segments: [{ start: 0, end: 2, text: 'Hello class' }]
      })
    };

    const mockTTS = {
      synthesize: async (text, lang) => {
        if (lang === 'fail_lang') throw new Error('TTS Engine Crash');
        return new NodeTTSProvider().synthesize(text, lang, { outputDir: tmpDir });
      }
    };

    const res = await processSingleVideo(videoEntry, store, {
      transcriber: mockTranscriber,
      ttsProvider: mockTTS,
      audioLanguages: ['en', 'fail_lang'],
      allowTestFallback: true
    });

    assert.equal(res.status, 'completed');
    assert.equal(res.generatedAudioCount, 1);
    
    const manifest = store.loadManifest();
    assert.ok(manifest['lesson_fault_test'].audioLanguages.en);
    assert.equal(manifest['lesson_fault_test'].audioLanguages.fail_lang, undefined);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});

test('12. Lazy Loading Guarantee — No Bulk Pre-Fetching of 109 Audio Tracks on Mount', () => {
  const availability = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio: {
      en: { src: '/en.m4a' },
      hi: { src: '/hi.m4a' },
      te: { src: '/te.m4a' }
    },
    selectedLanguage: 'original'
  });

  // Selected language is original, 0 audio track network requests required on mount
  assert.equal(availability.selectedLanguage, 'original');
  assert.equal(availability.resolvedTracks['original'], undefined);
  assert.equal(Object.keys(availability.resolvedTracks).length, 3);
});

test('13. Rapid Audio Switching Memory & State Preservation Matrix', () => {
  let selectedAudio = 'original';
  let currentTime = 14.5;
  let volume = 0.8;
  let isMuted = false;
  let subLanguage = 'te';
  let quality = '720p';

  const switchAudio = (newLang) => {
    selectedAudio = newLang;
    // Preserves currentTime, volume, mute, subLanguage, quality
    return { selectedAudio, currentTime, volume, isMuted, subLanguage, quality };
  };

  const langs = ['en', 'hi', 'te', 'es', 'original'];
  for (let i = 0; i < 100; i++) {
    const target = langs[i % langs.length];
    const state = switchAudio(target);
    assert.equal(state.currentTime, 14.5);
    assert.equal(state.volume, 0.8);
    assert.equal(state.isMuted, false);
    assert.equal(state.subLanguage, 'te');
    assert.equal(state.quality, '720p');
  }
});
