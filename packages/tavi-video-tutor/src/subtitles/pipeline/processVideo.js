import { TempWorkspace } from '../storage/tempWorkspace.js';
import { resolveDirectMediaSource, resolveVideoSource } from '../video/resolveVideo.js';
import { extractAudio } from '../audio/extractAudio.js';
import { WhisperProvider } from '../transcription/WhisperProvider.js';
import { AITutorTranslationProvider } from '../translation/TranslationProvider.js';
import { TranscriptCache } from '../transcript/transcriptCache.js';
import { TranscriptNormalizer } from '../transcript/normalizer.js';
import { SubtitleSegmenter } from '../segmentation/SubtitleSegmenter.js';
import { MetricsCollector } from '../metrics/MetricsCollector.js';
import { TranslationValidator } from '../translation/TranslationValidator.js';
import { generateWebVTT, secondsToVttTimestamp } from '../vtt/generateVtt.js';
import { computeMediaFingerprint } from '../cache/manifest.js';

export const processSingleVideo = async (videoEntry, manifestStore, options = {}, onProgress) => {
  const metrics = new MetricsCollector();
  const transcriptCache = options.transcriptCache || new TranscriptCache(manifestStore.cwd);
  const translator = options.translator || new AITutorTranslationProvider();
  const normalizer = options.normalizer || new TranscriptNormalizer({ glossaryTerms: options.glossary });
  const segmenter = options.segmenter || new SubtitleSegmenter(options.segmentationOptions);
  const validator = options.validator || new TranslationValidator({ customProtectedTerms: options.glossary });

  const requestedLanguages = Array.isArray(videoEntry.languages) ? videoEntry.languages : ['en'];

  onProgress?.({ type: 'checking-cache', message: '→ Checking cache' });

  const currentFingerprint = computeMediaFingerprint(videoEntry, manifestStore.cwd, options.fingerprintExtra);

  // Check if ALL requested languages are already cached for this exact media content fingerprint
  if (manifestStore.isCached(videoEntry, options.force, currentFingerprint)) {
    metrics.cacheStats.hits++;
    onProgress?.({ type: 'cache-hit', message: '✓ All requested languages cached' });
    return { status: 'cached', video: videoEntry, metrics: metrics.getSummaryReport(videoEntry.id) };
  }

  metrics.cacheStats.misses++;
  let masterTranscript = null;
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
      let extractedAudio = null;

      try {
        onProgress?.({ type: 'ffmpeg-read', message: '→ Reading video URL with FFmpeg' });
        onProgress?.({ type: 'ffmpeg-extract', message: '→ Extracting audio stream' });
        extractedAudio = await extractAudio(resolvedVideo.filePath, workspace);
      } catch (directErr) {
        onProgress?.({ type: 'ffmpeg-fallback', message: '→ Fallback to media download stream...' });
        const fallbackVideo = await resolveVideoSource(videoEntry, workspace);
        extractedAudio = await extractAudio(fallbackVideo.filePath, workspace);
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
    } finally {
      if (!options.keepTemp) {
        onProgress?.({ type: 'cleaning-audio', message: '→ Cleaning temporary audio' });
        workspace.cleanup();
      } else {
        onProgress?.({ type: 'keep-temp', message: `→ Retaining temporary audio workspace (--keep-temp)` });
      }
    }
  }

  const sourceLang = masterTranscript.sourceLanguage || 'en';
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

  return {
    status: 'completed',
    video: videoEntry,
    generatedCount: newGeneratedCount,
    cachedCount: subCachedCount,
    sourceLanguage: sourceLang,
    metrics: metrics.getSummaryReport(videoEntry.id)
  };
};
