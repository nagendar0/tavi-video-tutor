import React, { forwardRef, useState, useEffect, useRef, useMemo } from 'react';
import TaviVideoPlayer from './TaviVideoPlayer.jsx';
import { resolveManifestSubtitle } from '../services/manifestStore.js';
import { resolveSubtitleAvailability } from '../subtitles/resolver/subtitleResolver.js';
import { resolveAudioAvailability } from '../subtitles/resolver/audioResolver.js';
import { resolveQualityAvailability } from '../subtitles/resolver/qualityResolver.js';
import '../styles/ai-tutor.css';

export const AITutor = forwardRef(({
  src,
  id,
  width = '100%',
  height = '100%',
  style = {},
  className = '',
  onPlay,
  onPause,
  onEnded,
  onProgress,
  subtitles,
  audioLanguages,
  sourceLanguage,
  tracks,
  config,
  audioDubs = {},
  qualities,
  subLanguage,
  defaultSubLanguage = 'en',
  playbackRates = [0.5, 1, 1.25, 1.5, 2],
  subtitleStyle,
  autoTranscribe = false,
  onSubLanguageChange,
  onAudioLanguageChange,
  onQualityChange,
  onSubtitleGenerated,
  onUpdateSubtitles,
  onTracksChange
}, ref) => {
  const [manifestSubtitles, setManifestSubtitles] = useState({});
  const [manifestQualities, setManifestQualities] = useState([]);
  const [manifestAudioLanguages, setManifestAudioLanguages] = useState({});
  const [manifestSourceLanguage, setManifestSourceLanguage] = useState(null);
  const seqRef = useRef(0);

  // Dynamic src switching: detach old track & fetch manifest subtitle/audio for new src
  useEffect(() => {
    const currentSeq = ++seqRef.current;
    setManifestSubtitles(prev => (Object.keys(prev).length === 0 ? prev : {}));
    setManifestQualities(prev => (prev.length === 0 ? prev : []));
    setManifestAudioLanguages(prev => (Object.keys(prev).length === 0 ? prev : {}));
    setManifestSourceLanguage(null);

    if (!src) return;

    let isSubscribed = true;

    (async () => {
      try {
        const manifestEntry = await resolveManifestSubtitle(src, id);
        if (!isSubscribed || seqRef.current !== currentSeq) return;

        if (manifestEntry) {
          if (manifestEntry.sourceLanguage || manifestEntry.language) {
            setManifestSourceLanguage(manifestEntry.sourceLanguage || manifestEntry.language);
          }

          if (Array.isArray(manifestEntry.qualities) && manifestEntry.qualities.length > 0) {
            setManifestQualities(prev => {
              if (prev.length === manifestEntry.qualities.length && prev.every((q, i) => q === manifestEntry.qualities[i])) return prev;
              return manifestEntry.qualities;
            });
          }

          if (manifestEntry.audioLanguages && typeof manifestEntry.audioLanguages === 'object') {
            setManifestAudioLanguages(manifestEntry.audioLanguages);
          }

          const loadedMap = {};

          if (manifestEntry.subtitles && Object.keys(manifestEntry.subtitles).length > 0) {
            Object.entries(manifestEntry.subtitles).forEach(([langCode, subInfo]) => {
              const subSrc = typeof subInfo === 'string' ? subInfo : (subInfo && subInfo.src);
              if (subSrc) {
                loadedMap[langCode] = subSrc;
              }
            });
          } else if (manifestEntry.subtitle) {
            loadedMap[manifestEntry.language || 'en'] = manifestEntry.subtitle;
          }

          if (isSubscribed && seqRef.current === currentSeq && Object.keys(loadedMap).length > 0) {
            setManifestSubtitles(prev => {
              const prevKeys = Object.keys(prev);
              const newKeys = Object.keys(loadedMap);
              if (prevKeys.length === newKeys.length && prevKeys.every(k => prev[k] === loadedMap[k])) return prev;
              return loadedMap;
            });
          }
        }
      } catch (_) {
        // Silent catch for missing manifest entries
      }
    })();

    return () => {
      isSubscribed = false;
    };
  }, [src, id]);

  const availabilityResult = useMemo(() => {
    return resolveSubtitleAvailability({
      subtitlesConfig: subtitles,
      generatedSubtitles: manifestSubtitles,
      videoKey: id || src || 'default'
    });
  }, [subtitles, manifestSubtitles, id, src]);

  const effectiveSourceLanguage = sourceLanguage || manifestSourceLanguage || null;

  const audioAvailabilityResult = useMemo(() => {
    return resolveAudioAvailability({
      audioLanguagesConfig: audioLanguages,
      manifestAudio: manifestAudioLanguages,
      developerAudio: audioDubs,
      sourceLanguage: effectiveSourceLanguage,
      videoKey: id || src || 'default'
    });
  }, [audioLanguages, manifestAudioLanguages, audioDubs, effectiveSourceLanguage, id, src]);

  const qualityAvailabilityResult = useMemo(() => {
    return resolveQualityAvailability({
      qualitiesConfig: qualities,
      manifestQualities,
      config,
      videoKey: id || src || 'default'
    });
  }, [qualities, manifestQualities, config, id, src]);

  return (
    <div 
      className={`tavi-tutor-workspace-root ${className}`}
      style={{ 
        position: 'relative', 
        width: width, 
        height: height, 
        overflow: 'hidden',
        ...style 
      }}
    >
      <TaviVideoPlayer
        ref={ref}
        src={src}
        id={id}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onProgress={onProgress}
        subtitles={subtitles}
        audioLanguages={audioLanguages}
        manifestSubtitles={manifestSubtitles}
        manifestQualities={manifestQualities}
        manifestAudioLanguages={manifestAudioLanguages}
        manifestSourceLanguage={manifestSourceLanguage}
        sourceLanguage={sourceLanguage}
        resolvedSubtitles={availabilityResult.resolvedTracks}
        resolvedAudioTracks={audioAvailabilityResult.resolvedTracks}
        subtitleAvailability={availabilityResult}
        audioAvailability={audioAvailabilityResult}
        qualityAvailability={qualityAvailabilityResult}
        tracks={tracks}
        config={config}
        audioDubs={audioDubs}
        qualities={qualities}
        subLanguage={subLanguage}
        defaultSubLanguage={defaultSubLanguage}
        playbackRates={playbackRates}
        subtitleStyle={subtitleStyle}
        autoTranscribe={autoTranscribe}
        onSubLanguageChange={onSubLanguageChange}
        onAudioLanguageChange={onAudioLanguageChange}
        onQualityChange={onQualityChange}
        onSubtitleGenerated={onSubtitleGenerated}
        onUpdateSubtitles={onUpdateSubtitles}
        onTracksChange={onTracksChange}
      />
    </div>
  );
});

AITutor.displayName = 'AITutor';

export default AITutor;
