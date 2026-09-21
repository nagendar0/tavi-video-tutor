import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import { EdgeTTSProvider } from '../src/subtitles/tts/EdgeTTSProvider.js';
import { validateGeneratedAudio } from '../src/subtitles/audio/validateAudio.js';

test('1. Real Neural Audio Integration — Hindi Female (hi-IN-SwaraNeural) & Male (hi-IN-MadhurNeural)', async () => {
  const provider = new EdgeTTSProvider({ timeoutMs: 15000 });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hindi_neural_int_'));

  try {
    const hindiText = 'यह हिंदी भाषा का छोटा वाक्य है।';

    // Female synthesis
    const femaleRes = await provider.synthesize(hindiText, 'hi', {
      outputDir: tmpDir,
      voiceId: 'hi-IN-SwaraNeural',
      gender: 'female'
    });

    assert.ok(femaleRes.audioPath, 'Female audio path must exist');
    assert.equal(femaleRes.voiceId, 'hi-IN-SwaraNeural');
    assert.equal(femaleRes.format, 'wav');
    assert.ok(fs.existsSync(femaleRes.audioPath));

    const femaleVal = validateGeneratedAudio(femaleRes.audioPath, {
      minSizeBytes: 10000,
      minDuration: 1.0,
      rejectSilence: true,
      rejectTone: true,
      decodeTest: true,
      throwOnError: true
    });
    assert.equal(femaleVal.valid, true);
    assert.ok(femaleVal.duration > 1.0, `Female duration was ${femaleVal.duration}s`);

    // Male synthesis
    const maleRes = await provider.synthesize(hindiText, 'hi', {
      outputDir: tmpDir,
      voiceId: 'hi-IN-MadhurNeural',
      gender: 'male'
    });

    assert.ok(maleRes.audioPath, 'Male audio path must exist');
    assert.equal(maleRes.voiceId, 'hi-IN-MadhurNeural');
    assert.equal(maleRes.format, 'wav');
    assert.ok(fs.existsSync(maleRes.audioPath));

    const maleVal = validateGeneratedAudio(maleRes.audioPath, {
      minSizeBytes: 10000,
      minDuration: 1.0,
      rejectSilence: true,
      rejectTone: true,
      decodeTest: true,
      throwOnError: true
    });
    assert.equal(maleVal.valid, true);
    assert.ok(maleVal.duration > 1.0, `Male duration was ${maleVal.duration}s`);

    // Structural and Acoustic Distinctiveness Verification (Hindi male != Hindi female)
    const femaleData = fs.readFileSync(femaleRes.audioPath);
    const maleData = fs.readFileSync(maleRes.audioPath);
    const femaleSha = crypto.createHash('sha256').update(femaleData).digest('hex');
    const maleSha = crypto.createHash('sha256').update(maleData).digest('hex');

    assert.notEqual(femaleSha, maleSha, 'Audio binary content must not be identical');
    assert.notEqual(femaleVal.duration, maleVal.duration, 'Speaker paces/cadence must differ in duration');
    assert.notEqual(femaleVal.size, maleVal.size, 'Audio file sizes must reflect acoustic differences');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('2. Real Neural Audio Integration — Telugu Female (te-IN-ShrutiNeural) & Male (te-IN-MohanNeural)', async () => {
  const provider = new EdgeTTSProvider({ timeoutMs: 15000 });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'telugu_neural_int_'));

  try {
    const teluguText = 'ఇది తెలుగు భాషలో చిన్న వాక్యం.';

    // Female synthesis
    const femaleRes = await provider.synthesize(teluguText, 'te', {
      outputDir: tmpDir,
      voiceId: 'te-IN-ShrutiNeural',
      gender: 'female'
    });

    assert.ok(femaleRes.audioPath, 'Telugu female audio path must exist');
    assert.equal(femaleRes.voiceId, 'te-IN-ShrutiNeural');
    assert.equal(femaleRes.format, 'wav');
    assert.ok(fs.existsSync(femaleRes.audioPath));

    const femaleVal = validateGeneratedAudio(femaleRes.audioPath, {
      minSizeBytes: 10000,
      minDuration: 1.0,
      rejectSilence: true,
      rejectTone: true,
      decodeTest: true,
      throwOnError: true
    });
    assert.equal(femaleVal.valid, true);
    assert.ok(femaleVal.duration > 0.8, `Female duration was ${femaleVal.duration}s`);

    // Male synthesis
    const maleRes = await provider.synthesize(teluguText, 'te', {
      outputDir: tmpDir,
      voiceId: 'te-IN-MohanNeural',
      gender: 'male'
    });

    assert.ok(maleRes.audioPath, 'Telugu male audio path must exist');
    assert.equal(maleRes.voiceId, 'te-IN-MohanNeural');
    assert.equal(maleRes.format, 'wav');
    assert.ok(fs.existsSync(maleRes.audioPath));

    const maleVal = validateGeneratedAudio(maleRes.audioPath, {
      minSizeBytes: 10000,
      minDuration: 1.0,
      rejectSilence: true,
      rejectTone: true,
      decodeTest: true,
      throwOnError: true
    });
    assert.equal(maleVal.valid, true);
    assert.ok(maleVal.duration > 0.8, `Male duration was ${maleVal.duration}s`);

    // Structural and Acoustic Distinctiveness Verification (Telugu male != Telugu female)
    const femaleData = fs.readFileSync(femaleRes.audioPath);
    const maleData = fs.readFileSync(maleRes.audioPath);
    const femaleSha = crypto.createHash('sha256').update(femaleData).digest('hex');
    const maleSha = crypto.createHash('sha256').update(maleData).digest('hex');

    assert.notEqual(femaleSha, maleSha, 'Audio binary content must not be identical');
    assert.notEqual(femaleVal.duration, maleVal.duration, 'Speaker paces/cadence must differ in duration');
    assert.notEqual(femaleVal.size, maleVal.size, 'Audio file sizes must reflect acoustic differences');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
