// @ts-check
import { TTSProvider } from './TTSProvider.js';
import { NodeTTSProvider } from './NodeTTSProvider.js';
import { EdgeTTSProvider } from './EdgeTTSProvider.js';
import { AzureNeuralTTSProvider } from './AzureNeuralTTSProvider.js';
import { PiperTTSAdapter } from './PiperTTSAdapter.js';
import { KokoroTTSAdapter } from './KokoroTTSAdapter.js';
import { MmsTTSAdapter } from './MmsTTSAdapter.js';
import { ModelRegistry } from '../models/modelRegistry.js';
import { PolicyEngine } from '../policy/PolicyEngine.js';
import { normalizeLanguageCode } from '../languages/registry.js';

import { TaviProviderError } from '../errors/index.js';

/**
 * Standard factory error for provider resolution and validation failures.
 */
export class FactoryError extends TaviProviderError {
  /**
   * @param {string} code 
   * @param {string} message 
   * @param {Record<string, any>} [details]
   */
  constructor(code, message, details = {}) {
    const d = /** @type {Record<string, any>} */ (details || {});
    super(`[TTSFactory] ${code}: ${message}`, {
      name: 'FactoryError',
      code,
      provider: d.provider || null,
      details: d,
      cause: d.cause || null
    });
    this.name = 'FactoryError';
    this.code = code;
    this.provider = d.provider || null;
    this.fallbackAttempted = d.fallbackAttempted || false;
    this.details = d;
    if (d.cause && !this.cause) {
      this.cause = d.cause;
    }
  }
}

/**
 * Cloud providers requiring network access (prohibited in offline mode).
 */
export const CLOUD_PROVIDERS = Object.freeze(new Set(['azure-byok', 'edge']));

/**
 * Local providers capable of offline execution.
 */
export const LOCAL_PROVIDERS = Object.freeze(new Set(['piper', 'kokoro', 'mms', 'system']));

/**
 * Normalizes input provider mode string to canonical provider ID.
 * 
 * @param {string} rawMode 
 * @returns {string|null} Canonical provider ID or null if unrecognized
 */
export function normalizeTTSProviderId(rawMode) {
  if (!rawMode || typeof rawMode !== 'string') return null;
  const mode = rawMode.toLowerCase().trim();
  switch (mode) {
    case 'piper':
      return 'piper';
    case 'kokoro':
      return 'kokoro';
    case 'mms':
      return 'mms';
    case 'azure':
    case 'azure-tts':
    case 'azure-neural':
    case 'azure-byok':
      return 'azure-byok';
    case 'edge':
    case 'edge-tts':
    case 'neural':
      return 'edge';
    case 'system':
    case 'node':
    case 'node-tts':
      return 'system';
    case 'auto':
    case 'hybrid':
      return 'auto';
    default:
      return null;
  }
}

/**
 * Returns structured catalog of supported TTS providers, capabilities, and offline compatibility.
 * Performs zero network I/O.
 * 
 * @returns {Object}
 */
export function getTTSProviderCapabilities() {
  return Object.freeze({
    providers: {
      piper: {
        providerId: 'piper',
        engine: 'piper',
        type: 'local',
        networkRequired: false,
        supportsOffline: true,
        license: 'MIT / Open Source',
        requiresCredentials: false
      },
      kokoro: {
        providerId: 'kokoro',
        engine: 'kokoro',
        type: 'local',
        networkRequired: false,
        supportsOffline: true,
        license: 'Apache-2.0',
        requiresCredentials: false
      },
      mms: {
        providerId: 'mms',
        engine: 'mms',
        type: 'local',
        networkRequired: false,
        supportsOffline: true,
        license: 'CC-BY-NC 4.0 (Research Only)',
        requiresCredentials: false
      },
      'azure-byok': {
        providerId: 'azure-byok',
        engine: 'azure',
        type: 'cloud',
        networkRequired: true,
        supportsOffline: false,
        license: 'Commercial BYOK',
        requiresCredentials: true
      },
      edge: {
        providerId: 'edge',
        engine: 'edge',
        type: 'cloud',
        networkRequired: true,
        supportsOffline: false,
        license: 'Microsoft Edge Read Aloud Terms',
        requiresCredentials: false
      },
      system: {
        providerId: 'system',
        engine: 'system',
        type: 'local',
        networkRequired: false,
        supportsOffline: true,
        license: 'OS Native',
        requiresCredentials: false
      },
      auto: {
        providerId: 'auto',
        engine: 'auto',
        type: 'hybrid',
        networkRequired: false,
        supportsOffline: true,
        license: 'Mixed',
        requiresCredentials: false
      }
    }
  });
}

/**
 * Legacy Hybrid Auto TTS Provider.
 * Preserved for backwards compatibility with legacy callers.
 * 
 * Strict Phase 8 requirement: Zero silent catch-and-degrade.
 * If neural synthesis is selected and fails, the error is immediately propagated.
 */
export class AutoTTSProvider extends TTSProvider {
  /**
   * @param {Record<string, any>} [options]
   */
  constructor(options = {}) {
    super(options);
    this.providerId = 'auto';
    this.engine = 'auto';
    this.neural = new EdgeTTSProvider(options);
    this.system = new NodeTTSProvider(options);
  }

  /**
   * @param {string} language
   * @returns {boolean}
   */
  supportsLanguage(language) {
    return this.neural.supportsLanguage(language) || this.system.supportsLanguage(language);
  }

  /**
   * @param {string} text
   * @param {string} language
   * @param {Record<string, any>} [options]
   * @returns {Promise<any>}
   */
  async synthesize(text, language, options = {}) {
    const norm = normalizeLanguageCode(language);
    const opts = /** @type {Record<string, any>} */ (options || {});
    // Explicit selection based on language capability without silent catch-and-degrade
    if (norm && this.neural.supportsLanguage(norm) && opts.offline !== true) {
      // Direct neural synthesis: NO silent catch-and-degrade to system!
      return await this.neural.synthesize(text, norm, opts);
    }
    return await this.system.synthesize(text, language, opts);
  }
}

/**
 * Explicit Fallback Wrapper for TTS Provider.
 * 
 * Complies strictly with Phase 8 Architecture:
 * - Fallback executes ONLY when explicitly enabled in configuration.
 * - Enforces offline rule on fallback provider.
 * - Enforces policy checks on fallback provider.
 * - Generates structured diagnostics tracking primary failure and fallback execution.
 * - Preserves original error on fallback failure.
 */
export class ExplicitFallbackTTSProvider extends TTSProvider {
  /**
   * @param {Object} params
   * @param {any} params.primaryProvider
   * @param {string} params.primaryProviderId
   * @param {Record<string, any>} params.fallbackConfig
   * @param {Record<string, any>} params.factoryOptions
   */
  constructor({ primaryProvider, primaryProviderId, fallbackConfig, factoryOptions }) {
    super(factoryOptions);
    this.primaryProvider = primaryProvider;
    this.primaryProviderId = primaryProviderId;
    this.fallbackConfig = fallbackConfig || {};
    this.factoryOptions = factoryOptions || {};
    this.fallbackProviderId = normalizeTTSProviderId(this.fallbackConfig.provider);

    if (!this.fallbackProviderId) {
      throw new FactoryError(
        'UNKNOWN_TTS_PROVIDER',
        `Unknown fallback TTS provider: '${this.fallbackConfig.provider}'.`,
        { provider: this.fallbackConfig.provider }
      );
    }

    const primary = /** @type {any} */ (primaryProvider);
    this.providerId = primary?.providerId || primaryProviderId;
    this.engine = primary?.engine || primaryProviderId;
    this.fallbackProviderInstance = null;
  }

  /**
   * @param {string} language
   * @returns {boolean}
   */
  supportsLanguage(language) {
    return this.primaryProvider.supportsLanguage(language);
  }

  getFallbackProvider() {
    if (!this.fallbackProviderInstance) {
      const fallbackOpts = {
        ...this.factoryOptions,
        ...(this.fallbackConfig.options || {}),
        provider: this.fallbackProviderId,
        fallback: null // Prevent recursive fallback chains
      };
      this.fallbackProviderInstance = instantiateTTSProvider(this.fallbackProviderId, fallbackOpts);
    }
    return this.fallbackProviderInstance;
  }

  /**
   * @param {string} text
   * @param {string} language
   * @param {Record<string, any>} [options]
   * @returns {Promise<any>}
   */
  async synthesize(text, language, options = {}) {
    const opts = /** @type {Record<string, any>} */ (options || {});
    const fOpts = /** @type {Record<string, any>} */ (this.factoryOptions || {});
    const effectiveOffline = opts.offline === true || fOpts.offline === true;
    const effectiveExecutionMode = opts.executionMode || fOpts.executionMode;
    const effectivePolicyProfile = opts.policyProfile || fOpts.policyProfile;

    try {
      return await this.primaryProvider.synthesize(text, language, opts);
    } catch (primaryErr) {
      const pErr = /** @type {any} */ (primaryErr);
      const fallbackReason = pErr?.code || pErr?.message || 'PRIMARY_SYNTHESIS_FAILED';

      // 1. Offline rule: reject cloud fallback in offline mode
      if (effectiveOffline && CLOUD_PROVIDERS.has(this.fallbackProviderId)) {
        throw new FactoryError(
          'OFFLINE_PROVIDER_FORBIDDEN',
          `Explicit fallback provider '${this.fallbackProviderId}' requires network access and cannot be used in offline mode.`,
          {
            provider: this.fallbackProviderId,
            primaryProvider: this.primaryProviderId,
            fallbackAttempted: false,
            fallbackReason,
            cause: primaryErr
          }
        );
      }

      // 2. Policy check: MMS or restricted fallback under commercial mode must be evaluated
      if (effectiveExecutionMode === 'COMMERCIAL' || effectiveExecutionMode === 'commercial') {
        if (this.fallbackProviderId === 'mms') {
          throw new FactoryError(
            'MODEL_POLICY_RESTRICTED',
            "Explicit fallback to MMS is restricted under commercial policy: provider 'mms' is research-only.",
            {
              provider: 'mms',
              primaryProvider: this.primaryProviderId,
              fallbackAttempted: false,
              policyStatus: 'RESEARCH_ONLY',
              cause: primaryErr
            }
          );
        }
        const policyEngine = fOpts.policyEngine || opts.policyEngine || new PolicyEngine();
        const normLang = normalizeLanguageCode(language) || language;
        const modelDef = ModelRegistry.getCanonicalModel(normLang, this.fallbackProviderId);
        if (modelDef) {
          const evalResult = policyEngine.evaluateModel(modelDef.modelId, {
            executionMode: 'COMMERCIAL',
            policyProfile: effectivePolicyProfile
          });
          if (!evalResult.permitted) {
            throw new FactoryError(
              'MODEL_POLICY_RESTRICTED',
              `Explicit fallback to '${this.fallbackProviderId}' is restricted under commercial policy: ${evalResult.reason || evalResult.policyStatus}`,
              {
                provider: this.fallbackProviderId,
                primaryProvider: this.primaryProviderId,
                fallbackAttempted: false,
                policyStatus: evalResult.policyStatus,
                cause: primaryErr
              }
            );
          }
        }
      }

      // 3. Structured fallback diagnostics
      const diagnostics = {
        primaryProvider: this.primaryProviderId,
        fallbackConfigured: true,
        fallbackProvider: this.fallbackProviderId,
        fallbackAttempted: true,
        fallbackReason
      };

      try {
        const fallbackProvider = this.getFallbackProvider();
        const fallbackRes = await fallbackProvider.synthesize(text, language, opts);
        return {
          ...fallbackRes,
          diagnostics,
          fallbackUsed: true
        };
      } catch (fallbackErr) {
        const fErr = /** @type {any} */ (fallbackErr);
        throw new FactoryError(
          'EXPLICIT_FALLBACK_FAILED',
          `Explicit fallback from '${this.primaryProviderId}' to '${this.fallbackProviderId}' failed: ${fErr?.message}`,
          {
            primaryProvider: this.primaryProviderId,
            fallbackProvider: this.fallbackProviderId,
            fallbackAttempted: true,
            fallbackReason,
            primaryError: primaryErr,
            fallbackError: fallbackErr,
            cause: primaryErr
          }
        );
      }
    }
  }
}

/**
 * Internal instantiation helper for canonical provider IDs.
 * 
 * @param {string} canonicalId 
 * @param {Record<string, any>} [options] 
 * @returns {TTSProvider}
 */
function instantiateTTSProvider(canonicalId, options) {
  const opts = /** @type {Record<string, any>} */ (options || {});
  if (canonicalId === 'mms' && (opts.executionMode === 'COMMERCIAL' || opts.executionMode === 'commercial')) {
    throw new FactoryError(
      'MODEL_POLICY_RESTRICTED',
      "Provider 'mms' is research-only and cannot be used in commercial mode.",
      { provider: 'mms', executionMode: 'COMMERCIAL' }
    );
  }
  switch (canonicalId) {
    case 'piper':
      return new PiperTTSAdapter(opts);
    case 'kokoro':
      return new KokoroTTSAdapter(opts);
    case 'mms':
      return new MmsTTSAdapter(opts);
    case 'azure-byok':
      return new AzureNeuralTTSProvider(opts);
    case 'edge':
      return new EdgeTTSProvider(opts);
    case 'system':
      return new NodeTTSProvider(opts);
    case 'auto':
      return new AutoTTSProvider(opts);
    default:
      throw new FactoryError(
        'UNKNOWN_TTS_PROVIDER',
        `Unknown TTS provider: '${canonicalId}'. Supported providers: piper, kokoro, mms, azure-byok, edge, system, auto.`,
        { provider: canonicalId }
      );
  }
}

/**
 * Resolves the explicitly configured TTS Provider instance.
 * 
 * Performs deterministic provider resolution, offline validation, and returns the provider.
 * Does not configure explicit fallback wrapping.
 * 
 * @param {Record<string, any>|string} [options]
 * @returns {TTSProvider}
 */
export function resolveTTSProvider(options = {}) {
  if (options instanceof TTSProvider) {
    return options;
  }

  const opts = /** @type {Record<string, any>} */ (typeof options === 'string' ? { provider: options } : (options || {}));
  const rawMode = opts.provider || opts.ttsProvider || opts.tts?.provider || 'system';

  const canonicalId = normalizeTTSProviderId(rawMode);
  if (!canonicalId) {
    throw new FactoryError(
      'UNKNOWN_TTS_PROVIDER',
      `Unknown or unsupported TTS provider: '${rawMode}'. Supported providers: piper, kokoro, mms, azure-byok, edge, system, auto.`,
      { provider: rawMode }
    );
  }

  const isOffline = opts.offline === true || (opts.networkPolicy && typeof opts.networkPolicy.isOffline === 'function' && opts.networkPolicy.isOffline());
  if (isOffline && CLOUD_PROVIDERS.has(canonicalId)) {
    throw new FactoryError(
      'OFFLINE_PROVIDER_FORBIDDEN',
      `Provider '${canonicalId}' requires network access and cannot be used in offline mode.`,
      { provider: canonicalId, offline: true }
    );
  }

  return instantiateTTSProvider(canonicalId, opts);
}

/**
 * Primary Factory to create configured TTS Provider based on options.
 * 
 * Supports:
 * - Deterministic explicit provider selection ('piper', 'kokoro', 'mms', 'azure-byok', 'edge', 'system', 'auto').
 * - Offline validation (rejects cloud providers when offline).
 * - Explicit fallback configuration (enabled only when options.fallback.enabled === true).
 * - Preservation of existing TTSProvider instances.
 * 
 * @param {Record<string, any>|string} [options]
 * @returns {TTSProvider}
 */
export function createTTSProvider(options = {}) {
  if (options instanceof TTSProvider) {
    return options;
  }

  const opts = /** @type {Record<string, any>} */ (typeof options === 'string' ? { provider: options } : (options || {}));
  const rawMode = opts.provider || opts.ttsProvider || opts.tts?.provider || 'system';

  const canonicalId = normalizeTTSProviderId(rawMode);
  if (!canonicalId) {
    throw new FactoryError(
      'UNKNOWN_TTS_PROVIDER',
      `Unknown or unsupported TTS provider: '${rawMode}'. Supported providers: piper, kokoro, mms, azure-byok, edge, system, auto.`,
      { provider: rawMode }
    );
  }

  const isOffline = opts.offline === true || (opts.networkPolicy && typeof opts.networkPolicy.isOffline === 'function' && opts.networkPolicy.isOffline());
  if (isOffline && CLOUD_PROVIDERS.has(canonicalId)) {
    throw new FactoryError(
      'OFFLINE_PROVIDER_FORBIDDEN',
      `Provider '${canonicalId}' requires network access and cannot be used in offline mode.`,
      { provider: canonicalId, offline: true }
    );
  }

  const primaryProvider = instantiateTTSProvider(canonicalId, opts);

  // Check explicit fallback configuration
  const fallbackConfig = opts.fallback;
  if (fallbackConfig && fallbackConfig.enabled === true && fallbackConfig.provider) {
    return new ExplicitFallbackTTSProvider({
      primaryProvider,
      primaryProviderId: canonicalId,
      fallbackConfig,
      factoryOptions: opts
    });
  }

  return primaryProvider;
}

export default createTTSProvider;
