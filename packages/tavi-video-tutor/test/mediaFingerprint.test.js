import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { computeMediaFingerprint, ManifestStore } from '../src/subtitles/cache/manifest.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { generateWebVTT } from '../src/subtitles/vtt/generateVtt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDir = path.resolve(__dirname, '../.aitutor/test_fingerprint');

function createTestAudioWav(targetPath, durationSec = 3, freq = 440) {
  const sampleRate = 16000;
  const numSamples = sampleRate * durationSec;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
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
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.floor(Math.sin(2 * Math.PI * freq * t) * 10000);
    buffer.writeInt16LE(sample, 44 + i * 2);
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, buffer);
  return targetPath;
}

test('1. same path + same content -> same fingerprint', () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video1.wav');
  createTestAudioWav(videoPath, 2, 440);

  const fp1 = computeMediaFingerprint(videoPath, testDir);
  const fp2 = computeMediaFingerprint(videoPath, testDir);

  assert.strictEqual(fp1, fp2);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('2. same path + different size/content -> different fingerprint', () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video2.wav');

  createTestAudioWav(videoPath, 2, 440);
  const fp1 = computeMediaFingerprint(videoPath, testDir);

  createTestAudioWav(videoPath, 4, 440);
  const fp2 = computeMediaFingerprint(videoPath, testDir);

  assert.notStrictEqual(fp1, fp2);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('3. same path + same size + different content -> different fingerprint', () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video3.wav');

  createTestAudioWav(videoPath, 3, 440);
  const fp1 = computeMediaFingerprint(videoPath, testDir);

  createTestAudioWav(videoPath, 3, 880);
  const fp2 = computeMediaFingerprint(videoPath, testDir);

  assert.notStrictEqual(fp1, fp2);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('4. same path + same size + different content + preserved mtime -> different fingerprint', () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video4.wav');

  createTestAudioWav(videoPath, 3, 440);
  const stat1 = fs.statSync(videoPath);
  const fp1 = computeMediaFingerprint(videoPath, testDir);

  createTestAudioWav(videoPath, 3, 880);
  fs.utimesSync(videoPath, stat1.atime, stat1.mtime);
  const fp2 = computeMediaFingerprint(videoPath, testDir);

  assert.notStrictEqual(fp1, fp2);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('5. unchanged video second run -> cache hit', async () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video5.wav');
  createTestAudioWav(videoPath, 2, 440);

  const manifestStore = new ManifestStore(testDir);
  const videoEntry = { id: 'v5', src: videoPath, languages: ['en'] };

  manifestStore.saveMultilingualSubtitles(videoEntry, 'en', {
    en: generateWebVTT([{ start: 0, end: 2, text: "Sample" }])
  });

  const isCached = manifestStore.isCached(videoEntry);
  assert.strictEqual(isCached, true);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('6. changed video same path -> cache miss', () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video6.wav');
  createTestAudioWav(videoPath, 2, 440);

  const manifestStore = new ManifestStore(testDir);
  const videoEntry = { id: 'v6', src: videoPath, languages: ['en'] };

  manifestStore.saveMultilingualSubtitles(videoEntry, 'en', {
    en: generateWebVTT([{ start: 0, end: 2, text: "Sample Video A" }])
  });

  assert.strictEqual(manifestStore.isCached(videoEntry), true);

  // Replace content
  createTestAudioWav(videoPath, 4, 880);

  assert.strictEqual(manifestStore.isCached(videoEntry), false);
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('7. changed video -> ASR reruns', async () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video7.wav');
  createTestAudioWav(videoPath, 2, 440);

  const manifestStore = new ManifestStore(testDir);
  const videoEntry = { id: 'v7', src: videoPath, languages: ['en'] };

  let asrCallCount = 0;
  const mockTranscriber = {
    transcribe: async () => {
      asrCallCount++;
      return { language: 'en', segments: [{ start: 0, end: 2, text: `ASR Run ${asrCallCount}` }] };
    }
  };

  await processSingleVideo(videoEntry, manifestStore, { transcriber: mockTranscriber });
  assert.strictEqual(asrCallCount, 1);

  // Second run unchanged -> ASR skipped
  await processSingleVideo(videoEntry, manifestStore, { transcriber: mockTranscriber });
  assert.strictEqual(asrCallCount, 1);

  // Replace content -> ASR reruns
  createTestAudioWav(videoPath, 4, 880);
  await processSingleVideo(videoEntry, manifestStore, { transcriber: mockTranscriber });
  assert.strictEqual(asrCallCount, 2);

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('8. changed video -> old transcript not reused', async () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video8.wav');
  createTestAudioWav(videoPath, 2, 440);

  const manifestStore = new ManifestStore(testDir);
  const videoEntry = { id: 'v8', src: videoPath, languages: ['en'] };

  let asrCallCount = 0;
  const mockTranscriber = {
    transcribe: async () => {
      asrCallCount++;
      return { language: 'en', segments: [{ start: 0, end: 2, text: `Transcript for Run ${asrCallCount}` }] };
    }
  };

  const res1 = await processSingleVideo(videoEntry, manifestStore, { transcriber: mockTranscriber });
  assert.strictEqual(res1.status, 'completed');

  // Replace video content
  createTestAudioWav(videoPath, 4, 880);
  const res2 = await processSingleVideo(videoEntry, manifestStore, { transcriber: mockTranscriber });
  assert.strictEqual(res2.status, 'completed');
  assert.strictEqual(asrCallCount, 2);

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('9. changed video -> old VTT not reused', async () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video9.wav');
  createTestAudioWav(videoPath, 2, 440);

  const manifestStore = new ManifestStore(testDir);
  const videoEntry = { id: 'v9', src: videoPath, languages: ['en'] };

  let runCount = 0;
  const mockTranscriber = {
    transcribe: async () => {
      runCount++;
      return { language: 'en', segments: [{ start: 0, end: 2, text: `VTT Text ${runCount}` }] };
    }
  };

  await processSingleVideo(videoEntry, manifestStore, { transcriber: mockTranscriber });

  const publicVttPath = path.join(manifestStore.publicSubDir, 'v9', 'en.vtt');
  const vttContent1 = fs.readFileSync(publicVttPath, 'utf8');
  assert.match(vttContent1, /VTT Text 1/);

  // Replace content
  createTestAudioWav(videoPath, 4, 880);
  await processSingleVideo(videoEntry, manifestStore, { transcriber: mockTranscriber });

  const vttContent2 = fs.readFileSync(publicVttPath, 'utf8');
  assert.match(vttContent2, /VTT Text 2/);
  assert.notStrictEqual(vttContent1, vttContent2);

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('10. fingerprint deterministic across repeated calls', () => {
  fs.mkdirSync(testDir, { recursive: true });
  const videoPath = path.join(testDir, 'video10.wav');
  createTestAudioWav(videoPath, 2, 440);

  const fingerprints = [];
  for (let i = 0; i < 10; i++) {
    fingerprints.push(computeMediaFingerprint(videoPath, testDir));
  }

  assert.strictEqual(new Set(fingerprints).size, 1);
  fs.rmSync(testDir, { recursive: true, force: true });
});
