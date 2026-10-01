// @ts-check
import { TranslationProvider } from './TranslationProvider.js';
import { TranslationError, TRANSLATION_ERROR_CODES } from './TranslationError.js';
import { getTranslationCache } from './TranslationCache.js';
import { getLanguageByCode, normalizeLanguageCode } from '../languages/registry.js';
import { mapAITutorCodeToProvider } from '../languages/providerMappings.js';

/**
 * Hardened External (MyMemory) Translation Adapter.
 * Encapsulates remote HTTP translation with bounded concurrency, strict timeout,
 * detailed HTTP/quota error classification, and zero silent fallback.
 */
export class ExternalTranslationAdapter extends TranslationProvider {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.providerId='mymemory'] - Provider identifier
   * @param {string} [options.apiEndpoint='https://api.mymemory.translated.net/get'] - API endpoint URL
   * @param {number} [options.timeoutMs=8000] - HTTP request timeout in milliseconds
   * @param {number} [options.maxRetries=2] - Bounded retry attempts for transient 5xx errors
   * @param {number} [options.maxConcurrency=5] - Bounded concurrent requests limit
   * @param {Function} [options.fetchFn] - Custom fetch function injection for testing
   * @param {TranslationCache} [options.cache] - Persistent translation cache instance
   * @param {boolean} [options.offline=false] - Explicit offline flag
   * @param {any} [options.networkPolicy] - Centralized network policy
   */
  constructor(options = {}) {
    super();
    this.id = options.providerId || 'mymemory';
    this.isOfflineCapable = false;
    this.options = options;
    this.apiEndpoint = options.apiEndpoint || 'https://api.mymemory.translated.net/get';
    this.timeoutMs = options.timeoutMs || 8000;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
    this.maxConcurrency = options.maxConcurrency || 5;
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.cache = options.cache || getTranslationCache(options);
  }

  /**
   * Validates target language availability in the registry.
   * 
   * @param {string} sourceLanguage 
   * @param {string} targetLanguage 
   * @returns {boolean}
   */
  supports(sourceLanguage, targetLanguage) {
    if (!targetLanguage) return false;
    const clean = normalizeLanguageCode(targetLanguage) || String(targetLanguage).toLowerCase().trim();
    return Boolean(getLanguageByCode(clean));
  }

  /**
   * Translates a single text string via the remote API with retries and timeout.
   * 
   * @param {string} text 
   * @param {string} langPair 
   * @returns {Promise<string>}
   */
  async _fetchSingleText(text, langPair) {
    const urlObj = new URL(this.apiEndpoint);
    urlObj.searchParams.set('q', text);
    urlObj.searchParams.set('langpair', langPair);
    const url = urlObj.toString();

    const policy = this.options.networkPolicy;
    if (policy) {
      policy.assertAllowed(url, { provider: this.id, stage: 'translation' });
    }

    let attempt = 0;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      attempt++;
      let timer = null;
      try {
        const controller = new AbortController();
        timer = setTimeout(() => {
          controller.abort(new Error(`Translation request timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);

        const response = await this.fetchFn(url, { signal: controller.signal });
        clearTimeout(timer);

        if (response.status === 429) {
          throw new TranslationError(
            `MyMemory translation quota exceeded (HTTP 429)`,
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_QUOTA_EXCEEDED,
            { provider: this.id, statusCode: 429 }
          );
        }

        if (response.status >= 500) {
          if (attempt <= this.maxRetries) {
            await new Promise(r => setTimeout(r, 100 * attempt));
            continue;
          }
          throw new TranslationError(
            `MyMemory translation service unavailable (HTTP ${response.status})`,
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_UNAVAILABLE,
            { provider: this.id, statusCode: response.status }
          );
        }

        if (!response.ok) {
          throw new TranslationError(
            `MyMemory translation request failed (HTTP ${response.status})`,
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_UNAVAILABLE,
            { provider: this.id, statusCode: response.status }
          );
        }

        let data;
        try {
          data = await response.json();
        } catch (_) {
          throw new TranslationError(
            'Malformed response from MyMemory: invalid JSON',
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_BAD_RESPONSE,
            { provider: this.id }
          );
        }

        if (!data || typeof data !== 'object') {
          throw new TranslationError(
            'Malformed response from MyMemory: payload is not an object',
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_BAD_RESPONSE,
            { provider: this.id }
          );
        }

        if (data.responseStatus && data.responseStatus === 429) {
          throw new TranslationError(
            `MyMemory translation quota exceeded: ${data.responseDetails || 'quota limit'}`,
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_QUOTA_EXCEEDED,
            { provider: this.id, statusCode: 429 }
          );
        }

        if (data.responseStatus && data.responseStatus >= 500) {
          throw new TranslationError(
            `MyMemory service error (${data.responseStatus}): ${data.responseDetails || 'error'}`,
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_UNAVAILABLE,
            { provider: this.id, statusCode: data.responseStatus }
          );
        }

        const rawTranslated = data.responseData?.translatedText;
        if (typeof rawTranslated !== 'string') {
          throw new TranslationError(
            'Malformed response from MyMemory: missing translatedText in responseData',
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_BAD_RESPONSE,
            { provider: this.id }
          );
        }

        if (rawTranslated.toUpperCase().includes('MYMEMORY WARNING')) {
          throw new TranslationError(
            `MyMemory quota warning received: ${rawTranslated}`,
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_QUOTA_EXCEEDED,
            { provider: this.id, statusCode: 429 }
          );
        }

        const cleanTranslated = rawTranslated.trim();
        if (!cleanTranslated) {
          throw new TranslationError(
            'Empty translation produced by MyMemory provider',
            TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_BAD_RESPONSE,
            { provider: this.id }
          );
        }

        return cleanTranslated;
      } catch (err) {
        if (timer) clearTimeout(timer);
        if (err.code === 'OFFLINE_VIOLATION_BLOCKED' || err.code === 'SSRF_BLOCKED' || err.code === 'BLOCKED_PROTOCOL') {
          throw err;
        }
        if (err.name === 'AbortError' || err.name === 'TimeoutError' || err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('timed out')) {
          throw new TranslationError(
            `Translation request timed out after ${this.timeoutMs}ms`,
            'NETWORK_TIMEOUT',
            { provider: this.id, cause: err }
          );
        }
        if (err instanceof TranslationError) throw err;
        lastError = err;
        if (attempt <= this.maxRetries) {
          await new Promise(r => setTimeout(r, 100 * attempt));
          continue;
        }
      }
    }

    throw new TranslationError(
      `Network error connecting to translation provider: ${lastError?.message || 'unknown error'}`,
      TRANSLATION_ERROR_CODES.TRANSLATION_PROVIDER_UNAVAILABLE,
      { provider: this.id }
    );
  }

  /**
   * Translates subtitle segments using the remote provider.
   * 
   * @param {Array<Object>} segments - Subtitle segments
   * @param {string} [sourceLanguage='en'] - Source language code
   * @param {string} targetLanguage - Target language code
   * @param {Object} [options={}] - Execution options
   * @returns {Promise<Array<Object>>} Translated segments
   */
  async translateSegments(segments, sourceLanguage = 'en', targetLanguage, options = {}) {
    if (this.options.offline || options.offline) {
      throw new TranslationError(
        'External translation provider cannot be used when offline mode is active',
        TRANSLATION_ERROR_CODES.OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN,
        { provider: this.id }
      );
    }

    if (!Array.isArray(segments)) {
      throw new TranslationError(
        'Invalid subtitle segments: expected an array',
        TRANSLATION_ERROR_CODES.TRANSLATION_INPUT_INVALID,
        { provider: this.id }
      );
    }

    if (!targetLanguage) {
      throw new TranslationError(
        'Target language is required for translation',
        TRANSLATION_ERROR_CODES.TRANSLATION_INPUT_INVALID,
        { provider: this.id }
      );
    }

    const srcClean = normalizeLanguageCode(sourceLanguage) || String(sourceLanguage).toLowerCase().trim();
    const tgtClean = normalizeLanguageCode(targetLanguage) || String(targetLanguage).toLowerCase().trim();

    // Source === Target: return identical segments preserving metadata
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

    if (segments.length === 0) {
      return [];
    }

    if (!this.supports(srcClean, tgtClean)) {
      throw new TranslationError(
        `Language '${targetLanguage}' is unsupported by provider '${this.id}'`,
        TRANSLATION_ERROR_CODES.TRANSLATION_LANGUAGE_UNSUPPORTED,
        { provider: this.id, targetLanguage, sourceLanguage }
      );
    }

    const providerSrc = mapAITutorCodeToProvider(srcClean);
    const providerTgt = mapAITutorCodeToProvider(tgtClean);
    const langPair = `${providerSrc}|${providerTgt}`;

    // Step 1: Assign cue IDs and check cache
    const results = new Array(segments.length);
    const uncachedIndices = [];

    for (let i = 0; i < segments.length; i++) {
      const cue = segments[i];
      const cueId = cue.id || cue.segmentId || `cue_${String(i + 1).padStart(6, '0')}`;
      const origText = String(cue.text || cue.originalText || '').trim();

      if (!origText) {
        results[i] = {
          ...cue,
          id: cueId,
          start: cue.start !== undefined ? Number(cue.start) : Number(cue.startTime || 0),
          end: cue.end !== undefined ? Number(cue.end) : Number(cue.endTime || 0),
          text: '',
          originalText: '',
          translatedText: ''
        };
        continue;
      }

      const cached = this.cache.get({
        text: origText,
        sourceLanguage: srcClean,
        targetLanguage: tgtClean,
        provider: this.id,
        model: 'default'
      });

      if (cached) {
        results[i] = {
          ...cue,
          id: cueId,
          start: cue.start !== undefined ? Number(cue.start) : Number(cue.startTime || 0),
          end: cue.end !== undefined ? Number(cue.end) : Number(cue.endTime || 0),
          speakerId: cue.speakerId,
          originalText: origText,
          translatedText: cached,
          text: cached
        };
      } else {
        uncachedIndices.push(i);
      }
    }

    if (uncachedIndices.length === 0) {
      return results;
    }

    // Step 2: Fetch uncached cues with bounded concurrency
    const concurrencyLimit = this.maxConcurrency;
    let nextIdx = 0;

    const worker = async () => {
      while (nextIdx < uncachedIndices.length) {
        const itemIdx = uncachedIndices[nextIdx++];
        const cue = segments[itemIdx];
        const cueId = cue.id || cue.segmentId || `cue_${String(itemIdx + 1).padStart(6, '0')}`;
        const origText = String(cue.text || cue.originalText || '').trim();

        const translatedVal = await this._fetchSingleText(origText, langPair);

        results[itemIdx] = {
          ...cue,
          id: cueId,
          start: cue.start !== undefined ? Number(cue.start) : Number(cue.startTime || 0),
          end: cue.end !== undefined ? Number(cue.end) : Number(cue.endTime || 0),
          speakerId: cue.speakerId,
          originalText: origText,
          translatedText: translatedVal,
          text: translatedVal
        };

        this.cache.set({
          text: origText,
          sourceLanguage: srcClean,
          targetLanguage: tgtClean,
          provider: this.id,
          model: 'default'
        }, translatedVal);
      }
    };

    const workerCount = Math.min(concurrencyLimit, uncachedIndices.length);
    const workers = Array.from({ length: workerCount }, () => worker());
    await Promise.all(workers);

    return results;
  }
}

export default ExternalTranslationAdapter;
