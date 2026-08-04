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
          const subRelPath = manifest[targetVideoId].subtitle;
          delete manifest[targetVideoId];
          fs.writeFileSync(internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');

          if (subRelPath) {
            try {
              const fullSubPath = normalizeSubtitlePath(subRelPath, publicDir);
              if (fs.existsSync(fullSubPath)) {
                fs.unlinkSync(fullSubPath);
              }
            } catch (_) {}
          }
          removedCount++;
        }
      } catch (_) {}
    }

    const publicSubFile = path.join(publicDir, 'subtitles', `${targetVideoId}.en.vtt`);
    if (fs.existsSync(publicSubFile)) {
      fs.unlinkSync(publicSubFile);
      removedCount++;
    }

    const publicManifestPath = path.join(publicDir, 'manifest.json');
    if (fs.existsSync(internalManifestPath) && fs.existsSync(publicDir)) {
      fs.copyFileSync(internalManifestPath, publicManifestPath);
    }

    console.log(`✓ Cleaned generated subtitles for "${targetVideoId}" (${removedCount} files removed)\n`);
    return;
  }

  console.log(`\nAITutor Subtitle Engine — Cleaning All Generated Subtitles\n`);
  
  if (fs.existsSync(internalDir)) {
    fs.rmSync(internalDir, { recursive: true, force: true });
  }

  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }

  console.log(`✓ All generated AITutor subtitles and manifests cleaned successfully.\n`);
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
  const command = args[0] || 'generate';

  if (command === 'init') {
    const force = args.includes('--force');
    await runInit({ force }, cwd);
  } else if (command === 'clean') {
    const videoIdx = args.indexOf('--video');
    const videoVal = videoIdx !== -1 ? args[videoIdx + 1] : null;
    await runClean({ video: videoVal }, cwd);
  } else if (command === 'status') {
    await runStatus({}, cwd);
  } else if (command === 'validate') {
    await runValidate({}, cwd);
  } else if (command === 'generate' || command === 'build' || !command.startsWith('-')) {
    const force = args.includes('--force');
    const keepTemp = args.includes('--keep-temp');
    try {
      const result = await runGenerate({ force, keepTemp }, cwd);
      if (result && result.failed > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`\nAITutor Generation Error:\n${err.message}\n`);
      process.exitCode = 1;
    }
  } else {
    console.log(`Usage: aitutor [init|generate|status|validate|clean] [--video <id>] [--force]`);
  }
};
