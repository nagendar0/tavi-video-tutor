// @ts-check
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { getFFmpegBinaryPath } from './extractAudio.js';
import { getAudioDuration } from './validateAudio.js';
import { calculateRateAdaptation } from './mixer/AudioRateAdapter.js';
import { TaviAudioError } from '../errors/index.js';

/**
 * Align a synthesized audio segment to fit precisely within target segment timeframe [targetStart, targetEnd].
 * 
 * Uses FFmpeg decomposed time stretching (atempo filters), sample rate normalization (aresample),
 * stereo channel normalization (aformat), and deterministic padding/trimming.
 * Direct process invocation with spawnSync and argument array (Windows-safe).
 * 
 * @param {string} inputAudioPath - Path to synthesized segment WAV/audio
 * @param {number} actualDuration - Measured duration of input audio segment in seconds
 * @param {number} targetStart - Target segment start timestamp in seconds
 * @param {number} targetEnd - Target segment end timestamp in seconds
 * @param {string} outputDir - Directory to save aligned segment audio
 * @typedef {import('./mixer/AudioRateAdapter.js').RateAdaptationResult} RateAdaptationResult
 * 
 * @param {Object} [options={}] - Alignment options
 * @param {RateAdaptationResult} [options.adaptation] - Precalculated rate adaptation result
 * @param {number} [options.sampleRate=44100] - Target sample rate in Hz
 * @param {number} [options.minTempo=0.75] - Minimum slowdown factor
 * @param {number} [options.maxTempo=1.50] - Maximum speedup factor
 * @param {boolean} [options.allowPadding=true] - Pad with silence when speech is shorter
 * @param {boolean} [options.allowTruncate=false] - Truncate audio when speech exceeds limits
 * @param {boolean} [options.allowOverflow=false] - Allow audio to extend past cue window
 * @param {boolean} [options.preferNaturalPace=true] - Keep 1.0x pace with padding for shorter speech
 * @param {boolean} [options.returnMeta=false] - Return metadata object instead of plain string path
 * @returns {Promise<string|{ outputPath: string, measuredDuration: number, appliedTempo: number, tempoFactors: number[], adaptation: RateAdaptationResult }>}
 */
export async function alignAudioSegment(
  inputAudioPath,
  actualDuration,
  targetStart,
  targetEnd,
  outputDir,
  options = {}
) {
  if (!inputAudioPath || typeof inputAudioPath !== 'string') {
    throw new TaviAudioError('alignAudioSegment: Input audio file path must be a non-empty string', {
      code: 'AUDIO_FORMAT_INVALID',
      stage: 'audio_alignment',
      details: { inputAudioPath }
    });
  }

  if (!fs.existsSync(inputAudioPath)) {
    throw new TaviAudioError(`alignAudioSegment: Input audio file does not exist: ${inputAudioPath}`, {
      code: 'AUDIO_FORMAT_INVALID',
      stage: 'audio_alignment',
      details: { inputAudioPath }
    });
  }

  const targetDuration = Math.max(0.05, targetEnd - targetStart);
  const sampleRate = options.sampleRate || 44100;

  // 1. Resolve rate adaptation
  /** @type {RateAdaptationResult} */
  const adaptation = options.adaptation || calculateRateAdaptation({
    targetDuration,
    sourceDuration: actualDuration,
    limits: {
      minRateFactor: options.minTempo ?? 0.75,
      maxRateFactor: options.maxTempo ?? 1.50,
      allowPadding: options.allowPadding ?? true,
      allowTruncate: options.allowTruncate ?? false,
      allowOverflow: options.allowOverflow ?? false,
      preferNaturalPace: options.preferNaturalPace ?? true
    }
  });

  if (adaptation.mode === 'UNSATISFIABLE') {
    throw new TaviAudioError(`alignAudioSegment: ${adaptation.reason}`, {
      code: 'AUDIO_TIMING_OVERFLOW',
      stage: 'audio_alignment',
      details: { inputAudioPath, actualDuration, targetDuration, adaptation }
    });
  }

  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `aligned_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
  const outputPath = path.join(outputDir, filename);

  const ffmpegBin = getFFmpegBinaryPath();
  const durStr = targetDuration.toFixed(4);

  // 2. Build filter graph
  // Chained atempo filters for decomposed factor representation
  const filterTokens = [
    `aresample=${sampleRate}`,
    'aformat=sample_fmts=s16:channel_layouts=stereo'
  ];

  if (adaptation.tempoFactors && adaptation.tempoFactors.length > 0) {
    for (const factor of adaptation.tempoFactors) {
      if (Math.abs(factor - 1.0) > 0.001) {
        filterTokens.push(`atempo=${factor.toFixed(4)}`);
      }
    }
  }

  filterTokens.push(`apad=whole_dur=${durStr}`);
  filterTokens.push(`atrim=0:${durStr}`);

  const filterComplexStr = `[0:a]${filterTokens.join(',')}[outa]`;

  // 3. Process execution
  const primaryArgs = [
    '-y',
    '-i', inputAudioPath,
    '-filter_complex', filterComplexStr,
    '-map', '[outa]',
    '-c:a', 'pcm_s16le',
    '-ar', String(sampleRate),
    '-ac', '2',
    outputPath
  ];

  const primaryProc = spawnSync(ffmpegBin, primaryArgs, { encoding: 'utf8', windowsHide: true });
  if (primaryProc.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 44) {
    const measuredDuration = getAudioDuration(outputPath) || targetDuration;
    if (options.returnMeta) {
      return {
        outputPath,
        measuredDuration,
        appliedTempo: adaptation.rateFactor,
        tempoFactors: adaptation.tempoFactors,
        adaptation
      };
    }
    return outputPath;
  }

  // 4. Fallback execution: simple pad/trim without tempo filter
  const fallbackArgs = [
    '-y',
    '-i', inputAudioPath,
    '-t', durStr,
    '-c:a', 'pcm_s16le',
    '-ar', String(sampleRate),
    '-ac', '2',
    outputPath
  ];

  const fallbackProc = spawnSync(ffmpegBin, fallbackArgs, { encoding: 'utf8', windowsHide: true });
  if (fallbackProc.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 44) {
    const measuredDuration = getAudioDuration(outputPath) || targetDuration;
    if (options.returnMeta) {
      return {
        outputPath,
        measuredDuration,
        appliedTempo: 1.0,
        tempoFactors: [1.0],
        adaptation
      };
    }
    return outputPath;
  }

  if (fs.existsSync(outputPath)) {
    try { fs.unlinkSync(outputPath); } catch (_) {}
  }

  const stderr = (fallbackProc.stderr || primaryProc.stderr || fallbackProc.error?.message || 'Unknown error').trim();
  throw new TaviAudioError(`alignAudioSegment failed [exitCode=${fallbackProc.status || primaryProc.status}]: ${stderr}`, {
    code: 'AUDIO_RATE_ADAPTATION_FAILED',
    stage: 'audio_alignment',
    cause: fallbackProc.error || primaryProc.error,
    details: {
      inputAudioPath,
      actualDuration,
      targetDuration,
      primaryExitCode: primaryProc.status,
      fallbackExitCode: fallbackProc.status,
      stderr
    }
  });
}

export default alignAudioSegment;
