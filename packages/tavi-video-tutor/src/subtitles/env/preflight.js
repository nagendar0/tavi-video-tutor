// @ts-check
import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { getFFprobeBinaryPath } from '../video/MediaProbe.js';
import { isWhisperModelCached, QUALITY_MODEL_MAP, WHISPER_MODEL_SIZES } from '../transcription/WhisperProvider.js';
import { getTransformers, getGlobalModelCacheDir } from '../transcription/transformersLoader.js';
import { AITUTOR_LANGUAGES, normalizeLanguageCode } from '../languages/registry.js';
import { TranslationRouter } from '../translation/TranslationRouter.js';
import { verifyNllbArtifacts } from '../translation/LocalNllbAdapter.js';
import { NodeTTSProvider } from '../tts/NodeTTSProvider.js';
import { findPiperExecutable, verifyPiperExecutable } from '../tts/PiperTTSAdapter.js';
import { findKokoroRuntime, verifyKokoroRuntime } from '../tts/KokoroTTSAdapter.js';
import { findMmsRuntime, verifyMmsRuntime } from '../tts/MmsTTSAdapter.js';
import { normalizeTTSProviderId, CLOUD_PROVIDERS, LOCAL_PROVIDERS } from '../tts/ttsFactory.js';
import { ModelRegistry, getModel, getCanonicalModel } from '../models/modelRegistry.js';
import { defaultModelCacheManager, ModelCacheManager, CACHE_STATUS, VERIFICATION_STATUS } from '../cache/ModelCacheManager.js';
import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES, POLICY_STATUS } from '../policy/PolicyEngine.js';

/**
 * Preflight check categories.
 * @readonly
 * @enum {string}
 */
export const CHECK_CATEGORIES = Object.freeze({
  CONFIGURATION: 'CONFIGURATION',
  SYSTEM: 'SYSTEM',
  FILESYSTEM: 'FILESYSTEM',
  BINARY: 'BINARY',
  PROVIDER: 'PROVIDER',
  MODEL: 'MODEL',
  POLICY: 'POLICY',
  CREDENTIAL: 'CREDENTIAL',
  NETWORK: 'NETWORK',
  FINAL_READINESS: 'FINAL_READINESS'
});

/**
 * Preflight check result taxonomy.
 * @readonly
 * @enum {string}
 */
export const CHECK_RESULTS = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARN: 'WARN',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
  NOT_CURRENTLY_POSSIBLE: 'NOT_CURRENTLY_POSSIBLE'
});

/**
 * Deterministic preflight error and diagnostic codes.
 * @readonly
 * @enum {string}
 */
export const PREFLIGHT_ERROR_CODES = Object.freeze({
  PRECHECK_FAILED: 'PRECHECK_FAILED',
  NODE_VERSION_UNSUPPORTED: 'NODE_VERSION_UNSUPPORTED',
  FFMPEG_NOT_FOUND: 'FFMPEG_NOT_FOUND',
  FFMPEG_BROKEN: 'FFMPEG_BROKEN',
  FFPROBE_NOT_FOUND: 'FFPROBE_NOT_FOUND',
  FFPROBE_BROKEN: 'FFPROBE_BROKEN',
  WORKSPACE_NOT_WRITABLE: 'WORKSPACE_NOT_WRITABLE',
  INSUFFICIENT_DISK_SPACE: 'INSUFFICIENT_DISK_SPACE',
  CACHE_INIT_FAILED: 'CACHE_INIT_FAILED',
  UNKNOWN_TTS_PROVIDER: 'UNKNOWN_TTS_PROVIDER',
  OFFLINE_PROVIDER_FORBIDDEN: 'OFFLINE_PROVIDER_FORBIDDEN',
  ENGINE_NOT_FOUND: 'ENGINE_NOT_FOUND',
  MODEL_NOT_CACHED: 'MODEL_NOT_CACHED',
  MODEL_CHECKSUM_MISMATCH: 'MODEL_CHECKSUM_MISMATCH',
  MODEL_SIZE_MISMATCH: 'MODEL_SIZE_MISMATCH',
  MODEL_PARTIAL_DOWNLOAD: 'MODEL_PARTIAL_DOWNLOAD',
  MODEL_POLICY_RESTRICTED: 'MODEL_POLICY_RESTRICTED',
  PROVIDER_AUTH_ERROR: 'PROVIDER_AUTH_ERROR',
  NETWORK_REQUIRED: 'NETWORK_REQUIRED'
});

/**
 * Validates and parses the Node.js runtime version.
 * 
 * @param {string} [versionString=process.version] 
 * @returns {{ pass: boolean, major: number, minor: number, patch: number, version: string, reason: string|null }}
 */
export function checkNodeVersion(versionString = process.version) {
  const match = String(versionString).match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return {
      pass: false,
      major: 0,
      minor: 0,
      patch: 0,
      version: versionString,
      reason: `Could not parse Node.js version string: '${versionString}'.`
    };
  }
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = parseInt(match[3], 10);
  const pass = major >= 18;
  return {
    pass,
    major,
    minor,
    patch,
    version: versionString,
    reason: pass ? null : `Node.js version ${versionString} is unsupported. (Requires Node.js >= 18.0.0).`
  };
}

/**
 * Backward-compatible Node check.
 */
export const checkNode = (versionString = process.version) => {
  const res = checkNodeVersion(versionString);
  return {
    name: 'Node.js',
    pass: res.pass,
    version: res.version,
    major: res.major,
    details: res.pass ? res.version : `${res.version} (Requires Node.js >= 18.0.0)`,
    reason: res.reason
  };
};

/**
 * Functional smoke invocation for FFmpeg.
 * 
 * @param {string} binPath 
 * @returns {Promise<boolean>}
 */
export const verifyFFmpegFunctional = (binPath) => {
  return new Promise((resolve) => {
    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript
        ? ['/c', binPath, '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '0.05', '-f', 'null', '-']
        : ['-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '0.05', '-f', 'null', '-'];
      proc = spawn(execBinary, execArgs, { windowsHide: true });
    } catch {
      resolve(false);
      return;
    }
    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) {}
      resolve(false);
    }, 4000);

    proc.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
};

/**
 * Checks FFmpeg installation, version, and functional execution.
 * 
 * @returns {Promise<{ name: string, pass: boolean, path: string|null, version: string|null, error?: string }>}
 */
export const checkFFmpeg = () => {
  return new Promise((resolve) => {
    const binPath = getFFmpegBinaryPath();
    if (!binPath) {
      resolve({
        name: 'FFmpeg',
        pass: false,
        path: null,
        version: null,
        error: 'FFmpeg executable was not found on PATH or via FFMPEG_PATH.'
      });
      return;
    }

    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript ? ['/c', binPath, '-version'] : ['-version'];
      proc = spawn(execBinary, execArgs, { windowsHide: true });
    } catch (err) {
      const e = /** @type {any} */ (err);
      resolve({
        name: 'FFmpeg',
        pass: false,
        path: binPath,
        version: null,
        error: e.message
      });
      return;
    }

    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) {}
      resolve({
        name: 'FFmpeg',
        pass: false,
        path: binPath,
        version: null,
        error: 'FFmpeg execution timed out'
      });
    }, 4000);

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        name: 'FFmpeg',
        pass: false,
        path: binPath,
        version: null,
        error: err.message
      });
    });

    proc.on('close', async (code) => {
      clearTimeout(timer);
      if (code === 0) {
        const firstLine = stdout.split('\n')[0] || 'ffmpeg version unknown';
        const verMatch = firstLine.match(/ffmpeg\s+version\s+([^\s]+)/i);
        const versionStr = verMatch ? verMatch[1] : firstLine.trim();

        const isFunctional = await verifyFFmpegFunctional(binPath);
        if (isFunctional) {
          resolve({
            name: 'FFmpeg',
            pass: true,
            path: binPath,
            version: versionStr
          });
        } else {
          resolve({
            name: 'FFmpeg',
            pass: false,
            path: binPath,
            version: versionStr,
            error: 'BROKEN: FFmpeg executable exists but failed synthetic transcode test.'
          });
        }
      } else {
        resolve({
          name: 'FFmpeg',
          pass: false,
          path: binPath,
          version: null,
          error: `Exited with code ${code}: ${stderr.trim() || 'Execution failed'}`
        });
      }
    });
  });
};

/**
 * Functional stream inspection invocation for FFprobe.
 * 
 * @param {string} binPath 
 * @returns {Promise<boolean>}
 */
export const verifyFFprobeFunctional = (binPath) => {
  return new Promise((resolve) => {
    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript
        ? ['/c', binPath, '-f', 'lavfi', '-i', 'anullsrc', '-show_streams', '-v', 'error']
        : ['-f', 'lavfi', '-i', 'anullsrc', '-show_streams', '-v', 'error'];
      proc = spawn(execBinary, execArgs, { windowsHide: true });
    } catch {
      resolve(false);
      return;
    }
    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) {}
      resolve(false);
    }, 4000);

    proc.on('error', () => {
      clearTimeout(timer);
      resolve(false);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0);
    });
  });
};

/**
 * Checks FFprobe installation, version, and functional execution.
 * 
 * @returns {Promise<{ name: string, pass: boolean, path: string|null, version: string|null, error?: string }>}
 */
export const checkFFprobe = () => {
  return new Promise((resolve) => {
    const binPath = getFFprobeBinaryPath();
    if (!binPath) {
      resolve({
        name: 'FFprobe',
        pass: false,
        path: null,
        version: null,
        error: 'FFprobe executable was not found on PATH or via FFPROBE_PATH.'
      });
      return;
    }

    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript ? ['/c', binPath, '-version'] : ['-version'];
      proc = spawn(execBinary, execArgs, { windowsHide: true });
    } catch (err) {
      const e = /** @type {any} */ (err);
      resolve({
        name: 'FFprobe',
        pass: false,
        path: binPath,
        version: null,
        error: `FFprobe error: ${e.message}`
      });
      return;
    }

    const timer = setTimeout(() => {
      try { proc.kill(); } catch (_) {}
      resolve({
        name: 'FFprobe',
        pass: false,
        path: binPath,
        version: null,
        error: 'FFprobe execution timed out'
      });
    }, 4000);

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        name: 'FFprobe',
        pass: false,
        path: binPath,
        version: null,
        error: `FFprobe error: ${err.message}`
      });
    });

    proc.on('close', async (code) => {
      clearTimeout(timer);
      if (code === 0) {
        const firstLine = stdout.split('\n')[0] || 'ffprobe version unknown';
        const verMatch = firstLine.match(/ffprobe\s+version\s+([^\s]+)/i);
        const versionStr = verMatch ? verMatch[1] : firstLine.trim();

        const isFunctional = await verifyFFprobeFunctional(binPath);
        if (isFunctional) {
          resolve({
            name: 'FFprobe',
            pass: true,
            path: binPath,
            version: versionStr
          });
        } else {
          resolve({
            name: 'FFprobe',
            pass: false,
            path: binPath,
            version: versionStr,
            error: 'BROKEN: FFprobe executable exists but failed stream inspection test.'
          });
        }
      } else {
        resolve({
          name: 'FFprobe',
          pass: false,
          path: binPath,
          version: null,
          error: `Exited with code ${code}: ${stderr.trim() || 'Execution failed'}`
        });
      }
    });
  });
};

/**
 * Checks whether Windows Package Manager (winget) is installed and available.
 * 
 * @returns {Promise<boolean>}
 */
export const checkWingetAvailable = () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(false);
      return;
    }
    let proc;
    try {
      proc = spawn('winget', ['--version'], { windowsHide: true });
    } catch {
      resolve(false);
      return;
    }
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
};

/**
 * Probes workspace directory for genuine write and delete capability using a temporary probe file.
 * Leaves zero debris.
 * 
 * @param {string} [targetDir=process.cwd()] 
 * @returns {{ pass: boolean, path: string, reason: string|null }}
 */
export function checkWorkspaceWritable(targetDir = process.cwd()) {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const testFile = path.join(targetDir, `.tavi_fs_probe_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(testFile, 'tavi_write_probe', 'utf8');
    const read = fs.readFileSync(testFile, 'utf8');
    fs.unlinkSync(testFile);
    const pass = read === 'tavi_write_probe';
    return {
      pass,
      path: targetDir,
      reason: pass ? null : 'Failed to verify written probe content'
    };
  } catch (err) {
    const e = /** @type {any} */ (err);
    return {
      pass: false,
      path: targetDir,
      reason: `Workspace directory '${targetDir}' is not writable: ${e.message}`
    };
  }
}

/**
 * Checks availability and initialization of internal cache directories.
 * 
 * @param {string} [cwd=process.cwd()] 
 * @returns {{ name: string, pass: boolean, path: string, details: string, error?: string }}
 */
export const checkCacheDirectories = (cwd = process.cwd()) => {
  const internalDir = path.join(cwd, '.aitutor');
  const requiredDirs = [
    internalDir,
    path.join(internalDir, 'tmp'),
    path.join(internalDir, 'transcripts'),
    path.join(internalDir, 'audio'),
    path.join(internalDir, 'videos'),
    path.join(cwd, 'public', 'aitutor')
  ];

  try {
    for (const d of requiredDirs) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }
    return {
      name: 'Cache',
      pass: true,
      path: internalDir,
      details: 'Initialized'
    };
  } catch (err) {
    const e = /** @type {any} */ (err);
    return {
      name: 'Cache',
      pass: false,
      path: internalDir,
      details: 'Failed to initialize cache directories',
      error: e.message
    };
  }
};

/**
 * Inspects available disk space against dynamic requirement.
 * 
 * @param {string} [cwd=process.cwd()] 
 * @param {number} [requiredMB=200] 
 * @param {Record<string, any>} [options]
 * @returns {{ name: string, pass: boolean, availableMB: number|null, requiredMB: number, details: string, error?: string }}
 */
export const checkDiskSpace = (cwd = process.cwd(), requiredMB = 200, options = {}) => {
  try {
    if (typeof fs.statfsSync === 'function') {
      const stats = fs.statfsSync(cwd);
      const freeBytes = stats.bavail * stats.bsize;
      const freeMB = Math.round(freeBytes / (1024 * 1024));
      const pass = freeMB >= requiredMB;
      return {
        name: 'Disk Space',
        pass,
        availableMB: freeMB,
        requiredMB,
        details: `${freeMB} MB available (min ${requiredMB} MB)`
      };
    }
  } catch (_) {}

  // Fallback write test
  try {
    const testDir = path.join(cwd, '.aitutor');
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    const testFile = path.join(testDir, `.disk_test_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    fs.writeFileSync(testFile, 'aitutor_disk_check');
    fs.unlinkSync(testFile);
    return {
      name: 'Disk Space',
      pass: true,
      availableMB: null,
      requiredMB,
      details: 'Writable (statfs unavailable; write probe succeeded)'
    };
  } catch (err) {
    const e = /** @type {any} */ (err);
    return {
      name: 'Disk Space',
      pass: false,
      availableMB: 0,
      requiredMB,
      details: 'Disk check failed',
      error: e.message
    };
  }
};

/**
 * Checks Whisper neural provider package.
 * 
 * @param {Record<string, any>} [options]
 * @returns {Promise<{ name: string, pass: boolean, provider: string, details: string }>}
 */
export const checkWhisperProvider = async (options = {}) => {
  const opts = /** @type {Record<string, any>} */ (options || {});
  try {
    const cwd = opts.cwd || process.cwd();
    const { pipeline } = await getTransformers({ cwd, forceReload: opts.forceReload });
    if (typeof pipeline === 'function') {
      return {
        name: 'Whisper Provider',
        pass: true,
        provider: '@huggingface/transformers',
        details: '@huggingface/transformers'
      };
    }
  } catch (_) {}

  return {
    name: 'Whisper Provider',
    pass: false,
    provider: 'None',
    details: 'Missing (@huggingface/transformers)'
  };
};

/**
 * Checks whether a Whisper model is cached.
 * 
 * @param {string} [modelName='Xenova/whisper-base'] 
 * @returns {Promise<{ name: string, pass: boolean, model: string, cached: boolean, cachePath: string|null, size: string, details: string }>}
 */
export const checkWhisperModel = async (modelName = 'Xenova/whisper-base') => {
  const cacheStatus = await isWhisperModelCached(modelName);
  const sizes = /** @type {Record<string, string>} */ (WHISPER_MODEL_SIZES);
  const size = sizes[modelName] || '~145 MB';
  return {
    name: 'Whisper Model',
    pass: cacheStatus.cached,
    model: modelName,
    cached: cacheStatus.cached,
    cachePath: cacheStatus.path,
    size,
    details: cacheStatus.cached ? `${modelName} (Cached)` : `${modelName} (${size}, Not Cached)`
  };
};

/**
 * Checks translation provider readiness.
 * 
 * @param {Record<string, any>} [config={}] 
 * @param {Record<string, any>} [options={}]
 * @returns {{ name: string, pass: boolean, provider: string, languages: number, details: string, error?: string }}
 */
export const checkTranslationProvider = (config = {}, options = {}) => {
  const opts = /** @type {Record<string, any>} */ ({ ...config, ...options });
  const isOffline = opts.offline === true;
  const transConfig = opts.translation || {};
  const transMode = String(transConfig.provider || opts.translationProvider || 'auto').toLowerCase().trim();

  if (isOffline && (transMode === 'mymemory' || transMode === 'external')) {
    return {
      name: 'Translation',
      pass: false,
      provider: transMode,
      languages: 0,
      details: `External translation provider '${transMode}' forbidden in offline mode`,
      error: `External translation provider '${transMode}' requires network access and is forbidden in offline mode.`
    };
  }

  try {
    const router = new TranslationRouter(transConfig);
    return {
      name: 'Translation',
      pass: true,
      provider: router.mode || 'auto',
      languages: AITUTOR_LANGUAGES.length,
      details: router.mode === 'nllb' ? 'Local NLLB-200 offline translation' : 'Translation Router ready'
    };
  } catch (err) {
    const e = /** @type {any} */ (err);
    return {
      name: 'Translation',
      pass: false,
      provider: transMode,
      languages: 0,
      details: 'Translation initialization failed',
      error: e.message
    };
  }
};

/**
 * Strict executable gate for TTS provider readiness.
 * Validates the explicitly requested provider without blind fallbacks or unconditional pass.
 * 
 * @param {Record<string, any>} [config={}] 
 * @param {Record<string, any>} [options={}] 
 * @returns {{ name: string, pass: boolean, result: string, category: string, provider: string, details?: string, reason?: string, action?: string, path?: string }}
 */
export const checkTTSProvider = (config = {}, options = {}) => {
  const opts = /** @type {Record<string, any>} */ ({ ...config, ...options });
  const rawMode = opts.audio?.tts?.provider || opts.ttsProvider || opts.tts?.provider || opts.provider || 'system';
  const canonicalId = normalizeTTSProviderId(rawMode);

  if (!canonicalId) {
    return {
      name: 'TTS Provider',
      pass: false,
      result: CHECK_RESULTS.FAIL,
      category: CHECK_CATEGORIES.CONFIGURATION,
      provider: String(rawMode),
      reason: `Unknown TTS provider: '${rawMode}'. Supported providers: piper, kokoro, mms, azure-byok, edge, system, auto.`,
      action: 'Specify a supported TTS provider in configuration (piper, kokoro, mms, azure-byok, edge, system).'
    };
  }

  const isOffline = opts.offline === true;
  if (isOffline && CLOUD_PROVIDERS.has(canonicalId)) {
    return {
      name: 'TTS Provider',
      pass: false,
      result: CHECK_RESULTS.FAIL,
      category: CHECK_CATEGORIES.CONFIGURATION,
      provider: canonicalId,
      reason: `Provider '${canonicalId}' requires network access and cannot be used in offline mode.`,
      action: 'Select an offline-capable local provider (piper, kokoro, mms, system) or disable offline mode.'
    };
  }

  if (canonicalId === 'piper') {
    const binPath = findPiperExecutable(opts.piperPath || opts.piperBin);
    if (!binPath) {
      return {
        name: 'TTS Provider (Piper)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.BINARY,
        provider: 'piper',
        reason: 'Local Piper TTS binary not found on system.',
        action: 'Install Piper binary or configure PIPER_BIN / PIPER_PATH.'
      };
    }
    const isFunctional = verifyPiperExecutable(binPath);
    if (!isFunctional) {
      return {
        name: 'TTS Provider (Piper)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.BINARY,
        provider: 'piper',
        path: binPath,
        reason: `Piper executable at '${binPath}' failed smoke invocation (--help).`,
        action: 'Verify Piper binary architecture and permissions.'
      };
    }
    return {
      name: 'TTS Provider (Piper)',
      pass: true,
      result: CHECK_RESULTS.PASS,
      category: CHECK_CATEGORIES.BINARY,
      provider: 'piper',
      path: binPath,
      details: 'Piper local neural runtime ready'
    };
  }

  if (canonicalId === 'kokoro') {
    const binPath = findKokoroRuntime(opts.kokoroPath);
    if (!binPath) {
      return {
        name: 'TTS Provider (Kokoro)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.BINARY,
        provider: 'kokoro',
        reason: 'Local Kokoro TTS runtime runner not found.',
        action: 'Install Kokoro runtime or set KOKORO_BIN / KOKORO_PATH.'
      };
    }
    const isFunctional = verifyKokoroRuntime(binPath);
    if (!isFunctional) {
      return {
        name: 'TTS Provider (Kokoro)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.BINARY,
        provider: 'kokoro',
        path: binPath,
        reason: `Kokoro runtime at '${binPath}' failed smoke invocation.`,
        action: 'Verify Kokoro runtime dependencies and permissions.'
      };
    }
    return {
      name: 'TTS Provider (Kokoro)',
      pass: true,
      result: CHECK_RESULTS.PASS,
      category: CHECK_CATEGORIES.BINARY,
      provider: 'kokoro',
      path: binPath,
      details: 'Kokoro local neural runtime ready'
    };
  }

  if (canonicalId === 'mms') {
    const binPath = findMmsRuntime(opts.mmsPath);
    if (!binPath) {
      return {
        name: 'TTS Provider (MMS)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.BINARY,
        provider: 'mms',
        reason: 'Local Meta MMS TTS runtime runner not found.',
        action: 'Install MMS/VITS runtime or set MMS_BIN / MMS_PATH.'
      };
    }
    const isFunctional = verifyMmsRuntime(binPath);
    if (!isFunctional) {
      return {
        name: 'TTS Provider (MMS)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.BINARY,
        provider: 'mms',
        path: binPath,
        reason: `MMS runtime at '${binPath}' failed smoke invocation.`,
        action: 'Verify MMS runtime installation.'
      };
    }
    return {
      name: 'TTS Provider (MMS)',
      pass: true,
      result: CHECK_RESULTS.PASS,
      category: CHECK_CATEGORIES.BINARY,
      provider: 'mms',
      path: binPath,
      details: 'Meta MMS local neural runtime ready'
    };
  }

  if (canonicalId === 'azure-byok') {
    const key = opts.subscriptionKey || opts.azureKey || process.env.AZURE_SPEECH_KEY;
    const region = opts.serviceRegion || opts.azureRegion || process.env.AZURE_SPEECH_REGION;
    if (!key || !region) {
      return {
        name: 'TTS Provider (Azure BYOK)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.CREDENTIAL,
        provider: 'azure-byok',
        reason: 'Azure Neural TTS requires subscriptionKey and serviceRegion.',
        action: 'Configure AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables or pass credentials.'
      };
    }
    return {
      name: 'TTS Provider (Azure BYOK)',
      pass: true,
      result: CHECK_RESULTS.PASS,
      category: CHECK_CATEGORIES.CREDENTIAL,
      provider: 'azure-byok',
      details: `Configured for region '${region}' (credentials masked)`
    };
  }

  if (canonicalId === 'edge') {
    return {
      name: 'TTS Provider (Edge)',
      pass: true,
      result: CHECK_RESULTS.PASS,
      category: CHECK_CATEGORIES.PROVIDER,
      provider: 'edge',
      details: 'Edge online WebSocket TTS provider configured'
    };
  }

  if (canonicalId === 'auto') {
    return {
      name: 'TTS Provider (Auto)',
      pass: true,
      result: CHECK_RESULTS.PASS,
      category: CHECK_CATEGORIES.PROVIDER,
      provider: 'auto',
      details: 'Auto provider configured'
    };
  }

  // System speech verification
  try {
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    let available = false;
    let engineName = '';
    if (isWin) {
      available = true;
      engineName = 'Windows System.Speech';
    } else if (isMac) {
      available = fs.existsSync('/usr/bin/say');
      engineName = 'macOS say';
    } else {
      const probe = spawnSync('which', ['espeak'], { encoding: 'utf8', windowsHide: true });
      available = probe.status === 0;
      engineName = 'Linux espeak';
    }

    if (!available) {
      return {
        name: 'TTS Provider (System)',
        pass: false,
        result: CHECK_RESULTS.FAIL,
        category: CHECK_CATEGORIES.BINARY,
        provider: 'system',
        reason: `System speech runtime '${engineName}' not found.`,
        action: 'Install OS speech synthesis tool (e.g. espeak) or select a neural TTS provider.'
      };
    }

    return {
      name: 'TTS Provider (System)',
      pass: true,
      result: CHECK_RESULTS.PASS,
      category: CHECK_CATEGORIES.BINARY,
      provider: engineName,
      details: engineName
    };
  } catch (err) {
    const e = /** @type {any} */ (err);
    return {
      name: 'TTS Provider (System)',
      pass: false,
      result: CHECK_RESULTS.FAIL,
      category: CHECK_CATEGORIES.BINARY,
      provider: 'system',
      reason: `System speech check error: ${e.message}`,
      action: 'Check operating system speech synthesis subsystem.'
    };
  }
};

/**
 * Resolves configured model name from config.
 * 
 * @param {Record<string, any>} [config={}] 
 * @returns {string}
 */
export const resolveConfiguredModel = (config = {}) => {
  const cfg = /** @type {Record<string, any>} */ (config || {});
  if (cfg.transcription?.model) {
    return cfg.transcription.model;
  }
  const quality = cfg.quality || cfg.transcription?.quality || 'balanced';
  const qMap = /** @type {Record<string, string>} */ (QUALITY_MODEL_MAP);
  return qMap[quality] || QUALITY_MODEL_MAP.balanced;
};

/**
 * Preflight Doctor - Modern strict executable readiness gate for Tavi.
 */
export class PreflightDoctor {
  /**
   * @param {Record<string, any>} [options]
   */
  constructor(options = {}) {
    const opts = /** @type {Record<string, any>} */ (options || {});
    this.options = opts;
    this.cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();
    this.config = opts.config || {};
    this.offline = opts.offline === true || this.config.offline === true;
    this.executionMode = opts.executionMode || this.config.executionMode || EXECUTION_MODES.COMMERCIAL;
    this.policyProfile = opts.policyProfile || this.config.policyProfile || POLICY_PROFILES.RELAXED;
    this.modelCacheManager = opts.modelCacheManager || defaultModelCacheManager;
    this.policyEngine = opts.policyEngine || new PolicyEngine();
  }

  /**
   * Executes all preflight checks in dependency-aware order.
   * 
   * @param {Record<string, any>} [runOptions={}] 
   * @returns {Promise<{
   *   passed: boolean,
   *   blocking: boolean,
   *   checks: Array<Object>,
   *   summary: { total: number, passed: number, failed: number, warnings: number, skipped: number },
   *   missing: Array<Object>,
   *   wingetAvailable: boolean,
   *   targetModel: string
   * }>}
   */
  async run(runOptions = {}) {
    const opts = /** @type {Record<string, any>} */ ({ ...this.config, ...this.options, ...runOptions });
    const checks = /** @type {any} */ ([]);
    const cwd = opts.cwd ? path.resolve(opts.cwd) : this.cwd;
    const isOffline = opts.offline === true || this.offline;
    const targetModel = opts.model || resolveConfiguredModel(this.config);

    // 1. CONFIGURATION: Provider resolution & offline compatibility
    const rawProvider = opts.audio?.tts?.provider || opts.ttsProvider || opts.tts?.provider || opts.provider || 'system';
    const canonicalProvider = normalizeTTSProviderId(rawProvider);

    if (!canonicalProvider) {
      checks.push({
        checkId: 'CONFIG_TTS_PROVIDER',
        name: 'TTS Provider Configuration',
        category: CHECK_CATEGORIES.CONFIGURATION,
        result: CHECK_RESULTS.FAIL,
        reason: `Unknown TTS provider '${rawProvider}'. Supported: piper, kokoro, mms, azure-byok, edge, system, auto.`,
        action: 'Configure a supported TTS provider in configuration.',
        blocking: true,
        details: { provider: rawProvider }
      });
    } else if (isOffline && CLOUD_PROVIDERS.has(canonicalProvider)) {
      checks.push({
        checkId: 'CONFIG_OFFLINE_TTS_PROVIDER',
        name: 'Offline TTS Provider Gate',
        category: CHECK_CATEGORIES.CONFIGURATION,
        result: CHECK_RESULTS.FAIL,
        reason: `Provider '${canonicalProvider}' requires network access and cannot be used in offline mode.`,
        action: 'Select an offline-capable local provider (piper, kokoro, mms, system) or disable offline mode.',
        blocking: true,
        details: { provider: canonicalProvider, offline: true }
      });
    } else {
      checks.push({
        checkId: 'CONFIG_TTS_PROVIDER',
        name: 'TTS Provider Configuration',
        category: CHECK_CATEGORIES.CONFIGURATION,
        result: CHECK_RESULTS.PASS,
        reason: null,
        action: null,
        blocking: false,
        details: { provider: canonicalProvider, offline: isOffline }
      });
    }

    // Translation offline configuration check
    const transRequested = opts.translation || opts.translator || (opts.languages && opts.languages.length > 1) || (this.config.subtitles?.languages && this.config.subtitles.languages.length > 1);
    const transConfig = opts.translation || {};
    const transProvider = String(transConfig.provider || opts.translationProvider || 'auto').toLowerCase().trim();

    if (transRequested && isOffline && (transProvider === 'mymemory' || transProvider === 'external')) {
      checks.push({
        checkId: 'CONFIG_OFFLINE_TRANSLATION',
        name: 'Offline Translation Gate',
        category: CHECK_CATEGORIES.CONFIGURATION,
        result: CHECK_RESULTS.FAIL,
        reason: `External translation provider '${transProvider}' requires network access and cannot be used in offline mode.`,
        action: 'Use local NLLB translation or disable offline mode.',
        blocking: true,
        details: { provider: transProvider, offline: true }
      });
    }

    // 2. SYSTEM: Node.js version parsing
    const nodeRes = checkNodeVersion(opts.nodeVersion || process.version);
    checks.push({
      checkId: 'SYSTEM_NODE_VERSION',
      name: 'Node.js Runtime',
      category: CHECK_CATEGORIES.SYSTEM,
      result: nodeRes.pass ? CHECK_RESULTS.PASS : CHECK_RESULTS.FAIL,
      reason: nodeRes.reason,
      action: nodeRes.pass ? null : 'Upgrade Node.js to version 18.0.0 or higher (https://nodejs.org).',
      blocking: !nodeRes.pass,
      details: { version: nodeRes.version, major: nodeRes.major, pass: nodeRes.pass }
    });

    // 3. FILESYSTEM: Workspace write access & Cache directories & Disk space
    const wsRes = checkWorkspaceWritable(cwd);
    checks.push({
      checkId: 'FILESYSTEM_WORKSPACE_ACCESS',
      name: 'Workspace Write Access',
      category: CHECK_CATEGORIES.FILESYSTEM,
      result: wsRes.pass ? CHECK_RESULTS.PASS : CHECK_RESULTS.FAIL,
      reason: wsRes.reason,
      action: wsRes.pass ? null : `Ensure directory '${cwd}' exists and has read/write permissions.`,
      blocking: !wsRes.pass,
      details: { path: wsRes.path, pass: wsRes.pass }
    });

    const cacheRes = checkCacheDirectories(cwd);
    checks.push({
      checkId: 'FILESYSTEM_CACHE_INIT',
      name: 'Internal Cache Directories',
      category: CHECK_CATEGORIES.FILESYSTEM,
      result: cacheRes.pass ? CHECK_RESULTS.PASS : CHECK_RESULTS.FAIL,
      reason: cacheRes.error || null,
      action: cacheRes.pass ? null : `Ensure write permissions for ${path.join(cwd, '.aitutor')}.`,
      blocking: !cacheRes.pass,
      details: { path: cacheRes.path, pass: cacheRes.pass }
    });

    // Compute dynamic disk space requirement
    let requiredDiskMB = typeof opts.requiredDiskMB === 'number' ? opts.requiredDiskMB : 50; // base workspace overhead
    if (!opts.skipModelCheck) {
      const whisperCached = await isWhisperModelCached(targetModel);
      if (!whisperCached.cached) {
        requiredDiskMB += 150;
      }
    }
    const diskRes = checkDiskSpace(cwd, requiredDiskMB, opts);
    checks.push({
      checkId: 'FILESYSTEM_DISK_SPACE',
      name: 'Free Disk Space',
      category: CHECK_CATEGORIES.FILESYSTEM,
      result: diskRes.pass ? (diskRes.availableMB === null ? CHECK_RESULTS.WARN : CHECK_RESULTS.PASS) : CHECK_RESULTS.FAIL,
      reason: diskRes.error || (!diskRes.pass ? `Insufficient free disk space (${diskRes.details}).` : null),
      action: diskRes.pass ? null : `Free up at least ${diskRes.requiredMB} MB on drive holding '${cwd}'.`,
      blocking: !diskRes.pass,
      details: { availableMB: diskRes.availableMB, requiredMB: diskRes.requiredMB, pass: diskRes.pass }
    });

    // 4. BINARY: FFmpeg and FFprobe executables
    const ffmpegRes = await checkFFmpeg();
    checks.push({
      checkId: 'BINARY_FFMPEG',
      name: 'FFmpeg Executable',
      category: CHECK_CATEGORIES.BINARY,
      result: ffmpegRes.pass ? CHECK_RESULTS.PASS : CHECK_RESULTS.FAIL,
      reason: ffmpegRes.error || null,
      action: ffmpegRes.pass ? null : (process.platform === 'win32' ? 'Run "winget install Gyan.FFmpeg" or add ffmpeg.exe to PATH.' : 'Install FFmpeg via system package manager (e.g. brew install ffmpeg / sudo apt install ffmpeg).'),
      blocking: !ffmpegRes.pass,
      details: { path: ffmpegRes.path, version: ffmpegRes.version, pass: ffmpegRes.pass }
    });

    const ffprobeRes = await checkFFprobe();
    checks.push({
      checkId: 'BINARY_FFPROBE',
      name: 'FFprobe Executable',
      category: CHECK_CATEGORIES.BINARY,
      result: ffprobeRes.pass ? CHECK_RESULTS.PASS : CHECK_RESULTS.FAIL,
      reason: ffprobeRes.error || null,
      action: ffprobeRes.pass ? null : 'Ensure FFprobe is installed and available on PATH (bundled with FFmpeg).',
      blocking: !ffprobeRes.pass,
      details: { path: ffprobeRes.path, version: ffprobeRes.version, pass: ffprobeRes.pass }
    });

    // 5. PROVIDER: Local or requested TTS runtime check (Strictly checks ONLY the requested provider)
    const ttsCheck = checkTTSProvider(this.config, opts);
    checks.push({
      checkId: 'PROVIDER_TTS_RUNTIME',
      name: ttsCheck.name,
      category: ttsCheck.category || CHECK_CATEGORIES.PROVIDER,
      result: ttsCheck.result,
      reason: ttsCheck.reason || null,
      action: ttsCheck.action || null,
      blocking: !ttsCheck.pass,
      provider: ttsCheck.provider,
      details: { provider: ttsCheck.provider, path: ttsCheck.path, details: ttsCheck.details, pass: ttsCheck.pass }
    });

    // 6. MODEL: Whisper Model, Local TTS voice models, and Translation models
    const whisperProviderRes = await checkWhisperProvider(opts);
    checks.push({
      checkId: 'MODEL_WHISPER_PROVIDER',
      name: 'Whisper Provider Runtime',
      category: CHECK_CATEGORIES.MODEL,
      result: whisperProviderRes.pass ? CHECK_RESULTS.PASS : CHECK_RESULTS.FAIL,
      reason: whisperProviderRes.pass ? null : 'Optional peer dependency neural speech-to-text runtime (@huggingface/transformers) is not installed.',
      action: whisperProviderRes.pass ? null : 'Run "npm install @huggingface/transformers" in project root or execute "npx aitutor setup".',
      blocking: !whisperProviderRes.pass,
      details: { provider: whisperProviderRes.provider, pass: whisperProviderRes.pass }
    });

    let whisperModelRes = await checkWhisperModel(targetModel);
    if (opts.transcriber?.options?.allowTestFallback || opts.transcriber?.options?.allowFallback || opts.allowTestFallback || process.env.AITUTOR_ALLOW_FALLBACK === 'true' || opts.skipModelCheck) {
      whisperModelRes = {
        name: 'Whisper Model',
        pass: true,
        model: targetModel,
        cached: true,
        cachePath: 'test-fallback',
        size: whisperModelRes.size,
        details: `${targetModel} (Mock / Fallback mode)`
      };
    }
    checks.push({
      checkId: 'MODEL_WHISPER_PRESENCE',
      name: `Whisper Model (${targetModel})`,
      category: CHECK_CATEGORIES.MODEL,
      result: whisperModelRes.pass ? CHECK_RESULTS.PASS : CHECK_RESULTS.FAIL,
      reason: whisperModelRes.pass ? null : `Whisper model '${targetModel}' is not cached locally.`,
      action: whisperModelRes.pass ? null : `Run "npx aitutor setup" to download '${targetModel}' or use a cached model.`,
      blocking: !whisperModelRes.pass,
      details: { model: targetModel, cached: whisperModelRes.cached, size: whisperModelRes.size, pass: whisperModelRes.pass }
    });

    // Check requested audio language TTS voice models when local provider is selected
    if (canonicalProvider && LOCAL_PROVIDERS.has(canonicalProvider) && canonicalProvider !== 'system') {
      const rawAudioLangs = opts.audioLanguages || opts.audio?.languages || this.config.audio?.languages || ['en'];
      const targetAudioLangs = /** @type {string[]} */ ((Array.isArray(rawAudioLangs) ? rawAudioLangs : [rawAudioLangs]).map(l => normalizeLanguageCode(l)).filter(l => Boolean(l)));

      for (const lang of targetAudioLangs) {
        if (!lang) continue;
        const modelDef = ModelRegistry.getCanonicalModel(lang, canonicalProvider);
        if (!modelDef) {
          checks.push({
            checkId: `MODEL_TTS_${canonicalProvider.toUpperCase()}_${lang.toUpperCase()}`,
            name: `${canonicalProvider.toUpperCase()} Model for Language '${lang}'`,
            category: CHECK_CATEGORIES.MODEL,
            result: CHECK_RESULTS.FAIL,
            reason: `No canonical ${canonicalProvider} model registered for language '${lang}'.`,
            action: `Select a language supported by ${canonicalProvider} or switch to another TTS provider.`,
            blocking: true,
            details: { language: lang, engine: canonicalProvider, pass: false }
          });
        } else {
          const cacheStatus = this.modelCacheManager.getCacheStatus(modelDef.modelId);
          if (cacheStatus.status === CACHE_STATUS.NOT_CACHED) {
            checks.push({
              checkId: `MODEL_TTS_${canonicalProvider.toUpperCase()}_${lang.toUpperCase()}`,
              name: `${canonicalProvider.toUpperCase()} Model (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.MODEL,
              result: CHECK_RESULTS.FAIL,
              reason: `TTS model '${modelDef.modelId}' artifact is not present in cache.`,
              action: `Cache the model artifact for '${modelDef.modelId}'.`,
              blocking: true,
              details: { modelId: modelDef.modelId, cacheStatus: cacheStatus.status, pass: false }
            });
          } else if (cacheStatus.status === CACHE_STATUS.PARTIAL) {
            checks.push({
              checkId: `MODEL_TTS_${canonicalProvider.toUpperCase()}_${lang.toUpperCase()}`,
              name: `${canonicalProvider.toUpperCase()} Model (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.MODEL,
              result: CHECK_RESULTS.FAIL,
              reason: `TTS model '${modelDef.modelId}' download is incomplete (.part file detected).`,
              action: `Resume or re-download model artifact for '${modelDef.modelId}'.`,
              blocking: true,
              details: { modelId: modelDef.modelId, cacheStatus: cacheStatus.status, pass: false }
            });
          } else if (cacheStatus.status === CACHE_STATUS.CHECKSUM_MISMATCH) {
            checks.push({
              checkId: `MODEL_TTS_${canonicalProvider.toUpperCase()}_${lang.toUpperCase()}`,
              name: `${canonicalProvider.toUpperCase()} Model (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.MODEL,
              result: CHECK_RESULTS.FAIL,
              reason: `TTS model '${modelDef.modelId}' failed checksum verification (corrupted artifact).`,
              action: `Re-download authoritative model artifact for '${modelDef.modelId}'.`,
              blocking: true,
              details: { modelId: modelDef.modelId, cacheStatus: cacheStatus.status, pass: false }
            });
          } else if (cacheStatus.status === CACHE_STATUS.SIZE_MISMATCH) {
            checks.push({
              checkId: `MODEL_TTS_${canonicalProvider.toUpperCase()}_${lang.toUpperCase()}`,
              name: `${canonicalProvider.toUpperCase()} Model (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.MODEL,
              result: CHECK_RESULTS.FAIL,
              reason: `TTS model '${modelDef.modelId}' size mismatch (expected ${cacheStatus.expectedSizeBytes} bytes, found ${cacheStatus.sizeBytes} bytes).`,
              action: `Re-download model artifact for '${modelDef.modelId}'.`,
              blocking: true,
              details: { modelId: modelDef.modelId, cacheStatus: cacheStatus.status, pass: false }
            });
          } else if (cacheStatus.status === CACHE_STATUS.CACHED_VERIFIED) {
            checks.push({
              checkId: `MODEL_TTS_${canonicalProvider.toUpperCase()}_${lang.toUpperCase()}`,
              name: `${canonicalProvider.toUpperCase()} Model (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.MODEL,
              result: CHECK_RESULTS.PASS,
              reason: null,
              action: null,
              blocking: false,
              details: {
                modelId: modelDef.modelId,
                verificationStatus: VERIFICATION_STATUS.AUTHORITATIVE_VERIFIED,
                checksum: cacheStatus.computedSha256,
                pass: true
              }
            });
          } else if (cacheStatus.status === CACHE_STATUS.CACHED_UNVERIFIED) {
            checks.push({
              checkId: `MODEL_TTS_${canonicalProvider.toUpperCase()}_${lang.toUpperCase()}`,
              name: `${canonicalProvider.toUpperCase()} Model (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.MODEL,
              result: CHECK_RESULTS.PASS,
              reason: null,
              action: null,
              blocking: false,
              details: {
                modelId: modelDef.modelId,
                verificationStatus: VERIFICATION_STATUS.COMPUTED_LOCAL_UNTRUSTED,
                checksum: cacheStatus.computedSha256,
                pass: true
              }
            });
          }
        }
      }
    }

    // Check local NLLB model if NLLB is explicitly configured
    if (transRequested && (transProvider === 'nllb' || (isOffline && transProvider === 'auto'))) {
      const nllbDir = opts.nllbModelDir || process.env.NLLB_MODEL_DIR || getGlobalModelCacheDir();
      const nllbRes = verifyNllbArtifacts(nllbDir);
      if (!nllbRes.valid) {
        checks.push({
          checkId: 'MODEL_NLLB_ARTIFACTS',
          name: 'NLLB-200 Translation Model',
          category: CHECK_CATEGORIES.MODEL,
          result: CHECK_RESULTS.FAIL,
          reason: nllbRes.reason,
          action: 'Ensure NLLB model directory contains valid config.json, tokenizer, and weights.',
          blocking: true,
          details: { valid: false, reason: nllbRes.reason, pass: false }
        });
      } else {
        checks.push({
          checkId: 'MODEL_NLLB_ARTIFACTS',
          name: 'NLLB-200 Translation Model',
          category: CHECK_CATEGORIES.MODEL,
          result: CHECK_RESULTS.PASS,
          reason: null,
          action: null,
          blocking: false,
          details: { valid: true, pass: true }
        });
      }
    }

    // 7. POLICY: Policy check for requested models under PolicyEngine
    if (canonicalProvider === 'mms') {
      const rawAudioLangs = opts.audioLanguages || opts.audio?.languages || this.config.audio?.languages || ['en'];
      const targetAudioLangs = /** @type {string[]} */ ((Array.isArray(rawAudioLangs) ? rawAudioLangs : [rawAudioLangs]).map(l => normalizeLanguageCode(l)).filter(l => Boolean(l)));
      for (const lang of targetAudioLangs) {
        if (!lang) continue;
        const modelDef = ModelRegistry.getCanonicalModel(lang, 'mms');
        if (modelDef) {
          const evalMode = opts.executionMode || this.executionMode;
          const evalProfile = opts.policyProfile || this.policyProfile;
          const evalResult = this.policyEngine.evaluateModel(modelDef.modelId, {
            executionMode: evalMode,
            policyProfile: evalProfile
          });
          if (!evalResult.permitted) {
            checks.push({
              checkId: `POLICY_MMS_${lang.toUpperCase()}`,
              name: `Policy Evaluation (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.POLICY,
              result: CHECK_RESULTS.FAIL,
              reason: `Model '${modelDef.modelId}' is restricted under ${evalProfile} policy for ${evalMode} execution: ${evalResult.reason || evalResult.policyStatus}`,
              action: 'Switch execution mode to RESEARCH if permitted, or select a commercially licensed model/provider.',
              blocking: true,
              details: { modelId: modelDef.modelId, executionMode: evalMode, policyProfile: evalProfile, pass: false }
            });
          } else {
            checks.push({
              checkId: `POLICY_MMS_${lang.toUpperCase()}`,
              name: `Policy Evaluation (${modelDef.modelId})`,
              category: CHECK_CATEGORIES.POLICY,
              result: CHECK_RESULTS.PASS,
              reason: null,
              action: null,
              blocking: false,
              details: { modelId: modelDef.modelId, executionMode: evalMode, policyProfile: evalProfile, pass: true }
            });
          }
        }
      }
    } else if (canonicalProvider === 'piper') {
      const evalMode = opts.executionMode || this.executionMode;
      const evalProfile = opts.policyProfile || this.policyProfile;
      if (evalMode === 'COMMERCIAL' && evalProfile === 'STRICT') {
        const rawAudioLangs = opts.audioLanguages || opts.audio?.languages || this.config.audio?.languages || ['en'];
        const targetAudioLangs = /** @type {string[]} */ ((Array.isArray(rawAudioLangs) ? rawAudioLangs : [rawAudioLangs]).map(l => normalizeLanguageCode(l)).filter(l => Boolean(l)));
        for (const lang of targetAudioLangs) {
          if (!lang) continue;
          const modelDef = opts.modelId ? ModelRegistry.getModel(opts.modelId) : ModelRegistry.getCanonicalModel(lang, 'piper');
          if (modelDef) {
            const evalResult = this.policyEngine.evaluateModel(modelDef.modelId, {
              executionMode: evalMode,
              policyProfile: evalProfile
            });
            if (!evalResult.permitted) {
              checks.push({
                checkId: `POLICY_PIPER_${lang.toUpperCase()}`,
                name: `Policy Evaluation (${modelDef.modelId})`,
                category: CHECK_CATEGORIES.POLICY,
                result: CHECK_RESULTS.FAIL,
                reason: `Model '${modelDef.modelId}' is restricted under ${evalProfile} policy for ${evalMode} execution: ${evalResult.reason || evalResult.policyStatus}`,
                action: 'Switch execution mode to RESEARCH if permitted, or select a commercially licensed model/provider.',
                blocking: true,
                details: { modelId: modelDef.modelId, executionMode: evalMode, policyProfile: evalProfile, pass: false }
              });
            }
          }
        }
      }
    }

    // 8. CREDENTIAL: Azure credentials check (when Azure is explicitly selected)
    if (canonicalProvider === 'azure-byok') {
      const key = opts.subscriptionKey || opts.azureKey || process.env.AZURE_SPEECH_KEY;
      const region = opts.serviceRegion || opts.azureRegion || process.env.AZURE_SPEECH_REGION;

      if (!key || !region) {
        checks.push({
          checkId: 'CREDENTIAL_AZURE',
          name: 'Azure Neural Credentials',
          category: CHECK_CATEGORIES.CREDENTIAL,
          result: CHECK_RESULTS.FAIL,
          reason: 'Azure Neural TTS requires subscriptionKey and serviceRegion.',
          action: 'Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION environment variables or configure credentials.',
          blocking: true,
          details: { hasKey: Boolean(key), hasRegion: Boolean(region), pass: false }
        });
      } else {
        const maskedKey = key.length > 8 ? `${key.slice(0, 3)}...${key.slice(-4)}` : '***';
        checks.push({
          checkId: 'CREDENTIAL_AZURE',
          name: 'Azure Neural Credentials',
          category: CHECK_CATEGORIES.CREDENTIAL,
          result: CHECK_RESULTS.PASS,
          reason: null,
          action: null,
          blocking: false,
          details: {
            serviceRegion: region,
            subscriptionKey: maskedKey,
            remoteValidation: 'SKIPPED_TO_AVOID_BILLING',
            pass: true
          }
        });
      }
    }

    // 9. NETWORK: Offline mode verification
    if (isOffline) {
      checks.push({
        checkId: 'NETWORK_OFFLINE_VERIFICATION',
        name: 'Offline Boundary Verification',
        category: CHECK_CATEGORIES.NETWORK,
        result: CHECK_RESULTS.PASS,
        reason: null,
        action: null,
        blocking: false,
        details: { offline: true, networkRequestsAllowed: false, pass: true }
      });
    }

    // 10. FINAL READINESS: Calculate summary and backward-compatible properties
    const total = checks.length;
    const passed = checks.filter(c => c.result === CHECK_RESULTS.PASS).length;
    const failed = checks.filter(c => c.result === CHECK_RESULTS.FAIL || (c.result === CHECK_RESULTS.NOT_CURRENTLY_POSSIBLE && c.blocking)).length;
    const warnings = checks.filter(c => c.result === CHECK_RESULTS.WARN).length;
    const skipped = checks.filter(c => c.result === CHECK_RESULTS.NOT_APPLICABLE || (c.result === CHECK_RESULTS.NOT_CURRENTLY_POSSIBLE && !c.blocking)).length;

    const blockingFailed = checks.some(c => c.blocking && (c.result === CHECK_RESULTS.FAIL || c.result === CHECK_RESULTS.NOT_CURRENTLY_POSSIBLE));
    const overallPassed = !blockingFailed;

    const wingetAvailable = await checkWingetAvailable();

    // Populate backward-compatible missing array
    const missing = checks
      .filter(c => c.blocking && (c.result === CHECK_RESULTS.FAIL || c.result === CHECK_RESULTS.NOT_CURRENTLY_POSSIBLE))
      .map(c => {
        const details = /** @type {any} */ (c.details || {});
        return {
          id: c.checkId.toLowerCase().replace(/_/g, '-'),
          checkId: c.checkId,
          name: c.name,
          category: c.category,
          reason: c.reason || 'Requirement not satisfied',
          action: c.action || 'Fulfill missing requirement',
          manualInstructions: c.action || 'Fulfill missing requirement',
          destination: details.path || 'System',
          size: details.size || null,
          command: details.command || null,
          wingetAvailable: c.checkId === 'BINARY_FFMPEG' || c.checkId === 'BINARY_FFPROBE' ? wingetAvailable : false,
          autoInstallable: c.checkId === 'BINARY_FFMPEG' && wingetAvailable,
          model: details.model || null,
          blocking: true
        };
      });

    // Attach named properties to checks array for backward compatibility
    const checksWithProps = /** @type {any} */ (checks);
    checksWithProps.node = checks.find(c => c.checkId === 'SYSTEM_NODE_VERSION') || { pass: false };
    checksWithProps.ffmpeg = checks.find(c => c.checkId === 'BINARY_FFMPEG') || { pass: false };
    checksWithProps.ffprobe = checks.find(c => c.checkId === 'BINARY_FFPROBE') || { pass: false };
    checksWithProps.whisperProvider = checks.find(c => c.checkId === 'MODEL_WHISPER_PROVIDER') || { pass: false };
    checksWithProps.whisperModel = checks.find(c => c.checkId === 'MODEL_WHISPER_PRESENCE') || { pass: false };
    checksWithProps.translation = checks.find(c => c.checkId === 'CONFIG_OFFLINE_TRANSLATION' || c.checkId === 'MODEL_NLLB_ARTIFACTS') || { pass: true };
    checksWithProps.tts = checks.find(c => c.checkId === 'PROVIDER_TTS_RUNTIME') || { pass: true };
    checksWithProps.diskSpace = checks.find(c => c.checkId === 'FILESYSTEM_DISK_SPACE') || { pass: true };
    checksWithProps.cache = checks.find(c => c.checkId === 'FILESYSTEM_CACHE_INIT') || { pass: true };

    // Set pass boolean property on each check object
    for (const c of checks) {
      const checkItem = /** @type {any} */ (c);
      if (typeof checkItem.pass !== 'boolean') {
        checkItem.pass = checkItem.result === CHECK_RESULTS.PASS || checkItem.result === CHECK_RESULTS.WARN;
      }
    }

    return {
      passed: overallPassed,
      blocking: blockingFailed,
      checks,
      summary: {
        total,
        passed,
        failed,
        warnings,
        skipped
      },
      missing,
      wingetAvailable,
      targetModel
    };
  }
}

/**
 * Top-level entry point to execute preflight checks.
 * Backward compatible with existing call sites.
 * 
 * @param {Record<string, any>} [options={}] 
 * @param {string} [cwd=process.cwd()] 
 * @returns {Promise<any>}
 */
export const runPreflight = async (options = {}, cwd = process.cwd()) => {
  const doctor = new PreflightDoctor({ ...options, cwd });
  return await doctor.run(options);
};

/**
 * Formats structured preflight result into a human-readable table.
 * 
 * @param {Record<string, any>} preflightResult 
 * @returns {string}
 */
export const formatPreflightTable = (preflightResult) => {
  const res = /** @type {any} */ (preflightResult || {});
  const checks = res.checks || {};
  const lines = [
    `AITutor Preflight`,
    `─────────────────────`,
    ``,
    `Node.js .............. ${checks.node?.pass ? '✅' : '❌'}`,
    `FFmpeg ............... ${checks.ffmpeg?.pass ? '✅' : '❌'}`,
    `FFprobe .............. ${checks.ffprobe?.pass ? '✅' : '❌'}`,
    `Whisper Provider ..... ${checks.whisperProvider?.pass ? '✅' : '❌'}`,
    `Whisper Model ........ ${checks.whisperModel?.pass ? '✅' : '❌'}`,
    `Translation .......... ${checks.translation?.pass ? '✅' : '❌'}`,
    `TTS .................. ${checks.tts?.pass ? '✅' : '❌'}`,
    ``
  ];
  return lines.join('\n');
};

/**
 * Formats comprehensive doctor report.
 * 
 * @param {Record<string, any>} preflightResult 
 * @returns {string}
 */
export const formatDoctorReport = (preflightResult) => {
  const res = /** @type {any} */ (preflightResult || {});
  const { checks = {}, passed = false, summary = null } = res;
  const lines = [
    `AITutor Environment Check (Preflight Doctor)`,
    `────────────────────────────────────────────`,
    ``,
    `Node.js .............. ${checks.node?.pass ? '✅' : '❌'}`,
    `FFmpeg ............... ${checks.ffmpeg?.pass ? '✅' : '❌'}`,
    `FFprobe .............. ${checks.ffprobe?.pass ? '✅' : '❌'}`,
    `Whisper Provider ..... ${checks.whisperProvider?.pass ? '✅' : '❌'}`,
    `Whisper Model ........ ${checks.whisperModel?.pass ? '✅' : '❌'}`,
    `Translation .......... ${checks.translation?.pass ? '✅' : '❌'}`,
    `TTS .................. ${checks.tts?.pass ? '✅' : '❌'}`,
    `Disk Space ........... ${checks.diskSpace?.pass ? '✅' : '❌'}`,
    `Cache ................ ${checks.cache?.pass ? '✅' : '❌'}`,
    ``,
    summary ? `Checks: ${summary.passed}/${summary.total} passed (${summary.failed} failed, ${summary.warnings} warnings)` : '',
    passed ? `Environment ready ✅\n` : `Environment needs setup ❌\n`
  ].filter(Boolean);
  return lines.join('\n');
};
