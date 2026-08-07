import { useState, useCallback, useRef } from 'react';

/**
 * AITutor v2.0 Modular Custom Hook: usePlayerState
 * Manages core HTML5 media element playback state
 */
export function usePlayerState(initialOptions = {}) {
  const {
    initialVolume = 1,
    initialMuted = false,
    initialRate = 1
  } = initialOptions;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(initialVolume);
  const [isMuted, setIsMutedState] = useState(initialMuted);
  const [playbackRate, setPlaybackRateState] = useState(initialRate);
  const [isBuffering, setIsBuffering] = useState(false);
  const [mediaError, setMediaError] = useState('');

  const setVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
  }, []);

  const setIsMuted = useCallback((muted) => {
    setIsMutedState(Boolean(muted));
  }, []);

  const setPlaybackRate = useCallback((rate) => {
    setPlaybackRateState(rate);
  }, []);

  return {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    playbackRate,
    setPlaybackRate,
    isBuffering,
    setIsBuffering,
    mediaError,
    setMediaError
  };
}

export default usePlayerState;
