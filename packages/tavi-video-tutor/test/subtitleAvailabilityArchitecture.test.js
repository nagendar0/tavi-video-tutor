import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSubtitleAvailability, resolveSubtitleSources } from '../src/subtitles/resolver/subtitleResolver.js';

test('Test A: Fresh install <AITutor src="/lesson.mp4" /> with NO generated subtitles', () => {
  const result = resolveSubtitleAvailability({
    subtitlesConfig: undefined,
    generatedSubtitles: {},
    developerSubtitles: {},
    uploadedSubtitles: {},
    demoSubtitles: {},
    embeddedTracks: []
  });

  assert.equal(result.enabled, false, 'enabled must be FALSE on fresh install');
  assert.equal(result.hasAvailableSubtitles, false, 'hasAvailableSubtitles must be FALSE');
  assert.equal(result.availableLanguages.length, 0);
  assert.equal(result.visibleLanguages.length, 0);
  assert.deepEqual(result.resolvedTracks, {});
  assert.equal(result.primarySource, null);
  assert.ok(result.reason.includes('No subtitle sources found'));
});

test('Test B: Generated subtitles from manifest.json', () => {
  const generatedSubtitles = {
    en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHello',
    hi: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nNamaste'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: undefined,
    generatedSubtitles,
    developerSubtitles: {},
    uploadedSubtitles: {},
    demoSubtitles: {},
    embeddedTracks: []
  });

  assert.equal(result.enabled, true);
  assert.equal(result.hasAvailableSubtitles, true);
  assert.deepEqual(result.availableLanguages.sort(), ['en', 'hi'].sort());
  assert.deepEqual(result.visibleLanguages.sort(), ['en', 'hi'].sort());
  assert.equal(result.primarySource, 'generated');
  assert.equal(result.sourceByLanguage.en, 'generated');
});

test('Test C: Developer manual subtitles prop', () => {
  const developerSubtitles = {
    en: '/subtitles/custom-en.vtt',
    es: '/subtitles/custom-es.vtt'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: developerSubtitles,
    generatedSubtitles: {},
    developerSubtitles,
    uploadedSubtitles: {},
    demoSubtitles: {},
    embeddedTracks: []
  });

  assert.equal(result.enabled, true);
  assert.equal(result.hasAvailableSubtitles, true);
  assert.deepEqual(result.availableLanguages.sort(), ['en', 'es'].sort());
  assert.equal(result.primarySource, 'developer');
  assert.equal(result.sourceByLanguage.en, 'developer');
});

test('Test D: Uploaded subtitles', () => {
  const uploadedSubtitles = {
    te: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nNamaskaram'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: undefined,
    generatedSubtitles: {},
    developerSubtitles: {},
    uploadedSubtitles,
    demoSubtitles: {},
    embeddedTracks: []
  });

  assert.equal(result.enabled, true);
  assert.equal(result.hasAvailableSubtitles, true);
  assert.deepEqual(result.availableLanguages, ['te']);
  assert.equal(result.primarySource, 'uploaded');
});

test('Test E: subtitles={false} completely disables subtitle system', () => {
  const generatedSubtitles = {
    en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHello'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: false,
    generatedSubtitles,
    developerSubtitles: {},
    uploadedSubtitles: {},
    demoSubtitles: {},
    embeddedTracks: []
  });

  assert.equal(result.enabled, false);
  assert.equal(result.hasAvailableSubtitles, false);
  assert.equal(result.mode, 'disabled');
  assert.equal(result.availableLanguages.length, 0);
  assert.equal(result.visibleLanguages.length, 0);
  assert.deepEqual(result.resolvedTracks, {});
  assert.ok(result.reason.includes('disabled'));
});

test('Test F: Visibility filter subtitles={["en", "hi", "te"]}', () => {
  const generatedSubtitles = {
    en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nEn',
    hi: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHi',
    es: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nEs',
    fr: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nFr'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: ['en', 'hi', 'te'],
    generatedSubtitles,
    developerSubtitles: {},
    uploadedSubtitles: {},
    demoSubtitles: {},
    embeddedTracks: []
  });

  assert.equal(result.enabled, true);
  assert.equal(result.hasAvailableSubtitles, true);
  assert.equal(result.mode, 'filter');
  assert.deepEqual(result.availableLanguages.sort(), ['en', 'es', 'fr', 'hi'].sort());
  assert.deepEqual(result.visibleLanguages.sort(), ['en', 'hi'].sort()); // 'te' not generated, 'es' and 'fr' filtered out
  assert.deepEqual(Object.keys(result.resolvedTracks).sort(), ['en', 'hi'].sort());
});

test('Test G: Delete manifest', () => {
  let manifest = { en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nTrack' };

  let result = resolveSubtitleAvailability({
    subtitlesConfig: 'all',
    generatedSubtitles: manifest
  });
  assert.equal(result.enabled, true);

  // Delete manifest
  manifest = {};
  result = resolveSubtitleAvailability({
    subtitlesConfig: 'all',
    generatedSubtitles: manifest
  });

  assert.equal(result.enabled, false);
  assert.equal(result.hasAvailableSubtitles, false);
  assert.equal(result.visibleLanguages.length, 0);
});

test('Test H: Rapid runtime switching (all -> false -> all -> filter -> false -> generated)', () => {
  const generatedSubtitles = { en: 'VTT-EN', hi: 'VTT-HI', es: 'VTT-ES' };

  // Step 1: all
  let res = resolveSubtitleAvailability({ subtitlesConfig: 'all', generatedSubtitles });
  assert.equal(res.enabled, true);
  assert.equal(res.visibleLanguages.length, 3);

  // Step 2: false
  res = resolveSubtitleAvailability({ subtitlesConfig: false, generatedSubtitles });
  assert.equal(res.enabled, false);
  assert.equal(res.visibleLanguages.length, 0);

  // Step 3: all
  res = resolveSubtitleAvailability({ subtitlesConfig: 'all', generatedSubtitles });
  assert.equal(res.enabled, true);
  assert.equal(res.visibleLanguages.length, 3);

  // Step 4: filter
  res = resolveSubtitleAvailability({ subtitlesConfig: ['en', 'hi'], generatedSubtitles });
  assert.equal(res.enabled, true);
  assert.deepEqual(res.visibleLanguages.sort(), ['en', 'hi'].sort());

  // Step 5: false
  res = resolveSubtitleAvailability({ subtitlesConfig: false, generatedSubtitles });
  assert.equal(res.enabled, false);

  // Step 6: generated
  res = resolveSubtitleAvailability({ subtitlesConfig: undefined, generatedSubtitles });
  assert.equal(res.enabled, true);
  assert.equal(res.visibleLanguages.length, 3);
});

test('Test I: Video switching clears old tracks and loads new video tracks', () => {
  const videoATracks = { en: 'VTT-A-EN', fr: 'VTT-A-FR' };
  const videoBTracks = { es: 'VTT-B-ES', de: 'VTT-B-DE' };

  let res = resolveSubtitleAvailability({ subtitlesConfig: 'all', generatedSubtitles: videoATracks });
  assert.deepEqual(res.visibleLanguages.sort(), ['en', 'fr'].sort());

  res = resolveSubtitleAvailability({ subtitlesConfig: 'all', generatedSubtitles: videoBTracks });
  assert.deepEqual(res.visibleLanguages.sort(), ['de', 'es'].sort());
});

test('Test J: Language switching preserves availability single source of truth', () => {
  const generatedSubtitles = { en: 'VTT-EN', te: 'VTT-TE' };

  const res = resolveSubtitleAvailability({ subtitlesConfig: 'all', generatedSubtitles });

  assert.equal(res.enabled, true);
  assert.equal(res.hasAvailableSubtitles, true);
  assert.ok(res.resolvedTracks['en']);
  assert.ok(res.resolvedTracks['te']);
});
