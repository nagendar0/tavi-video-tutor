import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { getFFmpegBinaryPath } from '../extractAudio.js';
import { validateGeneratedAudio } from '../validateAudio.js';

/**
 * Universal Multi-Track Audio Timeline Mixer.
 * 
 * Mixes arbitrary numbers of speaker segments into a single cohesive browser audio track (.m4a AAC).
 * 
 * Features:
 * - Deterministic multi-speaker overlap mixing.
 * - Dynamic audio normalization (dynaudnorm) to prevent clipping and balance levels.
 * - Robust process invocation via spawnSync with arguments array (no Windows shell pipe collisions).
 * - Hierarchical batch mixing for very large segment counts (> 60 segments).
 * - Comprehensive output audio validation prior to completion.
 * - Zero dummy/fake 36-byte fallbacks: failure captures exact stderr and aborts cleanly.
 */
export class TimelineMixer {
  constructor(options = {}) {
    this.ffmpegBin = options.ffmpegBin || getFFmpegBinaryPath();
    this.audioBitrate = options.audioBitrate || '128k';
    this.sampleRate = options.sampleRate || 44100;
    this.maxBatchInputs = options.maxBatchInputs || 32;
  }

  /**
   * Mix all aligned speaker segments into the final output M4A track.
   * 
   * @param {Array<Object>} segments - Array of segments with { startTime, endTime, alignedAudioPath }
   * @param {string} outputPath - Destination .m4a file path
   * @param {Object} [options]
   * @param {number} [options.totalDuration] - Target duration in seconds
   * @param {string} [options.ambientAudioPath] - Optional background music/ambient track
   * @param {number} [options.ambientDuckingDb] - Ducking in dB (e.g. -12)
   * @returns {Promise<string>} outputPath
   */
  async mix(segments, outputPath, options = {}) {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const validSegments = (segments || []).filter(s => s && (s.alignedAudioPath || s.audioPath) && fs.existsSync(s.alignedAudioPath || s.audioPath));
    const totalDuration = options.totalDuration || (validSegments.length > 0 ? Math.max(...validSegments.map(s => s.endTime || s.end || 0)) : 10);

    // Empty segments input: Generate silent track
    if (!segments || segments.length === 0) {
      return this.generateSilentTrack(outputPath, totalDuration);
    }

    if (validSegments.length === 0) {
      throw new Error('Audio mixing failed: None of the provided segment audio files exist on disk.');
    }

    // Sort segments chronologically
    const sorted = [...validSegments].sort((a, b) => (a.startTime || a.start) - (b.startTime || b.start));

    // If segment count exceeds maxBatchInputs, perform hierarchical batch mixing
    if (sorted.length > this.maxBatchInputs) {
      return await this.hierarchicalBatchMix(sorted, outputPath, totalDuration, options);
    }

    return await this.singlePassMix(sorted, outputPath, totalDuration, options);
  }

  /**
   * Single pass mixing for up to maxBatchInputs segments.
   * Direct process invocation using spawnSync with args array to avoid shell pipe and length limitations.
   */
  async singlePassMix(segments, outputPath, totalDuration, options = {}) {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const inputArgs = [];
    const filterParts = [];
    const mixLabels = [];

    segments.forEach((seg, idx) => {
      const audioPath = seg.alignedAudioPath || seg.audioPath;
      inputArgs.push('-i', audioPath);
      const startSec = seg.startTime !== undefined ? seg.startTime : seg.start;
      const delayMs = Math.round(Math.max(0, startSec) * 1000);

      // Resample to uniform sample rate and apply timestamp delay
      filterParts.push(`[${idx}:a]aresample=${this.sampleRate},adelay=${delayMs}|${delayMs}[delayed${idx}]`);
      mixLabels.push(`[delayed${idx}]`);
    });

    const numInputs = mixLabels.length;

    // Optional ambient background audio
    const ambientArgs = [];
    if (options.ambientAudioPath && fs.existsSync(options.ambientAudioPath)) {
      const ambientIdx = segments.length;
      ambientArgs.push('-i', options.ambientAudioPath);
      const duckDb = options.ambientDuckingDb || -12;
      filterParts.push(`[${ambientIdx}:a]volume=${duckDb}dB,aresample=${this.sampleRate}[ambient]`);
      filterParts.push(`${mixLabels.join('')}amix=inputs=${numInputs}:duration=longest:dropout_transition=0[voiceMix]`);
      filterParts.push(`[voiceMix][ambient]amix=inputs=2:duration=longest:dropout_transition=0,dynaudnorm=f=150:g=15[outa]`);
    } else {
      filterParts.push(`${mixLabels.join('')}amix=inputs=${numInputs}:duration=longest:dropout_transition=0,dynaudnorm=f=150:g=15[outa]`);
    }

    const filterComplexStr = filterParts.join(';');

    const durArgs = totalDuration ? ['-t', Math.max(0.5, totalDuration).toFixed(3)] : [];
    const isWav = outputPath.toLowerCase().endsWith('.wav');
    const codecArgs = isWav
      ? ['-c:a', 'pcm_s16le', '-ar', String(this.sampleRate), '-ac', '2']
      : ['-c:a', 'aac', '-b:a', this.audioBitrate, '-ar', String(this.sampleRate), '-ac', '2'];

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
      const stderr = proc.stderr || proc.error?.message || 'Unknown error';
      throw new Error(`Audio mixing failed with exit code ${proc.status}: ${stderr}`);
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error(`Audio mixing failed: output file is missing or 0 bytes (${outputPath})`);
    }

    // Final audio validation
    const validation = validateGeneratedAudio(outputPath, {
      minDuration: 0.05,
      expectedCodec: isWav ? 'pcm' : 'aac',
      decodeTest: true
    });

    if (!validation.valid) {
      if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
      }
      throw new Error(`Audio mixing failed validation (${validation.code}): ${validation.message}`);
    }

    return outputPath;
  }

  /**
   * Hierarchical batch mixing for 100+ or 1000+ segments to avoid command-line buffer overflows.
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
      // Clean temporary submix files
      for (const track of intermediateTracks) {
        if (track.alignedAudioPath && fs.existsSync(track.alignedAudioPath)) {
          try { fs.unlinkSync(track.alignedAudioPath); } catch (_) {}
        }
      }
    }
  }

  generateSilentTrack(outputPath, duration) {
    const dir = path.dirname(outputPath);
    fs.mkdirSync(dir, { recursive: true });

    const durFixed = Math.max(0.5, duration || 5).toFixed(3);
    const isWav = outputPath.toLowerCase().endsWith('.wav');
    const codecArgs = isWav
      ? ['-c:a', 'pcm_s16le', '-ar', String(this.sampleRate), '-ac', '2']
      : ['-c:a', 'aac', '-b:a', this.audioBitrate, '-ar', String(this.sampleRate), '-ac', '2'];

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
      throw new Error(`Failed to generate silent audio track (exit code ${proc.status}): ${proc.stderr || proc.error?.message}`);
    }

    const validation = validateGeneratedAudio(outputPath, { decodeTest: true });
    if (!validation.valid) {
      if (fs.existsSync(outputPath)) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
      }
      throw new Error(`Silent track validation failed (${validation.code}): ${validation.message}`);
    }

    return outputPath;
  }
}

export default TimelineMixer;
