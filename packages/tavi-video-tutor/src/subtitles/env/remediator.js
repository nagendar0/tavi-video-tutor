import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync, spawn } from 'child_process';
import {
  checkFFmpeg,
  checkFFprobe,
  checkWhisperProvider,
  checkWhisperModel,
  checkCacheDirectories,
  runPreflight
} from './preflight.js';
import { downloadWhisperModel, WHISPER_MODEL_SIZES } from '../transcription/WhisperProvider.js';


export const askConfirmation = async (question, defaultYes = true, options = {}) => {
  if (options.yes === true || options.y === true) {
    return true;
  }
  if (options.nonInteractive === true || process.env.CI === 'true' || !process.stdin.isTTY) {
    return defaultYes && options.yes === true;
  }

  const promptSuffix = defaultYes ? '[Y/n]' : '[y/N]';
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question} ${promptSuffix} `, (answer) => {
      rl.close();
      const clean = answer.trim().toLowerCase();
      if (!clean) {
        resolve(defaultYes);
      } else if (clean === 'y' || clean === 'yes') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

export const installWindowsFFmpeg = async (options = {}) => {
  console.log(`\n→ Installing FFmpeg via Windows Package Manager (winget)...`);
  console.log(`  Command: winget install Gyan.FFmpeg\n`);

  return new Promise((resolve) => {
    let proc;
    try {
      proc = spawn('winget', [
        'install',
        'Gyan.FFmpeg',
        '--accept-package-agreements',
        '--accept-source-agreements'
      ], { stdio: 'inherit' });
    } catch (err) {
      resolve({ success: false, error: err.message });
      return;
    }

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    proc.on('close', async (code) => {
      const ffmpegCheck = await checkFFmpeg();
      const ffprobeCheck = await checkFFprobe();
      const bothAvailable = ffmpegCheck.pass && ffprobeCheck.pass;

      if (bothAvailable) {
        if (ffmpegCheck.path && ffmpegCheck.path !== 'ffmpeg') {
          process.env.FFMPEG_PATH = ffmpegCheck.path;
        }
        if (ffprobeCheck.path && ffprobeCheck.path !== 'ffprobe') {
          process.env.FFPROBE_PATH = ffprobeCheck.path;
        }
        console.log(`\n✓ FFmpeg and FFprobe installed and verified on PATH.\n`);
        resolve({ success: true });
      } else if (code === 0) {
        // If winget exited 0 but PATH not yet refreshed in this process
        console.log(`\n⚠ FFmpeg installed by winget. If not detected immediately, restart your terminal or set FFMPEG_PATH.\n`);
        resolve({ success: bothAvailable, warning: 'PATH_REFRESH_NEEDED' });
      } else {
        resolve({ success: false, error: `winget exited with code ${code}` });
      }
    });
  });
};

export const installWhisperProvider = async (cwd = process.cwd(), options = {}) => {
  const hasPkgJson = fs.existsSync(path.join(cwd, 'package.json'));
  const saveFlag = options.saveDev ? '--save-dev' : (options.save ? '--save' : (options.noSave ? '--no-save' : (hasPkgJson ? '--save-optional' : '--no-save')));
  const installCmd = `npm install ${saveFlag} @huggingface/transformers@^4.2.0`;

  console.log(`\n→ Installing Whisper Provider (@huggingface/transformers)...`);
  console.log(`  Target Directory: ${cwd}`);
  console.log(`  Command: ${installCmd}\n`);

  try {
    execSync(installCmd, {
      cwd,
      stdio: 'inherit'
    });
    const check = await checkWhisperProvider({ cwd, forceReload: true });
    if (check.pass) {
      console.log(`\n✓ Whisper provider installed and verified successfully.\n`);
      return { success: true };
    }
    return { success: false, error: 'Verification failed after npm install' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const downloadModelArtifacts = async (modelName, options = {}) => {
  const estSize = WHISPER_MODEL_SIZES[modelName] || '~145 MB';
  console.log(`\n→ Initializing Whisper Model: ${modelName}`);
  console.log(`  Estimated Download Size: ${estSize}`);
  console.log(`  Destination: Local HuggingFace / Transformers model cache`);
  console.log(`  Downloading pipeline weights...\n`);

  try {
    await downloadWhisperModel(modelName, options);
    const check = await checkWhisperModel(modelName);
    if (check.pass) {
      console.log(`\n✓ Whisper model "${modelName}" downloaded and cached locally.\n`);
      return { success: true };
    }
    return { success: false, error: 'Model cache verification failed after download' };
  } catch (err) {
    return { success: false, error: err.message };
  }
};


export const remediateMissing = async (preflightResult, options = {}, cwd = process.cwd()) => {
  const { missing } = preflightResult;
  if (!missing || missing.length === 0) {
    return { success: true, preflightResult, remainingMissing: [] };
  }

  console.log(`\nMissing Requirements Detected\n─────────────────────────────\n`);

  // Handle items sequentially
  for (const item of missing) {
    if (item.id === 'ffmpeg' || item.id === 'ffprobe') {
      // Check if other binary is already being handled or if Windows winget
      const isWin = process.platform === 'win32';
      console.log(`${item.name} was not found.`);
      console.log(`Reason:      ${item.reason}`);
      console.log(`Destination: ${item.destination}`);
      if (item.size) console.log(`Size:        ${item.size}`);

      if (isWin && item.wingetAvailable) {
        console.log(`\nAITutor can install FFmpeg using Windows Package Manager (winget).`);
        const confirmed = await askConfirmation(`Install now?`, true, options);
        if (confirmed) {
          const res = await installWindowsFFmpeg(options);
          if (!res.success) {
            console.log(`\n❌ Automatic FFmpeg installation failed: ${res.error || 'Unknown error'}`);
            console.log(`\nNext step:\n${item.manualInstructions}\n`);
          }
        } else {
          console.log(`\nAutomatic installation skipped.`);
          console.log(`\nNext step:\n${item.manualInstructions}\n`);
        }
      } else {
        console.log(`\nAutomatic installation unavailable.`);
        console.log(`\nNext step:\n${item.manualInstructions}\n`);
      }
    } else if (item.id === 'whisper-provider') {
      console.log(`Whisper Provider (@huggingface/transformers) is not installed.`);
      console.log(`Reason:      ${item.reason}`);
      console.log(`Destination: ${item.destination}`);
      console.log(`Size:        ${item.size || '~15 MB'}`);
      console.log(`Command:     ${item.command}`);

      const confirmed = await askConfirmation(`Install now?`, true, options);
      if (confirmed) {
        const res = await installWhisperProvider(cwd, options);
        if (!res.success) {
          console.log(`\n❌ Whisper provider installation failed: ${res.error}`);
          console.log(`\nNext step:\n${item.manualInstructions}\n`);
        }
      } else {
        console.log(`\nInstallation skipped.`);
        console.log(`\nNext step:\n${item.manualInstructions}\n`);
      }
    } else if (item.id === 'whisper-model') {
      console.log(`Whisper model ${item.model} is not installed.`);
      console.log(`Reason:      ${item.reason}`);
      console.log(`Size:        ${item.size}`);
      console.log(`Destination: ${item.destination}`);

      const confirmed = await askConfirmation(`Download now?`, true, options);
      if (confirmed) {
        const res = await downloadModelArtifacts(item.model, options);
        if (!res.success) {
          console.log(`\n❌ Whisper model download failed: ${res.error}`);
          console.log(`\nNext step:\n${item.manualInstructions}\n`);
        }
      } else {
        console.log(`\nDownload skipped.`);
        console.log(`\nNext step:\n${item.manualInstructions}\n`);
      }
    } else if (item.id === 'cache') {
      checkCacheDirectories(cwd);
    } else {
      console.log(`${item.name} issue:`);
      console.log(`Reason:    ${item.reason}`);
      console.log(`Next step: ${item.manualInstructions}\n`);
    }
  }

  // Re-run preflight
  const updatedPreflight = await runPreflight(options, cwd);
  return {
    success: updatedPreflight.passed,
    preflightResult: updatedPreflight,
    remainingMissing: updatedPreflight.missing
  };
};
