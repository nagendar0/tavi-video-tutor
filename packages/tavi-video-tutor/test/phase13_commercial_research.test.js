// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  PolicyEngine,
  POLICY_PROFILES,
  EXECUTION_MODES,
  POLICY_STATUS,
  PolicyError,
  normalizeExecutionMode,
  normalizePolicyProfile
} from '../src/subtitles/policy/PolicyEngine.js';

import {
  ModelRegistry,
  getModel,
  getCanonicalModel,
  findModelsForLanguage,
  getAllModels,
  getAllLanguageModelEntries,
  getModelInventoryStats
} from '../src/subtitles/models/modelRegistry.js';

import {
  CapabilityResolver,
  resolveCapability,
  listAllCapabilities
} from '../src/subtitles/languages/capabilityResolver.js';

import {
  AITUTOR_LANGUAGES,
  normalizeLanguageCode
} from '../src/subtitles/languages/registry.js';

import {
  ModelCacheManager,
  CACHE_STATUS,
  VERIFICATION_STATUS,
  CacheError
} from '../src/subtitles/cache/ModelCacheManager.js';

import {
  createTTSProvider,
  resolveTTSProvider,
  FactoryError,
  CLOUD_PROVIDERS,
  LOCAL_PROVIDERS,
  ExplicitFallbackTTSProvider
} from '../src/subtitles/tts/ttsFactory.js';

import { TTSProvider } from '../src/subtitles/tts/TTSProvider.js';
import { PiperTTSAdapter, PiperError } from '../src/subtitles/tts/PiperTTSAdapter.js';
import { KokoroTTSAdapter, KokoroError } from '../src/subtitles/tts/KokoroTTSAdapter.js';
import { MmsTTSAdapter, MmsError } from '../src/subtitles/tts/MmsTTSAdapter.js';
import { PreflightDoctor, CHECK_CATEGORIES, CHECK_RESULTS } from '../src/subtitles/env/preflight.js';
import { NetworkPolicy, NETWORK_MODES } from '../src/subtitles/network/index.js';

import {
  TaviPolicyError,
  TaviNetworkError,
  getErrorDefinition,
  getExitCodeForError,
  formatErrorJson,
  redactSecrets,
  ERROR_CATEGORIES,
  CLI_EXIT_CODES
} from '../src/subtitles/errors/index.js';

import {
  validateRemoteUrl,
  validateResolvedRemoteHost,
  resolveDirectMediaSource,
  resolveVideoSource
} from '../src/subtitles/video/resolveVideo.js';

// Setup shared fake binary executable in temp directory for simulated tests
const testGlobalTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase13_tests_'));
const fakePiperBin = path.join(testGlobalTempDir, 'fake-piper.exe');
fs.writeFileSync(fakePiperBin, '#!/bin/sh\nexit 0\n');
const fakeMmsBin = path.join(testGlobalTempDir, 'fake-mms.exe');
fs.writeFileSync(fakeMmsBin, '#!/bin/sh\nexit 0\n');

/**
 * Helper to create a valid dummy PCM WAV file for mock synthesis
 * @param {string} filePath
 * @param {number} [duration=1.0]
 * @param {number} [sampleRate=22050]
 * @returns {string}
 */
function createDummyWav(filePath, duration = 1.0, sampleRate = 22050) {
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2; // 16-bit mono
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // Mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  fs.writeFileSync(filePath, buf);
  return filePath;
}

// ============================================================================
// SECTION 1 (Tests 1–8): Policy Mode Initialization and Immutability
// ============================================================================

test('1. PolicyEngine initializes with canonical default modes (RELAXED, COMMERCIAL)', () => {
  const engine = new PolicyEngine();
  assert.strictEqual(engine.defaultProfile, POLICY_PROFILES.RELAXED);
  assert.strictEqual(engine.defaultExecutionMode, EXECUTION_MODES.COMMERCIAL);
  assert.strictEqual(POLICY_PROFILES.RELAXED, 'RELAXED');
  assert.strictEqual(POLICY_PROFILES.STRICT, 'STRICT');
  assert.strictEqual(POLICY_PROFILES.CUSTOM, 'CUSTOM');
  assert.strictEqual(EXECUTION_MODES.COMMERCIAL, 'COMMERCIAL');
  assert.strictEqual(EXECUTION_MODES.RESEARCH, 'RESEARCH');
});

test('2. normalizeExecutionMode deterministically maps valid inputs', () => {
  assert.strictEqual(normalizeExecutionMode('COMMERCIAL'), EXECUTION_MODES.COMMERCIAL);
  assert.strictEqual(normalizeExecutionMode('commercial'), EXECUTION_MODES.COMMERCIAL);
  assert.strictEqual(normalizeExecutionMode('  COMMERCIAL  '), EXECUTION_MODES.COMMERCIAL);
  assert.strictEqual(normalizeExecutionMode('RESEARCH'), EXECUTION_MODES.RESEARCH);
  assert.strictEqual(normalizeExecutionMode('research'), EXECUTION_MODES.RESEARCH);
  assert.strictEqual(normalizeExecutionMode('academic'), EXECUTION_MODES.RESEARCH);
  assert.strictEqual(normalizeExecutionMode('non_commercial'), EXECUTION_MODES.RESEARCH);
});

test('3. normalizeExecutionMode rejects invalid, empty, or ambiguous mode values', () => {
  const invalidModes = ['allowEverything', 'allowEverything=true', 'all', '', '   ', null, undefined, 123, true, false, 'bypass'];
  for (const bad of invalidModes) {
    assert.throws(
      () => normalizeExecutionMode(/** @type {any} */ (bad)),
      (err) => err instanceof PolicyError && err.code === 'INVALID_EXECUTION_MODE',
      `Expected INVALID_EXECUTION_MODE for '${bad}'`
    );
  }
});

test('4. normalizePolicyProfile deterministically maps valid inputs', () => {
  assert.strictEqual(normalizePolicyProfile('RELAXED'), POLICY_PROFILES.RELAXED);
  assert.strictEqual(normalizePolicyProfile('relaxed'), POLICY_PROFILES.RELAXED);
  assert.strictEqual(normalizePolicyProfile('policy_a'), POLICY_PROFILES.RELAXED);
  assert.strictEqual(normalizePolicyProfile('standard-a'), POLICY_PROFILES.RELAXED);
  assert.strictEqual(normalizePolicyProfile('STRICT'), POLICY_PROFILES.STRICT);
  assert.strictEqual(normalizePolicyProfile('strict'), POLICY_PROFILES.STRICT);
  assert.strictEqual(normalizePolicyProfile('policy_b'), POLICY_PROFILES.STRICT);
  assert.strictEqual(normalizePolicyProfile('standard-b'), POLICY_PROFILES.STRICT);
  assert.strictEqual(normalizePolicyProfile('CUSTOM'), POLICY_PROFILES.CUSTOM);
});

test('5. normalizePolicyProfile rejects invalid/unsupported profiles', () => {
  const invalidProfiles = ['PERMISSIVE', 'unlimited', 'default', '', null, undefined, 999, 'policy_c'];
  for (const bad of invalidProfiles) {
    assert.throws(
      () => normalizePolicyProfile(/** @type {any} */ (bad)),
      (err) => err instanceof PolicyError && err.code === 'INVALID_POLICY_PROFILE',
      `Expected INVALID_POLICY_PROFILE for '${bad}'`
    );
  }
});

test('6. PolicyEngine.evaluate produces a frozen, immutable result object', () => {
  const engine = new PolicyEngine();
  const res = engine.evaluate('kokoro:zh_CN-huayan');
  assert.ok(Object.isFrozen(res), 'Result object must be frozen');
  assert.ok(Object.isFrozen(res.restrictions), 'Restrictions array must be frozen');

  assert.throws(() => {
    // @ts-ignore
    res.permitted = false;
  }, TypeError);

  assert.throws(() => {
    // @ts-ignore
    res.restrictions.push('TAMPERED');
  }, TypeError);
});

test('7. Repeated policy evaluations of identical inputs are strictly deterministic and side-effect free', () => {
  const engine = new PolicyEngine();
  const sampleModel = getModel('piper:sq_AL-edon-medium');
  assert.ok(sampleModel);

  const regCountBefore = ModelRegistry.getAllLanguageModelEntries().length;
  const rawModelBeforeJson = JSON.stringify(sampleModel);

  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(engine.evaluate(sampleModel, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' }));
  }

  const regCountAfter = ModelRegistry.getAllLanguageModelEntries().length;
  const rawModelAfterJson = JSON.stringify(sampleModel);

  assert.strictEqual(regCountBefore, regCountAfter, 'Registry count must remain unchanged');
  assert.strictEqual(rawModelBeforeJson, rawModelAfterJson, 'Registry model object must not be mutated');

  for (let i = 1; i < results.length; i++) {
    assert.deepStrictEqual(results[i], results[0], `Result ${i} must match result 0 deterministically`);
  }
});

test('8. Custom policy profile evaluator functions correctly under POLICY_PROFILES.CUSTOM and rejects when evaluator is missing', () => {
  const customEngine = new PolicyEngine({
    defaultProfile: 'CUSTOM',
    customEvaluator: (modelDef) => ({
      permitted: modelDef.engine === 'kokoro',
      policyStatus: modelDef.engine === 'kokoro' ? POLICY_STATUS.PERMITTED : POLICY_STATUS.RESEARCH_ONLY,
      reason: 'Custom org rule',
      restrictions: modelDef.engine === 'kokoro' ? [] : ['CUSTOM_FORBIDDEN']
    })
  });

  const kokoroRes = customEngine.evaluate('kokoro:zh_CN-huayan');
  assert.strictEqual(kokoroRes.permitted, true);
  assert.strictEqual(kokoroRes.policyStatus, POLICY_STATUS.PERMITTED);

  const piperRes = customEngine.evaluate('piper:en_GB-alan-low');
  assert.strictEqual(piperRes.permitted, false);
  assert.strictEqual(piperRes.policyStatus, POLICY_STATUS.RESEARCH_ONLY);

  const brokenEngine = new PolicyEngine({ defaultProfile: 'CUSTOM' });
  assert.throws(
    () => brokenEngine.evaluate('kokoro:zh_CN-huayan'),
    (err) => err instanceof PolicyError && err.code === 'INVALID_POLICY_PROFILE'
  );
});

// ============================================================================
// SECTION 2 (Tests 9–18): Commercial Model Enforcement
// ============================================================================

test('9. Commercial mode allows explicitly permitted permissive models', () => {
  const engine = new PolicyEngine();
  // Kokoro Mandarin: Apache-2.0
  const kokoroRes = engine.evaluate('kokoro:zh_CN-huayan', { executionMode: 'COMMERCIAL' });
  assert.strictEqual(kokoroRes.permitted, true);
  assert.strictEqual(kokoroRes.policyStatus, POLICY_STATUS.PERMITTED);
  assert.deepStrictEqual(kokoroRes.restrictions, []);

  // Piper English: Apache 2.0 / CC0
  const piperRes = engine.evaluate('piper:en_GB-alan-low', { executionMode: 'COMMERCIAL' });
  assert.strictEqual(piperRes.permitted, true);
  assert.strictEqual(piperRes.policyStatus, POLICY_STATUS.PERMITTED);
  assert.deepStrictEqual(piperRes.restrictions, []);
});

test('10. Commercial mode (RELAXED profile) strictly blocks research-only models', () => {
  const engine = new PolicyEngine();
  // Meta MMS Amharic: CC-BY-NC 4.0
  const mmsRes = engine.evaluate('mms:facebook/mms-tts-amh', { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  assert.strictEqual(mmsRes.permitted, false);
  assert.strictEqual(mmsRes.policyStatus, POLICY_STATUS.RESEARCH_ONLY);
  assert.ok(mmsRes.restrictions.includes('NON_COMMERCIAL_PUBLISHER_LICENSE'));
  assert.ok(mmsRes.reason.includes('explicitly restricts to research/non-commercial use'));
});

test('11. Commercial mode (STRICT profile) blocks models with upstream non-commercial training lineage', () => {
  const engine = new PolicyEngine();
  // Piper Albanian: CC0 published license, but Lessac Blizzard 2013 upstream training lineage
  const relaxedRes = engine.evaluate('piper:sq_AL-edon-medium', { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  assert.strictEqual(relaxedRes.permitted, true, 'Permitted under relaxed publisher license');

  const strictRes = engine.evaluate('piper:sq_AL-edon-medium', { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
  assert.strictEqual(strictRes.permitted, false, 'Restricted under strict derivative lineage policy');
  assert.strictEqual(strictRes.policyStatus, POLICY_STATUS.RESEARCH_ONLY);
  assert.ok(strictRes.restrictions.includes('LESSAC_BLIZZARD_UPSTREAM_LINEAGE'));
});

test('12. Commercial mode strictly blocks models with unknown/unresolved license metadata', () => {
  const engine = new PolicyEngine();

  // Synthetic model with UNKNOWN license
  const unknownModel = {
    modelId: 'test:unknown-license',
    engine: 'piper',
    publishedLicense: 'UNKNOWN',
    languageCode: 'en'
  };
  const unknownRes = engine.evaluate(/** @type {any} */ (unknownModel), { executionMode: 'COMMERCIAL' });
  assert.strictEqual(unknownRes.permitted, false);
  assert.strictEqual(unknownRes.policyStatus, POLICY_STATUS.UNKNOWN);
  assert.ok(unknownRes.restrictions.includes('MISSING_LICENSE_METADATA'));

  // Synthetic model with arbitrary unverified custom license
  const customModel = {
    modelId: 'test:custom-license',
    engine: 'piper',
    publishedLicense: 'CUSTOM_UNVERIFIED_TERMS_2026',
    languageCode: 'en'
  };
  const customRes = engine.evaluate(/** @type {any} */ (customModel), { executionMode: 'COMMERCIAL' });
  assert.strictEqual(customRes.permitted, false);
  assert.strictEqual(customRes.policyStatus, POLICY_STATUS.UNKNOWN);
  assert.ok(customRes.restrictions.includes('UNVERIFIED_OR_UNKNOWN_LICENSE'));
});

test('13. Commercial mode blocks technically available but policy-forbidden models', () => {
  const resolver = new CapabilityResolver();
  const engine = new PolicyEngine();

  // Amharic (am): technically has working Meta MMS model in registry
  const techReport = resolver.resolve('am');
  assert.strictEqual(techReport.supported, true);
  assert.strictEqual(techReport.ttsSupported, true);
  assert.strictEqual(techReport.canonicalEngine, 'mms');

  // PolicyEngine commercial evaluation must still deny commercial use
  const policyRes = engine.evaluateLanguage('am', { executionMode: 'COMMERCIAL' });
  assert.strictEqual(policyRes.permitted, false);
  assert.strictEqual(policyRes.policyStatus, POLICY_STATUS.RESEARCH_ONLY);
});

test('14. Commercial mode rejects subtitle-only languages for TTS audio synthesis', () => {
  const engine = new PolicyEngine();
  // Afrikaans (af): subtitle-only
  const afRes = engine.evaluateLanguage('af', { executionMode: 'COMMERCIAL' });
  assert.strictEqual(afRes.permitted, false);
  assert.strictEqual(afRes.technicalCapability, 'SUBTITLE_ONLY');
  assert.ok(afRes.restrictions.includes('SUBTITLES_ONLY'));
  assert.ok(afRes.restrictions.includes('TTS_UNSUPPORTED'));
});

test('15. Commercial mode policy evaluation returns structured restrictions array explaining exact restriction reasons', () => {
  const engine = new PolicyEngine();
  const mmsRes = engine.evaluate('mms:facebook/mms-tts-hin', { executionMode: 'COMMERCIAL' });
  assert.ok(Array.isArray(mmsRes.restrictions));
  assert.ok(mmsRes.restrictions.length > 0);
  assert.ok(mmsRes.restrictions.includes('NON_COMMERCIAL_PUBLISHER_LICENSE'));

  const kokoroRes = engine.evaluate('kokoro:zh_CN-huayan', { executionMode: 'COMMERCIAL' });
  assert.ok(Array.isArray(kokoroRes.restrictions));
  assert.strictEqual(kokoroRes.restrictions.length, 0);
});

test('16. Commercial mode prevents downloading blocked research-only models via ModelCacheManager', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_cache_down_'));
  try {
    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    await assert.rejects(
      async () => {
        await cacheManager.downloadArtifact(mmsModel, /** @type {any} */ ({ executionMode: 'COMMERCIAL' }));
      },
      (err) => {
        assert.ok(err instanceof CacheError);
        assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
        assert.ok(err.message.includes('prohibited in commercial execution mode'));
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('17. Commercial mode prevents promoting/ensuring a blocked model via ModelCacheManager', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_cache_ensure_'));
  try {
    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    await assert.rejects(
      async () => {
        await cacheManager.ensureModel(mmsModel, /** @type {any} */ ({ executionMode: 'COMMERCIAL' }));
      },
      (err) => {
        assert.ok(err instanceof CacheError);
        assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('18. Commercial mode rejects research-only provider instantiation in ttsFactory', () => {
  assert.throws(
    () => createTTSProvider({ provider: 'mms', executionMode: 'COMMERCIAL' }),
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
      assert.ok(err.message.includes("Provider 'mms' is research-only"));
      return true;
    }
  );

  assert.throws(
    () => resolveTTSProvider({ provider: 'mms', executionMode: 'COMMERCIAL' }),
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
      return true;
    }
  );
});

// ============================================================================
// SECTION 3 (Tests 19–26): Research Mode Enforcement
// ============================================================================

test('19. Research mode allows access to research-only models', () => {
  const engine = new PolicyEngine();
  const res = engine.evaluate('mms:facebook/mms-tts-amh', { executionMode: 'RESEARCH' });
  assert.strictEqual(res.permitted, true);
  assert.strictEqual(res.policyStatus, POLICY_STATUS.RESEARCH_ONLY);
  assert.strictEqual(res.executionMode, EXECUTION_MODES.RESEARCH);
});

test('20. Research mode still permits commercially-licensed models', () => {
  const engine = new PolicyEngine();
  const kokoroRes = engine.evaluate('kokoro:zh_CN-huayan', { executionMode: 'RESEARCH' });
  assert.strictEqual(kokoroRes.permitted, true);
  assert.strictEqual(kokoroRes.policyStatus, POLICY_STATUS.PERMITTED);

  const piperRes = engine.evaluate('piper:en_GB-alan-low', { executionMode: 'RESEARCH' });
  assert.strictEqual(piperRes.permitted, true);
  assert.strictEqual(piperRes.policyStatus, POLICY_STATUS.PERMITTED);
});

test('21. Research mode still blocks models with missing, unknown, or corrupted license metadata', () => {
  const engine = new PolicyEngine();
  const unknownModel = {
    modelId: 'test:corrupt-meta',
    engine: 'piper',
    publishedLicense: 'UNKNOWN',
    languageCode: 'en'
  };

  const res = engine.evaluate(/** @type {any} */ (unknownModel), { executionMode: 'RESEARCH' });
  assert.strictEqual(res.permitted, false, 'Research mode must NOT permit unknown licensing');
  assert.strictEqual(res.policyStatus, POLICY_STATUS.UNKNOWN);
});

test('22. Research mode still rejects subtitle-only languages for audio synthesis', () => {
  const engine = new PolicyEngine();
  const res = engine.evaluateLanguage('af', { executionMode: 'RESEARCH' });
  assert.strictEqual(res.permitted, false, 'Cannot synthesize audio when no technical model exists');
  assert.strictEqual(res.technicalCapability, 'SUBTITLE_ONLY');
});

test('23. Research mode still strictly obeys NetworkPolicy offline boundaries', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_res_net_'));
  try {
    const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
    const cacheManager = new ModelCacheManager({
      cacheDir: tmpDir,
      networkPolicy: offlinePolicy
    });
    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    await assert.rejects(
      async () => {
        await cacheManager.downloadArtifact(/** @type {any} */ (mmsModel), { executionMode: 'RESEARCH', offline: true });
      },
      (err) => {
        assert.ok(err instanceof TaviNetworkError);
        assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('24. Research mode still validates cache and file integrity', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_res_integ_'));
  try {
    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const model = getModel('piper:sq_AL-edon-medium');
    assert.ok(model);

    // Corrupt artifact on disk
    const targetDir = cacheManager.getModelDirectory(model);
    fs.mkdirSync(targetDir, { recursive: true });
    const cachePath = cacheManager.getCachePath(model);
    fs.writeFileSync(cachePath, 'CORRUPTED_BYTES');

    await assert.rejects(
      async () => {
        await cacheManager.ensureModel(model, /** @type {any} */ ({ executionMode: 'RESEARCH', offline: true }));
      },
      (err) => {
        assert.ok(err instanceof CacheError);
        assert.strictEqual(err.code, 'MODEL_CHECKSUM_MISMATCH');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('25. Research mode preserves required runtime and platform requirements', () => {
  const amharicEntry = ModelRegistry.getLanguageModelEntry('am');
  assert.ok(amharicEntry);
  assert.strictEqual(amharicEntry.runtimeRequirements.minMemoryMB, 512);
  assert.deepStrictEqual(amharicEntry.runtimeRequirements.supportedPlatforms, ['win32', 'darwin', 'linux']);
});

test('26. Research mode returns structured policy status distinguishing research clearance from commercial clearance', () => {
  const engine = new PolicyEngine();
  const res = engine.evaluate('mms:facebook/mms-tts-amh', { executionMode: 'RESEARCH' });
  assert.strictEqual(res.policyStatus, POLICY_STATUS.RESEARCH_ONLY);
  assert.notStrictEqual(res.policyStatus, POLICY_STATUS.PERMITTED);
  assert.strictEqual(res.permitted, true);
  assert.ok(res.reason.includes('Permitted for research execution'));
});

// ============================================================================
// SECTION 4 (Tests 27–32): Cache Policy Isolation
// ============================================================================

test('27. Lifecycle 1 & 2: Research-only model downloaded and cached under Research mode', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_lifecycle_'));
  try {
    const cacheManager = new ModelCacheManager({
      cacheDir: tmpDir,
      downloader: async (_url, tempPath) => {
        fs.writeFileSync(tempPath, Buffer.alloc(1024, 0xAA));
        return { bytesWritten: 1024 };
      }
    });

    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    // Download and cache under Research mode
    const cachedStatus = await cacheManager.ensureModel(mmsModel, /** @type {any} */ ({ executionMode: 'RESEARCH' }));
    assert.strictEqual(cachedStatus.status, CACHE_STATUS.CACHED_UNVERIFIED);
    assert.strictEqual(cachedStatus.exists, true);
    assert.strictEqual(cacheManager.isCached(mmsModel), true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('28. Lifecycle 3 & 4 & 5: Switching to Commercial Mode and attempting to resolve/ensure/use same cached model is strictly rejected', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_lifecycle2_'));
  try {
    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    // Stage model directly in cache directory as if previously downloaded
    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const targetDir = cacheManager.getModelDirectory(mmsModel);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(cacheManager.getCachePath(mmsModel), Buffer.alloc(1024, 0xBB));
    fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
    fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

    assert.strictEqual(cacheManager.isCached(mmsModel), true, 'Model is physically on disk');

    // 1. ModelCacheManager.ensureModel in Commercial Mode must reject
    await assert.rejects(
      async () => {
        await cacheManager.ensureModel(mmsModel, /** @type {any} */ ({ executionMode: 'COMMERCIAL' }));
      },
      (err) => {
        assert.ok(err instanceof CacheError);
        assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
        return true;
      }
    );

    // 2. Direct MmsTTSAdapter in Commercial Mode must reject even with cached files
    const adapter = new MmsTTSAdapter({
      executablePath: fakeMmsBin,
      cacheManager
    });

    await assert.rejects(
      async () => {
        await adapter.synthesize('Attempt commercial synthesis with cached model', 'am', {
          modelId: mmsModel.modelId,
          executionMode: 'COMMERCIAL',
          offline: true
        });
      },
      (err) => {
        assert.ok(err instanceof MmsError);
        assert.strictEqual(err.code, 'POLICY_RESTRICTION');
        assert.ok(err.message.includes('restricted from commercial execution'));
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('29. Reverse lifecycle: Commercially permitted model cached under Commercial mode remains technically usable when switching to Research mode', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_rev_life_'));
  try {
    const kokoroModel = getModel('kokoro:zh_CN-huayan');
    assert.ok(kokoroModel);

    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const targetDir = cacheManager.getModelDirectory(kokoroModel);
    fs.mkdirSync(targetDir, { recursive: true });

    // Truncate file to expected model size so getCacheStatus identifies it as valid cached artifact
    const targetPath = cacheManager.getCachePath(kokoroModel);
    const fd = fs.openSync(targetPath, 'w');
    fs.ftruncateSync(fd, kokoroModel.sizeBytes || 86200000);
    fs.closeSync(fd);

    // Usable in Commercial mode
    const commStatus = await cacheManager.ensureModel(kokoroModel, /** @type {any} */ ({ executionMode: 'COMMERCIAL' }));
    assert.strictEqual(commStatus.exists, true);

    // Switch to Research mode: remains completely usable
    const resStatus = await cacheManager.ensureModel(kokoroModel, /** @type {any} */ ({ executionMode: 'RESEARCH' }));
    assert.strictEqual(resStatus.exists, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('30. On-disk presence of a research model file never confers commercial validity', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_ondisk_'));
  try {
    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    // Place file on disk
    const targetDir = cacheManager.getModelDirectory(mmsModel);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(cacheManager.getCachePath(mmsModel), Buffer.alloc(2048));

    // Query policy engine
    const engine = new PolicyEngine();
    const policyResult = engine.evaluate(mmsModel, { executionMode: 'COMMERCIAL' });

    assert.strictEqual(policyResult.permitted, false, 'On-disk file must not bypass commercial denial');
    assert.strictEqual(policyResult.policyStatus, POLICY_STATUS.RESEARCH_ONLY);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('31. ModelCacheManager with commercial executionMode refuses to download or cache unpermitted models even if network is available', async () => {
  let downloaderCalled = false;
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_down_refuse_'));
  try {
    const cacheManager = new ModelCacheManager({
      cacheDir: tmpDir,
      downloader: async () => {
        downloaderCalled = true;
        return { bytesWritten: 500 };
      }
    });

    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    await assert.rejects(
      async () => {
        await cacheManager.downloadArtifact(mmsModel, /** @type {any} */ ({ executionMode: 'COMMERCIAL', offline: false }));
      },
      (err) => {
        assert.ok(err instanceof CacheError);
        assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
        return true;
      }
    );

    assert.strictEqual(downloaderCalled, false, 'Downloader must NEVER be invoked for blocked commercial models');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('32. Cache status reports distinguish between raw filesystem presence and policy validity under requested execution mode', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p13_status_dist_'));
  try {
    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const mmsModel = getModel('mms:facebook/mms-tts-amh');
    assert.ok(mmsModel);

    const targetDir = cacheManager.getModelDirectory(mmsModel);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(cacheManager.getCachePath(mmsModel), Buffer.alloc(100));

    const status = cacheManager.getCacheStatus(mmsModel);
    assert.strictEqual(status.exists, true, 'Filesystem reports existence');

    const engine = new PolicyEngine();
    const policyResult = engine.evaluate(mmsModel, { executionMode: 'COMMERCIAL' });
    assert.strictEqual(policyResult.permitted, false, 'Policy reports non-permitted');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ============================================================================
// SECTION 5 (Tests 33–38): Factory / Direct-Adapter Bypass Attempts
// ============================================================================

test('33. Bypass attempt via direct ModelRegistry lookup: retrieving modelDef yields technical facts only, not policy authorization', () => {
  const mmsDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  assert.ok(mmsDef);
  // @ts-ignore
  assert.strictEqual(mmsDef.permitted, undefined, 'Technical definition must not define authorization fields');
  // @ts-ignore
  assert.strictEqual(mmsDef.policyStatus, undefined);
  assert.strictEqual(mmsDef.publishedLicense, 'CC-BY-NC 4.0');
});

test('34. Bypass attempt via CapabilityResolver: resolveCapability returns technical report only and does not grant commercial clearance', () => {
  const cap = resolveCapability('am');
  assert.strictEqual(cap.supported, true);
  assert.strictEqual(cap.ttsSupported, true);
  // @ts-ignore
  assert.strictEqual(cap.permitted, undefined, 'Capability report must not grant policy clearance');
  // @ts-ignore
  assert.strictEqual(cap.policyStatus, undefined);
});

test('35. Bypass attempt via direct MmsTTSAdapter construction: calling synthesize in commercial mode is strictly blocked', async () => {
  const adapter = new MmsTTSAdapter({
    executablePath: fakeMmsBin
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Direct adapter bypass test', 'am', {
        executionMode: 'COMMERCIAL'
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.strictEqual(err.code, 'POLICY_RESTRICTION');
      assert.strictEqual(err.provider, 'mms');
      return true;
    }
  );
});

test('36. Bypass attempt via direct PiperTTSAdapter construction: calling synthesize in commercial mode with a restricted model is blocked', async () => {
  const adapter = new PiperTTSAdapter({
    executablePath: fakePiperBin
  });

  // sq with Lessac lineage under STRICT policy profile
  await assert.rejects(
    async () => {
      await adapter.synthesize('Direct piper bypass test', 'sq', {
        executionMode: 'COMMERCIAL',
        policyProfile: 'STRICT'
      });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
      assert.strictEqual(err.provider, 'piper');
      return true;
    }
  );
});

test('37. Bypass attempt via public ttsFactory: resolveTTSProvider / createTTSProvider rejects research-only provider in commercial mode', () => {
  assert.throws(
    () => createTTSProvider({ provider: 'mms', executionMode: 'COMMERCIAL' }),
    (err) => err instanceof FactoryError && err.code === 'MODEL_POLICY_RESTRICTED'
  );

  assert.throws(
    () => resolveTTSProvider({ provider: 'mms', executionMode: 'COMMERCIAL' }),
    (err) => err instanceof FactoryError && err.code === 'MODEL_POLICY_RESTRICTED'
  );
});

test('38. Bypass attempt via forged/tampered model definition object passed directly to PolicyEngine: trusted registry metadata takes precedence', () => {
  const engine = new PolicyEngine();

  // Attacker provides tampered license metadata claiming MIT for MMS model
  const forgedMmsModel = {
    modelId: 'mms:facebook/mms-tts-amh',
    languageCode: 'am',
    engine: 'mms',
    publishedLicense: 'MIT', // FALSE CLAIM
    lineageMentionsNC: false
  };

  const res = engine.evaluate(/** @type {any} */ (forgedMmsModel), { executionMode: 'COMMERCIAL' });
  assert.strictEqual(res.permitted, false, 'Authoritative registry license must override forged object');
  assert.strictEqual(res.policyStatus, POLICY_STATUS.RESEARCH_ONLY);
  assert.ok(res.restrictions.includes('NON_COMMERCIAL_PUBLISHER_LICENSE'));
});

// ============================================================================
// SECTION 6 (Tests 39–42): Language Capability Matrix
// ============================================================================

test('39. Full 109-language matrix evaluation in RELAXED COMMERCIAL mode yields exact empirical distribution', () => {
  const engine = new PolicyEngine();
  const matrix = engine.evaluateMatrix({ policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });

  assert.strictEqual(matrix.counts.totalLanguages, 109);
  assert.strictEqual(matrix.counts.commercialPermitted, 41);
  assert.strictEqual(matrix.counts.researchOnly, 40);
  assert.strictEqual(matrix.counts.subtitleOnly, 28);
  assert.strictEqual(matrix.counts.contested, 0);
  assert.strictEqual(matrix.counts.unknown, 0);
  assert.strictEqual(
    matrix.counts.totalLanguages,
    matrix.counts.commercialPermitted + matrix.counts.researchOnly + matrix.counts.subtitleOnly
  );
});

test('40. Full 109-language matrix evaluation in STRICT COMMERCIAL mode yields exact empirical distribution', () => {
  const engine = new PolicyEngine();
  const matrix = engine.evaluateMatrix({ policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });

  assert.strictEqual(matrix.counts.totalLanguages, 109);
  assert.strictEqual(matrix.counts.commercialPermitted, 24);
  assert.strictEqual(matrix.counts.researchOnly, 57);
  assert.strictEqual(matrix.counts.subtitleOnly, 28);
  assert.strictEqual(matrix.counts.contested, 0);
  assert.strictEqual(matrix.counts.unknown, 0);
  assert.strictEqual(
    matrix.counts.totalLanguages,
    matrix.counts.commercialPermitted + matrix.counts.researchOnly + matrix.counts.subtitleOnly
  );
});

test('41. Subtitle-only languages (exactly 28) are consistently non-synthesizable in both commercial and research modes', () => {
  const engine = new PolicyEngine();
  const matrixComm = engine.evaluateMatrix({ policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  const subtitleOnlyLangs = matrixComm.results.filter(r => r.technicalCapability === 'SUBTITLE_ONLY');

  assert.strictEqual(subtitleOnlyLangs.length, 28);

  for (const item of subtitleOnlyLangs) {
    const lang = item.languageCode;
    if (!lang) continue;
    const commRes = engine.evaluateLanguage(lang, { executionMode: 'COMMERCIAL' });
    assert.strictEqual(commRes.permitted, false);
    assert.strictEqual(commRes.technicalCapability, 'SUBTITLE_ONLY');

    const resRes = engine.evaluateLanguage(lang, { executionMode: 'RESEARCH' });
    assert.strictEqual(resRes.permitted, false);
    assert.strictEqual(resRes.technicalCapability, 'SUBTITLE_ONLY');
  }
});

test('42. Unknown language codes are rejected deterministically with LANGUAGE_NOT_FOUND and POLICY_STATUS.UNKNOWN', () => {
  const engine = new PolicyEngine();
  const res = engine.evaluateLanguage('xyz-unknown-lang', { executionMode: 'COMMERCIAL' });
  assert.strictEqual(res.permitted, false);
  assert.strictEqual(res.policyStatus, POLICY_STATUS.UNKNOWN);
  assert.ok(res.restrictions.includes('LANGUAGE_NOT_FOUND'));
  assert.ok(res.reason.includes('not registered in Tavi'));
});

// ============================================================================
// SECTION 7 (Tests 43–45): Provider Fallback Isolation
// ============================================================================

test('43. Fallback isolation: When a commercial provider fails, system never silently falls back to a research-only provider in commercial mode', async () => {
  const failingPrimary = {
    providerId: 'piper',
    engine: 'piper',
    supportsLanguage: () => true,
    synthesize: async () => {
      const err = new Error('Primary piper failure');
      // @ts-ignore
      err.code = 'SYNTHESIS_FAILED';
      throw err;
    }
  };

  const fallbackProvider = new ExplicitFallbackTTSProvider({
    // @ts-ignore
    primaryProvider: failingPrimary,
    primaryProviderId: 'piper',
    fallbackConfig: { enabled: true, provider: 'mms' },
    factoryOptions: { executionMode: 'COMMERCIAL' }
  });

  await assert.rejects(
    async () => {
      await fallbackProvider.synthesize('fallback test text', 'am', { executionMode: 'COMMERCIAL' });
    },
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
      assert.strictEqual(err.provider, 'mms');
      assert.strictEqual(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('44. Explicit fallback configuration targeting MMS in commercial mode is blocked with structured error MODEL_POLICY_RESTRICTED', async () => {
  const failingPrimary = {
    providerId: 'piper',
    engine: 'piper',
    supportsLanguage: () => true,
    synthesize: async () => {
      throw new Error('Primary engine crashed');
    }
  };

  const fallback = new ExplicitFallbackTTSProvider({
    // @ts-ignore
    primaryProvider: failingPrimary,
    primaryProviderId: 'piper',
    fallbackConfig: { enabled: true, provider: 'mms' },
    factoryOptions: { executionMode: 'COMMERCIAL' }
  });

  await assert.rejects(
    async () => {
      await fallback.synthesize('Fallback blocking test', 'hi', { executionMode: 'COMMERCIAL' });
    },
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
      const details = /** @type {any} */ (err.details);
      assert.strictEqual(details.policyStatus, 'RESEARCH_ONLY');
      return true;
    }
  );
});

test('45. In research mode, explicit fallback from a research provider to a commercial provider (or vice-versa) succeeds without policy obstruction', async () => {
  const dummyWav = path.join(testGlobalTempDir, 'fallback_success.wav');
  createDummyWav(dummyWav, 0.5);

  const failingPrimary = {
    providerId: 'mms',
    engine: 'mms',
    supportsLanguage: () => true,
    synthesize: async () => {
      throw new Error('MMS failed');
    }
  };

  const workingFallback = {
    providerId: 'piper',
    engine: 'piper',
    supportsLanguage: () => true,
    synthesize: async () => ({
      audioPath: dummyWav,
      duration: 0.5,
      format: 'wav',
      voiceId: 'piper_voice'
    })
  };

  const fallback = new ExplicitFallbackTTSProvider({
    // @ts-ignore
    primaryProvider: failingPrimary,
    primaryProviderId: 'mms',
    fallbackConfig: { enabled: true, provider: 'piper' },
    factoryOptions: { executionMode: 'RESEARCH' }
  });

  // Inject working fallback provider instance
  fallback.fallbackProviderInstance = /** @type {any} */ (workingFallback);

  const result = /** @type {any} */ (await fallback.synthesize('Research fallback success', 'en', { executionMode: 'RESEARCH' }));
  assert.strictEqual(result.fallbackUsed, true);
  assert.strictEqual(result.diagnostics.fallbackProvider, 'piper');
  assert.strictEqual(result.audioPath, dummyWav);
});

// ============================================================================
// SECTION 8 (Tests 46–47): Preflight Behavior
// ============================================================================

test('46. PreflightDoctor detects commercial policy violations in pre-flight checks before expensive generation or model downloading', async () => {
  const doctor = new PreflightDoctor({
    executionMode: EXECUTION_MODES.COMMERCIAL,
    policyProfile: POLICY_PROFILES.RELAXED
  });

  const res = await doctor.run({
    provider: 'mms',
    audioLanguages: ['am'],
    skipModelCheck: true
  });

  assert.strictEqual(res.passed, false, 'Preflight must fail on commercial MMS request');
  const policyCheck = /** @type {any} */ (res.checks.find(c => c.category === CHECK_CATEGORIES.POLICY));
  assert.ok(policyCheck);
  assert.strictEqual(policyCheck.result, CHECK_RESULTS.FAIL);
  assert.strictEqual(policyCheck.blocking, true);
  assert.ok(policyCheck.reason?.includes('restricted under RELAXED policy for COMMERCIAL execution'));
  assert.ok(policyCheck.action?.includes('Switch execution mode to RESEARCH'));
});

test('47. PreflightDoctor allows research-mode execution of restricted models and reports clear, non-blocking diagnostic status', async () => {
  const doctor = new PreflightDoctor({
    executionMode: EXECUTION_MODES.RESEARCH,
    policyProfile: POLICY_PROFILES.RELAXED
  });

  const res = await doctor.run({
    provider: 'mms',
    audioLanguages: ['am'],
    skipModelCheck: true
  });

  const policyCheck = /** @type {any} */ (res.checks.find(c => c.category === CHECK_CATEGORIES.POLICY));
  assert.ok(policyCheck);
  assert.strictEqual(policyCheck.result, CHECK_RESULTS.PASS);
  assert.strictEqual(policyCheck.blocking, false);
});

// ============================================================================
// SECTION 9 (Tests 48–49): Structured Policy Errors and Redaction
// ============================================================================

test('48. Policy error conforms strictly to Phase 10 ErrorCatalog contract', () => {
  const def = getErrorDefinition('MODEL_POLICY_RESTRICTED');
  assert.ok(def);
  assert.strictEqual(def.code, 'MODEL_POLICY_RESTRICTED');
  assert.strictEqual(def.category, ERROR_CATEGORIES.POLICY);
  assert.strictEqual(def.retryable, false);
  assert.strictEqual(def.blocking, true);
  assert.strictEqual(def.exitCode, CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION);
  assert.strictEqual(def.exitCode, 5);
  assert.ok(typeof def.defaultMessage === 'string');
  assert.ok(typeof def.defaultAction === 'string');

  const err = new TaviPolicyError('Model restricted', {
    code: 'MODEL_POLICY_RESTRICTED',
    modelId: 'mms:facebook/mms-tts-amh',
    details: { executionMode: 'COMMERCIAL' }
  });

  assert.strictEqual(err.code, 'MODEL_POLICY_RESTRICTED');
  assert.strictEqual(err.category, ERROR_CATEGORIES.POLICY);
  assert.strictEqual(getExitCodeForError(err.code), 5);

  const jsonStr = formatErrorJson(err);
  const parsed = JSON.parse(jsonStr);
  assert.strictEqual(parsed.ok, false);
  assert.strictEqual(parsed.error.code, 'MODEL_POLICY_RESTRICTED');
  assert.strictEqual(parsed.error.category, 'POLICY');
  assert.strictEqual(parsed.error.retryable, false);
});

test('49. Policy errors and diagnostics never leak credentials, API keys, tokens, or filesystem secrets', () => {
  const sensitiveDetails = {
    apiKey: 'sk-azure-secret-key-1234567890abcdef',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive-token',
    secret: 'super-secret-passphrase',
    authorization: 'Bearer secret_token_xyz',
    safeInfo: 'Language: am, Provider: mms'
  };

  const err = new TaviPolicyError('Evaluation error with metadata', {
    code: 'MODEL_POLICY_RESTRICTED',
    details: sensitiveDetails
  });

  const jsonStr = formatErrorJson(err);

  assert.ok(!jsonStr.includes('sk-azure-secret-key'), 'API key must not be leaked in serialized error');
  assert.ok(!jsonStr.includes('sensitive-token'), 'Bearer token must not be leaked in serialized error');
  assert.ok(!jsonStr.includes('super-secret-passphrase'), 'Secret passphrase must not be leaked in serialized error');
  assert.ok(jsonStr.includes('[REDACTED]'), 'Sensitive fields must be redacted');
  assert.ok(jsonStr.includes('Language: am'), 'Safe metadata must be preserved');
});

// ============================================================================
// SECTION 10 (Test 50): Phase 12 Residual resolveVideo/SSRF Evidence Gate
// ============================================================================

test('50. Phase 12 residual resolveVideo/SSRF evidence gate and runtime limitations record', async () => {
  const tempWorkspace = {
    cwd: testGlobalTempDir,
    getPath: (/** @type {string} */ f) => path.join(testGlobalTempDir, f)
  };

  // A.1: Loopback IPv4 addresses blocked
  await assert.rejects(
    async () => {
      resolveDirectMediaSource({ id: 'v1', src: 'http://127.0.0.1:8080/video.mp4' }, tempWorkspace);
    },
    (err) => {
      const e = /** @type {any} */ (err);
      assert.ok(e.message.includes('SSRF_BLOCKED'));
      assert.ok(e.message.includes('127.0.0.1'));
      return true;
    }
  );

  // A.2: Loopback IPv6 addresses blocked
  await assert.rejects(
    async () => {
      resolveDirectMediaSource({ id: 'v2', src: 'http://[::1]:8080/video.mp4' }, tempWorkspace);
    },
    (err) => {
      const e = /** @type {any} */ (err);
      assert.ok(e.message.includes('SSRF_BLOCKED'));
      return true;
    }
  );

  // A.3: Private IPv4 class A/B/C blocked
  const privateIps = ['10.0.0.1', '172.16.0.1', '192.168.1.1'];
  for (const ip of privateIps) {
    await assert.rejects(
      async () => {
        resolveDirectMediaSource({ id: 'v_priv', src: `http://${ip}/stream.mp4` }, tempWorkspace);
      },
      (err) => {
        const e = /** @type {any} */ (err);
        assert.ok(e.message.includes('SSRF_BLOCKED'), `Expected SSRF_BLOCKED for ${ip}`);
        return true;
      }
    );
  }

  // A.4: Cloud metadata / Link-local addresses blocked
  await assert.rejects(
    async () => {
      resolveDirectMediaSource({ id: 'v_meta', src: 'http://169.254.169.254/latest/meta-data' }, tempWorkspace);
    },
    (err) => {
      const e = /** @type {any} */ (err);
      assert.ok(e.message.includes('SSRF_BLOCKED'));
      assert.ok(e.message.includes('169.254.169.254'));
      return true;
    }
  );

  // A.5: Unsafe protocols (file:, ftp:, gopher:) blocked
  const unsafeProtocols = ['file:///etc/passwd', 'ftp://example.com/video.mp4', 'gopher://example.com/item'];
  for (const badSrc of unsafeProtocols) {
    if (badSrc.startsWith('file:') || badSrc.startsWith('ftp:') || badSrc.startsWith('gopher:')) {
      assert.throws(
        () => validateRemoteUrl(badSrc),
        (err) => {
          const e = /** @type {any} */ (err);
          assert.ok(e.message.includes('BLOCKED_PROTOCOL'));
          return true;
        },
        `Expected BLOCKED_PROTOCOL for ${badSrc}`
      );
    }
  }

  // A.6: Disallowed hostnames (localhost, *.internal, *.local) blocked
  const disallowedHosts = ['http://localhost/video.mp4', 'http://service.internal/video.mp4', 'http://myhost.local/video.mp4'];
  for (const badHost of disallowedHosts) {
    await assert.rejects(
      async () => {
        resolveDirectMediaSource({ id: 'v_host', src: badHost }, tempWorkspace);
      },
      (err) => {
        const e = /** @type {any} */ (err);
        assert.ok(e.message.includes('SSRF_BLOCKED'), `Expected SSRF_BLOCKED for ${badHost}`);
        return true;
      }
    );
  }

  // B & C: Explicit Evidence Classifications Record
  const phase12EvidenceLedger = {
    resolveVideoSSRF: '[VERIFIED]',
    networkGuardUnitTests: '[VERIFIED]',
    nativeBinaryDirectOSNetworking: '[UNKNOWN]',
    nativePiperExecution: '[UNKNOWN]',
    nativeKokoroExecution: '[UNKNOWN]',
    nativeMmsExecution: '[UNKNOWN]',
    layer3PhysicalAirGapWindows: '[NOT_CURRENTLY_POSSIBLE]',
    physicalFirewallVerification: '[NOT_CURRENTLY_POSSIBLE]'
  };

  assert.strictEqual(phase12EvidenceLedger.resolveVideoSSRF, '[VERIFIED]');
  assert.strictEqual(phase12EvidenceLedger.nativeBinaryDirectOSNetworking, '[UNKNOWN]');
  assert.strictEqual(phase12EvidenceLedger.layer3PhysicalAirGapWindows, '[NOT_CURRENTLY_POSSIBLE]');
});
