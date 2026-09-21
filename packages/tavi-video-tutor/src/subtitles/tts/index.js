export { TTSProvider } from './TTSProvider.js';
export { NodeTTSProvider } from './NodeTTSProvider.js';
export { EdgeTTSProvider, TTSError, escapeXml, generateSecMsGec } from './EdgeTTSProvider.js';
export { AzureNeuralTTSProvider } from './AzureNeuralTTSProvider.js';
export { createTTSProvider, AutoTTSProvider } from './ttsFactory.js';
export {
  VERIFIED_NEURAL_VOICES,
  isNeuralLanguageSupported,
  isNeuralVoiceSupported,
  resolveNeuralVoice
} from './neuralVoiceRegistry.js';
