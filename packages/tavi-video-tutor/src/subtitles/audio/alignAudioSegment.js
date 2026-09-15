import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { getFFmpegBinaryPath } from './extractAudio.js';

/**
 * Align a synthesized audio segment to fit precisely within target segment timeframe [start, end].
 * 
 * Uses FFmpeg time stretching (atempo filter) and padding/trimming.
 * Direct process invocation with spawnSync and argument array (Windows-safe).
 * 
 * @param {string} inputAudioPath - Path to synthesized segment WAV/audio
 * @param {number} actualDuration - Measured duration of input audio segment
 * @param {number} targetStart - Target segment start timestamp in seconds
 * @param {number} targetEnd - Target segment end timestamp in seconds
 * @param {string} outputDir - Directory to save aligned segment audio
 * @returns {Promise<string>} Path to the timestamp-aligned audio segment
 */
export async function alignAudioSegment(inputAudioPath, actualDuration, targetStart, targetEnd, outputDir) {
  if (!inputAudioPath || !fs.existsSync(inputAudioPath)) {
    throw new Error(`alignAudioSegment: Input audio file does not exist: ${inputAudioPath}`);
  }

  const targetDuration = Math.max(0.1, targetEnd - targetStart);
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `aligned_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
  const outputPath = path.join(outputDir, filename);

  const ffmpegBin = getFFmpegBinaryPath();

  const rawRatio = actualDuration / targetDuration;
  // Bound tempo scaling between 0.75x and 1.5x for natural audio quality
  const tempo = Math.min(1.5, Math.max(0.75, rawRatio));

  const filterChain = `atempo=${tempo.toFixed(4)}`;
  const durStr = targetDuration.toFixed(4);

  // 1. Try precise time-stretch + pad/trim filter
  const primaryArgs = [
    '-y',
    '-i', inputAudioPath,
    '-filter_complex', `[0:a]${filterChain},apad=whole_dur=${durStr},atrim=0:${durStr}[outa]`,
    '-map', '[outa]',
    '-c:a', 'pcm_s16le',
    '-ar', '44100',
    '-ac', '2',
    outputPath
  ];

  const primaryProc = spawnSync(ffmpegBin, primaryArgs, { encoding: 'utf8', windowsHide: true });
  if (primaryProc.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 44) {
    return outputPath;
  }

  // 2. Fallback: simple trim/pad if atempo filter fails
  const fallbackArgs = [
    '-y',
    '-i', inputAudioPath,
    '-t', durStr,
    '-c:a', 'pcm_s16le',
    '-ar', '44100',
    '-ac', '2',
    outputPath
  ];

  const fallbackProc = spawnSync(ffmpegBin, fallbackArgs, { encoding: 'utf8', windowsHide: true });
  if (fallbackProc.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 44) {
    return outputPath;
  }

  if (fs.existsSync(outputPath)) {
    try { fs.unlinkSync(outputPath); } catch (_) {}
  }

  const stderr = (fallbackProc.stderr || primaryProc.stderr || fallbackProc.error?.message || 'Unknown error').trim();
  throw new Error(`alignAudioSegment failed [exitCode=${fallbackProc.status}]: ${stderr}`);
}

export default alignAudioSegment;
