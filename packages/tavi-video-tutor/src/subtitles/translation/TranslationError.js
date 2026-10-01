import { TaviTranslationError } from '../errors/index.js';

/**
 * Standard structured translation error class.
 * Ensures deterministic error classification across all local and external translation providers.
 */
export class TranslationError extends TaviTranslationError {
  /**
   * @param {string} message - Human-readable explanation of error
   * @param {string} code - Deterministic error code
   * @param {Record<string, any>} [details={}] - Contextual details (provider, status, language, etc.)
   */
  constructor(message, code, details = {}) {
    super(message, {
      name: 'TranslationError',
      code,
      provider: details.provider || null,
      engine: details.engine || null,
      languageCode: details.targetLanguage || details.languageCode || null,
      details,
      cause: details.cause || null
    });
    this.name = 'TranslationError';
    this.code = code;
    this.provider = details.provider || null;
    this.fallbackAttempted = false; // Strictly false: zero silent fallback
    this.statusCode = details.statusCode || null;
    this.sourceLanguage = details.sourceLanguage || null;
    this.targetLanguage = details.targetLanguage || null;
    this.details = details;
  }
}

/**
 * Enumeration of deterministic translation error codes.
 * @readonly
 * @enum {string}
 */
export const TRANSLATION_ERROR_CODES = Object.freeze({
  TRANSLATION_MODEL_NOT_CACHED: 'TRANSLATION_MODEL_NOT_CACHED',
  TRANSLATION_MODEL_INVALID: 'TRANSLATION_MODEL_INVALID',
  TRANSLATION_ENGINE_NOT_AVAILABLE: 'TRANSLATION_ENGINE_NOT_AVAILABLE',
  TRANSLATION_ENGINE_FAILED: 'TRANSLATION_ENGINE_FAILED',
  TRANSLATION_PROVIDER_UNAVAILABLE: 'TRANSLATION_PROVIDER_UNAVAILABLE',
  TRANSLATION_PROVIDER_QUOTA_EXCEEDED: 'TRANSLATION_PROVIDER_QUOTA_EXCEEDED',
  TRANSLATION_PROVIDER_BAD_RESPONSE: 'TRANSLATION_PROVIDER_BAD_RESPONSE',
  TRANSLATION_LANGUAGE_UNSUPPORTED: 'TRANSLATION_LANGUAGE_UNSUPPORTED',
  TRANSLATION_INPUT_INVALID: 'TRANSLATION_INPUT_INVALID',
  TRANSLATION_NETWORK_REQUIRED: 'TRANSLATION_NETWORK_REQUIRED',
  OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN: 'OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN'
});

export default TranslationError;
