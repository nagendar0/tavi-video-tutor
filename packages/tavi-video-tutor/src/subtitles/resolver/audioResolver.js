import { getLanguageByCode } from '../languages/registry.js';

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

/**
 * Audio Track Resolver & Source Prioritizer
 * 
 * Normalizes audio language definitions and resolves tracks by priority:
 * 1. developerAudio (explicit audioDubs or custom track map prop)
 * 2. manifestAudio  (generated/preprocessed audio tracks from manifest.json)
 * 3. demoAudio      (fallback fixtures if provided)
 */
export function resolveAudioSources({
  demoAudio = {},
  manifestAudio = {},
  developerAudio = {}
} = {}) {
  const demo = demoAudio || {};
  const manifest = manifestAudio || {};
  const developer = (developerAudio && typeof developerAudio === 'object' && !Array.isArray(developerAudio))
    ? developerAudio
    : {};

  const isVal = (val) => val !== null && val !== undefined && val !== '';

  const normalizeTrackObj = (lang, val) => {
    if (!isVal(val)) return null;
    const langMeta = getLanguageByCode(lang);
    const defaultLabel = langMeta
      ? (langMeta.nativeName ? `${langMeta.nativeName} / ${langMeta.name}` : langMeta.name)
      : lang;

    if (typeof val === 'string') {
      return {
        label: defaultLabel,
        src: val,
        language: lang
      };
    }
    if (typeof val === 'object' && val.src) {
      return {
        label: val.label || defaultLabel,
        src: val.src,
        language: val.language || lang,
        source: Boolean(val.source)
      };
    }
    return null;
  };

  const allLangs = new Set([
    ...Object.keys(demo),
    ...Object.keys(manifest),
    ...Object.keys(developer)
  ]);

  if (allLangs.size === 0) {
    return {
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT
    };
  }

  const resolvedTracks = {};
  const sourceByLanguage = {};

  for (const lang of allLangs) {
    if (isVal(developer[lang])) {
      resolvedTracks[lang] = normalizeTrackObj(lang, developer[lang]);
      sourceByLanguage[lang] = 'developer';
    } else if (isVal(manifest[lang])) {
      resolvedTracks[lang] = normalizeTrackObj(lang, manifest[lang]);
      sourceByLanguage[lang] = 'generated';
    } else if (isVal(demo[lang])) {
      resolvedTracks[lang] = normalizeTrackObj(lang, demo[lang]);
      sourceByLanguage[lang] = 'demo';
    }
  }

  return {
    resolvedTracks,
    sourceByLanguage
  };
}

/**
 * SINGLE SOURCE OF TRUTH: Audio Availability & Visibility Resolver
 * 
 * Inspects all audio sources and configuration options (`audioLanguages={false}`, `["en", "hi"]`, etc.).
 * Automatically discovers and respects the video's source/original language.
 * Returns a unified availability contract.
 */
export function resolveAudioAvailability({
  audioLanguagesConfig,
  manifestAudio = {},
  developerAudio = {},
  demoAudio = {},
  sourceLanguage = null,
  selectedLanguage = undefined
} = {}) {
  // Mode: false -> completely disabled mode
  if (audioLanguagesConfig === false) {
    return {
      enabled: false,
      hasAvailableAudio: false,
      sourceLanguage: sourceLanguage || 'en',
      originalTrack: null,
      translatedTracks: EMPTY_OBJECT,
      availableLanguages: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      selectedLanguage: 'original',
      reason: 'Audio language selector disabled by developer config (audioLanguages={false}).'
    };
  }

  let mode = 'all';
  let devAudio = {};
  let visibilityFilter = null;

  if (audioLanguagesConfig === undefined || audioLanguagesConfig === 'all') {
    mode = 'all';
  } else if (Array.isArray(audioLanguagesConfig)) {
    mode = 'filter';
    visibilityFilter = audioLanguagesConfig;
  } else if (typeof audioLanguagesConfig === 'object' && audioLanguagesConfig !== null) {
    mode = 'all';
    devAudio = audioLanguagesConfig;
  }

  const { resolvedTracks: rawResolved, sourceByLanguage: rawSourceByLang } = resolveAudioSources({
    demoAudio,
    manifestAudio,
    developerAudio: Object.keys(devAudio).length > 0 ? devAudio : developerAudio
  });

  const availableLanguages = Object.keys(rawResolved).filter(lang => Boolean(rawResolved[lang]));
  const hasAvailableAudio = availableLanguages.length > 0;

  // Detect source language from passed prop or from track metadata (source: true)
  let detectedSourceLang = sourceLanguage || null;
  if (!detectedSourceLang) {
    for (const [lang, track] of Object.entries(rawResolved)) {
      if (track && track.source) {
        detectedSourceLang = lang;
        break;
      }
    }
  }

  const finalSourceLang = detectedSourceLang || sourceLanguage || 'en';

  if (!hasAvailableAudio) {
    return {
      enabled: false,
      hasAvailableAudio: false,
      sourceLanguage: finalSourceLang,
      originalTrack: null,
      translatedTracks: EMPTY_OBJECT,
      availableLanguages: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      selectedLanguage: 'original',
      reason: 'No audio tracks found in manifest or developer configuration.'
    };
  }

  let visibleLanguages = [];
  if (mode === 'all') {
    visibleLanguages = [...availableLanguages];
  } else if (mode === 'filter') {
    const allowedSet = new Set(visibilityFilter);
    // The original/source language remains visible and selectable in the UI when filtering
    if (finalSourceLang && availableLanguages.includes(finalSourceLang)) {
      allowedSet.add(finalSourceLang);
    }
    visibleLanguages = availableLanguages.filter(lang => allowedSet.has(lang));
  }

  if (visibleLanguages.length === 0) {
    return {
      enabled: false,
      hasAvailableAudio,
      sourceLanguage: finalSourceLang,
      originalTrack: null,
      translatedTracks: EMPTY_OBJECT,
      availableLanguages,
      visibleLanguages: EMPTY_ARRAY,
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      selectedLanguage: 'original',
      reason: 'No visible audio tracks matched the audioLanguages filter.'
    };
  }

  const resolvedTracks = {};
  const sourceByLanguage = {};
  const translatedTracks = {};

  for (const lang of visibleLanguages) {
    resolvedTracks[lang] = rawResolved[lang];
    sourceByLanguage[lang] = rawSourceByLang[lang];
    if (lang !== finalSourceLang && (!rawResolved[lang] || !rawResolved[lang].source)) {
      translatedTracks[lang] = rawResolved[lang];
    }
  }

  const originalTrack = (rawResolved[finalSourceLang])
    ? {
        ...rawResolved[finalSourceLang],
        source: true
      }
    : null;

  // Determine active selected language:
  // 1. Explicitly requested / user-saved selectedLanguage (if available in resolvedTracks or 'original')
  // 2. Detected sourceLanguage (if available in resolvedTracks)
  // 3. 'original'
  let activeSelected = 'original';
  if (selectedLanguage !== undefined && selectedLanguage !== null) {
    if (selectedLanguage === 'original' || resolvedTracks[selectedLanguage]) {
      activeSelected = selectedLanguage;
    }
  } else if (finalSourceLang && (resolvedTracks[finalSourceLang] || finalSourceLang === 'original')) {
    activeSelected = finalSourceLang;
  } else if (visibleLanguages.length > 0) {
    activeSelected = visibleLanguages[0];
  }

  return {
    enabled: true,
    hasAvailableAudio: true,
    sourceLanguage: finalSourceLang,
    originalTrack,
    translatedTracks,
    availableLanguages,
    visibleLanguages,
    resolvedTracks,
    sourceByLanguage,
    selectedLanguage: activeSelected,
    reason: 'Active audio tracks available.'
  };
}

export default resolveAudioAvailability;


