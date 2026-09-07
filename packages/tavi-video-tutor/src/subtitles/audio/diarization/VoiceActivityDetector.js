import { AudioFeatureExtractor } from './AudioFeatureExtractor.js';

/**
 * Voice Activity Detector (VAD).
 * 
 * Analyzes audio frames to detect voice activity intervals with sub-second precision.
 * Uses adaptive noise floor estimation, zero-crossing rate validation, and hangover smoothing.
 */
export class VoiceActivityDetector {
  constructor(options = {}) {
    this.extractor = options.extractor || new AudioFeatureExtractor(options);
    this.energyThresholdMultiplier = options.energyThresholdMultiplier || 2.2;
    this.minSpeechDurationSec = options.minSpeechDurationSec || 0.25;
    this.minSilenceDurationSec = options.minSilenceDurationSec || 0.2;
    this.hangoverFrames = options.hangoverFrames || 8; // ~128ms hangover
  }

  /**
   * Detect voice activity intervals from audio buffer or file.
   * @param {Buffer|Float32Array|Array<Object>} input 
   * @returns {Array<{ start: number, end: number, confidence: number, duration: number }>}
   */
  detect(input) {
    const frames = Array.isArray(input) && input.length > 0 && typeof input[0]?.energy === 'number'
      ? input
      : this.extractor.extractFromBuffer(input);

    if (frames.length === 0) {
      return [];
    }

    // 1. Compute adaptive noise floor from lower quartile of frame energies
    const sortedEnergies = frames.map(f => f.energy).sort((a, b) => a - b);
    const q10Index = Math.floor(sortedEnergies.length * 0.1);
    const noiseFloor = Math.max(0.001, sortedEnergies[q10Index] || 0.001);
    const speechThreshold = noiseFloor * this.energyThresholdMultiplier;

    // 2. Mark raw speech activity per frame
    const rawActive = new Array(frames.length);
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      // Voice if energy exceeds threshold and either pitch is present or spectral centroid is in speech range
      const isEnergyHigh = f.energy >= speechThreshold;
      const isVoiced = f.pitch > 0 || (f.centroid >= 200 && f.centroid <= 4000);
      rawActive[i] = isEnergyHigh && isVoiced;
    }

    // 3. Apply hangover smoothing to bridge short pauses within phrases
    const smoothed = new Array(frames.length).fill(false);
    let hangover = 0;

    for (let i = 0; i < frames.length; i++) {
      if (rawActive[i]) {
        smoothed[i] = true;
        hangover = this.hangoverFrames;
      } else if (hangover > 0) {
        smoothed[i] = true;
        hangover--;
      }
    }

    // 4. Cluster active frames into continuous intervals
    const intervals = [];
    let inSpeech = false;
    let speechStart = 0;
    let frameEnergies = [];

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      if (smoothed[i] && !inSpeech) {
        inSpeech = true;
        speechStart = f.timestamp;
        frameEnergies = [f.energy];
      } else if (smoothed[i] && inSpeech) {
        frameEnergies.push(f.energy);
      } else if (!smoothed[i] && inSpeech) {
        inSpeech = false;
        const speechEnd = f.timestamp;
        const duration = speechEnd - speechStart;

        if (duration >= this.minSpeechDurationSec) {
          const avgEnergy = frameEnergies.reduce((a, b) => a + b, 0) / frameEnergies.length;
          const confidence = Math.min(1.0, Math.max(0.5, (avgEnergy / (speechThreshold * 1.5))));
          intervals.push({
            start: Math.max(0, Number(speechStart.toFixed(3))),
            end: Number(speechEnd.toFixed(3)),
            duration: Number(duration.toFixed(3)),
            confidence: Number(confidence.toFixed(2))
          });
        }
        frameEnergies = [];
      }
    }

    // Handle trailing interval
    if (inSpeech && frames.length > 0) {
      const lastFrame = frames[frames.length - 1];
      const duration = lastFrame.timestamp - speechStart;
      if (duration >= this.minSpeechDurationSec) {
        const avgEnergy = frameEnergies.length > 0
          ? frameEnergies.reduce((a, b) => a + b, 0) / frameEnergies.length
          : speechThreshold;
        const confidence = Math.min(1.0, Math.max(0.5, (avgEnergy / (speechThreshold * 1.5))));
        intervals.push({
          start: Math.max(0, Number(speechStart.toFixed(3))),
          end: Number(lastFrame.timestamp.toFixed(3)),
          duration: Number(duration.toFixed(3)),
          confidence: Number(confidence.toFixed(2))
        });
      }
    }

    return intervals;
  }
}

export default VoiceActivityDetector;
