// @ts-check
import { getLanguageByCode, normalizeLanguageCode } from '../languages/registry.js';
import { mapAITutorCodeToProvider } from '../languages/providerMappings.js';
import { getTranslationCache, computeTranslationCacheKey, computeLegacyCacheKey } from './TranslationCache.js';

/**
 * Base TranslationProvider contract for all TAVI translation adapters.
 */
export class TranslationProvider {
  constructor() {
    this.id = 'generic';
    this.isOfflineCapable = false;
  }

  /**
   * @param {string} _sourceLanguage 
   * @param {string} _targetLanguage 
   * @returns {boolean}
   */
  supports(_sourceLanguage, _targetLanguage) {
    throw new Error('TranslationProvider.supports must be implemented.');
  }

  /**
   * @param {Array<Object>} _segments 
   * @param {string} _sourceLanguage 
   * @param {string} _targetLanguage 
   * @param {Object} [_options={}]
   * @returns {Promise<Array<Object>>}
   */
  async translateSegments(_segments, _sourceLanguage, _targetLanguage, _options = {}) {
    throw new Error('TranslationProvider.translateSegments must be implemented.');
  }
}

/**
 * Legacy MyMemory translation provider implementation.
 * Uses shared TranslationCache and maintains backwards-compatible circuit-breaker and batching semantics.
 */
export class MyMemoryTranslationProvider extends TranslationProvider {
  constructor(options = {}) {
    super();
    this.id = 'mymemory';
    this.isOfflineCapable = false;
    this.options = options;
    this.maxRetries = options.maxRetries || 3;
    this.timeoutMs = options.timeoutMs || 8000;
    this.maxBatchCues = options.maxBatchCues || 15;
    this.maxBatchChars = options.maxBatchChars || 1500;
    this.consecutiveFailures = 0;
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 3;
    this.circuitBreakerCooldownMs = options.circuitBreakerCooldownMs || 30000;
    this.circuitBreakerResetTime = 0;
    this.cache = options.cache || getTranslationCache(options);
  }

  supports(sourceLanguage, targetLanguage) {
    if (!targetLanguage) return false;
    const clean = normalizeLanguageCode(targetLanguage) || String(targetLanguage).toLowerCase().trim();
    const lang = getLanguageByCode(clean);
    return Boolean(lang);
  }

  isCircuitOpen() {
    if (this.circuitBreakerResetTime && Date.now() < this.circuitBreakerResetTime) {
      return true;
    }
    if (this.circuitBreakerResetTime && Date.now() >= this.circuitBreakerResetTime) {
      this.circuitBreakerResetTime = 0;
      this.consecutiveFailures = 0;
    }
    return false;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.circuitBreakerResetTime = 0;
  }

  recordFailure(_err) {
    this.consecutiveFailures++;
    if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
      this.circuitBreakerResetTime = Date.now() + this.circuitBreakerCooldownMs;
      console.warn(`[MyMemoryTranslationProvider] Circuit breaker tripped after ${this.consecutiveFailures} consecutive failures. Suspended until ${new Date(this.circuitBreakerResetTime).toISOString()}`);
    }
  }

  async fetchWithRetry(url, options = {}) {
    if (this.isCircuitOpen()) {
      throw new Error(`CIRCUIT_BREAKER_OPEN: Translation provider temporarily suspended due to repeated failures.`);
    }

    const timeout = options.timeoutMs || this.timeoutMs;
    let attempt = 0;
    let lastError = null;

    while (attempt < this.maxRetries) {
      attempt++;
      let timer = null;
      try {
        const controller = new AbortController();
        timer = setTimeout(() => {
          controller.abort(new Error(`Translation request timed out after ${timeout}ms`));
        }, timeout);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timer);

        if (response.status === 429 || response.status >= 500) {
          const err = new Error(`HTTP_${response.status}: Translation service returned ${response.status}`);
          lastError = err;
          if (attempt < this.maxRetries) {
            const jitter = Math.floor(Math.random() * 100);
            const backoffMs = Math.pow(2, attempt) * 200 + jitter;
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }
          this.recordFailure(err);
          throw err;
        }

        if (!response.ok) {
          const err = new Error(`HTTP_${response.status}: Translation request failed with status ${response.status}`);
          this.recordFailure(err);
          throw err;
        }

        this.recordSuccess();
        return response;
      } catch (err) {
        if (timer) clearTimeout(timer);
        lastError = err;
        if (attempt < this.maxRetries && !this.isCircuitOpen()) {
          const jitter = Math.floor(Math.random() * 100);
          const backoffMs = Math.pow(2, attempt) * 200 + jitter;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }
        this.recordFailure(err);
        throw err;
      }
    }

    this.recordFailure(lastError);
    throw lastError || new Error(`Translation request failed after ${this.maxRetries} retries`);
  }

  async fetchSingleText(text, langPair) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
    const response = await this.fetchWithRetry(url);
    if (!response || !response.ok) {
      throw new Error(`Translation request failed for pair ${langPair}`);
    }
    const data = await response.json();
    if (data.responseStatus && data.responseStatus !== 200) {
      throw new Error(`MyMemory error (status ${data.responseStatus}): ${data.responseDetails || 'Translation failed'}`);
    }
    const translated = data.responseData?.translatedText;
    if (!translated || typeof translated !== 'string' || !translated.trim() || translated.toUpperCase().includes('MYMEMORY WARNING')) {
      throw new Error(`Invalid or quota-limited translation response for pair ${langPair}: ${translated || 'empty'}`);
    }
    return translated.trim();
  }

  async translateSegments(segments, sourceLanguage = 'en', targetLanguage) {
    const srcClean = normalizeLanguageCode(sourceLanguage) || String(sourceLanguage).toLowerCase().trim();
    const tgtClean = normalizeLanguageCode(targetLanguage) || String(targetLanguage).toLowerCase().trim();

    if (srcClean === tgtClean) {
      return segments.map(s => ({ ...s }));
    }

    if (!Array.isArray(segments) || segments.length === 0) {
      return [];
    }

    const providerSrc = mapAITutorCodeToProvider(srcClean);
    const providerTgt = mapAITutorCodeToProvider(tgtClean);
    const langPair = `${providerSrc}|${providerTgt}`;

    // Step 1: Assign stable cue IDs and check cache
    const results = new Array(segments.length);
    const uncachedIndices = [];

    for (let i = 0; i < segments.length; i++) {
      const cue = segments[i];
      const cueId = cue.id || `cue_${String(i + 1).padStart(6, '0')}`;
      const origText = String(cue.text || cue.originalText || '').trim();

      if (!origText) {
        results[i] = {
          ...cue,
          id: cueId,
          start: Number(cue.start !== undefined ? cue.start : cue.startTime || 0),
          end: Number(cue.end !== undefined ? cue.end : cue.endTime || 0),
          text: ''
        };
        continue;
      }

      const cached = this.cache.get({
        text: origText,
        sourceLanguage: srcClean,
        targetLanguage: tgtClean,
        provider: 'mymemory',
        model: 'default'
      });

      if (cached) {
        results[i] = {
          ...cue,
          id: cueId,
          start: Number(cue.start !== undefined ? cue.start : cue.startTime || 0),
          end: Number(cue.end !== undefined ? cue.end : cue.endTime || 0),
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

    // Step 2: Payload-aware batching for uncached cues
    const DELIMITER = ' ||| ';
    const batches = [];
    let currentBatch = [];
    let currentChars = 0;

    for (const idx of uncachedIndices) {
      const cueText = String(segments[idx].text || segments[idx].originalText || '').trim();
      const addedChars = cueText.length + DELIMITER.length;

      if (currentBatch.length >= this.maxBatchCues || (currentChars + addedChars > this.maxBatchChars && currentBatch.length > 0)) {
        batches.push(currentBatch);
        currentBatch = [];
        currentChars = 0;
      }

      currentBatch.push(idx);
      currentChars += addedChars;
    }
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    // Step 3: Process batches with bounded retries and explicit error propagation
    for (const batch of batches) {
      const textsToTranslate = batch.map(idx => String(segments[idx].text || segments[idx].originalText || '').trim());
      const batchCombinedText = textsToTranslate.join(DELIMITER);

      let translatedTexts = [];
      let success = false;

      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(batchCombinedText)}&langpair=${langPair}`;
        const response = await this.fetchWithRetry(url);

        if (response && response.ok) {
          const data = await response.json();
          if (data.responseStatus && data.responseStatus !== 200) {
            throw new Error(`MyMemory API status ${data.responseStatus}`);
          }
          const rawTranslated = data.responseData?.translatedText || '';
          if (rawTranslated.toUpperCase().includes('MYMEMORY WARNING')) {
            throw new Error('MyMemory quota exceeded');
          }
          const parts = rawTranslated.split('|||').map(p => p.trim());

          if (parts.length === batch.length) {
            translatedTexts = parts;
            success = true;
          }
        }
      } catch (_) {}

      // Fallback: If batch failed or split count misaligned, translate cue-by-cue
      if (!success) {
        translatedTexts = [];
        for (const idx of batch) {
          const origText = String(segments[idx].text || '').trim();
          const singleTranslated = await this.fetchSingleText(origText, langPair);
          translatedTexts.push(singleTranslated);
        }
      }

      // Step 4: Map back to exact cue ID and timestamps
      for (let k = 0; k < batch.length; k++) {
        const idx = batch[k];
        const cue = segments[idx];
        const cueId = cue.id || `cue_${String(idx + 1).padStart(6, '0')}`;
        const origText = String(cue.text || cue.originalText || '').trim();
        const translatedVal = String(translatedTexts[k] || '').trim();

        if (!translatedVal) {
          throw new Error(`TRANSLATION_FAILED: Translation provider produced empty output for language '${targetLanguage}'`);
        }

        results[idx] = {
          ...cue,
          id: cueId,
          start: Number(cue.start !== undefined ? cue.start : cue.startTime || 0),
          end: Number(cue.end !== undefined ? cue.end : cue.endTime || 0),
          speakerId: cue.speakerId,
          originalText: origText,
          translatedText: translatedVal,
          text: translatedVal
        };

        if (origText) {
          this.cache.set({
            text: origText,
            sourceLanguage: srcClean,
            targetLanguage: tgtClean,
            provider: 'mymemory',
            model: 'default'
          }, translatedVal);
        }
      }
    }

    return results;
  }
}

/**
 * Backwards-compatible AITutorTranslationProvider wrapper.
 */
export class AITutorTranslationProvider extends TranslationProvider {
  constructor(options = {}) {
    super();
    this.memoryProvider = new MyMemoryTranslationProvider(options);
    this.options = options;
  }

  supports(sourceLanguage, targetLanguage) {
    return this.memoryProvider.supports(sourceLanguage, targetLanguage);
  }

  async translateSegments(segments, sourceLanguage = 'en', targetLanguage) {
    const srcClean = String(sourceLanguage).toLowerCase();
    const tgtClean = String(targetLanguage).toLowerCase();

    if (srcClean === tgtClean) {
      return segments.map((s, idx) => ({
        ...s,
        id: s.id || `cue_${String(idx + 1).padStart(6, '0')}`,
        start: Number(s.start !== undefined ? s.start : s.startTime || 0),
        end: Number(s.end !== undefined ? s.end : s.endTime || 0),
        text: s.text || s.originalText || ''
      }));
    }

    try {
      return await this.memoryProvider.translateSegments(segments, sourceLanguage, targetLanguage);
    } catch (err) {
      const isExplicitTestMode = (process.env.AITUTOR_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') &&
        this.options.__testOnlyExplicitFallback === true;
      if (isExplicitTestMode) {
        return segments.map((s, idx) => ({
          ...s,
          id: s.id || `cue_${String(idx + 1).padStart(6, '0')}`,
          start: Number(s.start !== undefined ? s.start : s.startTime || 0),
          end: Number(s.end !== undefined ? s.end : s.endTime || 0),
          text: `[TEST-${tgtClean}] ${s.text || s.originalText || ''}`
        }));
      }
      throw new Error(`Real translation failed for ${sourceLanguage} -> ${targetLanguage}: ${err.message}`);
    }
  }
}

export default TranslationProvider;
