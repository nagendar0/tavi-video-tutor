import assert from 'node:assert';
import { resolveSubtitleVisibility, resolveSubtitleSources } from '../src/subtitles/resolver/subtitleResolver.js';
import { AITUTOR_LANGUAGES, getLanguageByCode } from '../src/subtitles/languages/registry.js';

console.log('🧪 Running AITutor Developer-Controlled Subtitle Visibility Test Suite (TEST A - TEST M)...\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

// Prepare 109 manifest tracks object
const manifest109 = {};
AITUTOR_LANGUAGES.forEach(lang => {
  manifest109[lang.code] = `WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nSubtitle in ${lang.name}`;
});

// ----------------------------------------------------
// TEST A: Default Mode (No subtitles prop)
// ----------------------------------------------------
runTest('TEST A: Default Mode (subtitles=undefined) displays all available manifest tracks (109)', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: undefined,
    generatedSubtitles: manifest109
  });

  assert.strictEqual(result.enabled, true);
  assert.strictEqual(result.mode, 'all');
  assert.strictEqual(result.availableLanguages.length, 109);
  assert.strictEqual(result.visibleLanguages.length, 109);
});

// ----------------------------------------------------
// TEST B: Explicit ALL Mode
// ----------------------------------------------------
runTest('TEST B: Explicit ALL Mode (subtitles="all") behaves identically to default mode', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: 'all',
    generatedSubtitles: manifest109
  });

  assert.strictEqual(result.enabled, true);
  assert.strictEqual(result.mode, 'all');
  assert.strictEqual(result.visibleLanguages.length, 109);
});

// ----------------------------------------------------
// TEST C: Developer Language Filter
// ----------------------------------------------------
runTest('TEST C: Developer Language Filter (subtitles=["en", "hi", "te"]) restricts UI to 3 languages', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'hi', 'te'],
    generatedSubtitles: manifest109
  });

  assert.strictEqual(result.enabled, true);
  assert.strictEqual(result.mode, 'filter');
  assert.deepStrictEqual(result.visibleLanguages, ['en', 'hi', 'te']);
  assert.strictEqual(Object.keys(result.resolvedTracks).length, 3);
});

// ----------------------------------------------------
// TEST D: Disable Subtitles
// ----------------------------------------------------
runTest('TEST D: Disabled Mode (subtitles=false) disables UI without destroying tracks', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: false,
    generatedSubtitles: manifest109
  });

  assert.strictEqual(result.enabled, false);
  assert.strictEqual(result.mode, 'disabled');
  assert.strictEqual(result.visibleLanguages.length, 0);
  assert.strictEqual(Object.keys(result.resolvedTracks).length, 0);
  // Original manifest object untouched
  assert.strictEqual(Object.keys(manifest109).length, 109);
});

// ----------------------------------------------------
// TEST E: Developer Custom VTT
// ----------------------------------------------------
runTest('TEST E: Developer Custom VTT overrides generated track per language', () => {
  const generatedSubtitles = {
    en: 'Generated EN',
    hi: 'Generated HI',
    te: 'Generated TE'
  };
  const developerSubtitles = {
    en: '/custom/en.vtt'
  };

  const result = resolveSubtitleVisibility({
    subtitlesConfig: developerSubtitles,
    generatedSubtitles
  });

  assert.strictEqual(result.resolvedTracks.en, '/custom/en.vtt');
  assert.strictEqual(result.sourceByLanguage.en, 'developer');
  assert.strictEqual(result.resolvedTracks.hi, 'Generated HI');
  assert.strictEqual(result.sourceByLanguage.hi, 'generated');
  assert.strictEqual(result.resolvedTracks.te, 'Generated TE');
  assert.strictEqual(result.sourceByLanguage.te, 'generated');
});

// ----------------------------------------------------
// TEST F: Search Bar Visibility (7+ languages)
// ----------------------------------------------------
runTest('TEST F: 7 available languages triggers showSearch = true', () => {
  const gen7 = { en: '1', hi: '2', te: '3', es: '4', fr: '5', de: '6', ja: '7' };
  const result = resolveSubtitleVisibility({
    subtitlesConfig: 'all',
    generatedSubtitles: gen7
  });

  const showSearch = result.visibleLanguages.length > 6;
  assert.strictEqual(showSearch, true);
});

// ----------------------------------------------------
// TEST G: Search Bar Hidden (<=6 languages)
// ----------------------------------------------------
runTest('TEST G: 6 available languages triggers showSearch = false', () => {
  const gen6 = { en: '1', hi: '2', te: '3', es: '4', fr: '5', de: '6' };
  const result = resolveSubtitleVisibility({
    subtitlesConfig: 'all',
    generatedSubtitles: gen6
  });

  const showSearch = result.visibleLanguages.length > 6;
  assert.strictEqual(showSearch, false);
});

// ----------------------------------------------------
// TEST H: Search Matching (English, Native, ISO Code)
// ----------------------------------------------------
runTest('TEST H: Search matches English name, Native name, and ISO code case-insensitively', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: 'all',
    generatedSubtitles: manifest109
  });

  const langs = result.visibleLanguages.map(code => {
    const reg = getLanguageByCode(code);
    return { code, name: reg.name, nativeName: reg.nativeName };
  });

  const filterSearch = (query) => {
    const q = query.trim().toLowerCase();
    return langs.filter(l =>
      l.name.toLowerCase().includes(q) ||
      (l.nativeName && l.nativeName.toLowerCase().includes(q)) ||
      l.code.toLowerCase().includes(q)
    );
  };

  assert.ok(filterSearch('tel').some(l => l.code === 'te'));
  assert.ok(filterSearch('Telugu').some(l => l.code === 'te'));
  assert.ok(filterSearch('తెలుగు').some(l => l.code === 'te'));
  assert.ok(filterSearch('te').some(l => l.code === 'te'));

  assert.ok(filterSearch('hin').some(l => l.code === 'hi'));
  assert.ok(filterSearch('Hindi').some(l => l.code === 'hi'));
  assert.ok(filterSearch('हिन्दी').some(l => l.code === 'hi'));
  assert.ok(filterSearch('hi').some(l => l.code === 'hi'));
});

// ----------------------------------------------------
// TEST I: Per-Video Independent Track Resolution
// ----------------------------------------------------
runTest('TEST I: Switching Video A (109 tracks) -> Video B (2 tracks) -> Video A isolates tracks', () => {
  const videoA_manifest = manifest109;
  const videoB_manifest = { en: 'VTT_B_EN', hi: 'VTT_B_HI' };

  const resA = resolveSubtitleVisibility({ subtitlesConfig: 'all', generatedSubtitles: videoA_manifest });
  assert.strictEqual(resA.visibleLanguages.length, 109);

  const resB = resolveSubtitleVisibility({ subtitlesConfig: 'all', generatedSubtitles: videoB_manifest });
  assert.strictEqual(resB.visibleLanguages.length, 2);
  assert.deepStrictEqual(resB.visibleLanguages.sort(), ['en', 'hi']);

  const resA2 = resolveSubtitleVisibility({ subtitlesConfig: 'all', generatedSubtitles: videoA_manifest });
  assert.strictEqual(resA2.visibleLanguages.length, 109);
});

// ----------------------------------------------------
// TEST J: Rapid Language Switching (State & Track Stability)
// ----------------------------------------------------
runTest('TEST J: Rapid language switching returns correct VTT per language without state corruption', () => {
  const sampleTracks = {
    en: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello',
    te: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nనమస్కారం',
    hi: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nनमस्ते',
    ja: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nこんにちは',
    ar: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nمرحبا'
  };

  const sequence = ['en', 'te', 'hi', 'ja', 'ar', 'en'];
  const res = resolveSubtitleVisibility({ subtitlesConfig: 'all', generatedSubtitles: sampleTracks });

  sequence.forEach(lang => {
    assert.strictEqual(res.resolvedTracks[lang], sampleTracks[lang]);
  });
});

// ----------------------------------------------------
// TEST K: Full 4-Tier Source Priority
// ----------------------------------------------------
runTest('TEST K: Priority sequence (Uploaded > Developer > Generated > Demo) strictly enforced', () => {
  const demo = { en: 'demo', hi: 'demo', te: 'demo', es: 'demo' };
  const generated = { hi: 'generated', te: 'generated', es: 'generated' };
  const developer = { te: 'developer', es: 'developer' };
  const uploaded = { es: 'uploaded' };

  const res = resolveSubtitleVisibility({
    subtitlesConfig: developer,
    demoSubtitles: demo,
    generatedSubtitles: generated,
    uploadedSubtitles: uploaded
  });

  assert.strictEqual(res.sourceByLanguage.en, 'demo');
  assert.strictEqual(res.sourceByLanguage.hi, 'generated');
  assert.strictEqual(res.sourceByLanguage.te, 'developer');
  assert.strictEqual(res.sourceByLanguage.es, 'uploaded');
});

// ----------------------------------------------------
// TEST L: Developer Language Filter + Priority Combination
// ----------------------------------------------------
runTest('TEST L: Developer filter ["en", "te"] + custom developer en.vtt resolves expected UI and sources', () => {
  const generated = { en: 'gen-en', hi: 'gen-hi', te: 'gen-te', fr: 'gen-fr' };
  const developerSubtitles = { en: '/custom/en.vtt' };

  // Combine custom tracks with visibility filter
  const res = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'te'],
    generatedSubtitles: generated,
    uploadedSubtitles: {},
    demoSubtitles: {}
  });

  // Also apply custom developer track priority
  const { resolvedTracks, sourceByLanguage } = resolveSubtitleSources({
    generatedSubtitles: res.resolvedTracks,
    developerSubtitles
  });

  assert.deepStrictEqual(Object.keys(resolvedTracks).sort(), ['en', 'te']);
  assert.strictEqual(resolvedTracks.en, '/custom/en.vtt');
  assert.strictEqual(sourceByLanguage.en, 'developer');
  assert.strictEqual(resolvedTracks.te, 'gen-te');
  assert.strictEqual(sourceByLanguage.te, 'generated');
});

// ----------------------------------------------------
// TEST M: Missing Track Safety
// ----------------------------------------------------
runTest('TEST M: Missing requested track ("xx") is safely omitted without fake subtitle or English fallback', () => {
  const available = { en: 'EN VTT', hi: 'HI VTT' };
  const res = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'hi', 'xx'],
    generatedSubtitles: available
  });

  assert.deepStrictEqual(res.visibleLanguages, ['en', 'hi']);
  assert.strictEqual(res.resolvedTracks.xx, undefined);
});

console.log('\n============================================================');
console.log(`TEST SUMMARY: Passed: ${passedTests} | Failed: ${failedTests}`);
console.log('============================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
