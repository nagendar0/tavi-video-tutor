import fs from 'fs';
import path from 'path';
import { probeMedia } from './MediaProbe.js';
import { planQualityLadder } from './QualityPlanner.js';
import { transcodeRendition } from './FFmpegTranscoder.js';
import { resolveDirectMediaSource } from './resolveVideo.js';
import { computeMediaFingerprint } from '../cache/manifest.js';

export const processVideoQuality = async (videoEntry, manifestStore, options = {}, onProgress) => {
  const src = videoEntry.src;

  // 0. Explicit quality generation opt-out
  if (options.noQuality || options.quality === false || options.config?.qualities?.generate === false) {
    onProgress?.({
      type: 'quality-skipped',
      message: 'VIDEO QUALITY GENERATION: SKIPPED (--no-quality flag active)'
    });
    return { status: 'skipped', reason: 'no-quality' };
  }

  // 1. Remote HTTP/HTTPS video handling
  if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
    onProgress?.({
      type: 'remote-video-quality',
      message: 'REMOTE AUTO QUALITY GENERATION: SKIPPED (Remote URLs use original stream or explicit qualities prop)'
    });
    return { status: 'skipped', reason: 'remote-url' };
  }

  // 2. Resolve local file path
  let resolved;
  try {
    const dummyWorkspace = { cwd: manifestStore.cwd, getPath: (p) => path.join(manifestStore.internalDir, p) };
    resolved = resolveDirectMediaSource(videoEntry, dummyWorkspace, options);
  } catch (err) {
    onProgress?.({ type: 'quality-error', message: `⚠ Video quality generation skipped: ${err.message}` });
    return { status: 'error', error: err.message };
  }

  if (!resolved || resolved.type !== 'local' || !fs.existsSync(resolved.filePath)) {
    return { status: 'error', error: 'Local video file not found' };
  }

  // 3. Compute media fingerprint
  const currentFingerprint = computeMediaFingerprint(videoEntry, manifestStore.cwd, options.fingerprintExtra);

  // 4. Probe source video metadata
  let probeInfo;
  try {
    onProgress?.({ type: 'probing-media', message: `→ Probing video metadata for ${videoEntry.id}` });
    probeInfo = await probeMedia(resolved.filePath);
    onProgress?.({
      type: 'probe-complete',
      message: `✓ Source: ${probeInfo.width}x${probeInfo.height} @ ${probeInfo.fps}fps (${probeInfo.videoCodec}/${probeInfo.audioCodec})`
    });
  } catch (err) {
    onProgress?.({ type: 'quality-error', message: `⚠ Media probe failed: ${err.message}` });
    return { status: 'error', error: err.message };
  }

  // 5. Plan quality ladder
  const plan = planQualityLadder(probeInfo, options.config?.qualities || options.qualities || {});
  if (!plan.enabled || plan.renditions.length === 0) {
    onProgress?.({ type: 'quality-disabled', message: 'ℹ Quality generation disabled or no valid renditions planned' });
    return { status: 'disabled' };
  }

  const plannedLabels = plan.renditions.map(r => r.label).join(', ');
  onProgress?.({ type: 'plan-ready', message: `✓ Quality plan: ${plannedLabels}` });

  // Setup asset output directories
  const internalVideoDir = path.join(manifestStore.internalDir, 'videos', videoEntry.id);
  const publicVideoDir = path.join(manifestStore.publicDir, 'videos', videoEntry.id);
  fs.mkdirSync(internalVideoDir, { recursive: true });
  fs.mkdirSync(publicVideoDir, { recursive: true });

  const existingManifest = manifestStore.loadManifest();
  const existingEntry = existingManifest[videoEntry.id] || {};
  const isSameFingerprint = existingEntry.fingerprint === currentFingerprint;

  // 6. Check rendition cache & partial recovery
  const qualitiesMeta = [];
  let transcodedCount = 0;
  let cachedCount = 0;

  const validateRendition = async (filePath, rendition) => {
    const outputProbe = await probeMedia(filePath, { cwd: manifestStore.cwd });
    if (outputProbe.video?.codec !== 'h264' || outputProbe.video?.height !== rendition.height || outputProbe.video?.width !== rendition.width) {
      throw new Error(`QUALITY_VALIDATION_FAILED: ${rendition.label} produced ${outputProbe.video?.codec || 'unknown'} ${outputProbe.video?.width || 0}x${outputProbe.video?.height || 0}; expected H.264 ${rendition.width}x${rendition.height}.`);
    }
    if (probeInfo.duration > 0 && (!Number.isFinite(outputProbe.duration) || Math.abs(outputProbe.duration - probeInfo.duration) > 2)) {
      throw new Error(`QUALITY_VALIDATION_FAILED: ${rendition.label} duration ${outputProbe.duration}s differs from source ${probeInfo.duration}s.`);
    }
  };

  for (const rendition of plan.renditions) {
    // If this rendition represents the original source resolution and the source is ALREADY browser-native H.264 MP4,
    // point directly to the source video. Otherwise (e.g. .avi, .mkv, .mov, .webm, non-h264), generate a browser MP4 rendition!
    const isBrowserNativeMp4 = (resolved.filePath.endsWith('.mp4') || resolved.filePath.endsWith('.m4v')) && 
      (probeInfo.video?.codec === 'h264' || probeInfo.videoCodec === 'h264');

    if (rendition.isSource && isBrowserNativeMp4) {
      const sourceUrl = videoEntry.src.replace(/^\.\/public\//, '/').replace(/^public\//, '/');
      qualitiesMeta.push({
        label: rendition.label,
        height: rendition.height,
        width: rendition.width,
        src: sourceUrl,
        source: true,
        type: 'video/mp4',
        sizeBytes: probeInfo.sizeBytes,
        sizeMB: probeInfo.sizeMB
      });
      onProgress?.({ type: 'source-rendition', height: rendition.height, message: `✓ ${rendition.label} (source file preserved)` });
      cachedCount++;
      continue;
    }

    const filename = `${rendition.height}.mp4`;
    const publicFilePath = path.join(publicVideoDir, filename);
    const internalFilePath = path.join(internalVideoDir, filename);
    const publicUrl = `/aitutor/videos/${videoEntry.id}/${filename}`;

    const isFileOnDisk = fs.existsSync(publicFilePath) && fs.statSync(publicFilePath).size > 0;
    let isCached = isFileOnDisk && isSameFingerprint && !options.force;

    if (isCached) {
      try {
        await validateRendition(publicFilePath, rendition);
      } catch (err) {
        isCached = false;
        onProgress?.({ type: 'rendition-cache-invalid', height: rendition.height, message: `⚠ ${rendition.label} cache invalid; regenerating (${err.message})` });
      }
    }

    if (isCached) {
      cachedCount++;
      onProgress?.({ type: 'rendition-cached', height: rendition.height, message: `✓ ${rendition.label} cached` });
    } else {
      onProgress?.({ type: 'transcoding-start', height: rendition.height, message: `→ Generating ${rendition.label}` });

      const transcodeResult = await transcodeRendition({
        inputPath: resolved.filePath,
        outputPath: publicFilePath,
        targetHeight: rendition.height,
        probeInfo,
        onProgress: (pInfo) => {
          if (pInfo.percent !== undefined) {
            onProgress?.({
              type: 'transcoding-progress',
              height: rendition.height,
              percent: pInfo.percent,
              message: `→ Generating ${rendition.label} [${'█'.repeat(Math.floor(pInfo.percent / 5))}${'░'.repeat(20 - Math.floor(pInfo.percent / 5))}] ${pInfo.percent}%`
            });
          }
        }
      });

      await validateRendition(publicFilePath, rendition);

      // Mirror to internal directory
      try {
        fs.copyFileSync(publicFilePath, internalFilePath);
      } catch (_) {}

      transcodedCount++;
      onProgress?.({ type: 'rendition-complete', height: rendition.height, message: `✓ ${rendition.label} complete (${transcodeResult.sizeMB} MB)` });
    }

    const stat = fs.statSync(publicFilePath);
    qualitiesMeta.push({
      label: rendition.label,
      height: rendition.height,
      width: rendition.width,
      src: publicUrl,
      source: false,
      type: 'video/mp4',
      sizeBytes: stat.size,
      sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
    });
  }

  // 7. Register qualities and canonical structure in manifest
  const manifest = manifestStore.loadManifest();
  const currentEntry = manifest[videoEntry.id] || existingEntry;

  manifest[videoEntry.id] = {
    ...currentEntry,
    id: videoEntry.id,
    src: videoEntry.src,
    source: {
      src: videoEntry.src,
      container: probeInfo.container || 'mp4',
      sourceLanguage: currentEntry.sourceLanguage || 'en'
    },
    playback: {
      qualities: qualitiesMeta
    },
    sourceLanguage: currentEntry.sourceLanguage || 'en',
    qualities: qualitiesMeta,
    subtitles: currentEntry.subtitles || {},
    audioLanguages: currentEntry.audioLanguages || {},
    fingerprint: currentFingerprint,
    updatedAt: new Date().toISOString()
  };

  fs.writeFileSync(manifestStore.internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(manifestStore.publicManifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  onProgress?.({ type: 'quality-pipeline-complete', message: `✓ Quality generation complete (${transcodedCount} generated, ${cachedCount} cached)` });

  return {
    status: 'complete',
    qualities: qualitiesMeta,
    transcodedCount,
    cachedCount
  };
};

export default processVideoQuality;
