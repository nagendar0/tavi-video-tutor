import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  MmsTTSAdapter,
  MmsError,
  findMmsRuntime,
  verifyMmsRuntime,
  validateWavOutput
} from '../src/subtitles/tts/MmsTTSAdapter.js';
import { ModelRegistry, getModel } from '../src/subtitles/models/modelRegistry.js';
import { ModelCacheManager, CACHE_STATUS } from '../src/subtitles/cache/ModelCacheManager.js';
import { PolicyEngine } from '../src/subtitles/policy/PolicyEngine.js';

let tempDir;
let fakeExecutablePath;

/**
 * Creates a valid canonical PCM WAV Buffer of specified sample rate and duration.
 */
function createValidWavBuffer({ sampleRate = 16000, channels = 1, bitsPerSample = 16, durationSec = 1.0 } = {}) {
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
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-mms-test-'));
  fakeExecutablePath = path.join(tempDir, process.platform === 'win32' ? 'mms.exe' : 'mms');
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
  const adapter = new MmsTTSAdapter();
  assert.equal(adapter.providerId, 'mms');
});

test('2. Correct engine metadata', () => {
  const adapter = new MmsTTSAdapter();
  assert.equal(adapter.engine, 'mms');
});

test('3. MMS model resolves from ModelRegistry', () => {
  const adapter = new MmsTTSAdapter();

  // Canonical MMS resolution: Amharic (am) has mms canonical engine
  const amModel = adapter.resolveMmsModel('am');
  assert.ok(amModel);
  assert.equal(amModel.engine, 'mms');
  assert.equal(amModel.modelId, 'mms:facebook/mms-tts-amh');
  assert.equal(amModel.sampleRate, 16000);
  assert.equal(amModel.modelType, 'vits-mms');
  assert.equal(adapter.supportsLanguage('am'), true);

  // Alternative MMS resolution: Albanian (sq) has mms alternative model
  const sqModel = adapter.resolveMmsModel('sq');
  assert.ok(sqModel);
  assert.equal(sqModel.engine, 'mms');
  assert.equal(sqModel.modelId, 'mms:facebook/mms-tts-sqi');
  assert.equal(adapter.supportsLanguage('sq'), true);

  // Explicit model ID resolution
  const explicit = adapter.resolveMmsModel('en', { modelId: 'mms:facebook/mms-tts-eng' });
  assert.ok(explicit);
  assert.equal(explicit.modelId, 'mms:facebook/mms-tts-eng');
  assert.equal(explicit.engine, 'mms');
});

test('4. Unknown model fails deterministically', () => {
  const adapter = new MmsTTSAdapter();

  assert.throws(
    () => adapter.resolveMmsModel('am', { modelId: 'mms:facebook/mms-tts-nonexistent-voice' }),
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'MODEL_NOT_FOUND');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('5. Non-MMS model passed to MMS adapter fails', () => {
  const adapter = new MmsTTSAdapter();

  // Piper model passed to MMS adapter
  assert.throws(
    () => adapter.resolveMmsModel('en', { modelId: 'piper:en_US-lessac-medium' }),
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'MODEL_NOT_FOUND');
      assert.equal(err.provider, 'mms');
      assert.ok(err.message.includes('not an MMS engine model'));
      return true;
    }
  );

  // Kokoro model passed to MMS adapter
  assert.throws(
    () => adapter.resolveMmsModel('en', { modelId: 'kokoro:en_US-bryce' }),
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'MODEL_NOT_FOUND');
      return true;
    }
  );
});

test('6. Unsupported language fails deterministically', () => {
  const adapter = new MmsTTSAdapter();

  // 'zgh' (subtitle only) has no MMS model
  assert.equal(adapter.supportsLanguage('zgh'), false);
  assert.throws(
    () => adapter.resolveMmsModel('zgh'),
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'UNSUPPORTED_LANGUAGE');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );

  // Totally unknown language code
  assert.throws(
    () => adapter.resolveMmsModel('xyz-unknown'),
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'UNSUPPORTED_LANGUAGE');
      return true;
    }
  );
});

test('7. Missing runtime produces ENGINE_NOT_FOUND', async () => {
  const nonExistentPath = path.join(tempDir, 'does-not-exist', 'mms.exe');
  const adapter = new MmsTTSAdapter({
    executablePath: nonExistentPath
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'am');
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'ENGINE_NOT_FOUND');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('8. Missing model in offline mode produces MODEL_NOT_CACHED', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'empty-cache') });
  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Hello world', 'am', { offline: true });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'MODEL_NOT_CACHED');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      assert.ok(err.message.includes('offline mode'));
      return true;
    }
  );
});

test('9. Corrupt model is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'corrupt-cache') });
  const rawModel = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  assert.ok(rawModel);

  const modelDef = {
    ...rawModel,
    sizeBytes: 5000,
    checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  };

  const mockRegistry = {
    ...ModelRegistry,
    getModel: (id) => (id === modelDef.modelId ? modelDef : ModelRegistry.getModel(id)),
    getCanonicalModel: (lang, eng) => (lang === 'am' && eng === 'mms' ? modelDef : ModelRegistry.getCanonicalModel(lang, eng))
  };

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  fs.writeFileSync(targetFile, 'corrupt-model-bytes-that-fail-integrity');
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    modelRegistry: mockRegistry
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('ሰላም', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'MODEL_CHECKSUM_MISMATCH');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('10. Missing required auxiliary artifact is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'missing-aux-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  assert.ok(modelDef);

  // Write model file but omit config.json / vocab.json
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    requireAuxiliaryFiles: true
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('ሰላም', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'MISSING_AUXILIARY_ARTIFACT');
      assert.equal(err.provider, 'mms');
      assert.ok(err.message.includes('missing required auxiliary configuration files'));
      return true;
    }
  );
});

test('11. Valid cached model reaches runtime', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'valid-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  assert.ok(modelDef);

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), JSON.stringify({ sampling_rate: 16000 }));
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), JSON.stringify({ a: 1 }));

  let runnerCalled = false;
  let runnerParams = null;

  const mockRunner = async (params) => {
    runnerCalled = true;
    runnerParams = params;
    const wavBuf = createValidWavBuffer({ sampleRate: 16000, durationSec: 1.5 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 110 };
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  const result = await adapter.synthesize('ሰላም ዓለም', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    offline: true
  });

  assert.equal(runnerCalled, true);
  assert.ok(runnerParams);
  assert.equal(runnerParams.runtimePath, fakeExecutablePath);
  assert.equal(runnerParams.text, 'ሰላም ዓለም');

  assert.equal(result.providerId, 'mms');
  assert.equal(result.engine, 'mms');
  assert.equal(result.modelId, 'mms:facebook/mms-tts-amh');
  assert.equal(result.sampleRate, 16000);
  assert.ok(result.duration > 1.0);
  assert.equal(result.format, 'wav');
  assert.ok(fs.existsSync(result.audioPath));
});

test('12. Safe runtime invocation', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'arg-test-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = cacheManager.getCachePath(modelDef);
  fs.writeFileSync(targetFile, Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  let capturedArgs = null;
  const mockRunner = async (params) => {
    capturedArgs = params.args;
    const wavBuf = createValidWavBuffer({ sampleRate: 16000 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 50 };
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  await adapter.synthesize('Safe argument invocation test', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    speed: 1.1,
    offline: true
  });

  assert.ok(Array.isArray(capturedArgs), 'Arguments must be an argv array');
  assert.ok(capturedArgs.includes('--model'));
  assert.ok(capturedArgs.includes(targetFile));
  assert.ok(capturedArgs.includes('--output_file'));
  assert.ok(capturedArgs.includes('--model_id'));
  assert.ok(capturedArgs.includes('mms:facebook/mms-tts-amh'));
  assert.ok(capturedArgs.includes('--speed'));
  assert.ok(capturedArgs.includes('1.1'));
});

test('13. Unicode text preservation across representative MMS languages', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'unicode-cache') });

  // 1. Latin-script: Albanian (sq)
  // 2. Non-Latin script: Amharic (am)
  // 3. Low-resource non-Latin: Maithili (mai)
  const testCases = [
    { lang: 'sq', modelId: 'mms:facebook/mms-tts-sqi', text: 'Pershendetje bote! Ky eshte nje test me shkronja te vecanta: ë, ç.' },
    { lang: 'am', modelId: 'mms:facebook/mms-tts-amh', text: 'ሰላም ዓለም! ይህ የሙከራ ጽሑፍ ነው።' },
    { lang: 'mai', modelId: 'mms:facebook/mms-tts-mai', text: 'नमस्कार संसार! ई एकटा परीक्षण अछि।' }
  ];

  for (const tc of testCases) {
    const modelDef = ModelRegistry.getModel(tc.modelId);
    assert.ok(modelDef, `Model ${tc.modelId} must exist in registry`);

    const targetDir = cacheManager.getModelDirectory(modelDef);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
    fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
    fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

    let receivedText = null;
    const mockRunner = async (params) => {
      receivedText = params.text;
      const wavBuf = createValidWavBuffer({ sampleRate: 16000 });
      fs.writeFileSync(params.outputPath, wavBuf);
      return { exitCode: 0, durationMs: 40 };
    };

    const adapter = new MmsTTSAdapter({
      executablePath: fakeExecutablePath,
      cacheManager,
      runtimeRunner: mockRunner
    });

    await adapter.synthesize(tc.text, tc.lang, { modelId: tc.modelId, offline: true });

    assert.equal(receivedText, tc.text, `Unicode text for ${tc.lang} must be preserved exactly`);
  }
});

test('14. Runtime failure produces ENGINE_EXECUTION_FAILED', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'failure-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  const failingRunner = async () => {
    throw new MmsError('ENGINE_EXECUTION_FAILED', 'MMS process exited with code 1: vits inference error', {
      exitCode: 1,
      stderr: 'vits inference error'
    });
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: failingRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test crash', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'ENGINE_EXECUTION_FAILED');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      assert.ok(err.message.includes('vits inference error'));
      return true;
    }
  );
});

test('15. Runtime timeout produces deterministic timeout', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'timeout-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  const timeoutRunner = async (params) => {
    throw new MmsError('ENGINE_TIMEOUT', `MMS process timed out after ${params.timeoutMs}ms.`, {
      timeoutMs: params.timeoutMs
    });
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: timeoutRunner,
    timeoutMs: 1500
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test timeout', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'ENGINE_TIMEOUT');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      assert.equal(err.details.timeoutMs, 1500);
      return true;
    }
  );
});

test('16. Invalid generated audio is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'invalid-audio-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  const garbageRunner = async (params) => {
    fs.writeFileSync(params.outputPath, Buffer.from('NOT_A_WAV_FILE_GARBAGE_HEADER_DATA_EXCEEDING_44_BYTES_1234567890'));
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: garbageRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test invalid audio', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('not a valid RIFF/WAVE container'));
      return true;
    }
  );

  // Mismatched sample rate check: MMS model expects 16000 Hz, but output has 24000 Hz
  const wrongRateRunner = async (params) => {
    const wavBuf = createValidWavBuffer({ sampleRate: 24000 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter2 = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: wrongRateRunner
  });

  await assert.rejects(
    async () => {
      await adapter2.synthesize('Test sample rate mismatch', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('does not match expected model rate'));
      return true;
    }
  );
});

test('17. Empty generated audio is rejected', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'empty-audio-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  const emptyRunner = async (params) => {
    fs.writeFileSync(params.outputPath, Buffer.alloc(0));
    return { exitCode: 0, durationMs: 20 };
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: emptyRunner
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Test empty audio', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'AUDIO_OUTPUT_INVALID');
      assert.ok(err.message.includes('too small or truncated'));
      return true;
    }
  );
});

test('18. No Piper fallback', async () => {
  const adapter = new MmsTTSAdapter({
    executablePath: '/invalid/path/mms'
  });

  try {
    await adapter.synthesize('Hello', 'am', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof MmsError);
    assert.equal(err.provider, 'mms');
    assert.notEqual(err.provider, 'piper');
    assert.equal(err.fallbackAttempted, false);
  }
});

test('19. No Kokoro fallback', async () => {
  const adapter = new MmsTTSAdapter({
    executablePath: '/invalid/path/mms'
  });

  try {
    await adapter.synthesize('Hello', 'am', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof MmsError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'kokoro');
  }
});

test('20. No Edge fallback', async () => {
  const adapter = new MmsTTSAdapter({
    executablePath: '/invalid/path/mms'
  });

  try {
    await adapter.synthesize('Hello', 'am', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof MmsError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'edge');
  }
});

test('21. No Google fallback', async () => {
  const adapter = new MmsTTSAdapter({
    executablePath: '/invalid/path/mms'
  });

  try {
    await adapter.synthesize('Hello', 'am', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof MmsError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'google');
  }
});

test('22. No Azure fallback', async () => {
  const adapter = new MmsTTSAdapter({
    executablePath: '/invalid/path/mms'
  });

  try {
    await adapter.synthesize('Hello', 'am', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof MmsError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'azure');
  }
});

test('23. No NodeTTS fallback', async () => {
  const adapter = new MmsTTSAdapter({
    executablePath: '/invalid/path/mms'
  });

  try {
    await adapter.synthesize('Hello', 'am', { offline: true });
    assert.fail('Should have thrown');
  } catch (err) {
    assert.ok(err instanceof MmsError);
    assert.equal(err.fallbackAttempted, false);
    assert.notEqual(err.provider, 'node');
  }
});

test('24. No network in offline mode', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'offline-network-test') });

  let ensureModelCalled = false;
  const originalEnsureModel = cacheManager.ensureModel.bind(cacheManager);
  cacheManager.ensureModel = async (...args) => {
    ensureModelCalled = true;
    return originalEnsureModel(...args);
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Testing offline constraint', 'am', { offline: true });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'MODEL_NOT_CACHED');
      return true;
    }
  );

  assert.equal(ensureModelCalled, false, 'ensureModel must NOT be called in offline mode for uncached model');
});

test('25. ModelRegistry is not mutated', () => {
  const countBefore = ModelRegistry.getAllModels().length;
  const canonicalAmBefore = ModelRegistry.getCanonicalModel('am', 'mms');

  const adapter = new MmsTTSAdapter();
  adapter.supportsLanguage('am');
  adapter.supportsLanguage('sq');
  adapter.supportsLanguage('zgh');
  adapter.resolveMmsModel('am');
  adapter.resolveMmsModel('sq');

  const countAfter = ModelRegistry.getAllModels().length;
  const canonicalAmAfter = ModelRegistry.getCanonicalModel('am', 'mms');

  assert.equal(countAfter, countBefore, 'Model count in registry must not change');
  assert.deepEqual(canonicalAmAfter, canonicalAmBefore, 'Canonical model mapping must not mutate');
});

test('26. PolicyEngine is not modified', () => {
  const engine = new PolicyEngine();
  const mmsModel = ModelRegistry.getModel('mms:facebook/mms-tts-amh');

  const relaxed = engine.evaluate(mmsModel, { policyProfile: 'RELAXED', executionMode: 'COMMERCIAL' });
  assert.equal(relaxed.permitted, false);

  const strict = engine.evaluate(mmsModel, { policyProfile: 'STRICT', executionMode: 'COMMERCIAL' });
  assert.equal(strict.permitted, false);
});

test('27. Commercial-mode execution of research-only model is blocked when policy result is restrictive', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'policy-comm-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager
  });

  await assert.rejects(
    async () => {
      await adapter.synthesize('Commercial attempt', 'am', {
        modelId: 'mms:facebook/mms-tts-amh',
        executionMode: 'COMMERCIAL',
        offline: true
      });
    },
    (err) => {
      assert.ok(err instanceof MmsError);
      assert.equal(err.code, 'POLICY_RESTRICTION');
      assert.equal(err.provider, 'mms');
      assert.equal(err.fallbackAttempted, false);
      assert.ok(err.message.includes('restricted from commercial execution'));
      return true;
    }
  );
});

test('28. Research-mode execution is not incorrectly blocked by the adapter itself', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'policy-res-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  let runnerInvoked = false;
  const mockRunner = async (params) => {
    runnerInvoked = true;
    const wavBuf = createValidWavBuffer({ sampleRate: 16000 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 40 };
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  const res = await adapter.synthesize('Research attempt', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    executionMode: 'RESEARCH',
    offline: true
  });

  assert.equal(runnerInvoked, true);
  assert.equal(res.providerId, 'mms');
  assert.equal(res.modelId, 'mms:facebook/mms-tts-amh');
});

test('29. Provider result matches existing TTS contract', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'contract-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  const mockRunner = async (params) => {
    const wavBuf = createValidWavBuffer({ sampleRate: 16000, durationSec: 2.2 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 80 };
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  const res = await adapter.synthesize('Contract check', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    offline: true
  });

  assert.equal(typeof res.audioPath, 'string');
  assert.equal(typeof res.duration, 'number');
  assert.equal(res.format, 'wav');
  assert.equal(res.voiceId, 'mms:facebook/mms-tts-amh');
  assert.equal(res.providerId, 'mms');
  assert.equal(res.engine, 'mms');
  assert.equal(res.modelId, 'mms:facebook/mms-tts-amh');
  assert.equal(res.languageCode, 'am');
  assert.equal(res.sampleRate, 16000);
  assert.equal(res.channels, 1);
});

test('30. Repeated identical requests behave deterministically', async () => {
  const cacheManager = new ModelCacheManager({ cacheDir: path.join(tempDir, 'determinism-cache') });
  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');

  const targetDir = cacheManager.getModelDirectory(modelDef);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(cacheManager.getCachePath(modelDef), Buffer.alloc(modelDef.sizeBytes || 1024));
  fs.writeFileSync(path.join(targetDir, 'config.json'), '{}');
  fs.writeFileSync(path.join(targetDir, 'vocab.json'), '{}');

  let callCount = 0;
  const mockRunner = async (params) => {
    callCount++;
    const wavBuf = createValidWavBuffer({ sampleRate: 16000, durationSec: 1.0 });
    fs.writeFileSync(params.outputPath, wavBuf);
    return { exitCode: 0, durationMs: 30 };
  };

  const adapter = new MmsTTSAdapter({
    executablePath: fakeExecutablePath,
    cacheManager,
    runtimeRunner: mockRunner
  });

  const res1 = await adapter.synthesize('Deterministic test', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    offline: true
  });

  const res2 = await adapter.synthesize('Deterministic test', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    offline: true
  });

  assert.equal(callCount, 2);
  assert.equal(res1.providerId, res2.providerId);
  assert.equal(res1.engine, res2.engine);
  assert.equal(res1.modelId, res2.modelId);
  assert.equal(res1.sampleRate, res2.sampleRate);
  assert.equal(res1.duration, res2.duration);
  assert.ok(adapter.sessionCache.has('mms:facebook/mms-tts-amh'));
});

// Environment-dependent real runtime verification (Tests 31-34)
test('31. Real MMS inference (environment-dependent)', async (t) => {
  const runtime = findMmsRuntime();
  if (!runtime || !verifyMmsRuntime(runtime)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real MMS runtime not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: MMS model mms:facebook/mms-tts-amh not cached locally');
    return;
  }

  const adapter = new MmsTTSAdapter({ executablePath: runtime, cacheManager });
  const result = await adapter.synthesize('ሰላም ዓለም', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    offline: true
  });

  assert.ok(result.audioPath);
  assert.ok(fs.existsSync(result.audioPath));
  assert.ok(result.duration > 0);
  assert.equal(result.providerId, 'mms');
});

test('32. Real generated audio duration (environment-dependent)', async (t) => {
  const runtime = findMmsRuntime();
  if (!runtime || !verifyMmsRuntime(runtime)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real MMS runtime not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: MMS model mms:facebook/mms-tts-amh not cached locally');
    return;
  }

  const adapter = new MmsTTSAdapter({ executablePath: runtime, cacheManager });
  const result = await adapter.synthesize('ሰላም', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    offline: true
  });

  assert.ok(typeof result.duration === 'number');
  assert.ok(result.duration > 0.1, `Expected duration > 0.1s, got ${result.duration}s`);
});

test('33. Real sample-rate validation (environment-dependent)', async (t) => {
  const runtime = findMmsRuntime();
  if (!runtime || !verifyMmsRuntime(runtime)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real MMS runtime not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-amh');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: MMS model mms:facebook/mms-tts-amh not cached locally');
    return;
  }

  const adapter = new MmsTTSAdapter({ executablePath: runtime, cacheManager });
  const result = await adapter.synthesize('Sample rate test', 'am', {
    modelId: 'mms:facebook/mms-tts-amh',
    offline: true
  });

  assert.equal(result.sampleRate, 16000);
});

test('34. Real representative multilingual inference (environment-dependent)', async (t) => {
  const runtime = findMmsRuntime();
  if (!runtime || !verifyMmsRuntime(runtime)) {
    t.skip('NOT_CURRENTLY_POSSIBLE: Real MMS runtime not available in environment');
    return;
  }

  const modelDef = ModelRegistry.getModel('mms:facebook/mms-tts-sqi');
  const cacheManager = defaultModelCacheManager;
  if (!fs.existsSync(cacheManager.getCachePath(modelDef))) {
    t.skip('NOT_CURRENTLY_POSSIBLE: MMS model mms:facebook/mms-tts-sqi not cached locally');
    return;
  }

  const adapter = new MmsTTSAdapter({ executablePath: runtime, cacheManager });
  const result = await adapter.synthesize('Pershendetje', 'sq', {
    modelId: 'mms:facebook/mms-tts-sqi',
    offline: true
  });

  assert.ok(result.audioPath);
  assert.equal(result.sampleRate, 16000);
});
