import { normalizeLanguageCode, resolveLanguageCapability } from '../../languages/registry.js';

/**
 * Voice Pool Management.
 * 
 * Provides an expandable pool of distinct voices for any target language.
 * When base TTS voices are limited, supports acoustic variations (pitch, rate)
 * to expand the effective voice distinctiveness.
 */
export class VoicePool {
  constructor(options = {}) {
    this.customVoiceMap = options.voices || {};
  }

  /**
   * Get available voice pool for a given target language.
   * Dynamically constructs or expands the voice list.
   * 
   * @param {string} targetLanguage 
   * @param {number} [minRequiredVoices=8]
   * @returns {Array<{ voiceId: string, name: string, gender: string, pitchOffset: number, rateOffset: number }>}
   */
  getVoicesForLanguage(targetLanguage, minRequiredVoices = 16) {
    const lang = normalizeLanguageCode(targetLanguage) || String(targetLanguage || 'en').toLowerCase().trim();
    const cap = resolveLanguageCapability(lang);

    // 1. Check if user configured explicit voices
    if (this.customVoiceMap[lang] && Array.isArray(this.customVoiceMap[lang])) {
      return this.customVoiceMap[lang];
    }

    // Known physical voices for common languages
    const KNOWN_NAMES = {
      hi: ['Kalpana (Female)', 'Hemant (Male)', 'Swara (Female)', 'Madhur (Male)'],
      en: ['Zira (Female)', 'David (Male)', 'Heera (Female)', 'Ravi (Male)'],
      te: ['Chitra (Female)', 'Mohan (Male)'],
      ta: ['Ananya (Female)', 'Valluvar (Male)']
    };

    const knownNames = KNOWN_NAMES[lang] || [];

    // 2. Standard base voice templates with canonical voice IDs
    const baseVoices = [
      { voiceId: `${lang}_voice_1`, name: knownNames[0] ? `${lang.toUpperCase()} ${knownNames[0]}` : `${lang.toUpperCase()} Neutral Alpha`, gender: 'female', pitchOffset: 0, rateOffset: 1.0 },
      { voiceId: `${lang}_voice_2`, name: knownNames[1] ? `${lang.toUpperCase()} ${knownNames[1]}` : `${lang.toUpperCase()} Neutral Beta`, gender: 'male', pitchOffset: 0, rateOffset: 1.0 },
      { voiceId: `${lang}_voice_3`, name: knownNames[2] ? `${lang.toUpperCase()} ${knownNames[2]}` : `${lang.toUpperCase()} Warm Gamma`, gender: 'female', pitchOffset: 10, rateOffset: 0.98 },
      { voiceId: `${lang}_voice_4`, name: knownNames[3] ? `${lang.toUpperCase()} ${knownNames[3]}` : `${lang.toUpperCase()} Deep Delta`, gender: 'male', pitchOffset: -12, rateOffset: 0.96 },
      { voiceId: `${lang}_voice_5`, name: `${lang.toUpperCase()} Bright Epsilon`, gender: 'female', pitchOffset: 18, rateOffset: 1.02 },
      { voiceId: `${lang}_voice_6`, name: `${lang.toUpperCase()} Resonant Zeta`, gender: 'male', pitchOffset: -8, rateOffset: 1.0 },
      { voiceId: `${lang}_voice_7`, name: `${lang.toUpperCase()} Crisp Eta`, gender: 'female', pitchOffset: 5, rateOffset: 1.04 },
      { voiceId: `${lang}_voice_8`, name: `${lang.toUpperCase()} Authoritative Theta`, gender: 'male', pitchOffset: -18, rateOffset: 0.94 }
    ];

    if (minRequiredVoices <= baseVoices.length) {
      return baseVoices.slice(0, Math.max(1, minRequiredVoices));
    }

    // 3. Dynamically expand pool using deterministic acoustic pitch/rate variations
    const expanded = [...baseVoices];
    let counter = baseVoices.length + 1;
    const pitchShifts = [-25, -20, -15, -10, -5, 8, 14, 20, 26, 32];
    const rateShifts = [0.92, 0.95, 0.98, 1.02, 1.05, 1.08];

    while (expanded.length < minRequiredVoices) {
      const baseIdx = (counter - 1) % baseVoices.length;
      const base = baseVoices[baseIdx];
      const pitchShift = pitchShifts[counter % pitchShifts.length];
      const rateShift = rateShifts[counter % rateShifts.length];

      expanded.push({
        voiceId: `${lang}_voice_${counter}`,
        name: `${base.name} (Mod ${counter})`,
        gender: base.gender,
        pitchOffset: base.pitchOffset + pitchShift,
        rateOffset: Number((base.rateOffset * rateShift).toFixed(2))
      });
      counter++;
    }

    return expanded;
  }
}

export default VoicePool;
