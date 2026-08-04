/**
 * Central Subtitle Resolver
 * 
 * Implements explicit subtitle-source priority system:
 * 
 * LOWEST PRIORITY
 * 1. demoSubtitles      (example / fixture fallbacks)
 * 2. generatedSubtitles (automatically generated AITutor subtitles from /aitutor/manifest.json)
 * 3. developerSubtitles (developer-provided manual subtitles via prop)
 * 4. uploadedSubtitles  (user/student runtime uploaded subtitles)
 * HIGHEST PRIORITY
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

  const allLanguages = new Set([
    ...Object.keys(demo),
    ...Object.keys(generated),
    ...Object.keys(developer),
    ...Object.keys(uploaded)
  ]);

  const resolvedTracks = {};
  const sourceByLanguage = {};

  const isVal = (val) => val !== null && val !== undefined && val !== '';

  for (const lang of allLanguages) {
    if (isVal(uploaded[lang])) {
      resolvedTracks[lang] = uploaded[lang];
      sourceByLanguage[lang] = 'uploaded';
    } else if (isVal(developer[lang])) {
      resolvedTracks[lang] = developer[lang];
      sourceByLanguage[lang] = 'developer';
    } else if (isVal(generated[lang])) {
      resolvedTracks[lang] = generated[lang];
      sourceByLanguage[lang] = 'generated';
    } else if (isVal(demo[lang])) {
      resolvedTracks[lang] = demo[lang];
      sourceByLanguage[lang] = 'demo';
    }
  }

  return {
    resolvedTracks,
    sourceByLanguage
  };
}

export default resolveSubtitleSources;
