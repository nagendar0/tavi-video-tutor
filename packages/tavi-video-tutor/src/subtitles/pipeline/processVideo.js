import { NodeTTSProvider } from '../tts/NodeTTSProvider.js';
import { alignAudioSegment } from '../audio/alignAudioSegment.js';
import { stitchAudioSegments } from '../audio/stitchAudioSegments.js';
import { SpeakerDiarizer } from '../audio/diarization/SpeakerDiarizer.js';
import { VoiceAllocator } from '../audio/voice/VoiceAllocator.js';
import { SpeakerVoiceCache } from '../audio/voice/SpeakerVoiceCache.js';
import { SpeakerAudioCache } from '../audio/cache/SpeakerAudioCache.js';
import { BoundedTaskQueue } from '../audio/queue/BoundedTaskQueue.js';
import { AudioTimelineEngine } from '../audio/mixer/AudioTimelineEngine.js';
import { TimelineMixer } from '../audio/mixer/TimelineMixer.js';
import { TempWorkspace } from '../storage/tempWorkspace.js';
import { resolveDirectMediaSource, resolveVideoSource } from '../video/resolveVideo.js';
import { extractAudio } from '../audio/extractAudio.js';
import { probeMedia } from '../video/MediaProbe.js';
import { WhisperProvider } from '../transcription/WhisperProvider.js';
import { TranslationRouter } from '../translation/TranslationRouter.js';
import { TranscriptCache } from '../transcript/transcriptCache.js';
import { TranscriptNormalizer } from '../transcript/normalizer.js';
import { SubtitleSegmenter } from '../segmentation/SubtitleSegmenter.js';
import { MetricsCollector } from '../metrics/MetricsCollector.js';
import { TranslationValidator } from '../translation/TranslationValidator.js';
import { generateWebVTT, secondsToVttTimestamp } from '../vtt/generateVtt.js';
import { computeMediaFingerprint } from '../cache/manifest.js';
import { normalizeLanguageCode, resolveLanguageCapability } from '../languages/registry.js';
import path from 'path';
import fs from 'fs';

export const processSingleVideo = async (videoEntry, manifestStore, options = {}, onProgress) => {
  const metrics = new MetricsCollector();
  const transcriptCache = options.transcriptCache || new TranscriptCache(manifestStore.cwd);
  const translator = options.translator || new TranslationRouter(options.translationOptions || options);
  const normalizer = options.normalizer || new TranscriptNormalizer({ glossaryTerms: options.glossary });
  const segmenter = options.segmenter || new SubtitleSegmenter(options.segmentationOptions);
  const validator = options.validator || new TranslationValidator({ customProtectedTerms: options.glossary });
  const ttsProvider = options.ttsProvider || new NodeTTSProvider(options.ttsOptions || options);

  const rawLanguages = Array.isArray(videoEntry.languages) ? videoEntry.languages : ['en'];
  const rawAudioLanguages = options.audioLanguages || videoEntry.audioLanguages || [];
  const requestedLanguages = rawLanguages.map(l => normalizeLanguageCode(l) || l).filter(Boolean);
  const requestedAudioLanguages = rawAudioLanguages.map(l => normalizeLanguageCode(l) || l).filter(Boolean);

  onProgress?.({ type: 'checking-cache', message: '→ Checking cache' });

  const currentFingerprint = computeMediaFingerprint(videoEntry, manifestStore.cwd, options.fingerprintExtra);

  // Check if ALL requested subtitles and audio tracks are already cached for this exact media content fingerprint
  const subtitlesCached = manifestStore.isCached(videoEntry, options.force, currentFingerprint);
  const audioCached = requestedAudioLanguages.length === 0 || requestedAudioLanguages.every(lang => manifestStore.isAudioLanguageCached(videoEntry.id, lang, currentFingerprint));

  if (subtitlesCached && audioCached && !options.force) {
    metrics.cacheStats.hits++;
    onProgress?.({ type: 'cache-hit', message: '✓ All requested subtitles & audio cached' });
    return { status: 'cached', video: videoEntry, metrics: metrics.getSummaryReport(videoEntry.id) };
  }

  metrics.cacheStats.misses++;
  let masterTranscript = null;
  let extractedAudio = null;
  const isMasterCached = transcriptCache.hasMasterTranscript(videoEntry.id, currentFingerprint);

  if (isMasterCached && !options.force) {
    onProgress?.({ type: 'transcript-cached', message: '✓ Master transcript cached' });
    masterTranscript = transcriptCache.loadMasterTranscript(videoEntry.id, currentFingerprint);
  } else {
    // Direct Video URL -> FFmpeg Audio Stream -> Speech-to-Text ONCE
    const workspace = new TempWorkspace(videoEntry.id, manifestStore.cwd);
    const transcriber = options.transcriber || new WhisperProvider(options.transcriptionOptions || options);

    try {
      const audioStart = Date.now();
      const resolvedVideo = resolveDirectMediaSource(videoEntry, workspace);
      let probeInfo = null;

      try {
        probeInfo = await probeMedia(resolvedVideo.filePath, { cwd: manifestStore.cwd });
        const containerLabel = (probeInfo.container || path.extname(resolvedVideo.filePath).replace('.', '') || 'mp4').toUpperCase();
        const videoDesc = probeInfo.video ? `${probeInfo.video.codec.toUpperCase()} ${probeInfo.video.width}x${probeInfo.video.height} (${probeInfo.video.fps} fps)` : 'N/A';
        const audioDesc = probeInfo.hasAudio 
          ? `${probeInfo.audio.codec.toUpperCase()} ${probeInfo.audio.sampleRate}Hz ${probeInfo.audio.channelLayout}${probeInfo.audioStreams.length > 1 ? ` (${probeInfo.audioStreams.length} audio streams detected)` : ''}`
          : 'No audio stream detected';

        onProgress?.({
          type: 'media-probe-summary',
          message: `\nInput:\n  ${path.basename(resolvedVideo.filePath || videoEntry.src)}\nContainer:\n  ${containerLabel}\nVideo:\n  ${videoDesc}\nAudio:\n  ${audioDesc}\n`
        });
      } catch (_) {
        // Continue if probe fails on non-standard mock
      }

      extractedAudio = null;

      if (probeInfo && probeInfo.hasAudio === false) {
        onProgress?.({ type: 'no-audio-stream', message: 'ℹ No audio stream present in source media. Skipping speech-to-text.' });
        masterTranscript = {
          sourceLanguage: videoEntry.sourceLanguage || videoEntry.language || 'en',
          segments: [],
          normalized: { segments: [] }
        };
      } else {
        const selectedAudioStreamIndex = videoEntry.audioStreamIndex !== undefined ? videoEntry.audioStreamIndex : options.audioStreamIndex;

        try {
          onProgress?.({ type: 'ffmpeg-read', message: '→ Reading video URL with FFmpeg' });
          onProgress?.({ type: 'ffmpeg-extract', message: '→ Extracting audio stream' });
          extractedAudio = await extractAudio(resolvedVideo.filePath, workspace, {
            audioStreamIndex: selectedAudioStreamIndex
          });
        } catch (directErr) {
          onProgress?.({ type: 'ffmpeg-fallback', message: '→ Fallback to media download stream...' });
          const fallbackVideo = await resolveVideoSource(videoEntry, workspace);
          extractedAudio = await extractAudio(fallbackVideo.filePath, workspace, {
            audioStreamIndex: selectedAudioStreamIndex
          });
        }
        metrics.recordTiming('audioExtractionTime', Date.now() - audioStart);

        onProgress?.({
          type: 'audio-ready',
          message: `✓ Audio extracted\n  Path: ${extractedAudio.audioPath}\n  Size: ${extractedAudio.sizeMB} MB (${extractedAudio.sizeBytes} bytes)`
        });

        onProgress?.({ type: 'transcribing', message: '→ Running Whisper Speech-to-Text' });
        const asrStart = Date.now();
        const rawTranscript = await transcriber.transcribe(extractedAudio, videoEntry);
        metrics.recordTiming('asrTime', Date.now() - asrStart);

        const srcLangName = rawTranscript.language === 'en' ? 'English' : (rawTranscript.language || 'English');
        onProgress?.({ type: 'source-language', message: `✓ Detected source language: ${srcLangName}` });
        onProgress?.({ type: 'segments-count', message: `✓ Segments count: ${rawTranscript.segments.length}` });

        // Post-ASR Normalization & Segmentation
        const normalizedTranscript = normalizer.normalizeTranscript(rawTranscript);
        const masterCues = segmenter.segmentTranscript(normalizedTranscript.segments);
        metrics.analyzeQuality(masterCues);

        if (masterCues.length > 0) {
          const previewLines = masterCues.slice(0, 2).map((s, idx) => 
            `  ${idx + 1}. [${secondsToVttTimestamp(s.start)} --> ${secondsToVttTimestamp(s.end)}] ${s.text.replace(/\n/g, ' ')}`
          ).join('\n');
          onProgress?.({ type: 'transcript-preview', message: `Transcript preview:\n${previewLines}` });
        }

        masterTranscript = transcriptCache.saveMasterTranscript(
          videoEntry.id,
          rawTranscript.language || 'en',
          rawTranscript.segments,
          masterCues,
          currentFingerprint
        );
        onProgress?.({ type: 'master-created', message: '✓ Master transcript created & saved' });
      }
    } finally {
      if (!options.keepTemp) {
        onProgress?.({ type: 'cleaning-audio', message: '→ Cleaning temporary audio' });
        workspace.cleanup();
      } else {
        onProgress?.({ type: 'keep-temp', message: `→ Retaining temporary audio workspace (--keep-temp)` });
      }
    }
  }

  const sourceLang = normalizeLanguageCode(masterTranscript.sourceLanguage || videoEntry.sourceLanguage || videoEntry.language || 'en') || 'en';
  const masterSegments = masterTranscript.segments || masterTranscript.normalized?.segments || [];
  const generatedSubtitlesMap = {};
  let newGeneratedCount = 0;
  let subCachedCount = 0;

  onProgress?.({ type: 'generating-subtitles', message: '→ Generating WebVTT subtitles' });

  // Controlled concurrency translation (concurrency default 5)
  const concurrencyLimit = options.translationConcurrency || 5;
  const translationStart = Date.now();

  const processLanguage = async (targetLang) => {
    const isSubCached = manifestStore.isLanguageCached(videoEntry.id, targetLang, currentFingerprint);

    if (isSubCached && !options.force) {
      onProgress?.({ type: 'lang-cached', lang: targetLang, message: `✓ ${targetLang} (cached)` });
      subCachedCount++;
      return;
    }

    if (!translator.supports(sourceLang, targetLang)) {
      onProgress?.({ type: 'lang-unsupported', lang: targetLang, message: `⚠ ${targetLang} (unsupported target language)` });
      return;
    }

    try {
      const translatedSegments = await translator.translateSegments(
        masterSegments,
        sourceLang,
        targetLang
      );

      // Readability alignment & segmentation for target language
      const segmentedTranslated = segmenter.segmentTranscript(translatedSegments);
      const validationResult = validator.validateSegments(masterSegments, segmentedTranslated, targetLang);

      const vttStart = Date.now();
      const vttString = generateWebVTT(segmentedTranslated);
      metrics.recordTiming('vttTime', Date.now() - vttStart);

      generatedSubtitlesMap[targetLang] = vttString;
      newGeneratedCount++;

      const statusBadge = validationResult.status === 'PASS' ? '✓' : '⚠';
      onProgress?.({ type: 'lang-generated', lang: targetLang, message: `${statusBadge} Generated ${targetLang}.vtt [${validationResult.status}]` });
    } catch (err) {
      onProgress?.({ type: 'lang-failed', lang: targetLang, message: `⚠ ${targetLang} (translation error: ${err.message})` });
    }
  };

  // Execute languages with controlled concurrency
  for (let i = 0; i < requestedLanguages.length; i += concurrencyLimit) {
    const chunk = requestedLanguages.slice(i, i + concurrencyLimit);
    await Promise.all(chunk.map(lang => processLanguage(lang)));
  }

  metrics.recordTiming('translationTime', Date.now() - translationStart);

  if (Object.keys(generatedSubtitlesMap).length > 0) {
    manifestStore.saveMultilingualSubtitles(videoEntry, sourceLang, generatedSubtitlesMap, currentFingerprint);
  }

  // --- UNIVERSAL SPEAKER-AWARE AUDIO DUBBING PIPELINE ---
  const generatedAudioMap = {};
  const cachedAudioLangs = [];
  const unavailableAudioLangs = [];
  let newAudioCount = 0;
  let speakerStats = null;

  if (requestedAudioLanguages.length > 0) {
    onProgress?.({ type: 'audio-dub-header', message: '\nUniversal Speaker-Aware Audio Dubbing Pipeline\n──────────────────────────────────────────────' });

    const totalDuration = masterSegments.length > 0
      ? (masterSegments[masterSegments.length - 1].end || masterSegments[masterSegments.length - 1].endTime || 10)
      : 10;

    const diarizer = options.diarizer || options.speakerDiarizer || new SpeakerDiarizer(options.diarizationOptions || options);
    const voiceAllocator = options.voiceAllocator || new VoiceAllocator(options.voiceOptions || options);
    const voiceCache = options.voiceCache || new SpeakerVoiceCache(manifestStore.cwd);
    const audioCache = options.audioCache || new SpeakerAudioCache(manifestStore.cwd);
    const timelineEngine = options.timelineEngine || new AudioTimelineEngine({ outputDir: manifestStore.internalAudioDir, ...options });
    const timelineMixer = options.timelineMixer || new TimelineMixer(options);

    const speakerMode = options.speakerMode || videoEntry.speakerMode || 'auto';

    onProgress?.({ type: 'speaker-analysis-start', message: `→ Running universal speaker analysis (mode: ${speakerMode})` });

    let diarizationResult = null;
    const speechSourceSegments = (masterTranscript.raw?.segments && masterTranscript.raw.segments.length > 0)
      ? masterTranscript.raw.segments
      : masterSegments;

    if (speakerMode === 'single') {
      diarizationResult = {
        detectedSpeakerCount: 1,
        speakers: [{ speakerId: 'spk_000001', confidence: 1.0 }],
        segments: speechSourceSegments.map((s, idx) => ({
          segmentId: s.id || `seg_${String(idx + 1).padStart(6, '0')}`,
          speakerId: 'spk_000001',
          startTime: s.start !== undefined ? s.start : (s.startTime || 0),
          endTime: s.end !== undefined ? s.end : (s.endTime || 1),
          duration: (s.end !== undefined ? s.end : (s.endTime || 1)) - (s.start !== undefined ? s.start : (s.startTime || 0)),
          originalText: s.text || s.originalText || '',
          text: s.text || s.originalText || '',
          confidence: s.confidence || 1.0,
          language: sourceLang
        })),
        overlappingIntervals: [],
        speakerTimelineMap: {}
      };
    } else {
      const audioSourceForDiarization = (extractedAudio && extractedAudio.audioPath && fs.existsSync(extractedAudio.audioPath))
        ? extractedAudio.audioPath
        : null;
      diarizationResult = await diarizer.diarize(audioSourceForDiarization, speechSourceSegments);
    }

    const detectedSpeakerCount = diarizationResult.detectedSpeakerCount || 1;
    const diarizedSegments = diarizationResult.segments && diarizationResult.segments.length > 0
      ? diarizationResult.segments
      : masterSegments.map((s, idx) => ({
          segmentId: s.id || `seg_${String(idx + 1).padStart(6, '0')}`,
          speakerId: 'spk_000001',
          startTime: s.start !== undefined ? s.start : 0,
          endTime: s.end !== undefined ? s.end : 1,
          duration: (s.end !== undefined ? s.end : 1) - (s.start !== undefined ? s.start : 0),
          originalText: s.text || '',
          text: s.text || '',
          confidence: 1.0,
          language: sourceLang
        }));

    const detectedSpeakers = diarizationResult.speakers && diarizationResult.speakers.length > 0
      ? diarizationResult.speakers
      : [{ speakerId: 'spk_000001', confidence: 1.0 }];

    const overlapCount = diarizationResult.overlappingIntervals ? diarizationResult.overlappingIntervals.length : 0;

    onProgress?.({
      type: 'speaker-analysis-done',
      speakerCount: detectedSpeakerCount,
      overlapCount,
      message: `✓ Diarization: ${detectedSpeakerCount} speaker(s) discovered, ${overlapCount} overlap region(s)`
    });

    speakerStats = {
      detectedSpeakerCount,
      speakerMode,
      overlapCount,
      speakers: detectedSpeakers.map(s => s.speakerId),
      voiceAssignments: {}
    };

    const audioConcurrency = options.audioConcurrency || 3;
    const taskQueueConcurrency = options.speakerConcurrency || 4;

    const processAudioLanguage = async (targetLang, index, total) => {
      const capability = resolveLanguageCapability(targetLang);
      if (!capability.ttsSupported && !options.allowSyntheticFallback) {
        onProgress?.({
          type: 'audio-unsupported',
          lang: targetLang,
          message: `AUDIO NOT AVAILABLE FOR LANGUAGE: ${targetLang} (${capability.displayName || targetLang}). No TTS engine or voice pack installed.`
        });
        unavailableAudioLangs.push({ lang: targetLang, reason: `TTS not supported for language: ${targetLang}` });
        return;
      }

      const isAudioCached = manifestStore.isAudioLanguageCached(videoEntry.id, targetLang, currentFingerprint);

      if (isAudioCached && !options.force) {
        cachedAudioLangs.push(targetLang);
        onProgress?.({ type: 'audio-cached', lang: targetLang, message: `✓ ${targetLang} audio (cached)` });
        return;
      }

      onProgress?.({ type: 'audio-step-1', lang: targetLang, message: `[${index + 1}/${total}] ${targetLang} voice allocation & translation` });

      try {
        // 1. Dynamic Graph-Coloring Voice Allocation
        const existingJobAssignments = voiceCache.getJobAssignments(currentFingerprint, targetLang);
        const allocationResult = voiceAllocator.allocate({
          speakers: detectedSpeakers,
          segments: diarizedSegments,
          targetLanguage: targetLang,
          existingAssignments: existingJobAssignments
        });

        voiceCache.saveJobAssignments(currentFingerprint, targetLang, allocationResult.assignments);
        const voiceAssignments = allocationResult.assignments;
        speakerStats.voiceAssignments[targetLang] = voiceAssignments;

        // 2. Segment Translation preserving speaker identities
        let translatedSegments = diarizedSegments;
        if (targetLang !== sourceLang) {
          onProgress?.({ type: 'audio-step-2', lang: targetLang, message: `[${index + 1}/${total}] ${targetLang} translating ${diarizedSegments.length} speaker segment(s)` });
          translatedSegments = await translator.translateSegments(diarizedSegments, sourceLang, targetLang);
        }

        onProgress?.({ type: 'audio-step-3', lang: targetLang, message: `[${index + 1}/${total}] ${targetLang} synthesizing with ${detectedSpeakerCount} speaker voice(s)` });

        const audioWorkspace = new TempWorkspace(`audio_${videoEntry.id}_${targetLang}`, manifestStore.cwd);
        const alignedSegments = [];

        try {
          const queue = new BoundedTaskQueue({
            concurrency: taskQueueConcurrency,
            maxRetries: 2
          });

          for (const seg of translatedSegments) {
            const spkId = seg.speakerId || 'spk_000001';
            const assignedVoice = voiceAssignments[spkId] || { voiceId: `${targetLang}_voice_1`, pitchOffset: 0, rateOffset: 1.0 };
            const segText = seg.translatedText || seg.text || seg.originalText || '';

            queue.addTask(seg.segmentId, async () => {
              const cacheKeyParams = {
                videoFingerprint: currentFingerprint,
                speakerId: spkId,
                segmentId: seg.segmentId,
                text: segText,
                targetLanguage: targetLang,
                voiceId: assignedVoice.voiceId,
                provider: ttsProvider.constructor.name
              };

              const cachedAudio = audioCache.getSegmentAudio(cacheKeyParams);
              let segAudioPath = null;
              let segDuration = 0;

              if (cachedAudio && !options.force) {
                segAudioPath = cachedAudio.audioPath;
                segDuration = cachedAudio.duration;
              } else {
                const ttsRes = await ttsProvider.synthesize(segText, targetLang, {
                  outputDir: audioWorkspace.workspaceDir,
                  voiceId: assignedVoice.voiceId,
                  gender: assignedVoice.gender,
                  pitchOffset: assignedVoice.pitchOffset,
                  rateOffset: assignedVoice.rateOffset
                });
                segAudioPath = ttsRes.audioPath;
                segDuration = ttsRes.duration;
                audioCache.saveSegmentAudio(cacheKeyParams, segAudioPath, segDuration);
              }

              const aligned = await timelineEngine.alignSegment({
                ...seg,
                voiceId: assignedVoice.voiceId,
                generatedAudio: segAudioPath,
                generatedDuration: segDuration,
                targetLanguage: targetLang
              }, audioWorkspace.workspaceDir);

              alignedSegments.push(aligned);
              return aligned;
            }, { segmentId: seg.segmentId, speakerId: spkId });
          }

          const queueResult = await queue.run();
          if (queueResult.failedCount > 0 && alignedSegments.length === 0) {
            throw new Error(`TTS synthesis failed for all segments in ${targetLang}: ${queueResult.failed[0]?.error?.message}`);
          }

          // 3. Multi-Track Timeline Mixing with dynamic audio normalization
          const targetM4a = path.join(audioWorkspace.workspaceDir, `${targetLang}.m4a`);
          await timelineMixer.mix(alignedSegments, targetM4a, {
            totalDuration,
            ambientAudioPath: (options.preserveAmbient && extractedAudio) ? extractedAudio.audioPath : null
          });

          // 4. Save to Manifest & Save detailed generation metadata
          manifestStore.saveMultilingualAudio(videoEntry, sourceLang, {
            [targetLang]: {
              src: targetM4a,
              speakerAware: true
            }
          }, currentFingerprint);

          manifestStore.saveSpeakerMetadata(videoEntry.id, {
            videoId: videoEntry.id,
            fingerprint: currentFingerprint,
            sourceLanguage: sourceLang,
            detectedSpeakerCount,
            speakerMode,
            speakers: detectedSpeakers,
            voiceAssignments,
            overlappingIntervals: diarizationResult.overlappingIntervals || [],
            totalSegments: diarizedSegments.length,
            chromaticNumber: allocationResult.chromaticNumber,
            updatedAt: new Date().toISOString()
          });

          generatedAudioMap[targetLang] = targetM4a;
          newAudioCount++;
          onProgress?.({ type: 'audio-generated', lang: targetLang, message: `✓ ${targetLang} audio generated (${detectedSpeakerCount} speaker(s), ${alignedSegments.length} segment(s))` });
        } finally {
          if (!options.keepTemp) {
            audioWorkspace.cleanup();
          }
        }
      } catch (err) {
        unavailableAudioLangs.push({ lang: targetLang, reason: err.message });
        onProgress?.({ type: 'audio-failed', lang: targetLang, message: `⚠ ${targetLang} audio generation unavailable: ${err.message}` });
      }
    };

    for (let i = 0; i < requestedAudioLanguages.length; i += audioConcurrency) {
      const chunk = requestedAudioLanguages.slice(i, i + audioConcurrency);
      await Promise.all(chunk.map((lang, idx) => processAudioLanguage(lang, i + idx, requestedAudioLanguages.length)));
    }

    if (Object.keys(generatedAudioMap).length > 0) {
      manifestStore.saveMultilingualAudio(videoEntry, sourceLang, generatedAudioMap, currentFingerprint);
    }
  }

  return {
    status: 'completed',
    video: videoEntry,
    generatedCount: newGeneratedCount,
    cachedCount: subCachedCount,
    generatedAudioCount: newAudioCount,
    sourceLanguage: sourceLang,
    audioStats: {
      requested: requestedAudioLanguages,
      generated: Object.keys(generatedAudioMap),
      cached: cachedAudioLangs,
      unavailable: unavailableAudioLangs,
      speakerStats
    },
    metrics: metrics.getSummaryReport(videoEntry.id)
  };
};

export default processSingleVideo;
