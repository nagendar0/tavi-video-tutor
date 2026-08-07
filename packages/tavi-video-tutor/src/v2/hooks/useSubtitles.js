import { useState, useMemo } from 'react';
import { resolveSubtitleAvailability } from '../../subtitles/resolver/subtitleResolver.js';

/**
 * AITutor v2.0 Modular Custom Hook: useSubtitles
 * Manages subtitle sources, language selection, and availability resolution
 */
export function useSubtitles({
  subtitlesConfig,
  demoSubtitles,
  generatedSubtitles,
  uploadedSubtitles,
  embeddedTracks,
  defaultSubLanguage = 'en'
}) {
  const [selectedSubLanguage, setSelectedSubLanguage] = useState(defaultSubLanguage);
  const [isDualSubtitles, setIsDualSubtitles] = useState(false);
  const [localSubtitles, setLocalSubtitles] = useState({});

  const availability = useMemo(() => {
    return resolveSubtitleAvailability({
      subtitlesConfig,
      demoSubtitles,
      generatedSubtitles,
      uploadedSubtitles: { ...uploadedSubtitles, ...localSubtitles },
      embeddedTracks
    });
  }, [subtitlesConfig, demoSubtitles, generatedSubtitles, uploadedSubtitles, localSubtitles, embeddedTracks]);

  return {
    availability,
    hasAvailableSubtitles: availability.hasAvailableSubtitles,
    isSubtitleEnabled: availability.enabled,
    visibleSubLanguages: availability.visibleLanguages,
    availableSubLangs: availability.availableLanguages,
    resolvedTracks: availability.resolvedTracks,
    selectedSubLanguage,
    setSelectedSubLanguage,
    isDualSubtitles,
    setIsDualSubtitles,
    localSubtitles,
    setLocalSubtitles
  };
}

export default useSubtitles;
