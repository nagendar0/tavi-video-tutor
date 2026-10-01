// @ts-check
import { AITUTOR_LANGUAGES, normalizeLanguageCode } from '../languages/registry.js';
import { FLORES_200_MAPPING } from './LocalNllbProvider.js';

/**
 * @typedef {Object} TranslationLanguageRecord
 * @property {string} languageCode - Canonical Tavi language code (ISO 639-1 / 639-3)
 * @property {string} name - English display name
 * @property {string} bcp47 - BCP-47 locale tag
 * @property {string|null} nllbCode - FLORES-200 code for NLLB-200 or null if unsupported
 * @property {boolean} offlineSupported - True if supported offline by NLLB-200
 * @property {boolean} externalProviderSupport - True if supported by external translation
 * @property {boolean} translationSupported - True if supported by any translation provider
 * @property {string} notes - Verification and support rationale
 */

/**
 * Canonical 109-language translation capability matrix.
 * Audited directly against TAVI language registry and verified NLLB-200 FLORES mapping.
 * 
 * @type {TranslationLanguageRecord[]}
 */
export const TRANSLATION_LANGUAGE_MATRIX = Object.freeze(
  AITUTOR_LANGUAGES.map(lang => {
    const code = lang.code;
    const nllbCode = FLORES_200_MAPPING[code] || null;
    const isOffline = Boolean(nllbCode);

    let notes;
    if (isOffline) {
      notes = `Supported offline via local NLLB-200 (${nllbCode}) and external translation provider.`;
    } else {
      notes = `Unsupported offline: NLLB-200 lacks FLORES-200 code for ${lang.name} (${code}); external translation provider only.`;
    }

    return Object.freeze({
      languageCode: code,
      name: lang.name,
      bcp47: lang.bcp47,
      nllbCode,
      offlineSupported: isOffline,
      externalProviderSupport: true,
      translationSupported: true,
      notes
    });
  })
);

/**
 * Fast O(1) map of language code to translation capability.
 */
const MATRIX_MAP = new Map(
  TRANSLATION_LANGUAGE_MATRIX.map(rec => [rec.languageCode, rec])
);

/**
 * Retrieves the translation capability record for a given language code.
 * 
 * @param {string} languageCode 
 * @returns {TranslationLanguageRecord|null}
 */
export function getLanguageTranslationCapability(languageCode) {
  if (!languageCode) return null;
  const canonical = normalizeLanguageCode(languageCode) || String(languageCode).toLowerCase().trim();
  return MATRIX_MAP.get(canonical) || null;
}

/**
 * Returns true if the language is supported for offline translation via NLLB-200.
 * 
 * @param {string} languageCode 
 * @returns {boolean}
 */
export function isNllbLanguageSupported(languageCode) {
  const cap = getLanguageTranslationCapability(languageCode);
  return cap ? cap.offlineSupported : false;
}

/**
 * Returns the FLORES-200 code for NLLB-200 or null if unsupported.
 * 
 * @param {string} languageCode 
 * @returns {string|null}
 */
export function getNllbLanguageCode(languageCode) {
  const cap = getLanguageTranslationCapability(languageCode);
  return cap ? cap.nllbCode : null;
}

/**
 * Returns the complete 109-language translation capability matrix.
 * @returns {TranslationLanguageRecord[]}
 */
export function getTranslationMatrix() {
  return TRANSLATION_LANGUAGE_MATRIX;
}

export default TRANSLATION_LANGUAGE_MATRIX;
