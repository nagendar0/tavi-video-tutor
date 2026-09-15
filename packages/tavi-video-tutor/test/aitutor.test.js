import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { formatVttTimestamp, generateWebVTT } from '../src/cli/vttGenerator.js';
import { computeHash, loadConfig, runGenerate, runClean } from '../src/cli/cli.js';
import { resolveManifestSubtitle } from '../src/services/manifestStore.js';
import { WhisperProvider } from '../src/subtitles/transcription/WhisperProvider.js';
import { AITutorTranslationProvider } from '../src/subtitles/translation/TranslationProvider.js';

test('1. WebVTT Generator — Timestamp Formatting & Valid Cue Output', () => {
  assert.equal(formatVttTimestamp(0), '00:00:00.000');
  assert.equal(formatVttTimestamp(65.432), '00:01:05.432');
  assert.equal(formatVttTimestamp(3661.005), '01:01:01.005');

  const cues = [
    { start: 1.0, end: 4.2, text: 'Hello <world> & welcome!' },
    { start: 4.5, end: 8.0, text: 'Today we learn Python.' }
  ];

  const vtt = generateWebVTT(cues);
  assert.match(vtt, /^WEBVTT/);
  assert.match(vtt, /00:00:01\.000 --> 00:00:04\.200/);
  assert.match(vtt, /Hello &lt;world&gt; &amp; welcome!/);
});

test('2. Hash Utility — SHA256 Consistency', () => {
  const hash1 = computeHash('https://example.com/python.mp4');
  const hash2 = computeHash('https://example.com/python.mp4');
  const hash3 = computeHash('https://example.com/react.mp4');

  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hash3);
});

test('3. Config Loader & Validation — Duplicate ID Error Handling', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-test-'));

  const validConfig = {
    videos: [
      { id: 'v1', src: 'https://example.com/1.mp4' },
      { id: 'v2', src: 'https://example.com/2.mp4' }
    ]
  };

  fs.writeFileSync(path.join(tmpDir, 'aitutor.config.json'), JSON.stringify(validConfig), 'utf8');
  const loaded = await loadConfig(tmpDir);
  assert.equal(loaded.videos.length, 2);

  // Duplicate ID config
  const dupConfig = {
    videos: [
      { id: 'v1', src: 'https://example.com/1.mp4' },
      { id: 'v1', src: 'https://example.com/2.mp4' }
    ]
  };
  const dupDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-dup-'));
  fs.writeFileSync(path.join(dupDir, 'aitutor.config.json'), JSON.stringify(dupConfig), 'utf8');

  await assert.rejects(async () => {
    await loadConfig(dupDir);
  }, /Duplicate video ID/);

  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(dupDir, { recursive: true, force: true });
});

test('4. CLI End-to-End — Generation, Caching, Clean-Video & Clean-All', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-cli-e2e-'));

  const testConfig = {
    videos: [
      { id: 'python-intro', src: 'https://example.com/python.mp4' },
      { id: 'react-hooks', src: 'https://example.com/react.mp4' }
    ]
  };

  fs.writeFileSync(path.join(tmpDir, 'aitutor.config.json'), JSON.stringify(testConfig), 'utf8');

  // Step 4a: Run initial generation
  const transcriber = new WhisperProvider({ allowTestFallback: true });
  const translator = new AITutorTranslationProvider({ allowTestFallback: true });
  await runGenerate({ transcriber, translator, allowTestFallback: true }, tmpDir);

  const internalManifestPath = path.join(tmpDir, '.aitutor', 'manifest.json');
  const publicManifestPath = path.join(tmpDir, 'public', 'aitutor', 'manifest.json');

  assert.ok(fs.existsSync(internalManifestPath), 'Internal manifest.json should exist');
  assert.ok(fs.existsSync(publicManifestPath), 'Public manifest.json should exist');

  const manifest = JSON.parse(fs.readFileSync(internalManifestPath, 'utf8'));
  assert.ok(manifest['python-intro']);
  assert.ok(manifest['react-hooks']);

  const subFile = path.join(tmpDir, 'public', 'aitutor', 'subtitles', 'python-intro.en.vtt');
  assert.ok(fs.existsSync(subFile), 'Generated VTT file should exist');

  // Step 4b: Run clean for single video
  await runClean({ video: 'python-intro' }, tmpDir);
  assert.ok(!fs.existsSync(subFile), 'Specific video VTT file should be removed');
  
  const updatedManifest = JSON.parse(fs.readFileSync(internalManifestPath, 'utf8'));
  assert.equal(updatedManifest['python-intro'], undefined, 'python-intro should be removed from manifest');
  assert.ok(updatedManifest['react-hooks'], 'react-hooks should remain intact');

  // Step 4c: Run clean all
  await runClean({}, tmpDir);
  assert.ok(!fs.existsSync(path.join(tmpDir, '.aitutor')), '.aitutor directory should be cleaned');
  assert.ok(!fs.existsSync(path.join(tmpDir, 'public', 'aitutor')), 'public/aitutor directory should be cleaned');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
