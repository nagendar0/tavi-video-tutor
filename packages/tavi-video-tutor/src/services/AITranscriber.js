// In-browser Speech-to-Text dynamic Whisper pipeline & multi-language translation service

export const transcribeVideoAudio = async (videoUrl, onProgress) => {
  onProgress?.({ status: 'loading-model', message: 'Loading Whisper AI model...' });

  let transformersModule;
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    transformersModule = await dynamicImport('@huggingface/transformers');
  } catch {
    try {
      const dynamicImport = new Function('specifier', 'return import(specifier)');
      transformersModule = await dynamicImport('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.3.3');
    } catch {
      throw new Error('In-browser transcription requires @huggingface/transformers. Run pre-transcription with "npx aitutor generate" or install @huggingface/transformers.');
    }
  }
  const { pipeline, env } = transformersModule;
  if (env?.backends?.onnx?.wasm) {
    env.backends.onnx.wasm.numThreads = 1;
  } else if (env?.wasm) {
    env.wasm.numThreads = 1;
  }

  const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
    progress_callback: (p) => {
      if (p.status === 'progress') {
        const loadedPct = Math.round((p.loaded / p.total) * 100);
        onProgress?.({ 
          status: 'downloading-model', 
          percent: loadedPct,
          message: `Downloading AI model: ${loadedPct}%` 
        });
      }
    }
  });

  onProgress?.({ status: 'fetching-audio', message: 'Extracting audio track from video...' });

  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} when fetching video URL: ${videoUrl}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContextClass();
  let audioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } finally {
    await audioCtx.close();
  }

  onProgress?.({ status: 'processing-audio', message: 'Processing 16kHz audio channel...' });

  const targetSampleRate = 16000;
  const numberOfChannels = audioBuffer.numberOfChannels;
  const originalSampleRate = audioBuffer.sampleRate;
  
  const originalData = new Float32Array(audioBuffer.length);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < audioBuffer.length; i++) {
      originalData[i] += channelData[i] / numberOfChannels;
    }
  }

  let rawAudioData = originalData;
  if (originalSampleRate !== targetSampleRate) {
    const ratio = originalSampleRate / targetSampleRate;
    const targetLength = Math.round(originalData.length / ratio);
    rawAudioData = new Float32Array(targetLength);
    for (let i = 0; i < targetLength; i++) {
      const index = i * ratio;
      const indexFloor = Math.floor(index);
      const indexCeil = Math.min(originalData.length - 1, indexFloor + 1);
      const weight = index - indexFloor;
      rawAudioData[i] = (1 - weight) * originalData[indexFloor] + weight * originalData[indexCeil];
    }
  }

  onProgress?.({ status: 'transcribing', percent: 10, message: 'AI Transcribing audio track...' });

  const result = await transcriber(rawAudioData, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: true
  });

  if (!result || !Array.isArray(result.chunks) || result.chunks.length === 0) {
    throw new Error(`Whisper ASR returned 0 chunks for video audio: ${videoUrl}`);
  }

  onProgress?.({ status: 'formatting', message: 'Formatting WebVTT subtitles...' });

  let vtt = 'WEBVTT\n\n';
  result.chunks.forEach((chunk, index) => {
    const start = chunk.timestamp[0] ?? 0;
    const end = chunk.timestamp[1] ?? (start + 2.5);
    
    const formatVttTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
    };

    vtt += `${index + 1}\n${formatVttTime(start)} --> ${formatVttTime(end)}\n${chunk.text.trim()}\n\n`;
  });
  return vtt;
};

// Batch translate base WebVTT into multi-language subtitle map
export const batchTranslateSubtitles = async (baseVtt, targetLanguages, onProgress) => {
  const result = {};
  const totalLangs = targetLanguages.length;

  for (let i = 0; i < totalLangs; i++) {
    const lang = targetLanguages[i];
    const percent = Math.round(((i + 1) / totalLangs) * 100);

    onProgress?.({
      current: i + 1,
      total: totalLangs,
      langCode: lang.code,
      langName: lang.name,
      percent,
      message: `Generating subtitles (${i + 1}/${totalLangs}): ${lang.name}`
    });

    try {
      const lines = baseVtt.split('\n');
      const textLines = lines.filter(line => line && !line.startsWith('WEBVTT') && !line.includes('-->') && !/^\d+$/.test(line));
      const combinedText = textLines.join('\n');

      const response = await fetch(`/api/translate?to=${lang.code}&text=${encodeURIComponent(combinedText)}`);
      if (response.ok) {
        const data = await response.json();
        const translatedLines = (data.translation || '').split('\n');
        
        let translatedIndex = 0;
        const translatedVttLines = lines.map(line => {
          if (line && !line.startsWith('WEBVTT') && !line.includes('-->') && !/^\d+$/.test(line)) {
            const replacement = translatedLines[translatedIndex] ? translatedLines[translatedIndex].trim() : line;
            translatedIndex++;
            return replacement;
          }
          return line;
        });
        result[lang.code] = translatedVttLines.join('\n');
      } else {
        result[lang.code] = baseVtt;
      }
    } catch {
      result[lang.code] = baseVtt;
    }

    onProgress?.({
      current: i + 1,
      total: totalLangs,
      langCode: lang.code,
      langName: lang.name,
      percent,
      message: `Generating subtitles (${i + 1}/${totalLangs}): ${lang.name}`
    }, lang.code, result[lang.code]);
  }

  return result;
};
