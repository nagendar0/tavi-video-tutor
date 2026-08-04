import { AITUTOR_LANGUAGES, getLanguageByCode } from '../languages/registry.js';

/**
 * Central Subtitle Resolver
 * 
 * Priority Chain (Highest to Lowest):
 * 1. uploadedSubtitles  (user/student runtime uploaded subtitles)
 * 2. developerSubtitles (developer-provided manual subtitles via prop)
 * 3. generatedSubtitles (automatically generated AITutor subtitles from /aitutor/manifest.json)
 * 4. demoSubtitles      (example / fixture fallbacks)
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
  const developer = developerSubtitles || {};
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

  return {
    resolvedTracks,
    sourceByLanguage
  };
}

/**
 * Central Subtitle Visibility Resolver
 * 
 * Handles developer visibility modes ("all", false, array filter, custom track objects)
 * while preserving 4-tier source priority and per-video available track resolution.
 */
export function resolveSubtitleVisibility({
  subtitlesConfig,
  demoSubtitles = {},
  generatedSubtitles = {},
  uploadedSubtitles = {}
} = {}) {
  // If subtitlesConfig is false, UI and runtime rendering are completely disabled.
  if (subtitlesConfig === false) {
    return {
      enabled: false,
      mode: 'disabled',
      availableLanguages: [],
      visibleLanguages: [],
      resolvedTracks: {},
      sourceByLanguage: {}
    };
  }

  let mode = 'all';
  let developerSubtitles = {};
  let visibilityFilter = null;

  if (subtitlesConfig === undefined || subtitlesConfig === 'all') {
    mode = 'all';
  } else if (Array.isArray(subtitlesConfig)) {
    mode = 'filter';
    visibilityFilter = subtitlesConfig;
  } else if (typeof subtitlesConfig === 'object' && subtitlesConfig !== null) {
    mode = 'all';
    developerSubtitles = subtitlesConfig;
  }

  const { resolvedTracks: rawResolved, sourceByLanguage: rawSourceByLang } = resolveSubtitleSources({
    demoSubtitles,
    generatedSubtitles,
    developerSubtitles,
    uploadedSubtitles
  });

  const availableLanguages = Object.keys(rawResolved).filter(lang => Boolean(rawResolved[lang]));

  let visibleLanguages = [];

  if (mode === 'all') {
    visibleLanguages = [...availableLanguages];
  } else if (mode === 'filter') {
    const allowedSet = new Set(visibilityFilter);
    visibleLanguages = availableLanguages.filter(lang => allowedSet.has(lang));

    if (process.env.NODE_ENV !== 'production') {
      visibilityFilter.forEach(reqLang => {
        if (!availableLanguages.includes(reqLang)) {
          console.warn(`[AITutor] Subtitle track for requested language "${reqLang}" is not available for current video.`);
        }
      });
    }

    // Always preserve any runtime user-uploaded tracks
    Object.keys(uploadedSubtitles || {}).forEach(uploadLang => {
      if (!visibleLanguages.includes(uploadLang) && uploadedSubtitles[uploadLang]) {
        visibleLanguages.push(uploadLang);
      }
    });
  }

  const resolvedTracks = {};
  const sourceByLanguage = {};

  for (const lang of visibleLanguages) {
    resolvedTracks[lang] = rawResolved[lang];
    sourceByLanguage[lang] = rawSourceByLang[lang];
  }

  return {
    enabled: true,
    mode,
    availableLanguages,
    visibleLanguages,
    resolvedTracks,
    sourceByLanguage
  };
}

export default resolveSubtitleVisibility;
