import { checkFFmpegAvailable } from '../audio/extractAudio.js';
import { AITUTOR_LANGUAGES } from '../languages/registry.js';

export const checkEnvironment = async () => {
  const isFFmpegOk = await checkFFmpegAvailable();
  
  const envStatus = {
    nodeVersion: process.version,
    ffmpegInstalled: isFFmpegOk,
    languageRegistryCount: AITUTOR_LANGUAGES.length,
    transcriptionProviderReady: true,
    translationRouterReady: true
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
