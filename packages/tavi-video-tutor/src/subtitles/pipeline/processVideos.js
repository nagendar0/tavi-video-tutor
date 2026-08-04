import { loadConfig } from '../config/loadConfig.js';
import { ManifestStore } from '../cache/manifest.js';
import { processSingleVideo } from './processVideo.js';
import { checkEnvironment, printEnvironmentReport } from '../env/checkEnv.js';

export const processAllVideos = async (options = {}, cwd = process.cwd()) => {
  const { videos, globalLanguages } = await loadConfig(cwd);
  const manifestStore = new ManifestStore(cwd);

  console.log(`\nAITutor Multilingual Subtitle Engine\n─────────────────────────────────────\n`);

  const envStatus = await checkEnvironment();
  printEnvironmentReport(envStatus);

  console.log(`Found ${videos.length} video(s)`);
  console.log(`Default languages: ${globalLanguages.join(', ')}\n`);

  const startTime = Date.now();
  let totalTranscribed = 0;
  let transcriptCacheHits = 0;
  let totalSubtitlesGenerated = 0;
  let totalSubtitlesCached = 0;
  let totalFailed = 0;
  const failedList = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    console.log(`[${i + 1}/${videos.length}] ${video.id}`);
    console.log(`URL: ${video.src}`);
    console.log(`Languages: ${video.languages.join(', ')}\n`);

    try {
      let masterWasCached = false;
      const res = await processSingleVideo(video, manifestStore, options, (evt) => {
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
      console.log(`\n✓ Complete\n`);
    } catch (err) {
      console.error(`\n❌ Failed processing ${video.id}: ${err.message}\n`);
      totalFailed++;
      failedList.push({ id: video.id, reason: err.message });
    }
  }

  const durationSec = Math.round((Date.now() - startTime) / 1000);

  console.log(`─────────────────────────────────────\n`);
  console.log(`AITutor processing complete\n`);
  console.log(`Videos:                 ${videos.length}`);
  console.log(`Transcribed:              ${totalTranscribed}`);
  console.log(`Transcript cache hits:    ${transcriptCacheHits}`);
  console.log(`Subtitle files generated: ${totalSubtitlesGenerated}`);
  console.log(`Subtitle cache hits:      ${totalSubtitlesCached}`);
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
    failed: totalFailed
  };
};
