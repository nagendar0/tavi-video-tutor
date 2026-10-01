// @ts-check
import { LocalNllbAdapter } from './LocalNllbAdapter.js';
import { ExternalTranslationAdapter } from './ExternalTranslationAdapter.js';
import { normalizeLanguageCode } from '../languages/registry.js';
import { TranslationError, TRANSLATION_ERROR_CODES } from './TranslationError.js';

/**
 * Hardened TranslationRouter.
 * Routes translation requests to dedicated LocalNllbAdapter or ExternalTranslationAdapter.
 * Strictly avoids silent fallback when explicit providers or offline modes are configured.
 */
export class TranslationRouter {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.mode] - 'offline' | 'online' | 'auto'
   * @param {string} [options.provider] - Explicit provider selection ('nllb' | 'mymemory')
   * @param {boolean} [options.offline=false] - Enforce offline execution
   * @param {boolean} [options.allowFallback] - Explicitly enable or disable provider fallback
   * @param {LocalNllbAdapter} [options.localAdapter] - Custom local adapter
   * @param {ExternalTranslationAdapter} [options.externalAdapter] - Custom external adapter
   * @param {any} [options.localProvider] - Legacy alias for local adapter
   * @param {any} [options.onlineProvider] - Legacy alias for external adapter
   */
  constructor(options = {}) {
    this.options = options;

    if (options.offline || options.mode === 'offline' || options.provider === 'nllb') {
      this.mode = 'offline';
    } else if (options.mode === 'online' || options.provider === 'mymemory') {
      this.mode = 'online';
    } else {
      this.mode = options.mode || 'auto';
    }

    this.provider = options.provider || null;

    this.localAdapter = options.localAdapter || options.localProvider || new LocalNllbAdapter(options);
    this.externalAdapter = options.externalAdapter || options.onlineProvider || new ExternalTranslationAdapter(options);

    // Fallback is strictly disabled by default when explicit provider or offline mode is chosen.
    // For legacy auto mode (without explicit provider), allowFallback defaults to true for backwards compatibility
    // unless explicitly disabled.
    if (options.allowFallback !== undefined) {
      this.allowFallback = Boolean(options.allowFallback);
    } else if (this.provider || this.mode === 'offline' || this.mode === 'online') {
      this.allowFallback = false;
    } else {
      this.allowFallback = true;
    }
  }

  /**
   * Checks whether the given language pair is supported by the active routing configuration.
   * 
   * @param {string} sourceLang 
   * @param {string} targetLang 
   * @returns {boolean}
   */
  supports(sourceLang, targetLang) {
    const srcClean = normalizeLanguageCode(sourceLang) || String(sourceLang || 'en').toLowerCase().trim();
    const tgtClean = normalizeLanguageCode(targetLang) || String(targetLang || 'en').toLowerCase().trim();
    if (srcClean === tgtClean) return true;

    if (this.mode === 'offline' || this.provider === 'nllb') {
      return this.localAdapter.supports(srcClean, tgtClean);
    }
    if (this.provider === 'mymemory' || this.mode === 'online') {
      return this.externalAdapter.supports(srcClean, tgtClean);
    }
    return this.externalAdapter.supports(srcClean, tgtClean) || this.localAdapter.supports(srcClean, tgtClean);
  }

  /**
   * Translates subtitle segments according to routing mode and provider configuration.
   * 
   * @param {Array<Object>} segments - Subtitle cues
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @param {Object} [options={}] - Request-level overrides
   * @returns {Promise<Array<Object>>} Translated cues
   */
  async translateSegments(segments, sourceLang, targetLang, options = {}) {
    const srcClean = normalizeLanguageCode(sourceLang) || String(sourceLang || 'en').toLowerCase().trim();
    const tgtClean = normalizeLanguageCode(targetLang) || String(targetLang || 'en').toLowerCase().trim();

    if (srcClean === tgtClean) {
      return segments.map((s, idx) => ({
        ...s,
        id: s.id || s.segmentId || `cue_${String(idx + 1).padStart(6, '0')}`,
        start: s.start !== undefined ? Number(s.start) : Number(s.startTime || 0),
        end: s.end !== undefined ? Number(s.end) : Number(s.endTime || 0),
        text: s.text || s.originalText || '',
        originalText: s.originalText || s.text || '',
        translatedText: s.text || s.originalText || ''
      }));
    }

    // 1. Strict Offline Routing
    if (this.mode === 'offline' || options.offline || this.options.offline) {
      if (!this.localAdapter.supports(srcClean, tgtClean)) {
        throw new TranslationError(
          `UNSUPPORTED_OFFLINE: Offline translation unavailable for language '${targetLang}' (Unsupported by local NLLB-200 model).`,
          TRANSLATION_ERROR_CODES.TRANSLATION_LANGUAGE_UNSUPPORTED,
          { provider: 'nllb', targetLanguage: targetLang, sourceLanguage: sourceLang }
        );
      }
      return await this.localAdapter.translateSegments(segments, srcClean, tgtClean, options);
    }

    // 2. Explicit NLLB Provider
    if (this.provider === 'nllb' || options.provider === 'nllb') {
      return await this.localAdapter.translateSegments(segments, srcClean, tgtClean, options);
    }

    // 3. Explicit External Provider (Online)
    if (this.provider === 'mymemory' || options.provider === 'mymemory' || this.mode === 'online') {
      return await this.externalAdapter.translateSegments(segments, srcClean, tgtClean, options);
    }

    // 4. Auto Mode: With or without fallback
    if (!this.allowFallback) {
      // Zero fallback mode: attempt primary local provider if available, or external if specified
      if (this.localAdapter.supports(srcClean, tgtClean)) {
        return await this.localAdapter.translateSegments(segments, srcClean, tgtClean, options);
      }
      return await this.externalAdapter.translateSegments(segments, srcClean, tgtClean, options);
    }

    // Legacy auto mode with explicit fallback allowed
    try {
      return await this.externalAdapter.translateSegments(segments, srcClean, tgtClean, options);
    } catch (onlineErr) {
      if (this.localAdapter.supports(srcClean, tgtClean)) {
        return await this.localAdapter.translateSegments(segments, srcClean, tgtClean, options);
      }
      throw onlineErr;
    }
  }
}

export default TranslationRouter;
