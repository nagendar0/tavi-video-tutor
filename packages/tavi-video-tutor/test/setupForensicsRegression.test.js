import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  checkFFmpeg,
  checkFFprobe,
  verifyFFmpegFunctional,
  verifyFFprobeFunctional,
  checkWhisperProvider,
  checkWhisperModel,
  runPreflight
} from '../src/subtitles/env/preflight.js';
import {
  validateModelCacheDirectory,
  isWhisperModelCached,
  QUALITY_MODEL_MAP,
  WHISPER_MODEL_SIZES
} from '../src/subtitles/transcription/WhisperProvider.js';
import {
  getTransformers,
  getGlobalModelCacheDir,
  clearTransformersCache
} from '../src/subtitles/transcription/transformersLoader.js';

test('Forensics Regression 1: validateModelCacheDirectory rejects empty or partial directories', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-corrupt-cache-'));
  try {
    // 1. Completely empty directory
    assert.equal(validateModelCacheDirectory(tmpDir), false, 'Empty dir must not be valid cache');

    // 2. Contains only config.json
    fs.writeFileSync(path.join(tmpDir, 'config.json'), JSON.stringify({ model_type: 'whisper' }));
    assert.equal(validateModelCacheDirectory(tmpDir), false, 'Missing tokenizer.json must not be valid cache');

    // 3. Contains config.json and tokenizer.json, but empty onnx folder
    fs.writeFileSync(path.join(tmpDir, 'tokenizer.json'), JSON.stringify({ version: '1.0' }));
    const onnxDir = path.join(tmpDir, 'onnx');
    fs.mkdirSync(onnxDir, { recursive: true });
    assert.equal(validateModelCacheDirectory(tmpDir), false, 'Empty onnx dir must not be valid cache');

    // 4. Contains 0-byte or truncated onnx weights
    fs.writeFileSync(path.join(onnxDir, 'encoder_model.onnx'), Buffer.alloc(10));
    fs.writeFileSync(path.join(onnxDir, 'decoder_model_merged.onnx'), Buffer.alloc(10));
    assert.equal(validateModelCacheDirectory(tmpDir), false, '0-byte/truncated onnx files must not be valid cache');

    // 5. Contains valid sized onnx weights (>10KB)
    fs.writeFileSync(path.join(onnxDir, 'encoder_model.onnx'), Buffer.alloc(15000));
    fs.writeFileSync(path.join(onnxDir, 'decoder_model_merged.onnx'), Buffer.alloc(15000));
    assert.equal(validateModelCacheDirectory(tmpDir), true, 'Complete model with non-empty ONNX files must be valid');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Forensics Regression 2: Global persistent user cache dir resolution', () => {
  const origEnv = process.env.AITUTOR_CACHE_DIR;
  try {
    const customCache = path.join(os.tmpdir(), 'custom_aitutor_cache');
    process.env.AITUTOR_CACHE_DIR = customCache;
    assert.equal(getGlobalModelCacheDir(), customCache);

    delete process.env.AITUTOR_CACHE_DIR;
    const defaultCache = getGlobalModelCacheDir();
    assert.ok(defaultCache.includes('.cache'));
    assert.ok(defaultCache.includes('aitutor'));
    assert.ok(defaultCache.includes('models'));
  } finally {
    if (origEnv !== undefined) {
      process.env.AITUTOR_CACHE_DIR = origEnv;
    } else {
      delete process.env.AITUTOR_CACHE_DIR;
    }
  }
});

test('Forensics Regression 3: Broken FFmpeg binary detection (functional check)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-broken-ffmpeg-'));
  const isWin = process.platform === 'win32';
  const stubName = isWin ? 'ffmpeg.bat' : 'ffmpeg.sh';
  const stubPath = path.join(tmpDir, stubName);

  // Create a stub script that returns 0 on -version, but fails on real transcode
  if (isWin) {
    fs.writeFileSync(stubPath, `@echo off\nif "%1"=="-version" (echo ffmpeg version 9.9.9-fake & exit /b 0)\nexit /b 1\n`);
  } else {
    fs.writeFileSync(stubPath, `#!/bin/sh\nif [ "$1" = "-version" ]; then echo "ffmpeg version 9.9.9-fake"; exit 0; fi\nexit 1\n`);
    fs.chmodSync(stubPath, '755');
  }

  const origFfmpeg = process.env.FFMPEG_PATH;
  try {
    process.env.FFMPEG_PATH = stubPath;
    const res = await checkFFmpeg();
    assert.equal(res.pass, false, 'Broken FFmpeg that fails synthetic transcode must not pass checkFFmpeg');
    assert.ok(res.error && res.error.includes('BROKEN'), 'Error message must specify binary is BROKEN');
  } finally {
    if (origFfmpeg !== undefined) {
      process.env.FFMPEG_PATH = origFfmpeg;
    } else {
      delete process.env.FFMPEG_PATH;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Forensics Regression 4: Broken FFprobe binary detection (functional check)', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-broken-ffprobe-'));
  const isWin = process.platform === 'win32';
  const stubName = isWin ? 'ffprobe.bat' : 'ffprobe.sh';
  const stubPath = path.join(tmpDir, stubName);

  // Create a stub script that returns 0 on -version, but fails on stream inspection
  if (isWin) {
    fs.writeFileSync(stubPath, `@echo off\nif "%1"=="-version" (echo ffprobe version 9.9.9-fake & exit /b 0)\nexit /b 1\n`);
  } else {
    fs.writeFileSync(stubPath, `#!/bin/sh\nif [ "$1" = "-version" ]; then echo "ffprobe version 9.9.9-fake"; exit 0; fi\nexit 1\n`);
    fs.chmodSync(stubPath, '755');
  }

  const origFfprobe = process.env.FFPROBE_PATH;
  try {
    process.env.FFPROBE_PATH = stubPath;
    const res = await checkFFprobe();
    assert.equal(res.pass, false, 'Broken FFprobe that fails stream inspection must not pass checkFFprobe');
    assert.ok(res.error && res.error.includes('BROKEN'), 'Error message must specify binary is BROKEN');
  } finally {
    if (origFfprobe !== undefined) {
      process.env.FFPROBE_PATH = origFfprobe;
    } else {
      delete process.env.FFPROBE_PATH;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('Forensics Regression 5: checkWhisperProvider delegates to getTransformers and respects forceReload', async () => {
  clearTransformersCache();
  const res = await checkWhisperProvider({ forceReload: true });
  assert.equal(typeof res.pass, 'boolean');
  assert.equal(res.name, 'Whisper Provider');
  if (res.pass) {
    assert.ok(res.provider.includes('transformers'));
  }
});

test('Forensics Regression 6: Preflight structure with validated model check', async () => {
  const res = await runPreflight({ model: 'Xenova/whisper-base' });
  assert.ok(res.checks.node);
  assert.ok(res.checks.ffmpeg);
  assert.ok(res.checks.ffprobe);
  assert.ok(res.checks.whisperProvider);
  assert.ok(res.checks.whisperModel);
  assert.equal(typeof res.passed, 'boolean');
});
