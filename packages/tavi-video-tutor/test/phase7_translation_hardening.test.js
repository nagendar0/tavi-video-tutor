// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  TranslationProvider,
  LocalNllbAdapter,
  verifyNllbArtifacts,
  ExternalTranslationAdapter,
  TranslationRouter,
  TranslationError,
  TRANSLATION_ERROR_CODES,
  TranslationCache,
  computeTranslationCacheKey,
  computeLegacyCacheKey,
  TRANSLATION_LANGUAGE_MATRIX,
  getLanguageTranslationCapability,
  isNllbLanguageSupported,
  getNllbLanguageCode,
  FLORES_200_MAPPING
} from '../src/subtitles/translation/index.js';

import { AITUTOR_LANGUAGES } from '../src/subtitles/languages/registry.js';
import { getAllModels } from '../src/subtitles/models/modelRegistry.js';

// Helper to create an isolated temporary cache directory
function createTempDir(prefix = 'aitutor-phase7-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

test('1. Local NLLB provider exposes correct provider ID', () => {
  const adapter = new LocalNllbAdapter();
  assert.equal(adapter.id, 'nllb');
  assert.equal(adapter.isOfflineCapable, true);
  assert.ok(adapter instanceof TranslationProvider);
});

test('2. External provider exposes correct provider ID', () => {
  const adapter = new ExternalTranslationAdapter();
  assert.equal(adapter.id, 'mymemory');
  assert.equal(adapter.isOfflineCapable, false);
  assert.ok(adapter instanceof TranslationProvider);
});

test('3. Local NLLB language mapping resolves deterministically', () => {
  const adapter = new LocalNllbAdapter();
  // Supported languages
  assert.equal(adapter.supports('en', 'es'), true);
  assert.equal(adapter.supports('en', 'hi'), true);
  assert.equal(adapter.supports('en', 'zh'), true);
  assert.equal(FLORES_200_MAPPING.hi, 'hin_Deva');
  assert.equal(FLORES_200_MAPPING.es, 'spa_Latn');

  // Explicitly unsupported languages
  assert.equal(adapter.supports('en', 'bi'), false); // Bislama
  assert.equal(adapter.supports('en', 'ch'), false); // Chamorro
  assert.equal(adapter.supports('en', 'doi'), false); // Dogri
  assert.equal(FLORES_200_MAPPING.bi, null);
  assert.equal(FLORES_200_MAPPING.ch, null);
  assert.equal(FLORES_200_MAPPING.doi, null);
});

test('4. External provider language mapping resolves deterministically', () => {
  const adapter = new ExternalTranslationAdapter();
  assert.equal(adapter.supports('en', 'es'), true);
  assert.equal(adapter.supports('en', 'hi'), true);
  assert.equal(adapter.supports('en', 'fr'), true);
  assert.equal(adapter.supports('en', 'unknown_xyz'), false);
});

test('5. Unsupported translation language is rejected', async () => {
  const adapter = new LocalNllbAdapter();
  const segments = [{ id: 'cue_1', start: 0, end: 2, text: 'Hello' }];

  await assert.rejects(
    async () => {
      await adapter.translateSegments(segments, 'en', 'bi'); // Bislama (unsupported by NLLB)
    },
    (err) => {
      assert.ok(err instanceof TranslationError);
      assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_LANGUAGE_UNSUPPORTED);
      assert.equal(err.provider, 'nllb');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('6. Missing NLLB model in offline mode fails immediately', async () => {
  const emptyCacheDir = createTempDir('nllb-empty-cache-');
  try {
    const adapter = new LocalNllbAdapter({
      cacheDir: emptyCacheDir,
      modelId: 'Xenova/nonexistent-model'
    });
    const segments = [{ id: 'cue_1', start: 0, end: 2, text: 'Hello world' }];

    await assert.rejects(
      async () => {
        await adapter.translateSegments(segments, 'en', 'es');
      },
      (err) => {
        assert.ok(err instanceof TranslationError);
        assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_NOT_CACHED);
        assert.equal(err.provider, 'nllb');
        assert.equal(err.fallbackAttempted, false);
        return true;
      }
    );
  } finally {
    fs.rmSync(emptyCacheDir, { recursive: true, force: true });
  }
});

test('7. Incomplete NLLB artifacts fail immediately', async () => {
  const incompleteCacheDir = createTempDir('nllb-incomplete-cache-');
  try {
    const modelDir = path.join(incompleteCacheDir, 'Xenova', 'nllb-200-distilled-600m');
    fs.mkdirSync(modelDir, { recursive: true });
    // Write only config.json, omitting tokenizer and weights
    fs.writeFileSync(path.join(modelDir, 'config.json'), '{"model_type": "nllb"}', 'utf8');

    const check = verifyNllbArtifacts(modelDir);
    assert.equal(check.valid, false);
    assert.equal(check.code, TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_INVALID);

    const adapter = new LocalNllbAdapter({
      cacheDir: incompleteCacheDir,
      modelId: 'Xenova/nllb-200-distilled-600m'
    });
    const segments = [{ id: 'cue_1', start: 0, end: 2, text: 'Hello incomplete' }];

    await assert.rejects(
      async () => {
        await adapter.translateSegments(segments, 'en', 'es');
      },
      (err) => {
        assert.ok(err instanceof TranslationError);
        assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_INVALID);
        assert.equal(err.provider, 'nllb');
        assert.equal(err.fallbackAttempted, false);
        return true;
      }
    );
  } finally {
    fs.rmSync(incompleteCacheDir, { recursive: true, force: true });
  }
});

test('8. Valid cached NLLB model reaches runtime', async () => {
  let runtimeCalled = false;
  const mockPipeline = async (text, options) => {
    runtimeCalled = true;
    assert.equal(options.src_lang, 'eng_Latn');
    assert.equal(options.tgt_lang, 'spa_Latn');
    return [{ translation_text: 'Hola mundo' }];
  };

  const tempDir = createTempDir('nllb-valid-');
  try {
    const adapter = new LocalNllbAdapter({
      cacheDir: tempDir,
      pipeline: mockPipeline,
      cache: new TranslationCache({ inMemoryOnly: true })
    });

    const segments = [{ id: 'cue_1', start: 0.0, end: 2.0, text: 'Hello world' }];
    const result = await adapter.translateSegments(segments, 'en', 'es');

    assert.equal(runtimeCalled, true);
    assert.equal(result.length, 1);
    assert.equal(result[0].translatedText, 'Hola mundo');
    assert.equal(result[0].text, 'Hola mundo');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('9. Offline NLLB translation performs zero network operations', async () => {
  let networkAttempted = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    networkAttempted = true;
    throw new Error('NETWORK_ACCESS_FORBIDDEN_IN_OFFLINE_MODE');
  };

  try {
    const mockPipeline = async (text) => [{ translation_text: 'Bonjour le monde' }];
    const adapter = new LocalNllbAdapter({
      pipeline: mockPipeline,
      cache: new TranslationCache({ inMemoryOnly: true })
    });

    const segments = [{ id: 'cue_1', start: 0, end: 1.5, text: 'Hello world' }];
    const res = await adapter.translateSegments(segments, 'en', 'fr');

    assert.equal(res[0].text, 'Bonjour le monde');
    assert.equal(networkAttempted, false, 'Offline NLLB translation must not call fetch');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('10. Offline translation never calls MyMemory', async () => {
  let myMemoryCalled = false;
  const mockFetch = async () => {
    myMemoryCalled = true;
    return new Response(JSON.stringify({ responseData: { translatedText: 'Network translation' } }));
  };

  const router = new TranslationRouter({
    mode: 'offline',
    localAdapter: new LocalNllbAdapter({
      pipeline: async () => [{ translation_text: 'Offline translation' }],
      cache: new TranslationCache({ inMemoryOnly: true })
    }),
    externalAdapter: new ExternalTranslationAdapter({
      fetchFn: mockFetch
    })
  });

  const segments = [{ id: 'cue_1', start: 0, end: 1, text: 'Test offline' }];
  const res = await router.translateSegments(segments, 'en', 'es');

  assert.equal(res[0].text, 'Offline translation');
  assert.equal(myMemoryCalled, false, 'MyMemory must never be called in offline mode');
});

test('11. Offline translation never calls Google', async () => {
  let googleCalled = false;
  const mockFetch = async (url) => {
    if (String(url).includes('google')) {
      googleCalled = true;
    }
    return new Response(JSON.stringify({ responseData: { translatedText: 'fail' } }));
  };

  const router = new TranslationRouter({
    mode: 'offline',
    localAdapter: new LocalNllbAdapter({
      pipeline: async () => [{ translation_text: 'Strict offline' }],
      cache: new TranslationCache({ inMemoryOnly: true })
    }),
    externalAdapter: new ExternalTranslationAdapter({
      fetchFn: mockFetch
    })
  });

  const segments = [{ id: 'cue_1', start: 0, end: 1, text: 'Google check' }];
  await router.translateSegments(segments, 'en', 'es');
  assert.equal(googleCalled, false, 'Google endpoints must never be contacted');
});

test('12. MyMemory 429 produces quota error', async () => {
  const mockFetch = async () => ({
    status: 429,
    ok: false,
    json: async () => ({})
  });

  const adapter = new ExternalTranslationAdapter({
    fetchFn: mockFetch,
    cache: new TranslationCache({ inMemoryOnly: true })
  });
  const segments = [{ id: 'cue_1', start: 0, end: 1, text: 'Hello quota' }];

  await assert.rejects(
    async () => {
      await adapter.translateSegments(segments, 'en', 'es');
    },
    (err) => {
      assert.ok(err instanceof TranslationError);
      assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_QUOTA_EXCEEDED);
      assert.equal(err.statusCode, 429);
      assert.equal(err.provider, 'mymemory');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('13. MyMemory 5xx produces provider unavailable error', async () => {
  const mockFetch = async () => ({
    status: 503,
    ok: false,
    json: async () => ({})
  });

  const adapter = new ExternalTranslationAdapter({
    fetchFn: mockFetch,
    maxRetries: 0,
    cache: new TranslationCache({ inMemoryOnly: true })
  });
  const segments = [{ id: 'cue_1', start: 0, end: 1, text: 'Hello server error' }];

  await assert.rejects(
    async () => {
      await adapter.translateSegments(segments, 'en', 'es');
    },
    (err) => {
      assert.ok(err instanceof TranslationError);
      assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_UNAVAILABLE);
      assert.equal(err.statusCode, 503);
      assert.equal(err.provider, 'mymemory');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('14. MyMemory malformed response is rejected', async () => {
  const mockFetch = async () => ({
    status: 200,
    ok: true,
    json: async () => ({ responseStatus: 200, responseData: null }) // Missing translatedText
  });

  const adapter = new ExternalTranslationAdapter({
    fetchFn: mockFetch,
    maxRetries: 0,
    cache: new TranslationCache({ inMemoryOnly: true })
  });
  const segments = [{ id: 'cue_1', start: 0, end: 1, text: 'Malformed check' }];

  await assert.rejects(
    async () => {
      await adapter.translateSegments(segments, 'en', 'es');
    },
    (err) => {
      assert.ok(err instanceof TranslationError);
      assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_BAD_RESPONSE);
      assert.equal(err.provider, 'mymemory');
      assert.equal(err.fallbackAttempted, false);
      return true;
    }
  );
});

test('15. MyMemory failure does not silently fallback to NLLB', async () => {
  let nllbCalled = false;
  const mockNllbPipeline = async () => {
    nllbCalled = true;
    return [{ translation_text: 'Unexpected NLLB fallback' }];
  };

  const router = new TranslationRouter({
    provider: 'mymemory', // Explicit provider
    allowFallback: false,
    localAdapter: new LocalNllbAdapter({
      pipeline: mockNllbPipeline,
      cache: new TranslationCache({ inMemoryOnly: true })
    }),
    externalAdapter: new ExternalTranslationAdapter({
      fetchFn: async () => ({ status: 429, ok: false }),
      cache: new TranslationCache({ inMemoryOnly: true })
    })
  });

  const segments = [{ id: 'cue_1', start: 0, end: 1, text: 'Quota test' }];
  await assert.rejects(
    async () => {
      await router.translateSegments(segments, 'en', 'es');
    },
    (err) => {
      assert.ok(err instanceof TranslationError);
      assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_QUOTA_EXCEEDED);
      return true;
    }
  );

  assert.equal(nllbCalled, false, 'MyMemory failure must NOT silently fallback to NLLB');
});

test('16. NLLB failure does not silently fallback to MyMemory', async () => {
  let myMemoryCalled = false;
  const mockFetch = async () => {
    myMemoryCalled = true;
    return {
      status: 200,
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: 'Silent MyMemory' } })
    };
  };

  const router = new TranslationRouter({
    provider: 'nllb', // Explicit provider
    allowFallback: false,
    localAdapter: new LocalNllbAdapter({
      cacheDir: createTempDir('nllb-fail-'), // Empty dir -> TRANSLATION_MODEL_NOT_CACHED
      cache: new TranslationCache({ inMemoryOnly: true })
    }),
    externalAdapter: new ExternalTranslationAdapter({
      fetchFn: mockFetch,
      cache: new TranslationCache({ inMemoryOnly: true })
    })
  });

  const segments = [{ id: 'cue_1', start: 0, end: 1, text: 'No fallback check' }];
  await assert.rejects(
    async () => {
      await router.translateSegments(segments, 'en', 'es');
    },
    (err) => {
      assert.ok(err instanceof TranslationError);
      assert.equal(err.code, TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_NOT_CACHED);
      return true;
    }
  );

  assert.equal(myMemoryCalled, false, 'NLLB failure must NOT silently fallback to MyMemory');
});

test('17. Same cache key gives cache hit', () => {
  const cache = new TranslationCache({ inMemoryOnly: true });
  const query = {
    text: 'Hello world',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'nllb',
    model: 'nllb-200-distilled-600m'
  };

  cache.set(query, 'Hola mundo');
  const retrieved = cache.get(query);
  assert.equal(retrieved, 'Hola mundo');
});

test('18. Different provider gives different cache key', () => {
  const keyNllb = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'nllb',
    model: 'nllb-200'
  });

  const keyMyMemory = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'mymemory',
    model: 'default'
  });

  assert.notEqual(keyNllb, keyMyMemory, 'Different providers must have distinct cache keys');
});

test('19. Different source language gives different cache key', () => {
  const keyEn = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'nllb'
  });

  const keyFr = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'fr',
    targetLanguage: 'es',
    provider: 'nllb'
  });

  assert.notEqual(keyEn, keyFr, 'Different source languages must have distinct cache keys');
});

test('20. Different target language gives different cache key', () => {
  const keyEs = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'nllb'
  });

  const keyDe = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'de',
    provider: 'nllb'
  });

  assert.notEqual(keyEs, keyDe, 'Different target languages must have distinct cache keys');
});

test('21. Different model/version gives different cache key', () => {
  const key600m = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'nllb',
    model: 'nllb-600m',
    version: 'v1'
  });

  const key13b = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'nllb',
    model: 'nllb-1.3b',
    version: 'v1'
  });

  const keyV2 = computeTranslationCacheKey({
    text: 'Hello',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    provider: 'nllb',
    model: 'nllb-600m',
    version: 'v2'
  });

  assert.notEqual(key600m, key13b, 'Different model IDs must produce different cache keys');
  assert.notEqual(key600m, keyV2, 'Different versions must produce different cache keys');
});

test('22. Translation preserves segment timestamps', async () => {
  const adapter = new LocalNllbAdapter({
    pipeline: async () => [{ translation_text: 'Traducción' }],
    cache: new TranslationCache({ inMemoryOnly: true })
  });

  const segments = [
    { id: 'cue_1', start: 1.25, end: 4.75, text: 'First segment' },
    { id: 'cue_2', start: 5.0, end: 8.5, text: 'Second segment' }
  ];

  const translated = await adapter.translateSegments(segments, 'en', 'es');
  assert.equal(translated.length, 2);
  assert.equal(translated[0].start, 1.25);
  assert.equal(translated[0].end, 4.75);
  assert.equal(translated[1].start, 5.0);
  assert.equal(translated[1].end, 8.5);
});

test('23. Translation preserves speaker IDs', async () => {
  const adapter = new LocalNllbAdapter({
    pipeline: async () => [{ translation_text: 'Traducción' }],
    cache: new TranslationCache({ inMemoryOnly: true })
  });

  const segments = [
    { id: 'cue_1', start: 0, end: 1, text: 'Speaker 1 says this', speakerId: 'spk_0001' },
    { id: 'cue_2', start: 1, end: 2, text: 'Speaker 2 replies', speakerId: 'spk_0002' }
  ];

  const translated = await adapter.translateSegments(segments, 'en', 'es');
  assert.equal(translated[0].speakerId, 'spk_0001');
  assert.equal(translated[1].speakerId, 'spk_0002');
});

test('24. Translation preserves cue ordering', async () => {
  const adapter = new LocalNllbAdapter({
    pipeline: async (text) => [{ translation_text: `Trans_${text}` }],
    cache: new TranslationCache({ inMemoryOnly: true })
  });

  const segments = [
    { id: 'cue_alpha', start: 0, end: 1, text: 'Alpha' },
    { id: 'cue_beta', start: 1, end: 2, text: 'Beta' },
    { id: 'cue_gamma', start: 2, end: 3, text: 'Gamma' }
  ];

  const translated = await adapter.translateSegments(segments, 'en', 'es');
  assert.equal(translated[0].id, 'cue_alpha');
  assert.equal(translated[1].id, 'cue_beta');
  assert.equal(translated[2].id, 'cue_gamma');
});

test('25. Translation preserves segment metadata', async () => {
  const adapter = new LocalNllbAdapter({
    pipeline: async () => [{ translation_text: 'Metadata preserved' }],
    cache: new TranslationCache({ inMemoryOnly: true })
  });

  const segments = [
    {
      id: 'cue_meta',
      start: 0,
      end: 2,
      text: 'Sample',
      confidence: 0.99,
      customTag: 'lesson_intro',
      words: [{ word: 'Sample', start: 0, end: 0.5 }]
    }
  ];

  const translated = await adapter.translateSegments(segments, 'en', 'es');
  assert.equal(translated[0].confidence, 0.99);
  assert.equal(translated[0].customTag, 'lesson_intro');
  assert.deepEqual(translated[0].words, [{ word: 'Sample', start: 0, end: 0.5 }]);
});

test('26. Concurrent local translation does not duplicate model initialization unnecessarily', async () => {
  let initCounter = 0;
  const mockPipelineLoader = async () => {
    initCounter++;
    // Simulate async model weight loading
    await new Promise(r => setTimeout(r, 50));
    return async (text) => [{ translation_text: `Translated_${text}` }];
  };

  const adapter = new LocalNllbAdapter({
    pipelineLoader: mockPipelineLoader,
    cache: new TranslationCache({ inMemoryOnly: true })
  });

  // Launch two concurrent translations simultaneously on empty cache
  const p1 = adapter.translateSegments([{ id: 'c1', start: 0, end: 1, text: 'Batch 1' }], 'en', 'es');
  const p2 = adapter.translateSegments([{ id: 'c2', start: 1, end: 2, text: 'Batch 2' }], 'en', 'es');

  const [res1, res2] = await Promise.all([p1, p2]);
  assert.ok(res1[0].text);
  assert.ok(res2[0].text);
  assert.equal(initCounter, 1, 'Pipeline loader should be called exactly once during concurrent init');
});

test('27. External request concurrency is bounded', async () => {
  let inFlight = 0;
  let maxObservedInFlight = 0;

  const mockFetch = async () => {
    inFlight++;
    if (inFlight > maxObservedInFlight) {
      maxObservedInFlight = inFlight;
    }
    await new Promise(r => setTimeout(r, 20));
    inFlight--;
    return {
      status: 200,
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: 'Bounded response' } })
    };
  };

  const adapter = new ExternalTranslationAdapter({
    fetchFn: mockFetch,
    maxConcurrency: 3,
    cache: new TranslationCache({ inMemoryOnly: true })
  });

  const segments = Array.from({ length: 9 }, (_, i) => ({
    id: `cue_${i}`,
    start: i,
    end: i + 1,
    text: `Text item ${i}`
  }));

  await adapter.translateSegments(segments, 'en', 'es');
  assert.ok(maxObservedInFlight <= 3, `Max in-flight requests (${maxObservedInFlight}) must not exceed maxConcurrency (3)`);
});

test('28. No translation provider mutates ModelRegistry', async () => {
  const modelsBefore = getAllModels();
  const countBefore = modelsBefore.length;

  const localAdapter = new LocalNllbAdapter({
    pipeline: async () => [{ translation_text: 'Registry safety' }],
    cache: new TranslationCache({ inMemoryOnly: true })
  });
  await localAdapter.translateSegments([{ id: '1', start: 0, end: 1, text: 'Test' }], 'en', 'es');

  const externalAdapter = new ExternalTranslationAdapter({
    fetchFn: async () => ({
      status: 200,
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: { translatedText: 'Test external' } })
    }),
    cache: new TranslationCache({ inMemoryOnly: true })
  });
  await externalAdapter.translateSegments([{ id: '2', start: 0, end: 1, text: 'Test' }], 'en', 'es');

  const modelsAfter = getAllModels();
  assert.equal(modelsAfter.length, countBefore, 'ModelRegistry count must not change');
  assert.deepEqual(modelsAfter, modelsBefore, 'ModelRegistry content must not be mutated');
});

test('29. No translation provider performs policy decisions', () => {
  const localAdapter = new LocalNllbAdapter();
  const externalAdapter = new ExternalTranslationAdapter();

  // Translation adapters are technical providers: zero policy engine state or commercial assertions
  assert.equal(typeof localAdapter.policyEngine, 'undefined');
  assert.equal(typeof externalAdapter.policyEngine, 'undefined');
  assert.equal(typeof localAdapter.standardAApproved, 'undefined');
  assert.equal(typeof externalAdapter.commercialPermitted, 'undefined');
});

test('30. Translation result conforms to existing subtitle-segment contract', async () => {
  const adapter = new LocalNllbAdapter({
    pipeline: async () => [{ translation_text: 'Contrato de subtítulo' }],
    cache: new TranslationCache({ inMemoryOnly: true })
  });

  const segments = [{
    id: 'seg_101',
    start: 2.0,
    end: 5.5,
    text: 'Subtitle contract test',
    speakerId: 'narrator_1'
  }];

  const result = await adapter.translateSegments(segments, 'en', 'es');
  const res = result[0];

  assert.equal(typeof res.id, 'string');
  assert.equal(typeof res.start, 'number');
  assert.equal(typeof res.end, 'number');
  assert.equal(typeof res.text, 'string');
  assert.equal(typeof res.originalText, 'string');
  assert.equal(typeof res.translatedText, 'string');
  assert.equal(res.originalText, 'Subtitle contract test');
  assert.equal(res.translatedText, 'Contrato de subtítulo');
  assert.equal(res.text, 'Contrato de subtítulo');
  assert.equal(res.speakerId, 'narrator_1');
});

test('31. Full 109-language matrix completeness and accuracy', () => {
  assert.equal(TRANSLATION_LANGUAGE_MATRIX.length, 109, 'Matrix must contain exactly 109 languages');
  assert.equal(AITUTOR_LANGUAGES.length, 109, 'Registry must contain exactly 109 languages');

  let offlineCount = 0;
  let externalCount = 0;
  const offlineUnsupported = [];

  for (const record of TRANSLATION_LANGUAGE_MATRIX) {
    assert.ok(record.languageCode, 'languageCode must be non-empty');
    assert.ok(record.name, 'name must be non-empty');
    assert.ok(record.bcp47, 'bcp47 must be non-empty');
    assert.ok(record.notes, 'notes must not be empty');
    assert.ok(!record.notes.includes('etc.'), 'notes must not contain "etc."');

    if (record.offlineSupported) {
      offlineCount++;
      assert.ok(record.nllbCode, `nllbCode must exist for offline supported language ${record.languageCode}`);
    } else {
      offlineUnsupported.push(record.languageCode);
      assert.equal(record.nllbCode, null, `nllbCode must be null for offline unsupported language ${record.languageCode}`);
    }

    if (record.externalProviderSupport) {
      externalCount++;
    }

    assert.equal(record.translationSupported, true, `Language ${record.languageCode} must be translation supported`);
  }

  assert.equal(offlineCount, 106, 'Exactly 106 languages must be supported offline by NLLB-200');
  assert.equal(offlineUnsupported.length, 3, 'Exactly 3 languages must be unsupported offline');
  assert.deepEqual(offlineUnsupported.sort(), ['bi', 'ch', 'doi'], 'Offline unsupported languages must be bi, ch, doi');
  assert.equal(externalCount, 109, 'All 109 languages must be supported by external translation');

  // Verify lookup helpers
  assert.equal(isNllbLanguageSupported('hi'), true);
  assert.equal(getNllbLanguageCode('hi'), 'hin_Deva');
  assert.equal(isNllbLanguageSupported('bi'), false);
  assert.equal(getNllbLanguageCode('bi'), null);

  const cap = getLanguageTranslationCapability('es');
  assert.ok(cap);
  assert.equal(cap.languageCode, 'es');
  assert.equal(cap.offlineSupported, true);
  assert.equal(cap.nllbCode, 'spa_Latn');
});

test('32. Real NLLB offline inference (environment-dependent)', async (t) => {
  // Check if real transformers runtime is installed
  let transformersInstalled = false;
  try {
    const { getTransformers } = await import('../src/subtitles/transcription/transformersLoader.js');
    await getTransformers();
    transformersInstalled = true;
  } catch (_) {}

  const globalCacheDir = path.join(os.homedir(), '.cache', 'aitutor', 'models');
  const modelDir = path.join(globalCacheDir, 'Xenova', 'nllb-200-distilled-600m');
  const modelCached = verifyNllbArtifacts(modelDir).valid;

  if (!transformersInstalled || !modelCached) {
    t.skip(
      `NOT_CURRENTLY_POSSIBLE: Real NLLB runtime/model not present in environment ` +
      `(transformers=${transformersInstalled}, modelCached=${modelCached})`
    );
    return;
  }

  const adapter = new LocalNllbAdapter({ cacheDir: globalCacheDir });
  const segments = [{ id: 'cue_real', start: 0, end: 2, text: 'Hello world' }];
  const result = await adapter.translateSegments(segments, 'en', 'es');

  assert.equal(result.length, 1);
  assert.ok(result[0].text && result[0].text.length > 0);
  assert.notEqual(result[0].text.toLowerCase(), 'hello world');
});
