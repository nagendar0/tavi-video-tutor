import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  TaviError,
  TaviConfigurationError,
  TaviModelError,
  TaviCacheError,
  TaviPolicyError,
  TaviProviderError,
  TaviTranslationError,
  TaviTTSError,
  TaviPreflightError,
  TaviPipelineError,
  TaviSecurityError,
  ERROR_CATEGORIES,
  CLI_EXIT_CODES,
  ERROR_DEFINITIONS,
  getErrorDefinition,
  getExitCodeForError,
  mapHttpStatusToErrorCode,
  redactString,
  redactSecrets,
  safeSerializeCause,
  toTaviError,
  formatErrorJson,
  formatErrorCli
} from '../src/subtitles/errors/index.js';

import { PiperError } from '../src/subtitles/tts/PiperTTSAdapter.js';
import { KokoroError } from '../src/subtitles/tts/KokoroTTSAdapter.js';
import { MmsError } from '../src/subtitles/tts/MmsTTSAdapter.js';
import { TTSError } from '../src/subtitles/tts/EdgeTTSProvider.js';
import { FactoryError } from '../src/subtitles/tts/ttsFactory.js';
import { TranslationError } from '../src/subtitles/translation/TranslationError.js';
import { CacheError } from '../src/subtitles/cache/ModelCacheManager.js';
import { PolicyError } from '../src/subtitles/policy/PolicyEngine.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';

// 1. TaviError extends Error
test('1. TaviError extends Error', () => {
  const err = new TaviError('Test error message', { code: 'INVALID_CONFIGURATION' });
  assert.ok(err instanceof Error);
  assert.ok(err instanceof TaviError);
  assert.equal(err.name, 'TaviError');
  assert.equal(err.message, 'Test error message');
});

// 2. TaviError preserves stack
test('2. TaviError preserves stack', () => {
  const err = new TaviError('Stack test');
  assert.ok(typeof err.stack === 'string');
  assert.ok(err.stack.includes('TaviError: Stack test'));
});

// 3. TaviError preserves cause
test('3. TaviError preserves cause', () => {
  const original = new Error('Root underlying failure');
  original.code = 'ECONNREFUSED';
  const err = new TaviError('Wrapped failure', {
    code: 'PROVIDER_UNAVAILABLE',
    cause: original
  });
  assert.equal(err.cause, original);
  assert.equal(err.cause.code, 'ECONNREFUSED');
});

// 4. Error code is stable
test('4. Error code is stable', () => {
  const err = new TaviError('Missing model', { code: 'MODEL_NOT_CACHED' });
  assert.equal(err.code, 'MODEL_NOT_CACHED');
  assert.ok(ERROR_DEFINITIONS.MODEL_NOT_CACHED);
  assert.equal(ERROR_DEFINITIONS.MODEL_NOT_CACHED.code, 'MODEL_NOT_CACHED');
});

// 5. Error category is stable
test('5. Error category is stable', () => {
  const err = new TaviError('Checksum mismatch', { code: 'MODEL_CHECKSUM_MISMATCH' });
  assert.equal(err.category, ERROR_CATEGORIES.MODEL);
  assert.equal(err.category, 'MODEL');
});

// 6. retryable is deterministic
test('6. retryable is deterministic', () => {
  const retryableErr = new TaviError('Cache miss', { code: 'MODEL_NOT_CACHED' });
  assert.equal(retryableErr.retryable, true);

  const nonRetryableErr = new TaviError('Policy ban', { code: 'MODEL_POLICY_RESTRICTED' });
  assert.equal(nonRetryableErr.retryable, false);

  const timeoutErr = new TaviError('Engine timeout', { code: 'ENGINE_TIMEOUT' });
  assert.equal(timeoutErr.retryable, true);
});

// 7. blocking is deterministic
test('7. blocking is deterministic', () => {
  const blockingErr = new TaviError('Missing binary', { code: 'ENGINE_NOT_FOUND' });
  assert.equal(blockingErr.blocking, true);

  const nonBlockingErr = new TaviError('Eviction issue', { code: 'MODEL_CACHE_EVICTION_FAILED' });
  assert.equal(nonBlockingErr.blocking, false);
});

// 8. action is present for blocking errors
test('8. action is present for blocking errors', () => {
  const err = new TaviError('Offline forbidden', { code: 'OFFLINE_PROVIDER_FORBIDDEN' });
  assert.ok(err.action);
  assert.ok(err.action.length > 5);
  assert.ok(err.action.includes('local TTS provider'));
});

// 9. toJSON() is deterministic
test('9. toJSON() is deterministic', () => {
  const err = new TaviError('Deterministic test', {
    code: 'MODEL_NOT_CACHED',
    provider: 'piper',
    engine: 'piper',
    languageCode: 'hi',
    modelId: 'piper:hi_IN-amit-medium',
    stage: 'tts-synthesis',
    details: { cacheStatus: 'NOT_CACHED' }
  });

  const json1 = JSON.stringify(err.toJSON());
  const json2 = JSON.stringify(err.toJSON());
  assert.equal(json1, json2);

  const parsed = JSON.parse(json1);
  assert.equal(parsed.name, 'TaviError');
  assert.equal(parsed.code, 'MODEL_NOT_CACHED');
  assert.equal(parsed.category, 'MODEL');
  assert.equal(parsed.provider, 'piper');
  assert.equal(parsed.engine, 'piper');
  assert.equal(parsed.languageCode, 'hi');
  assert.equal(parsed.modelId, 'piper:hi_IN-amit-medium');
  assert.equal(parsed.stage, 'tts-synthesis');
  assert.equal(parsed.retryable, true);
  assert.equal(parsed.blocking, true);
  assert.equal(parsed.details.cacheStatus, 'NOT_CACHED');
});

// 10. toJSON() excludes secrets
test('10. toJSON() excludes secrets', () => {
  const err = new TaviError('Auth failure with secret_token=sk-999999', {
    code: 'PROVIDER_AUTH_ERROR',
    details: {
      apiKey: 'secret_api_key_123',
      subscriptionKey: 'secret_azure_key_456',
      normalField: 'safe_value'
    }
  });

  const json = JSON.stringify(err.toJSON());
  assert.equal(json.includes('secret_api_key_123'), false);
  assert.equal(json.includes('secret_azure_key_456'), false);
  assert.equal(json.includes('sk-999999'), false);
  assert.ok(json.includes('[REDACTED]'));
  assert.ok(json.includes('safe_value'));
});

// 11. API keys are redacted
test('11. API keys are redacted', () => {
  const redactedStr = redactString('Request failed: apiKey=super_secret_key_12345 in URL');
  assert.equal(redactedStr.includes('super_secret_key_12345'), false);
  assert.ok(redactedStr.includes('apiKey=[REDACTED]'));

  const obj = redactSecrets({ apiKey: 'my_secret_token', api_key: 'my_other_key' });
  assert.equal(obj.apiKey, '[REDACTED]');
  assert.equal(obj.api_key, '[REDACTED]');
});

// 12. subscription keys are redacted
test('12. subscription keys are redacted', () => {
  const redactedStr = redactString('Azure error with subscriptionKey=abcd1234efgh5678');
  assert.equal(redactedStr.includes('abcd1234efgh5678'), false);
  assert.ok(redactedStr.includes('subscriptionKey=[REDACTED]'));

  const obj = redactSecrets({ subscriptionKey: 'key_val_999' });
  assert.equal(obj.subscriptionKey, '[REDACTED]');
});

// 13. authorization tokens are redacted
test('13. authorization tokens are redacted', () => {
  const redactedStr = redactString('Headers: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret');
  assert.equal(redactedStr.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret'), false);
  assert.ok(redactedStr.includes('Authorization: [REDACTED]'));

  const obj = redactSecrets({ authorization: 'Bearer secret_token_xyz', token: 'token123' });
  assert.equal(obj.authorization, '[REDACTED]');
  assert.equal(obj.token, '[REDACTED]');
});

// 14. PiperError integrates with TaviError
test('14. PiperError integrates with TaviError', () => {
  const piperErr = new PiperError('MODEL_NOT_FOUND', 'Piper voice model not found.', {
    language: 'hi',
    modelId: 'piper:hi_IN-amit-medium'
  });
  assert.ok(piperErr instanceof PiperError);
  assert.ok(piperErr instanceof TaviTTSError);
  assert.ok(piperErr instanceof TaviError);
  assert.ok(piperErr instanceof Error);
  assert.equal(piperErr.name, 'PiperError');
  assert.equal(piperErr.code, 'MODEL_NOT_FOUND');
  assert.equal(piperErr.category, 'TTS');
  assert.equal(piperErr.provider, 'piper');
  assert.equal(piperErr.fallbackAttempted, false);
  assert.equal(piperErr.language, 'hi');
  assert.equal(piperErr.modelId, 'piper:hi_IN-amit-medium');
  assert.ok(piperErr.toJSON());
});

// 15. KokoroError integrates with TaviError
test('15. KokoroError integrates with TaviError', () => {
  const kokoroErr = new KokoroError('ENGINE_NOT_FOUND', 'Kokoro runtime missing.');
  assert.ok(kokoroErr instanceof KokoroError);
  assert.ok(kokoroErr instanceof TaviTTSError);
  assert.ok(kokoroErr instanceof TaviError);
  assert.equal(kokoroErr.name, 'KokoroError');
  assert.equal(kokoroErr.code, 'ENGINE_NOT_FOUND');
  assert.equal(kokoroErr.category, 'TTS');
  assert.equal(kokoroErr.provider, 'kokoro');
});

// 16. MmsError integrates with TaviError
test('16. MmsError integrates with TaviError', () => {
  const mmsErr = new MmsError('MODEL_POLICY_RESTRICTED', 'MMS research-only model blocked in commercial mode.');
  assert.ok(mmsErr instanceof MmsError);
  assert.ok(mmsErr instanceof TaviTTSError);
  assert.ok(mmsErr instanceof TaviError);
  assert.equal(mmsErr.name, 'MmsError');
  assert.equal(mmsErr.code, 'MODEL_POLICY_RESTRICTED');
  assert.equal(mmsErr.category, 'TTS');
  assert.equal(mmsErr.provider, 'mms');
});

// 17. TranslationError integrates with TaviError
test('17. TranslationError integrates with TaviError', () => {
  const transErr = new TranslationError('Quota exceeded', 'TRANSLATION_PROVIDER_QUOTA_EXCEEDED', {
    provider: 'mymemory',
    statusCode: 429,
    sourceLanguage: 'en',
    targetLanguage: 'es'
  });
  assert.ok(transErr instanceof TranslationError);
  assert.ok(transErr instanceof TaviTranslationError);
  assert.ok(transErr instanceof TaviError);
  assert.equal(transErr.name, 'TranslationError');
  assert.equal(transErr.code, 'TRANSLATION_PROVIDER_QUOTA_EXCEEDED');
  assert.equal(transErr.category, 'TRANSLATION');
  assert.equal(transErr.statusCode, 429);
  assert.equal(transErr.sourceLanguage, 'en');
  assert.equal(transErr.targetLanguage, 'es');
  assert.equal(transErr.fallbackAttempted, false);
});

// 18. FactoryError integrates with TaviError
test('18. FactoryError integrates with TaviError', () => {
  const factoryErr = new FactoryError('UNKNOWN_TTS_PROVIDER', 'Provider nonexistent is invalid.', {
    provider: 'nonexistent'
  });
  assert.ok(factoryErr instanceof FactoryError);
  assert.ok(factoryErr instanceof TaviProviderError);
  assert.ok(factoryErr instanceof TaviError);
  assert.equal(factoryErr.name, 'FactoryError');
  assert.equal(factoryErr.code, 'UNKNOWN_TTS_PROVIDER');
  assert.equal(factoryErr.provider, 'nonexistent');
});

// 19. CacheError integrates with TaviError
test('19. CacheError integrates with TaviError', () => {
  const cacheErr = new CacheError('Cache write failed', 'MODEL_CACHE_WRITE_FAILED');
  assert.ok(cacheErr instanceof CacheError);
  assert.ok(cacheErr instanceof TaviCacheError);
  assert.ok(cacheErr instanceof TaviError);
  assert.equal(cacheErr.name, 'CacheError');
  assert.equal(cacheErr.code, 'MODEL_CACHE_WRITE_FAILED');
  assert.equal(cacheErr.category, 'CACHE');
});

// 20. PolicyError integrates with TaviError
test('20. PolicyError integrates with TaviError', () => {
  const policyErr = new PolicyError('Policy violation', 'MODEL_POLICY_RESTRICTED');
  assert.ok(policyErr instanceof PolicyError);
  assert.ok(policyErr instanceof TaviPolicyError);
  assert.ok(policyErr instanceof TaviError);
  assert.equal(policyErr.name, 'PolicyError');
  assert.equal(policyErr.code, 'MODEL_POLICY_RESTRICTED');
  assert.equal(policyErr.category, 'POLICY');
});

// 21. Preflight errors integrate with TaviError
test('21. Preflight errors integrate with TaviError', () => {
  const preflightErr = new TaviPreflightError('Preflight checks failed', {
    preflight: { passed: false, missing: [{ name: 'FFmpeg' }] }
  });
  assert.ok(preflightErr instanceof TaviPreflightError);
  assert.ok(preflightErr instanceof TaviError);
  assert.equal(preflightErr.name, 'TaviPreflightError');
  assert.equal(preflightErr.code, 'PRECHECK_FAILED');
  assert.equal(preflightErr.category, 'PREFLIGHT');
  assert.equal(preflightErr.blocking, true);
  assert.equal(preflightErr.retryable, false);
  assert.ok(preflightErr.preflight);
});

// 22. Model-not-cached maps consistently
test('22. Model-not-cached maps consistently', () => {
  const err = new TaviModelError('Model is not cached', { code: 'MODEL_NOT_CACHED' });
  assert.equal(err.code, 'MODEL_NOT_CACHED');
  assert.equal(err.category, 'MODEL');
  assert.equal(err.retryable, true);
  assert.equal(err.blocking, true);
});

// 23. Checksum mismatch maps consistently
test('23. Checksum mismatch maps consistently', () => {
  const err = new TaviModelError('Corrupted model', { code: 'MODEL_CHECKSUM_MISMATCH' });
  assert.equal(err.code, 'MODEL_CHECKSUM_MISMATCH');
  assert.equal(err.category, 'MODEL');
  assert.equal(err.retryable, true);
  assert.equal(err.blocking, true);
});

// 24. Provider 429 maps to quota error
test('24. Provider 429 maps to quota error', () => {
  const code = mapHttpStatusToErrorCode(429);
  assert.equal(code, 'PROVIDER_QUOTA_EXCEEDED');
  const def = getErrorDefinition(code);
  assert.equal(def.category, 'PROVIDER');
  assert.equal(def.retryable, true);
  assert.equal(def.blocking, true);
});

// 25. Provider 401/403 maps to auth error
test('25. Provider 401/403 maps to auth error', () => {
  assert.equal(mapHttpStatusToErrorCode(401), 'PROVIDER_AUTH_ERROR');
  assert.equal(mapHttpStatusToErrorCode(403), 'PROVIDER_AUTH_ERROR');
  const def = getErrorDefinition('PROVIDER_AUTH_ERROR');
  assert.equal(def.category, 'CREDENTIAL');
  assert.equal(def.retryable, false);
});

// 26. Provider 5xx maps to service-unavailable error
test('26. Provider 5xx maps to service-unavailable error', () => {
  assert.equal(mapHttpStatusToErrorCode(500), 'PROVIDER_SERVICE_UNAVAILABLE');
  assert.equal(mapHttpStatusToErrorCode(502), 'PROVIDER_SERVICE_UNAVAILABLE');
  assert.equal(mapHttpStatusToErrorCode(503), 'PROVIDER_SERVICE_UNAVAILABLE');
  assert.equal(mapHttpStatusToErrorCode(504), 'PROVIDER_SERVICE_UNAVAILABLE');
  const def = getErrorDefinition('PROVIDER_SERVICE_UNAVAILABLE');
  assert.equal(def.retryable, true);
});

// 27. Provider network failure maps to provider-unavailable error
test('27. Provider network failure maps to provider-unavailable error', () => {
  const code = mapHttpStatusToErrorCode(0, { isNetworkError: true });
  assert.equal(code, 'PROVIDER_UNAVAILABLE');
  const def = getErrorDefinition(code);
  assert.equal(def.retryable, true);
  assert.equal(def.blocking, true);
});

// 28. Invalid input maps to deterministic error
test('28. Invalid input maps to deterministic error', () => {
  const err = new TaviTTSError('Empty speech text', { code: 'INVALID_TTS_INPUT' });
  assert.equal(err.code, 'INVALID_TTS_INPUT');
  assert.equal(err.category, 'TTS');
  assert.equal(err.retryable, false);
  assert.equal(err.blocking, true);
});

// 29. Policy restriction remains non-retryable
test('29. Policy restriction remains non-retryable', () => {
  const err = new TaviPolicyError('Model policy restricted', { code: 'MODEL_POLICY_RESTRICTED' });
  assert.equal(err.retryable, false);
  assert.equal(err.blocking, true);
});

// 30. Engine timeout is retryable
test('30. Engine timeout is retryable', () => {
  const err = new TaviError('Process timed out', { code: 'ENGINE_TIMEOUT' });
  assert.equal(err.retryable, true);
  assert.equal(err.blocking, true);
});

// 31. Offline cloud-provider error remains blocking
test('31. Offline cloud-provider error remains blocking', () => {
  const err = new TaviTTSError('Offline prohibits Edge', { code: 'OFFLINE_PROVIDER_FORBIDDEN' });
  assert.equal(err.blocking, true);
  assert.equal(err.retryable, false);
});

// 32. Unknown provider remains non-retryable
test('32. Unknown provider remains non-retryable', () => {
  const err = new TaviConfigurationError('Unknown provider xyz', { code: 'UNKNOWN_TTS_PROVIDER' });
  assert.equal(err.retryable, false);
  assert.equal(err.blocking, true);
});

// 33. Cause information survives wrapping
test('33. Cause information survives wrapping', () => {
  const original = new Error('Socket closed abruptly');
  original.code = 'ECONNRESET';
  const wrapped = toTaviError(original, { code: 'PROVIDER_UNAVAILABLE' });
  assert.ok(wrapped instanceof TaviError);
  assert.equal(wrapped.cause, original);
  assert.equal(wrapped.cause.code, 'ECONNRESET');
});

// 34. Cause serialization is bounded and safe
test('34. Cause serialization is bounded and safe', () => {
  const level3 = new Error('Level 3 secretApiKey=12345');
  const level2 = new Error('Level 2', { cause: level3 });
  const level1 = new Error('Level 1', { cause: level2 });
  const err = new TaviError('Top level', { cause: level1 });

  const serialized = err.toJSON();
  assert.ok(serialized.cause);
  assert.equal(serialized.cause.message, 'Level 1');
  assert.ok(serialized.cause.cause);
  assert.equal(serialized.cause.cause.message, 'Level 2');
  // Must redact secrets in nested causes
  assert.equal(JSON.stringify(serialized).includes('12345'), false);
});

// 35. CLI error formatting is human-readable
test('35. CLI error formatting is human-readable', () => {
  const err = new TaviError('FFmpeg binary not found', {
    code: 'FFMPEG_NOT_FOUND',
    category: 'BINARY',
    action: 'Install FFmpeg and add it to PATH.'
  });
  const output = formatErrorCli(err);
  assert.ok(output.includes('❌ [BINARY] FFMPEG_NOT_FOUND: FFmpeg binary not found'));
  assert.ok(output.includes('Action: Install FFmpeg and add it to PATH.'));
});

// 36. JSON error formatting is machine-readable
test('36. JSON error formatting is machine-readable', () => {
  const err = new TaviError('Piper voice missing', {
    code: 'MODEL_NOT_CACHED',
    provider: 'piper',
    modelId: 'piper:hi_IN-amit-medium'
  });
  const jsonStr = formatErrorJson(err);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.error.code, 'MODEL_NOT_CACHED');
  assert.equal(parsed.error.provider, 'piper');
  assert.equal(parsed.error.modelId, 'piper:hi_IN-amit-medium');
});

// 37. CLI exit code mapping is deterministic
test('37. CLI exit code mapping is deterministic', () => {
  assert.equal(getExitCodeForError(new TaviConfigurationError('bad config', { code: 'INVALID_CONFIGURATION' })), CLI_EXIT_CODES.INVALID_CONFIG);
  assert.equal(getExitCodeForError(new TaviError('missing node', { code: 'UNSUPPORTED_NODE_VERSION' })), CLI_EXIT_CODES.DEPENDENCY_MISSING);
  assert.equal(getExitCodeForError(new TaviModelError('not cached', { code: 'MODEL_NOT_CACHED' })), CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR);
  assert.equal(getExitCodeForError(new TaviPolicyError('policy blocked', { code: 'MODEL_POLICY_RESTRICTED' })), CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION);
  assert.equal(getExitCodeForError(new TaviProviderError('auth failed', { code: 'PROVIDER_AUTH_ERROR' })), CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR);
  assert.equal(getExitCodeForError(new TaviPreflightError('precheck failed')), CLI_EXIT_CODES.DEPENDENCY_MISSING);
  assert.equal(getExitCodeForError(null), CLI_EXIT_CODES.SUCCESS);
});

// 38. Higher layers preserve underlying TaviError
test('38. Higher layers preserve underlying TaviError', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-layer-test-'));
  try {
    const videoEntry = { id: 'test_vid', src: 'https://example.com/test.mp4' };
    const manifestStore = { cwd: tmpDir, isCached: () => false, isAudioLanguageCached: () => false };

    await assert.rejects(
      async () => {
        await processSingleVideo(videoEntry, manifestStore, {
          enforcePreflight: true,
          provider: 'unknown_impossible_provider'
        });
      },
      (err) => {
        assert.ok(err instanceof TaviError);
        assert.ok(err instanceof TaviPreflightError);
        assert.equal(err.code, 'PRECHECK_FAILED');
        assert.equal(err.category, 'PREFLIGHT');
        assert.ok(err.preflight);
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// 39. Provider identity is preserved
test('39. Provider identity is preserved', () => {
  const err = new TaviTTSError('Piper failed', { code: 'TTS_SYNTHESIS_FAILED', provider: 'piper' });
  assert.equal(err.provider, 'piper');
  assert.equal(err.toJSON().provider, 'piper');
});

// 40. Model identity is preserved
test('40. Model identity is preserved', () => {
  const err = new TaviModelError('Model failure', { code: 'MODEL_INVALID', modelId: 'piper:en_US-lessac-high' });
  assert.equal(err.modelId, 'piper:en_US-lessac-high');
  assert.equal(err.toJSON().modelId, 'piper:en_US-lessac-high');
});

// 41. Language identity is preserved
test('41. Language identity is preserved', () => {
  const err = new TaviTranslationError('Unsupported language', { code: 'TRANSLATION_LANGUAGE_UNSUPPORTED', languageCode: 'xyz' });
  assert.equal(err.languageCode, 'xyz');
  assert.equal(err.toJSON().languageCode, 'xyz');
});

// 42. Stage identity is preserved where available
test('42. Stage identity is preserved where available', () => {
  const err = new TaviPipelineError('Audio mixing failed', { code: 'PIPELINE_STAGE_FAILED', stage: 'audio-mixing' });
  assert.equal(err.stage, 'audio-mixing');
  assert.equal(err.toJSON().stage, 'audio-mixing');
});

// 43. No secrets are present in logs/serialized diagnostics
test('43. No secrets are present in logs/serialized diagnostics', () => {
  const sensitiveInput = {
    apiKey: 'my_azure_speech_key_38472983749',
    subscriptionKey: 'sub_key_secret_value',
    password: 'db_password_123',
    secret: 'super_secret',
    accessToken: 'ya29.a0AfH6SMD...',
    cookie: 'session_id=abcdef123456',
    authorization: 'Bearer token_secret_999'
  };

  const err = new TaviError('Error with apiKey=secret_param_val', {
    code: 'PROVIDER_AUTH_ERROR',
    details: sensitiveInput
  });

  const serialized = err.toJSON();
  const serializedStr = JSON.stringify(serialized);

  assert.equal(serializedStr.includes('my_azure_speech_key_38472983749'), false);
  assert.equal(serializedStr.includes('sub_key_secret_value'), false);
  assert.equal(serializedStr.includes('db_password_123'), false);
  assert.equal(serializedStr.includes('super_secret'), false);
  assert.equal(serializedStr.includes('ya29.a0AfH6SMD...'), false);
  assert.equal(serializedStr.includes('session_id=abcdef123456'), false);
  assert.equal(serializedStr.includes('token_secret_999'), false);
  assert.equal(serializedStr.includes('secret_param_val'), false);
});

// 44. Existing Phase 1 ModelRegistry capability integration contract
test('44. Existing Phase 1 ModelRegistry capability integration contract', () => {
  const err = new TaviModelError('Model lookup failed', {
    code: 'MODEL_NOT_FOUND',
    languageCode: 'hi',
    details: { capability: 'LOCAL_NEURAL' }
  });
  assert.equal(err.code, 'MODEL_NOT_FOUND');
  assert.equal(err.category, 'MODEL');
  assert.equal(err.details.capability, 'LOCAL_NEURAL');
});

// 45. Existing Phase 2 PolicyEngine policy restriction contract
test('45. Existing Phase 2 PolicyEngine policy restriction contract', () => {
  const err = new PolicyError('MMS research restricted in commercial mode', 'MODEL_POLICY_RESTRICTED');
  assert.ok(err instanceof TaviPolicyError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.code, 'MODEL_POLICY_RESTRICTED');
  assert.equal(err.category, 'POLICY');
  assert.equal(err.retryable, false);
  assert.equal(err.blocking, true);
});

// 46. Existing Phase 3 ModelCacheManager cache error contract
test('46. Existing Phase 3 ModelCacheManager cache error contract', () => {
  const err = new CacheError('Checksum verification failed', 'MODEL_CHECKSUM_MISMATCH');
  assert.ok(err instanceof TaviCacheError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.code, 'MODEL_CHECKSUM_MISMATCH');
  assert.equal(err.category, 'CACHE');
  assert.equal(err.retryable, true);
  assert.equal(err.blocking, true);
});

// 47. Existing Phase 4 PiperTTSAdapter error contract
test('47. Existing Phase 4 PiperTTSAdapter error contract', () => {
  const err = new PiperError('ENGINE_NOT_FOUND', 'Piper executable missing', { language: 'en' });
  assert.ok(err instanceof PiperError);
  assert.ok(err instanceof TaviTTSError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.provider, 'piper');
  assert.equal(err.fallbackAttempted, false);
});

// 48. Existing Phase 5 KokoroTTSAdapter error contract
test('48. Existing Phase 5 KokoroTTSAdapter error contract', () => {
  const err = new KokoroError('AUDIO_OUTPUT_INVALID', 'Corrupted WAV header', { language: 'ja' });
  assert.ok(err instanceof KokoroError);
  assert.ok(err instanceof TaviTTSError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.provider, 'kokoro');
  assert.equal(err.fallbackAttempted, false);
});

// 49. Existing Phase 6 MmsTTSAdapter error contract
test('49. Existing Phase 6 MmsTTSAdapter error contract', () => {
  const err = new MmsError('INVALID_TTS_INPUT', 'Input text is empty', { language: 'es' });
  assert.ok(err instanceof MmsError);
  assert.ok(err instanceof TaviTTSError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.provider, 'mms');
  assert.equal(err.fallbackAttempted, false);
});

// 50. Existing Phase 7 Translation pipeline error contract
test('50. Existing Phase 7 Translation pipeline error contract', () => {
  const err = new TranslationError('Service down', 'TRANSLATION_PROVIDER_UNAVAILABLE', { provider: 'mymemory' });
  assert.ok(err instanceof TranslationError);
  assert.ok(err instanceof TaviTranslationError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.provider, 'mymemory');
  assert.equal(err.fallbackAttempted, false);
});

// 51. Existing Phase 8 TTS Factory error contract
test('51. Existing Phase 8 TTS Factory error contract', () => {
  const err = new FactoryError('OFFLINE_PROVIDER_FORBIDDEN', 'Cloud providers forbidden offline', { provider: 'azure-byok' });
  assert.ok(err instanceof FactoryError);
  assert.ok(err instanceof TaviProviderError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.provider, 'azure-byok');
  assert.equal(err.fallbackAttempted, false);
});

// 52. Existing Phase 9 Preflight Doctor error contract
test('52. Existing Phase 9 Preflight Doctor error contract', () => {
  const err = new TaviPreflightError('Doctor blocked execution', {
    preflight: { passed: false, blocking: true, missing: [{ checkId: 'BINARY_FFMPEG' }] }
  });
  assert.ok(err instanceof TaviPreflightError);
  assert.ok(err instanceof TaviError);
  assert.equal(err.code, 'PRECHECK_FAILED');
  assert.equal(err.category, 'PREFLIGHT');
  assert.equal(err.blocking, true);
  assert.ok(err.preflight);
});
