// @ts-check
import { AITUTOR_LANGUAGES, normalizeLanguageCode } from './registry.js';
import {
  getLanguageModelEntry,
  getAllLanguageModelEntries,
  getCanonicalModel,
  getAlternativeModels,
  findModelsForLanguage
} from '../models/modelRegistry.js';

/**
 * Technical language capability resolver for Tavi.
 * 
 * STRICT TECHNICAL SEPARATION:
 * Evaluates whether a language has translation capability, local neural TTS capability,
 * which technical engines/models are available, and returns structured capability reports.
 * 
 * In accordance with Phase 1 architecture, this resolver evaluates ONLY technical
 * capabilities and provenance facts, and does NOT make commercial policy decisions.
 */
export class CapabilityResolver {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Resolves technical capabilities for a language code, locale, or alias.
   * 
   * @param {string} languageCode - e.g. "hi", "en", "af", "hi-IN", "Hindi"
   * @param {Object} [options]
   * @param {string} [options.engine] - Optional engine preference ("piper" | "kokoro" | "mms")
   * @returns {import('./capabilityResolver.d.ts').LanguageCapabilityReport}
   */
  resolve(languageCode, options = {}) {
    const canonical = normalizeLanguageCode(languageCode);
    if (!canonical) {
      return {
        languageCode: String(languageCode || '').toLowerCase(),
        languageName: null,
        nativeName: null,
        iso639_2: null,
        bcp47: null,
        supported: false,
        translationSupported: false,
        translationCapability: false,
        technicalCapability: 'NONE',
        ttsSupported: false,
        canonicalEngine: null,
        canonicalModel: null,
        alternativeModels: [],
        allModels: [],
        offlineCapability: false,
        runtimeRequirements: null,
        provenance: {
          publishedLicense: null,
          datasetLicense: null,
          baseLineage: null,
          lineageMentionsLessac: null,
          lineageMentionsNC: null,
          isFinetuned: null,
          evidence: 'UNKNOWN'
        },
        error: 'UNSUPPORTED_LANGUAGE'
      };
    }

    const meta = AITUTOR_LANGUAGES.find(l => l.code === canonical);
    const modelEntry = getLanguageModelEntry(canonical);

    if (!meta || !modelEntry) {
      return {
        languageCode: canonical,
        languageName: null,
        nativeName: null,
        iso639_2: null,
        bcp47: null,
        supported: false,
        translationSupported: false,
        translationCapability: false,
        technicalCapability: 'NONE',
        ttsSupported: false,
        canonicalEngine: null,
        canonicalModel: null,
        alternativeModels: [],
        allModels: [],
        offlineCapability: false,
        runtimeRequirements: null,
        provenance: {
          publishedLicense: null,
          datasetLicense: null,
          baseLineage: null,
          lineageMentionsLessac: null,
          lineageMentionsNC: null,
          isFinetuned: null,
          evidence: 'UNKNOWN'
        },
        error: 'UNSUPPORTED_LANGUAGE'
      };
    }

    const requestedEngine = options.engine || this.options.engine || null;
    const effectiveCanonicalModel = requestedEngine
      ? getCanonicalModel(canonical, requestedEngine)
      : modelEntry.canonicalModel;

    const allModels = findModelsForLanguage(canonical);
    const alternativeModels = effectiveCanonicalModel
      ? allModels.filter(m => m.modelId !== effectiveCanonicalModel.modelId)
      : allModels;

    const hasTts = modelEntry.technicalCapability === 'LOCAL_NEURAL' || modelEntry.technicalCapability === 'LOCAL_NEURAL_RESEARCH';

    return {
      languageCode: meta.code,
      languageName: meta.name,
      nativeName: meta.nativeName,
      iso639_2: meta.iso639_2,
      bcp47: meta.bcp47,
      supported: modelEntry.translationCapability,
      translationSupported: modelEntry.translationCapability,
      translationCapability: modelEntry.translationCapability,
      technicalCapability: modelEntry.technicalCapability,
      ttsSupported: hasTts,
      canonicalEngine: effectiveCanonicalModel ? effectiveCanonicalModel.engine : modelEntry.canonicalEngine,
      canonicalModel: effectiveCanonicalModel,
      alternativeModels,
      allModels,
      offlineCapability: hasTts,
      runtimeRequirements: effectiveCanonicalModel ? effectiveCanonicalModel.runtimeRequirements : modelEntry.runtimeRequirements,
      provenance: effectiveCanonicalModel ? {
        publishedLicense: effectiveCanonicalModel.publishedLicense,
        datasetLicense: effectiveCanonicalModel.datasetLicense,
        baseLineage: effectiveCanonicalModel.baseLineage,
        lineageMentionsLessac: effectiveCanonicalModel.lineageMentionsLessac,
        lineageMentionsNC: effectiveCanonicalModel.lineageMentionsNC,
        isFinetuned: effectiveCanonicalModel.isFinetuned,
        evidence: effectiveCanonicalModel.evidence
      } : modelEntry.provenance
    };
  }

  /**
   * Returns technical capability reports for all 109 registered languages.
   * 
   * @param {Object} [options] 
   * @returns {Array<import('./capabilityResolver.d.ts').LanguageCapabilityReport>}
   */
  listAllCapabilities(options = {}) {
    return AITUTOR_LANGUAGES.map(lang => this.resolve(lang.code, options));
  }
}

/**
 * Singleton instance of CapabilityResolver for standard usage
 */
export const defaultCapabilityResolver = new CapabilityResolver();

/**
 * Convenience functional API to resolve language capabilities.
 * 
 * @param {string} languageCode 
 * @param {Object} [options] 
 * @returns {import('./capabilityResolver.d.ts').LanguageCapabilityReport}
 */
export function resolveCapability(languageCode, options = {}) {
  return defaultCapabilityResolver.resolve(languageCode, options);
}

/**
 * Convenience functional API to list all language capabilities.
 * 
 * @param {Object} [options] 
 * @returns {Array<import('./capabilityResolver.d.ts').LanguageCapabilityReport>}
 */
export function listAllCapabilities(options = {}) {
  return defaultCapabilityResolver.listAllCapabilities(options);
}

export default CapabilityResolver;
