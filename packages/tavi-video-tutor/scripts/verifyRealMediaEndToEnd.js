import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawnSync } from 'child_process';
import assert from 'assert/strict';

import { probeMedia } from '../src/subtitles/video/MediaProbe.js';
import { extractAudio, getFFmpegBinaryPath, getFFprobeBinaryPath } from '../src/subtitles/audio/extractAudio.js';
import { planQualityLadder } from '../src/subtitles/video/QualityPlanner.js';
import { processVideoQuality } from '../src/subtitles/video/processVideoQuality.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { TimelineMixer } from '../src/subtitles/audio/mixer/TimelineMixer.js';
import { validateGeneratedAudio, createValidWaveBuffer } from '../src/subtitles/audio/validateAudio.js';

console.log('============================================================');
console.log('PHASE 27: REAL MEDIA END-TO-END VERIFICATION');
console.log('============================================================\n');

const FIXTURE_CANDIDATES = [
  path.resolve(process.cwd(), '../../examples/react-demo/public/sample.mp4'),
  path.resolve(process.cwd(), '../examples/react-demo/public/sample.mp4'),
  path.resolve(process.cwd(), 'examples/react-demo/public/sample.mp4'),
  path.resolve(process.cwd(), '../../examples/react-demo/public/demo-video.mp4'),
  path.resolve(process.cwd(), '../examples/react-demo/public/demo-video.mp4'),
  path.resolve(process.cwd(), 'examples/react-demo/public/demo-video.mp4')
];
const REAL_MEDIA_SOURCE = FIXTURE_CANDIDATES.find(p => fs.existsSync(p));
const ffmpeg = getFFmpegBinaryPath();
const ffprobe = getFFprobeBinaryPath();

async function runRealMediaAudit() {
  assert.ok(fs.existsSync(REAL_MEDIA_SOURCE), `Real media file must exist at ${REAL_MEDIA_SOURCE}`);
  const stat = fs.statSync(REAL_MEDIA_SOURCE);
  console.log(`[1/6] Real Media File Verified:`);
  console.log(`      Path: ${REAL_MEDIA_SOURCE}`);
  console.log(`      Size: ${(stat.size / (1024 * 1024)).toFixed(2)} MB`);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-realmedia-verify-'));
  const clipPath = path.join(tmpDir, 'real_sample_clip.mp4');

  try {
    // 1. Cut a clean 5-second sample from the real video with re-encoding to guarantee clean keyframe
    console.log(`\n[2/6] Extracting representative 5-second test clip from real media...`);
    const cutProc = spawnSync(ffmpeg, [
      '-y',
      '-ss', '5.0',
      '-i', REAL_MEDIA_SOURCE,
      '-t', '5.0',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      clipPath
    ], { encoding: 'utf8', windowsHide: true });

    assert.equal(cutProc.status, 0, `FFmpeg clip extraction failed: ${cutProc.stderr}`);
    assert.ok(fs.existsSync(clipPath) && fs.statSync(clipPath).size > 1000, 'Clip must exist and have content');
    console.log(`      Clip created: ${clipPath} (${fs.statSync(clipPath).size} bytes)`);

    // 2. Run MediaProbe on real clip
    console.log(`\n[3/6] Running MediaProbe on real clip...`);
    const probe = await probeMedia(clipPath);
    console.log(`      Container:   ${probe.container}`);
    console.log(`      Resolution:  ${probe.video.width}x${probe.video.height}`);
    console.log(`      Video Codec: ${probe.video.codec}`);
    console.log(`      Audio Codec: ${probe.audio.codec}, ${probe.audio.sampleRate}Hz, ${probe.audio.channels} channels`);
    assert.equal(probe.container, 'mp4');
    assert.ok(probe.video.width > 0 && probe.video.height > 0);
    assert.ok(probe.hasAudio, 'Real clip must have audio stream');

    // 3. Run extractAudio on real clip
    console.log(`\n[4/6] Extracting audio stream from real clip...`);
    const audioOutPath = path.join(tmpDir, 'extracted_real.wav');
    const audioRes = await extractAudio(clipPath, audioOutPath);
    const extractedWav = audioRes.audioPath;
    console.log(`      Extracted: ${extractedWav} (${fs.statSync(extractedWav).size} bytes)`);
    const audioValidation = validateGeneratedAudio(extractedWav, {
      minSizeBytes: 1000,
      decodeTest: true,
      rejectSilence: true,
      rejectTone: true
    });
    assert.equal(audioValidation.valid, true, `Extracted audio must be valid WAV: ${audioValidation.message}`);
    console.log(`      Audio Validation: PASS (Valid PCM WAV, ${audioValidation.duration.toFixed(2)}s)`);

    // 4. Test Quality Ladder Transcoding on real clip
    console.log(`\n[5/6] Testing Video Quality Ladder Transcoding...`);
    const manifestStore = new ManifestStore(tmpDir);
    const videoEntry = {
      id: 'real_lesson',
      src: clipPath,
      languages: ['en', 'hi', 'te'],
      audio: { languages: ['en', 'hi'] }
    };

    const qualityResult = await processVideoQuality(videoEntry, manifestStore, {
      config: { qualities: { targets: [360, 480] } }
    });
    assert.equal(qualityResult.status, 'complete');
    assert.ok(qualityResult.qualities.length >= 2);
    console.log(`      Transcoded ${qualityResult.qualities.length} renditions (${qualityResult.qualities.map(q => q.label).join(', ')})`);

    for (const q of qualityResult.qualities) {
      const filePath = q.source ? clipPath : path.join(tmpDir, 'public', q.src.replace(/^\//, ''));
      assert.ok(fs.existsSync(filePath), `Quality rendition ${q.label} must exist on disk at ${filePath}`);
      const qProbe = await probeMedia(filePath);
      assert.equal(qProbe.video.codec, 'h264');
      console.log(`      ✓ Rendition ${q.label}: ${qProbe.video.width}x${qProbe.video.height} (${fs.statSync(filePath).size} bytes)`);
    }

    // 5. Test Audio Dubbing & Multi-Speaker Stitching on Real Timeline
    console.log(`\n[6/6] Testing Audio Dubbing Pipeline & TimelineMixer with real audio validation...`);
    const synthDir = path.join(tmpDir, 'synth');
    fs.mkdirSync(synthDir, { recursive: true });

    // Realistic non-silent speech audio generator for test pipeline
    const mockTTS = {
      synthesize: async (text, lang, opts) => {
        const segPath = path.join(opts.outputDir, `${lang}_${Date.now()}_${Math.random().toString(36).substring(2,6)}.wav`);
        spawnSync(ffmpeg, [
          '-y',
          '-f', 'lavfi', '-i', 'anoisesrc=d=2.5:c=pink:r=16000:a=0.15',
          '-af', 'lowpass=f=3000,highpass=f=200',
          segPath
        ], { windowsHide: true });
        return { audioPath: segPath, duration: 2.5, format: 'wav' };
      }
    };

    const mockTranscriber = {
      transcribe: async () => ({
        language: 'en',
        segments: [
          { id: 'seg_000001', start: 0.0, end: 2.5, text: 'Welcome to this computer science lecture.' },
          { id: 'seg_000002', start: 2.5, end: 5.0, text: 'Today we will discuss algorithms and systems.' }
        ]
      })
    };

    const mockTranslator = {
      supports: () => true,
      translateSegments: async (segs, src, tgt) => {
        const translations = {
          hi: [
            'इस कंप्यूटर विज्ञान व्याख्यान में आपका स्वागत है।',
            'आज हम एल्गोरिदम और सिस्टम पर चर्चा करेंगे।'
          ],
          te: [
            'ఈ కంప్యూటర్ సైన్స్ ఉపన్యాసానికి స్వాగతం.',
            'ఈ రోజు మనం అల్గోరిథంలు మరియు వ్యవస్థల గురించి చర్చిస్తాము.'
          ]
        };
        return segs.map((s, idx) => ({
          ...s,
          text: translations[tgt]?.[idx] || (tgt === 'en' ? s.text : s.text),
          translatedText: translations[tgt]?.[idx] || (tgt === 'en' ? s.text : s.text),
          originalText: s.text
        }));
      }
    };

    const pipelineResult = await processSingleVideo(videoEntry, manifestStore, {
      transcriber: mockTranscriber,
      translator: mockTranslator,
      ttsProvider: mockTTS,
      audioLanguages: ['en', 'hi', 'te']
    });

    assert.equal(pipelineResult.status, 'completed');
    console.log(`      Pipeline Status: completed`);

    // Validate manifest and media files
    const manifest = manifestStore.loadManifest();
    const entry = manifest['real_lesson'];
    assert.ok(entry, 'Manifest entry must exist');
    assert.ok(entry.audioLanguages.en, 'English audio track must exist');
    assert.ok(entry.audioLanguages.hi, 'Hindi audio track must exist');
    assert.ok(entry.audioLanguages.te, 'Telugu audio track must exist');

    const pubHi = path.join(tmpDir, 'public', 'aitutor', 'audio', 'real_lesson', 'hi.m4a');
    const pubTe = path.join(tmpDir, 'public', 'aitutor', 'audio', 'real_lesson', 'te.m4a');
    assert.ok(fs.existsSync(pubHi), 'Hindi dubbed m4a must exist');
    assert.ok(fs.existsSync(pubTe), 'Telugu dubbed m4a must exist');

    const hiValidation = validateGeneratedAudio(pubHi, { expectedCodec: 'aac', decodeTest: true });
    assert.equal(hiValidation.valid, true, `Generated Hindi dub must be valid AAC M4A: ${hiValidation.message}`);
    console.log(`      ✓ Hindi Dubbed Audio Verified (AAC, ${hiValidation.duration.toFixed(2)}s, ${fs.statSync(pubHi).size} bytes)`);

    const teValidation = validateGeneratedAudio(pubTe, { expectedCodec: 'aac', decodeTest: true });
    assert.equal(teValidation.valid, true, `Generated Telugu dub must be valid AAC M4A: ${teValidation.message}`);
    console.log(`      ✓ Telugu Dubbed Audio Verified (AAC, ${teValidation.duration.toFixed(2)}s, ${fs.statSync(pubTe).size} bytes)`);

    console.log('\n============================================================');
    console.log('✅ ALL REAL MEDIA END-TO-END VERIFICATION CHECKS PASSED');
    console.log('============================================================\n');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

runRealMediaAudit().catch(err => {
  console.error('\n❌ REAL MEDIA VERIFICATION FAILED:\n', err);
  process.exit(1);
});
