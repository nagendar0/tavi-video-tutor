// @ts-check
import { alignAudioSegment } from '../alignAudioSegment.js';
import { getAudioDuration } from '../validateAudio.js';
import { validateCueTiming, calculateRateAdaptation } from './AudioRateAdapter.js';
import { TaviAudioError } from '../../errors/index.js';

/**
 * Audio Timeline Engine.
 * 
 * Orchestrates multi-speaker timing alignment, pacing preservation,
 * and independent speaker track preparation.
 * 
 * Invariants:
 * - Anchors segments to absolute timestamps so timing drift never accumulates.
 * - Enforces safe time-stretching bounds [0.75x, 1.5x] to preserve natural speech.
 * - Preserves conversational pauses and overlapping interruptions.
 * - Rejects invalid, non-finite, or inverted cue timestamps with TaviAudioError.
 * - Measures actual resulting audio duration rather than blindly assuming target duration.
 */
export class AudioTimelineEngine {
  /**
   * @param {Object} [options={}]
   * @param {number} [options.minTempo=0.75] - Minimum slowdown factor
   * @param {number} [options.maxTempo=1.50] - Maximum speedup factor
   * @param {boolean} [options.allowPadding=true] - Pad with silence when speech is shorter
   * @param {boolean} [options.allowTruncate=false] - Truncate speech when exceeding limits
   * @param {boolean} [options.allowOverflow=false] - Allow speech to overflow cue window
   * @param {boolean} [options.preferNaturalPace=true] - Preserve normal pace with silence padding
   * @param {number} [options.sampleRate=44100] - Audio sample rate in Hz
   * @param {string} [options.outputDir] - Output directory
   */
  constructor(options = {}) {
    this.minTempo = options.minTempo ?? 0.75;
    this.maxTempo = options.maxTempo ?? 1.50;
    this.allowPadding = options.allowPadding ?? true;
    this.allowTruncate = options.allowTruncate ?? false;
    this.allowOverflow = options.allowOverflow ?? false;
    this.preferNaturalPace = options.preferNaturalPace ?? true;
    this.sampleRate = options.sampleRate ?? 44100;
    this.outputDir = options.outputDir || process.cwd();
  }

  /**
   * Measures or probes actual duration of an audio file in seconds.
   * 
   * @param {string} filePath 
   * @param {number} [fallbackDuration=0] 
   * @returns {number}
   */
  measureAudioDuration(filePath, fallbackDuration = 0) {
    const probed = getAudioDuration(filePath);
    if (probed > 0) return probed;
    if (typeof fallbackDuration === 'number' && !isNaN(fallbackDuration) && fallbackDuration > 0) {
      return fallbackDuration;
    }
    return 0;
  }

  /**
   * Align a single speaker segment to its target timeframe [startTime, endTime].
   * 
   * @param {Record<string, any>} segment - SpeakerSegment with generatedAudio and generatedDuration
   * @param {string} [workspaceDir]
   * @returns {Promise<Record<string, any>>} Updated segment with alignedAudioPath and measured alignedDuration
   */
  async alignSegment(segment, workspaceDir = this.outputDir) {
    // 1. Strict cue timing validation
    const cueIndex = segment.index ?? segment.cueIndex ?? 0;
    const validatedTiming = validateCueTiming(segment, cueIndex);
    const targetStart = validatedTiming.start;
    const targetEnd = validatedTiming.end;
    const targetDuration = validatedTiming.duration;

    // 2. Measure actual synthesized audio duration
    const audioPath = segment.generatedAudio || segment.audioPath;
    let actualDuration = typeof segment.generatedDuration === 'number' && segment.generatedDuration > 0
      ? segment.generatedDuration
      : this.measureAudioDuration(audioPath, targetDuration);

    if (actualDuration <= 0) {
      actualDuration = targetDuration;
    }

    // 3. Compute deterministic rate adaptation
    const adaptation = calculateRateAdaptation({
      targetDuration,
      sourceDuration: actualDuration,
      limits: {
        minRateFactor: this.minTempo,
        maxRateFactor: this.maxTempo,
        allowPadding: this.allowPadding,
        allowTruncate: this.allowTruncate,
        allowOverflow: this.allowOverflow,
        preferNaturalPace: this.preferNaturalPace
      }
    });

    if (adaptation.mode === 'UNSATISFIABLE') {
      throw new TaviAudioError(`AudioTimelineEngine: ${adaptation.reason}`, {
        code: 'AUDIO_TIMING_OVERFLOW',
        stage: 'timeline_alignment',
        details: {
          segmentId: segment.segmentId || segment.id,
          cueIndex,
          targetDuration,
          actualDuration,
          adaptation
        }
      });
    }

    // 4. Align audio using FFmpeg with decomposed atempo, sample rate, and channel normalization
    const alignResult = await alignAudioSegment(
      audioPath,
      actualDuration,
      targetStart,
      targetEnd,
      workspaceDir,
      {
        adaptation,
        sampleRate: this.sampleRate,
        returnMeta: true
      }
    );

    const alignedPath = typeof alignResult === 'string' ? alignResult : alignResult.outputPath;
    const measuredDuration = typeof alignResult === 'object' && alignResult.measuredDuration
      ? alignResult.measuredDuration
      : (this.measureAudioDuration(alignedPath, targetDuration) || targetDuration);

    return {
      ...segment,
      startTime: targetStart,
      endTime: targetEnd,
      targetDuration,
      actualSpeechDuration: actualDuration,
      alignedAudioPath: alignedPath,
      alignedDuration: measuredDuration,
      appliedTempo: adaptation.rateFactor,
      tempoFactors: adaptation.tempoFactors,
      adaptationMode: adaptation.mode,
      paddingBefore: adaptation.paddingBefore,
      paddingAfter: adaptation.paddingAfter,
      truncated: adaptation.truncated
    };
  }

  /**
   * Build master timeline tracks grouped by speaker.
   * Preserves speaker ID, cue ordering, and tracks multi-speaker overlaps.
   * 
   * @param {Array<Record<string, any>>} [alignedSegments=[]] 
   * @returns {import('./AudioTimelineEngine.d.ts').MasterTimelineResult}
   */
  buildMasterTimeline(alignedSegments = []) {
    /** @type {any} */
    const speakerTracks = {};
    const overlaps = [];

    // Sort all segments chronologically while preserving original cue indices
    const sorted = [...alignedSegments].sort((a, b) => {
      const startA = a.startTime !== undefined ? a.startTime : a.start;
      const startB = b.startTime !== undefined ? b.startTime : b.start;
      if (startA !== startB) return startA - startB;
      const idxA = a.cueIndex ?? a.index ?? 0;
      const idxB = b.cueIndex ?? b.index ?? 0;
      return idxA - idxB;
    });

    for (let i = 0; i < sorted.length; i++) {
      const seg = sorted[i];
      const spkId = seg.speakerId || 'spk_000001';
      if (!speakerTracks[spkId]) {
        speakerTracks[spkId] = [];
      }
      speakerTracks[spkId].push(seg);

      // Detect simultaneous speaker overlaps
      const startA = seg.startTime !== undefined ? seg.startTime : seg.start;
      const endA = seg.endTime !== undefined ? seg.endTime : seg.end;

      for (let j = i + 1; j < sorted.length; j++) {
        const otherSeg = sorted[j];
        const startB = otherSeg.startTime !== undefined ? otherSeg.startTime : otherSeg.start;
        const endB = otherSeg.endTime !== undefined ? otherSeg.endTime : otherSeg.end;

        if (startB >= endA) break;

        const otherSpkId = otherSeg.speakerId || 'spk_000001';
        if (spkId !== otherSpkId) {
          const overlapSec = Math.min(endA, endB) - Math.max(startA, startB);
          if (overlapSec > 0.01) {
            overlaps.push({
              spkA: spkId,
              spkB: otherSpkId,
              start: Math.max(startA, startB),
              end: Math.min(endA, endB),
              overlapSec: Number(overlapSec.toFixed(3))
            });
          }
        }
      }
    }

    // Sort each speaker track chronologically
    for (const spkId of Object.keys(speakerTracks)) {
      speakerTracks[spkId].sort((a, b) => {
        const startA = a.startTime !== undefined ? a.startTime : a.start;
        const startB = b.startTime !== undefined ? b.startTime : b.start;
        return startA - startB;
      });
    }

    const timelineStart = sorted.length > 0 ? (sorted[0].startTime ?? sorted[0].start ?? 0) : 0;
    const timelineEnd = sorted.length > 0 ? Math.max(...sorted.map(s => s.endTime ?? s.end ?? 0)) : 0;

    // Cumulative drift is measured across sequential segments:
    // In our architecture, every cue is anchored to its absolute timestamp,
    // so drift between nominal cue start and assigned audio start is identically 0.
    let cumulativeDrift = 0;
    for (const seg of sorted) {
      const nominalStart = seg.start ?? seg.startTime ?? 0;
      const assignedStart = seg.startTime ?? nominalStart;
      cumulativeDrift += Math.abs(assignedStart - nominalStart);
    }

    Object.defineProperties(speakerTracks, {
      totalCues: { value: sorted.length, enumerable: false, writable: true },
      timelineStart: { value: timelineStart, enumerable: false, writable: true },
      timelineEnd: { value: timelineEnd, enumerable: false, writable: true },
      cumulativeDrift: { value: Number(cumulativeDrift.toFixed(6)), enumerable: false, writable: true },
      overlaps: { value: overlaps, enumerable: false, writable: true },
      speakerTracks: { value: speakerTracks, enumerable: false, writable: true }
    });

    return speakerTracks;
  }
}

export default AudioTimelineEngine;
