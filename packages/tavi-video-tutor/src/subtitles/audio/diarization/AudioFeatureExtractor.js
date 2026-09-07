import fs from 'fs';

/**
 * Audio Feature Extractor for Voice Activity Detection and Speaker Diarization.
 * 
 * Operates on raw 16kHz mono 16-bit linear PCM audio buffers or audio files.
 * Computes temporal and spectral acoustic features for frame-by-frame speaker modeling.
 */
export class AudioFeatureExtractor {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 16000;
    this.frameSize = options.frameSize || 512; // 32ms at 16kHz
    this.hopSize = options.hopSize || 256;     // 16ms hop (50% overlap)
  }

  /**
   * Parse a 16-bit mono WAV buffer into normalized Float32 samples [-1.0, 1.0].
   * @param {Buffer} buffer 
   * @returns {Float32Array}
   */
  bufferToFloat32(buffer) {
    let headerOffset = 44;
    if (buffer.length > 44 && buffer.toString('ascii', 0, 4) === 'RIFF') {
      for (let i = 12; i < buffer.length - 8; i++) {
        if (buffer.toString('ascii', i, i + 4) === 'data') {
          headerOffset = i + 8;
          break;
        }
      }
    }

    const pcmData = buffer.subarray(headerOffset);
    const numSamples = Math.floor(pcmData.length / 2);
    const float32 = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const int16 = pcmData.readInt16LE(i * 2);
      float32[i] = int16 / 32768.0;
    }

    return float32;
  }

  /**
   * Extract features from a WAV file on disk.
   * @param {string} filePath 
   * @returns {Array<Object>} Array of frame feature vectors
   */
  extractFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`AudioFeatureExtractor: Audio file not found at ${filePath}`);
    }
    const buf = fs.readFileSync(filePath);
    return this.extractFromBuffer(buf);
  }

  /**
   * Extract features from an audio buffer.
   * @param {Buffer|Float32Array} audioData 
   * @returns {Array<Object>} Array of frame feature vectors
   */
  extractFromBuffer(audioData) {
    const samples = audioData instanceof Float32Array
      ? audioData
      : this.bufferToFloat32(audioData);

    const frames = [];
    const numFrames = Math.floor((samples.length - this.frameSize) / this.hopSize);

    for (let i = 0; i < numFrames; i++) {
      const startSample = i * this.hopSize;
      const frameSamples = samples.subarray(startSample, startSample + this.frameSize);
      const timestamp = (startSample + this.frameSize / 2) / this.sampleRate;

      const energy = this.computeRMS(frameSamples);
      const zcr = this.computeZCR(frameSamples);
      const centroid = this.computeSpectralCentroid(frameSamples);
      const pitch = this.estimatePitch(frameSamples);

      frames.push({
        frameIndex: i,
        timestamp,
        energy,
        zcr,
        centroid,
        pitch
      });
    }

    return frames;
  }

  /**
   * Root Mean Square (RMS) energy.
   */
  computeRMS(samples) {
    let sumSquares = 0;
    for (let i = 0; i < samples.length; i++) {
      sumSquares += samples[i] * samples[i];
    }
    return Math.sqrt(sumSquares / samples.length);
  }

  /**
   * Zero Crossing Rate (ZCR).
   */
  computeZCR(samples) {
    let crossings = 0;
    for (let i = 1; i < samples.length; i++) {
      if ((samples[i] >= 0 && samples[i - 1] < 0) || (samples[i] < 0 && samples[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / (samples.length - 1);
  }

  /**
   * Approximate spectral centroid using magnitude of discrete frequency components.
   */
  computeSpectralCentroid(samples) {
    const N = samples.length;
    let num = 0;
    let den = 0;

    // Approximate DFT on first 32 frequency bins for efficiency
    const maxBins = Math.min(32, Math.floor(N / 4));
    for (let k = 1; k <= maxBins; k++) {
      let real = 0;
      let imag = 0;
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N;
        real += samples[n] * Math.cos(angle);
        imag -= samples[n] * Math.sin(angle);
      }
      const mag = Math.sqrt(real * real + imag * imag);
      const freqHz = (k * this.sampleRate) / N;
      num += freqHz * mag;
      den += mag;
    }

    return den > 0.0001 ? num / den : 0;
  }

  /**
   * Pitch estimation via normalized autocorrelation.
   * Detects fundamental frequency (F0) within typical human voice range [60Hz, 500Hz].
   */
  estimatePitch(samples) {
    const minLag = Math.floor(this.sampleRate / 500); // 500 Hz
    const maxLag = Math.floor(this.sampleRate / 60);  // 60 Hz

    const correlations = new Float32Array(maxLag + 1);

    for (let lag = minLag; lag <= maxLag && lag < samples.length; lag++) {
      let corr = 0;
      let norm1 = 0;
      let norm2 = 0;
      const count = samples.length - lag;

      for (let i = 0; i < count; i++) {
        corr += samples[i] * samples[i + lag];
        norm1 += samples[i] * samples[i];
        norm2 += samples[i + lag] * samples[i + lag];
      }

      const denom = Math.sqrt(norm1 * norm2);
      correlations[lag] = denom > 0.0001 ? corr / denom : 0;
    }

    // Find the first significant peak (fundamental frequency)
    let bestLag = 0;
    for (let lag = minLag + 1; lag < maxLag; lag++) {
      if (correlations[lag] > 0.35 && correlations[lag] >= correlations[lag - 1] && correlations[lag] >= correlations[lag + 1]) {
        bestLag = lag;
        break;
      }
    }

    if (bestLag > 0) {
      return this.sampleRate / bestLag;
    }

    return 0; // Unvoiced / silence
  }
}

export default AudioFeatureExtractor;
