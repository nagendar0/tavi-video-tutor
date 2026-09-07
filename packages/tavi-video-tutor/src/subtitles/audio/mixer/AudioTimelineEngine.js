import { alignAudioSegment } from '../alignAudioSegment.js';

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
 */
export class AudioTimelineEngine {
  constructor(options = {}) {
    this.minTempo = options.minTempo || 0.75;
    this.maxTempo = options.maxTempo || 1.5;
    this.outputDir = options.outputDir || process.cwd();
  }

  /**
   * Align a single speaker segment to its target timeframe [startTime, endTime].
   * 
   * @param {Object} segment - SpeakerSegment with generatedAudio and generatedDuration
   * @param {string} [workspaceDir]
   * @returns {Promise<Object>} Updated segment with alignedAudioPath
   */
  async alignSegment(segment, workspaceDir = this.outputDir) {
    const targetStart = segment.startTime !== undefined ? segment.startTime : segment.start;
    const targetEnd = segment.endTime !== undefined ? segment.endTime : segment.end;
    const targetDuration = Math.max(0.1, targetEnd - targetStart);

    const actualDuration = segment.generatedDuration || targetDuration;
    const rawRatio = actualDuration / targetDuration;
    const boundedTempo = Math.min(this.maxTempo, Math.max(this.minTempo, rawRatio));

    // Align audio using time stretching + pad/trim
    const alignedPath = await alignAudioSegment(
      segment.generatedAudio,
      actualDuration,
      targetStart,
      targetEnd,
      workspaceDir
    );

    return {
      ...segment,
      alignedAudioPath: alignedPath,
      alignedDuration: targetDuration,
      appliedTempo: Number(boundedTempo.toFixed(3))
    };
  }

  /**
   * Build master timeline tracks grouped by speaker.
   * 
   * @param {Array<Object>} alignedSegments 
   * @returns {Object} Map<speakerId, Array<Object>>
   */
  buildMasterTimeline(alignedSegments = []) {
    const speakerTracks = {};

    for (const seg of alignedSegments) {
      const spkId = seg.speakerId || 'spk_000001';
      if (!speakerTracks[spkId]) {
        speakerTracks[spkId] = [];
      }
      speakerTracks[spkId].push(seg);
    }

    // Sort each track chronologically
    for (const spkId of Object.keys(speakerTracks)) {
      speakerTracks[spkId].sort((a, b) => a.startTime - b.startTime);
    }

    return speakerTracks;
  }
}

export default AudioTimelineEngine;
