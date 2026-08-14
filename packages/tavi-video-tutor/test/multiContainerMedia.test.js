import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { probeMedia } from '../src/subtitles/video/MediaProbe.js';
import { extractAudio, getFFmpegBinaryPath } from '../src/subtitles/audio/extractAudio.js';
import { planQualityLadder } from '../src/subtitles/video/QualityPlanner.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';
import { processVideoQuality } from '../src/subtitles/video/processVideoQuality.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';

console.log('🧪 Running Multi-Container Media Input Normalization Test Suite...\n');

const testDir = path.join(process.cwd(), '.test_multi_container');

const cleanTestDir = () => {
  if (fs.existsSync(testDir)) {
    try {
      fs.rmSync(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch (_) {}
  }
  fs.mkdirSync(testDir, { recursive: true });
};

const ffmpeg = getFFmpegBinaryPath();

const generateTestMedia = (filename, options = {}) => {
  const filePath = path.join(testDir, filename);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }

  const width = options.width || 320;
  const height = options.height || 240;
  const duration = options.duration || 1;
  const numAudioTracks = options.audioTracks !== undefined ? options.audioTracks : 1;
  const vcodec = options.vcodec || 'libx264';
  const acodec = options.acodec || 'aac';

  const args = ['-y', '-f', 'lavfi', '-i', `testsrc=size=${width}x${height}:rate=30:duration=${duration}`];

  if (numAudioTracks > 0) {
    for (let i = 0; i < numAudioTracks; i++) {
      const freq = 440 + i * 220;
      args.push('-f', 'lavfi', '-i', `sine=frequency=${freq}:duration=${duration}`);
    }
  }

  args.push('-c:v', vcodec);

  args.push('-map', '0:v');

  if (numAudioTracks > 0) {
    args.push('-c:a', acodec);
    for (let i = 0; i < numAudioTracks; i++) {
      args.push('-map', `${i + 1}:a`);
    }
  } else {
    args.push('-an');
  }

  if (options.extraArgs) {
    args.push(...options.extraArgs);
  }

  args.push(filePath);

  const res = spawnSync(ffmpeg, args, { stdio: 'pipe' });
  if (res.status !== 0) {
    throw new Error(`Failed to generate test fixture ${filename}: ${res.stderr?.toString()}`);
  }

  return filePath;
};

// ==========================================
// TEST SUITE 1: CANONICAL MEDIA PROBE MODEL
// ==========================================

test('1. MediaProbe correctly normalizes MP4 media into Canonical Model', async () => {
  cleanTestDir();
  const mp4Path = generateTestMedia('sample.mp4', { width: 640, height: 360, vcodec: 'libx264', acodec: 'aac' });
  const model = await probeMedia(mp4Path, { cwd: testDir });

  assert.strictEqual(model.container, 'mp4');
  assert.strictEqual(model.video.codec, 'h264');
  assert.strictEqual(model.video.width, 640);
  assert.strictEqual(model.video.height, 360);
  assert.strictEqual(model.hasAudio, true);
  assert.strictEqual(model.audio.codec, 'aac');
  assert.strictEqual(model.audioStreams.length, 1);
  assert.ok(model.fingerprint, 'Fingerprint must be present');
  console.log('  ✅ MP4 Canonical Model: OK');
});

test('2. MediaProbe correctly normalizes MKV media into Canonical Model', async () => {
  const mkvPath = generateTestMedia('sample.mkv', { width: 1280, height: 720, vcodec: 'libx264', acodec: 'aac' });
  const model = await probeMedia(mkvPath, { cwd: testDir });

  assert.strictEqual(model.container, 'mkv');
  assert.strictEqual(model.video.width, 1280);
  assert.strictEqual(model.video.height, 720);
  assert.strictEqual(model.hasAudio, true);
  console.log('  ✅ MKV Canonical Model: OK');
});

test('3. MediaProbe correctly normalizes AVI media into Canonical Model', async () => {
  const aviPath = generateTestMedia('sample.avi', { width: 640, height: 480, vcodec: 'mpeg4', acodec: 'mp3' });
  const model = await probeMedia(aviPath, { cwd: testDir });

  assert.strictEqual(model.container, 'avi');
  assert.strictEqual(model.video.width, 640);
  assert.strictEqual(model.video.height, 480);
  assert.strictEqual(model.hasAudio, true);
  console.log('  ✅ AVI Canonical Model: OK');
});

test('4. MediaProbe correctly normalizes WebM media into Canonical Model', async () => {
  const webmPath = generateTestMedia('sample.webm', { width: 640, height: 360, vcodec: 'libvpx-vp9', acodec: 'libopus' });
  const model = await probeMedia(webmPath, { cwd: testDir });

  assert.strictEqual(model.container, 'webm');
  assert.strictEqual(model.video.width, 640);
  assert.strictEqual(model.video.height, 360);
  assert.strictEqual(model.hasAudio, true);
  console.log('  ✅ WebM Canonical Model: OK');
});

test('5. MediaProbe correctly normalizes MOV media into Canonical Model', async () => {
  const movPath = generateTestMedia('sample.mov', { width: 1920, height: 1080, vcodec: 'libx264', acodec: 'aac' });
  const model = await probeMedia(movPath, { cwd: testDir });

  assert.strictEqual(model.container, 'mov');
  assert.strictEqual(model.video.width, 1920);
  assert.strictEqual(model.video.height, 1080);
  assert.strictEqual(model.hasAudio, true);
  console.log('  ✅ MOV Canonical Model: OK');
});

// ==========================================
// TEST SUITE 2: MULTI-AUDIO STREAM HANDLING
// ==========================================

test('6. Multi-Audio MKV detects all audio streams and extracts specific audioStreamIndex', async () => {
  const multiAudioMkv = generateTestMedia('multi_audio.mkv', {
    width: 640,
    height: 360,
    audioTracks: 2
  });

  const model = await probeMedia(multiAudioMkv, { cwd: testDir });
  assert.strictEqual(model.audioStreams.length >= 2, true, 'Must detect multiple audio streams');

  const workspace = {
    workspaceDir: testDir,
    getPath: (p) => path.join(testDir, p)
  };

  // Extract from track 0
  const extracted0 = await extractAudio(multiAudioMkv, workspace, { audioStreamNumber: 0 });
  assert.ok(fs.existsSync(extracted0.audioPath));
  assert.ok(extracted0.sizeBytes > 0);

  // Extract from track 1
  const extracted1 = await extractAudio(multiAudioMkv, workspace, { audioStreamNumber: 1 });
  assert.ok(fs.existsSync(extracted1.audioPath));
  assert.ok(extracted1.sizeBytes > 0);

  console.log('  ✅ Multi-Audio MKV Stream Selection: OK');
});

// ==========================================
// TEST SUITE 3: NO AUDIO VIDEO HANDLING
// ==========================================

test('7. Media without audio tracks is cleanly identified without crashing', async () => {
  const noAudioMp4 = generateTestMedia('no_audio.mp4', {
    width: 640,
    height: 360,
    audioTracks: 0
  });

  const model = await probeMedia(noAudioMp4, { cwd: testDir });
  assert.strictEqual(model.hasAudio, false);
  assert.strictEqual(model.audio, null);
  assert.strictEqual(model.audioStreams.length, 0);

  const workspace = {
    workspaceDir: testDir,
    getPath: (p) => path.join(testDir, 'audio_no_audio.wav')
  };

  await assert.rejects(
    async () => {
      await extractAudio(noAudioMp4, workspace);
    },
    /No audio stream found/
  );

  console.log('  ✅ No Audio Media Handling: OK');
});

// ==========================================
// TEST SUITE 4: ASPECT RATIO & QUALITY PLANNING
// ==========================================

test('8. QualityPlanner properly handles Portrait (9:16), Square (1:1) and Custom aspect ratios', () => {
  // Portrait 1080x1920
  const portraitPlan = planQualityLadder({ width: 1080, height: 1920 });
  assert.strictEqual(portraitPlan.source.isPortrait, true);
  portraitPlan.renditions.forEach(r => {
    assert.strictEqual(r.width % 2, 0, 'Width must be even');
    assert.strictEqual(r.height % 2, 0, 'Height must be even');
  });

  // Square 720x720
  const squarePlan = planQualityLadder({ width: 720, height: 720 });
  assert.strictEqual(squarePlan.source.isSquare, true);
  assert.strictEqual(squarePlan.renditions[0].width, 720);
  assert.strictEqual(squarePlan.renditions[0].height, 720);

  // 4:3 Aspect ratio (640x480)
  const standard43Plan = planQualityLadder({ width: 640, height: 480 });
  assert.strictEqual(standard43Plan.renditions[0].width, 640);
  assert.strictEqual(standard43Plan.renditions[0].height, 480);

  console.log('  ✅ Aspect Ratio & Safe Dimension Planning: OK');
});

// ==========================================
// TEST SUITE 5: BROWSER NORMALIZATION & PRESERVATION
// ==========================================

test('9. Non-browser containers (AVI, MKV) generate browser-compatible MP4 renditions while preserving source', async () => {
  const publicDir = path.join(testDir, 'public');
  const internalDir = path.join(testDir, '.aitutor');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(internalDir, { recursive: true });

  const aviPath = generateTestMedia('public/lesson.avi', { width: 640, height: 360, vcodec: 'mpeg4', acodec: 'mp3' });
  const originalSize = fs.statSync(aviPath).size;

  const manifestStore = new ManifestStore(testDir);
  const videoEntry = { id: 'avi_lesson', src: './public/lesson.avi' };

  const result = await processVideoQuality(videoEntry, manifestStore, {
    config: { qualities: { targets: [360] } }
  });

  assert.strictEqual(result.status, 'complete');
  assert.strictEqual(result.qualities.length, 1);
  assert.strictEqual(result.qualities[0].label, '360p');
  assert.strictEqual(result.qualities[0].type, 'video/mp4');
  assert.strictEqual(result.qualities[0].source, false, 'Non-browser source must be transcoded to MP4');

  // Verify source file was NOT modified or overwritten
  const afterSize = fs.statSync(aviPath).size;
  assert.strictEqual(originalSize, afterSize, 'Original AVI source must remain untouched');

  // Verify manifest contents
  const manifest = manifestStore.loadManifest();
  const entry = manifest['avi_lesson'];
  assert.ok(entry);
  assert.strictEqual(entry.source.container, 'avi');
  assert.strictEqual(entry.source.src, './public/lesson.avi');
  assert.ok(Array.isArray(entry.playback.qualities));
  assert.strictEqual(entry.playback.qualities[0].label, '360p');

  console.log('  ✅ Non-Browser Normalization & Source Preservation: OK');
});

// ==========================================
// TEST SUITE 6: FULL PIPELINE INTEGRATION
// ==========================================

test('10. Full ProcessVideo pipeline works seamlessly on MKV input container', async () => {
  const publicDir = path.join(testDir, 'public');
  const internalDir = path.join(testDir, '.aitutor');
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(internalDir, { recursive: true });

  const mkvPath = generateTestMedia('public/lecture.mkv', { width: 640, height: 360 });
  const manifestStore = new ManifestStore(testDir);

  const videoEntry = {
    id: 'mkv_lecture',
    src: './public/lecture.mkv',
    languages: ['en', 'hi', 'te'],
    audio: { languages: ['en', 'hi'] }
  };

  const dummyTranscriber = {
    transcribe: async () => ({
      language: 'en',
      segments: [
        { id: 0, start: 0, end: 1, text: 'Welcome to this multi container lesson.' }
      ]
    })
  };

  const dummyTranslator = {
    supports: () => true,
    translateSegments: async (segs, src, tgt) => segs.map(s => ({ ...s, text: `[${tgt}] ${s.text}` }))
  };

  const dummyTTS = {
    synthesize: async (text, lang, opts) => {
      const p = path.join(opts.outputDir, `${lang}_synth.m4a`);
      fs.writeFileSync(p, Buffer.alloc(100));
      return { audioPath: p, duration: 1.0 };
    }
  };

  const result = await processSingleVideo(videoEntry, manifestStore, {
    transcriber: dummyTranscriber,
    translator: dummyTranslator,
    ttsProvider: dummyTTS,
    audioLanguages: ['en', 'hi']
  });

  assert.strictEqual(result.status, 'completed');
  assert.strictEqual(result.sourceLanguage, 'en');

  const manifest = manifestStore.loadManifest();
  const entry = manifest['mkv_lecture'];
  assert.ok(entry);
  assert.strictEqual(entry.sourceLanguage, 'en');
  assert.strictEqual(entry.source.container, 'mkv');
  assert.ok(entry.subtitles['en']);
  assert.ok(entry.subtitles['hi']);
  assert.ok(entry.subtitles['te']);
  assert.ok(entry.audioLanguages['en']);
  assert.ok(entry.audioLanguages['hi']);
  assert.strictEqual(entry.audioLanguages['en'].source, true);
  assert.strictEqual(entry.audioLanguages['hi'].source, false);

  console.log('  ✅ Full Multi-Container Pipeline: OK');
});

test('11. Cleanup test fixtures', () => {
  cleanTestDir();
  console.log('  ✅ Test Fixture Cleanup: OK');
});
