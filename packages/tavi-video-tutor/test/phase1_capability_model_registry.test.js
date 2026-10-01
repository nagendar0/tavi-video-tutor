import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AITUTOR_LANGUAGES,
  normalizeLanguageCode,
  getLanguageByCode,
  resolveLanguageCapability
} from '../src/subtitles/languages/registry.js';

import {
  ModelRegistry,
  getModel,
  getCanonicalModel,
  getAlternativeModels,
  findModelsForLanguage,
  getAllModels,
  getLanguageModelEntry,
  getAllLanguageModelEntries,
  getModelInventoryStats
} from '../src/subtitles/models/modelRegistry.js';

import {
  CapabilityResolver,
  resolveCapability,
  listAllCapabilities
} from '../src/subtitles/languages/capabilityResolver.js';

test('1. Registry Cardinality & Structure — Exactly 109 Languages', () => {
  assert.equal(AITUTOR_LANGUAGES.length, 109, 'AITUTOR_LANGUAGES must contain exactly 109 entries');
  const allEntries = getAllLanguageModelEntries();
  assert.equal(allEntries.length, 109, 'ModelRegistry must contain exactly 109 language entries');

  const stats = getModelInventoryStats();
  assert.equal(stats.totalLanguages, 109);
  assert.equal(stats.localNeuralCapable, 81, 'Exactly 81 languages must be local-neural capable');
  assert.equal(stats.subtitleOnly, 28, 'Exactly 28 languages must be subtitle-only');
  assert.equal(stats.localNeuralCapable + stats.subtitleOnly, 109);
});

test('2. Registry Language Codes Unique & Well-Formed', () => {
  const seenCodes = new Set();
  const seenIso3 = new Set();

  for (const lang of AITUTOR_LANGUAGES) {
    assert.ok(lang.code, `Language missing code: ${JSON.stringify(lang)}`);
    assert.ok(lang.code.length === 2 || lang.code.length === 3, `Invalid code length: ${lang.code}`);
    assert.match(lang.code, /^[a-z]{2,3}$/, `Code must be lowercase alpha: ${lang.code}`);
    assert.ok(!seenCodes.has(lang.code), `Duplicate language code: ${lang.code}`);
    seenCodes.add(lang.code);

    assert.ok(lang.iso639_2, `Missing iso639_2 for ${lang.code}`);
    assert.ok(!seenIso3.has(lang.iso639_2), `Duplicate iso639_2: ${lang.iso639_2}`);
    seenIso3.add(lang.iso639_2);
  }
  assert.equal(seenCodes.size, 109);
});

test('3. Deterministic Capability Resolution Across All 109 Languages', () => {
  const resolver = new CapabilityResolver();
  const allReports = resolver.listAllCapabilities();
  assert.equal(allReports.length, 109);

  for (const report of allReports) {
    assert.ok(report.languageCode, 'Report must include languageCode');
    assert.ok(report.languageName, `Report for ${report.languageCode} must include languageName`);
    assert.ok(report.bcp47, `Report for ${report.languageCode} must include bcp47`);
    assert.ok(typeof report.translationCapability === 'boolean');
    assert.ok(typeof report.ttsSupported === 'boolean');
    assert.ok(['NONE', 'SUBTITLE_ONLY', 'LOCAL_NEURAL', 'LOCAL_NEURAL_RESEARCH'].includes(report.technicalCapability));
    assert.ok(Array.isArray(report.alternativeModels));
    assert.ok(Array.isArray(report.allModels));
    assert.ok(typeof report.offlineCapability === 'boolean');
    assert.ok(report.provenance, 'Report must include provenance metadata');
  }

  // Idempotence & determinism check
  for (const lang of AITUTOR_LANGUAGES) {
    const report1 = resolveCapability(lang.code);
    const report2 = resolveCapability(lang.code);
    assert.deepEqual(report1, report2, `Capability report for ${lang.code} must be deterministic`);
  }
});

test('4. Subtitle-Only Boundary Verification (Exactly 28 Languages)', () => {
  const SUBTITLE_ONLY_CODES = new Set([
    'af', 'be', 'bho', 'ch', 'doi', 'ga', 'gl', 'haw', 'hr', 'ig',
    'kl', 'kok', 'ks', 'mi', 'mk', 'mni', 'ms', 'mt', 'or', 'ps',
    'sa', 'sat', 'sd', 'si', 'to', 'xh', 'yue', 'zu'
  ]);
  assert.equal(SUBTITLE_ONLY_CODES.size, 28, 'Subtitle-only set must contain exactly 28 languages');

  for (const code of SUBTITLE_ONLY_CODES) {
    const report = resolveCapability(code);
    assert.equal(report.technicalCapability, 'SUBTITLE_ONLY', `${code} must have technicalCapability 'SUBTITLE_ONLY'`);
    assert.equal(report.ttsSupported, false, `${code} must have ttsSupported === false`);
    assert.equal(report.canonicalModel, null, `${code} must have canonicalModel === null (NO fake TTS model)`);
    assert.equal(report.canonicalEngine, null, `${code} must have canonicalEngine === null`);
    assert.equal(report.alternativeModels.length, 0, `${code} must have 0 alternative models`);
    assert.equal(report.allModels.length, 0, `${code} must have 0 total models`);

    const canonicalFromRegistry = getCanonicalModel(code);
    assert.equal(canonicalFromRegistry, null, `getCanonicalModel(${code}) must return null`);
    const altsFromRegistry = getAlternativeModels(code);
    assert.deepEqual(altsFromRegistry, [], `getAlternativeModels(${code}) must return empty array`);
    const allFromRegistry = findModelsForLanguage(code);
    assert.deepEqual(allFromRegistry, [], `findModelsForLanguage(${code}) must return empty array`);
  }
});

test('5. Local-Neural Languages Capability & Structure (Exactly 81 Languages)', () => {
  const allReports = listAllCapabilities();
  const neuralReports = allReports.filter(r => r.ttsSupported);
  assert.equal(neuralReports.length, 81, 'Must have exactly 81 local-neural capable languages');

  const localNeuralStandardA = neuralReports.filter(r => r.technicalCapability === 'LOCAL_NEURAL');
  const localNeuralStandardB = neuralReports.filter(r => r.technicalCapability === 'LOCAL_NEURAL_RESEARCH');
  assert.equal(localNeuralStandardA.length, 41, 'Must have exactly 41 LOCAL_NEURAL languages');
  assert.equal(localNeuralStandardB.length, 40, 'Must have exactly 40 LOCAL_NEURAL_RESEARCH languages');
  assert.equal(localNeuralStandardA.length + localNeuralStandardB.length, 81);

  for (const report of neuralReports) {
    const code = report.languageCode;
    assert.ok(report.canonicalModel, `${code} must have canonicalModel`);
    assert.ok(report.canonicalEngine, `${code} must have canonicalEngine`);
    assert.ok(['piper', 'kokoro', 'mms'].includes(report.canonicalEngine), `Engine must be piper, kokoro, or mms: ${report.canonicalEngine}`);
    assert.equal(report.offlineCapability, true, `${code} local neural model must be offlineCapable`);

    const model = report.canonicalModel;
    assert.ok(model.modelId, `${code} model must have modelId`);
    assert.ok(model.modelName, `${code} model must have modelName`);
    assert.ok(model.modelType, `${code} model must have modelType`);
    assert.ok(model.sampleRate > 0, `${code} model must have positive sampleRate`);
    assert.ok(Array.isArray(model.voiceGenders) && model.voiceGenders.length > 0, `${code} model must define voiceGenders`);
    assert.ok(model.runtimeRequirements, `${code} model must specify runtimeRequirements`);
    assert.ok(model.runtimeRequirements.minMemoryMB > 0, `${code} minMemoryMB must be > 0`);
    assert.ok(model.runtimeRequirements.recommendedThreads > 0, `${code} recommendedThreads must be > 0`);
  }
});

test('6. Anti-Fabrication & Evidence Integrity — Unknown Stays UNKNOWN / null', () => {
  const allModels = getAllModels();
  assert.ok(allModels.length >= 200, `Total models must be substantial (found ${allModels.length})`);

  for (const model of allModels) {
    // Checksum rule: SHA256 must NOT be fabricated where upstream only provided MD5 or nothing
    if (model.engine === 'piper') {
      assert.equal(model.checksumSha256, null, `Piper model ${model.modelId} must not have fabricated SHA-256`);
      assert.ok(model.checksumMd5 !== undefined, `Piper model ${model.modelId} must define checksumMd5`);
    } else if (model.engine === 'mms') {
      assert.equal(model.checksumSha256, null, `MMS model ${model.modelId} must not have fabricated SHA-256`);
      assert.equal(model.checksumMd5, null, `MMS model ${model.modelId} must not have fabricated MD5`);
    }

    // Evidence rule: Evidence state must be valid
    assert.ok(['VERIFIED', 'OBSERVED', 'RESEARCHED', 'UNKNOWN', 'TO_BE_VERIFIED'].includes(model.evidence));
  }
});

test('7. ModelRegistry Lookup Contract — getModel() Strict Return Values', () => {
  // Existing models
  const piperModel = getModel('piper:sq_AL-edon-medium');
  assert.ok(piperModel, 'Must find piper:sq_AL-edon-medium');
  assert.equal(piperModel.engine, 'piper');
  assert.equal(piperModel.languageCode, 'sq');

  const kokoroModel = getModel('kokoro:zh_CN-huayan');
  assert.ok(kokoroModel, 'Must find kokoro:zh_CN-huayan');
  assert.equal(kokoroModel.engine, 'kokoro');
  assert.equal(kokoroModel.languageCode, 'zh');

  const mmsModel = getModel('mms:facebook/mms-tts-amh');
  assert.ok(mmsModel, 'Must find mms:facebook/mms-tts-amh');
  assert.equal(mmsModel.engine, 'mms');
  assert.equal(mmsModel.languageCode, 'am');

  // Non-existent model IDs return null (NOT throwing or returning empty object)
  assert.equal(getModel('nonexistent_model'), null);
  assert.equal(getModel('piper:fake_voice_123'), null);
  assert.equal(getModel(''), null);
  assert.equal(getModel(null), null);
  assert.equal(getModel(undefined), null);
});

test('8. Deterministic Model Selection Across Multi-Model Languages (id, ml, sq)', () => {
  const multiModelLangs = ['id', 'ml', 'sq'];

  for (const code of multiModelLangs) {
    const models = findModelsForLanguage(code);
    assert.ok(models.length >= 2, `${code} must have at least 2 models (Piper + MMS/alt)`);

    const canonical = getCanonicalModel(code);
    assert.ok(canonical, `${code} must have a canonical model`);

    // Verify engine-filtered lookups
    const piperSpecific = getCanonicalModel(code, 'piper');
    assert.ok(piperSpecific, `${code} must resolve piper specific model`);
    assert.equal(piperSpecific.engine, 'piper');

    const mmsSpecific = getCanonicalModel(code, 'mms');
    assert.ok(mmsSpecific, `${code} must resolve mms specific model`);
    assert.equal(mmsSpecific.engine, 'mms');

    // Canonical model remains deterministic
    const canonical2 = getCanonicalModel(code);
    assert.equal(canonical.modelId, canonical2.modelId);
  }
});

test('9. Technical Capability vs. Policy Engine Separation (Zero Commercial Inferences)', () => {
  const allReports = listAllCapabilities();

  for (const report of allReports) {
    // Assert strictly technical fields exist
    assert.ok('technicalCapability' in report);
    assert.ok('translationCapability' in report);
    assert.ok('ttsSupported' in report);

    // CRITICAL: Assert NO commercial policy conclusions are embedded in capability report
    assert.equal(report.isCommerciallyApproved, undefined, 'Must not contain isCommerciallyApproved');
    assert.equal(report.commercialPolicy, undefined, 'Must not contain commercialPolicy decision');
    assert.equal(report.standardAPermitted, undefined, 'Must not contain standardAPermitted');
    assert.equal(report.standardBPermitted, undefined, 'Must not contain standardBPermitted');
    assert.equal(report.legalConclusion, undefined, 'Must not contain legalConclusion');

    // Provenance facts exist without converting into legal conclusions
    assert.ok('publishedLicense' in report.provenance);
    assert.ok('datasetLicense' in report.provenance);
    assert.ok('baseLineage' in report.provenance);
  }

  const allModels = getAllModels();
  for (const model of allModels) {
    assert.equal(model.isCommerciallyApproved, undefined, 'ModelDefinition must not contain isCommerciallyApproved');
    assert.equal(model.commercialStatus, undefined, 'ModelDefinition must not contain commercialStatus');
  }
});

test('10. Backward Compatibility of resolveLanguageCapability()', () => {
  for (const lang of AITUTOR_LANGUAGES) {
    const code = lang.code;
    const legacyCap = resolveLanguageCapability(code);

    // Must preserve all legacy properties expected by existing consumers
    assert.equal(legacyCap.canonicalCode, code);
    assert.equal(legacyCap.displayName, lang.name);
    assert.ok(typeof legacyCap.ttsSupported === 'boolean');
    assert.ok(typeof legacyCap.translationSupported === 'boolean');
    assert.ok(legacyCap.ttsLocale);
    assert.ok(legacyCap.preferredVoices);
    assert.ok(Array.isArray(legacyCap.preferredVoices.female));
    assert.ok(Array.isArray(legacyCap.preferredVoices.male));

    // Must attach Phase 1 technical capability additions
    assert.ok(['NONE', 'SUBTITLE_ONLY', 'LOCAL_NEURAL', 'LOCAL_NEURAL_RESEARCH'].includes(legacyCap.technicalCapability));
    assert.ok(legacyCap.technicalReport, 'Must attach technicalReport');
  }
});
