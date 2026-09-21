import { normalizeLanguageCode } from '../languages/registry.js';

/**
 * Registry of verified Microsoft Neural TTS Voices.
 * 
 * Maps canonical language codes and speaker genders/roles to verified neural voice identifiers.
 */
export const VERIFIED_NEURAL_VOICES = {
  hi: {
    locale: 'hi-IN',
    displayName: 'Hindi',
    voices: [
      {
        voiceId: 'hi-IN-SwaraNeural',
        name: 'Swara (Female)',
        gender: 'female',
        locale: 'hi-IN'
      },
      {
        voiceId: 'hi-IN-MadhurNeural',
        name: 'Madhur (Male)',
        gender: 'male',
        locale: 'hi-IN'
      }
    ],
    defaultFemale: 'hi-IN-SwaraNeural',
    defaultMale: 'hi-IN-MadhurNeural'
  },
  te: {
    locale: 'te-IN',
    displayName: 'Telugu',
    voices: [
      {
        voiceId: 'te-IN-ShrutiNeural',
        name: 'Shruti (Female)',
        gender: 'female',
        locale: 'te-IN'
      },
      {
        voiceId: 'te-IN-MohanNeural',
        name: 'Mohan (Male)',
        gender: 'male',
        locale: 'te-IN'
      }
    ],
    defaultFemale: 'te-IN-ShrutiNeural',
    defaultMale: 'te-IN-MohanNeural'
  },
  en: {
    locale: 'en-US',
    displayName: 'English (US)',
    voices: [
      {
        voiceId: 'en-US-JennyNeural',
        name: 'Jenny (Female)',
        gender: 'female',
        locale: 'en-US'
      },
      {
        voiceId: 'en-US-GuyNeural',
        name: 'Guy (Male)',
        gender: 'male',
        locale: 'en-US'
      },
      {
        voiceId: 'en-US-AriaNeural',
        name: 'Aria (Female)',
        gender: 'female',
        locale: 'en-US'
      },
      {
        voiceId: 'en-US-ChristopherNeural',
        name: 'Christopher (Male)',
        gender: 'male',
        locale: 'en-US'
      }
    ],
    defaultFemale: 'en-US-JennyNeural',
    defaultMale: 'en-US-GuyNeural'
  },
  ta: {
    locale: 'ta-IN',
    displayName: 'Tamil',
    voices: [
      { voiceId: 'ta-IN-PallaviNeural', name: 'Pallavi (Female)', gender: 'female', locale: 'ta-IN' },
      { voiceId: 'ta-IN-ValluvarNeural', name: 'Valluvar (Male)', gender: 'male', locale: 'ta-IN' }
    ],
    defaultFemale: 'ta-IN-PallaviNeural',
    defaultMale: 'ta-IN-ValluvarNeural'
  },
  bn: {
    locale: 'bn-IN',
    displayName: 'Bengali',
    voices: [
      { voiceId: 'bn-IN-TanishaaNeural', name: 'Tanishaa (Female)', gender: 'female', locale: 'bn-IN' },
      { voiceId: 'bn-IN-BashkarNeural', name: 'Bashkar (Male)', gender: 'male', locale: 'bn-IN' }
    ],
    defaultFemale: 'bn-IN-TanishaaNeural',
    defaultMale: 'bn-IN-BashkarNeural'
  },
  mr: {
    locale: 'mr-IN',
    displayName: 'Marathi',
    voices: [
      { voiceId: 'mr-IN-AarohiNeural', name: 'Aarohi (Female)', gender: 'female', locale: 'mr-IN' },
      { voiceId: 'mr-IN-ManoharNeural', name: 'Manohar (Male)', gender: 'male', locale: 'mr-IN' }
    ],
    defaultFemale: 'mr-IN-AarohiNeural',
    defaultMale: 'mr-IN-ManoharNeural'
  },
  gu: {
    locale: 'gu-IN',
    displayName: 'Gujarati',
    voices: [
      { voiceId: 'gu-IN-DhwaniNeural', name: 'Dhwani (Female)', gender: 'female', locale: 'gu-IN' },
      { voiceId: 'gu-IN-NiranjanNeural', name: 'Niranjan (Male)', gender: 'male', locale: 'gu-IN' }
    ],
    defaultFemale: 'gu-IN-DhwaniNeural',
    defaultMale: 'gu-IN-NiranjanNeural'
  },
  kn: {
    locale: 'kn-IN',
    displayName: 'Kannada',
    voices: [
      { voiceId: 'kn-IN-SapnaNeural', name: 'Sapna (Female)', gender: 'female', locale: 'kn-IN' },
      { voiceId: 'kn-IN-GaganNeural', name: 'Gagan (Male)', gender: 'male', locale: 'kn-IN' }
    ],
    defaultFemale: 'kn-IN-SapnaNeural',
    defaultMale: 'kn-IN-GaganNeural'
  },
  ml: {
    locale: 'ml-IN',
    displayName: 'Malayalam',
    voices: [
      { voiceId: 'ml-IN-SobhanaNeural', name: 'Sobhana (Female)', gender: 'female', locale: 'ml-IN' },
      { voiceId: 'ml-IN-MidhunNeural', name: 'Midhun (Male)', gender: 'male', locale: 'ml-IN' }
    ],
    defaultFemale: 'ml-IN-SobhanaNeural',
    defaultMale: 'ml-IN-MidhunNeural'
  },
  es: {
    locale: 'es-ES',
    displayName: 'Spanish',
    voices: [
      { voiceId: 'es-ES-ElviraNeural', name: 'Elvira (Female)', gender: 'female', locale: 'es-ES' },
      { voiceId: 'es-ES-AlvaroNeural', name: 'Alvaro (Male)', gender: 'male', locale: 'es-ES' }
    ],
    defaultFemale: 'es-ES-ElviraNeural',
    defaultMale: 'es-ES-AlvaroNeural'
  },
  fr: {
    locale: 'fr-FR',
    displayName: 'French',
    voices: [
      { voiceId: 'fr-FR-DeniseNeural', name: 'Denise (Female)', gender: 'female', locale: 'fr-FR' },
      { voiceId: 'fr-FR-HenriNeural', name: 'Henri (Male)', gender: 'male', locale: 'fr-FR' }
    ],
    defaultFemale: 'fr-FR-DeniseNeural',
    defaultMale: 'fr-FR-HenriNeural'
  },
  de: {
    locale: 'de-DE',
    displayName: 'German',
    voices: [
      { voiceId: 'de-DE-KatjaNeural', name: 'Katja (Female)', gender: 'female', locale: 'de-DE' },
      { voiceId: 'de-DE-ConradNeural', name: 'Conrad (Male)', gender: 'male', locale: 'de-DE' }
    ],
    defaultFemale: 'de-DE-KatjaNeural',
    defaultMale: 'de-DE-ConradNeural'
  },
  ja: {
    locale: 'ja-JP',
    displayName: 'Japanese',
    voices: [
      { voiceId: 'ja-JP-NanamiNeural', name: 'Nanami (Female)', gender: 'female', locale: 'ja-JP' },
      { voiceId: 'ja-JP-KeitaNeural', name: 'Keita (Male)', gender: 'male', locale: 'ja-JP' }
    ],
    defaultFemale: 'ja-JP-NanamiNeural',
    defaultMale: 'ja-JP-KeitaNeural'
  }
};

/**
 * Checks if neural TTS has real registered voice support for a given language code.
 * 
 * @param {string} language 
 * @returns {boolean}
 */
export function isNeuralLanguageSupported(language) {
  const norm = normalizeLanguageCode(language);
  if (!norm) return false;
  return Boolean(VERIFIED_NEURAL_VOICES[norm]);
}

/**
 * Checks if a specific voice identifier is supported by the neural registry.
 * 
 * @param {string} voiceId 
 * @returns {boolean}
 */
export function isNeuralVoiceSupported(voiceId) {
  if (!voiceId || typeof voiceId !== 'string') return false;
  const lower = voiceId.toLowerCase();
  for (const entry of Object.values(VERIFIED_NEURAL_VOICES)) {
    for (const v of entry.voices) {
      if (v.voiceId.toLowerCase() === lower || v.name.toLowerCase() === lower) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Resolves a concrete neural voice for a given language, gender, or explicit voice preference.
 * 
 * @param {string} language - Canonical or raw language code
 * @param {Object} [options]
 * @param {string} [options.gender] - 'female' | 'male'
 * @param {string} [options.voiceId] - Explicit voice identifier or abstract ID
 * @returns {{ voiceId: string, locale: string, gender: string, name: string } | null}
 */
export function resolveNeuralVoice(language, options = {}) {
  const norm = normalizeLanguageCode(language);
  if (!norm || !VERIFIED_NEURAL_VOICES[norm]) {
    return null;
  }

  const langEntry = VERIFIED_NEURAL_VOICES[norm];
  const reqVoiceId = (options.voiceId || '').trim();
  const reqGender = (options.gender || '').toLowerCase().trim();

  // 1. Direct match by voiceId
  if (reqVoiceId) {
    const exactVoice = langEntry.voices.find(v => v.voiceId.toLowerCase() === reqVoiceId.toLowerCase());
    if (exactVoice) return exactVoice;

    // Substring match (e.g. 'swara' -> 'hi-IN-SwaraNeural', 'madhur' -> 'hi-IN-MadhurNeural')
    const partialVoice = langEntry.voices.find(v => v.voiceId.toLowerCase().includes(reqVoiceId.toLowerCase()) || v.name.toLowerCase().includes(reqVoiceId.toLowerCase()));
    if (partialVoice) return partialVoice;

    // Check if voiceId encodes gender or index (e.g. 'hi_voice_1' -> female, 'hi_voice_2' -> male)
    if (reqVoiceId.endsWith('_voice_1') || reqVoiceId.endsWith('_voice_3') || reqVoiceId.endsWith('_voice_5') || reqVoiceId.endsWith('_voice_7')) {
      return langEntry.voices.find(v => v.voiceId === langEntry.defaultFemale) || langEntry.voices[0];
    }
    if (reqVoiceId.endsWith('_voice_2') || reqVoiceId.endsWith('_voice_4') || reqVoiceId.endsWith('_voice_6') || reqVoiceId.endsWith('_voice_8')) {
      return langEntry.voices.find(v => v.voiceId === langEntry.defaultMale) || langEntry.voices[1] || langEntry.voices[0];
    }
  }

  // 2. Match by gender
  if (reqGender === 'female' && langEntry.defaultFemale) {
    const fVoice = langEntry.voices.find(v => v.voiceId === langEntry.defaultFemale);
    if (fVoice) return fVoice;
  }

  if (reqGender === 'male' && langEntry.defaultMale) {
    const mVoice = langEntry.voices.find(v => v.voiceId === langEntry.defaultMale);
    if (mVoice) return mVoice;
  }

  // 3. Default to first registered voice for language
  return langEntry.voices[0] || null;
}
