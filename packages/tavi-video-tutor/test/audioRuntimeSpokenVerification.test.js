import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { stitchAudioSegments } from '../src/subtitles/audio/stitchAudioSegments.js';
import { resolveActiveAudioTrack, resolveAudioAvailability } from '../src/subtitles/resolver/audioResolver.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';

test('1. Audio Signal & Spoken Language Pipeline — Real Multi-Language Audio Synthesis', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-spoken-verification-'));
  try {
    const tts = new NodeTTSProvider();

    // 1. Synthesize English
    const enSynth = await tts.synthesize('Welcome to the lesson on computer science and algorithms.', 'en', { outputDir: tmpDir });
    assert.ok(fs.existsSync(enSynth.audioPath));
    assert.ok(enSynth.duration > 0);

    // 2. Synthesize Hindi
    const hiSynth = await tts.synthesize('कंप्यूटर विज्ञान और एल्गोरिदम के पाठ में आपका स्वागत है।', 'hi', { outputDir: tmpDir });
    assert.ok(fs.existsSync(hiSynth.audioPath));
    assert.ok(hiSynth.duration > 0);

    // 3. Synthesize Telugu
    const teSynth = await tts.synthesize('కంప్యూటర్ సైన్స్ మరియు అల్గోరిథంల పాఠానికి స్వాగతం.', 'te', { outputDir: tmpDir });
    assert.ok(fs.existsSync(teSynth.audioPath));
    assert.ok(teSynth.duration > 0);

    // 4. Stitch each into real .m4a tracks
    const enM4a = path.join(tmpDir, 'en.m4a');
    const hiM4a = path.join(tmpDir, 'hi.m4a');
    const teM4a = path.join(tmpDir, 'te.m4a');

    await stitchAudioSegments([{ start: 0, end: enSynth.duration, audioPath: enSynth.audioPath }], enM4a, enSynth.duration);
    await stitchAudioSegments([{ start: 0, end: hiSynth.duration, audioPath: hiSynth.audioPath }], hiM4a, hiSynth.duration);
    await stitchAudioSegments([{ start: 0, end: teSynth.duration, audioPath: teSynth.audioPath }], teM4a, teSynth.duration);

    assert.ok(fs.existsSync(enM4a) && fs.statSync(enM4a).size > 0);
    assert.ok(fs.existsSync(hiM4a) && fs.statSync(hiM4a).size > 0);
    assert.ok(fs.existsSync(teM4a) && fs.statSync(teM4a).size > 0);

    // 5. Verify audio duration using tts provider utility
    const enDur = tts.getAudioDuration(enM4a);
    const hiDur = tts.getAudioDuration(hiM4a);
    const teDur = tts.getAudioDuration(teM4a);

    assert.ok(enDur > 0, 'English audio must have positive duration');
    assert.ok(hiDur > 0, 'Hindi audio must have positive duration');
    assert.ok(teDur > 0, 'Telugu audio must have positive duration');

    // 6. Manifest persistence & resolution
    const store = new ManifestStore(tmpDir);
    const videoEntry = { id: 'lesson_spoken', src: '/videos/lesson.mp4' };
    store.saveMultilingualAudio(videoEntry, 'en', {
      en: { filePath: enM4a, label: 'English' },
      hi: { filePath: hiM4a, label: 'Hindi' },
      te: { filePath: teM4a, label: 'Telugu' }
    });

    const manifest = store.loadManifest();
    const resolvedEn = resolveActiveAudioTrack({
      manifestAudio: manifest.lesson_spoken.audioLanguages,
      sourceLanguage: 'en',
      selectedLanguage: 'en'
    });
    const resolvedHi = resolveActiveAudioTrack({
      manifestAudio: manifest.lesson_spoken.audioLanguages,
      sourceLanguage: 'en',
      selectedLanguage: 'hi'
    });
    const resolvedTe = resolveActiveAudioTrack({
      manifestAudio: manifest.lesson_spoken.audioLanguages,
      sourceLanguage: 'en',
      selectedLanguage: 'te'
    });

    assert.equal(resolvedEn.mode, 'original', 'English on English source resolves to original mode');
    assert.equal(resolvedHi.mode, 'dub');
    assert.equal(resolvedHi.url, '/aitutor/audio/lesson_spoken/hi.m4a');
    assert.equal(resolvedTe.mode, 'dub');
    assert.equal(resolvedTe.url, '/aitutor/audio/lesson_spoken/te.m4a');

  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
