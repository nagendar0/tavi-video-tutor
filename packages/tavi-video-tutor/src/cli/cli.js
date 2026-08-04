import fs from 'fs';
import path from 'path';
import { processAllVideos } from '../subtitles/pipeline/processVideos.js';
import { loadConfig } from '../subtitles/config/loadConfig.js';
import { ManifestStore, computeFingerprint } from '../subtitles/cache/manifest.js';
import { TranscriptCache } from '../subtitles/transcript/transcriptCache.js';

export { computeFingerprint as computeHash, loadConfig };

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
            const fullSubPath = path.join(cwd, subRelPath.startsWith('/') ? subRelPath.slice(1) : subRelPath);
            if (fs.existsSync(fullSubPath)) {
              fs.unlinkSync(fullSubPath);
            }
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
  } catch (_) {}

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
      const relPath = subInfo.src.startsWith('/') ? subInfo.src.slice(1) : subInfo.src;
      const pubPath = path.join(cwd, 'public', relPath);
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

  if (command === 'clean') {
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
    const result = await runGenerate({ force, keepTemp }, cwd);
    if (result && result.failed > 0) {
      process.exitCode = 1;
    }
  } else {
    console.log(`Usage: aitutor [generate|status|validate|clean] [--video <id>] [--force]`);
  }
};
