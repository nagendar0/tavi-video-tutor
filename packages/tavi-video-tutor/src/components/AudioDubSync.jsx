import { useEffect, useRef } from 'react';

export const useAudioDubSync = ({
  isPlaying,
  currentTime,
  playbackRate,
  volume,
  isMuted,
  audioUrl,
  onDriftCorrect
}) => {
  const audioRef = useRef(null);
  const syncLoopRef = useRef(null);
  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;

  // Synchronize play/pause, volume, mute, and playback rate
  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      return;
    }

    // Load new audio URL if it changes
    if (!audioRef.current || audioRef.current.src !== audioUrl) {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(audioUrl);
      audioRef.current.currentTime = currentTime;
    }

    const audio = audioRef.current;
    audio.playbackRate = playbackRate;
    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      audio.play().catch(err => {
        console.warn('Audio Dub playback was delayed or blocked:', err);
      });
    } else {
      audio.pause();
    }

    return () => {
      // Clean up on component update/unmount
      if (syncLoopRef.current) clearInterval(syncLoopRef.current);
    };
  }, [isPlaying, playbackRate, volume, isMuted, audioUrl]);

  // Precision drift correction loop (runs every 200ms when playing)
  useEffect(() => {
    if (isPlaying && audioRef.current && audioUrl) {
      syncLoopRef.current = setInterval(() => {
        const audio = audioRef.current;
        const currentVal = currentTimeRef.current;
        const drift = Math.abs(currentVal - audio.currentTime);
        
        // If drift is larger than 150 milliseconds, force align the audio track
        if (drift > 0.15) {
          audio.currentTime = currentVal;
          onDriftCorrect?.(currentVal);
        }
      }, 200);
    }

    return () => {
      if (syncLoopRef.current) clearInterval(syncLoopRef.current);
    };
  }, [isPlaying, audioUrl, onDriftCorrect]);

  return audioRef;
};

export default useAudioDubSync;
