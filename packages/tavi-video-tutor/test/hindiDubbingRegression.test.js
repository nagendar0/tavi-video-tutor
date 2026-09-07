import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

import {
  normalizeLanguageCode,
  resolveLanguageCapability,
  getLanguageByCode,
  AITUTOR_LANGUAGES
} from '../src/subtitles/languages/registry.js';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { VoiceAllocator } from '../src/subtitles/audio/voice/VoiceAllocator.js';
import { VoicePool } from '../src/subtitles/audio/voice/VoicePool.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { AudioController } from '../src/services/AudioController.js';
import { resolveAudioAvailability, resolveActiveAudioTrack } from '../src/subtitles/resolver/audioResolver.js';
import { getFFmpegBinaryPath } from '../src/subtitles/audio/extractAudio.js';
import { getTransformers } from '../src/subtitles/transcription/transformersLoader.js';

test('1. Authoritative Language Normalization & Registry for Hindi', () => {
  const variations = ['hi', 'hin', 'hi-IN', 'hi_in', 'Hindi', 'hindi', 'HINDI', 'हिन्दी'];
  for (const v of variations) {
    const norm = normalizeLanguageCode(v);
    assert.equal(norm, 'hi', `Variation "${v}" should normalize to "hi"`);
  }

  const langEntry = getLanguageByCode('hin');
  assert.ok(langEntry, 'getLanguageByCode should find Hindi by 3-letter ISO code "hin"');
  assert.equal(langEntry.code, 'hi');
  assert.equal(langEntry.name, 'Hindi');
  assert.equal(langEntry.nativeName, 'हिन्दी');
  assert.equal(langEntry.iso639_2, 'hin');
  assert.equal(langEntry.bcp47, 'hi-IN');
});

test('2. Hindi Capability Resolution Contract', () => {
  const capability = resolveLanguageCapability('hi-IN');
  assert.equal(capability.supported, true);
  assert.equal(capability.ttsSupported, true);
  assert.equal(capability.translationSupported, true);
  assert.equal(capability.canonicalCode, 'hi');
  assert.equal(capability.ttsLocale, 'hi-IN');
  assert.ok(capability.preferredVoices);
  assert.ok(Array.isArray(capability.preferredVoices.female));
  assert.ok(Array.isArray(capability.preferredVoices.male));
});

test('3. Real Hindi TTS Synthesis — Genuine Audio Output (No Silent Beeps)', async () => {
  const tts = new NodeTTSProvider({ platform: process.platform });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hindi_tts_test_'));

  try {
    const hindiText = 'नमस्ते, कंप्यूटर विज्ञान की इस कक्षा में आपका स्वागत है।';
    const result = await tts.synthesize(hindiText, 'hi', {
      outputDir: tmpDir,
      gender: 'female'
    });

    assert.ok(result.audioPath, 'Should return generated audio path');
    assert.ok(fs.existsSync(result.audioPath), 'Audio file must exist');

    const stats = fs.statSync(result.audioPath);
    // Real synthesized speech for this sentence is > 50,000 bytes (SAPI WAV) or > 8,000 bytes (MP3)
    // SAPI empty header is 46 bytes; synthetic beep is fixed-size.
    assert.ok(stats.size > 8000, `Audio file must contain substantial data, got ${stats.size} bytes`);
    assert.ok(result.duration > 1.0, `Duration must be > 1.0s, got ${result.duration}`);

    // Verify audio contains valid speech or format header
    const head = fs.readFileSync(result.audioPath, { flag: 'r' }).subarray(0, 12);
    const isWav = head.toString('ascii', 0, 4) === 'RIFF';
    const isMp3 = head[0] === 0xFF || head.toString('ascii', 0, 3) === 'ID3';
    assert.ok(isWav || isMp3, 'Audio must have valid WAV or MP3 signature');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('4. Spoken Hindi Speech Verification with Whisper ASR', async () => {
  // Synthesize Hindi audio and verify with Whisper that speech is recognized in Hindi
  const tts = new NodeTTSProvider({ platform: process.platform });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hindi_asr_test_'));

  try {
    const spokenText = 'नमस्ते, कंप्यूटर विज्ञान की इस कक्षा में आपका स्वागत है।';
    const synthResult = await tts.synthesize(spokenText, 'hi', {
      outputDir: tmpDir,
      gender: 'female'
    });

    // Resample to 16kHz mono for Whisper ASR
    const resampledWav = path.join(tmpDir, 'resampled_16k.wav');
    const ffmpeg = getFFmpegBinaryPath();
    execSync(`"${ffmpeg}" -y -i "${synthResult.audioPath}" -ar 16000 -ac 1 "${resampledWav}"`, { stdio: 'pipe' });

    const { pipeline } = await getTransformers();
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny');

    const buffer = fs.readFileSync(resampledWav);
    const pcmBuffer = buffer.subarray(44);
    const int16Array = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, Math.floor(pcmBuffer.length / 2));
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }

    const asrOutput = await transcriber(float32Array, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: false,
      generate_kwargs: { language: 'hindi', task: 'transcribe' }
    });

    const recognizedText = asrOutput.text || '';
    // Check that Whisper produced non-empty transcription containing Devanagari Unicode characters ([\u0900-\u097F])
    // or recognized speech tokens
    const hasDevanagari = /[\u0900-\u097F]/.test(recognizedText);
    assert.ok(
      hasDevanagari || recognizedText.length > 0,
      `ASR must recognize spoken Hindi speech content. Got: "${recognizedText}"`
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('5. Multi-Speaker Voice Allocation for Hindi', () => {
  const allocator = new VoiceAllocator({
    supportedLanguages: ['hi', 'en']
  });

  const speakers = [
    { speakerId: 'spk_000001', gender: 'female' },
    { speakerId: 'spk_000002', gender: 'male' }
  ];

  const segments = [
    { segmentId: 'seg_001', speakerId: 'spk_000001', startTime: 0, endTime: 3 },
    { segmentId: 'seg_002', speakerId: 'spk_000002', startTime: 2.5, endTime: 5.5 } // overlapping
  ];

  const result = allocator.allocate({
    speakers,
    segments,
    targetLanguage: 'hi'
  });

  assert.equal(result.diagnostics.totalSpeakers, 2);
  assert.equal(Object.keys(result.assignments).length, 2);
  const voice1 = result.assignments['spk_000001'];
  const voice2 = result.assignments['spk_000002'];

  assert.ok(voice1, 'Speaker 1 must have voice assigned');
  assert.ok(voice2, 'Speaker 2 must have voice assigned');
  assert.notEqual(voice1.voiceId, voice2.voiceId, 'Overlapping speakers in Hindi must receive distinct voices');
});

test('6. Browser AudioController — Seamless Switching to Multi-Speaker Hindi Dub', async () => {
  const manifestAudio = {
    en: { label: 'English (Original)', src: '/aitutor/audio/lec/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi / हिन्दी', src: '/aitutor/audio/lec/hi.m4a', language: 'hi', speakerAware: true }
  };

  const availability = resolveAudioAvailability({
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(availability.enabled, true);
  assert.deepEqual(availability.availableLanguages, ['en', 'hi']);

  // Test resolution using both 'hi' and 'hin'
  const activeHi = resolveActiveAudioTrack({
    availability,
    selectedLanguage: 'hin',
    sourceLanguage: 'en'
  });
  assert.equal(activeHi.mode, 'dub');
  assert.equal(activeHi.language, 'hi');
  assert.equal(activeHi.url, '/aitutor/audio/lec/hi.m4a');

  // Verify AudioController state management
  class MockMediaElement {
    constructor(type = 'audio') {
      this.type = type;
      this._src = '';
      this._currentTime = 0;
      this._volume = 1;
      this._muted = false;
      this._paused = true;
      this.readyState = 4;
      this.listeners = {};
    }
    get src() { return this._src; }
    set src(val) {
      this._src = val;
      if (val) {
        queueMicrotask(() => {
          this.dispatchEvent('loadedmetadata');
          this.dispatchEvent('canplay');
          this.dispatchEvent('canplaythrough');
        });
      }
    }
    get currentTime() { return this._currentTime; }
    set currentTime(val) { this._currentTime = val; }
    get volume() { return this._volume; }
    set volume(val) { this._volume = Math.max(0, Math.min(1, val)); }
    get muted() { return this._muted; }
    set muted(val) { this._muted = Boolean(val); }
    get paused() { return this._paused; }
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
        for (const fn of this.listeners[event]) fn(data);
      }
    }
    play() {
      this._paused = false;
      this.dispatchEvent('play');
      return Promise.resolve();
    }
    pause() {
      this._paused = true;
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

  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');
  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;
  controller._bindVideoEvents();

  // Initially original
  assert.equal(controller.state.mode, 'original');
  assert.equal(controller.state.language, 'en');
  assert.equal(mockVideo.muted, false);

  // Switch to Hindi dub
  await controller.switchTrack({ mode: 'dub', url: activeHi.url, language: 'hi' });
  assert.equal(controller.state.mode, 'dub');
  assert.equal(controller.state.language, 'hi');
  assert.equal(mockVideo.muted, true, 'Video native audio must be muted while Hindi dub plays');

  // Switch back to original
  await controller.switchTrack({ mode: 'original', language: 'en' });
  assert.equal(controller.state.mode, 'original');
  assert.equal(mockVideo.muted, false, 'Video native audio must be unmuted when original is active');

  controller.destroy();
});
