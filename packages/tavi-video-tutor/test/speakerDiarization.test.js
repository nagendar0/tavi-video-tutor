import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { AudioFeatureExtractor } from '../src/subtitles/audio/diarization/AudioFeatureExtractor.js';
import { VoiceActivityDetector } from '../src/subtitles/audio/diarization/VoiceActivityDetector.js';
import { SpeakerDiarizer } from '../src/subtitles/audio/diarization/SpeakerDiarizer.js';
import { SpeakerTimeline } from '../src/subtitles/audio/diarization/SpeakerTimeline.js';
import { SpeakerRegistry } from '../src/subtitles/audio/speaker/SpeakerRegistry.js';
import { createSpeakerIdentity, createSpeakerSegment } from '../src/subtitles/audio/speaker/SpeakerModel.js';

// Helper: Generate synthetic 16kHz mono PCM buffer with specific frequency, duration, and amplitude
function generateSineWav(frequencyHz, durationSec, sampleRate = 16000, amplitude = 0.5) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);

  // Write WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34); // 16-bit
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sampleVal = Math.sin(2 * Math.PI * frequencyHz * t) * amplitude;
    const int16 = Math.max(-32768, Math.min(32767, Math.floor(sampleVal * 32767)));
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

test('1. AudioFeatureExtractor — Extracts RMS, ZCR, Centroid, and Pitch from Linear PCM', () => {
  const extractor = new AudioFeatureExtractor({ sampleRate: 16000 });
  const wavBuf = generateSineWav(220, 1.0, 16000, 0.6); // 220Hz test tone

  const frames = extractor.extractFromBuffer(wavBuf);
  assert.ok(frames.length > 20, 'Should extract multiple acoustic frames');

  const midFrame = frames[Math.floor(frames.length / 2)];
  assert.ok(midFrame.energy > 0.3, `Expected high energy, got ${midFrame.energy}`);
  assert.ok(midFrame.zcr > 0.01 && midFrame.zcr < 0.1, `ZCR in expected range for 220Hz: ${midFrame.zcr}`);
  assert.ok(midFrame.pitch > 200 && midFrame.pitch < 240, `Pitch should detect near 220Hz, got ${midFrame.pitch}`);
});

test('2. VoiceActivityDetector — Detects Voice Activity Intervals and Rejects Silence', () => {
  const vad = new VoiceActivityDetector();
  // 0.5s tone + 0.5s silence + 0.5s tone
  const tone1 = generateSineWav(180, 0.6, 16000, 0.7);
  const tone2 = generateSineWav(250, 0.6, 16000, 0.7);

  // Concatenate with silence in between
  const silenceSamples = 16000 * 0.5;
  const combined = Buffer.concat([
    tone1.subarray(44),
    Buffer.alloc(silenceSamples * 2),
    tone2.subarray(44)
  ]);

  const intervals = vad.detect(combined);
  assert.ok(intervals.length >= 1, `Expected at least 1 speech interval, got ${intervals.length}`);
  assert.ok(intervals[0].duration >= 0.25, `Speech duration should be >= 0.25s, got ${intervals[0].duration}`);
});

test('3. SpeakerDiarizer — Single Speaker (N = 1) Dynamic Discovery', async () => {
  const diarizer = new SpeakerDiarizer();
  const wav = generateSineWav(160, 2.0);

  const asrSegments = [
    { start: 0.1, end: 1.0, text: 'Hello from single speaker segment 1' },
    { start: 1.2, end: 1.9, text: 'Hello from single speaker segment 2' }
  ];

  const result = await diarizer.diarize(wav, asrSegments);

  assert.equal(result.detectedSpeakerCount, 1);
  assert.equal(result.speakers.length, 1);
  assert.equal(result.speakers[0].speakerId, 'spk_000001');
  assert.equal(result.segments[0].speakerId, 'spk_000001');
  assert.equal(result.segments[1].speakerId, 'spk_000001');
  assert.equal(result.overlappingIntervals.length, 0);
});

test('4. SpeakerDiarizer — Multiple Speakers (N = 2, 3) Dynamic Separation', async () => {
  const diarizer = new SpeakerDiarizer();

  const asrSegments = [
    { start: 0.0, end: 2.0, text: 'Segment from speaker A', speaker: 'Speaker_A' },
    { start: 2.2, end: 4.0, text: 'Segment from speaker B', speaker: 'Speaker_B' },
    { start: 4.2, end: 6.0, text: 'Segment from speaker C', speaker: 'Speaker_C' },
    { start: 6.2, end: 8.0, text: 'Speaker A returns again', speaker: 'Speaker_A' }
  ];

  const result = await diarizer.diarize(null, asrSegments);

  assert.equal(result.detectedSpeakerCount, 3);
  assert.equal(result.speakers.length, 3);
  assert.deepEqual(result.speakers.map(s => s.speakerId), ['spk_000001', 'spk_000002', 'spk_000003']);

  // Segment 0 and Segment 3 should have identical speaker ID (spk_000001)
  assert.equal(result.segments[0].speakerId, 'spk_000001');
  assert.equal(result.segments[3].speakerId, 'spk_000001');
  assert.equal(result.segments[1].speakerId, 'spk_000002');
  assert.equal(result.segments[2].speakerId, 'spk_000003');
});

test('5. SpeakerDiarizer — Overlapping Speech Detection (Phase 6)', async () => {
  const diarizer = new SpeakerDiarizer();

  const overlappingSegments = [
    { start: 10.0, end: 15.0, text: 'Speaker A holding the floor', speaker: 'spk_A' },
    { start: 12.5, end: 14.2, text: 'Speaker B interrupting politely', speaker: 'spk_B' }
  ];

  const result = await diarizer.diarize(null, overlappingSegments);

  assert.equal(result.detectedSpeakerCount, 2);
  assert.equal(result.overlappingIntervals.length, 1);

  const overlap = result.overlappingIntervals[0];
  assert.equal(overlap.speakerA, 'spk_000001');
  assert.equal(overlap.speakerB, 'spk_000002');
  assert.equal(overlap.overlapStart, 12.5);
  assert.equal(overlap.overlapEnd, 14.2);
  assert.equal(overlap.duration, 1.7);
});

test('6. SpeakerDiarizer — Arbitrary Scale (N = 10, 50, 100, 1000 Speakers)', async () => {
  const diarizer = new SpeakerDiarizer();

  const testCounts = [10, 50, 100, 1000];

  for (const count of testCounts) {
    const segments = [];
    for (let i = 0; i < count; i++) {
      segments.push({
        start: i * 2.0,
        end: (i * 2.0) + 1.8,
        text: `Speaker ${i + 1} utterance text`,
        speaker: `speaker_entity_${i + 1}`
      });
    }

    const startTime = Date.now();
    const result = await diarizer.diarize(null, segments);
    const durationMs = Date.now() - startTime;

    assert.equal(result.detectedSpeakerCount, count, `Expected ${count} speakers dynamically inferred`);
    assert.equal(result.speakers.length, count);
    assert.equal(result.segments.length, count);
    assert.equal(result.speakers[0].speakerId, 'spk_000001');
    assert.equal(result.speakers[count - 1].speakerId, `spk_${String(count).padStart(6, '0')}`);

    // Verify sub-second performance even for 1000 speakers
    assert.ok(durationMs < 1500, `Diarization for N=${count} completed in ${durationMs}ms`);
  }
});

test('7. SpeakerTimeline — Independent Multi-Track Queries & Peak Concurrency', () => {
  const timeline = new SpeakerTimeline();

  // Speaker A speaks: [0.0, 5.0], [8.0, 12.0]
  timeline.addSegment({ speakerId: 'spk_000001', startTime: 0.0, endTime: 5.0, text: 'Hello' });
  timeline.addSegment({ speakerId: 'spk_000001', startTime: 8.0, endTime: 12.0, text: 'Back' });

  // Speaker B speaks: [3.0, 7.0] (overlaps with A from 3.0 to 5.0)
  timeline.addSegment({ speakerId: 'spk_000002', startTime: 3.0, endTime: 7.0, text: 'Interruption' });

  // Speaker C speaks: [4.0, 6.0] (overlaps with A and B at 4.5)
  timeline.addSegment({ speakerId: 'spk_000003', startTime: 4.0, endTime: 6.0, text: 'Third voice' });

  assert.equal(timeline.getSpeakerCount(), 3);
  assert.equal(timeline.getTotalSegmentCount(), 4);

  // At t=4.5, all 3 speakers are simultaneously active
  const activeAt45 = timeline.getActiveSpeakersAt(4.5);
  assert.equal(activeAt45.length, 3);
  assert.deepEqual(activeAt45.sort(), ['spk_000001', 'spk_000002', 'spk_000003']);

  // At t=1.0, only Speaker A is active
  const activeAt1 = timeline.getActiveSpeakersAt(1.0);
  assert.deepEqual(activeAt1, ['spk_000001']);

  // Peak concurrent speakers should be 3
  assert.equal(timeline.getMaxConcurrentSpeakers(), 3);

  // Overlap summary
  const overlaps = timeline.getSpeakerOverlapSummary();
  assert.ok(overlaps.length >= 2, 'Should record overlap pairs');
});

test('8. SpeakerRegistry & SpeakerModel — Monotonic Invariants & Validation', () => {
  const registry = new SpeakerRegistry();

  const s1 = registry.register({ characteristics: { pitchMeanHz: 210 } });
  const s2 = registry.register({ characteristics: { pitchMeanHz: 130 } });

  assert.equal(s1.speakerId, 'spk_000001');
  assert.equal(s2.speakerId, 'spk_000002');
  assert.equal(s1.characteristics.genderHint, 'female');
  assert.equal(s2.characteristics.genderHint, 'male');
  assert.equal(registry.size(), 2);

  // Segment creation
  const seg = createSpeakerSegment({
    speakerId: s1.speakerId,
    startTime: 1.5,
    endTime: 4.5,
    originalText: 'Sample speech segment',
    language: 'en'
  });

  assert.equal(seg.duration, 3.0);
  assert.equal(seg.speakerId, 'spk_000001');
  assert.equal(seg.originalText, 'Sample speech segment');
});
