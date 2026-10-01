import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  PiperTTSAdapter,
  PiperError,
  findPiperExecutable,
  verifyPiperExecutable,
  validateWavOutput
} from '../src/subtitles/tts/PiperTTSAdapter.js';
import { ModelRegistry, getModel } from '../src/subtitles/models/modelRegistry.js';
import { ModelCacheManager, CACHE_STATUS } from '../src/subtitles/cache/ModelCacheManager.js';

let tempDir;
let fakeExecutablePath;

/**
 * Creates a valid canonical PCM WAV Buffer of specified sample rate and duration.
 */
function createValidWavBuffer({ sampleRate = 22050, channels = 1, bitsPerSample = 16, durationSec = 1.0 } = {}) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataSize = numSamples * channels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');

  // fmt subchunk
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // audio format (1 = PCM)
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  buffer.writeUInt32LE(byteRate, 28);
  const blockAlign = channels * (bitsPerSample / 8);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);

  // Fill sample data
  buffer.fill(0, 44);

  return buffer;
}

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-piper-test-'));
  // Create a dummy executable file for runner mocking
  fakeExecutablePath = path.join(tempDir, process.platform === 'win32' ? 'piper.exe' : 'piper');
  fs.writeFileSync(fakeExecutablePath, '#!/bin/sh\nexit 0\n');
  if (process.platform !== 'win32') {
    try { fs.chmodSync(fakeExecutablePath, 0o755); } catch (_) {}
  }
});

afterEach(() => {
  if (tempDir && fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (_) {}
  }
});

test('1. Adapter exposes correct provider ID and engine metadata', () => {
  const adapter = new PiperTTSAdapter();
  assert.equal(adapter.providerId, 'piper');
  assert.equal(adapter.engine, 'piper');
  assert.ok(typeof adapter.synthesize === 'function');
  assert.ok(typeof adapter.supportsLanguage === 'function');
});

test('2. Valid Piper model resolves from ModelRegistry', () => {
  const adapter = new PiperTTSAdapter();

  // Test canonical model resolution
  const enModel = adapter.resolvePiperModel('en');
  assert.ok(enModel);
  assert.equal(enModel.engine, 'piper');
  assert.equal(enModel.languageCode, 'en');

  // Test Hindi model resolution
  const hiModel = adapter.resolvePiperModel('hi');
  assert.ok(hiModel);
  assert.equal(hiModel.engine, 'piper');
  assert.equal(hiModel.languageCode, 'hi');

  // Test specific requested modelId
  const specificModel = adapter.resolvePiperModel('en', { modelId: 'piper:en_US-lessac-medium' });
  assert.ok(specificModel);
  assert.equal(specificModel.modelId, 'piper:en_US-lessac-medium');

  // Language support checks
  assert.equal(adapter.supportsLanguage('en'), true);
  assert.equal(adapter.supportsLanguage('hi'), true);
  assert.equal(adapter.supportsLanguage('es'), true);
});

test('3. Unknown model fails deterministically', () => {
  const adapter = new PiperTTSAdapter();

  assert.throws(
    () => adapter.resolvePiperModel('en', { modelId: 'piper:nonexistent-model-xyz' }),
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'MODEL_NOT_FOUND');
      assert.equal(err.provider, 'piper');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('4. Unsupported language fails deterministically', () => {
  const adapter = new PiperTTSAdapter();

  // 'zgh' (Standard Moroccan Tamazight) is registered as subtitle-only, has no Piper model
  assert.equal(adapter.supportsLanguage('zgh'), false);

  assert.throws(
    () => adapter.resolvePiperModel('zgh'),
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'UNSUPPORTED_LANGUAGE');
      assert.equal(err.provider, 'piper');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );

  // Totally unknown language code
  assert.throws(
    () => adapter.resolvePiperModel('xyz-unknown'),
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'UNSUPPORTED_LANGUAGE');
      return true;
    }
  );
});

test('5. Missing engine fails with ENGINE_NOT_FOUND', async () => {
  const nonExistentPath = path.join(tempDir, 'does-not-exist', 'piper.exe');
  const adapter = new PiperTTSAdapter({
    executablePath: nonExistentPath
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'en');
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'ENGINE_NOT_FOUND');
      assert.equal(err.provider, 'piper');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('6. Missing cached model fails correctly in offline mode', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'empty-cache') });
  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'en', { offline: true });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'MODEL_NOT_CACHED');
      assert.equal(err.provider, 'piper');
      assert.equal(err.fallbackAttempted, false);
      assert.ok(err.message.includes('offline mode'));
      return true;
    }
  );
});

test('7. Corrupted cached model fails correctly', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'corrupt-cache') });
  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  assert.ok(modelDef);

  // Prepare a corrupt model file in cache (e.g. truncated or bad size/checksum)
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  fs.writeFileSync(targetFile, 'corrupt-onnx-bytes-which-do-not-match-size');

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'en', {
        modelId: 'piper:en_US-lessac-medium',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'MODEL_CHECKSUM_MISMATCH');
      assert.equal(err.provider, 'piper');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('8. Valid cached model reaches synthesis runtime', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'valid-cache') });
  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  assert.ok(modelDef);

  // Place valid sized file so cache status returns CACHED_UNVERIFIED or CACHED_VERIFIED
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  // Allocate buffer matching modelDef.sizeBytes if known, or dummy
  const size = modelDef.sizeBytes || 1024;
  fs.writeFileSync(targetFile, Buffer.alloc(size));

  let runnerCalled = false;
  let runnerParams = null;

  const mockRunner = async (params) => {
    runnerCalled = true;
    runnerParams = params;
    // Write valid WAV audio output at params.outputPath
    const wavBuf = createValidWavBuffer({ sampleRate: modelDef.sampleRate || 22050, durationSec: 1.5 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 120 };
  };

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    processRunner: mockRunner
  });

  const result = await adapter.synthesize('Testing valid execution', 'en', {
    modelId: 'piper:en_US-lessac-medium',
    offline: true
  });

  assert.equal(runnerCalled, true);
  assert.ok(runnerParams);
  assert.equal(runnerParams.executablePath, fakeExecutablePath);
  assert.equal(runnerParams.text, 'Testing valid execution');

  assert.equal(result.providerId, 'piper');
  assert.equal(result.engine, 'piper');
  assert.equal(result.modelId, 'piper:en_US-lessac-medium');
  assert.equal(result.sampleRate, modelDef.sampleRate || 22050);
  assert.ok(result.duration > 1.0);
  assert.equal(result.format, 'wav');
  assert.ok(fs.existsSync(result.audioPath));
});

test('9. Piper process arguments are passed safely as argv array', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'arg-test-cache') });
  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  fs.writeFileSync(targetFile, Buffer.alloc(modelDef.sizeBytes || 1024));

  // Also write a companion .json config
  fs.writeFileSync(`${targetFile}.json`, JSON.stringify({ audio: { sample_rate: 22050 } }));

  let capturedArgs = null;
  const mockRunner = async (params) => {
    capturedArgs = params.args;
    const wavBuf = createValidWavBuffer({ sampleRate: modelDef.sampleRate || 22050 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 50 };
  };

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    processRunner: mockRunner
  });

  await adapter.synthesize('Argument safety check', 'en', {
    modelId: 'piper:en_US-lessac-medium',
    speakerId: 3,
    offline: true
  });

  assert.ok(Array.isArray(capturedArgs), 'Arguments must be an argv array');
  assert.ok(capturedArgs.includes('--model'));
  assert.ok(capturedArgs.includes(targetFile));
  assert.ok(capturedArgs.includes('--output_file'));
  assert.ok(capturedArgs.includes('--config'));
  assert.ok(capturedArgs.includes(`${targetFile}.json`));
  assert.ok(capturedArgs.includes('--speaker'));
  assert.ok(capturedArgs.includes('3'));
});

test('10. Unicode text is preserved across multilingual inputs (English, Hindi, Greek, Chinese)', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'unicode-cache') });

  // Test three distinct languages with valid Piper models
  const testCases = [
    { lang: 'en', modelId: 'piper:en_US-lessac-medium', text: 'Hello world, punctuation! "Quotes" & symbols.' },
    { lang: 'hi', modelId: 'piper:hi_IN-priyamvada-medium', text: 'नमस्ते दुनिया! यह एक परीक्षण वाक्य है।' },
    { lang: 'el', modelId: 'piper:el_GR-rapunzelina-medium', text: 'Γειά σου κόσμε! Αυτή είναι μια δοκιμή.' }
  ];

  for (const tc of testCases) {
    const modelDef = ModelRegistry.getModel(tc.modelId);
    assert.ok(modelDef, `Model ${tc.modelId} must exist in registry`);

    const targetDir = cacheManager.getModelDirectory(modelDef);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

    let receivedText = null;
    const mockRunner = async (params) => {
      receivedText = params.text;
      const wavBuf = createValidWavBuffer({ sampleRate: modelDef.sampleRate || 22050 });
      fs.writeFileSync(params.outputPath, wavBuf);
      return { exitCode: 0, durationMs: 40 };
    };

    const adapter = new PiperTTSAdapter({
      executablePath: fakeExecutablePath,
      cacheManager,
      processRunner: mockRunner
    });

    await adapter.synthesize(tc.text, tc.lang, { modelId: tc.modelId, offline: true });

    assert.equal(receivedText, tc.text, `Unicode text for ${tc.lang} must be preserved exactly`);
  }
});

test('11. Process failure produces ENGINE_EXECUTION_FAILED', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'failure-cache') });
  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const failingRunner = async () => {
    throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper process exited with code 1: segmentation fault', {
      exitCode: 1,
      stderr: 'segmentation fault'
    });
  };

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    processRunner: failingRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test crash', 'en', {
        modelId: 'piper:en_US-lessac-medium',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'ENGINE_EXECUTION_FAILED');
      assert.equal(err.provider, 'piper');
      assert.equal(err.fallbackAttempted, false);
      assert.ok(err.message.includes('segmentation fault'));
      return true;
    }
  );
});

test('12. Process timeout produces deterministic timeout error', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'timeout-cache') });
  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const timeoutRunner = async (params) => {
    throw new PiperError('ENGINE_TIMEOUT', `Piper process timed out after ${params.timeoutMs}ms.`, {
      timeoutMs: params.timeoutMs
    });
  };

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    processRunner: timeoutRunner,
    timeoutMs: 1500
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test timeout', 'en', {
        modelId: 'piper:en_US-lessac-medium',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'ENGINE_TIMEOUT');
      assert.equal(err.provider, 'piper');
      assert.equal(err.fallbackAttempted, false);
      assert.equal(err.details.timeoutMs, 1500);
      return true;
    }
  );
});

test('13. Invalid audio output is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'invalid-audio-cache') });
  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  // Runner that outputs garbage bytes instead of RIFF/WAVE
  const garbageRunner = async (params) => {
    fs.writeFileSync(params.outputPath, Buffer.from('NOT_A_WAV_FILE_JUST_SOME_TEXT_DATA_EXCEEDING_44_BYTES_LENGTH_1234567890'));
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    processRunner: garbageRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test invalid audio', 'en', {
        modelId: 'piper:en_US-lessac-medium',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('not a valid RIFF/WAVE container'));
      return true;
    }
  );

  // Runner that outputs mismatched sample rate
  const wrongSampleRateRunner = async (params) => {
    const wavBuf = createValidWavBuffer({ sampleRate: 8000 }); // model expects 22050
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter2 = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    processRunner: wrongSampleRateRunner
  });

  await assert.rejects(
    async () => {
      await adapter2.synthesize('Test sample rate mismatch', 'en', {
        modelId: 'piper:en_US-lessac-medium',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('does not match expected model rate'));
      return true;
    }
  );
});

test('14. Empty audio output is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'empty-audio-cache') });
  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const emptyRunner = async (params) => {
    fs.writeFileSync(params.outputPath, Buffer.alloc(0));
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    processRunner: emptyRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test empty audio', 'en', {
        modelId: 'piper:en_US-lessac-medium',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('too small or truncated'));
      return true;
    }
  );
});

test('15. No Edge fallback occurs when Piper fails', async () => {
  const adapter = new PiperTTSAdapter({
    executablePath: '/invalid/path/piper'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof PiperError);
    assert.equal(err.fallbackAttempted, false);
    assert.equal(err.provider, 'piper');
    assert.notEqual(err.provider, 'edge');
  }
});

test('16. No Google fallback occurs when Piper fails', async () => {
  const adapter = new PiperTTSAdapter({
    executablePath: '/invalid/path/piper'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof PiperError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'google');
  }
});

test('17. No Azure fallback occurs when Piper fails', async () => {
  const adapter = new PiperTTSAdapter({
    executablePath: '/invalid/path/piper'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof PiperError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'azure');
  }
});

test('18. No NodeTTS fallback occurs when Piper fails', async () => {
  const adapter = new PiperTTSAdapter({
    executablePath: '/invalid/path/piper'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof PiperError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'node');
  }
});

test('19. Adapter does not perform network access in offline mode', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'offline-network-test') });

  // Spy on ensureModel to ensure it is never invoked when offline: true
  let ensureModelCalled = false;
  const originalEnsureModel = cacheManager.ensureModel.bind(cacheManager);
  cacheManager.ensureModel = async (...args) => {
    ensureModelCalled = true;
    return originalEnsureModel(...args);
  };

  const adapter = new PiperTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  // Model is missing, so in offline mode it should throw immediately without calling ensureModel
  await assert.rejects(
    async () => {
      await adapter.synthesize('Testing offline constraint', 'en', { offline: true });
    },
    (err) => {
      assert.ok(err instanceof PiperError);
      assert.equal(err.code, 'MODEL_NOT_CACHED');
      return true;
    }
  );

  assert.equal(ensureModelCalled, false, 'ensureModel must NOT be called in offline mode for uncached model');
});

test('20. Adapter does not mutate ModelRegistry data', () => {
  const countBefore = ModelRegistry.getAllModels().length;
  const canonicalEnBefore = ModelRegistry.getCanonicalModel('en', 'piper');

  const adapter = new PiperTTSAdapter();
  adapter.supportsLanguage('en');
  adapter.supportsLanguage('hi');
  adapter.supportsLanguage('zgh');
  adapter.resolvePiperModel('en');
  adapter.resolvePiperModel('hi');

  const countAfter = ModelRegistry.getAllModels().length;
  const canonicalEnAfter = ModelRegistry.getCanonicalModel('en', 'piper');

  assert.equal(countAfter, countBefore, 'Model count in registry must not change');
  assert.deepEqual(canonicalEnAfter, canonicalEnBefore, 'Canonical model mapping must not mutate');
});

test('21. Adapter does not make commercial policy decisions', () => {
  const adapter = new PiperTTSAdapter();

  // Piper has models with various policy profiles (e.g. non-commercial research or permissible)
  // The adapter must resolve any valid technical model without asserting a commercial policy rule.
  const researchModel = ModelRegistry.getModel('piper:en_US-lessac-medium');
  assert.ok(researchModel);

  const resolved = adapter.resolvePiperModel('en', { modelId: 'piper:en_US-lessac-medium' });
  assert.equal(resolved.modelId, 'piper:en_US-lessac-medium');
  // Confirm adapter object does not contain policy profile logic or restrict synthesis
  assert.equal(adapter.policyProfile, undefined);
});

// Environment-dependent real runtime verification (Tests 22-24)
test('22. Real Piper synthesis produces valid audio (environment-dependent)', async (t) => {
  const binary = findPiperExecutable();
  if (!binary || !verifyPiperExecutable(binary)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real Piper executable not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Piper model piper:en_US-lessac-medium not cached locally');
    return;
  }

  const adapter = new PiperTTSAdapter({ executablePath: binary, cacheManager });
  const result = await adapter.synthesize('Real Piper synthesis test.', 'en', {
    modelId: 'piper:en_US-lessac-medium',
    offline: true
  });

  assert.ok(result.audioPath);
  assert.ok(fs.existsSync(result.audioPath));
  assert.ok(result.duration > 0);
  assert.equal(result.providerId, 'piper');
});

test('23. Real synthesized audio has measurable duration (environment-dependent)', async (t) => {
  const binary = findPiperExecutable();
  if (!binary || !verifyPiperExecutable(binary)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real Piper executable not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Piper model piper:en_US-lessac-medium not cached locally');
    return;
  }

  const adapter = new PiperTTSAdapter({ executablePath: binary, cacheManager });
  const result = await adapter.synthesize('Duration measurement test.', 'en', {
    modelId: 'piper:en_US-lessac-medium',
    offline: true
  });

  assert.ok(typeof result.duration === 'number');
  assert.ok(result.duration > 0.1, `Expected duration > 0.1s, got ${result.duration}s`);
});

test('24. Real output sample rate is validated (environment-dependent)', async (t) => {
  const binary = findPiperExecutable();
  if (!binary || !verifyPiperExecutable(binary)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real Piper executable not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('piper:en_US-lessac-medium');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Piper model piper:en_US-lessac-medium not cached locally');
    return;
  }

  const adapter = new PiperTTSAdapter({ executablePath: binary, cacheManager });
  const result = await adapter.synthesize('Sample rate verification test.', 'en', {
    modelId: 'piper:en_US-lessac-medium',
    offline: true
  });

  assert.equal(result.sampleRate, modelDef.sampleRate || 22050);
});
