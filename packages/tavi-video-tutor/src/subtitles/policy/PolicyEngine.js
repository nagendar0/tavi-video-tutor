// @ts-check
import {
  getModel,
  getCanonicalModel,
  getLanguageModelEntry,
  getAllLanguageModelEntries
} from '../models/modelRegistry.js';
import { normalizeLanguageCode, AITUTOR_LANGUAGES } from '../languages/registry.js';
import { TaviPolicyError } from '../errors/index.js';

/**
 * Standard policy error class for Tavi PolicyEngine operations.
 */
export class PolicyError extends TaviPolicyError {
  /**
   * @param {string} message 
   * @param {string} code 
   */
  constructor(message, code) {
    super(message, {
      name: 'PolicyError',
      code: code || 'MODEL_POLICY_RESTRICTED'
    });
    this.name = 'PolicyError';
    this.code = code;
  }
}

/**
 * Supported policy profiles.
 * @readonly
 * @enum {string}
 */
export const POLICY_PROFILES = Object.freeze({
  RELAXED: 'RELAXED', // Standard A: Publisher-asserted license permissions
  STRICT: 'STRICT',   // Standard B: Strict derivative-lineage restrictions
  CUSTOM: 'CUSTOM'    // Custom rule evaluation
});

/**
 * Supported execution modes.
 * @readonly
 * @enum {string}
 */
export const EXECUTION_MODES = Object.freeze({
  COMMERCIAL: 'COMMERCIAL',
  RESEARCH: 'RESEARCH'
});

/**
 * Deterministic policy status outcomes.
 * @readonly
 * @enum {string}
 */
export const POLICY_STATUS = Object.freeze({
  PERMITTED: 'PERMITTED',         // Allowed in requested execution mode under active policy
  RESEARCH_ONLY: 'RESEARCH_ONLY', // Permitted for research, restricted from commercial
  CONTESTED: 'CONTESTED',         // Conflicting or disputed provenance/license metadata
  UNKNOWN: 'UNKNOWN'              // Missing, unresolved, or unverified metadata
});

/**
 * Normalizes input policy profile string to canonical enum value.
 * 
 * @param {string} profile 
 * @returns {string}
 * @throws {PolicyError} If profile is invalid
 */
export function normalizePolicyProfile(profile) {
  if (!profile || typeof profile !== 'string') {
    throw new PolicyError(`INVALID_POLICY_PROFILE: Policy profile must be a non-empty string. Received: ${profile}`, 'INVALID_POLICY_PROFILE');
  }
  const clean = profile.toUpperCase().trim().replace(/[-\s]/g, '_');
  if (clean === 'RELAXED' || clean === 'POLICY_A' || clean === 'STANDARD_A') {
    return POLICY_PROFILES.RELAXED;
  }
  if (clean === 'STRICT' || clean === 'POLICY_B' || clean === 'STANDARD_B') {
    return POLICY_PROFILES.STRICT;
  }
  if (clean === 'CUSTOM') {
    return POLICY_PROFILES.CUSTOM;
  }
  throw new PolicyError(`INVALID_POLICY_PROFILE: Unknown policy profile '${profile}'. Supported profiles: RELAXED, STRICT, CUSTOM`, 'INVALID_POLICY_PROFILE');
}

/**
 * Normalizes input execution mode string to canonical enum value.
 * 
 * @param {string} mode 
 * @returns {string}
 * @throws {PolicyError} If execution mode is invalid
 */
export function normalizeExecutionMode(mode) {
  if (!mode || typeof mode !== 'string') {
    throw new PolicyError(`INVALID_EXECUTION_MODE: Execution mode must be a non-empty string. Received: ${mode}`, 'INVALID_EXECUTION_MODE');
  }
  const clean = mode.toUpperCase().trim();
  if (clean === 'COMMERCIAL') {
    return EXECUTION_MODES.COMMERCIAL;
  }
  if (clean === 'RESEARCH' || clean === 'ACADEMIC' || clean === 'NON_COMMERCIAL') {
    return EXECUTION_MODES.RESEARCH;
  }
  throw new PolicyError(`INVALID_EXECUTION_MODE: Unknown execution mode '${mode}'. Supported modes: COMMERCIAL, RESEARCH`, 'INVALID_EXECUTION_MODE');
}

/**
 * Standalone, deterministic Policy Engine for Tavi.
 * 
 * STRICT TECHNICAL & POLICY SEPARATION INVARIANTS:
 * - Operates only on technical facts and metadata provided by ModelRegistry.
 * - Does NOT mutate ModelRegistry entries or incoming model objects.
 * - Does NOT add technical capability facts or invent licensing/lineage facts.
 * - Does NOT perform network I/O, download models, or execute TTS providers.
 * - Evaluates configurable organizational policy decisions, NOT universal legal truth.
 */
export class PolicyEngine {
  /**
   * @param {Object} [options]
   * @param {string} [options.defaultProfile] - Default policy profile ('RELAXED' | 'STRICT')
   * @param {string} [options.defaultExecutionMode] - Default execution mode ('COMMERCIAL' | 'RESEARCH')
   * @param {Function} [options.customEvaluator] - Optional custom evaluator function for CUSTOM profile
   */
  constructor(options = {}) {
    const rawProfile = options.defaultProfile || options.policyProfile;
    const rawMode = options.defaultExecutionMode || options.executionMode;
    this.defaultProfile = rawProfile ? normalizePolicyProfile(rawProfile) : POLICY_PROFILES.RELAXED;
    this.defaultExecutionMode = rawMode ? normalizeExecutionMode(rawMode) : EXECUTION_MODES.COMMERCIAL;
    this.customEvaluator = typeof options.customEvaluator === 'function' ? options.customEvaluator : null;
  }

  /**
   * Evaluates policy compliance for a model or language.
   * 
   * @param {any} modelOrLanguage - Model ID string, language code string, or model definition object
   * @param {Record<string, any>} [options]
   * @param {string} [options.policyProfile] - 'RELAXED' | 'STRICT' | 'CUSTOM'
   * @param {string} [options.executionMode] - 'COMMERCIAL' | 'RESEARCH'
   * @param {string} [options.engine] - Optional engine preference when passing a language code
   * @returns {any} Frozen policy evaluation result
   */
  evaluate(modelOrLanguage, options = {}) {
    const profile = options.policyProfile ? normalizePolicyProfile(options.policyProfile) : this.defaultProfile;
    const mode = options.executionMode ? normalizeExecutionMode(options.executionMode) : this.defaultExecutionMode;

    if (!modelOrLanguage) {
      return this._buildResult({
        modelId: null,
        languageCode: null,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: 'MODEL_NOT_FOUND: Null or empty model/language identifier provided.',
        evidence: 'UNKNOWN',
        restrictions: ['MODEL_NOT_FOUND'],
        technicalCapability: 'NONE'
      });
    }

    // Direct model definition object
    if (typeof modelOrLanguage === 'object' && modelOrLanguage.modelId) {
      const regDef = getModel(modelOrLanguage.modelId);
      return this._evaluateModelDefinition(regDef || modelOrLanguage, profile, mode);
    }

    // String identifier: Could be modelId (e.g. "piper:sq_AL-edon-medium") or language code (e.g. "sq", "en", "bho")
    if (typeof modelOrLanguage === 'string') {
      const trimmed = modelOrLanguage.trim();

      // Check if it matches a model ID in ModelRegistry
      const modelDef = getModel(trimmed);
      if (modelDef) {
        return this._evaluateModelDefinition(modelDef, profile, mode);
      }

      // Check if it matches a registered language code or alias
      const normLang = normalizeLanguageCode(trimmed);
      if (normLang) {
        return this.evaluateLanguage(normLang, { policyProfile: profile, executionMode: mode, engine: options.engine });
      }

      // Unknown identifier
      return this._buildResult({
        modelId: trimmed,
        languageCode: null,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: `MODEL_NOT_FOUND: Model or language '${trimmed}' not found in registry.`,
        evidence: 'UNKNOWN',
        restrictions: ['MODEL_NOT_FOUND'],
        technicalCapability: 'NONE'
      });
    }

    return this._buildResult({
      modelId: null,
      languageCode: null,
      profile,
      mode,
      policyStatus: POLICY_STATUS.UNKNOWN,
      permitted: false,
      reason: 'MODEL_NOT_FOUND: Invalid model or language reference provided.',
      evidence: 'UNKNOWN',
      restrictions: ['INVALID_ARGUMENT'],
      technicalCapability: 'NONE'
    });
  }

  /**
   * Evaluates policy compliance for a specific model definition or model ID.
   * 
   * @param {any} model - Model ID string or model definition object
   * @param {any} [options]
   * @returns {any}
   */
  evaluateModel(model, options = {}) {
    let profile = this.defaultProfile;
    let mode = this.defaultExecutionMode;
    const opts = /** @type {any} */ (options);

    if (typeof options === 'string') {
      const clean = options.toUpperCase().trim();
      if (clean === 'COMMERCIAL' || clean === 'RESEARCH' || clean === 'ACADEMIC') {
        mode = normalizeExecutionMode(clean);
      } else {
        profile = normalizePolicyProfile(clean);
      }
      if (typeof arguments[2] === 'string') {
        const clean2 = arguments[2].toUpperCase().trim();
        if (clean2 === 'COMMERCIAL' || clean2 === 'RESEARCH') {
          mode = normalizeExecutionMode(clean2);
        } else {
          profile = normalizePolicyProfile(clean2);
        }
      }
    } else if (opts && typeof opts === 'object') {
      if (opts.policyProfile) profile = normalizePolicyProfile(opts.policyProfile);
      if (opts.executionMode) mode = normalizeExecutionMode(opts.executionMode);
    }

    const m = /** @type {any} */ (model);
    const modelDef = typeof model === 'string'
      ? getModel(model)
      : (m && m.modelId && getModel(m.modelId) ? getModel(m.modelId) : m);
    if (!modelDef || !modelDef.modelId) {
      return this._buildResult({
        modelId: typeof model === 'string' ? model : null,
        languageCode: null,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: `MODEL_NOT_FOUND: Model '${typeof model === 'string' ? model : 'unknown'}' not found in registry.`,
        evidence: 'UNKNOWN',
        restrictions: ['MODEL_NOT_FOUND'],
        technicalCapability: 'NONE'
      });
    }

    return this._evaluateModelDefinition(modelDef, profile, mode);
  }

  /**
   * Evaluates policy compliance for a registered language.
   * Accurately distinguishes local-neural models from subtitle-only entries.
   * 
   * @param {string} languageCode - e.g. "hi", "en", "bho", "af"
   * @param {Object} [options]
   * @param {string} [options.policyProfile]
   * @param {string} [options.executionMode]
   * @param {string} [options.engine] - Optional engine preference
   * @returns {Object}
   */
  evaluateLanguage(languageCode, options = {}) {
    const profile = options.policyProfile ? normalizePolicyProfile(options.policyProfile) : this.defaultProfile;
    const mode = options.executionMode ? normalizeExecutionMode(options.executionMode) : this.defaultExecutionMode;

    const norm = normalizeLanguageCode(languageCode);
    if (!norm) {
      return this._buildResult({
        modelId: null,
        languageCode: String(languageCode || '').toLowerCase(),
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: `LANGUAGE_NOT_FOUND: Language '${languageCode}' is not registered in Tavi.`,
        evidence: 'UNKNOWN',
        restrictions: ['LANGUAGE_NOT_FOUND'],
        technicalCapability: 'NONE'
      });
    }

    const langEntry = getLanguageModelEntry(norm);
    if (!langEntry) {
      return this._buildResult({
        modelId: null,
        languageCode: norm,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: `LANGUAGE_NOT_FOUND: Language '${norm}' has no entry in ModelRegistry.`,
        evidence: 'UNKNOWN',
        restrictions: ['LANGUAGE_NOT_FOUND'],
        technicalCapability: 'NONE'
      });
    }

    // Subtitle-only boundary: exactly 28 languages have no local neural model
    if (langEntry.technicalCapability === 'SUBTITLE_ONLY' || !langEntry.canonicalModel) {
      return this._buildResult({
        modelId: null,
        languageCode: norm,
        profile,
        mode,
        policyStatus: POLICY_STATUS.RESEARCH_ONLY, // Subtitle translation allowed, but dubbing/TTS has no model
        permitted: false, // Cannot synthesize audio because no technical model exists
        reason: `SUBTITLE_ONLY: Language '${norm}' has verified subtitle capability, but no local neural TTS model exists in registry.`,
        evidence: langEntry.provenance?.evidence || 'VERIFIED',
        restrictions: ['TTS_UNSUPPORTED', 'SUBTITLES_ONLY'],
        technicalCapability: 'SUBTITLE_ONLY'
      });
    }

    // Local-neural language: evaluate canonical model (or engine-filtered model)
    const effectiveModel = options.engine
      ? getCanonicalModel(norm, /** @type {any} */ (options.engine))
      : langEntry.canonicalModel;

    if (!effectiveModel) {
      return this._buildResult({
        modelId: null,
        languageCode: norm,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: `MODEL_NOT_FOUND: No model available for engine '${options.engine}' in language '${norm}'.`,
        evidence: 'UNKNOWN',
        restrictions: ['ENGINE_MODEL_NOT_FOUND'],
        technicalCapability: langEntry.technicalCapability
      });
    }

    return this._evaluateModelDefinition(effectiveModel, profile, mode, langEntry.technicalCapability);
  }

  /**
   * Internal evaluation of a model definition against policy rules.
   * 
   * @private
   * @param {any} modelDef
   * @param {string} profile
   * @param {string} mode
   * @param {string|null} [technicalCap]
   * @returns {any}
   */
  _evaluateModelDefinition(modelDef, profile, mode, technicalCap = null) {
    const m = /** @type {any} */ (modelDef);
    const techCapability = technicalCap || (m.publishedLicense?.includes('NC') ? 'LOCAL_NEURAL_RESEARCH' : 'LOCAL_NEURAL');
    const publishedLicense = m.publishedLicense;
    const baseLineage = m.baseLineage || '';
    const lineageMentionsLessac = Boolean(m.lineageMentionsLessac);
    const lineageMentionsNC = Boolean(m.lineageMentionsNC);
    const evidence = m.evidence || 'VERIFIED';

    // Anti-fabrication check: Missing license metadata cannot automatically become PERMITTED
    if (!publishedLicense || publishedLicense === 'UNKNOWN') {
      return this._buildResult({
        modelId: m.modelId,
        languageCode: m.languageCode,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: 'Missing or unresolved published license metadata in model definition.',
        evidence: 'UNKNOWN',
        restrictions: ['MISSING_LICENSE_METADATA', 'EVIDENCE_UNVERIFIED'],
        technicalCapability: techCapability,
        engine: m.engine
      });
    }

    const isRegistered = Boolean(m.modelId && getModel(m.modelId));

    const isExplicitNC = publishedLicense.includes('NC') ||
                         publishedLicense.includes('Non-Commercial') ||
                         publishedLicense.toLowerCase().includes('non-commercial') ||
                         publishedLicense.toLowerCase().includes('research') ||
                         publishedLicense.toLowerCase().includes('academic') ||
                         publishedLicense.includes('CC-BY-NC');

    const isPermissive = publishedLicense.includes('MIT') ||
                         publishedLicense.toLowerCase().includes('apache') ||
                         publishedLicense.includes('CC0') ||
                         (publishedLicense.includes('CC-BY') && !publishedLicense.includes('NC')) ||
                         publishedLicense.toLowerCase().includes('bsd') ||
                         publishedLicense.toLowerCase().includes('public domain') ||
                         publishedLicense.toLowerCase().includes('open source');

    // CUSTOM profile delegate
    if (profile === POLICY_PROFILES.CUSTOM) {
      if (typeof this.customEvaluator !== 'function') {
        throw new PolicyError('INVALID_POLICY_PROFILE: Custom policy profile selected but no customEvaluator function was provided.', 'INVALID_POLICY_PROFILE');
      }
      const customDecision = this.customEvaluator(m, { profile, mode });
      let permitted = Boolean(customDecision.permitted);
      let policyStatus = customDecision.policyStatus;
      const restrictions = [...(customDecision.restrictions || [])];

      // Anti-bypass guard: Custom evaluator cannot grant commercial clearance to non-commercial, unverified, or unregistered models
      if (mode === EXECUTION_MODES.COMMERCIAL && permitted) {
        if (isExplicitNC || m.engine === 'mms') {
          permitted = false;
          policyStatus = POLICY_STATUS.RESEARCH_ONLY;
          if (!restrictions.includes('NON_COMMERCIAL_PUBLISHER_LICENSE')) {
            restrictions.push('NON_COMMERCIAL_PUBLISHER_LICENSE');
          }
          restrictions.push('CUSTOM_COMMERCIAL_BYPASS_BLOCKED');
        } else if (!isRegistered) {
          permitted = false;
          policyStatus = POLICY_STATUS.UNKNOWN;
          restrictions.push('UNREGISTERED_MODEL');
          restrictions.push('CUSTOM_COMMERCIAL_BYPASS_BLOCKED');
        } else if (!isPermissive) {
          permitted = false;
          policyStatus = POLICY_STATUS.UNKNOWN;
          restrictions.push('UNVERIFIED_OR_UNKNOWN_LICENSE');
          restrictions.push('CUSTOM_COMMERCIAL_BYPASS_BLOCKED');
        }
      }

      return this._buildResult({
        modelId: m.modelId,
        languageCode: m.languageCode,
        profile,
        mode,
        policyStatus,
        permitted,
        reason: permitted ? customDecision.reason : (customDecision.reason || 'Restricted under commercial baseline guard'),
        evidence: customDecision.evidence || evidence,
        restrictions,
        technicalCapability: techCapability,
        engine: m.engine
      });
    }

    if (!isPermissive && !isExplicitNC) {
      return this._buildResult({
        modelId: m.modelId,
        languageCode: m.languageCode,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: `[POLICY_DECISION] Unknown or unverified license '${publishedLicense}' cannot be verified as commercial-safe.`,
        evidence: 'UNKNOWN',
        restrictions: ['UNVERIFIED_OR_UNKNOWN_LICENSE'],
        technicalCapability: techCapability,
        engine: m.engine
      });
    }

    // Residual gate 2: Unregistered models cannot become commercial-authorized solely because the object claims a permissive license
    if (!isRegistered && mode === EXECUTION_MODES.COMMERCIAL) {
      return this._buildResult({
        modelId: m.modelId,
        languageCode: m.languageCode,
        profile,
        mode,
        policyStatus: POLICY_STATUS.UNKNOWN,
        permitted: false,
        reason: `[POLICY_DECISION] Unregistered model '${m.modelId}' has no verified provenance in ModelRegistry and cannot be commercial-authorized.`,
        evidence: 'UNVERIFIED',
        restrictions: ['UNREGISTERED_MODEL', 'UNVERIFIED_FOR_COMMERCIAL'],
        technicalCapability: techCapability,
        engine: m.engine
      });
    }

    // -------------------------------------------------------------------------
    // POLICY_A / RELAXED: Honors explicit publisher-asserted licenses
    // -------------------------------------------------------------------------
    if (profile === POLICY_PROFILES.RELAXED) {
      if (isExplicitNC) {
        const permitted = mode === EXECUTION_MODES.RESEARCH;
        return this._buildResult({
          modelId: m.modelId,
          languageCode: m.languageCode,
          profile,
          mode,
          policyStatus: POLICY_STATUS.RESEARCH_ONLY,
          permitted,
          reason: permitted
            ? `[POLICY_DECISION] Permitted for research execution under Standard A relaxed policy (publisher license: ${publishedLicense}).`
            : `[POLICY_DECISION] Commercial use restricted under Standard A relaxed policy: publisher license (${publishedLicense}) explicitly restricts to research/non-commercial use.`,
          evidence,
          restrictions: ['NON_COMMERCIAL_PUBLISHER_LICENSE'],
          technicalCapability: techCapability,
          engine: m.engine
        });
      }

      // Permissive publisher license (MIT, Apache-2.0, CC0, CC-BY, etc.)
      return this._buildResult({
        modelId: m.modelId,
        languageCode: m.languageCode,
        profile,
        mode,
        policyStatus: POLICY_STATUS.PERMITTED,
        permitted: true,
        reason: `[POLICY_DECISION] Permitted under Standard A relaxed policy based on publisher-asserted permissive license (${publishedLicense}).`,
        evidence,
        restrictions: [],
        technicalCapability: techCapability,
        engine: m.engine
      });
    }

    // -------------------------------------------------------------------------
    // POLICY_B / STRICT: Derivative-lineage inspection
    // -------------------------------------------------------------------------
    if (profile === POLICY_PROFILES.STRICT) {
      const hasUpstreamNCRestriction = isExplicitNC ||
                                      lineageMentionsNC ||
                                      lineageMentionsLessac ||
                                      baseLineage.toLowerCase().includes('lessac') ||
                                      baseLineage.toLowerCase().includes('blizzard') ||
                                      baseLineage.toLowerCase().includes('non-commercial');

      if (hasUpstreamNCRestriction) {
        const permitted = mode === EXECUTION_MODES.RESEARCH;
        const restrictions = [];
        if (isExplicitNC) restrictions.push('NON_COMMERCIAL_PUBLISHER_LICENSE');
        if (lineageMentionsLessac || baseLineage.toLowerCase().includes('lessac')) restrictions.push('LESSAC_BLIZZARD_UPSTREAM_LINEAGE');
        if (lineageMentionsNC) restrictions.push('NON_COMMERCIAL_DERIVATIVE_LINEAGE');

        return this._buildResult({
          modelId: m.modelId,
          languageCode: m.languageCode,
          profile,
          mode,
          policyStatus: POLICY_STATUS.RESEARCH_ONLY,
          permitted,
          reason: permitted
            ? `[POLICY_DECISION] Permitted for research execution under Standard B strict derivative policy (${restrictions.join(', ')}).`
            : `[POLICY_DECISION] Commercial use restricted under Standard B strict derivative policy due to upstream non-commercial training lineage: ${baseLineage || publishedLicense}.`,
          evidence,
          restrictions,
          technicalCapability: techCapability,
          engine: m.engine
        });
      }

      // Permissive publisher license AND clean verified lineage
      return this._buildResult({
        modelId: m.modelId,
        languageCode: m.languageCode,
        profile,
        mode,
        policyStatus: POLICY_STATUS.PERMITTED,
        permitted: true,
        reason: `[POLICY_DECISION] Permitted under Standard B strict policy: verified permissive published license (${publishedLicense}) and clean acoustic training lineage.`,
        evidence,
        restrictions: [],
        technicalCapability: techCapability,
        engine: m.engine
      });
    }

    throw new PolicyError(`INVALID_POLICY_PROFILE: Unsupported policy profile '${profile}'.`, 'INVALID_POLICY_PROFILE');
  }

  /**
   * Internal constructor for frozen policy results.
   * Guarantees immutability and exact output schema.
   * 
   * @param {any} params
   * @returns {any}
   * @private
   */
  _buildResult(params) {
    return Object.freeze({
      modelId: params.modelId || null,
      languageCode: params.languageCode || null,
      policyProfile: params.profile,
      executionMode: params.mode,
      policyStatus: params.policyStatus,
      permitted: Boolean(params.permitted),
      reason: params.reason || '',
      evidence: params.evidence || 'VERIFIED',
      restrictions: Object.freeze([...(params.restrictions || [])]),
      technicalCapability: params.technicalCapability || 'NONE',
      engine: params.engine || null
    });
  }

  /**
   * Evaluates the entire 109-language matrix under the specified policy profile and execution mode.
   * 
   * @param {Record<string, any>} [options]
   * @returns {any}
   */
  evaluateMatrix(options = {}) {
    const profile = options.policyProfile ? normalizePolicyProfile(options.policyProfile) : this.defaultProfile;
    const mode = options.executionMode ? normalizeExecutionMode(options.executionMode) : this.defaultExecutionMode;

    const results = [];
    const counts = {
      totalLanguages: AITUTOR_LANGUAGES.length,
      commercialPermitted: 0,
      researchOnly: 0,
      subtitleOnly: 0,
      contested: 0,
      unknown: 0
    };

    for (const lang of AITUTOR_LANGUAGES) {
      const res = this.evaluateLanguage(lang.code, { policyProfile: profile, executionMode: mode });
      results.push(res);

      if (res.technicalCapability === 'SUBTITLE_ONLY') {
        counts.subtitleOnly++;
      } else if (res.policyStatus === POLICY_STATUS.PERMITTED) {
        counts.commercialPermitted++;
      } else if (res.policyStatus === POLICY_STATUS.RESEARCH_ONLY) {
        counts.researchOnly++;
      } else if (res.policyStatus === POLICY_STATUS.CONTESTED) {
        counts.contested++;
      } else {
        counts.unknown++;
      }
    }

    return Object.freeze({
      results: Object.freeze(results),
      counts: Object.freeze(counts),
      summary: Object.freeze({
        policyProfile: profile,
        executionMode: mode,
        distributionString: `${counts.commercialPermitted} commercial / ${counts.researchOnly} research / ${counts.subtitleOnly} subtitle-only (total: ${counts.totalLanguages})`
      })
    });
  }
}

/**
 * Singleton default PolicyEngine instance.
 */
export const defaultPolicyEngine = new PolicyEngine();

/**
 * Convenience functional evaluator.
 * 
 * @param {string|Object} modelOrLanguage 
 * @param {Object} [options] 
 * @returns {Object}
 */
export function evaluatePolicy(modelOrLanguage, options = {}) {
  return defaultPolicyEngine.evaluate(modelOrLanguage, options);
}

export default PolicyEngine;
