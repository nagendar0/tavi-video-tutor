import { AITUTOR_LANGUAGES } from '../languages/registry.js';
import { runPreflight, formatPreflightTable, formatDoctorReport } from './preflight.js';

export { runPreflight, formatPreflightTable, formatDoctorReport };

export const checkEnvironment = async (options = {}, cwd = process.cwd()) => {
  const preflightRes = await runPreflight(options, cwd);
  const isFFmpegOk = preflightRes.checks.ffmpeg?.pass === true;
  
  const envStatus = {
    nodeVersion: process.version,
    ffmpegInstalled: isFFmpegOk,
    languageRegistryCount: AITUTOR_LANGUAGES.length,
    transcriptionProviderReady: preflightRes.checks.whisperProvider?.pass === true,
    translationRouterReady: preflightRes.checks.translation?.pass === true,
    preflight: preflightRes
  };

  return envStatus;
};

export const printEnvironmentReport = (envStatus) => {
  console.log(`Environment Report`);
  console.log(`──────────────────`);
  console.log(`${envStatus.ffmpegInstalled ? '✓' : '✗'} FFmpeg:                 ${envStatus.ffmpegInstalled ? 'Installed and available on PATH' : 'NOT found on system PATH'}`);
  console.log(`✓ Node.js:                ${envStatus.nodeVersion}`);
  console.log(`✓ Language registry:      ${envStatus.languageRegistryCount} entries`);
  console.log(`✓ Transcription engine:   Whisper / Transformers.js`);
  console.log(`✓ Translation router:     MyMemory Neural API & M2M100\n`);
};
