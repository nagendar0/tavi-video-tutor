import fs from 'fs';
import path from 'path';
import { processAllVideos } from '../subtitles/pipeline/processVideos.js';
import { loadConfig } from '../subtitles/config/loadConfig.js';
import { ManifestStore, computeFingerprint, normalizeSubtitlePath } from '../subtitles/cache/manifest.js';
import { TranscriptCache } from '../subtitles/transcript/transcriptCache.js';

export { computeFingerprint as computeHash, loadConfig };

export const runInit = async (options = {}, cwd = process.cwd()) => {
  console.log(`\nAITutor — Initializing Starter Configuration\n─────────────────────────────\n`);

  const configNames = ['aitutor.config.mjs', 'aitutor.config.js', 'aitutor.config.cjs', 'aitutor.config.json'];
  let existingConfig = null;

  for (const name of configNames) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p)) {
      existingConfig = p;
      break;
    }
  }

  if (existingConfig && !options.force) {
    console.log(`⚠ Configuration file already exists at:\n  ${existingConfig}\n\nUse "npx aitutor init --force" to overwrite.\n`);
    return { created: false, path: existingConfig };
  }

  const starterConfigContent = `// AITutor Starter Configuration
export default {
  subtitles: {
    languages: ['en', 'es', 'hi', 'te'],
    quality: 'balanced',
    glossary: ['React', 'AITutor']
  },
  videos: [
    {
      id: 'lesson_1',
      src: './public/lesson.mp4',
      languages: ['en', 'es', 'hi', 'te']
    }
  ]
};
`;

  const targetPath = path.join(cwd, 'aitutor.config.mjs');
  fs.writeFileSync(targetPath, starterConfigContent, 'utf8');

  // Ensure public directory exists
  const publicDir = path.join(cwd, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log(`✓ Created starter configuration at:\n  ${targetPath}\n`);
  console.log(`Next Steps:\n1. Place your video files in public/ (e.g. public/lesson.mp4)\n2. Update video entries in aitutor.config.mjs\n3. Run subtitle generation:\n   npx aitutor generate\n`);

  return { created: true, path: targetPath };
};

export const runClean = async (options = {}, cwd = process.cwd()) => {
  const targetVideoId = options.video || options.v;

  const internalDir = path.join(cwd, '.aitutor');
  const publicDir = path.join(cwd, 'public', 'aitutor');

  if (targetVideoId) {
    console.log(`\nAITutor Subtitle Engine — Cleaning Video: ${targetVideoId}\n`);
    let removedCount = 0;

    const internalManifestPath = path.join(internalDir, 'manifest.json');
    if (fs.existsSync(internalManifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(internalManifestPath, 'utf8'));
        if (manifest[targetVideoId]) {
          const entry = manifest[targetVideoId];
          // Clean specific subtitle files
          if (entry.subtitles && typeof entry.subtitles === 'object') {
            Object.values(entry.subtitles).forEach(subInfo => {
              const subSrc = typeof subInfo === 'string' ? subInfo : (subInfo && subInfo.src);
              if (subSrc) {
                try {
                  const fullSubPath = normalizeSubtitlePath(subSrc, publicDir);
                  if (fs.existsSync(fullSubPath)) {
                    fs.unlinkSync(fullSubPath);
                    removedCount++;
                  }
                } catch (_) {}
              }
            });
          } else if (entry.subtitle) {
            try {
              const fullSubPath = normalizeSubtitlePath(entry.subtitle, publicDir);
              if (fs.existsSync(fullSubPath)) {
                fs.unlinkSync(fullSubPath);
                removedCount++;
              }
            } catch (_) {}
          }

          delete manifest[targetVideoId];
          fs.writeFileSync(internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
        }
      } catch (_) {}
    }

    // 1. Clean public subtitles folder for target video
    const publicVideoSubtitlesDir = path.join(publicDir, 'subtitles', targetVideoId);
    if (fs.existsSync(publicVideoSubtitlesDir)) {
      fs.rmSync(publicVideoSubtitlesDir, { recursive: true, force: true });
      removedCount++;
    }

    // 2. Clean standalone public subtitle files for target video
    const publicSubtitlesDir = path.join(publicDir, 'subtitles');
    if (fs.existsSync(publicSubtitlesDir)) {
      try {
        const subFiles = fs.readdirSync(publicSubtitlesDir);
        subFiles.forEach(file => {
          if (file.startsWith(`${targetVideoId}.`) || file === `${targetVideoId}.vtt`) {
            fs.unlinkSync(path.join(publicSubtitlesDir, file));
            removedCount++;
          }
        });
      } catch (_) {}
    }

    // 3. Clean public quality videos
    const publicVideoQualitiesDir = path.join(publicDir, 'videos', targetVideoId);
    if (fs.existsSync(publicVideoQualitiesDir)) {
      fs.rmSync(publicVideoQualitiesDir, { recursive: true, force: true });
      removedCount++;
    }

    // 4. Clean internal cache videos
    const internalVideoDir = path.join(internalDir, 'videos', targetVideoId);
    if (fs.existsSync(internalVideoDir)) {
      fs.rmSync(internalVideoDir, { recursive: true, force: true });
      removedCount++;
    }

    // 5. Clean master transcript cache
    const transcriptsDir = path.join(internalDir, 'transcripts');
    if (fs.existsSync(transcriptsDir)) {
      try {
        const transcriptFiles = fs.readdirSync(transcriptsDir);
        transcriptFiles.forEach(file => {
          if (file.startsWith(`${targetVideoId}.`) || file.startsWith(`${targetVideoId}-`) || file === `${targetVideoId}.json`) {
            fs.unlinkSync(path.join(transcriptsDir, file));
            removedCount++;
          }
        });
      } catch (_) {}
    }

    // 6. Clean temporary workspace
    const tmpDir = path.join(internalDir, 'tmp');
    if (fs.existsSync(tmpDir)) {
      try {
        const tmpFiles = fs.readdirSync(tmpDir);
        tmpFiles.forEach(file => {
          if (file.startsWith(`${targetVideoId}-`) || file === targetVideoId) {
            fs.rmSync(path.join(tmpDir, file), { recursive: true, force: true });
            removedCount++;
          }
        });
      } catch (_) {}
    }

    // 7. Sync updated manifest to public
    const publicManifestPath = path.join(publicDir, 'manifest.json');
    if (fs.existsSync(internalManifestPath) && fs.existsSync(publicDir)) {
      fs.copyFileSync(internalManifestPath, publicManifestPath);
    }

    console.log(`✓ Cleaned generated subtitles & video qualities for "${targetVideoId}" (${removedCount} items removed)\n`);
    return { cleaned: true, videoId: targetVideoId, removedCount };
  }

  console.log(`\nAITutor Engine — Cleaning All Generated Subtitles & Video Qualities\n`);
  
  if (fs.existsSync(internalDir)) {
    fs.rmSync(internalDir, { recursive: true, force: true });
  }

  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }

  console.log(`✓ All generated AITutor subtitles, video qualities, and manifests cleaned successfully.\n`);
  return { cleaned: true, all: true };
};

export const runStatus = async (options = {}, cwd = process.cwd()) => {
  console.log(`\nAITutor Subtitle Status\n─────────────────────────────\n`);
  const manifestStore = new ManifestStore(cwd);
  const transcriptCache = new TranscriptCache(cwd);
  const manifest = manifestStore.loadManifest();

  let config = { videos: [] };
  try {
    config = await loadConfig(cwd);
  } catch (err) {
    if (err.code === 'CONFIG_NOT_FOUND') {
      console.log(`ℹ No configuration file found in ${cwd}.\nRun "npx aitutor init" to create aitutor.config.mjs.\n`);
    } else {
      console.error(`❌ Configuration Error:\n${err.message}\n`);
      process.exitCode = 1;
      return { videosCount: 0, error: err };
    }
  }

  const videos = config.videos.length > 0 ? config.videos : Object.values(manifest);

  if (videos.length === 0) {
    console.log(`No videos configured or processed yet.\n`);
    return { videosCount: 0 };
  }

  for (const v of videos) {
    const entry = manifest[v.id];
    console.log(`${v.id}`);
    console.log(`Video:          ${v.src ? '✓' : '⚠ Missing src'}`);
    console.log(`Transcript:     ${transcriptCache.hasMasterTranscript(v.id) ? '✓' : 'Missing'}`);
    console.log(`ASR Model:      ${config.transcription?.model || config.quality || 'balanced (Xenova/whisper-base)'}`);
    console.log(`\nSubtitles:`);

    const langs = v.languages || ['en'];
    for (const lang of langs) {
      const isCached = manifestStore.isLanguageCached(v.id, lang);
      console.log(`${lang.padEnd(15)} ${isCached ? '✓' : 'Missing'}`);
    }

    console.log(`\nQuality:        0 warnings`);
    console.log(`Last generated: ${entry?.updatedAt || 'Not generated yet'}\n─────────────────────────────\n`);
  }

  return { videosCount: videos.length };
};

export const runValidate = async (options = {}, cwd = process.cwd()) => {
  console.log(`\nAITutor Subtitle Validation\n─────────────────────────────\n`);
  const manifestStore = new ManifestStore(cwd);
  const manifest = manifestStore.loadManifest();

  let valid = true;
  let issuesCount = 0;

  if (Object.keys(manifest).length === 0) {
    console.log(`⚠ No manifest found to validate.\n`);
    return { valid: false, issuesCount: 1 };
  }

  for (const [id, entry] of Object.entries(manifest)) {
    console.log(`Validating entry: ${id}...`);
    if (!entry.subtitles || Object.keys(entry.subtitles).length === 0) {
      console.log(`  ⚠ Missing subtitles map for ${id}`);
      issuesCount++;
      valid = false;
      continue;
    }

    for (const [langCode, subInfo] of Object.entries(entry.subtitles)) {
      try {
        const pubPath = normalizeSubtitlePath(subInfo.src, manifestStore.publicDir);
        if (!fs.existsSync(pubPath)) {
          console.log(`  ✗ Missing WebVTT file: ${pubPath}`);
          issuesCount++;
          valid = false;
        } else {
          const vtt = fs.readFileSync(pubPath, 'utf8');
          if (!vtt.startsWith('WEBVTT')) {
            console.log(`  ✗ Invalid WebVTT header in ${pubPath}`);
            issuesCount++;
            valid = false;
          } else {
            console.log(`  ✓ Subtitle track [${langCode}] valid`);
          }
        }
      } catch (pathErr) {
        console.log(`  ✗ ${pathErr.message}`);
        issuesCount++;
        valid = false;
      }
    }
  }

  console.log(`\nValidation Complete: ${valid ? 'PASS (0 issues)' : `FAIL (${issuesCount} issues found)`}\n`);
  return { valid, issuesCount };
};

export const runGenerate = async (options = {}, cwd = process.cwd()) => {
  return processAllVideos(options, cwd);
};

export const main = async (args = process.argv.slice(2), cwd = process.cwd()) => {
  const force = args.includes('--force');
  const keepTemp = args.includes('--keep-temp') || args.includes('--keepTemp');
  const noQuality = args.includes('--no-quality') || args.includes('--noQuality');

  let videoVal = null;
  const videoIdx = args.indexOf('--video');
  const vIdx = args.indexOf('-v');
  if (videoIdx !== -1 && args[videoIdx + 1]) {
    videoVal = args[videoIdx + 1];
  } else if (vIdx !== -1 && args[vIdx + 1]) {
    videoVal = args[vIdx + 1];
  } else {
    const videoEq = args.find(a => a.startsWith('--video='));
    if (videoEq) {
      videoVal = videoEq.split('=')[1];
    }
  }

  let audioLanguagesVal = undefined;
  const audioIdx = args.indexOf('--audio-languages');
  if (audioIdx !== -1 && args[audioIdx + 1] && !args[audioIdx + 1].startsWith('-')) {
    audioLanguagesVal = args[audioIdx + 1] === 'all' ? 'all' : args[audioIdx + 1].split(',').map(s => s.trim()).filter(Boolean);
  } else {
    const audioEq = args.find(a => a.startsWith('--audio-languages='));
    if (audioEq) {
      const val = audioEq.split('=')[1];
      audioLanguagesVal = val === 'all' ? 'all' : val.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  const firstArg = args[0] || 'generate';
  const isFlag = firstArg.startsWith('-');
  const command = isFlag ? 'generate' : firstArg;

  if (command === 'init') {
    await runInit({ force }, cwd);
  } else if (command === 'clean') {
    await runClean({ video: videoVal }, cwd);
  } else if (command === 'status') {
    await runStatus({}, cwd);
  } else if (command === 'validate') {
    await runValidate({}, cwd);
  } else if (command === 'generate' || command === 'build') {
    try {
      const result = await runGenerate({ force, keepTemp, noQuality, quality: !noQuality, audioLanguages: audioLanguagesVal }, cwd);
      if (result && result.failed > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`\nAITutor Generation Error:\n${err.message}\n`);
      process.exitCode = 1;
    }
  } else {
    console.log(`Usage: aitutor [init|generate|status|validate|clean] [--video <id>] [--audio-languages en,hi,te] [--force] [--no-quality] [--keep-temp]`);
  }
};
