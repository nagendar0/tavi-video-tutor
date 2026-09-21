import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { EdgeTTSProvider } from '../src/subtitles/tts/EdgeTTSProvider.js';
import { validateGeneratedAudio } from '../src/subtitles/audio/validateAudio.js';

const REAL_VIDEO_PATH = 'C:/Users/nagen/OneDrive/Videos/Screen Recordings/Screen Recording 2026-07-25 231931.mp4';
const CONSUMER_DIR = path.resolve('../../fresh-consumer-audio-test');

async function runRealVideoValidation() {
  console.log('\n============================================================');
  console.log('REAL VIDEO VALIDATION — NEURAL DUBBING PIPELINE');
  console.log('============================================================\n');

  if (!fs.existsSync(REAL_VIDEO_PATH)) {
    throw new Error(`Real video not found at: ${REAL_VIDEO_PATH}`);
  }

  const manifestStore = new ManifestStore(CONSUMER_DIR);
  const neuralProvider = new EdgeTTSProvider({ timeoutMs: 30000, maxRetries: 3 });

  const videoEntry = {
    id: 'screen_recording',
    src: REAL_VIDEO_PATH,
    languages: ['en', 'hi', 'te'],
    audioLanguages: ['hi', 'te']
  };

  console.log(`Video ID:         ${videoEntry.id}`);
  console.log(`Video Source:     ${videoEntry.src}`);
  console.log(`Audio Languages:  ${videoEntry.audioLanguages.join(', ')}`);
  console.log(`TTS Provider:     EdgeTTSProvider (Neural)\n`);

  const startTime = Date.now();

  const result = await processSingleVideo(
    videoEntry,
    manifestStore,
    {
      ttsProvider: neuralProvider,
      audioLanguages: ['hi', 'te'],
      force: true,
      keepMasterTranscript: true,
      speakerConcurrency: 4,
      speakerMode: 'auto'
    },
    (evt) => {
      const msg = typeof evt === 'string' ? evt : evt.message;
      if (msg) {
        console.log(msg);
      }
    }
  );

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✓ Video Processing Completed in ${totalTimeSec}s\n`);

  // Verify and Validate Final Artifacts
  const audioDir = path.join(CONSUMER_DIR, 'public', 'aitutor', 'audio', 'screen_recording');
  const hiNeuralPath = path.join(audioDir, 'hi.m4a');
  const teNeuralPath = path.join(audioDir, 'te.m4a');
  const hiSystemPath = path.join(audioDir, 'hi_system.m4a');
  const teSystemPath = path.join(audioDir, 'te_system.m4a');

  console.log('------------------------------------------------------------');
  console.log('AUDIO VALIDATION & COMPARISON REPORT');
  console.log('------------------------------------------------------------');

  const hiNeuralVal = validateGeneratedAudio(hiNeuralPath, {
    minSizeBytes: 500,
    expectedCodec: 'aac',
    rejectSilence: true,
    rejectTone: true,
    decodeTest: true,
    throwOnError: true
  });
  console.log(`✓ Neural Hindi (hi.m4a):   Valid=${hiNeuralVal.valid}, Duration=${hiNeuralVal.duration.toFixed(2)}s, Size=${hiNeuralVal.size} bytes (${(hiNeuralVal.size / 1024 / 1024).toFixed(2)} MB)`);

  const teNeuralVal = validateGeneratedAudio(teNeuralPath, {
    minSizeBytes: 500,
    expectedCodec: 'aac',
    rejectSilence: true,
    rejectTone: true,
    decodeTest: true,
    throwOnError: true
  });
  console.log(`✓ Neural Telugu (te.m4a):  Valid=${teNeuralVal.valid}, Duration=${teNeuralVal.duration.toFixed(2)}s, Size=${teNeuralVal.size} bytes (${(teNeuralVal.size / 1024 / 1024).toFixed(2)} MB)`);

  const hiSysVal = fs.existsSync(hiSystemPath) ? validateGeneratedAudio(hiSystemPath, { decodeTest: false }) : null;
  const teSysVal = fs.existsSync(teSystemPath) ? validateGeneratedAudio(teSystemPath, { decodeTest: false }) : null;

  console.log('\n--- Side-by-Side Comparison ---');
  console.log(`Hindi System M4A:  Size = ${hiSysVal?.size || 'N/A'} bytes, Duration = ${hiSysVal?.duration?.toFixed(2) || 'N/A'}s`);
  console.log(`Hindi Neural M4A:  Size = ${hiNeuralVal.size} bytes, Duration = ${hiNeuralVal.duration.toFixed(2)}s`);
  console.log(`Telugu System M4A: Size = ${teSysVal?.size || 'N/A'} bytes, Duration = ${teSysVal?.duration?.toFixed(2) || 'N/A'}s`);
  console.log(`Telugu Neural M4A: Size = ${teNeuralVal.size} bytes, Duration = ${teNeuralVal.duration.toFixed(2)}s`);

  // Verify Manifest Registration
  const manifest = manifestStore.loadManifest();
  const entry = manifest[videoEntry.id];
  console.log('\n--- Manifest Status ---');
  console.log('Registered Audio Languages:', Object.keys(entry.audioLanguages || {}));
  console.log('Hindi Audio Src:', entry.audioLanguages?.hi?.src);
  console.log('Telugu Audio Src:', entry.audioLanguages?.te?.src);

  return {
    status: 'success',
    totalTimeSec,
    hiNeural: hiNeuralVal,
    teNeural: teNeuralVal,
    hiSystem: hiSysVal,
    teSystem: teSysVal,
    manifestEntry: entry
  };
}

if (process.argv[1] && process.argv[1].endsWith('runRealVideoValidation.mjs')) {
  runRealVideoValidation().catch(err => {
    console.error('Real Video Validation Error:', err);
    process.exit(1);
  });
}
