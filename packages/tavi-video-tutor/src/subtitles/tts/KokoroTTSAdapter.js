// @ts-check
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, spawnSync } from 'child_process';
import { TTSProvider } from './TTSProvider.js';
import {
  ModelRegistry,
  getModel,
  getCanonicalModel,
  findModelsForLanguage
} from '../models/modelRegistry.js';
import { defaultModelCacheManager, CACHE_STATUS } from '../cache/ModelCacheManager.js';
import { normalizeLanguageCode } from '../languages/registry.js';

import { TaviTTSError } from '../errors/index.js';

/**
 * Standard error class for KokoroTTSAdapter operations.
 */
export class KokoroError extends TaviTTSError {
  /**
   * @param {string} code 
   * @param {string} message 
   * @param {Object} [details]
   */
  constructor(code, message, details = {}) {
    super(`[KokoroTTSAdapter] ${code}: ${message}`, {
      name: 'KokoroError',
      code,
      provider: 'kokoro',
      engine: 'kokoro',
      languageCode: details.language || details.languageCode || null,
      modelId: details.modelId || null,
      details,
      cause: details.cause || null
    });
    this.name = 'KokoroError';
    this.code = code;
    this.provider = 'kokoro';
    this.engine = 'kokoro';
    this.fallbackAttempted = false;
    this.details = details;
    this.language = details.language || details.languageCode || null;
    this.modelId = details.modelId || null;
    this.reason = message;
  }
}

/**
 * Discovers the local Kokoro executable or runtime runner across environment variables,
 * bundled paths, and system PATH.
 * 
 * @param {string} [customPath] 
 * @returns {string|null} Absolute path to executable/runner if found, null otherwise
 */
export function findKokoroRuntime(customPath = null) {
  if (customPath && typeof customPath === 'string' && fs.existsSync(customPath)) {
    return path.resolve(customPath);
  }

  if (process.env.KOKORO_BIN && fs.existsSync(process.env.KOKORO_BIN)) {
    return path.resolve(process.env.KOKORO_BIN);
  }
  if (process.env.KOKORO_PATH && fs.existsSync(process.env.KOKORO_PATH)) {
    return path.resolve(process.env.KOKORO_PATH);
  }
  if (process.env.KOKORO_RUNTIME && fs.existsSync(process.env.KOKORO_RUNTIME)) {
    return path.resolve(process.env.KOKORO_RUNTIME);
  }

  const isWindows = process.platform === 'win32';
  const binaryNames = isWindows
    ? ['kokoro.exe', 'kokoro-tts.exe', 'kokoro-cli.exe']
    : ['kokoro', 'kokoro-tts', 'kokoro-cli'];

  const candidateDirs = [
    path.join(process.cwd(), 'bin'),
    path.join(process.cwd(), 'tools', 'kokoro'),
    path.join(process.cwd(), 'node_modules', '.bin')
  ];

  for (const dir of candidateDirs) {
    for (const bName of binaryNames) {
      const candidate = path.join(dir, bName);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  for (const bName of binaryNames) {
    try {
      const probeCmd = isWindows ? 'where.exe' : 'which';
      const proc = spawnSync(probeCmd, [bName], { encoding: 'utf8', windowsHide: true });
      if (proc.status === 0 && proc.stdout) {
        const firstLine = proc.stdout.trim().split(/\r?\n/)[0];
        if (firstLine && fs.existsSync(firstLine)) {
          return firstLine;
        }
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Verifies that a discovered Kokoro runtime is genuinely executable by this process.
 * Runs a minimal smoke invocation.
 * 
 * @param {string} runtimePath 
 * @returns {boolean}
 */
export function verifyKokoroRuntime(runtimePath) {
  if (!runtimePath || !fs.existsSync(runtimePath)) return false;
  try {
    const proc = spawnSync(runtimePath, ['--help'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000
    });
    return proc.status === 0 || (proc.stdout && proc.stdout.toLowerCase().includes('kokoro')) || (proc.stderr && proc.stderr.toLowerCase().includes('kokoro'));
  } catch (_) {
    return false;
  }
}

/**
 * Validates a generated WAV file header and extracts duration and sample rate.
 * 
 * @param {string} filePath 
 * @param {number} [expectedSampleRate]
 * @returns {{ valid: boolean, duration: number, sampleRate: number, channels: number }}
 */
export function validateWavOutput(filePath, expectedSampleRate = null) {
  if (!fs.existsSync(filePath)) {
    throw new KokoroError('AUDIO_OUTPUT_INVALID', `Generated audio file does not exist at '${filePath}'.`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size < 44) {
    throw new KokoroError('AUDIO_OUTPUT_INVALID', `Generated audio file is too small or truncated (${stat.size} bytes).`);
  }

  const buf = Buffer.alloc(44);
  const fd = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fd, buf, 0, 44, 0);
  } finally {
    fs.closeSync(fd);
  }

  const riff = buf.toString('ascii', 0, 4);
  const wave = buf.toString('ascii', 8, 12);
  if (riff !== 'RIFF' || wave !== 'WAVE') {
    throw new KokoroError('AUDIO_OUTPUT_INVALID', `Generated file header is not a valid RIFF/WAVE container (found: ${riff}/${wave}).`);
  }

  const channels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);

  const duration = bytesPerSecond > 0 ? (stat.size - 44) / bytesPerSecond : 0;

  if (expectedSampleRate && sampleRate !== expectedSampleRate) {
    throw new KokoroError('AUDIO_OUTPUT_INVALID', `Audio sample rate (${sampleRate} Hz) does not match expected model rate (${expectedSampleRate} Hz).`);
  }

  if (duration <= 0) {
    throw new KokoroError('AUDIO_OUTPUT_INVALID', 'Generated audio duration is 0 or unmeasurable.');
  }

  return {
    valid: true,
    duration: Math.max(0.01, duration),
    sampleRate,
    channels
  };
}

/**
 * Default production subprocess runner for Kokoro.
 * Spawns Kokoro with explicit argv arguments and streams text to stdin.
 * 
 * @param {Object} params
 * @param {string} params.runtimePath
 * @param {Array<string>} params.args
 * @param {string} params.text
 * @param {string} params.outputPath
 * @param {number} params.timeoutMs
 * @param {Object} params.modelDef
 * @returns {Promise<{ exitCode: number, durationMs: number }>}
 */
export async function defaultKokoroRuntimeRunner(params) {
  const { runtimePath, args, text, outputPath, timeoutMs } = params;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let timedOut = false;

    const child = spawn(runtimePath, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGTERM'); } catch (_) {}
      setTimeout(() => {
        try { child.kill('SIGKILL'); } catch (_) {}
      }, 500);
      reject(new KokoroError('ENGINE_TIMEOUT', `Kokoro runtime process timed out after ${timeoutMs}ms.`, {
        timeoutMs,
        stderr: stderr.slice(-300)
      }));
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new KokoroError('ENGINE_EXECUTION_FAILED', `Failed to spawn Kokoro runtime process: ${err.message}`, {
        originalError: err.message
      }));
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;

      const durationMs = Date.now() - startTime;
      if (code !== 0) {
        reject(new KokoroError('ENGINE_EXECUTION_FAILED', `Kokoro runtime process exited with code ${code}: ${stderr.trim() || 'unknown error'}`, {
          exitCode: code,
          stderr: stderr.slice(-500),
          stdout: stdout.slice(-300)
        }));
      } else {
        resolve({ exitCode: code, durationMs });
      }
    });

    // Stream UTF-8 text safely through stdin to avoid shell escaping issues
    try {
      child.stdin.write(text, 'utf8');
      child.stdin.end();
    } catch (writeErr) {
      clearTimeout(timer);
      reject(new KokoroError('ENGINE_EXECUTION_FAILED', `Failed to write input text to Kokoro stdin: ${writeErr.message}`));
    }
  });
}

/**
 * Local Kokoro Neural TTS Adapter for Tavi.
 * 
 * Complies strictly with the Phase 5 specification:
 * - Implements TTSProvider contract.
 * - Integrates with ModelRegistry and ModelCacheManager.
 * - Executes Kokoro locally with zero network access in offline mode.
 * - Has ZERO silent fallback to Piper, Edge, Google, Azure, or NodeTTS.
 * - Preserves Unicode multilingual text across supported Kokoro languages.
 * - Manages session/model lifecycle with concurrency safety.
 */
export class KokoroTTSAdapter extends TTSProvider {
  /**
   * @param {Object} [options]
   * @param {string} [options.executablePath] - Custom path to Kokoro runtime/binary
   * @param {string} [options.runtimePath] - Alias for executablePath
   * @param {string} [options.kokoroPath] - Alias for executablePath
   * @param {Object} [options.modelRegistry] - Custom ModelRegistry instance
   * @param {Object} [options.cacheManager] - Custom ModelCacheManager instance
   * @param {Function} [options.runtimeRunner] - Injected runtime runner for testability
   * @param {Function} [options.processRunner] - Alias for runtimeRunner
   * @param {number} [options.timeoutMs=30000] - Process execution timeout
   */
  constructor(options = {}) {
    super(options);
    this.providerId = 'kokoro';
    this.engine = 'kokoro';
    this.modelRegistry = options.modelRegistry || ModelRegistry;
    this.cacheManager = options.cacheManager || defaultModelCacheManager;
    this.customRuntimePath = options.executablePath || options.runtimePath || options.kokoroPath || null;
    this.runtimeRunner = options.runtimeRunner || options.processRunner || defaultKokoroRuntimeRunner;
    this.timeoutMs = options.timeoutMs || 30000;
    /** @type {Map<string, Object>} */
    this.sessionCache = new Map();
    /** @type {Map<string, Promise<any>>} */
    this.initLocks = new Map();
  }

  /**
   * Checks whether this adapter technically supports the requested language with a Kokoro model.
   * 
   * @param {string} language 
   * @returns {boolean}
   */
  supportsLanguage(language) {
    const norm = normalizeLanguageCode(language);
    if (!norm) return false;
    const canonical = this.modelRegistry.getCanonicalModel(norm, 'kokoro');
    if (canonical && canonical.engine === 'kokoro') return true;
    const alts = this.modelRegistry.findModelsForLanguage(norm);
    return alts.some(m => m.engine === 'kokoro');
  }

  /**
   * Resolves the Kokoro runtime path.
   * 
   * @returns {string|null}
   */
  getRuntimePath() {
    return findKokoroRuntime(this.customRuntimePath);
  }

  /**
   * Returns true if the Kokoro runtime exists and is smoke-test verified.
   * 
   * @returns {boolean}
   */
  isEngineAvailable() {
    const bin = this.getRuntimePath();
    if (!bin) return false;
    return verifyKokoroRuntime(bin);
  }

  /**
   * Resolves the concrete Kokoro model definition to use for a synthesis request.
   * 
   * @param {string} language - Language code or locale
   * @param {Object} [options] - Options containing optional modelId or voiceId
   * @returns {Object} ModelDefinition
   */
  resolveKokoroModel(language, options = {}) {
    const requestedVoice = options.modelId || options.voiceId || options.voice || null;

    if (requestedVoice && typeof requestedVoice === 'string') {
      const model = this.modelRegistry.getModel(requestedVoice.trim());
      if (model && model.engine === 'kokoro') {
        return model;
      }
      throw new KokoroError('MODEL_NOT_FOUND', `Requested Kokoro model '${requestedVoice}' is not registered or is not a Kokoro engine model.`, {
        modelId: requestedVoice,
        language
      });
    }

    const norm = normalizeLanguageCode(language);
    if (!norm) {
      throw new KokoroError('UNSUPPORTED_LANGUAGE', `Invalid or unresolvable language code '${language}'.`, { language });
    }

    // Check canonical model for kokoro engine
    const canonical = this.modelRegistry.getCanonicalModel(norm, 'kokoro');
    if (canonical && canonical.engine === 'kokoro') {
      return canonical;
    }

    // Search alternatives
    const allModels = this.modelRegistry.findModelsForLanguage(norm);
    const kokoroAlt = allModels.find(m => m.engine === 'kokoro');
    if (kokoroAlt) {
      return kokoroAlt;
    }

    throw new KokoroError('UNSUPPORTED_LANGUAGE', `Language '${language}' (${norm}) has no technically available Kokoro model in the registry.`, {
      language: norm
    });
  }

  /**
   * Synthesize text into an audio file using local Kokoro models.
   * 
   * @param {string} text - Segment text to synthesize
   * @param {string} language - Target language code
   * @param {Object} [options]
   * @param {string} [options.modelId] - Specific Kokoro model ID to use
   * @param {string} [options.voiceId] - Alias for modelId
   * @param {string} [options.outputPath] - Target output file path
   * @param {string} [options.outputDir] - Directory for temporary output file
   * @param {boolean} [options.offline=false] - Forbids network access when true
   * @param {number} [options.speakerId] - Speaker ID / style identifier
   * @param {number} [options.speed=1.0] - Speech rate multiplier
   * @returns {Promise<{
   *   audioPath: string,
   *   duration: number,
   *   format: string,
   *   voiceId: string,
   *   providerId: string,
   *   engine: string,
   *   modelId: string,
   *   languageCode: string,
   *   sampleRate: number,
   *   channels: number
   * }>}
   */
  async synthesize(text, language, options = {}) {
    // 1. Input validation
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new KokoroError('INVALID_TTS_INPUT', 'Input text cannot be null, empty, or whitespace only.', { language });
    }

    // 2. Model resolution
    const modelDef = this.resolveKokoroModel(language, options);

    // 3. Runtime discovery
    const runtimePath = this.getRuntimePath();
    if (!runtimePath || !fs.existsSync(runtimePath)) {
      throw new KokoroError('ENGINE_NOT_FOUND', 'Kokoro runtime was not found on system PATH, environment, or configured path.', {
        runtimePath: runtimePath || 'none',
        modelId: modelDef.modelId,
        language
      });
    }

    // 4. Cache resolution and offline enforcement
    const offline = Boolean(options.offline);
    const cacheStatus = this.cacheManager.getCacheStatus(modelDef);

    if (offline) {
      if (cacheStatus.status === CACHE_STATUS.NOT_CACHED || cacheStatus.status === CACHE_STATUS.PARTIAL) {
        throw new KokoroError('MODEL_NOT_CACHED', `Kokoro model '${modelDef.modelId}' is not cached locally and network download is prohibited in offline mode.`, {
          modelId: modelDef.modelId,
          language
        });
      }
      if (cacheStatus.status === CACHE_STATUS.CHECKSUM_MISMATCH || cacheStatus.status === CACHE_STATUS.SIZE_MISMATCH) {
        throw new KokoroError('MODEL_CHECKSUM_MISMATCH', `Cached Kokoro model '${modelDef.modelId}' is corrupted or failed checksum verification.`, {
          modelId: modelDef.modelId,
          language
        });
      }
    } else {
      // In online mode, ensure model is downloaded and verified via ModelCacheManager
      await this.cacheManager.ensureModel(modelDef, { offline: false });
    }

    const modelArtifactPath = this.cacheManager.getCachePath(modelDef);
    if (!fs.existsSync(modelArtifactPath)) {
      throw new KokoroError('MODEL_NOT_CACHED', `Resolved model file does not exist at '${modelArtifactPath}'.`, {
        modelId: modelDef.modelId,
        path: modelArtifactPath
      });
    }

    // 5. Concurrency-safe session/model acquisition
    const modelKey = modelDef.modelId;
    if (!this.sessionCache.has(modelKey)) {
      if (!this.initLocks.has(modelKey)) {
        const initPromise = (async () => {
          try {
            // Record active session metadata
            this.sessionCache.set(modelKey, {
              modelId: modelDef.modelId,
              artifactPath: modelArtifactPath,
              sampleRate: modelDef.sampleRate || 24000,
              loadedAt: Date.now()
            });
          } finally {
            this.initLocks.delete(modelKey);
          }
        })();
        this.initLocks.set(modelKey, initPromise);
      }
      await this.initLocks.get(modelKey);
    }

    // 6. Output path preparation
    const outputDir = options.outputDir || os.tmpdir();
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = options.outputPath || path.join(outputDir, `kokoro_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`);

    // 7. Build safe argument list (argv array, no shell interpolation)
    const args = ['--model', modelArtifactPath, '--output_file', outputPath, '--voice', modelDef.modelId];

    if (typeof options.speed === 'number' && options.speed > 0) {
      args.push('--speed', String(options.speed));
    }

    // 8. Execute runtime runner
    await this.runtimeRunner({
      runtimePath,
      args,
      text,
      outputPath,
      timeoutMs: options.timeoutMs || this.timeoutMs,
      modelDef
    });

    // 9. Validate output audio
    const validation = validateWavOutput(outputPath, modelDef.sampleRate || null);

    return {
      audioPath: outputPath,
      duration: validation.duration,
      format: 'wav',
      voiceId: modelDef.modelId,
      providerId: 'kokoro',
      engine: 'kokoro',
      modelId: modelDef.modelId,
      languageCode: modelDef.languageCode,
      sampleRate: validation.sampleRate,
      channels: validation.channels
    };
  }
}

export default KokoroTTSAdapter;
