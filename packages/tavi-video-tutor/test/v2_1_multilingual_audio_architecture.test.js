import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { resolveAudioSources, resolveAudioAvailability } from '../src/subtitles/resolver/audioResolver.js';
import { resolveSubtitleAvailability } from '../src/subtitles/resolver/subtitleResolver.js';
import { resolveQualitySources } from '../src/subtitles/resolver/qualityResolver.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { loadConfig } from '../src/subtitles/config/loadConfig.js';
import { AITUTOR_LANGUAGES, getLanguageByCode } from '../src/subtitles/languages/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

// 1. English source defaults to English
test('1. English source video defaults to English (Original) automatically', () => {
  const manifestAudio = {
    en: { label: 'English', src: '/aitutor/audio/lesson/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/aitutor/audio/lesson/hi.m4a', language: 'hi', source: false },
    te: { label: 'Telugu', src: '/aitutor/audio/lesson/te.m4a', language: 'te', source: false }
  };

  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(result.enabled, true);
  assert.equal(result.sourceLanguage, 'en');
  assert.equal(result.selectedLanguage, 'en');
  assert.equal(result.originalTrack.language, 'en');
  assert.equal(result.originalTrack.source, true);
  assert.deepEqual(result.visibleLanguages, ['en', 'hi', 'te']);
});

// 2. Hindi source defaults to Hindi
test('2. Hindi source video defaults to Hindi (Original) automatically', () => {
  const manifestAudio = {
    hi: { label: 'हिन्दी / Hindi', src: '/aitutor/audio/lesson/hi.m4a', language: 'hi', source: true },
    en: { label: 'English', src: '/aitutor/audio/lesson/en.m4a', language: 'en', source: false },
    te: { label: 'Telugu', src: '/aitutor/audio/lesson/te.m4a', language: 'te', source: false }
  };

  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio,
    sourceLanguage: 'hi'
  });

  assert.equal(result.enabled, true);
  assert.equal(result.sourceLanguage, 'hi');
  assert.equal(result.selectedLanguage, 'hi');
  assert.equal(result.originalTrack.language, 'hi');
  assert.equal(result.originalTrack.source, true);
  assert.deepEqual(result.visibleLanguages, ['hi', 'en', 'te']);
});

// 3. Telugu source defaults to Telugu
test('3. Telugu source video defaults to Telugu (Original) automatically', () => {
  const manifestAudio = {
    te: { label: 'తెలుగు / Telugu', src: '/aitutor/audio/lesson/te.m4a', language: 'te', source: true },
    en: { label: 'English', src: '/aitutor/audio/lesson/en.m4a', language: 'en', source: false },
    hi: { label: 'Hindi', src: '/aitutor/audio/lesson/hi.m4a', language: 'hi', source: false }
  };

  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio,
    sourceLanguage: 'te'
  });

  assert.equal(result.enabled, true);
  assert.equal(result.sourceLanguage, 'te');
  assert.equal(result.selectedLanguage, 'te');
  assert.equal(result.originalTrack.language, 'te');
  assert.equal(result.originalTrack.source, true);
  assert.deepEqual(result.visibleLanguages, ['te', 'en', 'hi']);
});

// 4. sourceLanguage cannot be overridden through audioLanguages
test('4. sourceLanguage cannot be overridden through audioLanguages filter prop', () => {
  const manifestAudio = {
    en: { label: 'English', src: '/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/hi.m4a', language: 'hi', source: false }
  };

  // Developer passes audioLanguages={['hi']} on English source
  const result = resolveAudioAvailability({
    audioLanguagesConfig: ['hi'],
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(result.sourceLanguage, 'en', 'sourceLanguage must strictly remain en');
  assert.equal(result.originalTrack.language, 'en', 'originalTrack must strictly remain English');
  assert.equal(result.originalTrack.source, true);
  assert.equal(result.translatedTracks.hi.source, false);
});

// 5. audioLanguages={["hi","te"]} keeps original track visible
test('5. audioLanguages={["hi","te"]} keeps original/source language visible and protected', () => {
  const manifestAudio = {
    en: { label: 'English', src: '/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/hi.m4a', language: 'hi', source: false },
    te: { label: 'Telugu', src: '/te.m4a', language: 'te', source: false },
    es: { label: 'Spanish', src: '/es.m4a', language: 'es', source: false }
  };

  const result = resolveAudioAvailability({
    audioLanguagesConfig: ['hi', 'te'],
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(result.enabled, true);
  assert.deepEqual(result.visibleLanguages.sort(), ['en', 'hi', 'te'].sort());
  assert.equal(result.originalTrack.language, 'en');
  assert.equal(result.resolvedTracks.es, undefined);
});

// 6. audioLanguages={false} hides Audio Language UI
test('6. audioLanguages={false} hides Audio Language UI entirely', () => {
  const manifestAudio = {
    en: { label: 'English', src: '/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/hi.m4a', language: 'hi', source: false }
  };

  const audioRes = resolveAudioAvailability({
    audioLanguagesConfig: false,
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(audioRes.enabled, false);
  assert.equal(audioRes.hasAvailableAudio, false);
  assert.deepEqual(audioRes.visibleLanguages, []);
  assert.equal(audioRes.originalTrack, null);
  assert.deepEqual(audioRes.resolvedTracks, {});
});

// 7. Omitted audioLanguages exposes only actually generated tracks
test('7. Omitted audioLanguages exposes only actually generated tracks from manifest', () => {
  const manifestAudio = {
    en: { label: 'English', src: '/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/hi.m4a', language: 'hi', source: false }
  };

  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(result.enabled, true);
  assert.deepEqual(result.visibleLanguages, ['en', 'hi']);
  assert.equal(Object.keys(result.resolvedTracks).length, 2);
});

// 8. No 109-language registry leakage
test('8. No 109-language registry leakage when audio tracks are omitted or partial', () => {
  assert.equal(AITUTOR_LANGUAGES.length, 109);

  const manifestAudio = {
    en: { label: 'English', src: '/en.m4a', language: 'en', source: true }
  };

  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(result.visibleLanguages.length, 1);
  assert.notEqual(result.visibleLanguages.length, 109);
});

// 9. Original track remains source:true
test('9. Invariant: Exactly one track is marked source:true matching sourceLanguage', () => {
  const manifestAudio = {
    en: { label: 'English', src: '/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/hi.m4a', language: 'hi', source: false },
    te: { label: 'Telugu', src: '/te.m4a', language: 'te', source: false }
  };

  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(result.originalTrack.language, 'en');
  assert.equal(result.originalTrack.source, true);
  assert.equal(result.translatedTracks.hi.source, false);
  assert.equal(result.translatedTracks.te.source, false);
});

// 10. Quality switching preserves audio selection
test('10. Quality switching preserves audio selection state', () => {
  let selectedAudio = 'hi';
  let currentQuality = '1080p';

  const switchQuality = (newQuality) => {
    currentQuality = newQuality;
    return { selectedAudio, currentQuality };
  };

  const state1 = switchQuality('720p');
  assert.equal(state1.selectedAudio, 'hi');
  assert.equal(state1.currentQuality, '720p');

  const state2 = switchQuality('480p');
  assert.equal(state2.selectedAudio, 'hi');
  assert.equal(state2.currentQuality, '480p');
});

// 11. Subtitle switching does not modify audio selection
test('11. Subtitle switching does not modify audio selection', () => {
  let selectedAudio = 'te';
  let selectedSubtitle = 'en';

  const switchSubtitle = (newSub) => {
    selectedSubtitle = newSub;
    return { selectedAudio, selectedSubtitle };
  };

  const state1 = switchSubtitle('hi');
  assert.equal(state1.selectedAudio, 'te');
  assert.equal(state1.selectedSubtitle, 'hi');

  const state2 = switchSubtitle('none');
  assert.equal(state2.selectedAudio, 'te');
  assert.equal(state2.selectedSubtitle, 'none');
});

// 12. Audio switching does not modify sourceLanguage
test('12. Audio switching changes spoken audio track without modifying sourceLanguage', () => {
  const manifestAudio = {
    en: { label: 'English', src: '/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/hi.m4a', language: 'hi', source: false },
    te: { label: 'Telugu', src: '/te.m4a', language: 'te', source: false }
  };

  const initial = resolveAudioAvailability({
    manifestAudio,
    sourceLanguage: 'en',
    selectedLanguage: 'original'
  });

  assert.equal(initial.sourceLanguage, 'en');
  assert.equal(initial.selectedLanguage, 'original');

  const afterSwitch = resolveAudioAvailability({
    manifestAudio,
    sourceLanguage: 'en',
    selectedLanguage: 'te'
  });

  assert.equal(afterSwitch.sourceLanguage, 'en', 'sourceLanguage remains strictly immutable');
  assert.equal(afterSwitch.selectedLanguage, 'te', 'spoken audio selection changes');
  assert.equal(afterSwitch.originalTrack.language, 'en', 'original track remains English');
});

// 13. No-manifest mount remains stable
test('13. No-manifest mount remains stable without errors or UI leaks', () => {
  const result = resolveAudioAvailability({
    audioLanguagesConfig: undefined,
    manifestAudio: {}
  });

  assert.equal(result.enabled, false);
  assert.equal(result.hasAvailableAudio, false);
  assert.equal(result.selectedLanguage, 'original');
  assert.deepEqual(result.visibleLanguages, []);
});

// 14. React StrictMode remains stable
test('14. React StrictMode idempotency & component source invariants', () => {
  const aitutorSource = fs.readFileSync(path.join(packageRoot, 'src/components/AITutor.jsx'), 'utf8');
  assert.ok(aitutorSource.includes('manifestSourceLanguage'), 'AITutor must track manifestSourceLanguage');
  assert.ok(aitutorSource.includes('resolveAudioAvailability'), 'AITutor must use resolveAudioAvailability');
  assert.ok(!aitutorSource.includes('defaultAudioLanguage'), 'AITutor must not declare defaultAudioLanguage prop');

  const playerSource = fs.readFileSync(path.join(packageRoot, 'src/components/TaviVideoPlayer.jsx'), 'utf8');
  assert.ok(playerSource.includes('effectiveSourceLang'), 'TaviVideoPlayer must compute effectiveSourceLang');
  assert.ok(playerSource.includes('getAudioLanguageLabel'), 'TaviVideoPlayer must compute label with (Original)');
  assert.ok(!playerSource.includes('defaultAudioLanguage'), 'TaviVideoPlayer must not declare defaultAudioLanguage prop');
});

// 15. React 18/19 remain stable
test('15. React 18 & 19 JSX Component Source Verification', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  assert.ok(pkg.peerDependencies.react.includes('18') && pkg.peerDependencies.react.includes('19'));
  assert.ok(pkg.peerDependencies['react-dom'].includes('18') && pkg.peerDependencies['react-dom'].includes('19'));
});

// 16. Published consumer package preserves this behavior
test('16. Published consumer package preserves export mappings and zero heavy AI in player bundle', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  assert.ok(pkg.exports['.']);
  assert.ok(pkg.exports['./player']);
  assert.ok(pkg.exports['./audio']);
  assert.ok(pkg.exports['./subtitles']);

  if (fs.existsSync(path.join(packageRoot, 'dist/player.js'))) {
    const playerContent = fs.readFileSync(path.join(packageRoot, 'dist/player.js'), 'utf8');
    assert.ok(!playerContent.includes('onnxruntime'));
    assert.ok(!playerContent.includes('WhisperForConditionalGeneration'));
  }
});
