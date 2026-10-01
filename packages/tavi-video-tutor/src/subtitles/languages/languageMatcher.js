import { normalizeLanguageCode } from './registry.js';

/**
 * Normalizes Devanagari anusvara / half-nasal so both 'हिंदी' and 'हिन्दी' match 'हिं'.
 * 
 * @param {string} str 
 * @returns {string}
 */
export const normalizeDevanagari = (str) => {
  if (!str) return '';
  return str.replace(/\u0928\u094D/g, '\u0902');
};

/**
 * Universal language matching utility matching language code, ISO 639-2,
 * English name, native language name, and display label case-insensitively.
 * 
 * @param {string} query 
 * @param {Object} options
 * @param {string} [options.code]
 * @param {string} [options.name]
 * @param {string} [options.nativeName]
 * @param {string} [options.iso639_2]
 * @param {string} [options.label]
 * @returns {boolean}
 */
export const matchesLanguageQuery = (query, { code, name, nativeName, iso639_2, label } = {}) => {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // 1. Exact canonical alias match (e.g. "hin" -> "hi", "te" -> "te", "spa" -> "es")
  const canonicalQ = normalizeLanguageCode(q);
  if (canonicalQ && canonicalQ === code) return true;

  // 2. Direct code match (e.g. "te", "hi", "en", "es")
  if (code && code.toLowerCase().includes(q)) return true;

  // 3. ISO-639-2 match (e.g. "hin", "tel", "spa", "jpn")
  if (iso639_2 && iso639_2.toLowerCase().includes(q)) return true;

  // 4. English name match (e.g. "Hindi", "Telugu", "Spanish")
  if (name && name.toLowerCase().includes(q)) return true;

  // 5. Native name match (e.g. "हिन्दी", "తెలుగు", "Español", "日本語")
  if (nativeName) {
    const nativeLower = nativeName.toLowerCase();
    if (nativeLower.includes(q)) return true;
    if (normalizeDevanagari(nativeLower).includes(normalizeDevanagari(q))) return true;
  }

  // 6. Display label match (e.g. "English (Original)", "हिन्दी / Hindi (Original)")
  if (label && label.toLowerCase().includes(q)) return true;

  return false;
};
