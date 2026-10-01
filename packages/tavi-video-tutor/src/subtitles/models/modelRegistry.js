// @ts-check
import { RAW_LANGUAGE_ENTRIES, RAW_MODEL_DEFINITIONS } from './modelRegistryData.js';
import { normalizeLanguageCode } from '../languages/registry.js';

/**
 * High-performance lookup maps for O(1) resolution
 */
const MODEL_ID_TO_DEF = new Map();
for (const [id, def] of Object.entries(RAW_MODEL_DEFINITIONS)) {
  MODEL_ID_TO_DEF.set(id, Object.freeze({ ...def }));
}

const LANG_CODE_TO_ENTRY = new Map();
for (const entry of RAW_LANGUAGE_ENTRIES) {
  LANG_CODE_TO_ENTRY.set(entry.languageCode.toLowerCase(), Object.freeze({ ...entry }));
  if (entry.iso639_2) {
    LANG_CODE_TO_ENTRY.set(entry.iso639_2.toLowerCase(), Object.freeze({ ...entry }));
  }
}

/**
 * Normalizes input language representation to canonical registry code.
 * 
 * @param {string} code 
 * @returns {string|null}
 */
const resolveCode = (code) => {
  if (!code || typeof code !== 'string') return null;
  const norm = normalizeLanguageCode(code);
  return norm || code.trim().toLowerCase();
};

/**
 * Retrieves a specific model definition by its unique identifier.
 * 
 * @param {string} modelId - e.g. "piper:sq_AL-edon-medium", "kokoro:zh_CN-huayan", "mms:facebook/mms-tts-amh"
 * @returns {import('./modelRegistry.d.ts').ModelDefinition|null}
 */
export function getModel(modelId) {
  if (!modelId || typeof modelId !== 'string') return null;
  return MODEL_ID_TO_DEF.get(modelId.trim()) || null;
}

/**
 * Retrieves the canonical local neural model for a language.
 * Subtitle-only languages return null.
 * If an engine is specified, returns the canonical or best model for that engine.
 * 
 * @param {string} languageCode - e.g. "hi", "en", "af", "sq"
 * @param {string} [engine] - Optional engine filter: "piper" | "kokoro" | "mms"
 * @returns {import('./modelRegistry.d.ts').ModelDefinition|null}
 */
export function getCanonicalModel(languageCode, engine = null) {
  const norm = resolveCode(languageCode);
  if (!norm) return null;

  const entry = LANG_CODE_TO_ENTRY.get(norm);
  if (!entry || !entry.canonicalModel) return null;

  if (engine) {
    const cleanEngine = String(engine).toLowerCase().trim();
    if (entry.canonicalModel.engine === cleanEngine) {
      return entry.canonicalModel;
    }
    // Search alternative models for requested engine
    const match = (entry.alternativeModels || []).find(m => m.engine === cleanEngine);
    return match || null;
  }

  return entry.canonicalModel;
}

/**
 * Retrieves all alternative local neural models for a language.
 * Subtitle-only languages return an empty array.
 * 
 * @param {string} languageCode 
 * @returns {Array<import('./modelRegistry.d.ts').ModelDefinition>}
 */
export function getAlternativeModels(languageCode) {
  const norm = resolveCode(languageCode);
  if (!norm) return [];

  const entry = LANG_CODE_TO_ENTRY.get(norm);
  if (!entry || !Array.isArray(entry.alternativeModels)) return [];

  return [...entry.alternativeModels];
}

/**
 * Finds all technically available models (canonical + alternatives) for a language.
 * 
 * @param {string} languageCode 
 * @returns {Array<import('./modelRegistry.d.ts').ModelDefinition>}
 */
export function findModelsForLanguage(languageCode) {
  const norm = resolveCode(languageCode);
  if (!norm) return [];

  const entry = LANG_CODE_TO_ENTRY.get(norm);
  if (!entry) return [];

  const list = [];
  if (entry.canonicalModel) {
    list.push(entry.canonicalModel);
  }
  if (Array.isArray(entry.alternativeModels)) {
    list.push(...entry.alternativeModels);
  }

  return list;
}

/**
 * Returns all registered model definitions across the inventory.
 * 
 * @returns {Array<import('./modelRegistry.d.ts').ModelDefinition>}
 */
export function getAllModels() {
  return Array.from(MODEL_ID_TO_DEF.values());
}

/**
 * Retrieves the full language model entry from the registry.
 * 
 * @param {string} languageCode 
 * @returns {Object|null}
 */
export function getLanguageModelEntry(languageCode) {
  const norm = resolveCode(languageCode);
  if (!norm) return null;
  return LANG_CODE_TO_ENTRY.get(norm) || null;
}

/**
 * Returns all 109 language entries in the registry.
 * 
 * @returns {Array<Object>}
 */
export function getAllLanguageModelEntries() {
  return RAW_LANGUAGE_ENTRIES.map(e => ({ ...e }));
}

/**
 * Returns empirical inventory statistics for the Model Registry.
 * 
 * @returns {{
 *   totalLanguages: number,
 *   localNeuralCapable: number,
 *   subtitleOnly: number,
 *   canonicalByEngine: { piper: number, mms: number, kokoro: number },
 *   technicalCapabilityCounts: { LOCAL_NEURAL: number, LOCAL_NEURAL_RESEARCH: number, SUBTITLE_ONLY: number },
 *   totalModels: number
 * }}
 */
export function getModelInventoryStats() {
  const stats = {
    totalLanguages: RAW_LANGUAGE_ENTRIES.length,
    localNeuralCapable: 0,
    subtitleOnly: 0,
    canonicalByEngine: { piper: 0, mms: 0, kokoro: 0 },
    technicalCapabilityCounts: { LOCAL_NEURAL: 0, LOCAL_NEURAL_RESEARCH: 0, SUBTITLE_ONLY: 0 },
    totalModels: MODEL_ID_TO_DEF.size
  };

  for (const entry of RAW_LANGUAGE_ENTRIES) {
    if (entry.technicalCapability === 'SUBTITLE_ONLY') {
      stats.subtitleOnly++;
      stats.technicalCapabilityCounts.SUBTITLE_ONLY++;
    } else {
      stats.localNeuralCapable++;
      if (entry.technicalCapability === 'LOCAL_NEURAL') {
        stats.technicalCapabilityCounts.LOCAL_NEURAL++;
      } else if (entry.technicalCapability === 'LOCAL_NEURAL_RESEARCH') {
        stats.technicalCapabilityCounts.LOCAL_NEURAL_RESEARCH++;
      }

      if (entry.canonicalEngine && stats.canonicalByEngine[entry.canonicalEngine] !== undefined) {
        stats.canonicalByEngine[entry.canonicalEngine]++;
      }
    }
  }

  return stats;
}

/**
 * Object API representing the ModelRegistry interface
 */
export const ModelRegistry = {
  getModel,
  getCanonicalModel,
  getAlternativeModels,
  findModelsForLanguage,
  getAllModels,
  getLanguageModelEntry,
  getAllLanguageModelEntries,
  getModelInventoryStats
};

export default ModelRegistry;
