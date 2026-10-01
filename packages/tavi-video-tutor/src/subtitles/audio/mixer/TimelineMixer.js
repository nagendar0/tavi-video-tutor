// @ts-check
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { getFFmpegBinaryPath } from '../extractAudio.js';
import { validateGeneratedAudio } from '../validateAudio.js';
import { TaviAudioError } from '../../errors/index.js';

/**
 * Universal Multi-Track Audio Timeline Mixer.
 * 
 * Mixes arbitrary numbers of speaker segments into a single cohesive browser audio track (.m4a AAC or .wav).
 * 
 * Invariants & Guarantees:
 * - Deterministic multi-speaker overlap mixing with absolute timestamp delays.
 * - Explicit sample-rate and stereo channel layout normalization (aresample + aformat)
 *   so mono speech stems never accidentally collapse stereo background audio to mono.
 * - Dynamic audio normalization (dynaudnorm) to prevent clipping and balance levels.
 * - Sidechain ducking and volume ducking for background ambient tracks.
 * - Robust process invocation via spawnSync with arguments array (no Windows shell pipe collisions).
 * - Hierarchical batch mixing for very large segment counts (> 32 segments) to prevent buffer overflows.
 * - Comprehensive structural output audio validation prior to completion.
 * - Throws structured TaviAudioError on failures.
 */
export class TimelineMixer {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.ffmpegBin]
   * @param {string} [options.audioBitrate='128k']
   * @param {number} [options.sampleRate=44100]
   * @param {number} [options.maxBatchInputs=32]
   */
  constructor(options = {}) {
    this.ffmpegBin = options.ffmpegBin || getFFmpegBinaryPath();
    this.audioBitrate = options.audioBitrate || '128k';
    this.sampleRate = options.sampleRate || 44100;
    this.maxBatchInputs = options.maxBatchInputs || 32;
  }

  /**
   * Mix all aligned speaker segments into the final output M4A track.
   * 
   * @param {Array<Record<string, any>>} segments - Array of segments with { startTime, endTime, alignedAudioPath }
   * @param {string} outputPath - Destination .m4a or .wav file path
   * @param {Record<string, any>} [options={}]
   * @param {number} [options.totalDuration] - Target duration in seconds
   * @param {string} [options.ambientAudioPath] - Optional background music/ambient track
   * @param {number} [options.ambientDuckingDb=-12] - Ducking volume in dB
   * @param {boolean} [options.sidechainDucking=false] - Use dynamic sidechain compressor for ambient ducking
   * @returns {Promise<string>} outputPath
   */
  async mix(segments, outputPath, options = {}) {
    if (!outputPath || typeof outputPath !== 'string') {
      throw new TaviAudioError('TimelineMixer: Output path must be a non-empty string', {
        code: 'AUDIO_MIX_FAILED',
        stage: 'audio_mixing',
        details: { outputPath }
      });
    }

    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    // Filter valid existing segment audio files
    const validSegments = (segments || []).filter(s => {
      const p = s?.alignedAudioPath || s?.audioPath;
      return p && typeof p === 'string' && fs.existsSync(p);
    });

    const totalDuration = options.totalDuration || (validSegments.length > 0
      ? Math.max(...validSegments.map(s => s.endTime || s.end || 0))
      : 10);

    // Empty segments input: Generate silent track
    if (!segments || segments.length === 0) {
      return this.generateSilentTrack(outputPath, totalDuration);
    }

    if (validSegments.length === 0) {
      throw new TaviAudioError('Audio mixing failed: None of the provided segment audio files exist on disk.', {
        code: 'AUDIO_MIX_FAILED',
        stage: 'audio_mixing',
        details: { segmentCount: segments.length }
      });
    }

    // Sort segments chronologically, using cue index as deterministic tie-breaker
    const sorted = [...validSegments].sort((a, b) => {
      const startA = a.startTime !== undefined ? a.startTime : a.start;
      const startB = b.startTime !== undefined ? b.startTime : b.start;
      if (startA !== startB) return startA - startB;
      const idxA = a.cueIndex ?? a.index ?? 0;
      const idxB = b.cueIndex ?? b.index ?? 0;
      return idxA - idxB;
    });

    // If segment count exceeds maxBatchInputs, perform hierarchical batch mixing
    if (sorted.length > this.maxBatchInputs) {
      return await this.hierarchicalBatchMix(sorted, outputPath, totalDuration, options);
    }

    return await this.singlePassMix(sorted, outputPath, totalDuration, options);
  }

  /**
   * Single pass mixing for up to maxBatchInputs segments.
   * Direct process invocation using spawnSync with args array to avoid shell pipe and length limitations.
   * 
   * @param {Array<Record<string, any>>} segments 
   * @param {string} outputPath 
   * @param {number} totalDuration 
   * @param {Record<string, any>} [options={}] 
   * @returns {Promise<string>}
   */
  async singlePassMix(segments, outputPath, totalDuration, options = {}) {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    /** @type {string[]} */
    const inputArgs = [];
    /** @type {string[]} */
    const filterParts = [];
    /** @type {string[]} */
    const mixLabels = [];

    segments.forEach((seg, idx) => {
      const audioPath = seg.alignedAudioPath || seg.audioPath;
      inputArgs.push('-i', audioPath);
      const startSec = seg.startTime !== undefined ? seg.startTime : seg.start;
      const delayMs = Math.round(Math.max(0, startSec) * 1000);

      // Normalize sample rate (aresample), format to 16-bit PCM stereo (aformat), and delay (adelay)
      filterParts.push(`[${idx}:a]aresample=${this.sampleRate},aformat=sample_fmts=s16:channel_layouts=stereo,adelay=${delayMs}|${delayMs}[delayed${idx}]`);
      mixLabels.push(`[delayed${idx}]`);
    });

    const numInputs = mixLabels.length;

    const padFilter = (totalDuration && totalDuration > 0) ? ',apad' : '';

    // Optional ambient background audio
    /** @type {string[]} */
    const ambientArgs = [];
    if (options.ambientAudioPath && fs.existsSync(options.ambientAudioPath)) {
      const ambientIdx = segments.length;
      ambientArgs.push('-i', options.ambientAudioPath);
      const duckDb = options.ambientDuckingDb ?? -12;
      const useSidechain = options.sidechainDucking ?? options.useSidechain ?? false;

      // Normalize ambient track to stereo and matching sample rate
      filterParts.push(`[${ambientIdx}:a]aresample=${this.sampleRate},aformat=sample_fmts=s16:channel_layouts=stereo[ambientNorm]`);
      filterParts.push(`${mixLabels.join('')}amix=inputs=${numInputs}:duration=longest:dropout_transition=0[voiceMix]`);

      if (useSidechain) {
        // Dynamic sidechain ducking: threshold=0.05, ratio=4, attack=20ms, release=250ms
        filterParts.push(`[ambientNorm][voiceMix]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=250[duckedAmbient]`);
        filterParts.push(`[voiceMix][duckedAmbient]amix=inputs=2:duration=longest:dropout_transition=0,dynaudnorm=f=150:g=15${padFilter}[outa]`);
      } else {
        // Fixed dB volume ducking
        filterParts.push(`[ambientNorm]volume=${duckDb}dB[duckedAmbient]`);
        filterParts.push(`[voiceMix][duckedAmbient]amix=inputs=2:duration=longest:dropout_transition=0,dynaudnorm=f=150:g=15${padFilter}[outa]`);
      }
    } else {
      filterParts.push(`${mixLabels.join('')}amix=inputs=${numInputs}:duration=longest:dropout_transition=0,dynaudnorm=f=150:g=15${padFilter}[outa]`);
    }

    const filterComplexStr = filterParts.join(';');

    const durArgs = totalDuration ? ['-t', Math.max(0.05, totalDuration).toFixed(3)] : [];
    const isWav = outputPath.toLowerCase().endsWith('.wav');
    const codecArgs = isWav
      ? ['-c:a', 'pcm_s16le', '-ar', String(this.sampleRate), '-ac', '2']
      : ['-c:a', 'aac', '-b:a', this.audioBitrate, '-ar', String(this.sampleRate), '-ac', '2', '-movflags', '+faststart'];

    const args = [
      '-y',
      ...inputArgs,
      ...ambientArgs,
      '-filter_complex', filterComplexStr,
      '-map', '[outa]',
      ...durArgs,
      ...codecArgs,
      outputPath
    ];

    const proc = spawnSync(this.ffmpegBin, args, { encoding: 'utf8', windowsHide: true });
    if (proc.status !== 0 || proc.error) {
      if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
      }
      const stderr = (proc.stderr || proc.error?.message || 'Unknown error').trim();
      throw new TaviAudioError(`Audio mixing failed with exit code ${proc.status}: ${stderr}`, {
        code: 'AUDIO_MIX_FAILED',
        stage: 'audio_mixing',
        cause: proc.error,
        details: { exitCode: proc.status, stderr, numInputs }
      });
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new TaviAudioError(`Audio mixing failed: output file is missing or 0 bytes (${outputPath})`, {
        code: 'AUDIO_MIX_FAILED',
        stage: 'audio_mixing',
        details: { outputPath }
      });
    }

    // Final structural audio validation
    const validation = validateGeneratedAudio(outputPath, {
      minDuration: 0.05,
      expectedCodec: isWav ? 'pcm' : 'aac',
      decodeTest: true,
      throwOnError: true
    });

    return outputPath;
  }

  /**
   * Hierarchical batch mixing for 100+ or 1000+ segments to avoid command-line buffer overflows.
   * 
   * @param {Array<Record<string, any>>} segments 
   * @param {string} outputPath 
   * @param {number} totalDuration 
   * @param {Record<string, any>} [options={}] 
   * @returns {Promise<string>}
   */
  async hierarchicalBatchMix(segments, outputPath, totalDuration, options = {}) {
    const dir = path.dirname(outputPath);
    const intermediateTracks = [];
    const batchSize = this.maxBatchInputs;

    try {
      for (let i = 0; i < segments.length; i += batchSize) {
        const chunk = segments.slice(i, i + batchSize);
        const intermediatePath = path.join(dir, `submix_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}.wav`);
        await this.singlePassMix(chunk, intermediatePath, totalDuration, {});
        intermediateTracks.push({
          startTime: 0,
          endTime: totalDuration,
          alignedAudioPath: intermediatePath
        });
      }

      if (intermediateTracks.length > this.maxBatchInputs) {
        return await this.hierarchicalBatchMix(intermediateTracks, outputPath, totalDuration, options);
      }

      return await this.singlePassMix(intermediateTracks, outputPath, totalDuration, options);
    } finally {
      // Clean temporary submix files safely
      for (const track of intermediateTracks) {
        if (track.alignedAudioPath && fs.existsSync(track.alignedAudioPath)) {
          try { fs.unlinkSync(track.alignedAudioPath); } catch (_) {}
        }
      }
    }
  }

  /**
   * Generates a valid silent audio track.
   * 
   * @param {string} outputPath 
   * @param {number} duration 
   * @returns {string}
   */
  generateSilentTrack(outputPath, duration) {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const durFixed = Math.max(0.1, duration || 5).toFixed(3);
    const isWav = outputPath.toLowerCase().endsWith('.wav');
    const codecArgs = isWav
      ? ['-c:a', 'pcm_s16le', '-ar', String(this.sampleRate), '-ac', '2']
      : ['-c:a', 'aac', '-b:a', this.audioBitrate, '-ar', String(this.sampleRate), '-ac', '2', '-movflags', '+faststart'];

    const args = [
      '-y',
      '-f', 'lavfi',
      '-i', `anullsrc=channel_layout=stereo:sample_rate=${this.sampleRate}`,
      '-t', durFixed,
      ...codecArgs,
      outputPath
    ];

    const proc = spawnSync(this.ffmpegBin, args, { encoding: 'utf8', windowsHide: true });
    if (proc.status !== 0 || proc.error) {
      if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
      }
      throw new TaviAudioError(`Failed to generate silent audio track (exit code ${proc.status}): ${proc.stderr || proc.error?.message}`, {
        code: 'AUDIO_MIX_FAILED',
        stage: 'silent_track_generation',
        details: { exitCode: proc.status, outputPath, duration }
      });
    }

    const validation = validateGeneratedAudio(outputPath, { decodeTest: true, throwOnError: true });
    return outputPath;
  }
}

export default TimelineMixer;
