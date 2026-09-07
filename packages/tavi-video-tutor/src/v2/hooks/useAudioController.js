import { useEffect, useRef, useState } from 'react';
import { AudioController } from '../../services/AudioController.js';

/**
 * React Hook for Production-Grade Audio-Language Control
 * 
 * Provides stable integration between React state, HTML5 <video>,
 * and the authoritative AudioController service.
 */
export function useAudioController({
  videoRef,
  resolvedTrack,
  volume = 1,
  isMuted = false,
  playbackRate = 1,
  sourceLanguage = 'en',
  onDriftCorrect,
  onStateChange
} = {}) {
  const controllerRef = useRef(null);
  const [controllerState, setControllerState] = useState(() => ({
    mode: resolvedTrack?.mode || 'original',
    language: resolvedTrack?.language || sourceLanguage || 'en',
    sourceUrl: resolvedTrack?.url || null,
    normalizedUrl: resolvedTrack?.normalizedUrl || null,
    trackId: resolvedTrack?.trackId || `original:${sourceLanguage || 'en'}`,
    generation: 0,
    status: 'idle',
    error: null
  }));

  // 1. Initialize stable AudioController instance once
  if (!controllerRef.current) {
    controllerRef.current = new AudioController({
      sourceLanguage,
      volume,
      isMuted,
      playbackRate,
      onDriftCorrect,
      onStateChange: (state) => {
        setControllerState(state);
        onStateChange?.(state);
      }
    });
  }

  const controller = controllerRef.current;

  // 2. Attach video element whenever videoRef changes
  useEffect(() => {
    const video = videoRef?.current || null;
    if (video) {
      controller.attachVideo(video);
    }
  }, [videoRef, videoRef?.current]);

  // 3. Sync volume and muted state changes
  useEffect(() => {
    controller.setVolume(volume);
  }, [volume, controller]);

  useEffect(() => {
    controller.setMuted(isMuted);
  }, [isMuted, controller]);

  useEffect(() => {
    controller.setPlaybackRate(playbackRate);
  }, [playbackRate, controller]);

  // 4. Switch tracks safely with two-phase commit and generation token
  const trackId = resolvedTrack?.trackId || 'original';
  const trackUrl = resolvedTrack?.url || null;
  const trackMode = resolvedTrack?.mode || 'original';

  useEffect(() => {
    if (resolvedTrack) {
      controller.switchTrack(resolvedTrack);
    }
  }, [trackId, trackUrl, trackMode, controller]);

  // 5. Cleanup on unmount
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
      }
    };
  }, []);

  return {
    controller,
    audioElement: controller?.audioElement || null,
    controllerState
  };
}

export default useAudioController;
