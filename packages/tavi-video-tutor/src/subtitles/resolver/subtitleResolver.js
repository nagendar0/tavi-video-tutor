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
  embeddedTracks = []
} = {}) {
  // If subtitlesConfig is explicitly false, all subtitle features are completely disabled.
  if (subtitlesConfig === false) {
    return {
      enabled: false,
      hasAvailableSubtitles: false,
      mode: 'disabled',
      availableLanguages: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      primarySource: null,
      reason: 'Subtitles disabled by developer config (subtitles={false}).'
    };
  }

  let mode = 'all';
  let devSubtitles = {};
  let visibilityFilter = null;

  if (subtitlesConfig === undefined || subtitlesConfig === 'all') {
    mode = 'all';
  } else if (Array.isArray(subtitlesConfig)) {
    mode = 'filter';
    visibilityFilter = subtitlesConfig;
  } else if (typeof subtitlesConfig === 'object' && subtitlesConfig !== null) {
    mode = 'all';
    devSubtitles = subtitlesConfig;
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
    return {
      enabled: false,
      hasAvailableSubtitles: false,
      mode,
      availableLanguages: EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      primarySource: null,
      reason: 'No subtitle sources found (No generated, uploaded, developer, or embedded tracks).'
    };
  }

  let visibleLanguages = [];

  if (mode === 'all') {
    visibleLanguages = [...availableLanguages];
  } else if (mode === 'filter') {
    const allowedSet = new Set(visibilityFilter);
    visibleLanguages = availableLanguages.filter(lang => allowedSet.has(lang));

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
      hasAvailableSubtitles,
      mode,
      availableLanguages: availableLanguages.length > 0 ? availableLanguages : EMPTY_ARRAY,
      visibleLanguages: EMPTY_ARRAY,
      resolvedTracks: EMPTY_OBJECT,
      sourceByLanguage: EMPTY_OBJECT,
      primarySource: null,
      reason: 'No visible subtitle tracks matched filter.'
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
    hasAvailableSubtitles,
    mode,
    availableLanguages: availableLanguages.length > 0 ? availableLanguages : EMPTY_ARRAY,
    visibleLanguages: visibleLanguages.length > 0 ? visibleLanguages : EMPTY_ARRAY,
    resolvedTracks: finalTracksKeys.length > 0 ? resolvedTracks : EMPTY_OBJECT,
    sourceByLanguage: finalTracksKeys.length > 0 ? sourceByLanguage : EMPTY_OBJECT,
    primarySource,
    reason: 'Active subtitle sources available.'
  };
}

export function resolveSubtitleVisibility(opts) {
  return resolveSubtitleAvailability(opts);
}

export default resolveSubtitleAvailability;


