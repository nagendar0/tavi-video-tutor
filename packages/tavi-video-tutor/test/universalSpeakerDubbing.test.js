import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { BoundedTaskQueue } from '../src/subtitles/audio/queue/BoundedTaskQueue.js';
import { SpeakerAudioCache } from '../src/subtitles/audio/cache/SpeakerAudioCache.js';
import { AudioTimelineEngine } from '../src/subtitles/audio/mixer/AudioTimelineEngine.js';
import { TimelineMixer } from '../src/subtitles/audio/mixer/TimelineMixer.js';
import { AudioController } from '../src/services/AudioController.js';
import { resolveAudioAvailability } from '../src/subtitles/resolver/audioResolver.js';

class MockTTSProvider {
  constructor(options = {}) {
    this.options = options;
    this.synthesizeCalls = [];
  }

  async synthesize(text, language, options = {}) {
    this.synthesizeCalls.push({ text, language, options });
    const outputDir = options.outputDir || os.tmpdir();
    fs.mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, `mock_${Date.now()}_${Math.random().toString(36).substring(2,6)}.wav`);
    // Minimal mock WAV
    const dummyBuf = Buffer.alloc(100);
    fs.writeFileSync(filePath, dummyBuf);
    return {
      audioPath: filePath,
      duration: 2.0,
      format: 'wav',
      voiceId: options.voiceId
    };
  }

  supportsLanguage(lang) {
    return true;
  }
}

class MockTranslator {
  supports(src, tgt) {
    return true;
  }

  async translateSegments(segments, src, tgt) {
    return segments.map((s, idx) => ({
      ...s,
      id: s.segmentId || s.id || `seg_${idx}`,
      speakerId: s.speakerId || 'spk_000001',
      start: s.startTime !== undefined ? s.startTime : s.start,
      end: s.endTime !== undefined ? s.endTime : s.end,
      text: `[${tgt.toUpperCase()}] ${s.text || s.originalText}`,
      translatedText: `[${tgt.toUpperCase()}] ${s.text || s.originalText}`
    }));
  }
}

test('1. BoundedTaskQueue — Concurrency Bounds, Retries & Failure Recovery (Phase 20 & 21)', async () => {
  const queue = new BoundedTaskQueue({ concurrency: 2, maxRetries: 2, retryDelayMs: 20 });
  let activeConcurrency = 0;
  let maxObservedConcurrency = 0;
  let retryCount = 0;

  // Task 1: Normal task
  queue.addTask('task_1', async () => {
    activeConcurrency++;
    maxObservedConcurrency = Math.max(maxObservedConcurrency, activeConcurrency);
    await new Promise(r => setTimeout(r, 50));
    activeConcurrency--;
    return 'result_1';
  });

  // Task 2: Task that fails once then succeeds
  queue.addTask('task_2', async () => {
    activeConcurrency++;
    maxObservedConcurrency = Math.max(maxObservedConcurrency, activeConcurrency);
    await new Promise(r => setTimeout(r, 30));
    activeConcurrency--;
    if (retryCount === 0) {
      retryCount++;
      throw new Error('Transient network error');
    }
    return 'result_2';
  });

  // Task 3: Task that always fails
  queue.addTask('task_3', async () => {
    throw new Error('Fatal synthesis failure');
  });

  const summary = await queue.run();

  assert.ok(maxObservedConcurrency <= 2, `Concurrency exceeded bound! Max observed: ${maxObservedConcurrency}`);
  assert.equal(summary.completedCount, 2, '2 tasks should succeed');
  assert.equal(summary.failedCount, 1, '1 task should fail');
  assert.equal(summary.failed[0].id, 'task_3');
});

test('2. SpeakerAudioCache — Granular Segment-Level Audio Cache (Phase 22)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-seg-cache-test-'));
  try {
    const cache = new SpeakerAudioCache(tmpDir);

    const dummyWav = path.join(tmpDir, 'source.wav');
    fs.writeFileSync(dummyWav, 'dummy audio content');

    const params = {
      videoFingerprint: 'fp_999',
      speakerId: 'spk_000001',
      segmentId: 'seg_001',
      text: 'Hello world',
      targetLanguage: 'hi',
      voiceId: 'hi_voice_1'
    };

    // Cache miss
    assert.equal(cache.getSegmentAudio(params), null);

    // Save
    cache.saveSegmentAudio(params, dummyWav, 2.5);

    // Cache hit
    const hit = cache.getSegmentAudio(params);
    assert.ok(hit);
    assert.equal(hit.cached, true);
    assert.equal(hit.duration, 2.5);
    assert.ok(fs.existsSync(hit.audioPath));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('3. AudioTimelineEngine — Safe Tempo Bounds & Pacing Preservation (Phase 14 & 15)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-timeline-engine-test-'));
  try {
    const engine = new AudioTimelineEngine({ outputDir: tmpDir, minTempo: 0.75, maxTempo: 1.5 });
    const dummyAudio = path.join(tmpDir, 'input.wav');
    fs.writeFileSync(dummyAudio, 'dummy wav');

    // Case A: Natural ratio within bounds
    const segA = {
      speakerId: 'spk_000001',
      startTime: 0.0,
      endTime: 2.0, // target 2.0s
      generatedDuration: 2.2, // ratio 1.1
      generatedAudio: dummyAudio
    };
    const resA = await engine.alignSegment(segA, tmpDir);
    assert.ok(resA.appliedTempo >= 0.75 && resA.appliedTempo <= 1.5);
    assert.equal(resA.alignedDuration, 2.0);

    // Case B: Impossible fast text (generated 6s for a 1s slot -> raw ratio 6.0)
    const segB = {
      speakerId: 'spk_000002',
      startTime: 3.0,
      endTime: 4.0, // target 1.0s
      generatedDuration: 6.0,
      generatedAudio: dummyAudio
    };
    const resB = await engine.alignSegment(segB, tmpDir);
    // Tempo must be capped at 1.5x (never sped up to chipmunk distortion!)
    assert.equal(resB.appliedTempo, 1.5);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('4. End-to-End Speaker-Aware Generation with Multi-Track Timeline (Phases 2-25)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-e2e-speaker-test-'));
  try {
    const store = new ManifestStore(tmpDir);
    const mockTTS = new MockTTSProvider();
    const mockTranslator = new MockTranslator();

    const videoEntry = {
      id: 'lecture_multispeaker',
      src: 'https://example.com/lecture.mp4',
      languages: ['en'],
      audioLanguages: ['hi', 'te']
    };

    // Pre-populate master transcript with multiple speakers & overlapping speech
    const masterSegments = [
      { start: 0.0, end: 4.0, text: 'Instructor opening the class.', speaker: 'spk_instructor' },
      { start: 2.5, end: 5.0, text: 'Student asking an interrupting question.', speaker: 'spk_student_1' },
      { start: 5.2, end: 8.0, text: 'Second student responding.', speaker: 'spk_student_2' },
      { start: 8.2, end: 12.0, text: 'Instructor summarizing the answer.', speaker: 'spk_instructor' }
    ];

    const result = await processSingleVideo(
      videoEntry,
      store,
      {
        ttsProvider: mockTTS,
        translator: mockTranslator,
        transcriber: {
          transcribe: async () => ({ language: 'en', segments: masterSegments })
        },
        audioLanguages: ['hi', 'te'],
        force: true
      }
    );

    assert.equal(result.status, 'completed');
    assert.equal(result.generatedAudioCount, 2); // hi and te generated

    // Check manifest
    const manifest = store.loadManifest();
    const entry = manifest['lecture_multispeaker'];
    assert.ok(entry);
    assert.ok(entry.audioLanguages.hi);
    assert.ok(entry.audioLanguages.te);
    assert.equal(entry.audioLanguages.hi.speakerAware, true);
    assert.equal(entry.audioLanguages.te.speakerAware, true);

    // Check detailed speaker metadata
    const speakerMeta = store.loadSpeakerMetadata('lecture_multispeaker');
    assert.ok(speakerMeta);
    assert.equal(speakerMeta.detectedSpeakerCount, 3);
    assert.deepEqual(speakerMeta.speakers.map(s => s.speakerId), ['spk_000001', 'spk_000002', 'spk_000003']);
    assert.ok(speakerMeta.voiceAssignments);
    assert.ok(speakerMeta.overlappingIntervals.length >= 1, 'Should record overlapping intervals');

    // Both Hindi and Telugu tracks created
    const pubHi = path.join(tmpDir, 'public', 'aitutor', 'audio', 'lecture_multispeaker', 'hi.m4a');
    const pubTe = path.join(tmpDir, 'public', 'aitutor', 'audio', 'lecture_multispeaker', 'te.m4a');
    assert.ok(fs.existsSync(pubHi));
    assert.ok(fs.existsSync(pubTe));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('5. Browser AudioController — Seamless Playback Contract for N Speakers (Phase 26)', async () => {
  // Verify browser audio availability resolution
  const manifestAudio = {
    en: { label: 'English', src: '/aitutor/audio/lec/en.m4a', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/aitutor/audio/lec/hi.m4a', language: 'hi', speakerAware: true },
    te: { label: 'Telugu', src: '/aitutor/audio/lec/te.m4a', language: 'te', speakerAware: true }
  };

  const availability = resolveAudioAvailability({
    manifestAudio,
    sourceLanguage: 'en'
  });

  assert.equal(availability.enabled, true);
  assert.deepEqual(availability.availableLanguages, ['en', 'hi', 'te']);
  assert.equal(availability.resolvedTracks.hi.src, '/aitutor/audio/lec/hi.m4a');

  // Mock Media Element for Node.js headless execution
  class MockMediaElement {
    constructor(type = 'audio') {
      this.type = type;
      this._src = '';
      this._currentTime = 0;
      this._volume = 1;
      this._muted = false;
      this._playbackRate = 1;
      this._paused = true;
      this.readyState = 4; // HAVE_ENOUGH_DATA
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
    get playbackRate() { return this._playbackRate; }
    set playbackRate(val) { this._playbackRate = val; }
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

  // Verify AudioController invariants
  const controller = new AudioController({ sourceLanguage: 'en' });
  const mockVideo = new MockMediaElement('video');
  const mockAudio = new MockMediaElement('audio');
  controller.videoElement = mockVideo;
  controller.audioElement = mockAudio;
  controller._bindVideoEvents();

  assert.equal(controller.state.mode, 'original');
  assert.equal(controller.state.language, 'en');

  // Controller switches to generated multi-speaker Hindi track
  await controller.switchTrack({ mode: 'dub', url: availability.resolvedTracks.hi.src, language: 'hi' });
  assert.equal(controller.state.mode, 'dub');
  assert.equal(controller.state.language, 'hi');
  assert.ok(controller.state.normalizedUrl.includes('/aitutor/audio/lec/hi.m4a'));

  // Switch to Telugu
  await controller.switchTrack({ mode: 'dub', url: availability.resolvedTracks.te.src, language: 'te' });
  assert.equal(controller.state.mode, 'dub');
  assert.equal(controller.state.language, 'te');

  // Switch back to original
  await controller.switchTrack({ mode: 'original', language: 'en' });
  assert.equal(controller.state.mode, 'original');
  assert.equal(controller.state.language, 'en');

  controller.destroy();
});

test('6. Large-Scale Speaker Stress Test (1, 10, 50, 100, 500, 1000 Speakers) (Phases 19 & 34)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-scale-stress-test-'));
  try {
    const counts = [1, 10, 50, 100, 500, 1000];

    for (const count of counts) {
      const memBefore = process.memoryUsage().heapUsed;
      const tStart = Date.now();

      // Generate N speaker timeline
      const segments = [];
      for (let i = 0; i < count; i++) {
        const spkId = `spk_${String(i + 1).padStart(6, '0')}`;
        segments.push({
          speakerId: spkId,
          startTime: i * 1.5,
          endTime: (i * 1.5) + 1.4,
          text: `Speaker ${i + 1} speech`
        });
      }

      const engine = new AudioTimelineEngine({ outputDir: tmpDir });
      const masterTracks = engine.buildMasterTimeline(segments);
      const tElapsed = Date.now() - tStart;
      const memAfter = process.memoryUsage().heapUsed;
      const memDeltaMB = (memAfter - memBefore) / (1024 * 1024);

      assert.equal(Object.keys(masterTracks).length, count);
      // Verify bounded memory (should not leak or explode over 50MB for timeline tracking)
      assert.ok(memDeltaMB < 60, `Memory delta for N=${count} was ${memDeltaMB.toFixed(2)} MB`);
      assert.ok(tElapsed < 1000, `Timeline build for N=${count} took ${tElapsed}ms`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
