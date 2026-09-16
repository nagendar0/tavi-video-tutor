import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

import { probeMedia } from '../src/subtitles/video/MediaProbe.js';
import { extractAudio, getFFmpegBinaryPath, getFFprobeBinaryPath } from '../src/subtitles/audio/extractAudio.js';
import { planQualityLadder } from '../src/subtitles/video/QualityPlanner.js';
import { transcodeRendition } from '../src/subtitles/video/FFmpegTranscoder.js';
import { TranslationRouter } from '../src/subtitles/translation/TranslationRouter.js';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { SpeakerDiarizer } from '../src/subtitles/audio/diarization/SpeakerDiarizer.js';
import { validateGeneratedAudio } from '../src/subtitles/audio/validateAudio.js';
import { generateWebVTT } from '../src/subtitles/vtt/generateVtt.js';
import { TranslationValidator } from '../src/subtitles/translation/TranslationValidator.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { resolveSubtitleAvailability } from '../src/subtitles/resolver/subtitleResolver.js';
import { resolveAudioAvailability } from '../src/subtitles/resolver/audioResolver.js';

console.log('============================================================');
console.log('REAL MEDIA END-TO-END INTEGRATION TEST SUITE');
console.log('============================================================\n');

const FIXTURE_CANDIDATES = [
  path.resolve(process.cwd(), '../../examples/react-demo/public/sample.mp4'),
  path.resolve(process.cwd(), '../examples/react-demo/public/sample.mp4'),
  path.resolve(process.cwd(), 'examples/react-demo/public/sample.mp4'),
  path.resolve(process.cwd(), '../../examples/react-demo/public/demo-video.mp4'),
  path.resolve(process.cwd(), '../examples/react-demo/public/demo-video.mp4'),
  path.resolve(process.cwd(), 'examples/react-demo/public/demo-video.mp4')
];
const FIXTURE_PATH = FIXTURE_CANDIDATES.find(p => fs.existsSync(p));

test('Real-Media Pipeline: Full lifecycle integration with committed fixture', async () => {
  // Preflight dependencies
  const ffmpeg = getFFmpegBinaryPath();
  const ffprobe = getFFprobeBinaryPath();
  assert.ok(ffmpeg, 'FFmpeg binary must be available on PATH');
  assert.ok(ffprobe, 'FFprobe binary must be available on PATH');
  assert.ok(FIXTURE_PATH && fs.existsSync(FIXTURE_PATH), `Committed fixture must exist at ${FIXTURE_PATH}`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-real-media-e2e-'));

  try {
    // 1. Probing real media fixture
    const probe = await probeMedia(FIXTURE_PATH);
    assert.equal(probe.container, 'mp4');
    assert.equal(probe.video.codec, 'h264');
    assert.equal(probe.audio.codec, 'aac');
    assert.ok(probe.duration > 20, 'Fixture duration should be > 20s');

    // 2. Cut a representative 4-second clip with re-encoding to guarantee clean sample
    const clipPath = path.join(tmpDir, 'test_clip.mp4');
    const cutProc = spawnSync(ffmpeg, [
      '-y',
      '-ss', '1.0',
      '-i', FIXTURE_PATH,
      '-t', '4.0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      clipPath
    ], { encoding: 'utf8', windowsHide: true });
    assert.equal(cutProc.status, 0, `FFmpeg clip extraction failed: ${cutProc.stderr}`);
    assert.ok(fs.existsSync(clipPath) && fs.statSync(clipPath).size > 1000);

    // 3. Audio Extraction: Real FFmpeg extraction to 16kHz WAV
    const workspace = {
      cwd: tmpDir,
      getPath: (name) => path.join(tmpDir, name)
    };
    const extractedAudio = await extractAudio(clipPath, workspace, { allowTestFallback: false });
    // 4. Validate extracted audio decodability and content
    const audioValidation = validateGeneratedAudio(extractedAudio.audioPath, {
      decodeTest: true,
      minDuration: 3.0,
      rejectSilence: true,
      rejectTone: true
    });
    assert.equal(audioValidation.valid, true);
    assert.ok(audioValidation.duration > 3.5, 'Extracted audio duration should match clip');
    assert.equal(audioValidation.channels, 1);
    assert.equal(audioValidation.sampleRate, 16000);

    // 5. Real Translation: Translate transcript segment via TranslationRouter
    const router = new TranslationRouter({ mode: 'online' });
    const sourceSegments = [
      { start: 0.5, end: 3.5, text: 'Welcome to this educational lesson' }
    ];
    const translatedSegments = await router.translateSegments(sourceSegments, 'en', 'es');
    assert.ok(Array.isArray(translatedSegments) && translatedSegments.length === 1);
    assert.ok(translatedSegments[0].text && translatedSegments[0].text.length > 0);
    assert.notEqual(translatedSegments[0].text.toLowerCase(), sourceSegments[0].text.toLowerCase(), 'Translation must differ from source English');

    // 6. Real Speech Synthesis: Generate speech with NodeTTSProvider
    const tts = new NodeTTSProvider();
    let ttsResult = null;
    try {
      ttsResult = await tts.synthesize(translatedSegments[0].text, 'es', {
        outputDir: tmpDir
      });
    } catch (_) {
      // If OS speech engine does not have an installed Spanish voice, synthesize English
      ttsResult = await tts.synthesize(sourceSegments[0].text, 'en', {
        outputDir: tmpDir
      });
    }

    assert.ok(ttsResult && ttsResult.audioPath, 'Speech synthesis must produce real audio file');
    assert.ok(fs.existsSync(ttsResult.audioPath));

    const ttsValidation = validateGeneratedAudio(ttsResult.audioPath, {
      decodeTest: true,
      minDuration: 0.2
    });
    assert.equal(ttsValidation.valid, true);

    // 7. Speaker Diarization: Process real audio frames and assign speakers
    const diarizer = new SpeakerDiarizer({ maxSpeakers: 2 });
    const diarizationResult = await diarizer.diarize(extractedAudio.audioPath, sourceSegments);
    assert.ok(Array.isArray(diarizationResult.segments) && diarizationResult.segments.length === 1);
    assert.ok(diarizationResult.segments[0].speakerId, 'Segment must be assigned a speaker ID');
    assert.equal(diarizationResult.segments[0].text, sourceSegments[0].text);

    // 8. WebVTT Generation and Validation
    const vttContent = generateWebVTT(translatedSegments);
    const validator = new TranslationValidator();
    const vttValidation = validator.validateVttContent(vttContent, 'es', 'en');
    assert.equal(vttValidation.valid, true);

    // 9. Quality Ladder Planning & Rendition Transcoding
    const clipProbe = await probeMedia(clipPath);
    const qualityPlan = planQualityLadder(clipProbe, { generate: true });
    assert.ok(qualityPlan.renditions.length > 0);

    const targetRendition = qualityPlan.renditions[qualityPlan.renditions.length - 1]; // Lowest rendition for speed
    const renditionPath = path.join(tmpDir, `${targetRendition.height}.mp4`);

    await transcodeRendition({
      inputPath: clipPath,
      outputPath: renditionPath,
      targetHeight: targetRendition.height,
      probeInfo: clipProbe
    });

    assert.ok(fs.existsSync(renditionPath));
    const renditionProbe = await probeMedia(renditionPath);
    assert.equal(renditionProbe.video.codec, 'h264');
    assert.equal(renditionProbe.video.height, targetRendition.height);
    assert.equal(renditionProbe.audio.codec, 'aac');

    // 9.5 Transcode Speech to AAC .m4a audio dub
    const finalDubPath = path.join(tmpDir, 'dub_es.m4a');
    const aacProc = spawnSync(ffmpeg, [
      '-y',
      '-i', ttsResult.audioPath,
      '-c:a', 'aac',
      '-b:a', '128k',
      finalDubPath
    ], { encoding: 'utf8', windowsHide: true });
    assert.equal(aacProc.status, 0);

    // 10. Manifest Registration & Cache Revalidation
    const manifestStore = new ManifestStore(tmpDir);
    const videoEntry = {
      id: 'real_clip_test',
      src: clipPath,
      languages: ['es']
    };

    manifestStore.saveMultilingualSubtitles(videoEntry, 'en', { es: vttContent });
    manifestStore.saveMultilingualAudio(videoEntry, 'en', { es: finalDubPath });

    const isSubCached = manifestStore.isLanguageCached('real_clip_test', 'es');
    assert.equal(isSubCached, true);

    const isAudCached = manifestStore.isAudioLanguageCached('real_clip_test', 'es');
    assert.equal(isAudCached, true);

    // 11. Player Playback Resolution
    const manifest = manifestStore.loadManifest();
    const entry = manifest['real_clip_test'];

    const subAvailability = resolveSubtitleAvailability({
      generatedSubtitles: { es: entry.subtitles.es.src },
      videoKey: 'real_clip_test'
    });
    assert.equal(subAvailability.hasAvailableSubtitles, true);
    assert.ok(subAvailability.availableLanguages.includes('es'));

    const audAvailability = resolveAudioAvailability({
      manifestAudio: entry.audioLanguages,
      videoKey: 'real_clip_test'
    });
    assert.equal(audAvailability.hasAvailableAudio, true);
    assert.ok(audAvailability.availableLanguages.includes('es'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
