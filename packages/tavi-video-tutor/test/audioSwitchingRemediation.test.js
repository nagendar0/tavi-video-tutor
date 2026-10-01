import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioController, AUDIO_ERROR_CODES, mapAudioErrorCode } from '../src/services/AudioController.js';

// Enhanced MockMediaElement for comprehensive audio switching tests
class MockMediaElement {
  constructor(type = 'audio') {
    this.type = type;
    this.src = '';
    this.currentSrc = '';
    this._currentTime = 0;
    this._volume = 1;
    this._muted = false;
    this._playbackRate = 1;
    this._paused = true;
    this._ended = false;
    this._seeking = false;
    this.readyState = 4; // HAVE_ENOUGH_DATA
    this.error = null;
    this.listeners = {};
    this.playCallCount = 0;
    this.pauseCallCount = 0;
    this.loadCallCount = 0;
    this.failOnLoad = false;
    this.failError = null;
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
      for (const fn of [...this.listeners[event]]) {
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
    this.loadCallCount++;
    this.currentSrc = this.src;
    if (this.failOnLoad) {
      this.error = this.failError || { code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED' };
      this.readyState = 0;
      setTimeout(() => this.dispatchEvent('error', { error: this.error }), 5);
      return;
    }
    setTimeout(() => {
      this.dispatchEvent('loadedmetadata');
      this.dispatchEvent('canplay');
    }, 5);
  }

  removeAttribute(attr) {
    if (attr === 'src') {
      this.src = '';
      this.currentSrc = '';
    }
  }
}

test('1. Video source invariant — video.src and video.currentSrc NEVER change during audio switching', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockVideo.src = 'http://localhost:5173/demo-video.mp4';
  mockVideo.currentSrc = 'http://localhost:5173/demo-video.mp4';
  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  const originalSrc = mockVideo.src;
  const originalCurrentSrc = mockVideo.currentSrc;

  // Switch to Hindi
  await controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });
  assert.equal(mockVideo.src, originalSrc, 'video.src must remain identical after switching to Hindi');
  assert.equal(mockVideo.currentSrc, originalCurrentSrc, 'video.currentSrc must remain identical after switching to Hindi');

  // Switch to Telugu
  await controller.switchTrack({ mode: 'dub', language: 'te', url: '/demo-audio/demo-te.m4a' });
  assert.equal(mockVideo.src, originalSrc, 'video.src must remain identical after switching to Telugu');
  assert.equal(mockVideo.currentSrc, originalCurrentSrc, 'video.currentSrc must remain identical after switching to Telugu');

  // Switch to Spanish
  await controller.switchTrack({ mode: 'dub', language: 'es', url: '/demo-audio/demo-es.m4a' });
  assert.equal(mockVideo.src, originalSrc, 'video.src must remain identical after switching to Spanish');
  assert.equal(mockVideo.currentSrc, originalCurrentSrc, 'video.currentSrc must remain identical after switching to Spanish');

  // Switch back to Original
  await controller.switchTrack({ mode: 'original', language: 'en' });
  assert.equal(mockVideo.src, originalSrc, 'video.src must remain identical after restoring Original');
  assert.equal(mockVideo.currentSrc, originalCurrentSrc, 'video.currentSrc must remain identical after restoring Original');

  controller.destroy();
});

test('2. video.load() remains 0 during audio switching', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockVideo.src = '/demo-video.mp4';
  mockVideo.loadCallCount = 0;
  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  // Perform multiple track transitions
  await controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });
  await controller.switchTrack({ mode: 'dub', language: 'te', url: '/demo-audio/demo-te.m4a' });
  await controller.switchTrack({ mode: 'original', language: 'original' });

  assert.equal(mockVideo.loadCallCount, 0, 'video.load() MUST NOT be called at all during audio switching');
  controller.destroy();
});

test('3. Audio source changes correctly', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  // Hindi
  await controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });
  assert.equal(mockAudio.src, '/demo-audio/demo-hi.m4a');

  // Telugu
  await controller.switchTrack({ mode: 'dub', language: 'te', url: '/demo-audio/demo-te.m4a' });
  assert.equal(mockAudio.src, '/demo-audio/demo-te.m4a');

  // Spanish
  await controller.switchTrack({ mode: 'dub', language: 'es', url: '/demo-audio/demo-es.m4a' });
  assert.equal(mockAudio.src, '/demo-audio/demo-es.m4a');

  controller.destroy();
});

test('4. Audio clock advances alongside video master clock', () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });
  mockVideo._paused = false;
  mockAudio._paused = false;

  mockVideo.currentTime = 12.4;
  mockAudio.currentTime = 12.0; // 400ms drift (>250ms triggers hard align)

  controller.syncClock();
  assert.equal(mockAudio.currentTime, 12.4, 'Audio currentTime must align with master video time');

  controller.destroy();
});

test('5. Video muted during dub', async () => {
  const controller = new AudioController({ sourceLanguage: 'en', volume: 0.8 });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  await controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });

  assert.equal(mockVideo.muted, true, 'Video must be muted in dub mode');
  assert.equal(mockVideo.volume, 0, 'Video volume must be 0 in dub mode');
  assert.equal(mockAudio.muted, false, 'Audio must not be muted in dub mode');
  assert.equal(mockAudio.volume, 0.8, 'Audio volume must match controller volume');

  controller.destroy();
});

test('6. Original restoration', async () => {
  const controller = new AudioController({ sourceLanguage: 'en', volume: 0.9, isMuted: false });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  await controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });
  assert.equal(mockVideo.muted, true);

  // Restore Original
  await controller.switchTrack({ mode: 'original', language: 'en' });

  assert.equal(mockVideo.muted, false, 'Video must be unmuted after returning to original');
  assert.equal(mockVideo.volume, 0.9, 'Video volume must be restored after returning to original');
  assert.equal(mockAudio.paused, true, 'Dub audio must be paused');
  assert.equal(mockAudio.src, '', 'Dub audio source must be detached');

  controller.destroy();
});

test('7. Audio-specific loading state (without video buffering)', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  let stateWhileLoading = null;
  controller.subscribe((state) => {
    if (state.status === 'loading') {
      stateWhileLoading = { ...state };
    }
  });

  // Start switch to Hindi
  const switchPromise = controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });

  assert.notEqual(stateWhileLoading, null, 'Must emit loading status on track switch');
  assert.equal(stateWhileLoading.status, 'loading');
  assert.equal(stateWhileLoading.language, 'hi');
  assert.equal(stateWhileLoading.requestedLanguage, 'hi');

  await switchPromise;
  assert.equal(controller.state.status, 'ready');

  controller.destroy();
});

test('8. Audio-specific error state exposes typed code and details', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockAudio.failOnLoad = true;
  mockAudio.failError = { code: 4, message: 'Not supported' };

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  await controller.switchTrack({ mode: 'dub', language: 'hi', url: '/invalid/hi.m4a' });

  assert.equal(controller.state.status, 'error');
  assert.notEqual(controller.state.audioError, null);
  assert.equal(controller.state.audioError.language, 'hi');
  assert.equal(controller.state.audioError.code, AUDIO_ERROR_CODES.UNAVAILABLE);
  assert.equal(typeof controller.state.audioError.message, 'string');

  controller.destroy();
});

test('9. No silent rollback without error reporting', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockAudio.failOnLoad = true;
  mockAudio.failError = { code: 2, message: 'Network error' };

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  const states = [];
  controller.subscribe((st) => states.push({ ...st }));

  await controller.switchTrack({ mode: 'dub', language: 'te', url: '/broken-net/te.m4a' });

  // Verify that an error state was officially emitted
  const errorEvent = states.find(s => s.status === 'error');
  assert.notEqual(errorEvent, undefined, 'An error state MUST be emitted when dub fails');
  assert.equal(errorEvent.audioError.language, 'te');
  assert.equal(errorEvent.audioError.code, AUDIO_ERROR_CODES.NETWORK_ERROR);

  // Safety recovery: video unmuted
  assert.equal(mockVideo.muted, false, 'Video must be unmuted for safe audio output');
  // But controller state must retain error and requested language
  assert.equal(controller.state.status, 'error');
  assert.equal(controller.state.requestedLanguage, 'te');

  controller.destroy();
});

test('10. Invalid Hindi audio failure handling', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockAudio.failOnLoad = true;
  mockAudio.failError = { code: 4, message: 'MEDIA_ERR_SRC_NOT_SUPPORTED 404' };

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  await controller.switchTrack({ mode: 'dub', language: 'hi', url: 'https://invalid-url.com/nonexistent_hi.m4a' });

  assert.equal(controller.state.status, 'error');
  assert.equal(controller.state.audioError.language, 'hi');
  assert.equal(controller.state.audioError.code, AUDIO_ERROR_CODES.UNAVAILABLE);
  assert.equal(mockVideo.muted, false, 'Original video audio restored for user safety');
  assert.equal(mockAudio.paused, true, 'Failed dub audio is paused');

  controller.destroy();
});

test('11. Invalid Telugu audio failure handling', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockAudio.failOnLoad = true;
  mockAudio.failError = { code: 3, message: 'MEDIA_ERR_DECODE corrupt file' };

  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  await controller.switchTrack({ mode: 'dub', language: 'te', url: '/corrupt/te.m4a' });

  assert.equal(controller.state.status, 'error');
  assert.equal(controller.state.audioError.language, 'te');
  assert.equal(controller.state.audioError.code, AUDIO_ERROR_CODES.DECODE_FAILED);
  assert.equal(mockVideo.muted, false);

  controller.destroy();
});

test('12. Valid Hindi audio success transition', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockVideo._paused = false; // Video is playing
  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  await controller.switchTrack({ mode: 'dub', language: 'hi', url: '/demo-audio/demo-hi.m4a' });

  assert.equal(controller.state.status, 'playing');
  assert.equal(controller.state.language, 'hi');
  assert.equal(controller.state.audioError, null);
  assert.equal(mockVideo.muted, true, 'Video must be muted');
  assert.equal(mockAudio.paused, false, 'Audio must be playing');

  controller.destroy();
});

test('13. Valid Telugu audio success transition', async () => {
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');

  mockVideo._paused = false;
  controller.attachVideo(mockVideo);
  controller.audioElement = mockAudio;

  await controller.switchTrack({ mode: 'dub', language: 'te', url: '/demo-audio/demo-te.m4a' });

  assert.equal(controller.state.status, 'playing');
  assert.equal(controller.state.language, 'te');
  assert.equal(controller.state.audioError, null);
  assert.equal(mockVideo.muted, true);
  assert.equal(mockAudio.paused, false);

  controller.destroy();
});
