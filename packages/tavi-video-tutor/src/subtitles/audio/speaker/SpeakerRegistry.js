import { createSpeakerIdentity } from './SpeakerModel.js';

/**
 * Stable Speaker Registry.
 * 
 * Manages registered speaker identities across a media processing run.
 * Generates monotonic stable speaker IDs (spk_000001, ..., spk_N) without any hardcoded upper bound.
 */
export class SpeakerRegistry {
  constructor() {
    this.speakers = new Map();
    this.nextIndex = 1;
  }

  /**
   * Register or update a speaker identity.
   * @param {Object} profile 
   * @returns {Object} Normalized SpeakerIdentity
   */
  register(profile = {}) {
    let spkId = profile.speakerId;
    if (!spkId) {
      spkId = `spk_${String(this.nextIndex++).padStart(6, '0')}`;
    } else {
      const match = spkId.match(/^spk_(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num >= this.nextIndex) {
          this.nextIndex = num + 1;
        }
      }
    }

    const identity = createSpeakerIdentity({
      ...profile,
      speakerId: spkId
    });

    this.speakers.set(spkId, identity);
    return identity;
  }

  /**
   * Get speaker by ID.
   * @param {string} speakerId 
   * @returns {Object|null}
   */
  get(speakerId) {
    return this.speakers.get(speakerId) || null;
  }

  /**
   * Check if a speaker exists.
   * @param {string} speakerId 
   * @returns {boolean}
   */
  has(speakerId) {
    return this.speakers.has(speakerId);
  }

  /**
   * Get all registered speaker identities.
   * @returns {Array<Object>}
   */
  getAll() {
    return Array.from(this.speakers.values());
  }

  /**
   * Total number of registered speakers.
   * @returns {number}
   */
  size() {
    return this.speakers.size;
  }

  /**
   * Clear registry.
   */
  clear() {
    this.speakers.clear();
    this.nextIndex = 1;
  }

  /**
   * Serialize registry to JSON array.
   */
  toJSON() {
    return this.getAll();
  }

  /**
   * Load from serialized JSON array.
   * @param {Array<Object>} list 
   */
  fromJSON(list = []) {
    this.clear();
    for (const item of list) {
      this.register(item);
    }
  }
}

export default SpeakerRegistry;
