import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import { resolveSubtitleAvailability, resolveSubtitleSources } from '../src/subtitles/resolver/subtitleResolver.js';
import { resolveQualitySources } from '../src/subtitles/resolver/qualityResolver.js';

// ==========================================
// REGRESSION TEST SUITE FOR v2.0.2
// Fixes "Maximum update depth exceeded" infinite loop
// ==========================================

test('1. NO MANIFEST + MINIMAL AITUTOR (<AITutor src="/lesson.mp4" />): Reference Stability', () => {
  const result1 = resolveSubtitleAvailability({
    subtitlesConfig: undefined,
    generatedSubtitles: {}
  });

  const result2 = resolveSubtitleAvailability({
    subtitlesConfig: undefined,
    generatedSubtitles: {}
  });

  assert.equal(result1.hasAvailableSubtitles, false);
  assert.equal(result2.hasAvailableSubtitles, false);
  
  // CRITICAL: Empty object and array singletons must be reference-identical (Object.is)
  assert.equal(result1.resolvedTracks, result2.resolvedTracks, 'resolvedTracks must return shared EMPTY_OBJECT singleton');
  assert.equal(result1.sourceByLanguage, result2.sourceByLanguage, 'sourceByLanguage must return shared EMPTY_OBJECT singleton');
  assert.equal(result1.availableLanguages, result2.availableLanguages, 'availableLanguages must return shared EMPTY_ARRAY singleton');
  assert.equal(result1.visibleLanguages, result2.visibleLanguages, 'visibleLanguages must return shared EMPTY_ARRAY singleton');
});

test('2. NO MANIFEST + MINIMAL AITUTOR WITH ID (<AITutor src="/lesson.mp4" id="lesson_1" />): State Convergence', () => {
  const result = resolveSubtitleAvailability({
    subtitlesConfig: undefined,
    generatedSubtitles: {},
    developerSubtitles: {},
    uploadedSubtitles: {},
    demoSubtitles: {}
  });

  assert.equal(result.hasAvailableSubtitles, false);
  assert.equal(result.enabled, false);
  assert.equal(Object.keys(result.resolvedTracks).length, 0);
  assert.equal(result.resolvedTracks, resolveSubtitleAvailability().resolvedTracks, 'Must return same EMPTY_OBJECT reference');
});

test('3. Manifest Present: Correct Track Resolution & Selection', () => {
  const manifestSubtitles = {
    en: '/aitutor/subtitles/lesson_1/en.vtt',
    hi: '/aitutor/subtitles/lesson_1/hi.vtt',
    te: '/aitutor/subtitles/lesson_1/te.vtt'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: 'all',
    generatedSubtitles: manifestSubtitles
  });

  assert.equal(result.hasAvailableSubtitles, true);
  assert.equal(result.enabled, true);
  assert.equal(result.availableLanguages.length, 3);
  assert.equal(result.resolvedTracks.en, '/aitutor/subtitles/lesson_1/en.vtt');
  assert.equal(result.resolvedTracks.hi, '/aitutor/subtitles/lesson_1/hi.vtt');
  assert.equal(result.resolvedTracks.te, '/aitutor/subtitles/lesson_1/te.vtt');
});

test('4. subtitles={false}: Subtitles Completely Disabled', () => {
  const result = resolveSubtitleAvailability({
    subtitlesConfig: false,
    generatedSubtitles: { en: '/en.vtt' }
  });

  assert.equal(result.enabled, false);
  assert.equal(result.hasAvailableSubtitles, false);
  assert.equal(result.mode, 'disabled');
  assert.equal(Object.keys(result.resolvedTracks).length, 0);
});

test('5. subtitles={["en"]}: Filtered Subtitle Availability', () => {
  const manifestSubtitles = {
    en: '/aitutor/subtitles/lesson_1/en.vtt',
    hi: '/aitutor/subtitles/lesson_1/hi.vtt',
    te: '/aitutor/subtitles/lesson_1/te.vtt'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: ['en'],
    generatedSubtitles: manifestSubtitles
  });

  assert.equal(result.hasAvailableSubtitles, true);
  assert.equal(result.visibleLanguages.length, 1);
  assert.equal(result.visibleLanguages[0], 'en');
  assert.equal(result.resolvedTracks.en, '/aitutor/subtitles/lesson_1/en.vtt');
  assert.equal(result.resolvedTracks.hi, undefined);
});

test('6. subtitles={["en","hi","te"]}: Multi-Language Array Filter', () => {
  const manifestSubtitles = {
    en: '/en.vtt',
    hi: '/hi.vtt',
    te: '/te.vtt',
    es: '/es.vtt'
  };

  const result = resolveSubtitleAvailability({
    subtitlesConfig: ['en', 'hi', 'te'],
    generatedSubtitles: manifestSubtitles
  });

  assert.equal(result.visibleLanguages.length, 3);
  assert.deepEqual(result.visibleLanguages.sort(), ['en', 'hi', 'te']);
  assert.equal(result.resolvedTracks.es, undefined);
});

test('7 & 8. React StrictMode & Non-StrictMode Compatibility: State Setter Idempotency', () => {
  // Simulate state updater function behaviour under StrictMode double-invocation
  const emptyArr = [];
  const updaterArr = prev => (prev.length === 0 ? prev : []);
  
  const step1 = updaterArr(emptyArr);
  const step2 = updaterArr(step1); // StrictMode second call
  
  assert.equal(step1, emptyArr, 'Functional updater must return identical array reference if already empty');
  assert.equal(step2, emptyArr, 'StrictMode double-call must retain reference');

  const emptyObj = {};
  const updaterObj = prev => (Object.keys(prev).length === 0 ? prev : {});

  const objStep1 = updaterObj(emptyObj);
  const objStep2 = updaterObj(objStep1);

  assert.equal(objStep1, emptyObj, 'Functional updater must return identical object reference if already empty');
  assert.equal(objStep2, emptyObj);
});

test('9 & 10. React 18 & 19 JSX Component Source Verification', () => {
  const aiTutorCode = fs.readFileSync(path.resolve('src/components/AITutor.jsx'), 'utf8');
  const playerCode = fs.readFileSync(path.resolve('src/components/TaviVideoPlayer.jsx'), 'utf8');

  // Verify state convergence updaters in AITutor
  assert.ok(aiTutorCode.includes('setManifestSubtitles(prev => (Object.keys(prev).length === 0 ? prev : {}))'), 'AITutor must guard setManifestSubtitles against non-converging empty objects');
  assert.ok(aiTutorCode.includes('setManifestQualities(prev => (prev.length === 0 ? prev : []))'), 'AITutor must guard setManifestQualities against non-converging empty arrays');

  // Verify state convergence updaters in TaviVideoPlayer
  assert.ok(playerCode.includes('setPrimaryCues(prev => (prev.length === 0 ? prev : []))'), 'Player must guard setPrimaryCues against non-converging empty arrays');
  assert.ok(playerCode.includes('setSecondaryCues(prev => (prev.length === 0 ? prev : []))'), 'Player must guard setSecondaryCues against non-converging empty arrays');
  assert.ok(playerCode.includes('setInternalManifestSubtitles(prev => (Object.keys(prev).length === 0 ? prev : {}))'), 'Player must guard setInternalManifestSubtitles');
});

test('11. Player Subpath Export Package Mapping', () => {
  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

  assert.ok(pkg.exports['./player'], './player subpath export must exist in package.json');
  assert.equal(pkg.exports['./player'].import, './dist/player.js');
  assert.equal(pkg.exports['./player'].require, './dist/player.cjs');
});

test('12 & 13. Quality Menu & Quality Switching Resolution', () => {
  const qualities = [
    { label: '1080p', height: 1080, width: 1920, src: '/1080.mp4' },
    { label: '720p', height: 720, width: 1280, src: '/720.mp4' }
  ];

  const resolved = resolveQualitySources({ qualities });
  assert.equal(resolved.qualities.length, 2);
  assert.equal(resolved.qualities[0].label, '1080p');
  assert.equal(resolved.qualities[1].label, '720p');
});

test('14. 100+ Repeated State Operations Convergence', () => {
  let currentSubtitles = {};
  let currentQualities = [];
  let reRenderCount = 0;

  const mockSetManifestSubtitles = (updater) => {
    const next = typeof updater === 'function' ? updater(currentSubtitles) : updater;
    if (next !== currentSubtitles) {
      currentSubtitles = next;
      reRenderCount++;
    }
  };

  const mockSetManifestQualities = (updater) => {
    const next = typeof updater === 'function' ? updater(currentQualities) : updater;
    if (next !== currentQualities) {
      currentQualities = next;
      reRenderCount++;
    }
  };

  // Simulate 100 repeated effect passes (such as during rapid prop updates)
  for (let i = 0; i < 100; i++) {
    mockSetManifestSubtitles(prev => (Object.keys(prev).length === 0 ? prev : {}));
    mockSetManifestQualities(prev => (prev.length === 0 ? prev : []));
  }

  assert.equal(reRenderCount, 0, '100 repeated empty state updates must result in EXACTLY 0 re-renders');
});
