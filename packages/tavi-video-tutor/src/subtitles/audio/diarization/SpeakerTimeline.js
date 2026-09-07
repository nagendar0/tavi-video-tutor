/**
 * Independent Multi-Track Speaker Timeline.
 * 
 * Maintains separate, parallel timelines for each detected speaker (spk_000001 ... spk_N).
 * Preserves true overlapping speech, interruptions, and turn-taking without flattening into a single sequential track.
 */
export class SpeakerTimeline {
  constructor() {
    // Map<speakerId, Array<SpeakerSegment>>
    this.tracks = new Map();
  }

  /**
   * Add a segment to a specific speaker's track.
   * @param {Object} segment 
   */
  addSegment(segment) {
    if (!segment || !segment.speakerId) {
      throw new Error('SpeakerTimeline: segment must contain a valid speakerId.');
    }
    const spkId = segment.speakerId;
    if (!this.tracks.has(spkId)) {
      this.tracks.set(spkId, []);
    }
    const track = this.tracks.get(spkId);
    track.push(segment);
    // Keep track sorted by start time
    track.sort((a, b) => (a.startTime || a.start) - (b.startTime || b.start));
  }

  /**
   * Bulk load segments across multiple speakers.
   * @param {Array<Object>} segments 
   */
  loadSegments(segments = []) {
    for (const seg of segments) {
      this.addSegment(seg);
    }
  }

  /**
   * Get all speaker IDs in the timeline.
   * @returns {Array<string>}
   */
  getSpeakerIds() {
    return Array.from(this.tracks.keys());
  }

  /**
   * Get all segments belonging to a given speaker.
   * @param {string} speakerId 
   * @returns {Array<Object>}
   */
  getSpeakerTrack(speakerId) {
    return this.tracks.get(speakerId) || [];
  }

  /**
   * Get total number of detected speakers on this timeline.
   * @returns {number}
   */
  getSpeakerCount() {
    return this.tracks.size;
  }

  /**
   * Get total number of segments across all speaker tracks.
   * @returns {number}
   */
  getTotalSegmentCount() {
    let count = 0;
    for (const track of this.tracks.values()) {
      count += track.length;
    }
    return count;
  }

  /**
   * Get all speakers actively speaking at a given timestamp.
   * @param {number} timestamp 
   * @returns {Array<string>} Active speaker IDs
   */
  getActiveSpeakersAt(timestamp) {
    const active = [];
    for (const [spkId, track] of this.tracks.entries()) {
      for (const seg of track) {
        const start = seg.startTime !== undefined ? seg.startTime : seg.start;
        const end = seg.endTime !== undefined ? seg.endTime : seg.end;
        if (timestamp >= start && timestamp <= end) {
          active.push(spkId);
          break; // only count speaker once per timestamp
        }
      }
    }
    return active;
  }

  /**
   * Compute the maximum number of simultaneously overlapping speakers across the entire timeline.
   * @returns {number} Peak concurrent active speakers
   */
  getMaxConcurrentSpeakers() {
    const events = [];
    for (const [spkId, track] of this.tracks.entries()) {
      for (const seg of track) {
        const start = seg.startTime !== undefined ? seg.startTime : seg.start;
        const end = seg.endTime !== undefined ? seg.endTime : seg.end;
        events.push({ time: start, type: 'start', spkId });
        events.push({ time: end, type: 'end', spkId });
      }
    }

    // Sort events chronologically. If start and end are at same time, end comes first.
    events.sort((a, b) => a.time === b.time ? (a.type === 'end' ? -1 : 1) : a.time - b.time);

    let maxConcurrent = 0;
    const activeSpeakers = new Set();

    for (const ev of events) {
      if (ev.type === 'start') {
        activeSpeakers.add(ev.spkId);
        if (activeSpeakers.size > maxConcurrent) {
          maxConcurrent = activeSpeakers.size;
        }
      } else {
        activeSpeakers.delete(ev.spkId);
      }
    }

    return maxConcurrent;
  }

  /**
   * Get all pairs of speakers that have overlapping speech intervals.
   * @returns {Array<{ speakerA: string, speakerB: string, overlapCount: number, totalOverlapSec: number }>}
   */
  getSpeakerOverlapSummary() {
    const speakerIds = this.getSpeakerIds();
    const overlapMap = new Map();

    for (let i = 0; i < speakerIds.length; i++) {
      const spkA = speakerIds[i];
      const trackA = this.getSpeakerTrack(spkA);

      for (let j = i + 1; j < speakerIds.length; j++) {
        const spkB = speakerIds[j];
        const trackB = this.getSpeakerTrack(spkB);

        let overlapCount = 0;
        let totalOverlapSec = 0;

        for (const segA of trackA) {
          const startA = segA.startTime !== undefined ? segA.startTime : segA.start;
          const endA = segA.endTime !== undefined ? segA.endTime : segA.end;

          for (const segB of trackB) {
            const startB = segB.startTime !== undefined ? segB.startTime : segB.start;
            const endB = segB.endTime !== undefined ? segB.endTime : segB.end;

            const overlapStart = Math.max(startA, startB);
            const overlapEnd = Math.min(endA, endB);

            if (overlapEnd > overlapStart + 0.05) {
              overlapCount++;
              totalOverlapSec += (overlapEnd - overlapStart);
            }
          }
        }

        if (overlapCount > 0) {
          overlapMap.set(`${spkA}:${spkB}`, {
            speakerA: spkA,
            speakerB: spkB,
            overlapCount,
            totalOverlapSec: Number(totalOverlapSec.toFixed(3))
          });
        }
      }
    }

    return Array.from(overlapMap.values());
  }

  /**
   * Serialize timeline to object structure for storage or manifest generation.
   */
  toJSON() {
    const obj = {};
    for (const [spkId, track] of this.tracks.entries()) {
      obj[spkId] = track.map(s => ({ ...s }));
    }
    return obj;
  }
}

export default SpeakerTimeline;
