import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { AITUTOR_LANGUAGES, getLanguageByCode } from '../src/subtitles/languages/registry.js';
import { isRTL, getLanguageDirection } from '../src/subtitles/languages/direction.js';
import { mapAITutorCodeToProvider } from '../src/subtitles/languages/providerMappings.js';
import { TranscriptCache } from '../src/subtitles/transcript/transcriptCache.js';
import { AITutorTranslationProvider } from '../src/subtitles/translation/TranslationProvider.js';
import { WhisperProvider } from '../src/subtitles/transcription/WhisperProvider.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { processAllVideos } from '../src/subtitles/pipeline/processVideos.js';
import { VideoEntry } from '../src/subtitles/config/loadConfig.js';

test('1. Language Registry & RTL Direction Detection', () => {
  assert.equal(AITUTOR_LANGUAGES.length, 109);

  const telugu = getLanguageByCode('te');
  assert.equal(telugu.name, 'Telugu');
  assert.equal(telugu.nativeName, 'తెలుగు');

  assert.equal(isRTL('ar'), true);
  assert.equal(isRTL('he'), true);
  assert.equal(isRTL('fa'), true);
  assert.equal(isRTL('te'), false);
  assert.equal(isRTL('en'), false);

  assert.equal(getLanguageDirection('ar'), 'rtl');
  assert.equal(getLanguageDirection('en'), 'ltr');

  assert.equal(mapAITutorCodeToProvider('zh'), 'zh-CN');
});

test('2. Timestamp Preservation During Translation', async () => {
  const translator = new AITutorTranslationProvider({ allowTestFallback: true });
  const masterSegments = [
    { start: 1.0, end: 4.2, text: 'Welcome to Python.' },
    { start: 4.5, end: 8.0, text: 'Today we will learn variables.' }
  ];

  const translatedTe = await translator.translateSegments(masterSegments, 'en', 'te');
  assert.equal(translatedTe.length, 2);
  assert.equal(translatedTe[0].start, 1.0);
  assert.equal(translatedTe[0].end, 4.2);

  const translatedJa = await translator.translateSegments(masterSegments, 'en', 'ja');
  assert.equal(translatedJa[0].start, 1.0);
  assert.equal(translatedJa[0].end, 4.2);
});

test('3. Master Transcript Caching — Transcribe Once, Translate Many', async () => {
  const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-multi-'));
  const manifestStore = new ManifestStore(tmpCwd);
  const transcriptCache = new TranscriptCache(tmpCwd);
  const transcriber = new WhisperProvider({ allowTestFallback: true });
  const translator = new AITutorTranslationProvider({ allowTestFallback: true });

  const video = new VideoEntry({
    id: 'python-intro',
    src: 'https://example.com/python.mp4',
    subtitles: { languages: ['en', 'te', 'hi'] }
  });

  let events1 = [];
  const res1 = await processSingleVideo(video, manifestStore, { transcriptCache, transcriber, translator }, (evt) => {
    events1.push(evt);
  });

  assert.ok(transcriptCache.hasMasterTranscript('python-intro'), 'Master transcript JSON should exist');
  assert.equal(res1.generatedCount, 3);

  const updatedVideo = new VideoEntry({
    id: 'python-intro',
    src: 'https://example.com/python.mp4',
    subtitles: { languages: ['en', 'te', 'hi', 'ja', 'es'] }
  });

  let events2 = [];
  const res2 = await processSingleVideo(updatedVideo, manifestStore, { transcriptCache, transcriber, translator }, (evt) => {
    events2.push(evt);
  });

  const masterCachedEvent = events2.find(e => e.type === 'transcript-cached');
  assert.ok(masterCachedEvent, 'Should reuse master transcript cache without re-running STT/FFmpeg');
  assert.equal(res2.generatedCount, 2, 'Should generate only new languages (ja, es)');
  assert.equal(res2.cachedCount, 3, 'Should keep previous languages (en, te, hi) cached');

  const manifest = manifestStore.loadManifest();
  assert.ok(manifest['python-intro'].subtitles['te']);
  assert.ok(manifest['python-intro'].subtitles['ja']);

  fs.rmSync(tmpCwd, { recursive: true, force: true });
});

test('4. End-to-End Multilingual processAllVideos Pipeline', async () => {
  const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-multi-pipe-'));
  const config = {
    subtitles: {
      languages: ['en', 'te', 'es']
    },
    videos: [
      { id: 'video_1', src: 'https://example.com/1.mp4' },
      { id: 'video_2', src: 'https://example.com/2.mp4', subtitles: { languages: ['ja', 'ko'] } }
    ]
  };

  fs.writeFileSync(path.join(tmpCwd, 'aitutor.config.json'), JSON.stringify(config), 'utf8');

  const transcriber = new WhisperProvider({ allowTestFallback: true });
  const translator = new AITutorTranslationProvider({ allowTestFallback: true });

  const res = await processAllVideos({ transcriber, translator }, tmpCwd);
  assert.equal(res.totalVideos, 2);
  assert.equal(res.generatedSubtitles, 5);

  fs.rmSync(tmpCwd, { recursive: true, force: true });
});
