import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { getFFprobeBinaryPath } from '../video/MediaProbe.js';
import { isWhisperModelCached, QUALITY_MODEL_MAP, WHISPER_MODEL_SIZES } from '../transcription/WhisperProvider.js';
import { getTransformers } from '../transcription/transformersLoader.js';
import { AITUTOR_LANGUAGES } from '../languages/registry.js';
import { TranslationRouter } from '../translation/TranslationRouter.js';
import { NodeTTSProvider } from '../tts/NodeTTSProvider.js';

export const checkNode = () => {
  const version = process.version;
  const major = parseInt(version.replace(/^v/, '').split('.')[0], 10);
  const pass = major >= 18;
  return {
    name: 'Node.js',
    pass,
    version,
    details: pass ? version : `${version} (Requires Node.js >= 18.0.0)`
  };
};

export const verifyFFmpegFunctional = (binPath) => {
  return new Promise((resolve) => {
    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript ? ['/c', binPath, '-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '0.05', '-f', 'null', '-'] : ['-f', 'lavfi', '-i', 'anullsrc=r=16000:cl=mono', '-t', '0.05', '-f', 'null', '-'];
      proc = spawn(execBinary, execArgs);
    } catch {
      resolve(false);
      return;
    }
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
};

export const checkFFmpeg = () => {
  return new Promise((resolve) => {
    const binPath = getFFmpegBinaryPath();
    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript ? ['/c', binPath, '-version'] : ['-version'];
      proc = spawn(execBinary, execArgs);
    } catch (err) {
      resolve({
        name: 'FFmpeg',
        pass: false,
        path: binPath,
        version: null,
        error: err.message
      });
      return;
    }

    let stdout = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.on('error', (err) => {
      resolve({
        name: 'FFmpeg',
        pass: false,
        path: binPath,
        version: null,
        error: err.message
      });
    });
    proc.on('close', async (code) => {
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
            error: 'BROKEN: FFmpeg executable exists but failed synthetic transcode test'
          });
        }
      } else {
        resolve({
          name: 'FFmpeg',
          pass: false,
          path: binPath,
          version: null,
          error: `Exited with code ${code}`
        });
      }
    });
  });
};

export const verifyFFprobeFunctional = (binPath) => {
  return new Promise((resolve) => {
    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript ? ['/c', binPath, '-f', 'lavfi', '-i', 'anullsrc', '-show_streams', '-v', 'error'] : ['-f', 'lavfi', '-i', 'anullsrc', '-show_streams', '-v', 'error'];
      proc = spawn(execBinary, execArgs);
    } catch {
      resolve(false);
      return;
    }
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
};

export const checkFFprobe = () => {
  return new Promise((resolve) => {
    const binPath = getFFprobeBinaryPath();
    let proc;
    const isWinScript = process.platform === 'win32' && (binPath.endsWith('.bat') || binPath.endsWith('.cmd'));
    try {
      const execBinary = isWinScript ? 'cmd.exe' : binPath;
      const execArgs = isWinScript ? ['/c', binPath, '-version'] : ['-version'];
      proc = spawn(execBinary, execArgs);
    } catch (err) {
      resolve({
        name: 'FFprobe',
        pass: false,
        path: binPath,
        version: null,
        error: err.message
      });
      return;
    }

    let stdout = '';
    proc.stdout?.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.on('error', (err) => {
      resolve({
        name: 'FFprobe',
        pass: false,
        path: binPath,
        version: null,
        error: err.message
      });
    });
    proc.on('close', async (code) => {
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
            error: 'BROKEN: FFprobe executable exists but failed stream inspection test'
          });
        }
      } else {
        resolve({
          name: 'FFprobe',
          pass: false,
          path: binPath,
          version: null,
          error: `Exited with code ${code}`
        });
      }
    });
  });
};

export const checkWingetAvailable = () => {
  return new Promise((resolve) => {
    if (process.platform !== 'win32') {
      resolve(false);
      return;
    }
    let proc;
    try {
      proc = spawn('winget', ['--version']);
    } catch {
      resolve(false);
      return;
    }
    proc.on('error', () => resolve(false));
    proc.on('close', (code) => resolve(code === 0));
  });
};

export const checkWhisperProvider = async (options = {}) => {
  try {
    const cwd = options.cwd || process.cwd();
    const { pipeline } = await getTransformers({ cwd, forceReload: options.forceReload });
    if (typeof pipeline === 'function') {
      return {
        name: 'Whisper Provider',
        pass: true,
        provider: '@huggingface/transformers',
        details: '@huggingface/transformers'
      };
    }
  } catch {}

  return {
    name: 'Whisper Provider',
    pass: false,
    provider: 'None',
    details: 'Missing (@huggingface/transformers)'
  };
};

export const checkWhisperModel = async (modelName = 'Xenova/whisper-base') => {
  const cacheStatus = await isWhisperModelCached(modelName);
  const size = WHISPER_MODEL_SIZES[modelName] || '~145 MB';
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

export const checkTranslationProvider = (config = {}) => {
  try {
    const router = new TranslationRouter(config.translation || {});
    return {
      name: 'Translation',
      pass: true,
      provider: router.mode || 'auto',
      languages: AITUTOR_LANGUAGES.length,
      details: 'MyMemory Neural API & M2M100'
    };
  } catch (err) {
    return {
      name: 'Translation',
      pass: false,
      error: err.message
    };
  }
};

export const checkTTSProvider = (config = {}) => {
  try {
    const rawMode = config.audio?.tts?.provider || config.ttsProvider || config.tts?.provider || 'system';
    const mode = String(rawMode).toLowerCase().trim();

    if (mode === 'neural' || mode === 'edge' || mode === 'azure') {
      return {
        name: 'TTS',
        pass: true,
        provider: 'Neural TTS (Edge / Azure)',
        details: 'Neural Text-to-Speech (hi-IN, te-IN, en-US, etc.)'
      };
    }

    if (mode === 'auto' || mode === 'hybrid') {
      return {
        name: 'TTS',
        pass: true,
        provider: 'Auto (Neural + System Fallback)',
        details: 'Neural primary with System Speech fallback'
      };
    }

    new NodeTTSProvider(config.audio?.tts || {});
    const isWin = process.platform === 'win32';
    const isMac = process.platform === 'darwin';
    const engine = isWin ? 'Windows System.Speech' : isMac ? 'macOS say' : 'Linux espeak / FFmpeg synth';
    return {
      name: 'TTS',
      pass: true,
      provider: engine,
      details: engine
    };
  } catch (err) {
    return {
      name: 'TTS',
      pass: false,
      error: err.message
    };
  }
};

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
    return {
      name: 'Cache',
      pass: false,
      path: internalDir,
      error: err.message
    };
  }
};

export const checkDiskSpace = (cwd = process.cwd(), requiredMB = 200) => {
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
  } catch {}

  // Fallback write test
  try {
    const testFile = path.join(cwd, '.aitutor', `.disk_test_${Date.now()}`);
    fs.mkdirSync(path.dirname(testFile), { recursive: true });
    fs.writeFileSync(testFile, 'aitutor_disk_check');
    fs.unlinkSync(testFile);
    return {
      name: 'Disk Space',
      pass: true,
      availableMB: null,
      requiredMB,
      details: 'Writable'
    };
  } catch (err) {
    return {
      name: 'Disk Space',
      pass: false,
      availableMB: 0,
      requiredMB,
      error: err.message
    };
  }
};

export const resolveConfiguredModel = (config = {}) => {
  if (config.transcription?.model) {
    return config.transcription.model;
  }
  const quality = config.quality || config.transcription?.quality || 'balanced';
  return QUALITY_MODEL_MAP[quality] || QUALITY_MODEL_MAP.balanced;
};

export const runPreflight = async (options = {}, cwd = process.cwd()) => {
  const config = options.config || {};
  const targetModel = options.model || resolveConfiguredModel(config);

  const nodeRes = checkNode();
  const ffmpegRes = await checkFFmpeg();
  const ffprobeRes = await checkFFprobe();
  const wingetAvailable = await checkWingetAvailable();
  const whisperProviderRes = await checkWhisperProvider();
  let whisperModelRes = await checkWhisperModel(targetModel);

  if (options.transcriber && (options.transcriber.options?.allowTestFallback || options.transcriber.options?.allowFallback || options.allowTestFallback || process.env.AITUTOR_ALLOW_FALLBACK === 'true' || options.skipModelCheck)) {
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

  const translationRes = checkTranslationProvider(config);
  const ttsRes = checkTTSProvider(config);
  const cacheRes = checkCacheDirectories(cwd);
  const diskRes = checkDiskSpace(cwd);

  const checks = {
    node: nodeRes,
    ffmpeg: ffmpegRes,
    ffprobe: ffprobeRes,
    whisperProvider: whisperProviderRes,
    whisperModel: whisperModelRes,
    translation: translationRes,
    tts: ttsRes,
    diskSpace: diskRes,
    cache: cacheRes
  };

  const missing = [];

  if (!ffmpegRes.pass) {
    missing.push({
      id: 'ffmpeg',
      name: 'FFmpeg',
      reason: 'FFmpeg is required for audio extraction from video files.',
      size: process.platform === 'win32' ? '~80 MB' : '~60 MB',
      destination: process.platform === 'win32' ? 'System PATH / winget' : 'System PATH',
      command: process.platform === 'win32' ? 'winget install Gyan.FFmpeg' : process.platform === 'darwin' ? 'brew install ffmpeg' : 'sudo apt install ffmpeg',
      wingetAvailable,
      autoInstallable: process.platform === 'win32' && wingetAvailable,
      manualInstructions: process.platform === 'win32'
        ? (wingetAvailable
            ? 'Run "winget install Gyan.FFmpeg" or download from https://www.gyan.dev/ffmpeg/builds/ and add to PATH.'
            : 'Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/, extract, and add to system PATH or set FFMPEG_PATH.')
        : process.platform === 'darwin'
        ? 'Run "brew install ffmpeg" or download from https://ffmpeg.org.'
        : 'Run "sudo apt update && sudo apt install ffmpeg" (or equivalent package manager).'
    });
  }

  if (!ffprobeRes.pass) {
    missing.push({
      id: 'ffprobe',
      name: 'FFprobe',
      reason: 'FFprobe is required for media container probing, stream inspection, and metadata extraction.',
      size: 'Included with FFmpeg',
      destination: 'System PATH',
      command: process.platform === 'win32' ? 'winget install Gyan.FFmpeg' : process.platform === 'darwin' ? 'brew install ffmpeg' : 'sudo apt install ffmpeg',
      wingetAvailable,
      autoInstallable: process.platform === 'win32' && wingetAvailable,
      manualInstructions: 'FFprobe is bundled with FFmpeg. Install FFmpeg package or set FFPROBE_PATH.'
    });
  }

  if (!whisperProviderRes.pass) {
    missing.push({
      id: 'whisper-provider',
      name: 'Whisper Provider (@huggingface/transformers)',
      reason: 'Required for Speech-to-Text neural transcription runtime.',
      size: '~15 MB',
      destination: path.join(cwd, 'node_modules'),
      command: 'npm install @huggingface/transformers',
      autoInstallable: true,
      manualInstructions: 'Run "npm install @huggingface/transformers" in your project root.'
    });
  }

  if (!whisperModelRes.pass) {
    missing.push({
      id: 'whisper-model',
      name: `Whisper Model (${targetModel})`,
      model: targetModel,
      reason: 'Required for speech recognition and multilingual subtitle cue timestamp alignment.',
      size: whisperModelRes.size,
      destination: 'Local Transformers model cache',
      command: `Download model ${targetModel}`,
      autoInstallable: true,
      manualInstructions: `The Whisper model files (${targetModel}) will be cached in your local transformers cache.`
    });
  }

  if (!nodeRes.pass) {
    missing.push({
      id: 'node',
      name: 'Node.js',
      reason: 'AITutor requires Node.js >= 18.0.0.',
      size: null,
      destination: 'System',
      command: 'Update Node.js',
      autoInstallable: false,
      manualInstructions: 'Please update your Node.js runtime to version 18 or newer (https://nodejs.org).'
    });
  }

  if (!cacheRes.pass) {
    missing.push({
      id: 'cache',
      name: 'Cache Directories',
      reason: 'AITutor needs write permission for .aitutor and public/aitutor directories.',
      size: null,
      destination: cwd,
      command: 'mkdir -p .aitutor public/aitutor',
      autoInstallable: true,
      manualInstructions: `Ensure ${cwd} is writable.`
    });
  }

  if (!diskRes.pass) {
    missing.push({
      id: 'disk-space',
      name: 'Disk Space',
      reason: `Insufficient free disk space (${diskRes.details}).`,
      size: null,
      destination: cwd,
      command: 'Free up disk space',
      autoInstallable: false,
      manualInstructions: `Ensure at least ${diskRes.requiredMB || 200} MB of free disk space is available.`
    });
  }

  const passed = missing.length === 0;

  return {
    passed,
    targetModel,
    checks,
    missing,
    wingetAvailable
  };
};

export const formatPreflightTable = (preflightResult) => {
  const { checks } = preflightResult;
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

export const formatDoctorReport = (preflightResult) => {
  const { checks, passed } = preflightResult;
  const lines = [
    `AITutor Environment Check`,
    `──────────────────────────`,
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
    passed ? `Environment ready ✅\n` : `Environment needs setup ❌\n`
  ];
  return lines.join('\n');
};
