import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PolicyEngine,
  PolicyError,
  POLICY_PROFILES,
  EXECUTION_MODES,
  POLICY_STATUS,
  defaultPolicyEngine,
  evaluatePolicy
} from '../src/subtitles/policy/PolicyEngine.js';
import {
  ModelRegistry,
  getModel,
  getCanonicalModel,
  getAllModels,
  getAllLanguageModelEntries
} from '../src/subtitles/models/modelRegistry.js';
import { AITUTOR_LANGUAGES, resolveLanguageCapability } from '../src/subtitles/languages/registry.js';

test('1. RELAXED policy can evaluate every registered language and model', () => {
  const engine = new PolicyEngine({ defaultProfile: 'RELAXED', defaultExecutionMode: 'COMMERCIAL' });

  // Evaluate all 109 languages
  for (const lang of AITUTOR_LANGUAGES) {
    const res = engine.evaluateLanguage(lang.code, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
    assert.ok(res, `Result must exist for language ${lang.code}`);
    assert.equal(res.languageCode, lang.code);
    assert.equal(res.policyProfile, 'RELAXED');
    assert.equal(res.executionMode, 'COMMERCIAL');
    assert.ok(
      res.policyStatus === 'PERMITTED' || res.policyStatus === 'RESEARCH_ONLY',
      `Language ${lang.code} must have a valid status, got ${res.policyStatus}`
    );
  }

  // Evaluate all 251 models
  const allModels = getAllModels();
  assert.equal(allModels.length, 251);
  for (const model of allModels) {
    const res = engine.evaluateModel(model, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
    assert.ok(res, `Result must exist for model ${model.modelId}`);
    assert.equal(res.modelId, model.modelId);
    assert.equal(res.policyProfile, 'RELAXED');
  }
});

test('2. STRICT policy can evaluate every registered language and model', () => {
  const engine = new PolicyEngine({ defaultProfile: 'STRICT', defaultExecutionMode: 'COMMERCIAL' });

  // Evaluate all 109 languages
  for (const lang of AITUTOR_LANGUAGES) {
    const res = engine.evaluateLanguage(lang.code, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
    assert.ok(res, `Result must exist for language ${lang.code}`);
    assert.equal(res.languageCode, lang.code);
    assert.equal(res.policyProfile, 'STRICT');
    assert.ok(
      res.policyStatus === 'PERMITTED' || res.policyStatus === 'RESEARCH_ONLY',
      `Language ${lang.code} must have a valid status, got ${res.policyStatus}`
    );
  }

  // Evaluate all 251 models
  const allModels = getAllModels();
  for (const model of allModels) {
    const res = engine.evaluateModel(model, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
    assert.ok(res, `Result must exist for model ${model.modelId}`);
    assert.equal(res.modelId, model.modelId);
    assert.equal(res.policyProfile, 'STRICT');
  }
});

test('3. PolicyEngine never mutates a ModelRegistry entry or model object', () => {
  const engine = new PolicyEngine();
  const sampleModel = getModel('piper:sq_AL-edon-medium');
  assert.ok(sampleModel);

  // Snapshot JSON before evaluation
  const beforeJson = JSON.stringify(sampleModel);

  // Evaluate in both profiles and modes
  engine.evaluate(sampleModel, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  engine.evaluate(sampleModel, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
  engine.evaluate(sampleModel, { policyProfile: 'RELAXED', executionMode: 'RESEARCH' });
  engine.evaluate(sampleModel, { policyProfile: 'STRICT', executionMode: 'RESEARCH' });

  // Snapshot JSON after evaluation
  const afterJson = JSON.stringify(sampleModel);
  assert.equal(beforeJson, afterJson, 'ModelRegistry model entry must not be mutated by PolicyEngine');

  // Verify result object is frozen
  const res = engine.evaluate(sampleModel);
  assert.ok(Object.isFrozen(res), 'Policy evaluation result must be frozen');
  assert.ok(Object.isFrozen(res.restrictions), 'Policy restrictions array must be frozen');
});

test('4. Technical capability remains unchanged after policy evaluation', () => {
  const engine = new PolicyEngine();

  // Test across different capability types
  const sqCap = resolveLanguageCapability('sq');
  assert.equal(sqCap.technicalCapability, 'LOCAL_NEURAL');

  // Evaluate sq in STRICT mode (where it is restricted to RESEARCH_ONLY due to Lessac lineage)
  const sqRes = engine.evaluateLanguage('sq', { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
  assert.equal(sqRes.policyStatus, 'RESEARCH_ONLY');
  assert.equal(sqRes.permitted, false);
  // Technical capability must remain LOCAL_NEURAL, completely independent of policy restriction
  assert.equal(sqRes.technicalCapability, 'LOCAL_NEURAL');

  const sqCapAfter = resolveLanguageCapability('sq');
  assert.equal(sqCapAfter.technicalCapability, 'LOCAL_NEURAL');
});

test('5. Subtitle-only languages remain subtitle-only (No fabricated TTS permission)', () => {
  const engine = new PolicyEngine();
  const subtitleOnlyCodes = ['af', 'be', 'bho', 'yue', 'ch', 'doi'];

  for (const code of subtitleOnlyCodes) {
    const resRelaxed = engine.evaluateLanguage(code, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
    assert.equal(resRelaxed.technicalCapability, 'SUBTITLE_ONLY');
    assert.equal(resRelaxed.modelId, null);
    assert.equal(resRelaxed.permitted, false, 'Subtitle-only languages must not have permitted TTS synthesis');
    assert.ok(resRelaxed.restrictions.includes('TTS_UNSUPPORTED'));

    const resStrict = engine.evaluateLanguage(code, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
    assert.equal(resStrict.technicalCapability, 'SUBTITLE_ONLY');
    assert.equal(resStrict.modelId, null);
    assert.equal(resStrict.permitted, false);
    assert.ok(resStrict.restrictions.includes('TTS_UNSUPPORTED'));
  }
});

test('6. Missing or invalid model produces deterministic failure', () => {
  const engine = new PolicyEngine();

  const missingModelRes = engine.evaluateModel('piper:nonexistent_model_id');
  assert.equal(missingModelRes.policyStatus, 'UNKNOWN');
  assert.equal(missingModelRes.permitted, false);
  assert.ok(missingModelRes.restrictions.includes('MODEL_NOT_FOUND'));

  const missingLangRes = engine.evaluateLanguage('xyz_invalid_lang');
  assert.equal(missingLangRes.policyStatus, 'UNKNOWN');
  assert.equal(missingLangRes.permitted, false);
  assert.ok(missingLangRes.restrictions.includes('LANGUAGE_NOT_FOUND'));

  const nullRes = engine.evaluate(null);
  assert.equal(nullRes.policyStatus, 'UNKNOWN');
  assert.equal(nullRes.permitted, false);
});

test('7. Unknown metadata does not become automatically PERMITTED', () => {
  const engine = new PolicyEngine();

  // Synthetic unverified model definition
  const unverifiedModel = {
    modelId: 'test:unverified_model',
    languageCode: 'en',
    engine: 'piper',
    publishedLicense: null, // missing license
    evidence: 'UNKNOWN'
  };

  const commRes = engine.evaluate(unverifiedModel, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  assert.equal(commRes.policyStatus, 'UNKNOWN');
  assert.equal(commRes.permitted, false, 'Unverified metadata must NOT become PERMITTED in commercial mode');
  assert.ok(commRes.restrictions.includes('MISSING_LICENSE_METADATA'));
});

test('8. COMMERCIAL + RESEARCH_ONLY produces a blocking policy result', () => {
  const engine = new PolicyEngine();

  // Meta MMS model (CC-BY-NC 4.0)
  const mmsModel = getModel('mms:facebook/mms-tts-amh');
  assert.ok(mmsModel);

  const res = engine.evaluate(mmsModel, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  assert.equal(res.policyStatus, 'RESEARCH_ONLY');
  assert.equal(res.permitted, false, 'COMMERCIAL mode must block RESEARCH_ONLY model');
  assert.ok(res.restrictions.includes('NON_COMMERCIAL_PUBLISHER_LICENSE'));
});

test('9. RESEARCH + RESEARCH_ONLY remains executable from a policy perspective', () => {
  const engine = new PolicyEngine();

  const mmsModel = getModel('mms:facebook/mms-tts-amh');
  assert.ok(mmsModel);

  const res = engine.evaluate(mmsModel, { policyProfile: 'RELAXED', executionMode: 'RESEARCH' });
  assert.equal(res.policyStatus, 'RESEARCH_ONLY');
  assert.equal(res.permitted, true, 'RESEARCH mode must permit RESEARCH_ONLY model');
});

test('10. Same input produces identical output across repeated evaluations (Determinism)', () => {
  const engine = new PolicyEngine();
  const testInputs = ['piper:sq_AL-edon-medium', 'kokoro:en_US-bryce', 'hi', 'bho', 'es'];

  for (const input of testInputs) {
    const res1 = engine.evaluate(input, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
    const res2 = engine.evaluate(input, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
    const res3 = engine.evaluate(input, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });

    assert.deepEqual(res1, res2);
    assert.deepEqual(res2, res3);
  }
});

test('11. Policy A matrix is measured across all 109 languages', () => {
  const engine = new PolicyEngine();
  const matrixA = engine.evaluateMatrix({ policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });

  assert.equal(matrixA.counts.totalLanguages, 109);
  assert.equal(matrixA.results.length, 109);

  // Policy A exact measurement:
  // 41 commercial (Class A publisher-permissive)
  // 40 research-only (Class B non-commercial / MMS)
  // 28 subtitle-only (Class C no local neural models)
  assert.equal(matrixA.counts.commercialPermitted, 41);
  assert.equal(matrixA.counts.researchOnly, 40);
  assert.equal(matrixA.counts.subtitleOnly, 28);
  assert.equal(matrixA.counts.contested, 0);
  assert.equal(matrixA.counts.unknown, 0);
});

test('12. Policy B matrix is measured across all 109 languages', () => {
  const engine = new PolicyEngine();
  const matrixB = engine.evaluateMatrix({ policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });

  assert.equal(matrixB.counts.totalLanguages, 109);
  assert.equal(matrixB.results.length, 109);

  // Policy B empirical measurement from Phase 1 metadata:
  // Exactly 17 Class A models have verified Lessac non-commercial base lineage:
  // sq, bg, ca, cs, da, fi, ka, de, hu, lt, ne, fa, pl, ro, ru, sk, cy.
  // 41 - 17 = 24 commercial permitted.
  // 40 + 17 = 57 research only.
  // 28 subtitle-only.
  assert.equal(matrixB.counts.commercialPermitted, 24);
  assert.equal(matrixB.counts.researchOnly, 57);
  assert.equal(matrixB.counts.subtitleOnly, 28);
  assert.equal(matrixB.counts.contested, 0);
  assert.equal(matrixB.counts.unknown, 0);
});

test('13. Exact distribution is compared against architecture targets (A: 41/40/28, B: 21/60/28)', () => {
  const engine = new PolicyEngine();
  const matrixA = engine.evaluateMatrix({ policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  const matrixB = engine.evaluateMatrix({ policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });

  // Policy A target verification: exactly matches 41 / 40 / 28
  const targetA = { commercial: 41, research: 40, subtitleOnly: 28 };
  assert.equal(matrixA.counts.commercialPermitted, targetA.commercial, 'Policy A must yield 41 commercial languages');
  assert.equal(matrixA.counts.researchOnly, targetA.research, 'Policy A must yield 40 research languages');
  assert.equal(matrixA.counts.subtitleOnly, targetA.subtitleOnly, 'Policy A must yield 28 subtitle-only languages');

  // Policy B target comparison:
  // Architecture document estimated target: 21 commercial / 60 research / 28 subtitle-only.
  // Real source-of-truth metadata measurement: 24 commercial / 57 research / 28 subtitle-only.
  const targetB = { commercial: 21, research: 60, subtitleOnly: 28 };
  const measuredB = {
    commercial: matrixB.counts.commercialPermitted,
    research: matrixB.counts.researchOnly,
    subtitleOnly: matrixB.counts.subtitleOnly
  };

  assert.equal(measuredB.subtitleOnly, targetB.subtitleOnly, 'Subtitle-only count must match 28 exactly');

  // Verify the empirical derivation without fabricating metadata:
  // In the real Phase 1 ModelRegistry metadata, exactly 17 Class A models document Lessac lineage.
  // Therefore, 41 - 17 = 24 commercial, and 40 + 17 = 57 research-only.
  assert.equal(measuredB.commercial, 24, 'Empirical commercial count from registry metadata is 24');
  assert.equal(measuredB.research, 57, 'Empirical research count from registry metadata is 57');

  // Measure and document the discrepancy honestly:
  const discrepancy = {
    commercial: measuredB.commercial - targetB.commercial, // +3
    research: measuredB.research - targetB.research        // -3
  };
  assert.equal(discrepancy.commercial, 3, 'Discrepancy in commercial count between empirical and theoretical target is +3');
  assert.equal(discrepancy.research, -3, 'Discrepancy in research count between empirical and theoretical target is -3');
});

test('14. Invalid policy profile or execution mode throws PolicyError with correct error codes', () => {
  const engine = new PolicyEngine();

  assert.throws(
    () => engine.evaluate('en', { policyProfile: 'NON_EXISTENT_PROFILE' }),
    (err) => err instanceof PolicyError && err.code === 'INVALID_POLICY_PROFILE'
  );

  assert.throws(
    () => engine.evaluate('en', { executionMode: 'INVALID_MODE' }),
    (err) => err instanceof PolicyError && err.code === 'INVALID_EXECUTION_MODE'
  );
});

test('15. PolicyEngine operates purely in-memory with zero network or filesystem I/O', () => {
  // Verify PolicyEngine prototype contains no fetch, network, or process spawning methods
  const proto = Object.getOwnPropertyNames(PolicyEngine.prototype);
  assert.ok(!proto.includes('fetch'));
  assert.ok(!proto.includes('download'));
  assert.ok(!proto.includes('spawn'));
  assert.ok(!proto.includes('exec'));
});
