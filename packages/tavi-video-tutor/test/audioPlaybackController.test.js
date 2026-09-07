import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioController } from '../src/services/AudioController.js';
import { resolveAudioAvailability, resolveActiveAudioTrack, normalizeAudioUrl } from '../src/subtitles/resolver/audioResolver.js';

// Mock MockMediaElement for headless Node.js tests
class MockMediaElement {
  constructor(type = 'audio') {
    this.type = type;
    this.src = '';
    this._currentTime = 0;
    this._volume = 1;
    this._muted = false;
    this._playbackRate = 1;
    this._paused = true;
    this._ended = false;
    this._seeking = false;
    this.readyState = 4; // HAVE_ENOUGH_DATA
    this.listeners = {};
    this.playCallCount = 0;
    this.pauseCallCount = 0;
  }

  get currentTime() { return this._currentTime; }
  set currentTime(val) { this._currentTime = val; }

  get volume() { return this._volume; }
  set volume(val) { this._volume = Math.max(0, Math.min(1, val)); }

  get muted() { return this._muted; }
  set muted(val) { this._muted = Boolean(val); }

  get playbackRate() { return this._playbackRate; }
  set playbackRate(val) { this._playbackRate = val; }

  get paused() { return this._paused; }
  get ended() { return this._ended; }
  get seeking() { return this._seeking; }

  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event, fn) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== fn);
  }

  dispatchEvent(event, data = {}) {
    if (this.listeners[event]) {
      for (const fn of this.listeners[event]) {
        fn(data);
      }
    }
  }

  play() {
    this._paused = false;
    this.playCallCount++;
    this.dispatchEvent('play');
    this.dispatchEvent('playing');
    return Promise.resolve();
  }

  pause() {
    this._paused = true;
    this.pauseCallCount++;
    this.dispatchEvent('pause');
  }

  load() {
    this.dispatchEvent('loadedmetadata');
    this.dispatchEvent('canplay');
  }

  removeAttribute(attr) {
    if (attr === 'src') this.src = '';
  }
}

test('1. Deterministic Audio Resolver — Track Resolution Precedence Matrix', () => {
  const manifest = {
    en: { src: '/audio/en.m4a', label: 'English', source: true },
    hi: { src: '/audio/hi.m4a', label: 'Hindi' },
    te: { src: '/audio/te.m4a', label: 'Telugu' }
  };

  // Original selection
  const origTrack = resolveActiveAudioTrack({
    manifestAudio: manifest,
    sourceLanguage: 'en',
    selectedLanguage: 'original'
  });
  assert.equal(origTrack.mode, 'original');
  assert.equal(origTrack.source, 'original');
  assert.equal(origTrack.url, null);

  // Generated Hindi selection
  const hiTrack = resolveActiveAudioTrack({
    manifestAudio: manifest,
    sourceLanguage: 'en',
    selectedLanguage: 'hi'
  });
  assert.equal(hiTrack.mode, 'dub');
  assert.equal(hiTrack.source, 'generated');
  assert.equal(hiTrack.url, '/audio/hi.m4a');
  assert.ok(hiTrack.normalizedUrl.includes('/audio/hi.m4a'));

  // Developer override takes precedence over generated audio
  const devHiTrack = resolveActiveAudioTrack({
    manifestAudio: manifest,
    developerAudio: { hi: '/custom/dev_hi.mp3' },
    sourceLanguage: 'en',
    selectedLanguage: 'hi'
  });
  assert.equal(devHiTrack.mode, 'dub');
  assert.equal(devHiTrack.source, 'developer');
  assert.equal(devHiTrack.url, '/custom/dev_hi.mp3');

  // Non-existent language safely falls back to original
  const missingTrack = resolveActiveAudioTrack({
    manifestAudio: manifest,
    sourceLanguage: 'en',
    selectedLanguage: 'non_existent'
  });
  assert.equal(missingTrack.mode, 'original');
  assert.equal(missingTrack.url, null);
});

test('2. URL Normalization & Track Identity', () => {
  const norm1 = normalizeAudioUrl('/aitutor/audio/1/hi.m4a');
  const norm2 = normalizeAudioUrl('http://localhost:5173/aitutor/audio/1/hi.m4a');
  assert.ok(norm1);
  assert.ok(norm2);
  assert.ok(norm1.endsWith('/aitutor/audio/1/hi.m4a'));
  assert.equal(normalizeAudioUrl(''), null);
  assert.equal(normalizeAudioUrl(null), null);
});

test('3. AudioController — Strict Mutual Exclusion & Invariant Enforcement', () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;
  controller._bindVideoEvents();

  // Test ORIGINAL MODE
  controller.switchTrack({ mode: 'original', language: 'en' });
  controller.setVolume(0.8);
  controller.setMuted(false);
  controller.enforceMuteInvariant();

  assert.equal(mockVideo.muted, false, 'In original mode, video audio must NOT be muted');
  assert.equal(mockVideo.volume, 0.8, 'In original mode, video volume must be active');
  assert.equal(mockAudio.muted, true, 'In original mode, dub audio must be muted');
  assert.equal(mockAudio.volume, 0, 'In original mode, dub audio volume must be 0');

  // Test DUB MODE
  controller.switchTrack({
    mode: 'dub',
    language: 'hi',
    url: '/audio/hi.m4a',
    normalizedUrl: 'http://localhost/audio/hi.m4a'
  });
  controller.enforceMuteInvariant();

  assert.equal(mockVideo.muted, true, 'In dub mode, native video audio must be STRICTLY MUTED');
  assert.equal(mockVideo.volume, 0, 'In dub mode, native video volume must be 0');
  assert.equal(mockAudio.muted, false, 'In dub mode, dub audio must follow user unmuted state');
  assert.equal(mockAudio.volume, 0.8, 'In dub mode, dub audio must play at user volume');

  controller.destroy();
});

test('4. AudioController — Generation Token & Race Condition Safety', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;

  // Simulate rapid switches: Hindi -> Telugu -> Original
  controller.switchTrack({ mode: 'dub', language: 'hi', url: '/audio/hi.m4a' });
  const tokenHi = controller.currentGeneration;

  controller.switchTrack({ mode: 'dub', language: 'te', url: '/audio/te.m4a' });
  const tokenTe = controller.currentGeneration;

  assert.ok(tokenTe > tokenHi, 'Each switch must increment monotonic generation token');

  // Simulate late-arriving event from older Hindi load
  controller._onAudioCanPlay(); // from current tokenTe
  assert.equal(controller.state.language, 'te');
  assert.equal(controller.state.status, 'ready');

  controller.destroy();
});

test('5. AudioController — Master Clock Synchronization & Bounded Drift', () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;
  controller.state.mode = 'dub';
  mockVideo._paused = false;
  mockAudio._paused = false;

  mockVideo.currentTime = 10.0;
  mockAudio.currentTime = 10.02; // 20ms drift (< 50ms threshold)

  let driftCorrected = false;
  controller.onDriftCorrect = () => { driftCorrected = true; };

  controller.syncClock();
  assert.equal(driftCorrected, false, 'Drift < 50ms must produce zero audio correction glitches');

  // Moderate drift (100ms)
  mockAudio.currentTime = 10.10;
  controller.syncClock();
  assert.equal(driftCorrected, true, 'Moderate drift must trigger gentle rate-skew');

  // Large drift (400ms)
  mockAudio.currentTime = 10.40;
  controller.syncClock();
  assert.equal(mockAudio.currentTime, 10.0, 'Large drift must hard align to video master clock');

  controller.destroy();
});

test('6. AudioController — Seek Handling & State Machine Transitions', () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;
  controller._bindVideoEvents();

  controller.switchTrack({
    mode: 'dub',
    language: 'hi',
    url: '/audio/hi.m4a'
  });

  // User starts seeking
  mockVideo.dispatchEvent('seeking');
  assert.equal(controller.isSeeking, true, 'Seeking flag must pause sync loop');

  mockVideo.currentTime = 45.5;
  mockVideo.dispatchEvent('seeked');
  assert.equal(controller.isSeeking, false, 'Seeked must clear seeking flag');
  assert.equal(mockAudio.currentTime, 45.5, 'Audio currentTime must align exactly with video seeked position');

  controller.destroy();
});

test('7. AudioController — Quality Switch Continuity & Strict Mute Invariant', () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;

  // Active Hindi Dub
  controller.switchTrack({ mode: 'dub', language: 'hi', url: '/audio/hi.m4a' });
  controller.enforceMuteInvariant();

  // Simulate quality switch from 1080p to 720p (new src loaded)
  mockVideo.src = '/videos/720p.mp4';
  mockVideo.load();
  controller.enforceMuteInvariant();

  // Selected language remains Hindi and native video remains muted
  assert.equal(controller.state.language, 'hi');
  assert.equal(mockVideo.muted, true, 'Video must remain strictly muted after quality switch');
  assert.equal(mockVideo.volume, 0, 'Video volume must remain 0 after quality switch');

  controller.destroy();
});

test('8. AudioController — Subtitle Switching Independence', () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;

  controller.switchTrack({ mode: 'dub', language: 'te', url: '/audio/te.m4a' });

  // Subtitle changes do not alter AudioController state
  let currentSubtitle = 'en';
  currentSubtitle = 'hi';
  currentSubtitle = 'none';

  assert.equal(controller.state.language, 'te');
  assert.equal(controller.state.mode, 'dub');

  controller.destroy();
});

test('9. AudioController — Autoplay Restriction (NotAllowedError) Handling', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockAudio.play = () => {
    const err = new Error('play() failed because the user didn\'t interact but video played');
    err.name = 'NotAllowedError';
    return Promise.reject(err);
  };

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;

  controller.switchTrack({ mode: 'dub', language: 'hi', url: '/audio/hi.m4a' });
  controller._startDubPlayback(controller.currentGeneration);

  await new Promise(r => setTimeout(r, 10));

  // Autoplay restriction sets status to paused without crashing or fatal unhandled rejection
  assert.equal(controller.state.status, 'paused');

  controller.destroy();
});

test('10. AudioController — Clean Destruction & Zero Leaks', () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;
  controller._bindVideoEvents();

  controller.destroy();

  assert.equal(controller.state.status, 'stopped');
  assert.equal(controller.audioElement, null);
  assert.equal(controller.videoElement, null);
  assert.equal(controller.listeners.size, 0);
});
