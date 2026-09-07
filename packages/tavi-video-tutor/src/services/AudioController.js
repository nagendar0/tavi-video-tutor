import { normalizeAudioUrl } from '../subtitles/resolver/audioResolver.js';

/**
 * PRODUCTION-GRADE AUDIO PLAYBACK CONTROLLER
 * 
 * Central authoritative media controller for TaviVideoPlayer audio-language playback.
 * 
 * Invariants & Guarantees:
 * 1. Single source of truth for audio track playback state.
 * 2. Strict Mutual Exclusion:
 *    - ORIGINAL MODE: Video audio ON, Dub audio OFF.
 *    - DUB MODE: Video audio OFF (muted=true, volume=0), exactly one Dub audio ON.
 *    - Video audio and Dub audio NEVER play simultaneously.
 * 3. Race-safe Two-Phase switching guarded by monotonic generation tokens.
 * 4. Master Clock Synchronization: Video is the authoritative clock; Dub audio follows video.currentTime.
 * 5. Stable HTML5 Audio instance across React re-renders.
 */

export class AudioController {
  constructor(options = {}) {
    this.audioElement = (typeof Audio !== 'undefined') ? new Audio() : null;
    this.videoElement = null;

    this.currentGeneration = 0;
    this.isSeeking = false;
    this.syncIntervalId = null;
    this.playPromise = null;

    this.volume = (typeof options.volume === 'number') ? options.volume : 1;
    this.isMuted = Boolean(options.isMuted);
    this.playbackRate = (typeof options.playbackRate === 'number') ? options.playbackRate : 1;
    this.onDriftCorrect = options.onDriftCorrect || null;
    this.onStateChange = options.onStateChange || null;

    this.state = {
      mode: 'original',
      language: options.sourceLanguage || 'en',
      sourceUrl: null,
      normalizedUrl: null,
      trackId: `original:${options.sourceLanguage || 'en'}`,
      generation: 0,
      status: 'idle', // 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'switching' | 'error' | 'stopped'
      error: null
    };

    this.listeners = new Set();
    this.boundListeners = {};

    this._bindAudioEvents();
  }

  // Subscribe to controller state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  _notify() {
    const snapshot = { ...this.state };
    this.onStateChange?.(snapshot);
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[AudioController] Listener error:', err);
      }
    }
  }

  // Attach master <video> element
  attachVideo(video) {
    if (this.videoElement === video) return;
    this._detachVideo();
    this.videoElement = video;
    if (this.videoElement) {
      this._bindVideoEvents();
      this.enforceMuteInvariant();
    }
  }

  _detachVideo() {
    if (!this.videoElement) return;
    this._unbindVideoEvents();
    this.videoElement = null;
  }

  _bindVideoEvents() {
    const v = this.videoElement;
    if (!v) return;

    this.boundListeners.videoPlay = () => this.handleVideoPlay();
    this.boundListeners.videoPlaying = () => this.handleVideoPlaying();
    this.boundListeners.videoPause = () => this.handleVideoPause();
    this.boundListeners.videoSeeking = () => this.handleVideoSeeking();
    this.boundListeners.videoSeeked = () => this.handleVideoSeeked();
    this.boundListeners.videoRateChange = () => this.handleVideoRateChange();
    this.boundListeners.videoVolumeChange = () => this.handleVideoVolumeChange();
    this.boundListeners.videoEnded = () => this.handleVideoEnded();
    this.boundListeners.videoWaiting = () => this.handleVideoWaiting();

    v.addEventListener('play', this.boundListeners.videoPlay);
    v.addEventListener('playing', this.boundListeners.videoPlaying);
    v.addEventListener('pause', this.boundListeners.videoPause);
    v.addEventListener('seeking', this.boundListeners.videoSeeking);
    v.addEventListener('seeked', this.boundListeners.videoSeeked);
    v.addEventListener('ratechange', this.boundListeners.videoRateChange);
    v.addEventListener('volumechange', this.boundListeners.videoVolumeChange);
    v.addEventListener('ended', this.boundListeners.videoEnded);
    v.addEventListener('waiting', this.boundListeners.videoWaiting);
  }

  _unbindVideoEvents() {
    const v = this.videoElement;
    if (!v) return;

    if (this.boundListeners.videoPlay) v.removeEventListener('play', this.boundListeners.videoPlay);
    if (this.boundListeners.videoPlaying) v.removeEventListener('playing', this.boundListeners.videoPlaying);
    if (this.boundListeners.videoPause) v.removeEventListener('pause', this.boundListeners.videoPause);
    if (this.boundListeners.videoSeeking) v.removeEventListener('seeking', this.boundListeners.videoSeeking);
    if (this.boundListeners.videoSeeked) v.removeEventListener('seeked', this.boundListeners.videoSeeked);
    if (this.boundListeners.videoRateChange) v.removeEventListener('ratechange', this.boundListeners.videoRateChange);
    if (this.boundListeners.videoVolumeChange) v.removeEventListener('volumechange', this.boundListeners.videoVolumeChange);
    if (this.boundListeners.videoEnded) v.removeEventListener('ended', this.boundListeners.videoEnded);
    if (this.boundListeners.videoWaiting) v.removeEventListener('waiting', this.boundListeners.videoWaiting);
  }

  _bindAudioEvents() {
    const a = this.audioElement;
    if (!a) return;

    this.boundListeners.audioCanPlay = () => this._onAudioCanPlay();
    this.boundListeners.audioPlaying = () => this._onAudioPlaying();
    this.boundListeners.audioPause = () => this._onAudioPause();
    this.boundListeners.audioWaiting = () => this._onAudioWaiting();
    this.boundListeners.audioError = (e) => this._onAudioError(e);
    this.boundListeners.audioEnded = () => this._onAudioEnded();

    a.addEventListener('canplay', this.boundListeners.audioCanPlay);
    a.addEventListener('playing', this.boundListeners.audioPlaying);
    a.addEventListener('pause', this.boundListeners.audioPause);
    a.addEventListener('waiting', this.boundListeners.audioWaiting);
    a.addEventListener('error', this.boundListeners.audioError);
    a.addEventListener('ended', this.boundListeners.audioEnded);
  }

  _onAudioCanPlay() {
    if (this.state.mode === 'dub' && (this.state.status === 'loading' || this.state.status === 'switching')) {
      this.state.status = 'ready';
      this._notify();

      if (this.videoElement && !this.videoElement.paused && !this.videoElement.ended) {
        this._startDubPlayback(this.currentGeneration);
      }
    }
  }

  _onAudioPlaying() {
    if (this.state.mode === 'dub') {
      this.state.status = 'playing';
      this.enforceMuteInvariant();
      this._notify();
    }
  }

  _onAudioPause() {
    if (this.state.mode === 'dub' && this.state.status === 'playing') {
      this.state.status = 'paused';
      this._notify();
    }
  }

  _onAudioWaiting() {
    if (this.state.mode === 'dub' && this.state.status === 'playing') {
      this.state.status = 'loading';
      this._notify();
    }
  }

  _onAudioError(e) {
    if (this.state.mode === 'dub') {
      const err = this.audioElement?.error || new Error('Dub audio element error');
      this.handlePlaybackError(err, this.currentGeneration);
    }
  }

  _onAudioEnded() {
    if (this.state.mode === 'dub') {
      this.state.status = 'ready';
      this._notify();
    }
  }

  /**
   * INVARIANT ENFORCEMENT:
   * ORIGINAL MODE: video unmuted (following user pref), dub audio OFF (paused & muted=true).
   * DUB MODE: video strictly MUTED (muted=true, volume=0), dub audio ON.
   */
  enforceMuteInvariant() {
    const v = this.videoElement;
    const a = this.audioElement;

    if (this.state.mode === 'dub') {
      if (v) {
        v.muted = true;
        v.volume = 0;
      }
      if (a) {
        a.muted = this.isMuted;
        a.volume = this.isMuted ? 0 : this.volume;
      }
    } else {
      // Original mode
      if (v) {
        v.muted = this.isMuted;
        v.volume = this.isMuted ? 0 : this.volume;
      }
      if (a) {
        a.pause();
        a.muted = true;
        a.volume = 0;
      }
    }

    // Dev assertion
    if (process.env.NODE_ENV !== 'production' && v && a) {
      const bothProducingSound = (!v.muted && v.volume > 0 && !v.paused) && (!a.muted && a.volume > 0 && !a.paused);
      if (bothProducingSound) {
        console.error('[AudioController INVARIANT VIOLATION] Double audio detected! Muting video audio immediately.');
        v.muted = true;
        v.volume = 0;
      }
    }
  }

  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, typeof vol === 'number' ? vol : 1));
    this.volume = clamped;
    this.enforceMuteInvariant();
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    this.enforceMuteInvariant();
  }

  setPlaybackRate(rate) {
    const validRate = (typeof rate === 'number' && rate > 0) ? rate : 1;
    this.playbackRate = validRate;
    if (this.audioElement) {
      this.audioElement.playbackRate = validRate;
    }
  }

  /**
   * TWO-PHASE AUDIO SWITCH WITH GENERATION TOKEN
   */
  async switchTrack(trackDescriptor) {
    const token = ++this.currentGeneration;
    const prevTrack = { ...this.state };

    if (!trackDescriptor || trackDescriptor.mode === 'original' || !trackDescriptor.url) {
      // Switch to Original Audio
      this.state = {
        mode: 'original',
        language: trackDescriptor?.language || 'original',
        sourceUrl: null,
        normalizedUrl: null,
        trackId: trackDescriptor?.trackId || `original:${trackDescriptor?.language || 'en'}`,
        generation: token,
        status: (this.videoElement && !this.videoElement.paused) ? 'playing' : 'ready',
        error: null
      };

      this._stopSyncLoop();
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement.removeAttribute('src');
        this.audioElement.load();
      }

      this.enforceMuteInvariant();
      this._notify();

      this._logTelemetry('SWITCH', {
        from: prevTrack.language,
        to: this.state.language,
        mode: 'original',
        reason: 'user_selected_original',
        token
      });
      return;
    }

    // PHASE A — PREPARE (DUB MODE)
    const normalizedUrl = trackDescriptor.normalizedUrl || normalizeAudioUrl(trackDescriptor.url);
    const trackId = trackDescriptor.trackId || `dub:${trackDescriptor.language}:${normalizedUrl}`;

    this.state = {
      mode: 'dub',
      language: trackDescriptor.language,
      sourceUrl: trackDescriptor.url,
      normalizedUrl,
      trackId,
      generation: token,
      status: 'switching',
      error: null
    };
    this._notify();

    if (!this.audioElement) {
      this.handlePlaybackError(new Error('Audio API not available in this environment'), token);
      return;
    }

    const a = this.audioElement;
    const v = this.videoElement;

    try {
      a.pause();
      a.playbackRate = this.playbackRate;
      a.muted = this.isMuted;
      a.volume = this.isMuted ? 0 : this.volume;

      // Set source only if different
      const currentSrcNorm = normalizeAudioUrl(a.src);
      if (currentSrcNorm !== normalizedUrl) {
        a.src = trackDescriptor.url;
        a.load();
      }

      const targetTime = v ? v.currentTime : 0;
      if (a.readyState >= 1) { // HAVE_METADATA or higher
        a.currentTime = targetTime;
      } else {
        const onMeta = () => {
          if (this.currentGeneration === token) {
            a.currentTime = v ? v.currentTime : targetTime;
          }
          a.removeEventListener('loadedmetadata', onMeta);
        };
        a.addEventListener('loadedmetadata', onMeta);
      }

      // Wait for media readiness
      await this._waitForMediaReady(a, token);

      // Check race condition
      if (this.currentGeneration !== token) {
        return; // Discard stale load
      }

      // PHASE B — COMMIT
      this.state.status = (v && !v.paused && !v.ended) ? 'playing' : 'ready';
      this.enforceMuteInvariant();
      this._startSyncLoop();
      this._notify();

      this._logTelemetry('ACTIVATED', {
        language: trackDescriptor.language,
        source: trackDescriptor.source || 'generated',
        url: trackDescriptor.url,
        trackId,
        mode: 'dub',
        token
      });

      if (v && !v.paused && !v.ended) {
        this._startDubPlayback(token);
      }

    } catch (err) {
      if (this.currentGeneration !== token) return;
      console.warn('[AudioController] Error during track switch:', err);
      this.handlePlaybackError(err, token, prevTrack);
    }
  }

  _waitForMediaReady(audio, token, timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
      if (audio.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
        return resolve();
      }

      let timer = null;

      const onCanPlay = () => {
        cleanup();
        resolve();
      };

      const onError = (e) => {
        cleanup();
        reject(audio.error || new Error('Failed to load audio track'));
      };

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        audio.removeEventListener('canplay', onCanPlay);
        audio.removeEventListener('error', onError);
      };

      audio.addEventListener('canplay', onCanPlay);
      audio.addEventListener('error', onError);

      timer = setTimeout(() => {
        cleanup();
        // If readyState is at least HAVE_METADATA, allow proceeding
        if (audio.readyState >= 1) {
          resolve();
        } else {
          reject(new Error(`Timeout (${timeoutMs}ms) waiting for audio track readiness`));
        }
      }, timeoutMs);
    });
  }

  _startDubPlayback(token) {
    if (!this.audioElement || this.state.mode !== 'dub') return;
    const a = this.audioElement;
    const v = this.videoElement;

    if (v) {
      const drift = Math.abs(v.currentTime - a.currentTime);
      if (drift > 0.08) {
        a.currentTime = v.currentTime;
      }
    }

    this.enforceMuteInvariant();

    const p = a.play();
    if (p && typeof p.catch === 'function') {
      p.then(() => {
        if (this.currentGeneration === token && this.state.mode === 'dub') {
          this.state.status = 'playing';
          this._notify();
        }
      }).catch(err => {
        if (this.currentGeneration !== token) return;
        if (err.name === 'NotAllowedError') {
          // Autoplay policy restriction - user must interact
          this.state.status = 'paused';
          this._notify();
        } else if (err.name === 'AbortError') {
          // Rapid interruption - expected
        } else {
          this.handlePlaybackError(err, token);
        }
      });
    }
  }

  handlePlaybackError(err, token, rollbackTrack = null) {
    if (this.currentGeneration !== token) return;
    this.state.error = err;
    this.state.status = 'error';
    this._notify();

    // Rollback to original audio safely so video is never left silently muted
    console.warn('[AudioController] Falling back to original audio due to playback failure:', err.message);
    this.switchTrack({ mode: 'original', language: 'original' });
  }

  handleVideoPlay() {
    if (this.state.mode === 'dub') {
      this._startDubPlayback(this.currentGeneration);
    } else {
      this.enforceMuteInvariant();
    }
  }

  handleVideoPlaying() {
    if (this.state.mode === 'dub') {
      if (this.audioElement && this.audioElement.paused) {
        this._startDubPlayback(this.currentGeneration);
      }
    }
  }

  handleVideoPause() {
    if (this.state.mode === 'dub' && this.audioElement) {
      this.audioElement.pause();
      this.state.status = 'paused';
      this._notify();
    }
  }

  handleVideoSeeking() {
    this.isSeeking = true;
  }

  handleVideoSeeked() {
    this.isSeeking = false;
    if (this.state.mode === 'dub' && this.audioElement && this.videoElement) {
      this.audioElement.currentTime = this.videoElement.currentTime;
      if (!this.videoElement.paused) {
        this._startDubPlayback(this.currentGeneration);
      }
    }
  }

  handleVideoRateChange() {
    if (this.videoElement) {
      this.setPlaybackRate(this.videoElement.playbackRate);
    }
  }

  handleVideoVolumeChange() {
    // If native video volume was changed externally, enforce invariant
    this.enforceMuteInvariant();
  }

  handleVideoEnded() {
    if (this.state.mode === 'dub' && this.audioElement) {
      this.audioElement.pause();
      this.state.status = 'ready';
      this._notify();
    }
  }

  handleVideoWaiting() {
    if (this.state.mode === 'dub' && this.audioElement) {
      this.audioElement.pause();
    }
  }

  _startSyncLoop() {
    this._stopSyncLoop();
    this.syncIntervalId = setInterval(() => this.syncClock(), 120);
  }

  _stopSyncLoop() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * BOUNDED DRIFT MASTER-CLOCK SYNCHRONIZATION
   * Video is authoritative clock. Dub audio follows video.currentTime.
   */
  syncClock() {
    if (this.state.mode !== 'dub' || !this.audioElement || !this.videoElement || this.isSeeking) {
      return;
    }

    const v = this.videoElement;
    const a = this.audioElement;

    if (v.paused || v.seeking || a.seeking || a.readyState < 2) {
      return;
    }

    const drift = Math.abs(v.currentTime - a.currentTime);

    // Bounded correction strategy:
    // 1. < 50ms: do nothing (imperceptible, preserves audio pitch and prevents clicks)
    if (drift < 0.05) {
      return;
    }

    // 2. Moderate drift (50ms - 250ms): gentle rate-skew catch-up
    if (drift <= 0.25) {
      const isDubAhead = a.currentTime > v.currentTime;
      const skew = isDubAhead ? 0.96 : 1.04;
      a.playbackRate = this.playbackRate * skew;
      this.onDriftCorrect?.(v.currentTime, drift);
      return;
    }

    // 3. Large drift (> 250ms): hard seek alignment
    a.playbackRate = this.playbackRate;
    a.currentTime = v.currentTime;
    this.onDriftCorrect?.(v.currentTime, drift);
  }

  _logTelemetry(type, data) {
    if (typeof console !== 'undefined' && console.info) {
      if (type === 'ACTIVATED') {
        console.info(
          `[AITutor Audio] TRACK ACTIVATED\n` +
          `  language: ${data.language}\n` +
          `  source:   ${data.source}\n` +
          `  url:      ${data.url}\n` +
          `  trackId:  ${data.trackId}\n` +
          `  mode:     ${data.mode}`
        );
      } else if (type === 'SWITCH') {
        console.info(
          `[AITutor Audio] TRACK SWITCH\n` +
          `  from:   ${data.from}\n` +
          `  to:     ${data.to}\n` +
          `  reason: ${data.reason}`
        );
      }
    }
  }

  destroy() {
    this.currentGeneration++;
    this._stopSyncLoop();
    this._detachVideo();

    if (this.audioElement) {
      const a = this.audioElement;
      a.pause();
      a.removeAttribute('src');
      a.load();

      if (this.boundListeners.audioCanPlay) a.removeEventListener('canplay', this.boundListeners.audioCanPlay);
      if (this.boundListeners.audioPlaying) a.removeEventListener('playing', this.boundListeners.audioPlaying);
      if (this.boundListeners.audioPause) a.removeEventListener('pause', this.boundListeners.audioPause);
      if (this.boundListeners.audioWaiting) a.removeEventListener('waiting', this.boundListeners.audioWaiting);
      if (this.boundListeners.audioError) a.removeEventListener('error', this.boundListeners.audioError);
      if (this.boundListeners.audioEnded) a.removeEventListener('ended', this.boundListeners.audioEnded);
      this.audioElement = null;
    }

    this.listeners.clear();
    this.state.status = 'stopped';
  }
}

export default AudioController;
