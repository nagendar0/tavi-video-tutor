import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { SpeakerOverlapGraph } from '../src/subtitles/audio/voice/SpeakerOverlapGraph.js';
import { VoiceAllocator } from '../src/subtitles/audio/voice/VoiceAllocator.js';
import { VoicePool } from '../src/subtitles/audio/voice/VoicePool.js';
import { SpeakerVoiceCache } from '../src/subtitles/audio/voice/SpeakerVoiceCache.js';

test('1. SpeakerOverlapGraph — Constructs Graph with Overlap Edges & Degrees', () => {
  const graph = new SpeakerOverlapGraph();

  const segments = [
    { speakerId: 'spk_000001', startTime: 0.0, endTime: 5.0 },
    { speakerId: 'spk_000002', startTime: 3.0, endTime: 7.0 }, // Overlaps with spk_000001 [3.0 - 5.0]
    { speakerId: 'spk_000003', startTime: 8.0, endTime: 10.0 } // Non-overlapping with 1 or 2
  ];

  graph.buildFromSegments(segments);

  assert.equal(graph.getNodeCount(), 3);
  assert.equal(graph.getEdgeCount(), 1);
  assert.ok(graph.areConnected('spk_000001', 'spk_000002'));
  assert.equal(graph.areConnected('spk_000001', 'spk_000003'), false);
  assert.equal(graph.areConnected('spk_000002', 'spk_000003'), false);

  assert.equal(graph.getDegree('spk_000001'), 1);
  assert.equal(graph.getDegree('spk_000002'), 1);
  assert.equal(graph.getDegree('spk_000003'), 0);
});

test('2. VoiceAllocator — Single Speaker Fast-Path (N = 1)', () => {
  const allocator = new VoiceAllocator();
  const speakers = [{ speakerId: 'spk_000001' }];
  const segments = [{ speakerId: 'spk_000001', startTime: 0, endTime: 5 }];

  const res = allocator.allocate({
    speakers,
    segments,
    targetLanguage: 'hi'
  });

  assert.equal(res.chromaticNumber, 1);
  assert.equal(res.conflicts, 0);
  assert.ok(res.assignments['spk_000001']);
  assert.equal(res.assignments['spk_000001'].voiceId, 'hi_voice_1');
  assert.equal(res.colorMap['spk_000001'], 0);
});

test('3. VoiceAllocator — Non-Overlapping Speakers Reuse Voice Safely (Phases 8 & 9)', () => {
  const allocator = new VoiceAllocator();
  // 5 speakers who speak one after the other in strict sequence (never overlapping)
  const speakers = [
    { speakerId: 'spk_000001' },
    { speakerId: 'spk_000002' },
    { speakerId: 'spk_000003' },
    { speakerId: 'spk_000004' },
    { speakerId: 'spk_000005' }
  ];

  const segments = [
    { speakerId: 'spk_000001', startTime: 0.0, endTime: 2.0 },
    { speakerId: 'spk_000002', startTime: 2.5, endTime: 4.0 },
    { speakerId: 'spk_000003', startTime: 4.5, endTime: 6.0 },
    { speakerId: 'spk_000004', startTime: 6.5, endTime: 8.0 },
    { speakerId: 'spk_000005', startTime: 8.5, endTime: 10.0 }
  ];

  const res = allocator.allocate({
    speakers,
    segments,
    targetLanguage: 'te'
  });

  // Zero overlaps means 0 conflict edges in the graph -> Chromatic number is 1!
  assert.equal(res.chromaticNumber, 1);
  assert.equal(res.conflicts, 0);

  // All non-overlapping speakers safely share color 0 and the same voice
  for (const spk of speakers) {
    assert.equal(res.colorMap[spk.speakerId], 0);
    assert.equal(res.assignments[spk.speakerId].voiceId, 'te_voice_1');
  }
});

test('4. VoiceAllocator — Overlapping Speakers Guaranteed Distinct Voices (Phase 9)', () => {
  const allocator = new VoiceAllocator();
  // 3 speakers: A overlaps with B, B overlaps with C, A overlaps with C (clique of 3)
  const speakers = [
    { speakerId: 'spk_000001' },
    { speakerId: 'spk_000002' },
    { speakerId: 'spk_000003' }
  ];

  const segments = [
    { speakerId: 'spk_000001', startTime: 0.0, endTime: 4.0 },
    { speakerId: 'spk_000002', startTime: 1.0, endTime: 5.0 },
    { speakerId: 'spk_000003', startTime: 2.0, endTime: 6.0 }
  ];

  const res = allocator.allocate({
    speakers,
    segments,
    targetLanguage: 'hi'
  });

  assert.equal(res.chromaticNumber, 3);
  assert.equal(res.conflicts, 0);

  const v1 = res.assignments['spk_000001'].voiceId;
  const v2 = res.assignments['spk_000002'].voiceId;
  const v3 = res.assignments['spk_000003'].voiceId;

  // Distinct voices for all 3 mutually overlapping speakers
  assert.notEqual(v1, v2);
  assert.notEqual(v2, v3);
  assert.notEqual(v1, v3);
});

test('5. VoiceAllocator — Cross-Language Consistent Color Mapping (Phase 10)', () => {
  const allocator = new VoiceAllocator();
  const speakers = [
    { speakerId: 'spk_000001' },
    { speakerId: 'spk_000002' },
    { speakerId: 'spk_000003' }
  ];

  const segments = [
    { speakerId: 'spk_000001', startTime: 0.0, endTime: 4.0 },
    { speakerId: 'spk_000002', startTime: 2.0, endTime: 6.0 },
    { speakerId: 'spk_000003', startTime: 7.0, endTime: 9.0 }
  ];

  // Allocate Hindi
  const hiRes = allocator.allocate({ speakers, segments, targetLanguage: 'hi' });
  // Allocate Telugu
  const teRes = allocator.allocate({ speakers, segments, targetLanguage: 'te' });
  // Allocate Spanish
  const esRes = allocator.allocate({ speakers, segments, targetLanguage: 'es' });

  // Speaker color indices must be 100% identical across all languages!
  assert.deepEqual(hiRes.colorMap, teRes.colorMap);
  assert.deepEqual(teRes.colorMap, esRes.colorMap);

  // Perceived role consistency: spk_000001 gets voice 1 in all languages
  assert.equal(hiRes.assignments['spk_000001'].voiceId, 'hi_voice_1');
  assert.equal(teRes.assignments['spk_000001'].voiceId, 'te_voice_1');
  assert.equal(esRes.assignments['spk_000001'].voiceId, 'es_voice_1');
});

test('6. VoiceAllocator — Large Speaker Allocation (N = 1000 Speakers) Scalability', () => {
  const allocator = new VoiceAllocator();
  const count = 1000;
  const speakers = [];
  const segments = [];

  for (let i = 0; i < count; i++) {
    const spkId = `spk_${String(i + 1).padStart(6, '0')}`;
    speakers.push({ speakerId: spkId });
    // Overlapping clusters of 3 speakers every 10 seconds
    const group = Math.floor(i / 3);
    const subIdx = i % 3;
    segments.push({
      speakerId: spkId,
      startTime: (group * 5) + (subIdx * 0.5),
      endTime: (group * 5) + 3.0
    });
  }

  const startTime = Date.now();
  const res = allocator.allocate({
    speakers,
    segments,
    targetLanguage: 'hi'
  });
  const durationMs = Date.now() - startTime;

  assert.equal(Object.keys(res.assignments).length, 1000);
  assert.ok(durationMs < 1000, `Allocation for 1000 speakers completed in ${durationMs}ms`);
});

test('7. SpeakerVoiceCache — Deterministic Persistence & Resume (Phase 11 & 23)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-voice-cache-test-'));
  try {
    const cache = new SpeakerVoiceCache(tmpDir);
    const videoFingerprint = 'vid_fp_12345';

    const testAssignments = {
      spk_000001: { voiceId: 'hi_voice_1', colorIndex: 0 },
      spk_000002: { voiceId: 'hi_voice_2', colorIndex: 1 }
    };

    // Save
    cache.saveJobAssignments(videoFingerprint, 'hi', testAssignments);

    // Read back in new cache instance
    const cache2 = new SpeakerVoiceCache(tmpDir);
    const loaded = cache2.getJobAssignments(videoFingerprint, 'hi');

    assert.ok(loaded);
    assert.equal(loaded['spk_000001'].voiceId, 'hi_voice_1');
    assert.equal(loaded['spk_000002'].voiceId, 'hi_voice_2');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
