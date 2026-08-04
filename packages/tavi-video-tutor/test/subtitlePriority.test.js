import assert from 'node:assert';
import { resolveSubtitleSources } from '../src/subtitles/resolver/subtitleResolver.js';

console.log('🧪 Running AITutor Subtitle Source Priority Test Suite...\n');

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

// ----------------------------------------------------
// PHASE 12 — REGRESSION TEST (Old bug reproduction)
// ----------------------------------------------------
runTest('Phase 12: Regression Test — Generated subtitle overrides Demo subtitle', () => {
  const demoSubtitles = {
    en: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nWelcome to the custom AI Video Tutor workspace.'
  };
  const generatedSubtitles = {
    en: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nThe actual React lecture begins here.'
  };

  const { resolvedTracks, sourceByLanguage } = resolveSubtitleSources({
    demoSubtitles,
    generatedSubtitles
  });

  assert.strictEqual(resolvedTracks.en, 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nThe actual React lecture begins here.');
  assert.notStrictEqual(resolvedTracks.en, 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nWelcome to the custom AI Video Tutor workspace.');
  assert.strictEqual(sourceByLanguage.en, 'generated');
});

// ----------------------------------------------------
// PHASE 13 — MANUAL PRIORITY TEST
// ----------------------------------------------------
runTest('Phase 13: Manual Priority Test — Developer subtitle overrides Generated subtitle', () => {
  const generatedSubtitles = { en: 'Generated subtitle' };
  const developerSubtitles = { en: 'Developer corrected subtitle' };

  const { resolvedTracks, sourceByLanguage } = resolveSubtitleSources({
    generatedSubtitles,
    developerSubtitles
  });

  assert.strictEqual(resolvedTracks.en, 'Developer corrected subtitle');
  assert.strictEqual(sourceByLanguage.en, 'developer');
});

// ----------------------------------------------------
// PHASE 14 — UPLOAD PRIORITY TEST & DYNAMIC FALLBACK
// ----------------------------------------------------
runTest('Phase 14: Upload Priority Test — User uploaded subtitle overrides Developer & Generated', () => {
  const generatedSubtitles = { en: 'Generated subtitle' };
  const developerSubtitles = { en: 'Developer subtitle' };
  const uploadedSubtitles = { en: 'User uploaded subtitle' };

  // Step 1: All three present -> Uploaded wins
  const step1 = resolveSubtitleSources({
    generatedSubtitles,
    developerSubtitles,
    uploadedSubtitles
  });
  assert.strictEqual(step1.resolvedTracks.en, 'User uploaded subtitle');
  assert.strictEqual(step1.sourceByLanguage.en, 'uploaded');

  // Step 2: Uploaded removed -> Developer wins
  const step2 = resolveSubtitleSources({
    generatedSubtitles,
    developerSubtitles,
    uploadedSubtitles: {}
  });
  assert.strictEqual(step2.resolvedTracks.en, 'Developer subtitle');
  assert.strictEqual(step2.sourceByLanguage.en, 'developer');

  // Step 3: Developer removed -> Generated wins
  const step3 = resolveSubtitleSources({
    generatedSubtitles,
    developerSubtitles: {},
    uploadedSubtitles: {}
  });
  assert.strictEqual(step3.resolvedTracks.en, 'Generated subtitle');
  assert.strictEqual(step3.sourceByLanguage.en, 'generated');
});

// ----------------------------------------------------
// PHASE 15 — PARTIAL OVERRIDE TEST
// ----------------------------------------------------
runTest('Phase 15: Partial Override Test — Developer overrides English without wiping Telugu or Hindi', () => {
  const generatedSubtitles = {
    en: 'generated English',
    te: 'generated Telugu',
    hi: 'generated Hindi'
  };
  const developerSubtitles = {
    en: 'manual English'
  };

  const { resolvedTracks, sourceByLanguage } = resolveSubtitleSources({
    generatedSubtitles,
    developerSubtitles
  });

  assert.strictEqual(resolvedTracks.en, 'manual English');
  assert.strictEqual(resolvedTracks.te, 'generated Telugu');
  assert.strictEqual(resolvedTracks.hi, 'generated Hindi');

  assert.strictEqual(sourceByLanguage.en, 'developer');
  assert.strictEqual(sourceByLanguage.te, 'generated');
  assert.strictEqual(sourceByLanguage.hi, 'generated');
});

// ----------------------------------------------------
// PHASE 16 — COMPLETE SOURCE RESOLUTION TEST MATRIX
// ----------------------------------------------------
runTest('Phase 16: Complete Source Resolution Test Matrix', () => {
  const demo = { en: 'Demo text' };
  const gen = { en: 'Generated text' };
  const dev = { en: 'Developer text' };
  const up = { en: 'Uploaded text' };

  // 1. Demo only
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo }).resolvedTracks.en, 'Demo text');
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo }).sourceByLanguage.en, 'demo');

  // 2. Generated only
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen }).resolvedTracks.en, 'Generated text');
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen }).sourceByLanguage.en, 'generated');

  // 3. Demo + Generated -> Generated
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo, generatedSubtitles: gen }).resolvedTracks.en, 'Generated text');
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo, generatedSubtitles: gen }).sourceByLanguage.en, 'generated');

  // 4. Generated + Developer -> Developer
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen, developerSubtitles: dev }).resolvedTracks.en, 'Developer text');
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen, developerSubtitles: dev }).sourceByLanguage.en, 'developer');

  // 5. Generated + Uploaded -> Uploaded
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen, uploadedSubtitles: up }).resolvedTracks.en, 'Uploaded text');
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen, uploadedSubtitles: up }).sourceByLanguage.en, 'uploaded');

  // 6. Generated + Developer + Uploaded -> Uploaded
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen, developerSubtitles: dev, uploadedSubtitles: up }).resolvedTracks.en, 'Uploaded text');
  assert.strictEqual(resolveSubtitleSources({ generatedSubtitles: gen, developerSubtitles: dev, uploadedSubtitles: up }).sourceByLanguage.en, 'uploaded');

  // 7. Demo + Generated + Developer -> Developer
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo, generatedSubtitles: gen, developerSubtitles: dev }).resolvedTracks.en, 'Developer text');
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo, generatedSubtitles: gen, developerSubtitles: dev }).sourceByLanguage.en, 'developer');

  // 8. Demo + Generated + Developer + Uploaded -> Uploaded
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo, generatedSubtitles: gen, developerSubtitles: dev, uploadedSubtitles: up }).resolvedTracks.en, 'Uploaded text');
  assert.strictEqual(resolveSubtitleSources({ demoSubtitles: demo, generatedSubtitles: gen, developerSubtitles: dev, uploadedSubtitles: up }).sourceByLanguage.en, 'uploaded');

  // 9. No source -> empty
  assert.deepStrictEqual(resolveSubtitleSources({}).resolvedTracks, {});
  assert.deepStrictEqual(resolveSubtitleSources({}).sourceByLanguage, {});
});

console.log(`\nResults: ${passedTests} Passed, ${failedTests} Failed.`);
if (failedTests > 0) {
  process.exit(1);
}
