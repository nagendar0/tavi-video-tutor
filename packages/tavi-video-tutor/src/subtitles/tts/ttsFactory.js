import { TTSProvider } from './TTSProvider.js';
import { NodeTTSProvider } from './NodeTTSProvider.js';
import { EdgeTTSProvider } from './EdgeTTSProvider.js';
import { AzureNeuralTTSProvider } from './AzureNeuralTTSProvider.js';
import { normalizeLanguageCode } from '../languages/registry.js';
import { isNeuralLanguageSupported } from './neuralVoiceRegistry.js';

/**
 * Hybrid Auto TTS Provider.
 * Dynamically selects neural synthesis for supported neural languages,
 * and falls back to system NodeTTSProvider for other languages or when offline.
 */
export class AutoTTSProvider extends TTSProvider {
  constructor(options = {}) {
    super(options);
    this.neural = new EdgeTTSProvider(options);
    this.system = new NodeTTSProvider(options);
  }

  supportsLanguage(language) {
    return this.neural.supportsLanguage(language) || this.system.supportsLanguage(language);
  }

  async synthesize(text, language, options = {}) {
    const norm = normalizeLanguageCode(language);
    // Prefer high-fidelity neural speech whenever available
    if (this.neural.supportsLanguage(norm) && options.offline !== true) {
      try {
        return await this.neural.synthesize(text, norm, options);
      } catch (neuralErr) {
        // If neural fails due to network, fallback to system if permitted
        if (options.strictNeural === true) {
          throw neuralErr;
        }
      }
    }
    return this.system.synthesize(text, language, options);
  }
}

/**
 * Factory to create configured TTS Provider based on mode.
 * 
 * @param {Object} [options]
 * @param {string} [options.provider='system'] - 'system' | 'neural' | 'edge' | 'azure' | 'auto'
 * @param {string} [options.ttsProvider] - Alternative alias for options.provider
 * @returns {TTSProvider}
 */
export function createTTSProvider(options = {}) {
  // If options is already a TTSProvider instance, return it directly
  if (options instanceof TTSProvider) {
    return options;
  }

  const rawMode = options.provider || options.ttsProvider || options.tts?.provider || 'system';
  const mode = String(rawMode).toLowerCase().trim();

  switch (mode) {
    case 'neural':
    case 'edge':
    case 'edge-tts':
      return new EdgeTTSProvider(options);

    case 'azure':
    case 'azure-tts':
    case 'azure-neural':
      return new AzureNeuralTTSProvider(options);

    case 'auto':
    case 'hybrid':
      return new AutoTTSProvider(options);

    case 'system':
    case 'node':
    case 'node-tts':
    default:
      return new NodeTTSProvider(options);
  }
}

export default createTTSProvider;
