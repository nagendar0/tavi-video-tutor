import fs from 'fs';
import { getTransformers, getGlobalModelCacheDir } from './transformersLoader.js';

import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Global in-memory cache for downloaded/loaded transformers pipelines
const PIPELINE_MODEL_CACHE = new Map();

export const QUALITY_MODEL_MAP = {
  fast: 'Xenova/whisper-tiny',
  balanced: 'Xenova/whisper-base',
  accurate: 'Xenova/whisper-small'
};

export const WHISPER_MODEL_SIZES = {
  'Xenova/whisper-tiny': '75 MB',
  'Xenova/whisper-base': '145 MB',
  'Xenova/whisper-small': '480 MB',
  'Xenova/whisper-medium': '1.5 GB',
  'Xenova/whisper-large-v3': '3.1 GB'
};

/**
 * Validates that a directory contains a complete, non-corrupted Whisper ONNX model.
 * Requires config.json, tokenizer.json, and non-empty ONNX encoder/decoder weights.
 */
export const validateModelCacheDirectory = (dir) => {
  if (!dir || !fs.existsSync(dir)) return false;
  try {
    const files = fs.readdirSync(dir);
    // Config and tokenizer metadata are required
    if (!files.includes('config.json') || !files.includes('tokenizer.json')) {
      return false;
    }
    const configStat = fs.statSync(path.join(dir, 'config.json'));
    const tokenStat = fs.statSync(path.join(dir, 'tokenizer.json'));
    if (configStat.size < 10 || tokenStat.size < 10) {
      return false;
    }

    // Check nested onnx/ directory
    const onnxDir = path.join(dir, 'onnx');
    if (fs.existsSync(onnxDir)) {
      const onnxFiles = fs.readdirSync(onnxDir);
      const encFile = onnxFiles.find(f => f.startsWith('encoder_model') && f.endsWith('.onnx'));
      const decFile = onnxFiles.find(f => f.startsWith('decoder_model') && f.endsWith('.onnx'));
      if (encFile && decFile) {
        const encStat = fs.statSync(path.join(onnxDir, encFile));
        const decStat = fs.statSync(path.join(onnxDir, decFile));
        if (encStat.size > 10000 && decStat.size > 10000) {
          return true;
        }
      }
    }

    // Also check root directory for direct ONNX weights (e.g. custom or flattened caches)
    const rootEnc = files.find(f => f.startsWith('encoder_model') && f.endsWith('.onnx'));
    const rootDec = files.find(f => f.startsWith('decoder_model') && f.endsWith('.onnx'));
    if (rootEnc && rootDec) {
      const encStat = fs.statSync(path.join(dir, rootEnc));
      const decStat = fs.statSync(path.join(dir, rootDec));
      if (encStat.size > 10000 && decStat.size > 10000) {
        return true;
      }
    }
  } catch (_) {}

  return false;
};

export const isWhisperModelCached = async (modelName = 'Xenova/whisper-base') => {
  if (PIPELINE_MODEL_CACHE.has(modelName)) {
    return { cached: true, inMemory: true, path: 'memory' };
  }

  try {
    const { env } = await getTransformers();
    const candidateDirs = [];

    // 1. Configured persistent global cache directory
    const globalCacheDir = getGlobalModelCacheDir();
    if (globalCacheDir) {
      candidateDirs.push(path.join(globalCacheDir, ...modelName.split('/')));
      candidateDirs.push(path.join(globalCacheDir, modelName));
    }

    // 2. env.cacheDir from transformers
    if (env?.cacheDir) {
      candidateDirs.push(path.join(env.cacheDir, ...modelName.split('/')));
      candidateDirs.push(path.join(env.cacheDir, modelName));
    }
    if (env?.localModelPath) {
      candidateDirs.push(path.join(env.localModelPath, ...modelName.split('/')));
      candidateDirs.push(path.join(env.localModelPath, modelName));
    }

    // 3. Default node_modules / OS hub directories
    const homeDir = os.homedir();
    candidateDirs.push(path.join(homeDir, '.cache', 'huggingface', 'hub', `models--${modelName.replace('/', '--')}`));
    candidateDirs.push(path.join(process.cwd(), '.cache', ...modelName.split('/')));
    candidateDirs.push(path.join(process.cwd(), 'models', ...modelName.split('/')));
    candidateDirs.push(path.join(process.cwd(), '.aitutor', 'models', ...modelName.split('/')));
    candidateDirs.push(path.join(process.cwd(), 'node_modules', '@huggingface', 'transformers', '.cache', ...modelName.split('/')));
    candidateDirs.push(path.join(process.cwd(), 'node_modules', '@xenova', 'transformers', '.cache', ...modelName.split('/')));

    // Also check relative to packages/tavi-video-tutor
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      candidateDirs.push(path.resolve(currentDir, '../../../node_modules/@huggingface/transformers/.cache', ...modelName.split('/')));
      candidateDirs.push(path.resolve(currentDir, '../../../node_modules/@xenova/transformers/.cache', ...modelName.split('/')));
    } catch (_) {}

    for (const dir of candidateDirs) {
      if (validateModelCacheDirectory(dir)) {
        return { cached: true, inMemory: false, path: dir };
      }
    }
  } catch (_) {
    // If transformers cannot be loaded yet
  }

  return { cached: false, inMemory: false, path: null };
};

export const downloadWhisperModel = async (modelName = 'Xenova/whisper-base', options = {}) => {
  const provider = new WhisperProvider({ model: modelName, ...options });
  const transcriber = await provider.getTranscriberPipeline(modelName);

  // Validate model can execute without error on a tiny 0.1s synthetic silence buffer
  try {
    if (typeof transcriber === 'function') {
      const dummyPcm = new Float32Array(1600); // 100ms of 16kHz silence
      await transcriber(dummyPcm, { chunk_length_s: 30 });
    }
  } catch (valErr) {
    throw new Error(`Whisper model download verification failed: ${valErr.message}`);
  }

  return transcriber;
};

export class TranscriptionProvider {
  async transcribe(audioInput, videoEntry) {
    throw new Error('TranscriptionProvider.transcribe must be implemented by subclass.');
  }
}

export class WhisperProvider extends TranscriptionProvider {
  constructor(options = {}) {
    super();
    this.options = options;
  }

  resolveModelName() {
    if (this.options.model) {
      return this.options.model;
    }
    const mode = this.options.quality || 'balanced';
    return QUALITY_MODEL_MAP[mode] || QUALITY_MODEL_MAP.balanced;
  }

  async getTranscriberPipeline(modelName) {
    if (PIPELINE_MODEL_CACHE.has(modelName)) {
      console.log(`✓ Whisper model found in local cache`);
      console.log(`✓ No download required\n`);
      return PIPELINE_MODEL_CACHE.get(modelName);
    }

    const { pipeline, env } = await getTransformers();
    if (env) {
      env.allowLocalModels = false;
      if (env.wasm) {
        const threadCount = this.options.numThreads || 4;
        env.wasm.numThreads = threadCount;
        if ('simd' in env.wasm) {
          env.wasm.simd = true;
        }
      }
    }

    let downloadStarted = false;
    const isTTY = Boolean(process.stdout && process.stdout.isTTY && !process.env.CI);
    const filesMap = new Map();
    let lastRenderedLineCount = 0;

    const renderProgress = () => {
      if (!isTTY) return;

      let totalBytes = 0;
      let loadedBytes = 0;
      filesMap.forEach(f => {
        if (f.total) totalBytes += f.total;
        if (f.loaded) loadedBytes += f.loaded;
      });

      const overallPct = totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0;

      if (lastRenderedLineCount > 0) {
        process.stdout.write(`\x1B[${lastRenderedLineCount}A\x1B[0J`);
      }

      const lines = [];
      lines.push(`AITutor ASR Setup`);
      lines.push(`────────────────────────────────`);
      lines.push(`Whisper model not cached locally.`);
      lines.push(`Downloading: ${modelName}\n`);

      filesMap.forEach((info, file) => {
        const fileName = file.split('/').pop() || file;
        if (info.status === 'done' || info.progress >= 100) {
          lines.push(`${fileName.padEnd(22)} ✓`);
        } else {
          const pct = Math.round(info.progress || 0);
          const barWidth = 15;
          const filled = Math.round((pct / 100) * barWidth);
          const empty = Math.max(0, barWidth - filled);
          const bar = '█'.repeat(filled) + '░'.repeat(empty);
          lines.push(`${fileName.padEnd(22)} [${bar}] ${String(pct).padStart(3)}%`);
        }
      });

      lines.push(`\nOverall: ${overallPct}%`);
      const output = lines.join('\n') + '\n';
      process.stdout.write(output);
      lastRenderedLineCount = lines.length;
    };

    const progress_callback = (evt) => {
      if (!evt || !evt.file) return;
      if (!downloadStarted && (evt.status === 'initiate' || evt.status === 'download' || evt.status === 'progress')) {
        downloadStarted = true;
      }
      filesMap.set(evt.file, {
        status: evt.status,
        progress: evt.progress || 0,
        loaded: evt.loaded || 0,
        total: evt.total || 0
      });
      if (downloadStarted) {
        renderProgress();
      }
    };

    try {
      const transcriber = await pipeline('automatic-speech-recognition', modelName, {
        progress_callback
      });

      if (downloadStarted) {
        if (isTTY && lastRenderedLineCount > 0) {
          process.stdout.write(`\x1B[${lastRenderedLineCount}A\x1B[0J`);
        }
        console.log(`✓ Whisper model downloaded`);
        console.log(`✓ Model cached locally`);
        console.log(`✓ Starting transcription\n`);
      } else {
        console.log(`✓ Whisper model found in local cache`);
        console.log(`✓ No download required\n`);
      }

      PIPELINE_MODEL_CACHE.set(modelName, transcriber);
      return transcriber;
    } catch (err) {
      if (isTTY && lastRenderedLineCount > 0) {
        process.stdout.write(`\x1B[${lastRenderedLineCount}A\x1B[0J`);
      }

      const isNetworkError = err.message?.includes('fetch failed') ||
                             err.message?.includes('ENOTFOUND') ||
                             err.message?.includes('ETIMEDOUT') ||
                             err.message?.includes('offline') ||
                             err.message?.includes('HTTP error') ||
                             err.code === 'ENOTFOUND';

      if (isNetworkError) {
        console.error(`\n❌ ASR Setup Error: Unable to download Whisper model "${modelName}".`);
        console.error(`   Reason: Network connection offline or host unreachable.`);
        console.error(`   Please check your internet connection or ensure model files exist in local cache.\n`);
      } else {
        console.error(`\n❌ ASR Setup Error for model "${modelName}": ${err.message}\n`);
      }
      throw err;
    }
  }

  async transcribe(audioInput, videoEntry) {
    const audioPath = typeof audioInput === 'string' ? audioInput : audioInput.audioPath;

    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    let segments = [];
    let detectedLanguage = 'en';
    const modelName = this.resolveModelName();

    try {
      const transcriber = await this.getTranscriberPipeline(modelName);
      const buffer = fs.readFileSync(audioPath);
      
      let headerOffset = 44;
      if (buffer.length > 44 && buffer.toString('ascii', 0, 4) === 'RIFF') {
        for (let i = 12; i < buffer.length - 8; i++) {
          if (buffer.toString('ascii', i, i + 4) === 'data') {
            headerOffset = i + 8;
            break;
          }
        }
      }

      const pcmBuffer = buffer.subarray(headerOffset);
      const int16Array = new Int16Array(pcmBuffer.buffer, pcmBuffer.byteOffset, Math.floor(pcmBuffer.length / 2));
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const output = await transcriber(float32Array, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true
      });

      if (output && Array.isArray(output.chunks) && output.chunks.length > 0) {
        segments = output.chunks.map((chunk) => ({
          start: Number(chunk.timestamp?.[0] || 0),
          end: Number(chunk.timestamp?.[1] || (chunk.timestamp?.[0] + 3)),
          text: String(chunk.text || '').trim()
        }));
      }
    } catch (err) {
      const isExplicitTestMode = (process.env.AITUTOR_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') &&
        (this.options.__testOnlyExplicitFallback === true || this.options.allowTestFallback === true);
      if (isExplicitTestMode) {
        segments = [
          { start: 0.5, end: 3.8, text: `Welcome to ${videoEntry.id} video lecture.` },
          { start: 4.2, end: 8.5, text: 'This subtitle was automatically generated by AITutor Subtitle Engine.' }
        ];
      } else {
        throw new Error(`Real Whisper ASR failed for model ${modelName} on ${videoEntry.id}: ${err.message}`);
      }
    }

    const isExplicitTestMode = (process.env.AITUTOR_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') &&
      (this.options.__testOnlyExplicitFallback === true || this.options.allowTestFallback === true);
    if (segments.length === 0 && isExplicitTestMode) {
      segments = [
        { start: 0.5, end: 4.0, text: `Subtitle track for ${videoEntry.id}` }
      ];
    }

    const validSegments = segments
      .filter((s) => s && !isNaN(s.start) && !isNaN(s.end) && s.end >= s.start && Boolean(s.text))
      .sort((a, b) => a.start - b.start);

    if (validSegments.length === 0) {
      throw new Error(`Speech recognition produced 0 valid timestamped transcript segments for ${videoEntry.id}`);
    }

    return {
      language: detectedLanguage,
      segments: validSegments
    };
  }
}
