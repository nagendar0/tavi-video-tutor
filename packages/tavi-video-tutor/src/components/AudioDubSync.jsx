import { useEffect, useRef, useMemo } from 'react';
import { AudioController } from '../services/AudioController.js';
import { normalizeAudioUrl } from '../subtitles/resolver/audioResolver.js';

/**
 * Backward-compatible useAudioDubSync wrapper powered by production AudioController.
 */
export const useAudioDubSync = ({
  isPlaying,
  currentTime,
  playbackRate,
  volume,
  isMuted,
  audioUrl,
  videoRef,
  onDriftCorrect
}) => {
  const controllerRef = useRef(null);
  const audioRef = useRef(null);

  if (!controllerRef.current) {
    controllerRef.current = new AudioController({
      volume,
      isMuted,
      playbackRate,
      onDriftCorrect
    });
    audioRef.current = controllerRef.current.audioElement;
  }

  const controller = controllerRef.current;

  // Video element sync
  useEffect(() => {
    if (videoRef?.current) {
      controller.attachVideo(videoRef.current);
    }
  }, [videoRef, videoRef?.current, controller]);

  // Volume & mute sync
  useEffect(() => {
    controller.setVolume(volume);
  }, [volume, controller]);

  useEffect(() => {
    controller.setMuted(isMuted);
  }, [isMuted, controller]);

  useEffect(() => {
    controller.setPlaybackRate(playbackRate);
  }, [playbackRate, controller]);

  // Track switch sync
  useEffect(() => {
    if (audioUrl) {
      const norm = normalizeAudioUrl(audioUrl);
      controller.switchTrack({
        mode: 'dub',
        language: 'dub',
        url: audioUrl,
        normalizedUrl: norm,
        trackId: `dub:${norm}`,
        playable: true
      });
    } else {
      controller.switchTrack({
        mode: 'original',
        language: 'original'
      });
    }
  }, [audioUrl, controller]);

  // Play/pause sync
  useEffect(() => {
    if (isPlaying) {
      controller.handleVideoPlay();
    } else {
      controller.handleVideoPause();
    }
  }, [isPlaying, controller]);

  // Seek sync
  useEffect(() => {
    if (audioUrl && controller.audioElement) {
      const drift = Math.abs(currentTime - controller.audioElement.currentTime);
      if (drift > 0.25) {
        controller.audioElement.currentTime = currentTime;
      }
    }
  }, [currentTime, audioUrl, controller]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.destroy();
        controllerRef.current = null;
        audioRef.current = null;
      }
    };
  }, []);

  return audioRef;
};

export default useAudioDubSync;
