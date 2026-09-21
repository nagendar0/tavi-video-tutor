import { loadConfig } from '../config/loadConfig.js';
import { ManifestStore } from '../cache/manifest.js';
import { processSingleVideo } from './processVideo.js';
import { processVideoQuality } from '../video/processVideoQuality.js';
import { checkEnvironment, printEnvironmentReport } from '../env/checkEnv.js';
import { AITUTOR_LANGUAGES } from '../languages/registry.js';

export const processAllVideos = async (options = {}, cwd = process.cwd()) => {
  const loadedConfig = await loadConfig(cwd);
  const { videos, globalLanguages, globalAudioLanguages } = loadedConfig;
  const manifestStore = new ManifestStore(cwd);

  console.log(`\nAITutor Multilingual Subtitle & Video Quality Engine\n─────────────────────────────────────\n`);

  const envStatus = await checkEnvironment();
  printEnvironmentReport(envStatus);

  console.log(`Found ${videos.length} video(s)`);
  console.log(`Default languages: ${globalLanguages.join(', ')}\n`);

  const startTime = Date.now();
  let totalTranscribed = 0;
  let transcriptCacheHits = 0;
  let totalSubtitlesGenerated = 0;
  let totalSubtitlesCached = 0;
  let totalAudioGenerated = 0;
  let totalAudioCached = 0;
  let totalAudioUnavailable = 0;
  let hasAudioRequested = false;
  let totalQualitiesGenerated = 0;
  let totalQualitiesCached = 0;
  let totalFailed = 0;
  const failedList = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    console.log(`[${i + 1}/${videos.length}] ${video.id}`);
    console.log(`URL: ${video.src}`);
    console.log(`Languages: ${video.languages.join(', ')}`);

    let effectiveAudioLangs = [];
    if (options.audioLanguages !== undefined) {
      if (options.audioLanguages === 'all') {
        effectiveAudioLangs = AITUTOR_LANGUAGES.map(l => l.code);
      } else if (Array.isArray(options.audioLanguages)) {
        effectiveAudioLangs = options.audioLanguages;
      }
    } else if (video.audioLanguages && video.audioLanguages.length > 0) {
      effectiveAudioLangs = video.audioLanguages;
    } else if (globalAudioLanguages && globalAudioLanguages.length > 0) {
      effectiveAudioLangs = globalAudioLanguages;
    }

    if (effectiveAudioLangs.length > 0) {
      console.log(`Audio Dub Languages: ${effectiveAudioLangs.join(', ')}`);
    }
    console.log('');

    // 1. Subtitle & Audio Dub Pipeline Execution
    try {
      let masterWasCached = false;
      const res = await processSingleVideo(video, manifestStore, {
        ttsProvider: options.ttsProvider || loadedConfig.ttsProvider || loadedConfig.audio?.tts?.provider,
        ttsOptions: options.ttsOptions || loadedConfig.tts || loadedConfig.audio?.tts,
        ...options,
        audioLanguages: effectiveAudioLangs
      }, (evt) => {
        if (typeof evt === 'string') {
          console.log(evt);
        } else {
          if (evt.type === 'transcript-cached') {
            masterWasCached = true;
          }
          console.log(evt.message || evt);
        }
      });

      if (masterWasCached) {
        transcriptCacheHits++;
      } else if (res.status !== 'cached') {
        totalTranscribed++;
      }

      totalSubtitlesGenerated += (res.generatedCount || 0);
      totalSubtitlesCached += (res.cachedCount || 0);

      if (res.audioStats) {
        if (res.audioStats.requested && res.audioStats.requested.length > 0) {
          hasAudioRequested = true;
        }
        totalAudioGenerated += (res.audioStats.generated?.length || 0);
        totalAudioCached += (res.audioStats.cached?.length || 0);
        totalAudioUnavailable += (res.audioStats.unavailable?.length || 0);
      }
    } catch (err) {
      console.error(`\n❌ Subtitle pipeline failed for ${video.id}: ${err.message}\n`);
      totalFailed++;
      failedList.push({ id: video.id, reason: `Subtitles: ${err.message}` });
    }

    // 2. Video Quality Pipeline Execution
    try {
      console.log(`\n--- Video Quality Pipeline ---`);
      const qRes = await processVideoQuality(video, manifestStore, { ...options, config: loadedConfig }, (evt) => {
        if (typeof evt === 'string') {
          console.log(evt);
        } else {
          console.log(evt.message || evt);
        }
      });

      if (qRes.status === 'complete') {
        totalQualitiesGenerated += (qRes.transcodedCount || 0);
        totalQualitiesCached += (qRes.cachedCount || 0);
      }
    } catch (err) {
      console.error(`\n⚠ Video quality pipeline notice for ${video.id}: ${err.message}\n`);
    }

    console.log(`\n✓ Complete\n`);
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);

  if (hasAudioRequested) {
    console.log(`\nAITutor Audio Generation`);
    console.log(`─────────────────────────`);
    console.log(`Language Registry:        ${AITUTOR_LANGUAGES.length}`);
    console.log(`Audio tracks generated:   ${totalAudioGenerated}`);
    console.log(`Audio tracks cached:      ${totalAudioCached}`);
    console.log(`Audio tracks unavailable: ${totalAudioUnavailable}\n`);
  }

  console.log(`─────────────────────────────────────\n`);
  console.log(`AITutor processing complete\n`);
  console.log(`Videos:                 ${videos.length}`);
  console.log(`Transcribed:              ${totalTranscribed}`);
  console.log(`Transcript cache hits:    ${transcriptCacheHits}`);
  console.log(`Subtitle files generated: ${totalSubtitlesGenerated}`);
  console.log(`Subtitle cache hits:      ${totalSubtitlesCached}`);
  if (hasAudioRequested) {
    console.log(`Audio files generated:    ${totalAudioGenerated}`);
    console.log(`Audio cache hits:         ${totalAudioCached}`);
  }
  console.log(`Quality renditions gen:   ${totalQualitiesGenerated}`);
  console.log(`Quality renditions cached:${totalQualitiesCached}`);
  console.log(`Failed videos:            ${totalFailed}`);
  console.log(`Total time:               ${durationSec}s\n`);

  if (failedList.length > 0) {
    console.log(`Failed Videos:`);
    failedList.forEach((f) => {
      console.log(`  - ${f.id}: ${f.reason}`);
    });
    console.log('');
  }

  return {
    totalVideos: videos.length,
    transcribed: totalTranscribed,
    transcriptCacheHits,
    generatedSubtitles: totalSubtitlesGenerated,
    cachedSubtitles: totalSubtitlesCached,
    generatedAudio: totalAudioGenerated,
    cachedAudio: totalAudioCached,
    unavailableAudio: totalAudioUnavailable,
    generatedQualities: totalQualitiesGenerated,
    cachedQualities: totalQualitiesCached,
    failed: totalFailed
  };
};
