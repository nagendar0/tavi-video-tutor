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
import { PolicyEngine } from '../policy/PolicyEngine.js';
import { normalizeLanguageCode } from '../languages/registry.js';
import { validateGeneratedAudio } from '../audio/validateAudio.js';
import { TaviTTSError } from '../errors/index.js';

/**
 * Standard error class for PiperTTSAdapter operations.
 */
export class PiperError extends TaviTTSError {
  /**
   * @param {string} code 
   * @param {string} message 
   * @param {Record<string, any>} [details]
   */
  constructor(code, message, details = {}) {
    super(`[PiperTTSAdapter] ${code}: ${message}`, {
      name: 'PiperError',
      code,
      provider: 'piper',
      engine: 'piper',
      languageCode: details.language || details.languageCode || null,
      modelId: details.modelId || null,
      details,
      cause: details.cause || null
    });
    this.name = 'PiperError';
    this.code = code;
    this.provider = 'piper';
    this.engine = 'piper';
    this.fallbackAttempted = false;
    this.details = details;
    this.language = details.language || details.languageCode || null;
    this.modelId = details.modelId || null;
    this.reason = message;
  }
}

/**
 * Discovers the local Piper executable across environment variables, bundled paths, and system PATH.
 * 
 * @param {string|null} [customPath] 
 * @returns {string|null} Absolute path to executable if found, null otherwise
 */
export function findPiperExecutable(customPath = null) {
  if (customPath && typeof customPath === 'string' && fs.existsSync(customPath)) {
    return path.resolve(customPath);
  }

  if (process.env.PIPER_BIN && fs.existsSync(process.env.PIPER_BIN)) {
    return path.resolve(process.env.PIPER_BIN);
  }
  if (process.env.PIPER_PATH && fs.existsSync(process.env.PIPER_PATH)) {
    return path.resolve(process.env.PIPER_PATH);
  }

  const isWindows = process.platform === 'win32';
  const binaryName = isWindows ? 'piper.exe' : 'piper';
  const candidateDirs = [
    path.join(process.cwd(), 'bin'),
    path.join(process.cwd(), 'tools', 'piper'),
    path.join(process.cwd(), 'node_modules', '.bin')
  ];

  for (const dir of candidateDirs) {
    const candidate = path.join(dir, binaryName);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  try {
    const probeCmd = isWindows ? 'where.exe' : 'which';
    const proc = spawnSync(probeCmd, ['piper'], { encoding: 'utf8', windowsHide: true });
    if (proc.status === 0 && proc.stdout) {
      const firstLine = proc.stdout.trim().split(/\r?\n/)[0];
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine;
      }
    }
  } catch (_) {}

  return null;
}

/**
 * Verifies that a discovered Piper binary is genuinely executable by this process.
 * Runs a minimal smoke invocation.
 * 
 * @param {string} executablePath 
 * @returns {boolean}
 */
export function verifyPiperExecutable(executablePath) {
  if (!executablePath || !fs.existsSync(executablePath)) return false;
  try {
    const proc = spawnSync(executablePath, ['--help'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 3000
    });
    return proc.status === 0 || Boolean(proc.stdout && proc.stdout.includes('piper')) || Boolean(proc.stderr && proc.stderr.includes('piper'));
  } catch (_) {
    return false;
  }
}

/**
 * Validates a generated WAV file header and extracts duration and sample rate.
 * 
 * @param {string} filePath 
 * @param {number|null} [expectedSampleRate]
 * @returns {{ valid: boolean, duration: number, sampleRate: number, channels: number }}
 */
export function validateWavOutput(filePath, expectedSampleRate = null) {
  if (!fs.existsSync(filePath)) {
    throw new PiperError('AUDIO_OUTPUT_INVALID', `Generated audio file does not exist at '${filePath}'.`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size < 44) {
    throw new PiperError('AUDIO_OUTPUT_INVALID', `Generated audio file is too small or truncated (${stat.size} bytes).`);
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
    throw new PiperError('AUDIO_OUTPUT_INVALID', `Generated file header is not a valid RIFF/WAVE container (found: ${riff}/${wave}).`);
  }

  const channels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);

  const duration = bytesPerSecond > 0 ? (stat.size - 44) / bytesPerSecond : 0;

  if (expectedSampleRate && sampleRate !== expectedSampleRate) {
    throw new PiperError('AUDIO_OUTPUT_INVALID', `Audio sample rate (${sampleRate} Hz) does not match expected model rate (${expectedSampleRate} Hz).`);
  }

  if (duration <= 0) {
    throw new PiperError('AUDIO_OUTPUT_INVALID', 'Generated audio duration is 0 or unmeasurable.');
  }

  return {
    valid: true,
    duration: Math.max(0.01, duration),
    sampleRate,
    channels
  };
}

/**
 * Default production subprocess runner for Piper.
 * Spawns Piper with explicit argv arguments and streams text to stdin.
 * 
 * @param {Object} params
 * @param {string} params.executablePath
 * @param {Array<string>} params.args
 * @param {string} params.text
 * @param {string} params.outputPath
 * @param {number} params.timeoutMs
 * @param {Object} params.modelDef
 * @returns {Promise<{ exitCode: number, durationMs: number }>}
 */
export async function defaultProcessRunner(params) {
  const { executablePath, args, text, outputPath, timeoutMs } = params;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let timedOut = false;

    const child = spawn(executablePath, args, {
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
      reject(new PiperError('ENGINE_TIMEOUT', `Piper process timed out after ${timeoutMs}ms.`, {
        timeoutMs,
        stderr: stderr.slice(-300)
      }));
    }, timeoutMs);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new PiperError('ENGINE_EXECUTION_FAILED', `Failed to spawn Piper process: ${err.message}`, {
        originalError: err.message
      }));
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) return;

      const durationMs = Date.now() - startTime;
      if (code !== 0) {
        reject(new PiperError('ENGINE_EXECUTION_FAILED', `Piper process exited with code ${code}: ${stderr.trim() || 'unknown error'}`, {
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
    } catch (/** @type {any} */ writeErr) {
      clearTimeout(timer);
      reject(new PiperError('ENGINE_EXECUTION_FAILED', `Failed to write input text to Piper stdin: ${writeErr.message}`));
    }
  });
}

/**
 * Local Piper Neural TTS Adapter for Tavi.
 * 
 * Complies strictly with the Phase 4 specification:
 * - Implements TTSProvider contract.
 * - Integrates with ModelRegistry and ModelCacheManager.
 * - Executes Piper locally with zero network access in offline mode.
 * - Has ZERO silent fallback to Edge, Google, Azure, or NodeTTS.
 * - Preserves Unicode multilingual text.
 */
export class PiperTTSAdapter extends TTSProvider {
  /**
   * @param {Object} [options]
   * @param {string} [options.executablePath] - Custom path to Piper binary
   * @param {string} [options.piperPath] - Alias for options.executablePath
   * @param {Object} [options.modelRegistry] - Custom ModelRegistry instance
   * @param {Object} [options.cacheManager] - Custom ModelCacheManager instance
   * @param {Function} [options.processRunner] - Injected process runner for testability
   * @param {number} [options.timeoutMs=30000] - Process execution timeout
   */
  constructor(options = {}) {
    super(options);
    this.providerId = 'piper';
    this.engine = 'piper';
    this.modelRegistry = options.modelRegistry || ModelRegistry;
    this.cacheManager = options.cacheManager || defaultModelCacheManager;
    this.policyEngine = options.policyEngine || new PolicyEngine();
    this.customExecutablePath = options.executablePath || options.piperPath || null;
    this.processRunner = options.processRunner || defaultProcessRunner;
    this.timeoutMs = options.timeoutMs || 30000;
  }

  /**
   * Checks whether this adapter technically supports the requested language with a Piper model.
   * 
   * @param {string} language 
   * @returns {boolean}
   */
  supportsLanguage(language) {
    const norm = normalizeLanguageCode(language);
    if (!norm) return false;
    const canonical = this.modelRegistry.getCanonicalModel(norm, 'piper');
    if (canonical && canonical.engine === 'piper') return true;
    const alts = this.modelRegistry.findModelsForLanguage(norm);
    return alts.some((/** @type {any} */ m) => m.engine === 'piper');
  }

  /**
   * Resolves the Piper executable path.
   * 
   * @returns {string|null}
   */
  getExecutablePath() {
    return findPiperExecutable(this.customExecutablePath || undefined);
  }

  /**
   * Returns true if the Piper executable exists and is smoke-test verified.
   * 
   * @returns {boolean}
   */
  isEngineAvailable() {
    const bin = this.getExecutablePath();
    if (!bin) return false;
    return verifyPiperExecutable(bin);
  }

  /**
   * Resolves the concrete Piper model definition to use for a synthesis request.
   * 
   * @param {string} language - Language code or locale
   * @param {Record<string, any>} [options] - Options containing optional modelId or voiceId
   * @returns {any} ModelDefinition
   */
  resolvePiperModel(language, options = {}) {
    const requestedVoice = options.modelId || options.voiceId || options.voice || null;

    if (requestedVoice && typeof requestedVoice === 'string') {
      const model = this.modelRegistry.getModel(requestedVoice.trim());
      if (model && model.engine === 'piper') {
        return model;
      }
      // If requested model is not found in registry or is not piper
      throw new PiperError('MODEL_NOT_FOUND', `Requested Piper model '${requestedVoice}' is not registered or is not a Piper engine model.`, {
        modelId: requestedVoice,
        language
      });
    }

    const norm = normalizeLanguageCode(language);
    if (!norm) {
      throw new PiperError('UNSUPPORTED_LANGUAGE', `Invalid or unresolvable language code '${language}'.`, { language });
    }

    // Check canonical model for piper engine
    const canonical = this.modelRegistry.getCanonicalModel(norm, 'piper');
    if (canonical && canonical.engine === 'piper') {
      return canonical;
    }

    // Search alternatives
    const allModels = this.modelRegistry.findModelsForLanguage(norm);
    const piperAlt = allModels.find((/** @type {any} */ m) => m.engine === 'piper');
    if (piperAlt) {
      return piperAlt;
    }

    throw new PiperError('UNSUPPORTED_LANGUAGE', `Language '${language}' (${norm}) has no technically available Piper model in the registry.`, {
      language: norm
    });
  }

  /**
   * Synthesize text into an audio file using local Piper ONNX models.
   * 
   * @param {string} text - Segment text to synthesize
   * @param {string} language - Target language code
   * @param {Object} [options]
   * @param {string} [options.modelId] - Specific Piper model ID to use
   * @param {string} [options.voiceId] - Alias for modelId
   * @param {string} [options.outputPath] - Target output file path
   * @param {string} [options.outputDir] - Directory for temporary output file
   * @param {boolean} [options.offline=false] - Forbids network access when true
   * @param {number} [options.speakerId] - Speaker ID for multi-speaker models
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
      throw new PiperError('INVALID_TTS_INPUT', 'Input text cannot be null, empty, or whitespace only.', { language });
    }

    const opts = /** @type {any} */ (options);

    // 2. Model resolution
    const modelDef = this.resolvePiperModel(language, opts);
    const m = /** @type {any} */ (modelDef);

    // 2.5. Commercial Execution Safety Check via PolicyEngine
    if (opts.executionMode === 'COMMERCIAL' || (opts.policyEvaluation && opts.policyEvaluation.permitted === false)) {
      const policyResult = opts.policyEvaluation || this.policyEngine.evaluate(m, {
        policyProfile: opts.policyProfile || 'RELAXED',
        executionMode: 'COMMERCIAL'
      });

      if (!policyResult.permitted) {
        throw new PiperError('MODEL_POLICY_RESTRICTED', `Piper model '${m.modelId}' is restricted from commercial execution: ${policyResult.reason}`, {
          modelId: m.modelId,
          language,
          policyResult
        });
      }
    }

    // 3. Engine discovery
    const executablePath = this.getExecutablePath();
    if (!executablePath || !fs.existsSync(executablePath)) {
      throw new PiperError('ENGINE_NOT_FOUND', 'Piper executable was not found on system PATH, environment, or configured path.', {
        executablePath: executablePath || 'none',
        modelId: m.modelId,
        language
      });
    }

    // 4. Cache resolution and offline enforcement
    const offline = Boolean(opts.offline);
    const cacheStatus = this.cacheManager.getCacheStatus(m);

    if (offline) {
      if (cacheStatus.status === CACHE_STATUS.NOT_CACHED || cacheStatus.status === CACHE_STATUS.PARTIAL) {
        throw new PiperError('MODEL_NOT_CACHED', `Piper model '${m.modelId}' is not cached locally and network download is prohibited in offline mode.`, {
          modelId: m.modelId,
          language
        });
      }
      if (cacheStatus.status === CACHE_STATUS.CHECKSUM_MISMATCH || cacheStatus.status === CACHE_STATUS.SIZE_MISMATCH) {
        throw new PiperError('MODEL_CHECKSUM_MISMATCH', `Cached Piper model '${m.modelId}' is corrupted or failed checksum verification.`, {
          modelId: m.modelId,
          language
        });
      }
    } else {
      // In online mode, ensure model is downloaded and verified via ModelCacheManager
      await this.cacheManager.ensureModel(m, { offline: false });
    }

    const modelOnnxPath = this.cacheManager.getCachePath(m);
    if (!fs.existsSync(modelOnnxPath)) {
      throw new PiperError('MODEL_NOT_CACHED', `Resolved model file does not exist at '${modelOnnxPath}'.`, {
        modelId: m.modelId,
        path: modelOnnxPath
      });
    }

    // 5. Output path preparation
    const outputDir = opts.outputDir || os.tmpdir();
    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = opts.outputPath || path.join(outputDir, `piper_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`);

    // 6. Build safe argument list (argv array, no shell interpolation)
    const args = ['--model', modelOnnxPath, '--output_file', outputPath];

    // Check for companion config (.onnx.json)
    const configPath = `${modelOnnxPath}.json`;
    if (fs.existsSync(configPath)) {
      args.push('--config', configPath);
    } else {
      // Alternate config naming
      const modelDir = path.dirname(modelOnnxPath);
      const baseName = path.basename(modelOnnxPath, path.extname(modelOnnxPath));
      const altConfig = path.join(modelDir, `${baseName}.json`);
      if (fs.existsSync(altConfig)) {
        args.push('--config', altConfig);
      }
    }

    if (typeof options.speakerId === 'number') {
      args.push('--speaker', String(options.speakerId));
    }

    // 7. Execute subprocess
    await this.processRunner({
      executablePath,
      args,
      text,
      outputPath,
      timeoutMs: opts.timeoutMs || this.timeoutMs,
      modelDef: m
    });

    // 8. Validate output audio
    const validation = validateWavOutput(outputPath, m.sampleRate || null);

    return {
      audioPath: outputPath,
      duration: validation.duration,
      format: 'wav',
      voiceId: m.modelId,
      providerId: 'piper',
      engine: 'piper',
      modelId: m.modelId,
      languageCode: m.languageCode,
      sampleRate: validation.sampleRate,
      channels: validation.channels
    };
  }
}

export default PiperTTSAdapter;
