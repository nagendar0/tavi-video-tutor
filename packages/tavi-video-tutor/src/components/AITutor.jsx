import React, { forwardRef, useState, useEffect, useRef, useMemo } from 'react';
import TaviVideoPlayer from './TaviVideoPlayer.jsx';
import { resolveManifestSubtitle } from '../services/manifestStore.js';
import { resolveSubtitleSources } from '../subtitles/resolver/subtitleResolver.js';
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
  subtitles = {},
  tracks,
  config,
  audioDubs = {},
  qualities = [],
  subLanguage,
  defaultSubLanguage = 'en',
  defaultAudioLanguage = 'original',
  playbackRates = [0.5, 1, 1.25, 1.5, 2],
  onSubLanguageChange,
  onSubtitleGenerated,
  onUpdateSubtitles,
  onTracksChange
}, ref) => {
  const [manifestSubtitles, setManifestSubtitles] = useState({});
  const seqRef = useRef(0);

  // Dynamic src switching: detach old track & fetch manifest subtitle for new src
  useEffect(() => {
    const currentSeq = ++seqRef.current;
    setManifestSubtitles({}); // Detach old track immediately

    if (!src) return;

    let isSubscribed = true;

    (async () => {
      try {
        const manifestEntry = await resolveManifestSubtitle(src, id);
        if (!isSubscribed || seqRef.current !== currentSeq) return;

        if (manifestEntry) {
          const loadedMap = {};

          if (manifestEntry.subtitles && Object.keys(manifestEntry.subtitles).length > 0) {
            await Promise.all(
              Object.entries(manifestEntry.subtitles).map(async ([langCode, subInfo]) => {
                try {
                  const subSrc = typeof subInfo === 'string' ? subInfo : (subInfo && subInfo.src);
                  if (subSrc) {
                    const res = await fetch(subSrc);
                    if (res.ok) {
                      const vttText = await res.text();
                      loadedMap[langCode] = vttText;
                    }
                  }
                } catch (_) {}
              })
            );
          } else if (manifestEntry.subtitle) {
            const res = await fetch(manifestEntry.subtitle);
            if (res.ok) {
              const vttText = await res.text();
              loadedMap[manifestEntry.language || 'en'] = vttText;
            }
          }

          if (isSubscribed && seqRef.current === currentSeq && Object.keys(loadedMap).length > 0) {
            setManifestSubtitles(loadedMap);
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

  const { resolvedTracks } = useMemo(() => {
    return resolveSubtitleSources({
      generatedSubtitles: manifestSubtitles,
      developerSubtitles: subtitles
    });
  }, [subtitles, manifestSubtitles]);

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
        manifestSubtitles={manifestSubtitles}
        resolvedSubtitles={resolvedTracks}
        tracks={tracks}
        config={config}
        audioDubs={audioDubs}
        qualities={qualities}
        subLanguage={subLanguage}
        defaultSubLanguage={defaultSubLanguage}
        defaultAudioLanguage={defaultAudioLanguage}
        playbackRates={playbackRates}
        onSubLanguageChange={onSubLanguageChange}
        onSubtitleGenerated={onSubtitleGenerated}
        onUpdateSubtitles={onUpdateSubtitles}
        onTracksChange={onTracksChange}
      />
    </div>
  );
});

AITutor.displayName = 'AITutor';

export default AITutor;


