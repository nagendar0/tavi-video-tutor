// @ts-check
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Computes a robust, collision-resistant SHA-256 translation cache key.
 * Distinguishes provider, model, source language, target language, normalized text, and version.
 * 
 * @param {Object} params
 * @param {string} params.text - Source text to translate
 * @param {string} [params.sourceLanguage='en'] - Canonical source language code
 * @param {string} [params.targetLanguage='en'] - Canonical target language code
 * @param {string} [params.provider='nllb'] - Translation provider identifier
 * @param {string} [params.model='default'] - Translation model identifier
 * @param {string} [params.version='v1'] - Translation pipeline or schema version
 * @returns {string} SHA-256 hexadecimal hash
 */
export function computeTranslationCacheKey({
  text = '',
  sourceLanguage = 'en',
  targetLanguage = 'en',
  provider = 'nllb',
  model = 'default',
  version = 'v1'
} = {}) {
  const normText = String(text || '').trim();
  const src = String(sourceLanguage || '').toLowerCase().trim();
  const tgt = String(targetLanguage || '').toLowerCase().trim();
  const prov = String(provider || '').toLowerCase().trim();
  const mod = String(model || '').toLowerCase().trim();
  const ver = String(version || 'v1').toLowerCase().trim();

  const payload = [prov, mod, src, tgt, normText, ver].join('||');
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Computes legacy MD5 translation cache key for backwards compatibility with pre-Phase-7 cache files.
 * 
 * @param {string} text
 * @param {string} srcLang
 * @param {string} tgtLang
 * @param {string} [providerId='mymemory']
 * @param {string} [modelId='default']
 * @returns {string} MD5 hexadecimal hash
 */
export function computeLegacyCacheKey(text, srcLang, tgtLang, providerId = 'mymemory', modelId = 'default') {
  const payload = `${String(text || '').trim()}|${String(srcLang || '').toLowerCase().trim()}|${String(tgtLang || '').toLowerCase().trim()}|${String(providerId || '').toLowerCase().trim()}|${String(modelId || '').toLowerCase().trim()}`;
  return crypto.createHash('md5').update(payload, 'utf8').digest('hex');
}

/**
 * Robust, provider-aware persistent translation cache.
 */
export class TranslationCache {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.cacheDir] - Custom directory for cache storage
   * @param {string} [options.cacheFilePath] - Explicit file path for cache JSON
   * @param {boolean} [options.inMemoryOnly=false] - Operate strictly in memory
   */
  constructor(options = {}) {
    this.options = options;
    this.inMemoryOnly = options.inMemoryOnly === true;
    this.map = new Map();
    this.isLoaded = false;

    if (options.cacheFilePath) {
      this.filePath = options.cacheFilePath;
    } else {
      const baseDir = options.cacheDir || path.join(process.cwd(), '.aitutor', 'cache');
      this.filePath = path.join(baseDir, 'translation-text-cache.json');
    }
  }

  load() {
    if (this.isLoaded || this.inMemoryOnly) return;
    this.isLoaded = true;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          for (const [key, val] of Object.entries(data)) {
            if (typeof val === 'string') {
              this.map.set(key, val);
            }
          }
        }
      }
    } catch (_) {
      // Ignore corrupted or unreadable cache file safely
    }
  }

  save() {
    if (this.inMemoryOnly) return;
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const obj = {};
      this.map.forEach((val, key) => {
        obj[key] = val;
      });
      const tmpFile = `${this.filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
      fs.writeFileSync(tmpFile, JSON.stringify(obj, null, 2), 'utf8');
      fs.renameSync(tmpFile, this.filePath);
    } catch (_) {
      // Ignore disk persistence errors silently
    }
  }

  /**
   * Retrieves translated text from cache.
   * Checks primary SHA-256 key, then falls back to legacy MD5 key.
   * 
   * @param {Object} query
   * @param {string} query.text - Source text
   * @param {string} query.sourceLanguage - Source language code
   * @param {string} query.targetLanguage - Target language code
   * @param {string} [query.provider] - Provider identifier
   * @param {string} [query.model] - Model identifier
   * @param {string} [query.version] - Translation version
   * @returns {string|null}
   */
  get(query) {
    this.load();
    const primaryKey = computeTranslationCacheKey(query);
    if (this.map.has(primaryKey)) {
      return this.map.get(primaryKey);
    }

    // Check legacy MD5 key fallback
    const legacyKey = computeLegacyCacheKey(
      query.text,
      query.sourceLanguage,
      query.targetLanguage,
      query.provider || 'mymemory',
      query.model || 'default'
    );
    if (this.map.has(legacyKey)) {
      return this.map.get(legacyKey);
    }

    return null;
  }

  /**
   * Stores translated text in cache with both SHA-256 and legacy keys.
   * 
   * @param {Object} query
   * @param {string} query.text - Source text
   * @param {string} query.sourceLanguage - Source language code
   * @param {string} query.targetLanguage - Target language code
   * @param {string} [query.provider] - Provider identifier
   * @param {string} [query.model] - Model identifier
   * @param {string} [query.version] - Translation version
   * @param {string} translatedText - Translated output
   */
  set(query, translatedText) {
    if (!translatedText || typeof translatedText !== 'string') return;
    this.load();
    const primaryKey = computeTranslationCacheKey(query);
    const legacyKey = computeLegacyCacheKey(
      query.text,
      query.sourceLanguage,
      query.targetLanguage,
      query.provider || 'mymemory',
      query.model || 'default'
    );

    this.map.set(primaryKey, translatedText);
    this.map.set(legacyKey, translatedText);
    this.save();
  }

  has(query) {
    this.load();
    const primaryKey = computeTranslationCacheKey(query);
    if (this.map.has(primaryKey)) return true;
    const legacyKey = computeLegacyCacheKey(
      query.text,
      query.sourceLanguage,
      query.targetLanguage,
      query.provider || 'mymemory',
      query.model || 'default'
    );
    return this.map.has(legacyKey);
  }

  clear() {
    this.map.clear();
    this.isLoaded = true;
    if (!this.inMemoryOnly && fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
      } catch (_) {}
    }
  }

  size() {
    this.load();
    return this.map.size;
  }
}

// Global default cache instance
let globalTranslationCache = null;

/**
 * Returns the shared or configured TranslationCache instance.
 * @param {Object} [options={}]
 * @returns {TranslationCache}
 */
export function getTranslationCache(options = {}) {
  if (options.cacheDir || options.cacheFilePath || options.inMemoryOnly) {
    return new TranslationCache(options);
  }
  if (!globalTranslationCache) {
    globalTranslationCache = new TranslationCache();
  }
  return globalTranslationCache;
}

export default TranslationCache;
