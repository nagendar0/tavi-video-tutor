// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import {
  createTTSProvider,
  resolveTTSProvider,
  getTTSProviderCapabilities,
  normalizeTTSProviderId,
  AutoTTSProvider,
  ExplicitFallbackTTSProvider,
  FactoryError,
  CLOUD_PROVIDERS,
  LOCAL_PROVIDERS
} from '../src/subtitles/tts/ttsFactory.js';
import { TTSProvider } from '../src/subtitles/tts/TTSProvider.js';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { EdgeTTSProvider, TTSError } from '../src/subtitles/tts/EdgeTTSProvider.js';
import { AzureNeuralTTSProvider } from '../src/subtitles/tts/AzureNeuralTTSProvider.js';
import { PiperTTSAdapter, PiperError, findPiperExecutable } from '../src/subtitles/tts/PiperTTSAdapter.js';
import { KokoroTTSAdapter, KokoroError } from '../src/subtitles/tts/KokoroTTSAdapter.js';
import { MmsTTSAdapter, MmsError } from '../src/subtitles/tts/MmsTTSAdapter.js';
import { ModelRegistry, getModel, getCanonicalModel } from '../src/subtitles/models/modelRegistry.js';
import { PolicyEngine } from '../src/subtitles/policy/PolicyEngine.js';
import { ModelCacheManager, CACHE_STATUS } from '../src/subtitles/cache/ModelCacheManager.js';

// Setup shared fake binary executable in temp directory for simulated engine tests
const testGlobalTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase8_factory_tests_'));
const fakePiperBin = path.join(testGlobalTempDir, 'fake-piper.exe');
fs.writeFileSync(fakePiperBin, '#!/bin/sh\nexit 0\n');

// Mock cache manager helper that simulates verified cached models
function createMockVerifiedCacheManager() {
  return {
    getCacheStatus: () => ({ status: CACHE_STATUS.CACHED_VERIFIED }),
    ensureModel: async () => {},
    getCachePath: () => fakePiperBin,
    getModelDirectory: () => testGlobalTempDir
  };
}

// Helper to create a valid dummy PCM WAV file for mock synthesis
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

// 1. Explicit Piper provider resolves to PiperTTSAdapter
test('1. Explicit Piper provider resolves to PiperTTSAdapter', () => {
  const provider = createTTSProvider({ provider: 'piper' });
  assert.ok(provider instanceof PiperTTSAdapter);
  assert.equal(provider.providerId, 'piper');
  assert.equal(provider.engine, 'piper');

  const resolved = resolveTTSProvider('piper');
  assert.ok(resolved instanceof PiperTTSAdapter);
});

// 2. Explicit Kokoro provider resolves to KokoroTTSAdapter
test('2. Explicit Kokoro provider resolves to KokoroTTSAdapter', () => {
  const provider = createTTSProvider({ provider: 'kokoro' });
  assert.ok(provider instanceof KokoroTTSAdapter);
  assert.equal(provider.providerId, 'kokoro');
  assert.equal(provider.engine, 'kokoro');

  const resolved = resolveTTSProvider('kokoro');
  assert.ok(resolved instanceof KokoroTTSAdapter);
});

// 3. Explicit MMS provider resolves to MmsTTSAdapter
test('3. Explicit MMS provider resolves to MmsTTSAdapter', () => {
  const provider = createTTSProvider({ provider: 'mms' });
  assert.ok(provider instanceof MmsTTSAdapter);
  assert.equal(provider.providerId, 'mms');
  assert.equal(provider.engine, 'mms');

  const resolved = resolveTTSProvider('mms');
  assert.ok(resolved instanceof MmsTTSAdapter);
});

// 4. Explicit Azure provider resolves to Azure adapter
test('4. Explicit Azure provider resolves to Azure adapter', () => {
  const p1 = createTTSProvider({ provider: 'azure' });
  assert.ok(p1 instanceof AzureNeuralTTSProvider);
  assert.equal(p1.providerId, 'azure-byok');
  assert.equal(p1.engine, 'azure');

  const p2 = createTTSProvider({ provider: 'azure-byok' });
  assert.ok(p2 instanceof AzureNeuralTTSProvider);

  const resolved = resolveTTSProvider('azure-neural');
  assert.ok(resolved instanceof AzureNeuralTTSProvider);
});

// 5. Explicit system provider resolves to system speech provider
test('5. Explicit system provider resolves to system speech provider', () => {
  const p1 = createTTSProvider({ provider: 'system' });
  assert.ok(p1 instanceof NodeTTSProvider);
  assert.equal(p1.providerId, 'system');
  assert.equal(p1.engine, 'system');

  const p2 = createTTSProvider({ provider: 'node' });
  assert.ok(p2 instanceof NodeTTSProvider);

  const resolved = resolveTTSProvider('node-tts');
  assert.ok(resolved instanceof NodeTTSProvider);
});

// 6. Unknown provider fails deterministically
test('6. Unknown provider fails deterministically', () => {
  assert.throws(
    () => createTTSProvider({ provider: 'unknown-vendor-tts' }),
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.equal(err.code, 'UNKNOWN_TTS_PROVIDER');
      return true;
    }
  );

  assert.throws(
    () => resolveTTSProvider('fake_tts'),
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.equal(err.code, 'UNKNOWN_TTS_PROVIDER');
      return true;
    }
  );
});

// 7. No provider selection does not silently try multiple providers
test('7. No provider selection does not silently try multiple providers', () => {
  const defaultProvider = createTTSProvider();
  assert.ok(defaultProvider instanceof NodeTTSProvider);
  assert.equal(defaultProvider.providerId, 'system');
  assert.equal(defaultProvider.constructor.name, 'NodeTTSProvider');
});

// 8. Piper failure does not invoke Kokoro
test('8. Piper failure does not invoke Kokoro', async () => {
  let kokoroInvoked = false;
  const originalKokoroSynth = KokoroTTSAdapter.prototype.synthesize;
  KokoroTTSAdapter.prototype.synthesize = async () => {
    kokoroInvoked = true;
    throw new Error('Kokoro should not be called');
  };

  try {
    const failingPiper = new PiperTTSAdapter({
      executablePath: fakePiperBin,
      cacheManager: createMockVerifiedCacheManager(),
      processRunner: async () => {
        throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution failed');
      }
    });

    await assert.rejects(
      async () => {
        await failingPiper.synthesize('hello', 'en', { offline: false });
      },
      (err) => {
        assert.ok(err instanceof PiperError);
        assert.equal(err.code, 'ENGINE_EXECUTION_FAILED');
        return true;
      }
    );

    assert.equal(kokoroInvoked, false, 'Piper failure must never invoke Kokoro');
  } finally {
    KokoroTTSAdapter.prototype.synthesize = originalKokoroSynth;
  }
});

// 9. Piper failure does not invoke Edge
test('9. Piper failure does not invoke Edge', async () => {
  let edgeInvoked = false;
  const originalEdgeSynth = EdgeTTSProvider.prototype.synthesize;
  EdgeTTSProvider.prototype.synthesize = async () => {
    edgeInvoked = true;
    throw new Error('Edge should not be called');
  };

  try {
    const failingPiper = new PiperTTSAdapter({
      executablePath: fakePiperBin,
      cacheManager: createMockVerifiedCacheManager(),
      processRunner: async () => {
        throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution failed');
      }
    });

    await assert.rejects(
      async () => {
        await failingPiper.synthesize('hello', 'en');
      },
      (err) => {
        assert.ok(err instanceof PiperError);
        return true;
      }
    );

    assert.equal(edgeInvoked, false, 'Piper failure must never invoke Edge');
  } finally {
    EdgeTTSProvider.prototype.synthesize = originalEdgeSynth;
  }
});

// 10. Piper failure does not invoke Google
test('10. Piper failure does not invoke Google', async () => {
  let googleFetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async (url, ...args) => {
    if (String(url).includes('google')) {
      googleFetchCalled = true;
    }
    return originalFetch(url, ...args);
  };

  try {
    const failingPiper = new PiperTTSAdapter({
      executablePath: fakePiperBin,
      cacheManager: createMockVerifiedCacheManager(),
      processRunner: async () => {
        throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution failed');
      }
    });

    await assert.rejects(async () => {
      await failingPiper.synthesize('hello', 'en');
    });

    assert.equal(googleFetchCalled, false, 'Piper failure must never invoke Google web TTS');
  } finally {
    global.fetch = originalFetch;
  }
});

// 11. Piper failure does not invoke Azure
test('11. Piper failure does not invoke Azure', async () => {
  let azureInvoked = false;
  const originalAzureSynth = AzureNeuralTTSProvider.prototype.synthesize;
  AzureNeuralTTSProvider.prototype.synthesize = async () => {
    azureInvoked = true;
    throw new Error('Azure should not be called');
  };

  try {
    const failingPiper = new PiperTTSAdapter({
      executablePath: fakePiperBin,
      cacheManager: createMockVerifiedCacheManager(),
      processRunner: async () => {
        throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution failed');
      }
    });

    await assert.rejects(async () => {
      await failingPiper.synthesize('hello', 'en');
    });

    assert.equal(azureInvoked, false, 'Piper failure must never invoke Azure');
  } finally {
    AzureNeuralTTSProvider.prototype.synthesize = originalAzureSynth;
  }
});

// 12. Piper failure does not invoke system speech unless explicitly configured as fallback
test('12. Piper failure does not invoke system speech unless explicitly configured as fallback', async () => {
  let systemInvoked = false;
  const originalSystemSynth = NodeTTSProvider.prototype.synthesize;
  NodeTTSProvider.prototype.synthesize = async () => {
    systemInvoked = true;
    return { audioPath: '/dummy/system.wav', duration: 1.0, format: 'wav', voiceId: 'sys' };
  };

  try {
    // Case A: No fallback configured
    const noFallbackPiper = createTTSProvider({
      provider: 'piper',
      executablePath: fakePiperBin,
      cacheManager: createMockVerifiedCacheManager(),
      processRunner: async () => {
        throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution failed');
      }
    });

    await assert.rejects(
      async () => {
        await noFallbackPiper.synthesize('hello', 'en');
      },
      (err) => {
        assert.ok(err instanceof PiperError);
        return true;
      }
    );
    assert.equal(systemInvoked, false, 'System speech must not be called without explicit fallback');

    // Case B: Explicit fallback to system configured
    const explicitFallbackPiper = createTTSProvider({
      provider: 'piper',
      executablePath: fakePiperBin,
      cacheManager: createMockVerifiedCacheManager(),
      processRunner: async () => {
        throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution failed');
      },
      fallback: {
        enabled: true,
        provider: 'system'
      }
    });

    const res = await explicitFallbackPiper.synthesize('hello', 'en');
    assert.equal(systemInvoked, true, 'System speech must be called when explicitly configured as fallback');
    assert.equal(res.fallbackUsed, true);
    assert.equal(res.diagnostics.primaryProvider, 'piper');
    assert.equal(res.diagnostics.fallbackProvider, 'system');
    assert.equal(res.diagnostics.fallbackAttempted, true);
  } finally {
    NodeTTSProvider.prototype.synthesize = originalSystemSynth;
  }
});

// 13. Kokoro failure does not invoke Piper
test('13. Kokoro failure does not invoke Piper', async () => {
  let piperInvoked = false;
  const originalPiperSynth = PiperTTSAdapter.prototype.synthesize;
  PiperTTSAdapter.prototype.synthesize = async () => {
    piperInvoked = true;
    throw new Error('Piper should not be called');
  };

  try {
    const failingKokoro = new KokoroTTSAdapter({
      runtimeRunner: async () => {
        throw new KokoroError('ENGINE_EXECUTION_FAILED', 'Kokoro runtime failed');
      }
    });

    await assert.rejects(async () => {
      await failingKokoro.synthesize('hello', 'en');
    });

    assert.equal(piperInvoked, false, 'Kokoro failure must never invoke Piper');
  } finally {
    PiperTTSAdapter.prototype.synthesize = originalPiperSynth;
  }
});

// 14. MMS failure does not invoke Piper
test('14. MMS failure does not invoke Piper', async () => {
  let piperInvoked = false;
  const originalPiperSynth = PiperTTSAdapter.prototype.synthesize;
  PiperTTSAdapter.prototype.synthesize = async () => {
    piperInvoked = true;
    throw new Error('Piper should not be called');
  };

  try {
    const failingMms = new MmsTTSAdapter({
      runtimeRunner: async () => {
        throw new MmsError('ENGINE_EXECUTION_FAILED', 'MMS runtime failed');
      }
    });

    await assert.rejects(async () => {
      await failingMms.synthesize('hello', 'amh');
    });

    assert.equal(piperInvoked, false, 'MMS failure must never invoke Piper');
  } finally {
    PiperTTSAdapter.prototype.synthesize = originalPiperSynth;
  }
});

// 15. Azure missing credentials does not invoke Edge
test('15. Azure missing credentials does not invoke Edge', async () => {
  let edgeInvoked = false;
  const originalEdgeSynth = EdgeTTSProvider.prototype.synthesize;
  EdgeTTSProvider.prototype.synthesize = async () => {
    edgeInvoked = true;
    throw new Error('Edge should not be called');
  };

  try {
    const azure = new AzureNeuralTTSProvider({ azureKey: null });

    await assert.rejects(
      async () => {
        await azure.synthesize('test', 'en');
      },
      (err) => {
        assert.ok(err instanceof TTSError);
        assert.equal(err.code, 'PROVIDER_AUTH_ERROR');
        return true;
      }
    );

    assert.equal(edgeInvoked, false, 'Azure missing credentials must NOT fallback to Edge');
  } finally {
    EdgeTTSProvider.prototype.synthesize = originalEdgeSynth;
  }
});

// 16. Azure missing credentials does not invoke Google
test('16. Azure missing credentials does not invoke Google', async () => {
  let googleFetchCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async (url, ...args) => {
    if (String(url).includes('google')) {
      googleFetchCalled = true;
    }
    return originalFetch(url, ...args);
  };

  try {
    const azure = new AzureNeuralTTSProvider({ azureKey: null });

    await assert.rejects(async () => {
      await azure.synthesize('test', 'en');
    });

    assert.equal(googleFetchCalled, false, 'Azure missing credentials must NOT call Google');
  } finally {
    global.fetch = originalFetch;
  }
});

// 17. Azure 429 remains quota error
test('17. Azure 429 remains quota error', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    return {
      ok: false,
      status: 429,
      text: async () => 'Rate limit exceeded'
    };
  };

  try {
    const azure = new AzureNeuralTTSProvider({ azureKey: 'dummy_key', azureRegion: 'eastus' });

    await assert.rejects(
      async () => {
        await azure.synthesize('hello', 'en');
      },
      (err) => {
        assert.ok(err instanceof TTSError);
        assert.equal(err.code, 'PROVIDER_QUOTA_EXCEEDED');
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

// 18. Azure 5xx remains provider-unavailable/service error
test('18. Azure 5xx remains provider-unavailable/service error', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    return {
      ok: false,
      status: 503,
      text: async () => 'Service Temporarily Unavailable'
    };
  };

  try {
    const azure = new AzureNeuralTTSProvider({ azureKey: 'dummy_key', azureRegion: 'eastus' });

    await assert.rejects(
      async () => {
        await azure.synthesize('hello', 'en');
      },
      (err) => {
        assert.ok(err instanceof TTSError);
        assert.equal(err.code, 'PROVIDER_SERVICE_UNAVAILABLE');
        return true;
      }
    );
  } finally {
    global.fetch = originalFetch;
  }
});

// 19. Node/system speech failure does not invoke Google web TTS
test('19. Node/system speech failure does not invoke Google web TTS', async () => {
  let googleCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async (url, ...args) => {
    if (String(url).includes('google')) {
      googleCalled = true;
    }
    return originalFetch(url, ...args);
  };

  try {
    const nodeTTS = new NodeTTSProvider({ allowSyntheticFallback: false });
    // Force native speech methods to return null (failure)
    nodeTTS.synthesizeWindowsSpeech = async () => null;
    nodeTTS.synthesizeDarwinSpeech = async () => null;
    nodeTTS.synthesizeLinuxSpeech = async () => null;

    await assert.rejects(
      async () => {
        await nodeTTS.synthesize('Test speech failure', 'hi');
      },
      (err) => {
        assert.ok(/AUDIO_NOT_AVAILABLE_FOR_LANGUAGE/.test(err.message));
        return true;
      }
    );

    assert.equal(googleCalled, false, 'NodeTTSProvider failure must not invoke Google web TTS');
  } finally {
    global.fetch = originalFetch;
  }
});

// 20. Google TTS scraper is unreachable from all provider failure paths
test('20. Google TTS scraper is unreachable from all provider failure paths', async () => {
  let googleCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async (url, ...args) => {
    if (String(url).includes('translate.google.com') || String(url).includes('translate_tts')) {
      googleCalled = true;
    }
    return originalFetch(url, ...args);
  };

  try {
    // 1. Piper failure
    const piper = new PiperTTSAdapter({ processRunner: async () => { throw new Error('fail'); } });
    await assert.rejects(async () => piper.synthesize('test', 'en'));

    // 2. Kokoro failure
    const kokoro = new KokoroTTSAdapter({ runtimeRunner: async () => { throw new Error('fail'); } });
    await assert.rejects(async () => kokoro.synthesize('test', 'en'));

    // 3. MMS failure
    const mms = new MmsTTSAdapter({ runtimeRunner: async () => { throw new Error('fail'); } });
    await assert.rejects(async () => mms.synthesize('test', 'amh'));

    // 4. Azure failure
    const azure = new AzureNeuralTTSProvider({ azureKey: null });
    await assert.rejects(async () => azure.synthesize('test', 'en'));

    // 5. Offline execution
    const edgeOffline = new EdgeTTSProvider();
    await assert.rejects(async () => edgeOffline.synthesize('test', 'en', { offline: true }));

    assert.equal(googleCalled, false, 'Google scraper must be completely unreachable');
  } finally {
    global.fetch = originalFetch;
  }
});

// 21. Offline + Edge selected is rejected
test('21. Offline + Edge selected is rejected', async () => {
  assert.throws(
    () => createTTSProvider({ provider: 'edge', offline: true }),
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.equal(err.code, 'OFFLINE_PROVIDER_FORBIDDEN');
      return true;
    }
  );

  const edge = new EdgeTTSProvider();
  await assert.rejects(
    async () => edge.synthesize('test', 'en', { offline: true }),
    (err) => {
      assert.ok(err instanceof TTSError);
      assert.equal(err.code, 'OFFLINE_PROVIDER_FORBIDDEN');
      return true;
    }
  );
});

// 22. Offline + Azure selected is rejected
test('22. Offline + Azure selected is rejected', async () => {
  assert.throws(
    () => createTTSProvider({ provider: 'azure', offline: true }),
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.equal(err.code, 'OFFLINE_PROVIDER_FORBIDDEN');
      return true;
    }
  );

  const azure = new AzureNeuralTTSProvider({ azureKey: 'test_key' });
  await assert.rejects(
    async () => azure.synthesize('test', 'en', { offline: true }),
    (err) => {
      assert.ok(err instanceof TTSError);
      assert.equal(err.code, 'OFFLINE_PROVIDER_FORBIDDEN');
      return true;
    }
  );
});

// 23. Offline + local provider succeeds when dependencies are available
test('23. Offline + local provider succeeds when dependencies are available', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase8_offline_local_'));
  try {
    const cacheManager = new ModelCacheManager({ cacheDir: tmpDir });
    const canonicalPiperEn = getCanonicalModel('en', 'piper');
    assert.ok(canonicalPiperEn);

    // Populate mock cached model matching canonical Piper model
    const targetDir = cacheManager.getModelDirectory(canonicalPiperEn);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetFile = cacheManager.getCachePath(canonicalPiperEn);
    const size = canonicalPiperEn.sizeBytes || 1024;
    fs.writeFileSync(targetFile, Buffer.alloc(size));

    const piper = createTTSProvider({
      provider: 'piper',
      offline: true,
      executablePath: fakePiperBin,
      cacheManager,
      processRunner: async (params) => {
        createDummyWav(params.outputPath, 1.0, 22050);
        return { exitCode: 0, durationMs: 10 };
      }
    });

    const result = await piper.synthesize('Hello world', 'en', {
      outputDir: tmpDir,
      offline: true
    });

    assert.ok(result.audioPath);
    assert.ok(fs.existsSync(result.audioPath));
    assert.equal(result.format, 'wav');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// 24. Offline + uncached local model fails deterministically
test('24. Offline + uncached local model fails deterministically', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase8_uncached_'));
  try {
    const emptyCache = new ModelCacheManager({ cacheDir: path.join(tmpDir, 'empty') });

    const piper = createTTSProvider({
      provider: 'piper',
      offline: true,
      executablePath: fakePiperBin,
      cacheManager: emptyCache
    });

    await assert.rejects(
      async () => {
        await piper.synthesize('Hello world', 'en', { offline: true });
      },
      (err) => {
        assert.ok(err instanceof PiperError);
        assert.equal(err.code, 'MODEL_NOT_CACHED');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// 25. Explicit fallback executes ONLY when explicitly configured
test('25. Explicit fallback executes ONLY when explicitly configured', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase8_fallback_exec_'));
  try {
    const provider = createTTSProvider({
      provider: 'piper',
      processRunner: async () => {
        throw new PiperError('ENGINE_NOT_FOUND', 'Piper binary not installed');
      },
      fallback: {
        enabled: true,
        provider: 'system'
      }
    });

    // Mock NodeTTSProvider synthesize
    const originalSystemSynth = NodeTTSProvider.prototype.synthesize;
    NodeTTSProvider.prototype.synthesize = async () => {
      const dummyPath = path.join(tmpDir, 'system_fallback.wav');
      createDummyWav(dummyPath, 1.2, 44100);
      return { audioPath: dummyPath, duration: 1.2, format: 'wav', voiceId: 'sys_en' };
    };

    try {
      const res = await provider.synthesize('Hello fallback', 'en');
      assert.equal(res.fallbackUsed, true);
      assert.ok(res.diagnostics);
      assert.equal(res.diagnostics.primaryProvider, 'piper');
      assert.equal(res.diagnostics.fallbackProvider, 'system');
      assert.equal(res.diagnostics.fallbackAttempted, true);
      assert.equal(res.diagnostics.fallbackReason, 'ENGINE_NOT_FOUND');
    } finally {
      NodeTTSProvider.prototype.synthesize = originalSystemSynth;
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// 26. Explicit fallback is not attempted when disabled
test('26. Explicit fallback is not attempted when disabled', async () => {
  let fallbackInvoked = false;
  const originalSystemSynth = NodeTTSProvider.prototype.synthesize;
  NodeTTSProvider.prototype.synthesize = async () => {
    fallbackInvoked = true;
    return { audioPath: '/dummy/sys.wav', duration: 1.0, format: 'wav', voiceId: 'sys' };
  };

  try {
    const provider = createTTSProvider({
      provider: 'piper',
      executablePath: fakePiperBin,
      cacheManager: createMockVerifiedCacheManager(),
      processRunner: async () => {
        throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution failed');
      },
      fallback: {
        enabled: false,
        provider: 'system'
      }
    });

    await assert.rejects(
      async () => {
        await provider.synthesize('Hello disabled fallback', 'en');
      },
      (err) => {
        assert.ok(err instanceof PiperError);
        assert.equal(err.code, 'ENGINE_EXECUTION_FAILED');
        return true;
      }
    );

    assert.equal(fallbackInvoked, false, 'Fallback must not be attempted when enabled is false');
  } finally {
    NodeTTSProvider.prototype.synthesize = originalSystemSynth;
  }
});

// 27. Explicit fallback remains policy-checked
test('27. Explicit fallback remains policy-checked', async () => {
  const provider = createTTSProvider({
    provider: 'piper',
    executionMode: 'COMMERCIAL',
    processRunner: async () => {
      throw new PiperError('ENGINE_NOT_FOUND', 'Piper executable missing');
    },
    fallback: {
      enabled: true,
      provider: 'mms'
    }
  });

  await assert.rejects(
    async () => {
      await provider.synthesize('Commercial test', 'amh', { executionMode: 'COMMERCIAL' });
    },
    (err) => {
      assert.ok(err instanceof FactoryError || err instanceof MmsError);
      assert.equal(err.code, 'MODEL_POLICY_RESTRICTED');
      return true;
    }
  );
});

// 28. Explicit fallback remains offline-checked
test('28. Explicit fallback remains offline-checked', async () => {
  const provider = createTTSProvider({
    provider: 'piper',
    offline: true,
    processRunner: async () => {
      throw new PiperError('ENGINE_NOT_FOUND', 'Piper executable missing');
    },
    fallback: {
      enabled: true,
      provider: 'edge' // cloud-only provider
    }
  });

  await assert.rejects(
    async () => {
      await provider.synthesize('Offline fallback test', 'en', { offline: true });
    },
    (err) => {
      assert.ok(err instanceof FactoryError);
      assert.equal(err.code, 'OFFLINE_PROVIDER_FORBIDDEN');
      return true;
    }
  );
});

// 29. Provider errors preserve provider identity
test('29. Provider errors preserve provider identity', async () => {
  // Piper error identity
  const piper = new PiperTTSAdapter({
    executablePath: fakePiperBin,
    cacheManager: createMockVerifiedCacheManager(),
    processRunner: async () => {
      throw new PiperError('ENGINE_EXECUTION_FAILED', 'Piper execution error');
    }
  });
  await assert.rejects(
    async () => piper.synthesize('test', 'en'),
    (err) => {
      assert.equal(err.provider, 'piper');
      assert.equal(err.engine, 'piper');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );

  // Kokoro error identity
  const kokoro = new KokoroTTSAdapter({
    runtimeRunner: async () => {
      throw new KokoroError('ENGINE_EXECUTION_FAILED', 'Kokoro execution error');
    }
  });
  await assert.rejects(
    async () => kokoro.synthesize('test', 'en'),
    (err) => {
      assert.equal(err.provider, 'kokoro');
      assert.equal(err.engine, 'kokoro');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );

  // MMS error identity
  const mms = new MmsTTSAdapter({
    runtimeRunner: async () => {
      throw new MmsError('ENGINE_EXECUTION_FAILED', 'MMS execution error');
    }
  });
  await assert.rejects(
    async () => mms.synthesize('test', 'amh'),
    (err) => {
      assert.equal(err.provider, 'mms');
      assert.equal(err.engine, 'mms');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

// 30. Factory does not mutate ModelRegistry
test('30. Factory does not mutate ModelRegistry', () => {
  const modelBefore = getCanonicalModel('hi', 'piper');
  const countBefore = ModelRegistry.getAllLanguageModelEntries().length;

  // Run multiple factory instantiations and resolutions
  createTTSProvider({ provider: 'piper' });
  createTTSProvider({ provider: 'kokoro' });
  createTTSProvider({ provider: 'mms' });
  createTTSProvider({ provider: 'azure' });
  createTTSProvider({ provider: 'system' });
  resolveTTSProvider('piper');
  resolveTTSProvider('kokoro');

  const modelAfter = getCanonicalModel('hi', 'piper');
  const countAfter = ModelRegistry.getAllLanguageModelEntries().length;

  assert.equal(countBefore, countAfter);
  assert.deepEqual(modelBefore, modelAfter);
});

// 31. Factory does not mutate PolicyEngine
test('31. Factory does not mutate PolicyEngine', () => {
  const pe = new PolicyEngine();
  const evalBefore = pe.evaluateModel('mms:facebook/mms-tts-amh', 'COMMERCIAL');

  // Trigger factory operations with PolicyEngine
  createTTSProvider({ provider: 'mms', policyEngine: pe });
  createTTSProvider({ provider: 'piper', policyEngine: pe });

  const evalAfter = pe.evaluateModel('mms:facebook/mms-tts-amh', 'COMMERCIAL');
  assert.deepEqual(evalBefore, evalAfter);
});

// 32. Factory performs no network I/O itself
test('32. Factory performs no network I/O itself', () => {
  let netOpCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async () => {
    netOpCalled = true;
    throw new Error('Network call during factory creation');
  };

  try {
    for (const pId of ['piper', 'kokoro', 'mms', 'azure-byok', 'edge', 'system', 'auto']) {
      createTTSProvider({ provider: pId });
      resolveTTSProvider(pId);
    }
    getTTSProviderCapabilities();

    assert.equal(netOpCalled, false, 'Factory instantiation must perform zero network I/O');
  } finally {
    global.fetch = originalFetch;
  }
});

// 33. Provider selection is deterministic across repeated calls
test('33. Provider selection is deterministic across repeated calls', () => {
  for (let i = 0; i < 50; i++) {
    const p1 = createTTSProvider({ provider: 'piper' });
    const p2 = createTTSProvider({ provider: 'kokoro' });
    const p3 = createTTSProvider({ provider: 'mms' });
    const p4 = createTTSProvider({ provider: 'azure' });
    const p5 = createTTSProvider({ provider: 'system' });

    assert.equal(p1.providerId, 'piper');
    assert.equal(p2.providerId, 'kokoro');
    assert.equal(p3.providerId, 'mms');
    assert.equal(p4.providerId, 'azure-byok');
    assert.equal(p5.providerId, 'system');
  }
});

// 34. Provider/model selection does not randomly change
test('34. Provider/model selection does not randomly change', () => {
  const providers = ['piper', 'kokoro', 'mms', 'azure-byok', 'edge', 'system'];
  for (const pid of providers) {
    const instance = createTTSProvider({ provider: pid });
    assert.equal(instance.providerId, pid);
    assert.equal(normalizeTTSProviderId(pid), pid);
  }
});

// 35. Hidden fallback search returns zero runtime fallback paths
test('35. Hidden fallback search returns zero runtime fallback paths', () => {
  const ttsDir = path.resolve('src/subtitles/tts');
  const files = [
    'NodeTTSProvider.js',
    'AzureNeuralTTSProvider.js',
    'EdgeTTSProvider.js',
    'ttsFactory.js',
    'PiperTTSAdapter.js',
    'KokoroTTSAdapter.js',
    'MmsTTSAdapter.js'
  ];

  for (const fileName of files) {
    const fullPath = path.join(ttsDir, fileName);
    const content = fs.readFileSync(fullPath, 'utf8');

    // 1. No Google translate web scraper
    assert.ok(
      !content.includes('translate.google.com') && !content.includes('translate_tts'),
      `File ${fileName} must not contain translate.google.com or translate_tts`
    );

    // 2. No synthesizeOnlineTTS
    assert.ok(
      !content.includes('synthesizeOnlineTTS'),
      `File ${fileName} must not contain synthesizeOnlineTTS`
    );

    // 3. Azure must not inherit Edge or call super.synthesize
    if (fileName === 'AzureNeuralTTSProvider.js') {
      assert.ok(
        !content.includes('extends EdgeTTSProvider'),
        'AzureNeuralTTSProvider must not extend EdgeTTSProvider'
      );
      assert.ok(
        !content.includes('super.synthesize'),
        'AzureNeuralTTSProvider must not call super.synthesize'
      );
    }

    // 4. AutoTTSProvider must not silently catch and degrade to system
    if (fileName === 'ttsFactory.js') {
      assert.ok(
        !content.includes('catch (neuralErr)'),
        'AutoTTSProvider must not contain catch-and-degrade behavior'
      );
    }
  }
});

// 36. Real Piper synthesis produces valid audio (environment-dependent)
const realPiperPath = findPiperExecutable();
test('36. Real Piper synthesis produces valid audio (environment-dependent)', {
  skip: !realPiperPath ? 'NOT_CURRENTLY_POSSIBLE: Real Piper executable not available in environment' : false
}, async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phase8_real_piper_'));
  try {
    const provider = createTTSProvider({ provider: 'piper' });
    const res = await provider.synthesize('Hello world', 'en', { outputDir: tmpDir });
    assert.ok(res.audioPath);
    assert.ok(fs.existsSync(res.audioPath));
    assert.ok(res.duration > 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
