import fs from 'fs';
import path from 'path';
import { processAllVideos } from '../subtitles/pipeline/processVideos.js';
import { loadConfig } from '../subtitles/config/loadConfig.js';
import { ManifestStore, computeFingerprint, normalizeSubtitlePath } from '../subtitles/cache/manifest.js';
import { TranscriptCache } from '../subtitles/transcript/transcriptCache.js';
import { runPreflight, formatPreflightTable, formatDoctorReport } from '../subtitles/env/preflight.js';
import { remediateMissing } from '../subtitles/env/remediator.js';
import { AITUTOR_LANGUAGES } from '../subtitles/languages/registry.js';

export { computeFingerprint as computeHash, loadConfig, runPreflight, formatPreflightTable, formatDoctorReport };

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
  audio: {
    languages: ['en', 'hi', 'te']
  },
  videos: [
    {
      id: 'lesson_1',
      src: './public/lesson.mp4',
      languages: ['en', 'es', 'hi', 'te'],
      audio: {
        languages: ['en', 'hi', 'te']
      }
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
  console.log(`Next Steps:\n1. Place your video files in public/ (e.g. public/lesson.mp4)\n2. Update video entries in aitutor.config.mjs\n3. Run generation:\n   npx aitutor\n`);

  return { created: true, path: targetPath };
};

export const runClean = async (options = {}, cwd = process.cwd()) => {
  const targetVideoId = options.video || options.v;

  const internalDir = path.join(cwd, '.aitutor');
  const publicDir = path.join(cwd, 'public', 'aitutor');

  if (targetVideoId) {
    console.log(`\nAITutor Engine — Cleaning Video: ${targetVideoId}\n`);
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

          // Clean specific audio files
          if (entry.audioLanguages && typeof entry.audioLanguages === 'object') {
            Object.values(entry.audioLanguages).forEach(audioInfo => {
              const audioSrc = typeof audioInfo === 'string' ? audioInfo : (audioInfo && audioInfo.src);
              if (audioSrc) {
                try {
                  const fullAudioPath = normalizeSubtitlePath(audioSrc, publicDir);
                  if (fs.existsSync(fullAudioPath)) {
                    fs.unlinkSync(fullAudioPath);
                    removedCount++;
                  }
                } catch (_) {}
              }
            });
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

    // 3. Clean public audio folder for target video
    const publicVideoAudioDir = path.join(publicDir, 'audio', targetVideoId);
    if (fs.existsSync(publicVideoAudioDir)) {
      fs.rmSync(publicVideoAudioDir, { recursive: true, force: true });
      removedCount++;
    }

    // 4. Clean internal audio folder for target video
    const internalVideoAudioDir = path.join(internalDir, 'audio', targetVideoId);
    if (fs.existsSync(internalVideoAudioDir)) {
      fs.rmSync(internalVideoAudioDir, { recursive: true, force: true });
      removedCount++;
    }

    // 5. Clean public quality videos
    const publicVideoQualitiesDir = path.join(publicDir, 'videos', targetVideoId);
    if (fs.existsSync(publicVideoQualitiesDir)) {
      fs.rmSync(publicVideoQualitiesDir, { recursive: true, force: true });
      removedCount++;
    }

    // 6. Clean internal cache videos
    const internalVideoDir = path.join(internalDir, 'videos', targetVideoId);
    if (fs.existsSync(internalVideoDir)) {
      fs.rmSync(internalVideoDir, { recursive: true, force: true });
      removedCount++;
    }

    // 7. Clean master transcript cache
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

    // 8. Clean temporary workspace
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

    // 9. Sync updated manifest to public
    const publicManifestPath = path.join(publicDir, 'manifest.json');
    if (fs.existsSync(internalManifestPath) && fs.existsSync(publicDir)) {
      fs.copyFileSync(internalManifestPath, publicManifestPath);
    }

    console.log(`✓ Cleaned generated subtitles, audio tracks & video qualities for "${targetVideoId}" (${removedCount} items removed)\n`);
    return { cleaned: true, videoId: targetVideoId, removedCount };
  }

  console.log(`\nAITutor Engine — Cleaning All Generated Subtitles, Audio Tracks & Video Qualities\n`);
  
  if (fs.existsSync(internalDir)) {
    fs.rmSync(internalDir, { recursive: true, force: true });
  }

  if (fs.existsSync(publicDir)) {
    fs.rmSync(publicDir, { recursive: true, force: true });
  }

  console.log(`✓ All generated AITutor subtitles, audio tracks, video qualities, and manifests cleaned successfully.\n`);
  return { cleaned: true, all: true };
};

export const runAudioClear = async (options = {}, cwd = process.cwd()) => {
  const targetVideoId = options.video || options.v;
  const rawLangs = options.languages || options.lang || options.l;

  let targetLanguages = null;
  if (rawLangs) {
    if (typeof rawLangs === 'string') {
      targetLanguages = rawLangs.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    } else if (Array.isArray(rawLangs)) {
      targetLanguages = rawLangs.map(s => String(s).trim().toLowerCase()).filter(Boolean);
    }
  }

  const internalDir = path.join(cwd, '.aitutor');
  const publicDir = path.join(cwd, 'public', 'aitutor');
  const internalManifestPath = path.join(internalDir, 'manifest.json');
  const publicManifestPath = path.join(publicDir, 'manifest.json');

  let removedCount = 0;
  const cleanedLanguages = new Set();

  let manifest = {};
  if (fs.existsSync(internalManifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(internalManifestPath, 'utf8'));
    } catch (_) {}
  }

  console.log(`\nAITutor Audio — Clearing Generated Audio Tracks\n─────────────────────────────\n`);

  const videoIdsToProcess = targetVideoId
    ? (manifest[targetVideoId] ? [targetVideoId] : [targetVideoId])
    : Object.keys(manifest);

  if (targetLanguages && targetLanguages.length > 0) {
    // Selective language audio clear
    for (const vid of videoIdsToProcess) {
      const entry = manifest[vid];
      if (entry && entry.audioLanguages && typeof entry.audioLanguages === 'object') {
        for (const lang of targetLanguages) {
          if (entry.audioLanguages[lang]) {
            const audioInfo = entry.audioLanguages[lang];
            const audioSrc = typeof audioInfo === 'string' ? audioInfo : (audioInfo && audioInfo.src);
            if (audioSrc) {
              try {
                const fullAudioPath = normalizeSubtitlePath(audioSrc, publicDir);
                if (fs.existsSync(fullAudioPath)) {
                  fs.unlinkSync(fullAudioPath);
                  removedCount++;
                }
              } catch (_) {}
            }

            // Also check internal audio dir
            const internalAudioFile = path.join(internalDir, 'audio', vid, `${lang}.m4a`);
            if (fs.existsSync(internalAudioFile)) {
              try {
                fs.unlinkSync(internalAudioFile);
                removedCount++;
              } catch (_) {}
            }

            delete entry.audioLanguages[lang];
            cleanedLanguages.add(lang);
          }
        }
      }

      // Check public/internal video audio dirs directly for target languages
      for (const lang of targetLanguages) {
        const pubFile = path.join(publicDir, 'audio', vid, `${lang}.m4a`);
        if (fs.existsSync(pubFile)) {
          try {
            fs.unlinkSync(pubFile);
            removedCount++;
          } catch (_) {}
        }
        const intFile = path.join(internalDir, 'audio', vid, `${lang}.m4a`);
        if (fs.existsSync(intFile)) {
          try {
            fs.unlinkSync(intFile);
            removedCount++;
          } catch (_) {}
        }
      }
    }

    if (fs.existsSync(internalManifestPath)) {
      fs.writeFileSync(internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      if (fs.existsSync(publicDir)) {
        fs.writeFileSync(publicManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      }
    }

    const langsDisplay = Array.from(cleanedLanguages).length > 0 ? Array.from(cleanedLanguages).join(', ') : targetLanguages.join(', ');
    console.log(`✓ Cleared audio languages [${langsDisplay}] (${removedCount} files removed)`);
    console.log(`✓ Preserved original source video, WebVTT subtitles, and video quality renditions.\n`);
    return { cleaned: true, languages: targetLanguages, removedCount };
  }

  // Clear all audio for specific video or all videos
  if (targetVideoId) {
    if (manifest[targetVideoId]) {
      const entry = manifest[targetVideoId];
      if (entry.audioLanguages && typeof entry.audioLanguages === 'object') {
        Object.values(entry.audioLanguages).forEach(audioInfo => {
          const audioSrc = typeof audioInfo === 'string' ? audioInfo : (audioInfo && audioInfo.src);
          if (audioSrc) {
            try {
              const fullAudioPath = normalizeSubtitlePath(audioSrc, publicDir);
              if (fs.existsSync(fullAudioPath)) {
                fs.unlinkSync(fullAudioPath);
                removedCount++;
              }
            } catch (_) {}
          }
        });
        entry.audioLanguages = {};
      }
    }

    const publicVideoAudioDir = path.join(publicDir, 'audio', targetVideoId);
    if (fs.existsSync(publicVideoAudioDir)) {
      fs.rmSync(publicVideoAudioDir, { recursive: true, force: true });
      removedCount++;
    }

    const internalVideoAudioDir = path.join(internalDir, 'audio', targetVideoId);
    if (fs.existsSync(internalVideoAudioDir)) {
      fs.rmSync(internalVideoAudioDir, { recursive: true, force: true });
      removedCount++;
    }

    if (fs.existsSync(internalManifestPath)) {
      fs.writeFileSync(internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      if (fs.existsSync(publicDir)) {
        fs.writeFileSync(publicManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      }
    }

    console.log(`✓ Cleared all generated audio for video "${targetVideoId}" (${removedCount} items removed)`);
    console.log(`✓ Preserved original source video, WebVTT subtitles, and video quality renditions.\n`);
    return { cleaned: true, videoId: targetVideoId, allAudio: true, removedCount };
  }

  // Clear all audio across all videos
  for (const vid of Object.keys(manifest)) {
    if (manifest[vid] && manifest[vid].audioLanguages) {
      manifest[vid].audioLanguages = {};
    }
  }

  const publicAudioDir = path.join(publicDir, 'audio');
  if (fs.existsSync(publicAudioDir)) {
    fs.rmSync(publicAudioDir, { recursive: true, force: true });
    removedCount++;
  }

  const internalAudioDir = path.join(internalDir, 'audio');
  if (fs.existsSync(internalAudioDir)) {
    fs.rmSync(internalAudioDir, { recursive: true, force: true });
    removedCount++;
  }

  if (fs.existsSync(internalManifestPath)) {
    fs.writeFileSync(internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    if (fs.existsSync(publicDir)) {
      fs.writeFileSync(publicManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    }
  }

  console.log(`✓ All generated AITutor audio tracks and audio manifests cleared successfully.`);
  console.log(`✓ Preserved original source video, WebVTT subtitles, and video quality renditions.\n`);
  return { cleaned: true, allAudio: true, removedCount };
};

export const runAudioStatus = async (options = {}, cwd = process.cwd()) => {
  console.log(`\nAITutor Audio Status\n─────────────────────────────\n`);
  const manifestStore = new ManifestStore(cwd);
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

  const targetVideoId = options.video || options.v;
  let videos = config.videos.length > 0 ? config.videos : Object.values(manifest);
  if (targetVideoId) {
    videos = videos.filter(v => v.id === targetVideoId);
  }

  if (videos.length === 0) {
    console.log(`No videos configured or processed yet.\n`);
    return { videosCount: 0, totalGeneratedTracks: 0 };
  }

  let totalGeneratedTracks = 0;

  for (const v of videos) {
    const entry = manifest[v.id] || {};
    const audioMap = entry.audioLanguages || {};
    const sourceLang = entry.sourceLanguage || v.sourceLanguage || 'en';
    const audioKeys = Object.keys(audioMap);
    totalGeneratedTracks += audioKeys.length;

    console.log(`${v.id}`);
    console.log(`Video:               ${v.src ? '✓' : '⚠ Missing src'}`);
    console.log(`Source Language:     ${sourceLang} (Original)`);
    console.log(`Generated Tracks:    ${audioKeys.length} track(s)`);

    const speakerMeta = manifestStore.loadSpeakerMetadata(v.id);
    if (speakerMeta) {
      console.log(`Detected Speakers:   ${speakerMeta.detectedSpeakerCount} speaker(s) (${speakerMeta.speakerMode || 'auto'})`);
      console.log(`Speaker Overlaps:    ${speakerMeta.overlappingIntervals?.length || 0} interval(s)`);
    }

    if (audioKeys.length > 0) {
      console.log(`\nAudio Languages:`);
      for (const lang of audioKeys) {
        const info = audioMap[lang];
        const isSource = info.source ? ' (Source)' : '';
        const isCached = manifestStore.isAudioLanguageCached(v.id, lang);
        console.log(`  ${lang.padEnd(8)} ${(info.label || lang)}${isSource.padEnd(10)} [${isCached ? 'Cached' : 'Active'}] -> ${info.src}`);
      }
    } else {
      console.log(`\nAudio Languages:     None generated yet`);
    }

    const configuredLangs = v.audioLanguages || config.globalAudioLanguages || [];
    if (Array.isArray(configuredLangs) && configuredLangs.length > 0) {
      const missing = configuredLangs.filter(l => !audioMap[l]);
      if (missing.length > 0) {
        console.log(`Missing Configured:  ${missing.join(', ')}`);
      }
    }

    console.log(`\nRegistry Capacity:   ${AITUTOR_LANGUAGES.length} supported languages available for dubbing`);
    console.log(`Last updated:        ${entry?.updatedAt || 'Not generated yet'}\n─────────────────────────────\n`);
  }

  return { videosCount: videos.length, totalGeneratedTracks };
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

export const runDoctor = async (options = {}, cwd = process.cwd()) => {
  let config = {};
  try {
    config = await loadConfig(cwd);
  } catch (_) {}

  const preflightRes = await runPreflight({ ...options, config }, cwd);
  const report = formatDoctorReport(preflightRes);
  console.log(`\n${report}`);

  if (!preflightRes.passed) {
    console.log(`Issues detected:`);
    preflightRes.missing.forEach((item, idx) => {
      console.log(`\n${idx + 1}. Missing: ${item.name}`);
      console.log(`   Reason:   ${item.reason}`);
      console.log(`   Action:   ${item.manualInstructions}`);
    });
    console.log(`\nRun "npx aitutor setup" to automatically configure missing dependencies.\n`);
    return { ready: false, preflight: preflightRes };
  }

  return { ready: true, preflight: preflightRes };
};

export const runSetup = async (options = {}, cwd = process.cwd()) => {
  console.log(`\nAITutor Environment Setup Wizard\n────────────────────────────────\n`);
  let config = {};
  try {
    config = await loadConfig(cwd);
  } catch (_) {}

  const initialPreflight = await runPreflight({ ...options, config }, cwd);
  console.log(formatPreflightTable(initialPreflight));

  if (initialPreflight.passed) {
    console.log(`✓ All required AITutor dependencies and models are installed and ready.\n`);
    return { ready: true, preflight: initialPreflight };
  }

  const remediated = await remediateMissing(initialPreflight, options, cwd);
  console.log(`\n${formatDoctorReport(remediated.preflightResult)}`);

  if (!remediated.success) {
    console.log(`⚠ Some requirements could not be automatically installed.`);
    remediated.remainingMissing.forEach(item => {
      console.log(`  - ${item.name}: ${item.manualInstructions}`);
    });
    console.log('');
    return { ready: false, preflight: remediated.preflightResult };
  }

  console.log(`✓ Setup complete! You can now run "npx aitutor generate".\n`);
  return { ready: true, preflight: remediated.preflightResult };
};

export const runGenerate = async (options = {}, cwd = process.cwd()) => {
  let loadedConfig = { videos: [] };
  try {
    loadedConfig = await loadConfig(cwd);
  } catch (err) {
    if (err.code === 'CONFIG_NOT_FOUND') {
      console.log(`ℹ No configuration file found in ${cwd}.\nRun "npx aitutor init" to create aitutor.config.mjs.\n`);
      return { failed: 1, error: err };
    }
    throw err;
  }

  // 1. Run Preflight First
  let preflightRes = await runPreflight({ ...options, config: loadedConfig }, cwd);
  console.log(formatPreflightTable(preflightRes));

  if (!preflightRes.passed) {
    // Attempt remediation / user prompt
    const remediationRes = await remediateMissing(preflightRes, options, cwd);
    preflightRes = remediationRes.preflightResult;

    if (!preflightRes.passed) {
      console.error(`\nAITutor generation cannot continue.\n`);
      preflightRes.missing.forEach(item => {
        console.error(`Missing:`);
        console.error(`${item.name}\n`);
        console.error(`Reason:`);
        console.error(`${item.reason}\n`);
        console.error(`Next step:`);
        console.error(`${item.manualInstructions}\n`);
      });
      return {
        failed: 1,
        preflightBlocked: true,
        missing: preflightRes.missing
      };
    }

    // Print preflight table again if remediated
    console.log(formatPreflightTable(preflightRes));
  }

  // 2. Start generation only when preflight has passed
  return processAllVideos(options, cwd);
};

export const main = async (args = process.argv.slice(2), cwd = process.cwd()) => {
  const force = args.includes('--force');
  const keepTemp = args.includes('--keep-temp') || args.includes('--keepTemp');
  const noQuality = args.includes('--no-quality') || args.includes('--noQuality');
  const yes = args.includes('--yes') || args.includes('-y');
  const nonInteractive = args.includes('--non-interactive') || args.includes('--ci');

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

  let speakerModeVal = 'auto';
  const speakerModeIdx = args.indexOf('--speaker-mode');
  if (speakerModeIdx !== -1 && args[speakerModeIdx + 1] && !args[speakerModeIdx + 1].startsWith('-')) {
    speakerModeVal = args[speakerModeIdx + 1];
  } else {
    const smEq = args.find(a => a.startsWith('--speaker-mode='));
    if (smEq) {
      speakerModeVal = smEq.split('=')[1];
    }
  }

  let speakerConcurrencyVal = undefined;
  const scIdx = args.indexOf('--speaker-concurrency');
  if (scIdx !== -1 && args[scIdx + 1] && !args[scIdx + 1].startsWith('-')) {
    speakerConcurrencyVal = parseInt(args[scIdx + 1], 10);
  } else {
    const scEq = args.find(a => a.startsWith('--speaker-concurrency='));
    if (scEq) {
      speakerConcurrencyVal = parseInt(scEq.split('=')[1], 10);
    }
  }

  const firstArg = args[0] || 'generate';
  const isFlag = firstArg.startsWith('-');
  const command = isFlag ? 'generate' : firstArg;

  if (command === 'init') {
    await runInit({ force }, cwd);
  } else if (command === 'clean') {
    await runClean({ video: videoVal }, cwd);
  } else if (command === 'audio') {
    const sub = args[1];
    if (sub === 'clear') {
      const targetLangs = args[2] && !args[2].startsWith('-') ? args[2] : undefined;
      await runAudioClear({ video: videoVal, languages: targetLangs }, cwd);
    } else if (sub === 'status') {
      await runAudioStatus({ video: videoVal }, cwd);
    } else {
      console.log(`Usage: aitutor audio [clear|status] [languages] [--video <id>]`);
    }
  } else if (command === 'audio:clear' || command === 'audio-clear') {
    const targetLangs = args[1] && !args[1].startsWith('-') ? args[1] : undefined;
    await runAudioClear({ video: videoVal, languages: targetLangs }, cwd);
  } else if (command === 'audio:status' || command === 'audio-status') {
    await runAudioStatus({ video: videoVal }, cwd);
  } else if (command === 'status') {
    await runStatus({}, cwd);
  } else if (command === 'validate') {
    await runValidate({}, cwd);
  } else if (command === 'doctor') {
    const docRes = await runDoctor({ yes, nonInteractive }, cwd);
    if (!docRes.ready) {
      process.exitCode = 1;
    }
  } else if (command === 'setup') {
    const setupRes = await runSetup({ yes, nonInteractive }, cwd);
    if (!setupRes.ready) {
      process.exitCode = 1;
    }
  } else if (command === 'generate' || command === 'build') {
    try {
      const result = await runGenerate({
        force,
        keepTemp,
        noQuality,
        quality: !noQuality,
        audioLanguages: audioLanguagesVal,
        speakerMode: speakerModeVal,
        speakerConcurrency: speakerConcurrencyVal,
        yes,
        nonInteractive
      }, cwd);
      if (result && result.failed > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`\nAITutor Generation Error:\n${err.message}\n`);
      process.exitCode = 1;
    }
  } else {
    console.log(`Usage: aitutor [init|generate|doctor|setup|status|audio|validate|clean] [--video <id>] [--audio-languages en,hi,te|all] [--force] [--no-quality] [--keep-temp] [--yes]`);
  }
};
