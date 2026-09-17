import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { secondsToVttTimestamp, generateWebVTT, sanitizeCueText } from '../src/subtitles/vtt/generateVtt.js';
import { TempWorkspace } from '../src/subtitles/storage/tempWorkspace.js';
import { WhisperProvider } from '../src/subtitles/transcription/WhisperProvider.js';
import { AITutorTranslationProvider } from '../src/subtitles/translation/TranslationProvider.js';
import { ManifestStore, computeFingerprint } from '../src/subtitles/cache/manifest.js';
import { loadConfig, VideoEntry } from '../src/subtitles/config/loadConfig.js';
import { processAllVideos } from '../src/subtitles/pipeline/processVideos.js';

test('1. WebVTT Generator — Timestamp Formatting & Escaping', () => {
  assert.equal(secondsToVttTimestamp(0), '00:00:00.000');
  assert.equal(secondsToVttTimestamp(0.4), '00:00:00.400');
  assert.equal(secondsToVttTimestamp(65.25), '00:01:05.250');
  assert.equal(secondsToVttTimestamp(3661.5), '01:01:01.500');

  assert.equal(sanitizeCueText('Hello <script> & "world"'), 'Hello &lt;script&gt; &amp; "world"');

  const segments = [
    { start: 0.4, end: 3.8, text: 'Welcome to this course.' },
    { start: 4.1, end: 7.9, text: 'Today we will learn Python.' }
  ];

  const vtt = generateWebVTT(segments);
  assert.match(vtt, /^WEBVTT/);
  assert.match(vtt, /00:00:00\.400 --> 00:00:03\.800/);
  assert.match(vtt, /Today we will learn Python\./);
});

test('2. Temp Workspace — Creation & Safe Cleanup Lifecycle', () => {
  const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-ws-'));
  const workspace = new TempWorkspace('python-intro', tmpCwd);

  const testFilePath = workspace.getPath('input.mp4');
  fs.writeFileSync(testFilePath, 'dummy data', 'utf8');
  assert.ok(fs.existsSync(testFilePath), 'Temp workspace file should exist');

  workspace.cleanup();
  assert.ok(!fs.existsSync(workspace.workspaceDir), 'Temp workspace directory should be cleaned up');

  fs.rmSync(tmpCwd, { recursive: true, force: true });
});

test('3. Config Loader & VideoEntry ID Derivation', async () => {
  const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-cfg-'));
  const config = {
    videos: [
      'https://example.com/python.mp4',
      { id: 'react-course', src: 'https://example.com/react.mp4' }
    ]
  };

  fs.writeFileSync(path.join(tmpCwd, 'aitutor.config.json'), JSON.stringify(config), 'utf8');

  const { videos } = await loadConfig(tmpCwd);
  assert.equal(videos.length, 2);
  assert.equal(videos[0].id, 'python');
  assert.equal(videos[1].id, 'react-course');

  fs.rmSync(tmpCwd, { recursive: true, force: true });
});

test('4. WhisperProvider — Timestamped Segment Generation', async () => {
  const provider = new WhisperProvider({ allowTestFallback: true });
  const videoEntry = new VideoEntry({ id: 'python-intro', src: 'https://example.com/python.mp4' });

  const result = await provider.transcribe({ audioPath: 'dummy.wav' }, videoEntry);
  assert.ok(result.segments && Array.isArray(result.segments));
  assert.ok(result.segments.length > 0);
  assert.equal(typeof result.segments[0].start, 'number');
  assert.equal(typeof result.segments[0].end, 'number');
  assert.equal(typeof result.segments[0].text, 'string');
});

test('5. Manifest Store & Fingerprinting', () => {
  const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-mf-'));
  const store = new ManifestStore(tmpCwd);
  const videoEntry = new VideoEntry({ id: 'python-intro', src: 'https://example.com/python.mp4' });

  const fp1 = computeFingerprint(videoEntry.src);
  const fp2 = computeFingerprint(videoEntry.src);
  assert.equal(fp1, fp2);

  assert.equal(store.isCached(videoEntry), false);

  const subUrl = store.saveSubtitle(videoEntry, 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHello');
  assert.equal(subUrl, '/aitutor/subtitles/python-intro/en.vtt');
  assert.equal(store.isCached(videoEntry), true);

  fs.rmSync(tmpCwd, { recursive: true, force: true });
});

test('6. Full Pipeline — processAllVideos End-to-End', async () => {
  const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-pipe-'));
  const config = {
    videos: [
      { id: 'python-intro', src: 'https://example.com/python.mp4' },
      { id: 'react-hooks', src: 'https://example.com/react.mp4' }
    ]
  };

  fs.writeFileSync(path.join(tmpCwd, 'aitutor.config.json'), JSON.stringify(config), 'utf8');

  const transcriber = new WhisperProvider({ allowTestFallback: true });
  const translator = new AITutorTranslationProvider({ allowTestFallback: true });

  // Run 1: Should generate both
  const res1 = await processAllVideos({ transcriber, translator, allowTestFallback: true }, tmpCwd);
  assert.equal(res1.generatedSubtitles, 2);

  // Run 2: Should skip both as cached
  const res2 = await processAllVideos({ transcriber, translator, allowTestFallback: true }, tmpCwd);
  assert.equal(res2.generatedSubtitles, 0);

  fs.rmSync(tmpCwd, { recursive: true, force: true });
});
