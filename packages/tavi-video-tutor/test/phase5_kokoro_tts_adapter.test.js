import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  KokoroTTSAdapter,
  KokoroError,
  findKokoroRuntime,
  verifyKokoroRuntime,
  validateWavOutput
} from '../src/subtitles/tts/KokoroTTSAdapter.js';
import { ModelRegistry, getModel } from '../src/subtitles/models/modelRegistry.js';
import { ModelCacheManager, CACHE_STATUS } from '../src/subtitles/cache/ModelCacheManager.js';

let tempDir;
let fakeExecutablePath;

/**
 * Creates a valid canonical PCM WAV Buffer of specified sample rate and duration.
 */
function createValidWavBuffer({ sampleRate = 24000, channels = 1, bitsPerSample = 16, durationSec = 1.0 } = {}) {
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
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-kokoro-test-'));
  // Create a dummy executable file for runner mocking
  fakeExecutablePath = path.join(tempDir, process.platform === 'win32' ? 'kokoro.exe' : 'kokoro');
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

test('1. Correct provider ID', () => {
  const adapter = new KokoroTTSAdapter();
  assert.equal(adapter.providerId, 'kokoro');
});

test('2. Correct engine metadata', () => {
  const adapter = new KokoroTTSAdapter();
  assert.equal(adapter.engine, 'kokoro');
});

test('3. Kokoro model resolves from ModelRegistry', () => {
  const adapter = new KokoroTTSAdapter();

  // All 8 Kokoro canonical models must resolve
  const expectedLangs = ['zh', 'en', 'es', 'fr', 'hi', 'it', 'ja', 'pt'];
  for (const lang of expectedLangs) {
    const model = adapter.resolveKokoroModel(lang);
    assert.ok(model, `Canonical model for ${lang} must resolve`);
    assert.equal(model.engine, 'kokoro');
    assert.equal(model.sampleRate, 24000);
    assert.equal(adapter.supportsLanguage(lang), true);
  }

  // Explicit model resolution
  const specific = adapter.resolveKokoroModel('en', { modelId: 'kokoro:en_US-bryce' });
  assert.ok(specific);
  assert.equal(specific.modelId, 'kokoro:en_US-bryce');
});

test('4. Unknown model fails deterministically', () => {
  const adapter = new KokoroTTSAdapter();

  assert.throws(
    () => adapter.resolveKokoroModel('en', { modelId: 'kokoro:nonexistent-voice' }),
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'MODEL_NOT_FOUND');
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );

  // Piper model passed to Kokoro adapter must be rejected
  assert.throws(
    () => adapter.resolveKokoroModel('en', { modelId: 'piper:en_US-lessac-medium' }),
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'MODEL_NOT_FOUND');
      return true;
    }
  );
});

test('5. Unsupported language fails deterministically', () => {
  const adapter = new KokoroTTSAdapter();

  // 'de' (German) has Piper models but no Kokoro models in registry
  assert.equal(adapter.supportsLanguage('de'), false);
  assert.throws(
    () => adapter.resolveKokoroModel('de'),
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'UNSUPPORTED_LANGUAGE');
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );

  // 'zgh' (subtitle only) has no Kokoro model
  assert.equal(adapter.supportsLanguage('zgh'), false);
  assert.throws(
    () => adapter.resolveKokoroModel('zgh'),
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'UNSUPPORTED_LANGUAGE');
      return true;
    }
  );
});

test('6. Missing runtime produces ENGINE_NOT_FOUND', async () => {
  const nonExistentPath = path.join(tempDir, 'does-not-exist', 'kokoro.exe');
  const adapter = new KokoroTTSAdapter({
    executablePath: nonExistentPath
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'en');
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'ENGINE_NOT_FOUND');
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('7. Missing model in offline mode produces MODEL_NOT_CACHED', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'empty-cache') });
  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'en', { offline: true });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'MODEL_NOT_CACHED');
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      assert.ok(err.message.includes('offline mode'));
      return true;
    }
  );
});

test('8. Corrupt model is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'corrupt-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  assert.ok(modelDef);

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  fs.writeFileSync(targetFile, 'corrupt-model-bytes-that-fail-size-and-checksum');

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'en', {
        modelId: 'kokoro:en_US-bryce',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'MODEL_CHECKSUM_MISMATCH');
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('9. Valid cached model reaches Kokoro runtime', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'valid-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  assert.ok(modelDef);

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  fs.writeFileSync(targetFile, Buffer.alloc(modelDef.sizeBytes || 1024));

  let runnerCalled = false;
  let runnerParams = null;

  const mockRunner = async (params) => {
    runnerCalled = true;
    runnerParams = params;
    const wavBuf = createValidWavBuffer({ sampleRate: 24000, durationSec: 1.5 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 140 };
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  const result = await adapter.synthesize('Testing Kokoro valid synthesis', 'en', {
    modelId: 'kokoro:en_US-bryce',
    offline: true
  });

  assert.equal(runnerCalled, true);
  assert.ok(runnerParams);
  assert.equal(runnerParams.runtimePath, fakeExecutablePath);
  assert.equal(runnerParams.text, 'Testing Kokoro valid synthesis');

  assert.equal(result.providerId, 'kokoro');
  assert.equal(result.engine, 'kokoro');
  assert.equal(result.modelId, 'kokoro:en_US-bryce');
  assert.equal(result.sampleRate, 24000);
  assert.ok(result.duration > 1.0);
  assert.equal(result.format, 'wav');
  assert.ok(fs.existsSync(result.audioPath));
});

test('10. Safe runtime argument/input handling', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'arg-test-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  fs.writeFileSync(targetFile, Buffer.alloc(modelDef.sizeBytes || 1024));

  let capturedArgs = null;
  const mockRunner = async (params) => {
    capturedArgs = params.args;
    const wavBuf = createValidWavBuffer({ sampleRate: 24000 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 50 };
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  await adapter.synthesize('Argument safety check', 'en', {
    modelId: 'kokoro:en_US-bryce',
    speed: 1.2,
    offline: true
  });

  assert.ok(Array.isArray(capturedArgs), 'Arguments must be an argv array');
  assert.ok(capturedArgs.includes('--model'));
  assert.ok(capturedArgs.includes(targetFile));
  assert.ok(capturedArgs.includes('--output_file'));
  assert.ok(capturedArgs.includes('--voice'));
  assert.ok(capturedArgs.includes('kokoro:en_US-bryce'));
  assert.ok(capturedArgs.includes('--speed'));
  assert.ok(capturedArgs.includes('1.2'));
});

test('11. Unicode text handling across English, Spanish, Hindi, Japanese, Chinese', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'unicode-cache') });

  const testCases = [
    { lang: 'en', modelId: 'kokoro:en_US-bryce', text: 'Hello world, this is a test.' },
    { lang: 'es', modelId: 'kokoro:es_ES-carlfm', text: 'Hola mundo, esta es una prueba.' },
    { lang: 'hi', modelId: 'kokoro:hf_alpha', text: 'नमस्ते दुनिया, यह एक परीक्षण है।' },
    { lang: 'ja', modelId: 'kokoro:jf_alpha', text: 'こんにちは世界、これはテストです。' },
    { lang: 'zh', modelId: 'kokoro:zh_CN-huayan', text: '你好，世界，这是一个测试。' }
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
      const wavBuf = createValidWavBuffer({ sampleRate: 24000 });
      fs.writeFileSync(params.outputPath, wavBuf);
      return { exitCode: 0, durationMs: 40 };
    };

    const adapter = new KokoroTTSAdapter({
      executablePath: fakeExecutablePath,
      cacheManager,
      runtimeRunner: mockRunner
    });

    await adapter.synthesize(tc.text, tc.lang, { modelId: tc.modelId, offline: true });

    assert.equal(receivedText, tc.text, `Unicode text for ${tc.lang} must be preserved exactly`);
  }
});

test('12. Runtime failure produces ENGINE_EXECUTION_FAILED', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'failure-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const failingRunner = async () => {
    throw new KokoroError('ENGINE_EXECUTION_FAILED', 'Kokoro runtime process exited with code 1: internal error', {
      exitCode: 1,
      stderr: 'internal error'
    });
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: failingRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test crash', 'en', {
        modelId: 'kokoro:en_US-bryce',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'ENGINE_EXECUTION_FAILED');
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      assert.ok(err.message.includes('internal error'));
      return true;
    }
  );
});

test('13. Runtime timeout produces deterministic timeout error', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'timeout-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const timeoutRunner = async (params) => {
    throw new KokoroError('ENGINE_TIMEOUT', `Kokoro runtime process timed out after ${params.timeoutMs}ms.`, {
      timeoutMs: params.timeoutMs
    });
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: timeoutRunner,
    timeoutMs: 2000
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test timeout', 'en', {
        modelId: 'kokoro:en_US-bryce',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'ENGINE_TIMEOUT');
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      assert.equal(err.details.timeoutMs, 2000);
      return true;
    }
  );
});

test('14. Invalid generated audio is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'invalid-audio-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const garbageRunner = async (params) => {
    fs.writeFileSync(params.outputPath, Buffer.from('NOT_A_WAV_FILE_GARBAGE_BYTES_EXCEEDING_44_BYTES_LENGTH_1234567890'));
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: garbageRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test invalid audio', 'en', {
        modelId: 'kokoro:en_US-bryce',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('not a valid RIFF/WAVE container'));
      return true;
    }
  );

  // Mismatched sample rate check
  const wrongRateRunner = async (params) => {
    const wavBuf = createValidWavBuffer({ sampleRate: 16000 }); // Kokoro expects 24000
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter2 = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: wrongRateRunner
  });

  await assert.rejects(
    async () => {
      await adapter2.synthesize('Test wrong sample rate', 'en', {
        modelId: 'kokoro:en_US-bryce',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('does not match expected model rate'));
      return true;
    }
  );
});

test('15. Empty generated audio is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'empty-audio-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const emptyRunner = async (params) => {
    fs.writeFileSync(params.outputPath, Buffer.alloc(0));
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: emptyRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test empty audio', 'en', {
        modelId: 'kokoro:en_US-bryce',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('too small or truncated'));
      return true;
    }
  );
});

test('16. No Piper fallback', async () => {
  const adapter = new KokoroTTSAdapter({
    executablePath: '/invalid/path/kokoro'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof KokoroError);
    assert.equal(err.provider, 'kokoro');
    assert.notEqual(err.provider, 'piper');
    assert.equal(err.fallbackAttempted, false);
  }
});

test('17. No Edge fallback', async () => {
  const adapter = new KokoroTTSAdapter({
    executablePath: '/invalid/path/kokoro'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof KokoroError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'edge');
  }
});

test('18. No Google fallback', async () => {
  const adapter = new KokoroTTSAdapter({
    executablePath: '/invalid/path/kokoro'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof KokoroError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'google');
  }
});

test('19. No Azure fallback', async () => {
  const adapter = new KokoroTTSAdapter({
    executablePath: '/invalid/path/kokoro'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof KokoroError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'azure');
  }
});

test('20. No NodeTTS fallback', async () => {
  const adapter = new KokoroTTSAdapter({
    executablePath: '/invalid/path/kokoro'
  });

  try {
    await adapter.synthesize('Hello', 'en', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof KokoroError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'node');
  }
});

test('21. No network access in offline mode', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'offline-network-test') });

  let ensureModelCalled = false;
  const originalEnsureModel = cacheManager.ensureModel.bind(cacheManager);
  cacheManager.ensureModel = async (...args) => {
    ensureModelCalled = true;
    return originalEnsureModel(...args);
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Testing offline constraint', 'en', { offline: true });
    },
    (err) => {
      assert.ok(err instanceof KokoroError);
      assert.equal(err.code, 'MODEL_NOT_CACHED');
      return true;
    }
  );

  assert.equal(ensureModelCalled, false, 'ensureModel must NOT be called in offline mode for uncached model');
});

test('22. ModelRegistry remains unchanged', () => {
  const countBefore = ModelRegistry.getAllModels().length;
  const canonicalEnBefore = ModelRegistry.getCanonicalModel('en', 'kokoro');

  const adapter = new KokoroTTSAdapter();
  adapter.supportsLanguage('en');
  adapter.supportsLanguage('zh');
  adapter.supportsLanguage('de');
  adapter.resolveKokoroModel('en');
  adapter.resolveKokoroModel('zh');

  const countAfter = ModelRegistry.getAllModels().length;
  const canonicalEnAfter = ModelRegistry.getCanonicalModel('en', 'kokoro');

  assert.equal(countAfter, countBefore, 'Model count in registry must not change');
  assert.deepEqual(canonicalEnAfter, canonicalEnBefore, 'Canonical model mapping must not mutate');
});

test('23. PolicyEngine is not modified or bypassed', () => {
  const adapter = new KokoroTTSAdapter();
  // Adapter must not embed commercial policy filtering or enforce Policy A/B directly
  assert.equal(adapter.policyProfile, undefined);
  assert.equal(adapter.policyEngine, undefined);
});

test('24. Provider result matches existing TTS contract', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'contract-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const mockRunner = async (params) => {
    const wavBuf = createValidWavBuffer({ sampleRate: 24000, durationSec: 2.0 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 100 };
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  const res = await adapter.synthesize('Contract verification', 'en', {
    modelId: 'kokoro:en_US-bryce',
    offline: true
  });

  assert.equal(typeof res.audioPath, 'string');
  assert.equal(typeof res.duration, 'number');
  assert.equal(res.format, 'wav');
  assert.equal(res.voiceId, 'kokoro:en_US-bryce');
  assert.equal(res.providerId, 'kokoro');
  assert.equal(res.engine, 'kokoro');
  assert.equal(res.modelId, 'kokoro:en_US-bryce');
  assert.equal(res.languageCode, 'en');
  assert.equal(res.sampleRate, 24000);
  assert.equal(res.channels, 1);
});

test('25. Repeated identical requests are deterministic', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'determinism-cache') });
  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  let callCount = 0;
  const mockRunner = async (params) => {
    callCount++;
    const wavBuf = createValidWavBuffer({ sampleRate: 24000, durationSec: 1.2 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 50 };
  };

  const adapter = new KokoroTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  const res1 = await adapter.synthesize('Deterministic test', 'en', {
    modelId: 'kokoro:en_US-bryce',
    offline: true
  });

  const res2 = await adapter.synthesize('Deterministic test', 'en', {
    modelId: 'kokoro:en_US-bryce',
    offline: true
  });

  assert.equal(callCount, 2);
  assert.equal(res1.providerId, res2.providerId);
  assert.equal(res1.engine, res2.engine);
  assert.equal(res1.modelId, res2.modelId);
  assert.equal(res1.sampleRate, res2.sampleRate);
  assert.equal(res1.duration, res2.duration);
  // Session cache should have captured the model key
  assert.ok(adapter.sessionCache.has('kokoro:en_US-bryce'));
});

// Environment-dependent real runtime verification (Tests 26-28)
test('26. Real Kokoro synthesis (environment-dependent)', async (t) => {
  const runtime = findKokoroRuntime();
  if (!runtime || !verifyKokoroRuntime(runtime)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real Kokoro runtime not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Kokoro model kokoro:en_US-bryce not cached locally');
    return;
  }

  const adapter = new KokoroTTSAdapter({ executablePath: runtime, cacheManager });
  const result = await adapter.synthesize('Real Kokoro synthesis test.', 'en', {
    modelId: 'kokoro:en_US-bryce',
    offline: true
  });

  assert.ok(result.audioPath);
  assert.ok(fs.existsSync(result.audioPath));
  assert.ok(result.duration > 0);
  assert.equal(result.providerId, 'kokoro');
});

test('27. Real audio duration measurement (environment-dependent)', async (t) => {
  const runtime = findKokoroRuntime();
  if (!runtime || !verifyKokoroRuntime(runtime)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real Kokoro runtime not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Kokoro model kokoro:en_US-bryce not cached locally');
    return;
  }

  const adapter = new KokoroTTSAdapter({ executablePath: runtime, cacheManager });
  const result = await adapter.synthesize('Real Kokoro duration measurement.', 'en', {
    modelId: 'kokoro:en_US-bryce',
    offline: true
  });

  assert.ok(typeof result.duration === 'number');
  assert.ok(result.duration > 0.1, `Expected duration > 0.1s, got ${result.duration}s`);
});

test('28. Real sample-rate validation (environment-dependent)', async (t) => {
  const runtime = findKokoroRuntime();
  if (!runtime || !verifyKokoroRuntime(runtime)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real Kokoro runtime not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('kokoro:en_US-bryce');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Kokoro model kokoro:en_US-bryce not cached locally');
    return;
  }

  const adapter = new KokoroTTSAdapter({ executablePath: runtime, cacheManager });
  const result = await adapter.synthesize('Real Kokoro sample rate validation.', 'en', {
    modelId: 'kokoro:en_US-bryce',
    offline: true
  });

  assert.equal(result.sampleRate, 24000);
});
