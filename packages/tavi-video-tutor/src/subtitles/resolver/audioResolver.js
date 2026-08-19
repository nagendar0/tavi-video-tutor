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

const warnedMissingAudio = new Set();

/**
 * Resets the DX warning deduplication cache (primarily for tests).
 */
export function clearWarnedAudioCache() {
  warnedMissingAudio.clear();
}

/**
 * Emits a deduplicated DX development console warning when requested audio languages are missing.
 */
export function emitAudioDXWarning(missingList, availableList = [], requestedListOrKey = null, videoKeyParam = 'default') {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return;
  }
  if (!missingList || missingList.length === 0) return;

  let requestedList = [];
  let videoKey = 'default';

  if (Array.isArray(requestedListOrKey)) {
    requestedList = requestedListOrKey;
    videoKey = videoKeyParam || 'default';
  } else if (typeof requestedListOrKey === 'string') {
    videoKey = requestedListOrKey;
    requestedList = [...missingList];
  } else {
    requestedList = [...missingList];
  }

  if (!requestedList || requestedList.length === 0) {
    requestedList = [...missingList];
  }

  const reqKey = [...requestedList].sort().join(',');
  const availKey = [...availableList].sort().join(',');
  const missKey = [...missingList].sort().join(',');
  const warnKey = `audio:${videoKey}:${reqKey}:${availKey}:${missKey}`;

  if (warnedMissingAudio.has(warnKey)) return;
  warnedMissingAudio.add(warnKey);

  const requestedStr = requestedList.join(', ');
  const availableStr = availableList && availableList.length > 0 ? availableList.join(', ') : 'none';
  const missingStr = missingList.join(', ');

  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      `\n[AITutor DX Warning]\n` +
      `Requested audio languages: ${requestedStr}\n` +
      `Available audio languages: ${availableStr}\n` +
      `Missing: ${missingStr}\n\n` +
      `Generate audio tracks using:\n` +
      `npx aitutor generate --audio-languages all\n`
    );
  }
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
  selectedLanguage = undefined,
  videoKey = 'default'
} = {}) {
  // Mode: false -> completely disabled mode
  if (audioLanguagesConfig === false) {
    return {
      enabled: false,
      hasAvailableItems: false,
      hasAvailableAudio: false,
      requestedItems: false,
      requestedLanguages: false,
      availableItems: EMPTY_ARRAY,
      availableLanguages: EMPTY_ARRAY,
      visibleItems: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedItems: EMPTY_OBJECT,
      resolvedTracks: EMPTY_OBJECT,
      sourceByItem: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      sourceLanguage: sourceLanguage || 'en',
      originalTrack: null,
      translatedTracks: EMPTY_OBJECT,
      selectedLanguage: 'original',
      missingItems: EMPTY_ARRAY,
      missingLanguages: EMPTY_ARRAY,
      reason: 'Audio language selector disabled by developer config (audioLanguages={false}).'
    };
  }

  let mode = 'all';
  let devAudio = {};
  let visibilityFilter = null;
  let requestedItems = 'all';

  if (audioLanguagesConfig === undefined || audioLanguagesConfig === 'all') {
    mode = 'all';
    requestedItems = 'all';
  } else if (Array.isArray(audioLanguagesConfig)) {
    mode = 'filter';
    visibilityFilter = audioLanguagesConfig;
    requestedItems = audioLanguagesConfig;
  } else if (typeof audioLanguagesConfig === 'object' && audioLanguagesConfig !== null) {
    mode = 'all';
    devAudio = audioLanguagesConfig;
    requestedItems = Object.keys(audioLanguagesConfig);
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
    const missing = Array.isArray(visibilityFilter) ? visibilityFilter : EMPTY_ARRAY;
    if (missing.length > 0) {
      emitAudioDXWarning(missing, availableLanguages, visibilityFilter || missing, videoKey);
    }
    return {
      enabled: false,
      hasAvailableItems: false,
      hasAvailableAudio: false,
      requestedItems,
      requestedLanguages: requestedItems,
      availableItems: EMPTY_ARRAY,
      availableLanguages: EMPTY_ARRAY,
      visibleItems: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedItems: EMPTY_OBJECT,
      resolvedTracks: EMPTY_OBJECT,
      sourceByItem: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      sourceLanguage: finalSourceLang,
      originalTrack: null,
      translatedTracks: EMPTY_OBJECT,
      selectedLanguage: 'original',
      missingItems: missing,
      missingLanguages: missing,
      reason: 'No audio tracks found in manifest or developer configuration.'
    };
  }

  let visibleLanguages = [];
  let missingLanguages = [];

  if (mode === 'all') {
    visibleLanguages = [...availableLanguages];
  } else if (mode === 'filter') {
    const requestedLangs = (visibilityFilter || []).map(s => String(s).trim().toLowerCase()).filter(Boolean);
    const availableSet = new Set(availableLanguages);

    missingLanguages = requestedLangs.filter(l => !availableSet.has(l));
    const matchingRequested = requestedLangs.filter(l => availableSet.has(l));

    if (missingLanguages.length > 0) {
      emitAudioDXWarning(missingLanguages, availableLanguages, requestedLangs, videoKey);
    }

    if (matchingRequested.length === 0) {
      // No selectable requested tracks exist
      visibleLanguages = [];
    } else {
      const visibleSet = new Set(matchingRequested);
      // The original/source language remains visible and selectable in the UI when filtering
      if (finalSourceLang && availableSet.has(finalSourceLang)) {
        visibleSet.add(finalSourceLang);
      }
      visibleLanguages = availableLanguages.filter(lang => visibleSet.has(lang));
    }
  }

  if (visibleLanguages.length === 0) {
    return {
      enabled: false,
      hasAvailableItems: hasAvailableAudio,
      hasAvailableAudio,
      requestedItems,
      requestedLanguages: requestedItems,
      sourceLanguage: finalSourceLang,
      originalTrack: (rawResolved[finalSourceLang]) ? { ...rawResolved[finalSourceLang], source: true } : null,
      translatedTracks: EMPTY_OBJECT,
      availableItems: availableLanguages,
      availableLanguages,
      visibleItems: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedItems: EMPTY_OBJECT,
      resolvedTracks: EMPTY_OBJECT,
      sourceByItem: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      selectedLanguage: 'original',
      missingItems: missingLanguages,
      missingLanguages,
      reason: missingLanguages.length > 0
        ? `Requested audio languages "${missingLanguages.join(', ')}" are not available.`
        : 'No visible audio tracks matched the audioLanguages filter.'
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
    hasAvailableItems: true,
    hasAvailableAudio: true,
    requestedItems,
    requestedLanguages: requestedItems,
    sourceLanguage: finalSourceLang,
    originalTrack,
    translatedTracks,
    availableItems: availableLanguages,
    availableLanguages,
    visibleItems: visibleLanguages,
    visibleLanguages,
    resolvedItems: resolvedTracks,
    resolvedTracks,
    sourceByItem: sourceByLanguage,
    sourceByLanguage,
    selectedLanguage: activeSelected,
    missingItems: missingLanguages.length > 0 ? missingLanguages : EMPTY_ARRAY,
    missingLanguages: missingLanguages.length > 0 ? missingLanguages : EMPTY_ARRAY,
    reason: 'Active audio tracks available.'
  };
}

export default resolveAudioAvailability;
