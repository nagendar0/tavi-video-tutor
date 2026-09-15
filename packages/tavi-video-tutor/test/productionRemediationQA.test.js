import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { validateGeneratedAudio, createValidWaveBuffer } from '../src/subtitles/audio/validateAudio.js';
import { SpeakerAudioCache } from '../src/subtitles/audio/cache/SpeakerAudioCache.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { TimelineMixer } from '../src/subtitles/audio/mixer/TimelineMixer.js';
import { stitchAudioSegments } from '../src/subtitles/audio/stitchAudioSegments.js';

console.log('============================================================');
console.log('PRODUCTION REMEDIATION REGRESSION TEST SUITE');
console.log('============================================================\n');

test('1. Zero-Trust Audio Validation — Reject Dummy & Corrupt Media', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-reject-dummy-'));
  try {
    // A. Empty file (0 bytes)
    const emptyFile = path.join(tmpDir, 'empty.wav');
    fs.writeFileSync(emptyFile, Buffer.alloc(0));
    const resEmpty = validateGeneratedAudio(emptyFile);
    assert.equal(resEmpty.valid, false);
    assert.equal(resEmpty.code, 'FILE_EMPTY');

    // B. Dummy text / tiny file (< 100 bytes)
    const tinyFile = path.join(tmpDir, 'tiny.wav');
    fs.writeFileSync(tinyFile, 'RIFF1234WAVEfmt');
    const resTiny = validateGeneratedAudio(tinyFile, { minSizeBytes: 100 });
    assert.equal(resTiny.valid, false);
    assert.equal(resTiny.code, 'FILE_TOO_SMALL');

    // C. Non-audio binary
    const garbageFile = path.join(tmpDir, 'garbage.m4a');
    fs.writeFileSync(garbageFile, Buffer.alloc(500, 0xAA));
    const resGarbage = validateGeneratedAudio(garbageFile);
    assert.equal(resGarbage.valid, false);

    // D. Valid PCM 16-bit WAV buffer MUST PASS
    const validWavFile = path.join(tmpDir, 'valid.wav');
    fs.writeFileSync(validWavFile, createValidWaveBuffer(1.5, 16000, 1));
    const resValid = validateGeneratedAudio(validWavFile, { minSizeBytes: 100, decodeTest: true });
    assert.equal(resValid.valid, true);
    assert.equal(resValid.duration >= 1.4, true);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('2. SpeakerAudioCache — Auto-Purge Corrupt Cache Entries on Miss', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-cache-purge-'));
  try {
    const cache = new SpeakerAudioCache(tmpDir);

    const validWav = path.join(tmpDir, 'valid_seg.wav');
    fs.writeFileSync(validWav, createValidWaveBuffer(1.0, 16000, 1));

    const params = {
      videoFingerprint: 'fp_qa_001',
      speakerId: 'spk_qa_01',
      segmentId: 'seg_qa_001',
      text: 'Production verification test',
      targetLanguage: 'te',
      voiceId: 'te_female_1'
    };

    // Save valid audio
    const saved = cache.saveSegmentAudio(params, validWav, 1.0);
    assert.ok(saved);
    assert.ok(fs.existsSync(saved.audioPath));

    // Simulate bitrot / corruption on disk
    fs.writeFileSync(saved.audioPath, 'corrupted data that is not audio');

    // getSegmentAudio must detect corruption, delete corrupted file, and return null
    const hit = cache.getSegmentAudio(params);
    assert.equal(hit, null, 'Corrupt cached audio must trigger cache miss');
    assert.equal(fs.existsSync(saved.audioPath), false, 'Corrupt file must be deleted from disk');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('3. ManifestStore — Corrupt Audio Track Detection and Pruning', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-manifest-prune-'));
  try {
    const store = new ManifestStore(tmpDir);
    const videoEntry = { id: 'test_corrupt_manifest', src: 'https://example.com/test.mp4', languages: ['en'] };

    // Save valid subtitle
    store.saveMultilingualSubtitles(videoEntry, 'en', {
      en: 'WEBVTT\n\n1\n00:00.000 --> 00:02.000\nHello'
    });

    // Save dummy audio with skipValidation for testing disk tampering
    const audioDir = path.join(tmpDir, '.aitutor', 'audio', 'test_corrupt_manifest');
    fs.mkdirSync(audioDir, { recursive: true });
    const audioFile = path.join(audioDir, 'hi.m4a');
    fs.writeFileSync(audioFile, 'invalid corrupted audio header');

    store.saveMultilingualAudio(videoEntry, 'en', {
      hi: { filePath: audioFile, label: 'Hindi' }
    }, null, { skipValidation: true });

    // Verify isAudioLanguageCached detects the corruption and returns false
    const isCached = store.isAudioLanguageCached(videoEntry, 'hi');
    assert.equal(isCached, false, 'isAudioLanguageCached must return false for corrupt media on disk');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('4. TimelineMixer & Hierarchical Batch Stitching (10, 32, 50, 82 Segments)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-batch-stitch-'));
  try {
    const mixer = new TimelineMixer({
      outputDir: tmpDir,
      maxBatchInputs: 16 // Stress hierarchical batching with smaller batch size
    });

    const segmentCounts = [10, 32, 50, 82];

    for (const count of segmentCounts) {
      const segWav = path.join(tmpDir, `base_${count}.wav`);
      fs.writeFileSync(segWav, createValidWaveBuffer(0.5, 16000, 1));

      const segments = [];
      for (let i = 0; i < count; i++) {
        segments.push({
          start: i * 0.5,
          end: (i + 1) * 0.5,
          audioPath: segWav
        });
      }

      const outM4a = path.join(tmpDir, `stitched_${count}.m4a`);
      const totalDuration = count * 0.5;

      const outPath = await mixer.mix(segments, outM4a, totalDuration);
      assert.ok(fs.existsSync(outPath), `Output file for ${count} segments must exist`);

      // Validate the produced M4A container with real ffprobe
      const validation = validateGeneratedAudio(outM4a, { expectedCodec: 'aac', decodeTest: true });
      assert.equal(validation.valid, true, `Generated M4A for ${count} segments must be valid and decodable`);
      assert.ok(validation.duration >= totalDuration - 0.5, `Duration must match expected (got ${validation.duration}, expected >= ${totalDuration - 0.5})`);

      // Clean up for next count
      try { fs.unlinkSync(outM4a); } catch (_) {}
      try { fs.unlinkSync(segWav); } catch (_) {}
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
