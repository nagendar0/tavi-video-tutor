import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

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

describe('AITutor Unified DX Warning System (22 Requirements)', () => {
  let originalWarn;
  let capturedWarnings = [];
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

  // 1. Audio: missing all
  test('1. Audio: requested languages missing all -> displays available: none and generation command', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi', 'te'],
      manifestAudio: {},
      videoKey: 'v1'
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

  // 2. Audio: missing some
  test('2. Audio: requested languages missing some -> displays available: hi and missing: te, ta', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi', 'te', 'ta'],
      manifestAudio: {
        hi: { label: 'Hindi', src: '/hi.mp3', language: 'hi' }
      },
      videoKey: 'v2'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['hi']);
    assert.deepEqual(res.missingItems, ['te', 'ta']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('Requested audio languages: hi, te, ta'));
    assert.ok(capturedWarnings[0].includes('Available audio languages: hi'));
    assert.ok(capturedWarnings[0].includes('Missing: te, ta'));
    assert.ok(capturedWarnings[0].includes('npx aitutor generate --audio-languages all'));
  });

  // 3. Audio: all available
  test('3. Audio: all requested languages available -> 0 warnings emitted', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['en', 'hi'],
      manifestAudio: {
        en: { label: 'English', src: '/en.mp3', language: 'en', source: true },
        hi: { label: 'Hindi', src: '/hi.mp3', language: 'hi' }
      },
      videoKey: 'v3'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'hi']);
    assert.equal(capturedWarnings.length, 0);
  });

  // 4. Audio: developer override
  test('4. Audio: developer override counts as available and suppresses missing warning', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      manifestAudio: {},
      developerAudio: {
        hi: '/custom-hi.mp3'
      },
      videoKey: 'v4'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['hi']);
    assert.equal(capturedWarnings.length, 0);
  });

  // 5. Audio: audioLanguages={false}
  test('5. Audio: audioLanguages={false} disables UI with 0 warnings emitted', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: false,
      manifestAudio: {},
      videoKey: 'v5'
    });

    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.equal(capturedWarnings.length, 0);
  });

  // 6. Audio: duplicate warning suppression
  test('6. Audio: duplicate warnings are suppressed across re-renders for identical state', () => {
    const opts = {
      audioLanguagesConfig: ['hi', 'te'],
      manifestAudio: { en: { label: 'English', src: '/en.mp3', language: 'en', source: true } },
      videoKey: 'v6'
    };

    resolveAudioAvailability(opts);
    resolveAudioAvailability(opts);
    resolveAudioAvailability(opts);

    assert.equal(capturedWarnings.length, 1);
  });

  // 7. Subtitles: missing all
  test('7. Subtitles: requested languages missing all -> displays available: none and generation command', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['hi', 'te'],
      generatedSubtitles: {},
      videoKey: 's1'
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

  // 8. Subtitles: missing some
  test('8. Subtitles: requested languages missing some -> displays available: en and missing: hi, te', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['en', 'hi', 'te'],
      generatedSubtitles: { en: '/en.vtt' },
      videoKey: 's2'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en']);
    assert.deepEqual(res.missingItems, ['hi', 'te']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('Requested subtitle languages: en, hi, te'));
    assert.ok(capturedWarnings[0].includes('Available subtitle languages: en'));
    assert.ok(capturedWarnings[0].includes('Missing: hi, te'));
    assert.ok(capturedWarnings[0].includes('npx aitutor generate'));
  });

  // 9. Subtitles: all available
  test('9. Subtitles: all requested languages available -> 0 warnings emitted', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['en', 'hi'],
      generatedSubtitles: { en: '/en.vtt', hi: '/hi.vtt' },
      videoKey: 's3'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'hi']);
    assert.equal(capturedWarnings.length, 0);
  });

  // 10. Subtitles: developer override
  test('10. Subtitles: developer override counts as available and suppresses missing warning', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: ['te'],
      generatedSubtitles: {},
      developerSubtitles: { te: '/custom-te.vtt' },
      videoKey: 's4'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['te']);
    assert.equal(capturedWarnings.length, 0);
  });

  // 11. Subtitles: subtitles={false}
  test('11. Subtitles: subtitles={false} disables UI with 0 warnings emitted', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: false,
      generatedSubtitles: {},
      videoKey: 's5'
    });

    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.equal(capturedWarnings.length, 0);
  });

  // 12. Subtitles: duplicate warning suppression
  test('12. Subtitles: duplicate warnings are suppressed across re-renders for identical state', () => {
    const opts = {
      subtitlesConfig: ['en', 'hi', 'te'],
      generatedSubtitles: { en: '/en.vtt' },
      videoKey: 's6'
    };

    resolveSubtitleAvailability(opts);
    resolveSubtitleAvailability(opts);
    resolveSubtitleAvailability(opts);

    assert.equal(capturedWarnings.length, 1);
  });

  // 13. Quality: missing all
  test('13. Quality: requested qualities missing all -> displays available: none and generation command', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['1080p', '720p'],
      manifestQualities: [],
      videoKey: 'q1'
    });

    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.deepEqual(res.missingItems, ['1080p', '720p']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('[AITutor DX Warning]'));
    assert.ok(capturedWarnings[0].includes('Requested video qualities: 1080p, 720p'));
    assert.ok(capturedWarnings[0].includes('Available video qualities: none'));
    assert.ok(capturedWarnings[0].includes('Missing: 1080p, 720p'));
    assert.ok(capturedWarnings[0].includes('npx aitutor generate'));
  });

  // 14. Quality: missing some
  test('14. Quality: requested qualities missing some -> displays available: 1080p, 720p and missing: 4k', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['1080p', '720p', '4k'],
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' }
      ],
      videoKey: 'q2'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['1080p', '720p']);
    assert.deepEqual(res.missingItems, ['4k']);
    assert.equal(capturedWarnings.length, 1);
    assert.ok(capturedWarnings[0].includes('Requested video qualities: 1080p, 720p, 4k'));
    assert.ok(capturedWarnings[0].includes('Available video qualities: 1080p, 720p'));
    assert.ok(capturedWarnings[0].includes('Missing: 4k'));
    assert.ok(capturedWarnings[0].includes('npx aitutor generate'));
  });

  // 15. Quality: all available
  test('15. Quality: all requested qualities available -> 0 warnings emitted', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['1080p', '720p'],
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' }
      ],
      videoKey: 'q3'
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['1080p', '720p']);
    assert.equal(capturedWarnings.length, 0);
  });

  // 16. Quality: duplicate warning suppression
  test('16. Quality: duplicate warnings are suppressed across re-renders for identical state', () => {
    const opts = {
      qualitiesConfig: ['1080p', '720p', '4k'],
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' }
      ],
      videoKey: 'q6'
    };

    resolveQualityAvailability(opts);
    resolveQualityAvailability(opts);
    resolveQualityAvailability(opts);

    assert.equal(capturedWarnings.length, 1);
  });

  // 17. Production warning suppression
  test('17. Production mode (NODE_ENV=production) suppresses all DX warnings', () => {
    process.env.NODE_ENV = 'production';

    resolveAudioAvailability({
      audioLanguagesConfig: ['hi', 'te'],
      manifestAudio: {},
      videoKey: 'prod_audio'
    });

    resolveSubtitleAvailability({
      subtitlesConfig: ['hi', 'te'],
      generatedSubtitles: {},
      videoKey: 'prod_sub'
    });

    resolveQualityAvailability({
      qualitiesConfig: ['1080p', '4k'],
      manifestQualities: [{ label: '1080p', src: '/1080.mp4' }],
      videoKey: 'prod_qual'
    });

    assert.equal(capturedWarnings.length, 0, 'Production mode MUST suppress all DX warnings');
  });

  // 18. React StrictMode warning deduplication
  test('18. React StrictMode idempotency: double invocation produces exactly one warning', () => {
    const subOpts = {
      subtitlesConfig: ['en', 'te'],
      generatedSubtitles: { en: '/en.vtt' },
      videoKey: 'strict_mode_test'
    };

    // Simulate React 18/19 StrictMode double invocation
    const firstCall = resolveSubtitleAvailability(subOpts);
    const secondCall = resolveSubtitleAvailability(subOpts);

    assert.deepEqual(firstCall, secondCall);
    assert.equal(capturedWarnings.length, 1, 'StrictMode double render MUST produce only 1 warning');
  });

  // 19. No-manifest behavior
  test('19. No-manifest behavior: missing manifest gracefully returns disabled states without crash', () => {
    const subRes = resolveSubtitleAvailability({ videoKey: 'nomanifest' });
    const audioRes = resolveAudioAvailability({ videoKey: 'nomanifest' });
    const qualRes = resolveQualityAvailability({ videoKey: 'nomanifest' });

    assert.equal(subRes.enabled, false);
    assert.equal(audioRes.enabled, false);
    assert.equal(qualRes.enabled, false);
    assert.equal(capturedWarnings.length, 0);
  });

  // 20. Manifest updates cause warning state to update
  test('20. Manifest update: state updates and allows fresh resolution when media assets change', () => {
    // Initial mount without Hindi audio
    const initialRes = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      manifestAudio: {},
      videoKey: 'dynamic_manifest_video'
    });
    assert.equal(initialRes.enabled, false);
    assert.equal(capturedWarnings.length, 1);

    // Later, manifest updates and Hindi audio is now available
    const updatedRes = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      manifestAudio: {
        hi: { label: 'Hindi', src: '/aitutor/audio/dynamic_manifest_video/hi.m4a', language: 'hi' }
      },
      videoKey: 'dynamic_manifest_video'
    });
    assert.equal(updatedRes.enabled, true);
    assert.deepEqual(updatedRes.visibleItems, ['hi']);
    // No new warning emitted because Hindi is now available
    assert.equal(capturedWarnings.length, 1);
  });

  // 21. No unnecessary network requests
  test('21. Network safety: missing items are completely omitted from visibleItems and resolvedItems', () => {
    const subRes = resolveSubtitleAvailability({
      subtitlesConfig: ['en', 'fr', 'de'],
      generatedSubtitles: { en: '/en.vtt' },
      videoKey: 'net_safe'
    });
    assert.ok(!subRes.visibleItems.includes('fr'));
    assert.ok(!subRes.visibleItems.includes('de'));
    assert.equal(subRes.resolvedItems['fr'], undefined);
    assert.equal(subRes.resolvedItems['de'], undefined);

    const audioRes = resolveAudioAvailability({
      audioLanguagesConfig: ['en', 'fr', 'de'],
      manifestAudio: { en: { label: 'English', src: '/en.mp3', language: 'en', source: true } },
      videoKey: 'net_safe'
    });
    assert.ok(!audioRes.visibleItems.includes('fr'));
    assert.ok(!audioRes.visibleItems.includes('de'));
    assert.equal(audioRes.resolvedItems['fr'], undefined);
    assert.equal(audioRes.resolvedItems['de'], undefined);

    const qualRes = resolveQualityAvailability({
      qualitiesConfig: ['1080p', '4k', '8k'],
      manifestQualities: [{ label: '1080p', src: '/1080.mp4' }],
      videoKey: 'net_safe'
    });
    assert.ok(!qualRes.visibleItems.includes('4k'));
    assert.ok(!qualRes.visibleItems.includes('8k'));
    assert.ok(!qualRes.resolvedItems.some(q => q.label === '4k' || q.label === '8k'));
  });

  // 22. Original-language invariance
  test('22. Original-language invariance: sourceLanguage remains authoritative and immutable', () => {
    const audioRes = resolveAudioAvailability({
      audioLanguagesConfig: ['hi', 'te'],
      sourceLanguage: 'en',
      manifestAudio: {
        en: { label: 'English', src: '/en.mp3', language: 'en', source: true }
      },
      videoKey: 'immutable_source'
    });

    assert.equal(audioRes.sourceLanguage, 'en', 'Source language must remain en');
    assert.deepEqual(audioRes.missingItems, ['hi', 'te']);
    assert.equal(audioRes.enabled, false);
    assert.deepEqual(audioRes.visibleItems, []);
  });
});
