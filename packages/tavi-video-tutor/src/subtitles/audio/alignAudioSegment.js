import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getFFmpegBinaryPath } from './extractAudio.js';

/**
 * Align a synthesized audio segment to fit precisely within target segment timeframe [start, end].
 * 
 * Uses FFmpeg time stretching (atempo filter) and padding/trimming.
 * 
 * @param {string} inputAudioPath - Path to synthesized segment WAV/audio
 * @param {number} actualDuration - Measured duration of input audio segment
 * @param {number} targetStart - Target segment start timestamp in seconds
 * @param {number} targetEnd - Target segment end timestamp in seconds
 * @param {string} outputDir - Directory to save aligned segment audio
 * @returns {Promise<string>} Path to the timestamp-aligned audio segment
 */
export async function alignAudioSegment(inputAudioPath, actualDuration, targetStart, targetEnd, outputDir) {
  const targetDuration = Math.max(0.1, targetEnd - targetStart);
  const filename = `aligned_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
  const outputPath = path.join(outputDir, filename);

  const ffmpegBin = getFFmpegBinaryPath();

  const rawRatio = actualDuration / targetDuration;
  // Bound tempo scaling between 0.75x and 1.5x for natural audio quality
  const tempo = Math.min(1.5, Math.max(0.75, rawRatio));

  let filterChain = `atempo=${tempo.toFixed(4)}`;
  
  // FFmpeg command to time-stretch and pad/trim to exact targetDuration
  const durStr = targetDuration.toFixed(4);
  const ffmpegCmd = `"${ffmpegBin}" -y -i "${inputAudioPath}" -filter_complex "[0:a]${filterChain},apad=whole_dur=${durStr},atrim=0:${durStr}[outa]" -map "[outa]" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}"`;

  try {
    execSync(ffmpegCmd, { stdio: 'ignore' });
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      return outputPath;
    }
  } catch (_) {
    // Fallback simple trim/pad if filter complex fails
    try {
      execSync(`"${ffmpegBin}" -y -i "${inputAudioPath}" -t ${durStr} -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}"`, { stdio: 'ignore' });
      return outputPath;
    } catch (e) {
      // Direct return input if FFmpeg fails completely
      return inputAudioPath;
    }
  }

  return outputPath;
}

export default alignAudioSegment;
