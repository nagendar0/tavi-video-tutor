/**
 * Abstract Base Class for Text-to-Speech (TTS) Providers
 * 
 * Preprocessing / CLI-side TTS synthesis interface.
 * All custom TTS engines (Node system TTS, ElevenLabs, OpenAI, WebSpeech, etc.)
 * must implement this contract.
 */
export class TTSProvider {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Synthesize text into an audio file or buffer for a target language.
   * 
   * @param {string} text - Segment text to synthesize
   * @param {string} language - ISO 639-1 / 639-2 target language code (e.g. 'en', 'hi', 'te')
   * @param {Object} [options] - Optional override parameters (voice, pitch, speed, outputPath)
   * @returns {Promise<{ audioPath: string, duration: number, format: string }>}
   */
  async synthesize(text, language, options = {}) {
    throw new Error('TTSProvider.synthesize() must be implemented by subclass.');
  }

  /**
   * Check whether this provider supports the given language code.
   * @param {string} language 
   * @returns {boolean}
   */
  supportsLanguage(language) {
    return true;
  }
}

export default TTSProvider;
