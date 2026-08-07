import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSubtitleVisibility, resolveSubtitleSources } from '../src/subtitles/resolver/subtitleResolver.js';

test('TEST A: Fresh install <AITutor src="/lesson.mp4" /> with NO generated subtitles', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: undefined,
    generatedSubtitles: {},
    demoSubtitles: {},
    uploadedSubtitles: {}
  });

  assert.equal(result.enabled, false, 'isSubtitleEnabled must be FALSE when no subtitles exist');
  assert.equal(result.availableLanguages.length, 0, 'availableLanguages must be empty array []');
  assert.equal(result.visibleLanguages.length, 0, 'visibleLanguages must be empty array []');
  assert.deepEqual(result.resolvedTracks, {}, 'resolvedTracks must be empty object {}');
});

test('TEST B: Developer generated subtitles exist in manifest.json', () => {
  const generatedSubtitles = {
    en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nGenerated Subtitle',
    hi: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nGenerated Subtitle Hindi'
  };

  const result = resolveSubtitleVisibility({
    subtitlesConfig: undefined,
    generatedSubtitles,
    demoSubtitles: {},
    uploadedSubtitles: {}
  });

  assert.equal(result.enabled, true, 'isSubtitleEnabled must be TRUE when generated subtitles exist');
  assert.deepEqual(result.availableLanguages.sort(), ['en', 'hi'].sort());
  assert.deepEqual(result.visibleLanguages.sort(), ['en', 'hi'].sort());
  assert.equal(result.resolvedTracks.en, generatedSubtitles.en);
  assert.equal(result.sourceByLanguage.en, 'generated');
});

test('TEST C: Delete manifest (subtitles wiped)', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: undefined,
    generatedSubtitles: {}, // manifest deleted / empty
    demoSubtitles: {},
    uploadedSubtitles: {}
  });

  assert.equal(result.enabled, false, 'isSubtitleEnabled must turn FALSE when manifest is deleted');
  assert.equal(result.availableLanguages.length, 0, 'Subtitle menu disappears (0 available languages)');
});

test('TEST D: Developer manual subtitles prop subtitles={{ en: "/custom.vtt" }}', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: { en: '/custom.vtt', te: '/custom-te.vtt' },
    generatedSubtitles: {},
    demoSubtitles: {},
    uploadedSubtitles: {}
  });

  assert.equal(result.enabled, true, 'isSubtitleEnabled must be TRUE for developer manual subtitles');
  assert.deepEqual(result.availableLanguages.sort(), ['en', 'te'].sort());
  assert.equal(result.sourceByLanguage.en, 'developer');
  assert.equal(result.resolvedTracks.en, '/custom.vtt');
});

test('TEST E: User uploaded subtitles at runtime', () => {
  const uploadedSubtitles = {
    es: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nUploaded Spanish'
  };

  const result = resolveSubtitleVisibility({
    subtitlesConfig: undefined,
    generatedSubtitles: {},
    demoSubtitles: {},
    uploadedSubtitles
  });

  assert.equal(result.enabled, true, 'isSubtitleEnabled must be TRUE for user uploaded subtitles');
  assert.deepEqual(result.availableLanguages, ['es']);
  assert.equal(result.sourceByLanguage.es, 'uploaded');
});

test('TEST F: subtitles={false} completely disables subtitle UI and rendering', () => {
  const generatedSubtitles = { en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nGenerated' };

  const result = resolveSubtitleVisibility({
    subtitlesConfig: false,
    generatedSubtitles,
    demoSubtitles: {},
    uploadedSubtitles: {}
  });

  assert.equal(result.enabled, false, 'isSubtitleEnabled must be FALSE when subtitles={false}');
  assert.equal(result.availableLanguages.length, 0, 'availableLanguages must be empty');
  assert.equal(result.visibleLanguages.length, 0, 'visibleLanguages must be empty');
  assert.deepEqual(result.resolvedTracks, {}, 'resolvedTracks must be empty');
});

test('TEST G: Demo application explicitly passing demoSubtitles prop', () => {
  const demoSubtitles = {
    en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nDemo Application Subtitle'
  };

  const result = resolveSubtitleVisibility({
    subtitlesConfig: undefined,
    generatedSubtitles: {},
    demoSubtitles, // Passed ONLY inside examples/react-demo
    uploadedSubtitles: {}
  });

  assert.equal(result.enabled, true, 'isSubtitleEnabled is TRUE when demoSubtitles prop is explicitly passed');
  assert.equal(result.sourceByLanguage.en, 'demo');
  assert.equal(result.resolvedTracks.en, demoSubtitles.en);
});
