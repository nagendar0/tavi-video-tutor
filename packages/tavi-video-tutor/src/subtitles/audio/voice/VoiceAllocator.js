import { SpeakerOverlapGraph } from './SpeakerOverlapGraph.js';
import { VoicePool } from './VoicePool.js';

/**
 * Universal Graph-Coloring Voice Allocator.
 * 
 * Solves the resource allocation problem for arbitrary N speakers (1, 2, ..., 1000+)
 * across any target language voice pool.
 * 
 * Invariants:
 * 1. Overlapping speakers are prioritized for distinct voices.
 * 2. Non-overlapping speakers safely share voice slots when N > voice pool.
 * 3. Color assignment is language-agnostic, ensuring cross-language voice consistency (Phase 10).
 * 4. Deterministic: identical speaker graph always yields identical voice assignments.
 * 5. Fallback behavior when overlap exceeds voice pool: applies deterministic acoustic pitch shift
 *    and records explicit warning diagnostics (never silently collides).
 */
export class VoiceAllocator {
  constructor(options = {}) {
    this.voicePool = options.voicePool || new VoicePool(options);
    this.options = options;
  }

  /**
   * Allocate target-language voices for detected speakers based on their overlap graph.
   * 
   * @param {Array<Object>} speakers - Array of SpeakerIdentity objects
   * @param {Array<Object>} segments - Array of diarized SpeakerSegment objects
   * @param {string} targetLanguage - ISO language code
   * @param {Object} [existingAssignments] - Optional pre-cached voice assignments to preserve
   * @returns {{
   *   assignments: Object,
   *   colorMap: Object,
   *   chromaticNumber: number,
   *   conflicts: number,
   *   diagnostics: Object
   * }}
   */
  allocate({
    speakers = [],
    segments = [],
    targetLanguage = 'en',
    existingAssignments = null
  }) {
    const lang = String(targetLanguage).toLowerCase();
    const speakerIds = speakers.map(s => s.speakerId);

    // Fast path: 0 or 1 speaker
    if (speakerIds.length <= 1) {
      const spkId = speakerIds[0] || 'spk_000001';
      const singleVoice = this.voicePool.getVoicesForLanguage(lang, 1)[0];
      return {
        assignments: { [spkId]: singleVoice },
        colorMap: { [spkId]: 0 },
        chromaticNumber: speakerIds.length,
        conflicts: 0,
        diagnostics: {
          strategy: 'single-speaker-fast-path',
          totalSpeakers: speakerIds.length,
          availableVoices: 1,
          warnings: []
        }
      };
    }

    // 1. Build speaker overlap graph
    const graph = new SpeakerOverlapGraph();
    graph.buildFromSegments(segments);

    // Ensure all speaker nodes exist in graph even if they had no segments
    for (const spkId of speakerIds) {
      graph.addNode(spkId);
    }

    // 2. Vertex Ordering: Welch-Powell ordering (descending by degree, tie-broken by speaker ID)
    const sortedSpeakers = [...speakerIds].sort((a, b) => {
      const degDiff = graph.getDegree(b) - graph.getDegree(a);
      if (degDiff !== 0) return degDiff;
      return a.localeCompare(b);
    });

    // 3. Graph Coloring: Assign minimal color index not used by any neighbor
    const colorMap = {};
    let maxColorUsed = 0;

    for (const spkId of sortedSpeakers) {
      // If we have an existing color from pre-cached assignments, attempt to preserve it
      if (existingAssignments && existingAssignments[spkId] && typeof existingAssignments[spkId].colorIndex === 'number') {
        colorMap[spkId] = existingAssignments[spkId].colorIndex;
        if (colorMap[spkId] > maxColorUsed) maxColorUsed = colorMap[spkId];
        continue;
      }

      const neighbors = graph.getNeighbors(spkId);
      const usedColorsByNeighbors = new Set();

      for (const n of neighbors) {
        if (colorMap[n] !== undefined) {
          usedColorsByNeighbors.add(colorMap[n]);
        }
      }

      // Find lowest available non-negative color index
      let assignedColor = 0;
      while (usedColorsByNeighbors.has(assignedColor)) {
        assignedColor++;
      }

      colorMap[spkId] = assignedColor;
      if (assignedColor > maxColorUsed) {
        maxColorUsed = assignedColor;
      }
    }

    const chromaticNumber = maxColorUsed + 1;

    // 4. Retrieve language voice pool sized to accommodate chromatic requirement
    const pool = this.voicePool.getVoicesForLanguage(lang, chromaticNumber);
    const poolSize = pool.length;

    // 5. Map color index to concrete voice
    const assignments = {};
    const warnings = [];
    let conflicts = 0;

    for (const spkId of speakerIds) {
      const colorIdx = colorMap[spkId];
      const baseVoiceIdx = colorIdx % poolSize;
      const baseVoice = pool[baseVoiceIdx];

      // If color index exceeded voice pool, create deterministic acoustic modification
      if (colorIdx >= poolSize) {
        conflicts++;
        const cycle = Math.floor(colorIdx / poolSize);
        const pitchShift = (cycle % 2 === 1 ? 1 : -1) * (15 + (cycle * 8));
        const rateShift = Number((1.0 + (cycle * 0.04)).toFixed(2));

        assignments[spkId] = {
          voiceId: `${baseVoice.voiceId}_mod${cycle}`,
          name: `${baseVoice.name} (Pitch ${pitchShift > 0 ? '+' : ''}${pitchShift}%)`,
          gender: baseVoice.gender,
          pitchOffset: baseVoice.pitchOffset + pitchShift,
          rateOffset: Number((baseVoice.rateOffset * rateShift).toFixed(2)),
          colorIndex: colorIdx,
          fallbackModified: true
        };

        warnings.push(`Speaker "${spkId}" overlap concurrency exceeded base pool. Applied acoustic shift (pitch ${pitchShift}%).`);
      } else {
        assignments[spkId] = {
          ...baseVoice,
          colorIndex: colorIdx,
          fallbackModified: false
        };
      }
    }

    return {
      assignments,
      colorMap,
      chromaticNumber,
      conflicts,
      diagnostics: {
        strategy: 'welch-powell-graph-coloring',
        totalSpeakers: speakerIds.length,
        edgesInGraph: graph.getEdgeCount(),
        chromaticNumber,
        availableVoicesInPool: poolSize,
        conflictsCount: conflicts,
        warnings
      }
    };
  }
}

export default VoiceAllocator;
