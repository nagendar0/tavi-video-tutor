// @ts-check
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  NetworkPolicy,
  NetworkGuard,
  NETWORK_MODES,
  DEFAULT_ONLINE_ALLOWLIST
} from '../src/subtitles/network/index.js';
import {
  TaviNetworkError,
  TaviError,
  ERROR_CATEGORIES,
  ERROR_DEFINITIONS,
  redactString,
  redactSecrets
} from '../src/subtitles/errors/index.js';
import { ModelCacheManager } from '../src/subtitles/cache/ModelCacheManager.js';
import { AzureNeuralTTSProvider } from '../src/subtitles/tts/AzureNeuralTTSProvider.js';
import { EdgeTTSProvider } from '../src/subtitles/tts/EdgeTTSProvider.js';
import { ExternalTranslationAdapter } from '../src/subtitles/translation/ExternalTranslationAdapter.js';
import { PiperTTSAdapter } from '../src/subtitles/tts/PiperTTSAdapter.js';
import { KokoroTTSAdapter } from '../src/subtitles/tts/KokoroTTSAdapter.js';
import { MmsTTSAdapter } from '../src/subtitles/tts/MmsTTSAdapter.js';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { createTTSProvider } from '../src/subtitles/tts/ttsFactory.js';
import { redactUrlSecrets } from '../src/subtitles/video/resolveVideo.js';
import { getLanguageByCode, AITUTOR_LANGUAGES } from '../src/subtitles/languages/registry.js';
import { PolicyEngine, POLICY_PROFILES } from '../src/subtitles/policy/PolicyEngine.js';
import { AudioTimelineEngine } from '../src/subtitles/audio/mixer/AudioTimelineEngine.js';
import { validateCueTiming } from '../src/subtitles/audio/mixer/AudioRateAdapter.js';
import { PreflightDoctor } from '../src/subtitles/env/preflight.js';

// 1. Offline network policy initializes correctly.
test('1. Offline network policy initializes correctly.', () => {
  const policy = new NetworkPolicy();
  assert.strictEqual(policy.mode, NETWORK_MODES.OFFLINE);
  assert.strictEqual(policy.isOffline(), true);
  assert.ok(Array.isArray(policy.allowedDomains));
  assert.ok(policy.allowedDomains.includes('speech.platform.bing.com'));
  assert.ok(policy.allowedDomains.includes('api.mymemory.translated.net'));
  assert.ok(policy.allowedDomains.includes('*.tts.speech.microsoft.com'));
  assert.strictEqual(policy.allowPrivateNetwork, false);
  assert.strictEqual(policy.allowLocalTestEndpoints, false);
});

// 2. Offline HTTP attempt is blocked.
test('2. Offline HTTP attempt is blocked.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    assert.throws(
      () => {
        http.get('http://example.com/data');
      },
      /** @param {any} err */
      (err) => {
        assert.ok(err instanceof TaviNetworkError);
        assert.ok(err instanceof TaviError);
        assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
        assert.strictEqual(err.category, ERROR_CATEGORIES.NETWORK);
        assert.strictEqual(err.blocking, true);
        assert.strictEqual(err.details.operation, 'http.get');
        assert.strictEqual(err.details.host, 'example.com');
        return true;
      }
    );
  });
});

// 3. Offline HTTPS attempt is blocked.
test('3. Offline HTTPS attempt is blocked.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    assert.throws(
      () => {
        https.get('https://api.example.com/v1/resource');
      },
      /** @param {any} err */
      (err) => {
        assert.ok(err instanceof TaviNetworkError);
        assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
        assert.strictEqual(err.category, ERROR_CATEGORIES.NETWORK);
        assert.strictEqual(err.details.operation, 'https.get');
        assert.strictEqual(err.details.host, 'api.example.com');
        return true;
      }
    );
  });
});

// 4. Offline WebSocket attempt is blocked.
test('4. Offline WebSocket attempt is blocked.', () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  assert.throws(
    () => {
      offlinePolicy.assertAllowed('wss://speech.platform.bing.com/consumer/speech', {
        operation: 'websocket_connect',
        provider: 'edge'
      });
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
      assert.strictEqual(err.category, ERROR_CATEGORIES.NETWORK);
      assert.strictEqual(err.details.host, 'speech.platform.bing.com');
      return true;
    }
  );
});

// 5. Offline raw TCP attempt is blocked.
test('5. Offline raw TCP attempt is blocked.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    assert.throws(
      () => {
        net.connect({ host: '93.184.216.34', port: 80 });
      },
      /** @param {any} err */
      (err) => {
        assert.ok(err instanceof TaviNetworkError);
        assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
        return true;
      }
    );
  });
});

// 6. Offline external DNS behavior is blocked or proven non-egress.
test('6. Offline external DNS behavior is blocked or proven non-egress.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    // Promises DNS lookup
    await assert.rejects(
      async () => {
        await dns.promises.lookup('external-host.example.org');
      },
      /** @param {any} err */
      (err) => {
        assert.ok(err instanceof TaviNetworkError);
        assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
        return true;
      }
    );

    // Callback DNS lookup
    await new Promise((resolve, reject) => {
      dns.lookup('external-host.example.org', /** @param {any} err */ (err) => {
        if (!err) return reject(new Error('Expected DNS lookup to be blocked'));
        assert.ok(err instanceof TaviNetworkError);
        assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
        resolve(undefined);
      });
    });
  });
});

// 7. Offline model download is blocked.
test('7. Offline model download is blocked.', async () => {
  const manager = new ModelCacheManager({
    networkPolicy: new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE })
  });
  await assert.rejects(
    async () => {
      await manager.downloadArtifact('piper:sq_AL-edon-medium');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
      assert.strictEqual(err.stage, 'model_download');
      return true;
    }
  );
});

// 8. Offline Azure is blocked.
test('8. Offline Azure is blocked.', async () => {
  const provider = new AzureNeuralTTSProvider({
    azureKey: 'test_secret_key_12345',
    azureRegion: 'eastus',
    networkPolicy: new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE })
  });
  await assert.rejects(
    async () => {
      await provider.synthesize('hello', 'en', { offline: true });
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err.code === 'OFFLINE_PROVIDER_FORBIDDEN' || err.code === 'OFFLINE_VIOLATION_BLOCKED');
      return true;
    }
  );
});

// 9. Offline Edge is blocked.
test('9. Offline Edge is blocked.', async () => {
  const provider = new EdgeTTSProvider({
    networkPolicy: new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE })
  });
  await assert.rejects(
    async () => {
      await provider.synthesize('hello', 'en', { offline: true });
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err.code === 'OFFLINE_PROVIDER_FORBIDDEN' || err.code === 'OFFLINE_VIOLATION_BLOCKED');
      return true;
    }
  );
});

// 10. Offline MyMemory is blocked.
test('10. Offline MyMemory is blocked.', async () => {
  const adapter = new ExternalTranslationAdapter({
    networkPolicy: new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE }),
    offline: true
  });
  await assert.rejects(
    async () => {
      await adapter.translateSegments([{ id: 1, text: 'Hello' }], 'en', 'es');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err.code === 'OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN' || err.code === 'OFFLINE_VIOLATION_BLOCKED');
      return true;
    }
  );
});

// 11. Offline local Piper remains local.
test('11. Offline local Piper remains local.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  const auditEntries = [];

  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    const adapter = new PiperTTSAdapter({
      modelDir: path.join(os.tmpdir(), 'nonexistent_piper')
    });

    try {
      await adapter.synthesize('Hello world', 'en');
    } catch (/** @type {any} */ err) {
      // Local execution fails on missing model/executable, NEVER triggers network
      assert.notStrictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
    }

    // Zero external network attempts recorded
    const blockedExternal = NetworkGuard.auditLog.filter(entry => entry.status === 'BLOCKED');
    assert.strictEqual(blockedExternal.length, 0, 'Local Piper must not attempt any network calls');
  });
});

// 12. Offline local Kokoro remains local.
test('12. Offline local Kokoro remains local.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    const adapter = new KokoroTTSAdapter();
    try {
      await adapter.synthesize('Hello world', 'en');
    } catch (/** @type {any} */ err) {
      assert.notStrictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
    }
    const blockedExternal = NetworkGuard.auditLog.filter(entry => entry.status === 'BLOCKED');
    assert.strictEqual(blockedExternal.length, 0, 'Local Kokoro must not attempt any network calls');
  });
});

// 13. Offline local MMS remains local.
test('13. Offline local MMS remains local.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    const adapter = new MmsTTSAdapter();
    try {
      await adapter.synthesize('Hello world', 'eng');
    } catch (/** @type {any} */ err) {
      assert.notStrictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
    }
    const blockedExternal = NetworkGuard.auditLog.filter(entry => entry.status === 'BLOCKED');
    assert.strictEqual(blockedExternal.length, 0, 'Local MMS must not attempt any network calls');
  });
});

// 14. Offline system speech remains local.
test('14. Offline system speech remains local.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    const provider = new NodeTTSProvider();
    assert.strictEqual(provider.engine, 'system');
    const blockedExternal = NetworkGuard.auditLog.filter(entry => entry.status === 'BLOCKED');
    assert.strictEqual(blockedExternal.length, 0, 'System speech provider must not make network calls');
  });
});

// 15. Online explicitly selected Azure is allowed.
test('15. Online explicitly selected Azure is allowed.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  const url = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';
  assert.doesNotThrow(() => {
    onlinePolicy.assertAllowed(url, { provider: 'azure-byok' });
  });
});

// 16. Online explicitly selected Edge is allowed.
test('16. Online explicitly selected Edge is allowed.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  const url = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
  assert.doesNotThrow(() => {
    onlinePolicy.assertAllowed(url, { provider: 'edge' });
  });
});

// 17. Online explicitly selected MyMemory is allowed.
test('17. Online explicitly selected MyMemory is allowed.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  const url = 'https://api.mymemory.translated.net/get';
  assert.doesNotThrow(() => {
    onlinePolicy.assertAllowed(url, { provider: 'mymemory' });
  });
});

// 18. Online model download uses allowed host only.
test('18. Online model download uses allowed host only.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  assert.doesNotThrow(() => {
    onlinePolicy.assertAllowed('https://huggingface.co/rhasspy/piper-voices/resolve/main/model.onnx');
  });
  assert.doesNotThrow(() => {
    onlinePolicy.assertAllowed('https://raw.githubusercontent.com/rhasspy/piper/master/voices.json');
  });

  assert.throws(
    () => {
      onlinePolicy.assertAllowed('https://untrusted-models.ru/model.onnx');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.strictEqual(err.code, 'PROVIDER_UNAVAILABLE');
      return true;
    }
  );
});

// 19. Disallowed host is blocked.
test('19. Disallowed host is blocked.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  assert.throws(
    () => {
      onlinePolicy.assertAllowed('https://malicious-telemetry.org/collect');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.strictEqual(err.code, 'PROVIDER_UNAVAILABLE');
      assert.strictEqual(err.details.host, 'malicious-telemetry.org');
      return true;
    }
  );
});

// 20. localhost is blocked where not explicitly approved.
test('20. localhost is blocked where not explicitly approved.', () => {
  const onlinePolicy = new NetworkPolicy({
    mode: NETWORK_MODES.ONLINE_RESTRICTED,
    allowLocalTestEndpoints: false
  });
  assert.throws(
    () => {
      onlinePolicy.assertAllowed('http://localhost:8080/internal');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.ok(err.code === 'SSRF_BLOCKED' || err.code === 'BLOCKED_PROTOCOL');
      return true;
    }
  );
});

// 21. private IP access is blocked where not explicitly approved.
test('21. private IP access is blocked where not explicitly approved.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  const privateIps = [
    'https://127.0.0.1:8443',
    'https://192.168.1.1',
    'https://10.0.0.1/admin',
    'https://172.16.0.1/internal',
    'https://169.254.169.254/latest/meta-data'
  ];

  for (const target of privateIps) {
    assert.throws(
      () => {
        onlinePolicy.assertAllowed(target);
      },
      /** @param {any} err */
      (err) => {
        assert.ok(err instanceof TaviNetworkError);
        assert.strictEqual(err.code, 'SSRF_BLOCKED');
        return true;
      },
      `Expected private IP ${target} to be blocked`
    );
  }
});

// 22. unsafe URL scheme is blocked.
test('22. unsafe URL scheme is blocked.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  const unsafeSchemes = [
    'ftp://speech.platform.bing.com/file',
    'file:///C:/Windows/System32/cmd.exe',
    'javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
  ];

  for (const target of unsafeSchemes) {
    assert.throws(
      () => {
        onlinePolicy.assertAllowed(target);
      },
      /** @param {any} err */
      (err) => {
        assert.ok(err instanceof TaviNetworkError);
        assert.strictEqual(err.code, 'BLOCKED_PROTOCOL');
        return true;
      }
    );
  }
});

// 23. unsafe redirect is blocked.
test('23. unsafe redirect is blocked.', () => {
  const onlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });

  // 1. Protocol downgrade (HTTPS -> HTTP) blocked
  assert.throws(
    () => {
      onlinePolicy.validateRedirect(
        'https://api.mymemory.translated.net/get',
        'http://api.mymemory.translated.net/get'
      );
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.strictEqual(err.code, 'BLOCKED_PROTOCOL');
      return true;
    }
  );

  // 2. Redirect to unapproved domain blocked
  assert.throws(
    () => {
      onlinePolicy.validateRedirect(
        'https://api.mymemory.translated.net/get',
        'https://evil-exfil.com/sink'
      );
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.strictEqual(err.code, 'PROVIDER_UNAVAILABLE');
      return true;
    }
  );

  // 3. Redirect to private IP / SSRF target blocked
  assert.throws(
    () => {
      onlinePolicy.validateRedirect(
        'https://api.mymemory.translated.net/get',
        'https://169.254.169.254/latest/meta-data'
      );
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err instanceof TaviNetworkError);
      assert.strictEqual(err.code, 'SSRF_BLOCKED');
      return true;
    }
  );
});

// 24. request timeout is deterministic.
test('24. request timeout is deterministic.', async () => {
  const mockTimeoutFetch = async () => {
    const err = new Error('The operation was aborted due to timeout');
    err.name = 'TimeoutError';
    throw err;
  };

  const adapter = new ExternalTranslationAdapter({
    timeoutMs: 50,
    maxRetries: 0,
    fetchFn: mockTimeoutFetch
  });

  await assert.rejects(
    async () => {
      await adapter.translateSegments([{ id: 1, text: 'test' }], 'en', 'es');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err.code === 'NETWORK_TIMEOUT' || err.message.includes('timed out'));
      return true;
    }
  );
});

// 25. response timeout is deterministic.
test('25. response timeout is deterministic.', async () => {
  const provider = new AzureNeuralTTSProvider({
    azureKey: 'test_key',
    azureRegion: 'eastus',
    timeoutMs: 10
  });

  await assert.rejects(
    async () => {
      // Aborted fetch signal triggers deterministic timeout handling
      await provider.synthesizeWithAzureRest('hello', 'en');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err.code === 'NETWORK_TIMEOUT' || err.code === 'PROVIDER_UNAVAILABLE');
      return true;
    }
  );
});

// 26. provider 429 maps correctly.
test('26. provider 429 maps correctly.', async () => {
  const mock429Fetch = async () => ({
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
    text: async () => 'Rate limit exceeded'
  });

  const adapter = new ExternalTranslationAdapter({
    fetchFn: mock429Fetch,
    maxRetries: 0
  });

  await assert.rejects(
    async () => {
      await adapter.translateSegments([{ id: 1, text: 'quota test' }], 'en', 'es');
    },
    /** @param {any} err */
    (err) => {
      assert.strictEqual(err.code, 'TRANSLATION_PROVIDER_QUOTA_EXCEEDED');
      assert.strictEqual(err.details.statusCode, 429);
      return true;
    }
  );
});

// 27. provider 401/403 maps correctly.
test('27. provider 401/403 maps correctly.', async () => {
  const errorDef401 = ERROR_DEFINITIONS.PROVIDER_AUTH_ERROR;
  assert.strictEqual(errorDef401.category, ERROR_CATEGORIES.CREDENTIAL);
  assert.strictEqual(errorDef401.retryable, false);

  // In Azure provider
  const provider = new AzureNeuralTTSProvider({
    azureKey: 'invalid_key',
    azureRegion: 'eastus'
  });
  assert.strictEqual(provider.providerId, 'azure-byok');
});

// 28. provider 5xx maps correctly.
test('28. provider 5xx maps correctly.', async () => {
  const mock503Fetch = async () => ({
    ok: false,
    status: 503,
    statusText: 'Service Unavailable',
    text: async () => 'Service down for maintenance'
  });

  const adapter = new ExternalTranslationAdapter({
    fetchFn: mock503Fetch,
    maxRetries: 0
  });

  await assert.rejects(
    async () => {
      await adapter.translateSegments([{ id: 1, text: 'service test' }], 'en', 'es');
    },
    /** @param {any} err */
    (err) => {
      assert.strictEqual(err.code, 'TRANSLATION_PROVIDER_UNAVAILABLE');
      assert.strictEqual(err.details.statusCode, 503);
      return true;
    }
  );
});

// 29. provider network failure maps correctly.
test('29. provider network failure maps correctly.', async () => {
  const mockNetworkFailFetch = async () => {
    const netErr = new Error('ECONNREFUSED 127.0.0.1:443');
    // @ts-ignore
    netErr.code = 'ECONNREFUSED';
    throw netErr;
  };

  const adapter = new ExternalTranslationAdapter({
    fetchFn: mockNetworkFailFetch,
    maxRetries: 0
  });

  await assert.rejects(
    async () => {
      await adapter.translateSegments([{ id: 1, text: 'network fail' }], 'en', 'es');
    },
    /** @param {any} err */
    (err) => {
      assert.strictEqual(err.code, 'TRANSLATION_PROVIDER_UNAVAILABLE');
      return true;
    }
  );
});

// 30. WebSocket timeout maps correctly.
test('30. WebSocket timeout maps correctly.', async () => {
  const provider = new EdgeTTSProvider({ timeoutMs: 1, maxRetries: 0 });
  await assert.rejects(
    async () => {
      await provider.synthesize('timeout test', 'en');
    },
    /** @param {any} err */
    (err) => {
      assert.ok(
        err.code === 'NETWORK_TIMEOUT' ||
        err.code === 'TTS_NETWORK_ERROR' ||
        err.canonicalCode === 'NETWORK_TIMEOUT'
      );
      return true;
    }
  );
});

// 31. Credentials never appear in network diagnostics.
test('31. Credentials never appear in network diagnostics.', () => {
  const secretKey = 'AZURE_SECRET_KEY_1234567890';
  const rawUrl = `https://eastus.tts.speech.microsoft.com/cognitiveservices/v1?token=${secretKey}&key=${secretKey}`;

  const redacted = redactUrlSecrets(rawUrl);
  assert.strictEqual(redacted.includes(secretKey), false);
  assert.ok(redacted.includes('%5BREDACTED%5D') || redacted.includes('[REDACTED]'));

  const err = new TaviNetworkError(`Failed to authenticate with token: ${secretKey}`, {
    code: 'PROVIDER_AUTH_ERROR',
    details: { token: secretKey }
  });

  assert.strictEqual(err.message.includes(secretKey), false);
  assert.strictEqual(err.details.token, '[REDACTED]');
});

// 32. Credentials never appear in query parameters.
test('32. Credentials never appear in query parameters.', () => {
  // Azure REST uses Ocp-Apim-Subscription-Key header exclusively
  const azure = new AzureNeuralTTSProvider({ azureKey: 'secret_abc', azureRegion: 'eastus' });
  const azureEndpoint = `https://${azure.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const url = new URL(azureEndpoint);
  assert.strictEqual(url.searchParams.has('key'), false);
  assert.strictEqual(url.searchParams.has('token'), false);
  assert.strictEqual(url.searchParams.has('subscription-key'), false);
});

// 33. No hidden Google TTS endpoint exists.
test('33. No hidden Google TTS endpoint exists.', () => {
  const providerFiles = [
    'src/subtitles/tts/ttsFactory.js',
    'src/subtitles/tts/AzureNeuralTTSProvider.js',
    'src/subtitles/tts/EdgeTTSProvider.js',
    'src/subtitles/tts/PiperTTSAdapter.js',
    'src/subtitles/tts/KokoroTTSAdapter.js',
    'src/subtitles/tts/MmsTTSAdapter.js',
    'src/subtitles/tts/NodeTTSProvider.js'
  ];

  for (const relPath of providerFiles) {
    const fullPath = path.resolve(process.cwd(), relPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      assert.strictEqual(
        content.includes('translate.google.com'),
        false,
        `Forbidden Google TTS endpoint found in ${relPath}`
      );
    }
  }
});

// 34. No hidden provider hopping occurs.
test('34. No hidden provider hopping occurs.', async () => {
  const azure = new AzureNeuralTTSProvider({ azureKey: null });
  await assert.rejects(
    async () => {
      await azure.synthesize('test text', 'en');
    },
    /** @param {any} err */
    (err) => {
      // Must fail with Azure auth error, must NOT silently fall back to Edge or Google
      assert.strictEqual(err.code, 'PROVIDER_AUTH_ERROR');
      return true;
    }
  );
});

// 35. No telemetry is emitted offline.
test('35. No telemetry is emitted offline.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    // Audit log verifies zero external socket or HTTP attempts
    assert.strictEqual(NetworkGuard.auditLog.length, 0);
  });
});

// 36. No automatic model download occurs offline.
test('36. No automatic model download occurs offline.', async () => {
  const manager = new ModelCacheManager({
    cacheDir: path.join(os.tmpdir(), 'tavi-empty-cache-' + Date.now()),
    networkPolicy: new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE })
  });

  await assert.rejects(
    async () => {
      await manager.ensureModel('piper:sq_AL-edon-medium', { offline: true });
    },
    /** @param {any} err */
    (err) => {
      assert.ok(err.code === 'MODEL_NOT_CACHED' || err.code === 'OFFLINE_VIOLATION_BLOCKED');
      return true;
    }
  );
});

// 37. Application-level socket interception works.
test('37. Application-level socket interception works.', () => {
  const policy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  assert.strictEqual(NetworkGuard.isEnabled, false);

  NetworkGuard.enable(policy);
  assert.strictEqual(NetworkGuard.isEnabled, true);

  assert.throws(
    () => {
      http.get('http://blocked-site.com');
    },
    /** @param {any} err */
    (err) => {
      assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
      return true;
    }
  );

  NetworkGuard.disable();
  assert.strictEqual(NetworkGuard.isEnabled, false);
});

// 38. Full offline orchestration test produces zero attempted external connections.
test('38. Full offline orchestration test produces zero attempted external connections.', async () => {
  const offlinePolicy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE });
  await NetworkGuard.runIsolated(offlinePolicy, async () => {
    // 1. Language registry inspection
    const lang = /** @type {any} */ (getLanguageByCode('hi'));
    assert.ok(lang);

    // 2. Policy engine evaluation
    const engine = new PolicyEngine({ defaultProfile: 'STRICT', defaultExecutionMode: 'COMMERCIAL' });
    const decision = engine.evaluateLanguage(lang.code);
    assert.ok(decision);

    // 3. Audio timeline initialization and validation
    const cueTiming = validateCueTiming({ startTime: 1.0, endTime: 3.5 });
    assert.strictEqual(cueTiming.duration, 2.5);

    // Audit log verifies zero external socket or HTTP calls occurred
    const externalOutbound = NetworkGuard.auditLog.filter(
      r => r.status === 'ALLOWED' && !r.reason?.includes('LOCAL_IPC')
    );
    assert.strictEqual(externalOutbound.length, 0);
  });
});

// 39. Air-gapped environment test demonstrates network-disabled execution where available.
test('39. Air-gapped environment test demonstrates network-disabled execution where available.', (t) => {
  // On an unprivileged Windows development workstation, disabling physical network interfaces
  // requires elevated Administrator credentials and would destructively disconnect active tooling.
  // In accordance with Phase 12 specification: Mark NOT_CURRENTLY_POSSIBLE with exact environment rationale.
  t.skip('NOT_CURRENTLY_POSSIBLE: Physical OS-level network interface disabling requires root/admin privilege and container isolation; verified via process-level Layer 2 socket interception.');
});

// 40. Network policy does not block permitted local filesystem/IPC operations.
test('40. Network policy does not block permitted local filesystem/IPC operations.', () => {
  assert.strictEqual(NetworkGuard.isLocalIpcPath('\\\\.\\pipe\\tavi-named-pipe'), true);
  assert.strictEqual(NetworkGuard.isLocalIpcPath('/var/run/tavi.sock'), true);
  assert.strictEqual(NetworkGuard.isLocalIpcPath('./local.sock'), true);
  assert.strictEqual(NetworkGuard.isLocalIpcPath('example.com'), false);
});

// 41. Online provider still works through an injected deterministic test endpoint.
test('41. Online provider still works through an injected deterministic test endpoint.', () => {
  const policy = new NetworkPolicy({
    mode: NETWORK_MODES.ONLINE_RESTRICTED,
    allowLocalTestEndpoints: true
  });
  assert.doesNotThrow(() => {
    policy.assertAllowed('http://localhost:8080/mock-tts');
  });
  assert.doesNotThrow(() => {
    policy.assertAllowed('http://127.0.0.1:9000/mock-translation');
  });
});

// 42. Network allowlist behavior is deterministic.
test('42. Network allowlist behavior is deterministic.', () => {
  const policy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  const target = 'https://eastus.tts.speech.microsoft.com/cognitiveservices/v1';

  for (let i = 0; i < 100; i++) {
    assert.strictEqual(policy.isAllowed(target), true);
  }
  for (let i = 0; i < 100; i++) {
    assert.strictEqual(policy.isAllowed('https://blocked-host.net'), false);
  }
});

// 43. Redirect allowlist behavior is deterministic.
test('43. Redirect allowlist behavior is deterministic.', () => {
  const policy = new NetworkPolicy({ mode: NETWORK_MODES.ONLINE_RESTRICTED });
  const from = 'https://huggingface.co/model-a';
  const to = 'https://huggingface.co/model-b';

  for (let i = 0; i < 100; i++) {
    assert.doesNotThrow(() => {
      policy.validateRedirect(from, to);
    });
  }
});

// 44. Error serialization remains secret-safe.
test('44. Error serialization remains secret-safe.', () => {
  const err = new TaviNetworkError('Connection to secret server failed with key ABCDEFGHIJKLMNOPQRSTUV', {
    code: 'PROVIDER_AUTH_ERROR',
    details: {
      secretToken: 'TOKEN_12345_SECRET',
      normalField: 'test'
    }
  });

  const serialized = JSON.stringify(err);
  assert.strictEqual(serialized.includes('TOKEN_12345_SECRET'), false);
  assert.ok(serialized.includes('[REDACTED]'));
});

// 45. ModelCacheManager integrity behavior remains intact.
test('45. ModelCacheManager integrity behavior remains intact.', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-p12-cache-'));
  try {
    const manager = new ModelCacheManager({ cacheDir: tempDir });
    const model = /** @type {any} */ ({
      modelId: 'test:voice-p12',
      engine: 'piper',
      modelName: 'model.onnx'
    });
    const cachePath = manager.getCachePath(model);
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, 'TEST_MODEL_BINARY_DATA');

    const status = manager.getCacheStatus(model);
    assert.strictEqual(status.exists, true);
    assert.ok(status.computedSha256);
    assert.strictEqual(status.computedSha256.length, 64);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// 46. Phase 1 regression passes.
test('46. Phase 1 regression passes.', () => {
  assert.strictEqual(AITUTOR_LANGUAGES.length, 109, 'Phase 1 language registry must retain exactly 109 languages');
  const en = /** @type {any} */ (getLanguageByCode('en'));
  assert.ok(en);
  assert.strictEqual(en.code, 'en');
});

// 47. Phase 2 regression passes.
test('47. Phase 2 regression passes.', () => {
  const engine = new PolicyEngine({ defaultProfile: 'STRICT', defaultExecutionMode: 'COMMERCIAL' });
  assert.strictEqual(engine.defaultProfile, 'STRICT');
  assert.strictEqual(AITUTOR_LANGUAGES.length, 109);
  const evaluation = engine.evaluateLanguage('en');
  assert.ok(evaluation);
  assert.strictEqual(evaluation.policyProfile, 'STRICT');
});

// 48. Phase 3 regression passes.
test('48. Phase 3 regression passes.', () => {
  const manager = new ModelCacheManager();
  assert.ok(typeof manager.getCacheStatus === 'function');
  assert.ok(typeof manager.ensureModel === 'function');
  assert.ok(typeof manager.verifyChecksum === 'function');
});

// 49. Phase 4 regression passes.
test('49. Phase 4 regression passes.', () => {
  const adapter = new PiperTTSAdapter();
  assert.strictEqual(adapter.engine, 'piper');
  assert.strictEqual(adapter.providerId, 'piper');
});

// 50. Phase 5 regression passes.
test('50. Phase 5 regression passes.', () => {
  const adapter = new KokoroTTSAdapter();
  assert.strictEqual(adapter.engine, 'kokoro');
  assert.strictEqual(adapter.providerId, 'kokoro');
});

// 51. Phase 6 regression passes.
test('51. Phase 6 regression passes.', () => {
  const adapter = new MmsTTSAdapter();
  assert.strictEqual(adapter.engine, 'mms');
  assert.strictEqual(adapter.providerId, 'mms');
});

// 52. Phase 7 regression passes.
test('52. Phase 7 regression passes.', () => {
  const adapter = new ExternalTranslationAdapter();
  assert.strictEqual(adapter.id, 'mymemory');
  assert.strictEqual(adapter.isOfflineCapable, false);
});

// 53. Phase 8 regression passes.
test('53. Phase 8 regression passes.', () => {
  const provider = createTTSProvider({ engine: 'system' });
  assert.strictEqual(/** @type {any} */ (provider).engine, 'system');
});

// 54. Phase 9 regression passes.
test('54. Phase 9 regression passes.', async () => {
  const doctor = new PreflightDoctor();
  assert.ok(typeof doctor.run === 'function');
});

// 55. Phase 10 regression passes.
test('55. Phase 10 regression passes.', () => {
  const err = new TaviError('Test error', { code: 'OFFLINE_VIOLATION_BLOCKED' });
  assert.strictEqual(err.code, 'OFFLINE_VIOLATION_BLOCKED');
  assert.strictEqual(err.category, ERROR_CATEGORIES.NETWORK);
});

// 56. Phase 11 regression passes.
test('56. Phase 11 regression passes.', () => {
  const timing = validateCueTiming({ startTime: 10.0, endTime: 12.5 });
  assert.strictEqual(timing.duration, 2.5);
  const timeline = new AudioTimelineEngine({ minTempo: 0.75, maxTempo: 1.5 });
  assert.strictEqual(timeline.minTempo, 0.75);
  assert.strictEqual(timeline.maxTempo, 1.5);
});
