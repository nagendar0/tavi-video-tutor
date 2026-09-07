/**
 * Speaker Overlap Graph.
 * 
 * Constructs an undirected conflict graph G = (V, E) where:
 * - V = Set of detected speakers (spk_000001 ... spk_N)
 * - E = Conflict edges connecting speakers who speak simultaneously (overlapping intervals)
 * 
 * Provides adjacency, vertex degrees, and interval overlap metrics for graph coloring.
 */
export class SpeakerOverlapGraph {
  constructor() {
    this.nodes = new Set();
    // Map<speakerId, Set<speakerId>>
    this.adjacency = new Map();
    // Map<"u:v", { overlapCount: number, totalOverlapSec: number }>
    this.edgeWeights = new Map();
  }

  /**
   * Add a speaker node to the graph.
   * @param {string} speakerId 
   */
  addNode(speakerId) {
    this.nodes.add(speakerId);
    if (!this.adjacency.has(speakerId)) {
      this.adjacency.set(speakerId, new Set());
    }
  }

  /**
   * Add a conflict edge between two speakers with overlap metrics.
   * @param {string} spkA 
   * @param {string} spkB 
   * @param {number} [overlapSec=0] 
   */
  addEdge(spkA, spkB, overlapSec = 0) {
    if (spkA === spkB) return;
    this.addNode(spkA);
    this.addNode(spkB);

    this.adjacency.get(spkA).add(spkB);
    this.adjacency.get(spkB).add(spkA);

    const edgeKey = [spkA, spkB].sort().join('::');
    const existing = this.edgeWeights.get(edgeKey) || { overlapCount: 0, totalOverlapSec: 0 };
    this.edgeWeights.set(edgeKey, {
      overlapCount: existing.overlapCount + 1,
      totalOverlapSec: Number((existing.totalOverlapSec + overlapSec).toFixed(3))
    });
  }

  /**
   * Build the graph directly from an array of diarized segments.
   * @param {Array<Object>} segments 
   */
  buildFromSegments(segments = []) {
    this.clear();

    // 1. Add all unique speakers as nodes
    for (const seg of segments) {
      if (seg.speakerId) {
        this.addNode(seg.speakerId);
      }
    }

    // 2. Sort segments by start time for sweep-line overlap detection
    const sorted = [...segments].sort((a, b) => {
      const startA = a.startTime !== undefined ? a.startTime : a.start;
      const startB = b.startTime !== undefined ? b.startTime : b.start;
      return startA - startB;
    });

    // 3. Detect overlaps using sweep-line window
    for (let i = 0; i < sorted.length; i++) {
      const segA = sorted[i];
      const startA = segA.startTime !== undefined ? segA.startTime : segA.start;
      const endA = segA.endTime !== undefined ? segA.endTime : segA.end;

      for (let j = i + 1; j < sorted.length; j++) {
        const segB = sorted[j];
        const startB = segB.startTime !== undefined ? segB.startTime : segB.start;
        const endB = segB.endTime !== undefined ? segB.endTime : segB.end;

        // If segB starts after segA ends, subsequent segments also start after segA
        if (startB >= endA) {
          break;
        }

        // Check different speakers overlapping
        if (segA.speakerId !== segB.speakerId) {
          const overlapSec = Math.min(endA, endB) - Math.max(startA, startB);
          if (overlapSec > 0.05) { // min 50ms overlap
            this.addEdge(segA.speakerId, segB.speakerId, overlapSec);
          }
        }
      }
    }
  }

  getNeighbors(speakerId) {
    return Array.from(this.adjacency.get(speakerId) || []);
  }

  getDegree(speakerId) {
    return this.adjacency.get(speakerId)?.size || 0;
  }

  getNodeCount() {
    return this.nodes.size;
  }

  getEdgeCount() {
    return this.edgeWeights.size;
  }

  getEdgeWeight(spkA, spkB) {
    const edgeKey = [spkA, spkB].sort().join('::');
    return this.edgeWeights.get(edgeKey) || { overlapCount: 0, totalOverlapSec: 0 };
  }

  areConnected(spkA, spkB) {
    return this.adjacency.get(spkA)?.has(spkB) || false;
  }

  clear() {
    this.nodes.clear();
    this.adjacency.clear();
    this.edgeWeights.clear();
  }
}

export default SpeakerOverlapGraph;
