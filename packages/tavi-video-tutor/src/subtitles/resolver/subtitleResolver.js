import { AITUTOR_LANGUAGES, getLanguageByCode } from '../languages/registry.js';

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

/**
 * Central Subtitle Source Resolver
 * 
 * Priority Chain (Highest to Lowest):
 * 1. uploadedSubtitles  (user/student runtime uploaded subtitles)
 * 2. developerSubtitles (developer-provided manual subtitles via prop)
 * 3. generatedSubtitles (automatically generated AITutor subtitles from /aitutor/manifest.json)
 * 4. demoSubtitles      (example / fixture fallbacks - ONLY if explicitly passed)
 * 
 * Resolution occurs PER LANGUAGE.
 */
export function resolveSubtitleSources({
  demoSubtitles = {},
  generatedSubtitles = {},
  developerSubtitles = {},
  uploadedSubtitles = {}
} = {}) {
  const demo = demoSubtitles || {};
  const generated = generatedSubtitles || {};
  const developer = (developerSubtitles && typeof developerSubtitles === 'object' && !Array.isArray(developerSubtitles))
    ? developerSubtitles
    : {};
  const uploaded = uploadedSubtitles || {};

  const isVal = (val) => val !== null && val !== undefined && val !== '';

  const getSourceSrc = (val) => {
    if (!isVal(val)) return null;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.src) return val.src;
    return val;
  };

  const allLanguages = new Set([
    ...Object.keys(demo),
    ...Object.keys(generated),
    ...Object.keys(developer),
    ...Object.keys(uploaded)
  ]);

  if (allLanguages.size === 0) {
    return {
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT
    };
  }

  const resolvedTracks = {};
  const sourceByLanguage = {};

  for (const lang of allLanguages) {
    if (isVal(uploaded[lang])) {
      resolvedTracks[lang] = getSourceSrc(uploaded[lang]);
      sourceByLanguage[lang] = 'uploaded';
    } else if (isVal(developer[lang])) {
      resolvedTracks[lang] = getSourceSrc(developer[lang]);
      sourceByLanguage[lang] = 'developer';
    } else if (isVal(generated[lang])) {
      resolvedTracks[lang] = getSourceSrc(generated[lang]);
      sourceByLanguage[lang] = 'generated';
    } else if (isVal(demo[lang])) {
      resolvedTracks[lang] = getSourceSrc(demo[lang]);
      sourceByLanguage[lang] = 'demo';
    }
  }

  const keys = Object.keys(resolvedTracks);
  if (keys.length === 0) {
    return {
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT
    };
  }

  return {
    resolvedTracks,
    sourceByLanguage
  };
}

const warnedMissingSubtitles = new Set();

/**
 * Resets the DX warning deduplication cache for subtitles.
 */
export function clearWarnedSubtitleCache() {
  warnedMissingSubtitles.clear();
}

/**
 * Emits a deduplicated DX development console warning when requested subtitle languages are missing.
 */
export function emitSubtitleDXWarning(missingList, availableList = [], requestedListOrKey = null, videoKeyParam = 'default') {
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
  const warnKey = `subtitles:${videoKey}:${reqKey}:${availKey}:${missKey}`;

  if (warnedMissingSubtitles.has(warnKey)) return;
  warnedMissingSubtitles.add(warnKey);

  const requestedStr = requestedList.join(', ');
  const availableStr = availableList && availableList.length > 0 ? availableList.join(', ') : 'none';
  const missingStr = missingList.join(', ');

  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      `\n[AITutor DX Warning]\n` +
      `Requested subtitle languages: ${requestedStr}\n` +
      `Available subtitle languages: ${availableStr}\n` +
      `Missing: ${missingStr}\n\n` +
      `Generate subtitle tracks using:\n` +
      `npx aitutor generate\n`
    );
  }
}

/**
 * SINGLE SOURCE OF TRUTH: Subtitle Availability & Visibility Resolver
 * 
 * Inspects all potential subtitle sources (uploaded, developer, generated manifest, demo, embedded)
 * and developer configuration options (disabled boolean, array filter, custom track map).
 * 
 * Returns a unified availability object consumed by all player UI controls, renderer, and network fetchers.
 */
export function resolveSubtitleAvailability({
  subtitlesConfig,
  generatedSubtitles = {},
  developerSubtitles = {},
  uploadedSubtitles = {},
  demoSubtitles = {},
  embeddedTracks = [],
  videoKey = 'default'
} = {}) {
  // If subtitlesConfig is explicitly false, all subtitle features are completely disabled.
  if (subtitlesConfig === false) {
    return {
      enabled: false,
      hasAvailableItems: false,
      hasAvailableSubtitles: false,
      mode: 'disabled',
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
      missingItems: EMPTY_ARRAY,
      missingLanguages: EMPTY_ARRAY,
      primarySource: null,
      reason: 'Subtitles disabled by developer config (subtitles={false}).'
    };
  }

  let mode = 'all';
  let devSubtitles = {};
  let visibilityFilter = null;
  let requestedItems = 'all';

  if (subtitlesConfig === undefined || subtitlesConfig === 'all') {
    mode = 'all';
    requestedItems = 'all';
  } else if (Array.isArray(subtitlesConfig)) {
    mode = 'filter';
    visibilityFilter = subtitlesConfig;
    requestedItems = subtitlesConfig;
  } else if (typeof subtitlesConfig === 'object' && subtitlesConfig !== null) {
    mode = 'all';
    devSubtitles = subtitlesConfig;
    requestedItems = Object.keys(subtitlesConfig);
  }

  const { resolvedTracks: rawResolved, sourceByLanguage: rawSourceByLang } = resolveSubtitleSources({
    demoSubtitles,
    generatedSubtitles,
    developerSubtitles: Object.keys(devSubtitles).length > 0 ? devSubtitles : developerSubtitles,
    uploadedSubtitles
  });

  const availableLanguages = Object.keys(rawResolved).filter(lang => Boolean(rawResolved[lang]));
  const hasEmbedded = Array.isArray(embeddedTracks) && embeddedTracks.length > 0;
  const hasAvailableSubtitles = availableLanguages.length > 0 || hasEmbedded;

  if (!hasAvailableSubtitles) {
    const missing = Array.isArray(visibilityFilter) ? visibilityFilter : EMPTY_ARRAY;
    if (missing.length > 0) {
      emitSubtitleDXWarning(missing, availableLanguages, visibilityFilter || missing, videoKey);
    }
    return {
      enabled: false,
      hasAvailableItems: false,
      hasAvailableSubtitles: false,
      mode,
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
      missingItems: missing,
      missingLanguages: missing,
      primarySource: null,
      reason: 'No subtitle sources found (No generated, uploaded, developer, or embedded tracks).'
    };
  }

  let visibleLanguages = [];
  let missingLanguages = [];

  if (mode === 'all') {
    visibleLanguages = [...availableLanguages];
  } else if (mode === 'filter') {
    const allowedSet = new Set(visibilityFilter);
    visibleLanguages = availableLanguages.filter(lang => allowedSet.has(lang));

    missingLanguages = visibilityFilter.filter(lang => !availableLanguages.includes(lang));
    if (missingLanguages.length > 0) {
      emitSubtitleDXWarning(missingLanguages, availableLanguages, visibilityFilter, videoKey);
    }

    // Always preserve any runtime user-uploaded tracks
    Object.keys(uploadedSubtitles || {}).forEach(uploadLang => {
      if (!visibleLanguages.includes(uploadLang) && uploadedSubtitles[uploadLang]) {
        visibleLanguages.push(uploadLang);
      }
    });
  }

  if (visibleLanguages.length === 0 && !hasEmbedded) {
    return {
      enabled: false,
      hasAvailableItems: hasAvailableSubtitles,
      hasAvailableSubtitles,
      mode,
      requestedItems,
      requestedLanguages: requestedItems,
      availableItems: availableLanguages.length > 0 ? availableLanguages : EMPTY_ARRAY,
      availableLanguages: availableLanguages.length > 0 ? availableLanguages : EMPTY_ARRAY,
      visibleItems: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedItems: EMPTY_OBJECT,
      resolvedTracks: EMPTY_OBJECT,
      sourceByItem: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      missingItems: missingLanguages,
      missingLanguages,
      primarySource: null,
      reason: missingLanguages.length > 0
        ? `Requested subtitle languages "${missingLanguages.join(', ')}" are not available.`
        : 'No visible subtitle tracks matched filter.'
    };
  }

  const resolvedTracks = {};
  const sourceByLanguage = {};

  for (const lang of visibleLanguages) {
    resolvedTracks[lang] = rawResolved[lang];
    sourceByLanguage[lang] = rawSourceByLang[lang];
  }

  // Determine primary source
  let primarySource = null;
  if (Object.keys(uploadedSubtitles || {}).some(l => Boolean(uploadedSubtitles[l]))) {
    primarySource = 'uploaded';
  } else if (Object.keys(devSubtitles).length > 0 || Object.keys(developerSubtitles || {}).some(l => Boolean(developerSubtitles[l]))) {
    primarySource = 'developer';
  } else if (Object.keys(generatedSubtitles || {}).some(l => Boolean(generatedSubtitles[l]))) {
    primarySource = 'generated';
  } else if (Object.keys(demoSubtitles || {}).some(l => Boolean(demoSubtitles[l]))) {
    primarySource = 'demo';
  } else if (hasEmbedded) {
    primarySource = 'embedded';
  }

  const finalTracksKeys = Object.keys(resolvedTracks);

  return {
    enabled: visibleLanguages.length > 0 || hasEmbedded,
    hasAvailableItems: hasAvailableSubtitles,
    hasAvailableSubtitles,
    mode,
    requestedItems,
    requestedLanguages: requestedItems,
    availableItems: availableLanguages.length > 0 ? availableLanguages : EMPTY_ARRAY,
    availableLanguages: availableLanguages.length > 0 ? availableLanguages : EMPTY_ARRAY,
    visibleItems: visibleLanguages.length > 0 ? visibleLanguages : EMPTY_ARRAY,
    visibleLanguages: visibleLanguages.length > 0 ? visibleLanguages : EMPTY_ARRAY,
    resolvedItems: finalTracksKeys.length > 0 ? resolvedTracks : EMPTY_OBJECT,
    resolvedTracks: finalTracksKeys.length > 0 ? resolvedTracks : EMPTY_OBJECT,
    sourceByItem: finalTracksKeys.length > 0 ? sourceByLanguage : EMPTY_OBJECT,
    sourceByLanguage: finalTracksKeys.length > 0 ? sourceByLanguage : EMPTY_OBJECT,
    missingItems: missingLanguages.length > 0 ? missingLanguages : EMPTY_ARRAY,
    missingLanguages: missingLanguages.length > 0 ? missingLanguages : EMPTY_ARRAY,
    primarySource,
    reason: 'Active subtitle sources available.'
  };
}

export function resolveSubtitleVisibility(opts) {
  return resolveSubtitleAvailability(opts);
}

export default resolveSubtitleAvailability;
