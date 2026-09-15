import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Buffer } from 'node:buffer';

import { createSpeakerSegment } from '../src/subtitles/audio/speaker/SpeakerModel.js';
import { SpeakerDiarizer } from '../src/subtitles/audio/diarization/SpeakerDiarizer.js';
import { TranslationRouter } from '../src/subtitles/translation/TranslationRouter.js';
import { SCRIPT_RANGE_MAP } from '../src/subtitles/translation/TranslationValidator.js';
import { SpeakerAudioCache } from '../src/subtitles/audio/cache/SpeakerAudioCache.js';

function generateSineWav(frequencyHz, durationSec, sampleRate = 16000, amplitude = 0.5) {
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = Buffer.alloc(44 + numSamples * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
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

test('1. SpeakerModel createSpeakerSegment — Canonical Text Contract', () => {
  // Test case A: seg has only originalText
  const segA = createSpeakerSegment({
    segmentId: 'seg_1',
    speakerId: 'spk_000001',
    originalText: 'Hello world from source',
    startTime: 0,
    endTime: 2
  });
  assert.equal(segA.text, 'Hello world from source');
  assert.equal(segA.originalText, 'Hello world from source');

  // Test case B: seg has only text
  const segB = createSpeakerSegment({
    segmentId: 'seg_2',
    speakerId: 'spk_000001',
    text: 'Hello world from text',
    startTime: 2,
    endTime: 4
  });
  assert.equal(segB.text, 'Hello world from text');
  assert.equal(segB.originalText, 'Hello world from text');

  // Test case C: seg has translatedText and targetLanguage
  const segC = createSpeakerSegment({
    segmentId: 'seg_3',
    speakerId: 'spk_000001',
    originalText: 'Hello world',
    translatedText: 'नमस्ते दुनिया',
    targetLanguage: 'hi',
    startTime: 4,
    endTime: 6
  });
  assert.equal(segC.originalText, 'Hello world');
  assert.equal(segC.translatedText, 'नमस्ते दुनिया');
  assert.equal(segC.targetLanguage, 'hi');
});

test('2. SpeakerDiarizer — Invariant: Every Diarized Segment Retains .text and .originalText', async () => {
  const diarizer = new SpeakerDiarizer();
  const wav = generateSineWav(180, 3.0);
  const asrSegments = [
    { start: 0.2, end: 1.2, text: 'First speaker sentence.' },
    { start: 1.5, end: 2.8, text: 'Second speaker sentence.' }
  ];

  const result = await diarizer.diarize(wav, asrSegments);
  assert.ok(result.segments.length > 0, 'Should produce diarized segments');
  for (const seg of result.segments) {
    assert.ok(seg.text, `Segment ${seg.segmentId} must have non-empty text`);
    assert.ok(seg.originalText, `Segment ${seg.segmentId} must have non-empty originalText`);
    assert.equal(seg.text, seg.originalText, 'Initially before translation text and originalText must match');
  }
});

test('3. TranslationRouter — Data Flow to Foreign Language Dubs', async () => {
  const router = new TranslationRouter({ offline: false });
  const segments = [
    {
      segmentId: 'seg_001',
      speakerId: 'spk_000001',
      startTime: 0.0,
      endTime: 2.5,
      text: 'Click on the settings icon to open the modal.',
      originalText: 'Click on the settings icon to open the modal.'
    }
  ];

  // Translate to Hindi
  const hiSegs = await router.translateSegments(segments, 'en', 'hi');
  assert.equal(hiSegs.length, 1);
  const hi = hiSegs[0];

  assert.equal(hi.originalText, 'Click on the settings icon to open the modal.');
  assert.ok(hi.translatedText, 'translatedText must not be empty');
  assert.equal(hi.text, hi.translatedText, 'text must be assigned the translatedText');
  assert.notEqual(hi.text, hi.originalText, 'Foreign dub text must not equal English source');

  // Verify Hindi script
  const isDevanagari = SCRIPT_RANGE_MAP.hi.test(hi.text);
  assert.ok(isDevanagari, `Hindi output "${hi.text}" must contain Devanagari characters`);
});

test('4. SpeakerAudioCache — Strict Source and Target Language Partitioning', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'speaker_cache_test_'));
  try {
    const cache = new SpeakerAudioCache(tmpDir);

    const keyEn = cache.computeKey({
      videoFingerprint: 'vid_fp_1',
      speakerId: 'spk_1',
      segmentId: 'seg_1',
      text: 'Hello world',
      sourceLanguage: 'en',
      targetLanguage: 'en'
    });

    const keyHi = cache.computeKey({
      videoFingerprint: 'vid_fp_1',
      speakerId: 'spk_1',
      segmentId: 'seg_1',
      text: 'नमस्ते दुनिया',
      sourceLanguage: 'en',
      targetLanguage: 'hi'
    });

    const keyTe = cache.computeKey({
      videoFingerprint: 'vid_fp_1',
      speakerId: 'spk_1',
      segmentId: 'seg_1',
      text: 'హలో ప్రపంచం',
      sourceLanguage: 'en',
      targetLanguage: 'te'
    });

    assert.notEqual(keyEn, keyHi, 'EN and HI keys must not collide');
    assert.notEqual(keyHi, keyTe, 'HI and TE keys must not collide');
    assert.notEqual(keyEn, keyTe, 'EN and TE keys must not collide');
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
});
