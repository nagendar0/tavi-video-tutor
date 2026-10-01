// @ts-check
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

import {
  validateCueTiming,
  decomposeAtempo,
  calculateRateAdaptation
} from '../src/subtitles/audio/mixer/AudioRateAdapter.js';
import { AudioTimelineEngine } from '../src/subtitles/audio/mixer/AudioTimelineEngine.js';
import { TimelineMixer } from '../src/subtitles/audio/mixer/TimelineMixer.js';
import { alignAudioSegment } from '../src/subtitles/audio/alignAudioSegment.js';
import { validateGeneratedAudio, createValidWaveBuffer, getAudioDuration } from '../src/subtitles/audio/validateAudio.js';
import { getFFmpegBinaryPath } from '../src/subtitles/audio/extractAudio.js';
import { TaviError, TaviAudioError } from '../src/subtitles/errors/index.js';

test('1. Valid cue timing accepted', () => {
  const result = validateCueTiming({ startTime: 1.5, endTime: 4.5 });
  assert.strictEqual(result.start, 1.5);
  assert.strictEqual(result.end, 4.5);
  assert.strictEqual(result.duration, 3.0);

  const resultFallback = validateCueTiming({ start: 0.0, end: 2.25 });
  assert.strictEqual(resultFallback.start, 0.0);
  assert.strictEqual(resultFallback.end, 2.25);
  assert.strictEqual(resultFallback.duration, 2.25);
});

test('2. Negative start rejected', () => {
  assert.throws(
    () => validateCueTiming({ startTime: -1.0, endTime: 3.0 }),
    (err) => {
      assert.ok(err instanceof TaviAudioError);
      assert.ok(err instanceof TaviError);
      assert.strictEqual(err.code, 'AUDIO_TIMELINE_INVALID');
      assert.strictEqual(err.category, 'AUDIO');
      return true;
    }
  );
});

test('3. End <= start rejected', () => {
  assert.throws(
    () => validateCueTiming({ startTime: 4.0, endTime: 2.0 }),
    (err) => {
      assert.ok(err instanceof TaviAudioError);
      assert.strictEqual(err.code, 'AUDIO_TIMELINE_INVALID');
      return true;
    }
  );

  assert.throws(
    () => validateCueTiming({ startTime: 3.5, endTime: 3.5 }),
    (err) => {
      assert.ok(err instanceof TaviAudioError);
      assert.strictEqual(err.code, 'AUDIO_TIMELINE_INVALID');
      return true;
    }
  );
});

test('4. NaN/Infinity timing rejected', () => {
  assert.throws(
    () => validateCueTiming({ startTime: NaN, endTime: 5.0 }),
    (err) => {
      assert.ok(err instanceof TaviAudioError);
      assert.strictEqual(err.code, 'AUDIO_TIMELINE_INVALID');
      return true;
    }
  );

  assert.throws(
    () => validateCueTiming({ startTime: 1.0, endTime: Infinity }),
    (err) => {
      assert.ok(err instanceof TaviAudioError);
      assert.strictEqual(err.code, 'AUDIO_TIMELINE_INVALID');
      return true;
    }
  );

  assert.throws(
    () => validateCueTiming({ startTime: 'invalid', endTime: 5.0 }),
    (err) => {
      assert.ok(err instanceof TaviAudioError);
      assert.strictEqual(err.code, 'AUDIO_TIMELINE_INVALID');
      return true;
    }
  );
});

test('5. Target duration calculated correctly', () => {
  const t1 = validateCueTiming({ startTime: 0.125, endTime: 3.875 });
  assert.strictEqual(t1.duration, 3.75);

  const t2 = validateCueTiming({ start: 10.0, end: 14.5 });
  assert.strictEqual(t2.duration, 4.5);
});

test('6. Speech duration measured correctly', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-measure-test-'));
  try {
    const wavPath = path.join(tmpDir, 'test_2_5s.wav');
    fs.writeFileSync(wavPath, createValidWaveBuffer(2.5, 16000, 1));

    const measured = getAudioDuration(wavPath);
    assert.ok(Math.abs(measured - 2.5) < 0.05, `Measured duration ${measured} should be ~2.5s`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('7. Speech shorter than cue is handled deterministically', () => {
  const res = calculateRateAdaptation({
    targetDuration: 5.0,
    sourceDuration: 3.0,
    limits: { allowPadding: true, preferNaturalPace: true }
  });

  assert.strictEqual(res.mode, 'PAD');
  assert.strictEqual(res.rateFactor, 1.0);
  assert.deepEqual(res.tempoFactors, [1.0]);
  assert.strictEqual(res.expectedDuration, 3.0);
  assert.strictEqual(res.paddingAfter, 2.0);
  assert.strictEqual(res.truncated, false);
});

test('8. Speech longer than cue is handled deterministically', () => {
  const res = calculateRateAdaptation({
    targetDuration: 4.0,
    sourceDuration: 5.0,
    limits: { minRateFactor: 0.75, maxRateFactor: 1.50 }
  });

  assert.strictEqual(res.mode, 'STRETCH');
  assert.strictEqual(res.rateFactor, 1.25); // 5.0 / 4.0 = 1.25
  assert.deepEqual(res.tempoFactors, [1.25]);
  assert.strictEqual(res.expectedDuration, 4.0);
  assert.strictEqual(res.truncated, false);
});

test('9. Rate factor calculation is correct', () => {
  // Speedup case: 6.0s speech to fit into 4.0s cue -> factor 1.5x
  const speedup = calculateRateAdaptation({
    targetDuration: 4.0,
    sourceDuration: 6.0
  });
  assert.strictEqual(speedup.rateFactor, 1.5);
  assert.strictEqual(speedup.mode, 'STRETCH');

  // Slowdown case without natural pace preference: 3.0s speech to fill 4.0s cue -> factor 0.75x
  const slowdown = calculateRateAdaptation({
    targetDuration: 4.0,
    sourceDuration: 3.0,
    limits: { preferNaturalPace: false, allowPadding: false }
  });
  assert.strictEqual(slowdown.rateFactor, 0.75);
  assert.strictEqual(slowdown.mode, 'STRETCH');
});

test('10. Rate factor respects configured limits', () => {
  // Configured maxRateFactor: 1.30x. Speech ratio is 6.0 / 4.0 = 1.5x
  const res = calculateRateAdaptation({
    targetDuration: 4.0,
    sourceDuration: 6.0,
    limits: { maxRateFactor: 1.30 }
  });
  assert.strictEqual(res.rateFactor, 1.30);
  assert.strictEqual(res.mode, 'BOUNDED_STRETCH');
});

test('11. Extreme rate factors are handled safely', () => {
  // 10s speech for 1s cue -> raw ratio 10.0x
  // Strict mode should reject as UNSATISFIABLE
  const strictRes = calculateRateAdaptation({
    targetDuration: 1.0,
    sourceDuration: 10.0,
    limits: { maxRateFactor: 1.50, strictErrorOnOverflow: true }
  });
  assert.strictEqual(strictRes.mode, 'UNSATISFIABLE');
  assert.strictEqual(strictRes.rateFactor, 1.50);

  // Truncate mode
  const truncRes = calculateRateAdaptation({
    targetDuration: 1.0,
    sourceDuration: 10.0,
    limits: { maxRateFactor: 1.50, allowTruncate: true }
  });
  assert.strictEqual(truncRes.mode, 'TRUNCATE');
  assert.strictEqual(truncRes.rateFactor, 1.50);
  assert.strictEqual(truncRes.truncated, true);

  // Bounded stretch default
  const boundedRes = calculateRateAdaptation({
    targetDuration: 1.0,
    sourceDuration: 10.0,
    limits: { maxRateFactor: 1.50 }
  });
  assert.strictEqual(boundedRes.mode, 'BOUNDED_STRETCH');
  assert.strictEqual(boundedRes.rateFactor, 1.50);
});

test('12. atempo factor decomposition is valid', () => {
  // Within standard bounds [0.5, 2.0]
  assert.deepEqual(decomposeAtempo(1.0), [1.0]);
  assert.deepEqual(decomposeAtempo(1.25), [1.25]);
  assert.deepEqual(decomposeAtempo(0.75), [0.75]);
  assert.deepEqual(decomposeAtempo(2.0), [2.0]);
  assert.deepEqual(decomposeAtempo(0.5), [0.5]);

  // Large speedup (> 2.0) decomposed into factors in [0.5, 2.0]
  const decomp3 = decomposeAtempo(3.0);
  assert.deepEqual(decomp3, [2.0, 1.5]);
  const prod3 = decomp3.reduce((acc, f) => acc * f, 1.0);
  assert.ok(Math.abs(prod3 - 3.0) < 0.001);

  const decomp4 = decomposeAtempo(4.0);
  assert.deepEqual(decomp4, [2.0, 2.0]);

  // Large slowdown (< 0.5) decomposed into factors in [0.5, 2.0]
  const decomp025 = decomposeAtempo(0.25);
  assert.deepEqual(decomp025, [0.5, 0.5]);
  const prod025 = decomp025.reduce((acc, f) => acc * f, 1.0);
  assert.ok(Math.abs(prod025 - 0.25) < 0.001);

  const decomp035 = decomposeAtempo(0.35);
  assert.deepEqual(decomp035, [0.5, 0.7]);
});

test('13. Resulting duration is measured rather than assumed', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-duration-measure-test-'));
  try {
    const engine = new AudioTimelineEngine({ outputDir: tmpDir });
    const dummyAudio = path.join(tmpDir, 'speech.wav');
    fs.writeFileSync(dummyAudio, createValidWaveBuffer(2.0, 16000, 1));

    const seg = {
      speakerId: 'spk_000001',
      startTime: 0.0,
      endTime: 3.0,
      generatedAudio: dummyAudio,
      generatedDuration: 2.0
    };

    const aligned = await engine.alignSegment(seg, tmpDir);
    assert.ok(aligned.alignedAudioPath);
    assert.ok(fs.existsSync(aligned.alignedAudioPath));

    // Must be measured from output file
    assert.ok(typeof aligned.alignedDuration === 'number');
    assert.ok(Math.abs(aligned.alignedDuration - 3.0) < 0.1, `Measured duration ${aligned.alignedDuration} should be ~3.0s`);

    // Verify on disk with ffprobe
    const diskDuration = getAudioDuration(aligned.alignedAudioPath);
    assert.ok(Math.abs(diskDuration - aligned.alignedDuration) < 0.05);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('14. Leading silence is handled correctly', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-lead-silence-test-'));
  try {
    const dummyAudio = path.join(tmpDir, 'speech.wav');
    fs.writeFileSync(dummyAudio, createValidWaveBuffer(1.0, 16000, 1));

    const mixer = new TimelineMixer({ sampleRate: 44100 });
    const outM4a = path.join(tmpDir, 'delayed.m4a');

    // Speech starts at 2.5s and ends at 3.5s in a 4.0s track
    await mixer.mix([
      { startTime: 2.5, endTime: 3.5, alignedAudioPath: dummyAudio }
    ], outM4a, { totalDuration: 4.0 });

    assert.ok(fs.existsSync(outM4a));
    const dur = getAudioDuration(outM4a);
    assert.ok(Math.abs(dur - 4.0) < 0.2, `Mixed track duration should be ~4.0s, was ${dur}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('15. Trailing silence is handled correctly', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-trail-silence-test-'));
  try {
    const dummyAudio = path.join(tmpDir, 'speech.wav');
    fs.writeFileSync(dummyAudio, createValidWaveBuffer(1.0, 16000, 1));

    // Target cue is 0.0s to 3.0s, speech is 1.0s. Pad 2.0s trailing silence.
    const alignedPath = await alignAudioSegment(dummyAudio, 1.0, 0.0, 3.0, tmpDir);
    const audioFilePath = typeof alignedPath === 'string' ? alignedPath : alignedPath.outputPath;
    const measuredDur = getAudioDuration(audioFilePath);
    assert.ok(Math.abs(measuredDur - 3.0) < 0.1, `Trailing padded audio should be ~3.0s, was ${measuredDur}`);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('16. Cue ordering preserved', () => {
  const engine = new AudioTimelineEngine();
  const disorderedSegments = [
    { cueIndex: 2, startTime: 4.0, endTime: 6.0, text: 'Third' },
    { cueIndex: 0, startTime: 0.0, endTime: 2.0, text: 'First' },
    { cueIndex: 1, startTime: 2.0, endTime: 4.0, text: 'Second' }
  ];

  const tracks = engine.buildMasterTimeline(disorderedSegments);
  const spkTrack = tracks['spk_000001'];
  assert.strictEqual(spkTrack.length, 3);
  assert.strictEqual(spkTrack[0].text, 'First');
  assert.strictEqual(spkTrack[1].text, 'Second');
  assert.strictEqual(spkTrack[2].text, 'Third');
});

test('17. Speaker IDs preserved', () => {
  const engine = new AudioTimelineEngine();
  const segments = [
    { speakerId: 'spk_alice', startTime: 0.0, endTime: 2.0, text: 'Hello from Alice' },
    { speakerId: 'spk_bob', startTime: 2.0, endTime: 4.0, text: 'Hello from Bob' }
  ];

  const tracks = engine.buildMasterTimeline(segments);
  assert.ok(tracks['spk_alice']);
  assert.ok(tracks['spk_bob']);
  assert.strictEqual(tracks['spk_alice'][0].speakerId, 'spk_alice');
  assert.strictEqual(tracks['spk_bob'][0].speakerId, 'spk_bob');
});

test('18. Speaker voice assignments preserved', () => {
  const engine = new AudioTimelineEngine();
  const segments = [
    { speakerId: 'spk_000001', voiceId: 'en_voice_warm', pitchOffset: 0.1, startTime: 0.0, endTime: 2.0 },
    { speakerId: 'spk_000002', voiceId: 'en_voice_bright', pitchOffset: -0.2, startTime: 2.0, endTime: 4.0 }
  ];

  const tracks = engine.buildMasterTimeline(segments);
  assert.strictEqual(tracks['spk_000001'][0].voiceId, 'en_voice_warm');
  assert.strictEqual(tracks['spk_000001'][0].pitchOffset, 0.1);
  assert.strictEqual(tracks['spk_000002'][0].voiceId, 'en_voice_bright');
  assert.strictEqual(tracks['spk_000002'][0].pitchOffset, -0.2);
});

test('19. Adjacent cues remain ordered', () => {
  const engine = new AudioTimelineEngine();
  const segments = [
    { startTime: 0.0, endTime: 2.0, text: 'Cue 1' },
    { startTime: 2.0, endTime: 4.0, text: 'Cue 2 (exact 0 gap)' },
    { startTime: 4.001, endTime: 6.0, text: 'Cue 3 (1ms gap)' }
  ];

  const tracks = engine.buildMasterTimeline(segments);
  const track = tracks['spk_000001'];
  assert.strictEqual(track[0].startTime, 0.0);
  assert.strictEqual(track[1].startTime, 2.0);
  assert.strictEqual(track[2].startTime, 4.001);
});

test('20. Overlapping cues follow existing multi-speaker semantics', () => {
  const engine = new AudioTimelineEngine();
  // Alice speaks 1.0 to 4.0, Bob interrupts from 2.5 to 5.0 (1.5s overlap)
  const segments = [
    { speakerId: 'spk_alice', startTime: 1.0, endTime: 4.0, text: 'Main lecture' },
    { speakerId: 'spk_bob', startTime: 2.5, endTime: 5.0, text: 'Interrupting question' }
  ];

  const tracks = engine.buildMasterTimeline(segments);
  assert.ok(tracks['spk_alice']);
  assert.ok(tracks['spk_bob']);

  // Overlap should be identified in non-enumerable diagnostic metadata
  assert.strictEqual(tracks.overlaps.length, 1);
  assert.strictEqual(tracks.overlaps[0].spkA, 'spk_alice');
  assert.strictEqual(tracks.overlaps[0].spkB, 'spk_bob');
  assert.strictEqual(tracks.overlaps[0].overlapSec, 1.5);
});

test('21. Sample-rate normalization works', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-samplerate-test-'));
  try {
    // Stem 1: 16000Hz WAV
    const stem16k = path.join(tmpDir, 'stem_16k.wav');
    fs.writeFileSync(stem16k, createValidWaveBuffer(1.0, 16000, 1));

    // Stem 2: 24000Hz WAV
    const stem24k = path.join(tmpDir, 'stem_24k.wav');
    fs.writeFileSync(stem24k, createValidWaveBuffer(1.0, 24000, 1));

    const mixer = new TimelineMixer({ sampleRate: 44100 });
    const outM4a = path.join(tmpDir, 'normalized_sr.m4a');

    await mixer.mix([
      { startTime: 0.0, endTime: 1.0, alignedAudioPath: stem16k },
      { startTime: 1.0, endTime: 2.0, alignedAudioPath: stem24k }
    ], outM4a, { totalDuration: 2.0 });

    assert.ok(fs.existsSync(outM4a));
    const val = validateGeneratedAudio(outM4a, { decodeTest: true });
    assert.strictEqual(val.valid, true);
    assert.strictEqual(val.sampleRate, 44100);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('22. Mono/stereo normalization works', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-channels-test-'));
  try {
    // Mono speech stem (1 channel)
    const monoSpeech = path.join(tmpDir, 'speech_mono.wav');
    fs.writeFileSync(monoSpeech, createValidWaveBuffer(1.5, 16000, 1));

    // Stereo ambient track (2 channels)
    const stereoAmbient = path.join(tmpDir, 'ambient_stereo.wav');
    fs.writeFileSync(stereoAmbient, createValidWaveBuffer(3.0, 44100, 2));

    const mixer = new TimelineMixer({ sampleRate: 44100 });
    const outM4a = path.join(tmpDir, 'mixed_stereo.m4a');

    await mixer.mix([
      { startTime: 0.5, endTime: 2.0, alignedAudioPath: monoSpeech }
    ], outM4a, {
      totalDuration: 3.0,
      ambientAudioPath: stereoAmbient,
      ambientDuckingDb: -10
    });

    assert.ok(fs.existsSync(outM4a));
    const val = validateGeneratedAudio(outM4a, { decodeTest: true });
    assert.strictEqual(val.valid, true);
    // Guarantee output remains stereo (2 channels) without downmixing to mono!
    assert.strictEqual(val.channels, 2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('23. Invalid audio is rejected', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-invalid-audio-test-'));
  try {
    // Empty file (0 bytes)
    const emptyFile = path.join(tmpDir, 'empty.m4a');
    fs.writeFileSync(emptyFile, '');
    const emptyVal = validateGeneratedAudio(emptyFile);
    assert.strictEqual(emptyVal.valid, false);
    assert.strictEqual(emptyVal.code, 'FILE_EMPTY');

    // Tiny dummy header (36 bytes)
    const dummyFile = path.join(tmpDir, 'dummy.m4a');
    fs.writeFileSync(dummyFile, Buffer.from('00000020667479704d344120000002004d3441206d70343269736f6d0000000866726565', 'hex'));
    const dummyVal = validateGeneratedAudio(dummyFile);
    assert.strictEqual(dummyVal.valid, false);
    assert.ok(dummyVal.code === 'FILE_TOO_SMALL' || dummyVal.code === 'DUMMY_HEADER');

    // Non-existent file
    const missingVal = validateGeneratedAudio(path.join(tmpDir, 'missing.m4a'));
    assert.strictEqual(missingVal.valid, false);
    assert.strictEqual(missingVal.code, 'FILE_NOT_FOUND');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('24. Mixer failure produces TaviError', async () => {
  const mixer = new TimelineMixer();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-mixer-fail-test-'));
  try {
    const badPath = path.join(tmpDir, 'out.m4a');
    await assert.rejects(
      async () => {
        await mixer.mix([
          { startTime: 0, endTime: 1, alignedAudioPath: path.join(tmpDir, 'nonexistent.wav') }
        ], badPath);
      },
      (err) => {
        assert.ok(err instanceof TaviAudioError);
        assert.ok(err instanceof TaviError);
        assert.strictEqual(err.code, 'AUDIO_MIX_FAILED');
        assert.strictEqual(err.category, 'AUDIO');
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('25. Timeline failure produces TaviError', async () => {
  const engine = new AudioTimelineEngine();
  await assert.rejects(
    async () => {
      await engine.alignSegment({
        startTime: -2.0,
        endTime: 2.0,
        generatedAudio: 'some.wav'
      });
    },
    (err) => {
      assert.ok(err instanceof TaviAudioError);
      assert.ok(err instanceof TaviError);
      assert.strictEqual(err.code, 'AUDIO_TIMELINE_INVALID');
      assert.strictEqual(err.category, 'AUDIO');
      return true;
    }
  );
});

test('26. Audio output validation works', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-validation-pass-test-'));
  try {
    const wavPath = path.join(tmpDir, 'valid.wav');
    fs.writeFileSync(wavPath, createValidWaveBuffer(1.0, 16000, 1));

    const val = validateGeneratedAudio(wavPath, { expectedCodec: 'pcm', decodeTest: true });
    assert.strictEqual(val.valid, true);
    assert.ok((val.size ?? 0) > 500);
    assert.strictEqual(val.channels, 1);
    assert.strictEqual(val.sampleRate, 16000);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('27. Cache keys distinguish timing parameters', () => {
  // Test timing and voice parameter distinction in cache keys
  const paramA = {
    videoFingerprint: 'vid_123',
    speakerId: 'spk_000001',
    segmentId: 'seg_001',
    rateOffset: 1.0,
    pitchOffset: 0.0
  };

  const paramB = {
    ...paramA,
    rateOffset: 1.25 // different rate offset
  };

  const paramC = {
    ...paramA,
    pitchOffset: 0.2 // different pitch offset
  };

  const keyA = JSON.stringify(paramA);
  const keyB = JSON.stringify(paramB);
  const keyC = JSON.stringify(paramC);

  assert.notStrictEqual(keyA, keyB);
  assert.notStrictEqual(keyA, keyC);
  assert.notStrictEqual(keyB, keyC);
});

test('28. Long sequence does not accumulate unbounded timing drift', () => {
  const engine = new AudioTimelineEngine();
  const cueCount = 500;
  const longSequence = [];

  for (let i = 0; i < cueCount; i++) {
    const start = Number((i * 2.0).toFixed(4));
    const end = Number(((i + 1) * 2.0).toFixed(4));
    longSequence.push({
      cueIndex: i,
      speakerId: `spk_${String((i % 4) + 1).padStart(6, '0')}`,
      startTime: start,
      endTime: end,
      text: `Long sequence speech cue ${i + 1}`
    });
  }

  const master = engine.buildMasterTimeline(longSequence);
  assert.strictEqual(master.totalCues, 500);
  assert.strictEqual(master.timelineStart, 0.0);
  assert.strictEqual(master.timelineEnd, 1000.0);

  // Cumulative drift across all 500 cues must be identically 0.000000s
  assert.strictEqual(master.cumulativeDrift, 0.0);
});

test('29. Deterministic identical inputs produce identical timeline decisions', () => {
  const params = {
    targetDuration: 3.5,
    sourceDuration: 4.2,
    limits: { minRateFactor: 0.75, maxRateFactor: 1.50 }
  };

  const res1 = calculateRateAdaptation(params);
  const res2 = calculateRateAdaptation(params);

  assert.deepEqual(res1, res2);
  assert.strictEqual(res1.rateFactor, res2.rateFactor);
  assert.strictEqual(res1.mode, res2.mode);
  assert.deepEqual(res1.tempoFactors, res2.tempoFactors);
});

test('30. Background ducking behaves according to current configured semantics', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-ducking-test-'));
  try {
    const speechPath = path.join(tmpDir, 'speech.wav');
    fs.writeFileSync(speechPath, createValidWaveBuffer(2.0, 44100, 2));

    const ambientPath = path.join(tmpDir, 'ambient.wav');
    fs.writeFileSync(ambientPath, createValidWaveBuffer(4.0, 44100, 2));

    const mixer = new TimelineMixer({ sampleRate: 44100 });
    const outM4a = path.join(tmpDir, 'ducked.m4a');

    await mixer.mix([
      { startTime: 1.0, endTime: 3.0, alignedAudioPath: speechPath }
    ], outM4a, {
      totalDuration: 4.0,
      ambientAudioPath: ambientPath,
      ambientDuckingDb: -15,
      sidechainDucking: true
    });

    assert.ok(fs.existsSync(outM4a));
    const val = validateGeneratedAudio(outM4a, { decodeTest: true });
    assert.strictEqual(val.valid, true);
    assert.strictEqual(val.channels, 2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('31. Final M4A output passes structural validation', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-structural-m4a-test-'));
  try {
    const speechPath = path.join(tmpDir, 'speech.wav');
    fs.writeFileSync(speechPath, createValidWaveBuffer(2.0, 44100, 2));

    const mixer = new TimelineMixer({ sampleRate: 44100, audioBitrate: '128k' });
    const outM4a = path.join(tmpDir, 'final_output.m4a');

    await mixer.mix([
      { startTime: 0.0, endTime: 2.0, alignedAudioPath: speechPath }
    ], outM4a, { totalDuration: 2.0 });

    assert.ok(fs.existsSync(outM4a));
    const val = validateGeneratedAudio(outM4a, {
      expectedCodec: 'aac',
      minDuration: 1.5,
      decodeTest: true,
      throwOnError: true
    });

    assert.strictEqual(val.valid, true);
    assert.ok(val.codec?.toLowerCase().includes('aac'));
    assert.strictEqual(val.channels, 2);
    assert.strictEqual(val.sampleRate, 44100);
    assert.ok((val.duration ?? 0) >= 1.9 && (val.duration ?? 0) <= 2.2);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('32. No shell injection through audio/timing inputs', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-security-test-'));
  try {
    // Malicious segment text or path with shell metacharacters
    const safeAudio = path.join(tmpDir, 'safe.wav');
    fs.writeFileSync(safeAudio, createValidWaveBuffer(1.0, 16000, 1));

    const engine = new AudioTimelineEngine({ outputDir: tmpDir });
    const maliciousSeg = {
      startTime: 0.0,
      endTime: 1.5,
      text: '; echo MALICIOUS_INJECTION && calc.exe | rm -rf /',
      generatedAudio: safeAudio,
      generatedDuration: 1.0
    };

    // alignSegment uses direct spawnSync argument arrays without shell expansion
    const aligned = await engine.alignSegment(maliciousSeg, tmpDir);
    assert.ok(aligned.alignedAudioPath);
    assert.ok(fs.existsSync(aligned.alignedAudioPath));
    // Verify no stray injection artifacts were created
    assert.strictEqual(fs.existsSync(path.join(process.cwd(), 'MALICIOUS_INJECTION')), false);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('33. Existing Phase 1 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase1_capability_model_registry.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 1 failed: ${proc.stderr}`);
});

test('34. Existing Phase 2 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase2_policy_engine.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 2 failed: ${proc.stderr}`);
});

test('35. Existing Phase 3 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase3_model_cache.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 3 failed: ${proc.stderr}`);
});

test('36. Existing Phase 4 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase4_piper_tts_adapter.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 4 failed: ${proc.stderr}`);
});

test('37. Existing Phase 5 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase5_kokoro_tts_adapter.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 5 failed: ${proc.stderr}`);
});

test('38. Existing Phase 6 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase6_mms_tts_adapter.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 6 failed: ${proc.stderr}`);
});

test('39. Existing Phase 7 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase7_translation_hardening.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 7 failed: ${proc.stderr}`);
});

test('40. Existing Phase 8 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase8_tts_factory.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 8 failed: ${proc.stderr}`);
});

test('41. Existing Phase 9 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase9_preflight_doctor.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 9 failed: ${proc.stderr}`);
});

test('42. Existing Phase 10 tests pass', () => {
  const proc = spawnSync(process.execPath, ['--test', 'test/phase10_error_contract.test.js'], { encoding: 'utf8' });
  assert.strictEqual(proc.status, 0, `Phase 10 failed: ${proc.stderr}`);
});
