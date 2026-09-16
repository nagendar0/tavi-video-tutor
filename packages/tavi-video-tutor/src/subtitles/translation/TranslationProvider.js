import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { AITUTOR_LANGUAGES, getLanguageByCode, normalizeLanguageCode } from '../languages/registry.js';
import { mapAITutorCodeToProvider } from '../languages/providerMappings.js';

// Text-level persistent & in-memory translation cache
const TEXT_CACHE_MAP = new Map();
let isCacheLoaded = false;
let cacheFilePath = null;

const getCachePath = () => {
  if (!cacheFilePath) {
    const cwd = process.cwd();
    const cacheDir = path.join(cwd, '.aitutor', 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    cacheFilePath = path.join(cacheDir, 'translation-text-cache.json');
  }
  return cacheFilePath;
};

const loadTranslationTextCache = () => {
  if (isCacheLoaded) return;
  isCacheLoaded = true;
  try {
    const file = getCachePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      Object.entries(data).forEach(([key, val]) => TEXT_CACHE_MAP.set(key, val));
    }
  } catch (_) {}
};

const saveTranslationTextCache = () => {
  try {
    const file = getCachePath();
    const obj = {};
    TEXT_CACHE_MAP.forEach((val, key) => { obj[key] = val; });
    const tmpFile = `${file}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(obj, null, 2), 'utf8');
    fs.renameSync(tmpFile, file);
  } catch (_) {}
};

const makeCacheKey = (text, srcLang, tgtLang, providerId = 'mymemory', modelId = 'default') => {
  const payload = `${text.trim()}|${srcLang.toLowerCase()}|${tgtLang.toLowerCase()}|${providerId.toLowerCase()}|${modelId.toLowerCase()}`;
  return crypto.createHash('md5').update(payload).digest('hex');
};

export class TranslationProvider {
  supports(sourceLanguage, targetLanguage) {
    throw new Error('TranslationProvider.supports must be implemented.');
  }

  async translateSegments(segments, sourceLanguage, targetLanguage) {
    throw new Error('TranslationProvider.translateSegments must be implemented.');
  }
}

export class MyMemoryTranslationProvider extends TranslationProvider {
  constructor(options = {}) {
    super();
    this.options = options;
    this.maxRetries = options.maxRetries || 3;
    this.timeoutMs = options.timeoutMs || 8000;
    this.maxBatchCues = options.maxBatchCues || 15;
    this.maxBatchChars = options.maxBatchChars || 1500;
    this.consecutiveFailures = 0;
    this.circuitBreakerThreshold = options.circuitBreakerThreshold || 3;
    this.circuitBreakerCooldownMs = options.circuitBreakerCooldownMs || 30000;
    this.circuitBreakerResetTime = 0;
    loadTranslationTextCache();
  }

  supports(sourceLanguage, targetLanguage) {
    if (!targetLanguage) return false;
    const lang = getLanguageByCode(targetLanguage);
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

  recordFailure(err) {
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
          id: cueId,
          start: Number(cue.start),
          end: Number(cue.end),
          text: ''
        };
        continue;
      }

      const cacheKey = makeCacheKey(origText, srcClean, tgtClean);
      if (TEXT_CACHE_MAP.has(cacheKey)) {
        results[i] = {
          id: cueId,
          start: Number(cue.start),
          end: Number(cue.end),
          text: TEXT_CACHE_MAP.get(cacheKey)
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
    let cacheUpdated = false;

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
        const origText = String(cue.text || '').trim();
        const translatedVal = String(translatedTexts[k] || '').trim();

        if (!translatedVal) {
          throw new Error(`TRANSLATION_FAILED: Translation provider produced empty output for language '${targetLanguage}'`);
        }

        results[idx] = {
          id: cueId,
          start: Number(cue.start),
          end: Number(cue.end),
          text: translatedVal
        };

        if (origText) {
          const cacheKey = makeCacheKey(origText, srcClean, tgtClean);
          TEXT_CACHE_MAP.set(cacheKey, translatedVal);
          cacheUpdated = true;
        }
      }
    }

    if (cacheUpdated) {
      saveTranslationTextCache();
    }

    return results;
  }
}

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
        id: s.id || `cue_${String(idx + 1).padStart(6, '0')}`,
        start: Number(s.start),
        end: Number(s.end),
        text: s.text
      }));
    }

    try {
      return await this.memoryProvider.translateSegments(segments, sourceLanguage, targetLanguage);
    } catch (err) {
      const isExplicitTestMode = (process.env.AITUTOR_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') &&
        this.options.__testOnlyExplicitFallback === true;
      if (isExplicitTestMode) {
        return segments.map((s, idx) => ({
          id: s.id || `cue_${String(idx + 1).padStart(6, '0')}`,
          start: Number(s.start),
          end: Number(s.end),
          text: `[TEST-${tgtClean}] ${s.text}`
        }));
      }
      throw new Error(`Real translation failed for ${sourceLanguage} -> ${targetLanguage}: ${err.message}`);
    }
  }
}

export default TranslationProvider;
