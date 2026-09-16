import fs from 'fs';
import { spawnSync } from 'child_process';
import { getFFmpegBinaryPath, getFFprobeBinaryPath } from './extractAudio.js';

/**
 * Validates a generated audio file (e.g. .m4a AAC) against production quality invariants:
 * - File exists on disk
 * - File size is non-trivial (rejects 0-byte and 36-byte dummy headers)
 * - Container is valid (ftyp, moov, mdat) and inspectable via ffprobe
 * - At least one valid audio stream is present
 * - Valid audio codec and duration > 0
 * - Audio is actually decodable by FFmpeg without fatal parser errors
 * 
 * @param {string} filePath - Absolute or relative path to audio file
 * @param {Object} [options]
 * @param {number} [options.minSizeBytes=500] - Minimum valid size in bytes
 * @param {number} [options.minDuration=0.05] - Minimum duration in seconds
 * @param {string} [options.expectedCodec] - Required codec substring (e.g. 'aac')
 * @param {number} [options.expectedDuration] - Expected duration in seconds
 * @param {number} [options.durationTolerance=2.0] - Tolerance in seconds
 * @param {boolean} [options.decodeTest=true] - Run 1-second decode sample test
 * @param {boolean} [options.throwOnError=false] - Throw Error instead of returning result object
 * @returns {{ valid: boolean, code?: string, message?: string, size?: number, duration?: number, codec?: string, sampleRate?: number, channels?: number, format?: string }}
 */
export function validateGeneratedAudio(filePath, options = {}) {
  const minSizeBytes = options.minSizeBytes ?? 500;
  const minDuration = options.minDuration ?? 0.05;
  const decodeTest = options.decodeTest ?? true;
  const throwOnError = options.throwOnError ?? false;

  const fail = (code, message, details = {}) => {
    const result = { valid: false, code, message, ...details };
    if (throwOnError) {
      const err = new Error(`AUDIO_VALIDATION_FAILED [${code}]: ${message}`);
      err.code = code;
      err.details = details;
      throw err;
    }
    return result;
  };

  if (!filePath || typeof filePath !== 'string') {
    return fail('INVALID_PATH', 'File path must be a non-empty string');
  }

  if (!fs.existsSync(filePath)) {
    return fail('FILE_NOT_FOUND', `Audio file does not exist: ${filePath}`);
  }

  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch (err) {
    return fail('STAT_ERROR', `Failed to stat file: ${err.message}`);
  }

  if (stat.size === 0) {
    return fail('FILE_EMPTY', 'Audio file is empty (0 bytes)');
  }

  if (stat.size < minSizeBytes) {
    return fail('FILE_TOO_SMALL', `Audio file size (${stat.size} bytes) is below minimum threshold (${minSizeBytes} bytes)`);
  }

  // Reject known dummy headers (e.g. 36-byte or 40-byte ftyp/free atoms without moov/mdat)
  try {
    const headerBuf = Buffer.alloc(Math.min(64, stat.size));
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, headerBuf, 0, headerBuf.length, 0);
    fs.closeSync(fd);

    const hex = headerBuf.toString('hex');
    if (hex.startsWith('00000020667479704d344120000002004d3441206d70343269736f6d0000000866726565')) {
      return fail('DUMMY_HEADER', 'Audio file contains fake dummy binary header');
    }
  } catch (readErr) {
    return fail('HEADER_READ_FAILED', `Failed to read file header: ${readErr.message}`);
  }

  // Run ffprobe inspection
  const ffprobeBin = options.ffprobeBin || getFFprobeBinaryPath();
  const probeProc = spawnSync(ffprobeBin, [
    '-v', 'error',
    '-show_entries', 'format=duration,size,format_name:stream=codec_name,codec_type,sample_rate,channels,duration',
    '-of', 'json',
    filePath
  ], { encoding: 'utf8', windowsHide: true });

  if (probeProc.status !== 0 || probeProc.error) {
    return fail('FFPROBE_FAILED', `ffprobe inspection failed: ${probeProc.stderr || probeProc.error?.message || 'unknown error'}`);
  }

  let probeData;
  try {
    probeData = JSON.parse(probeProc.stdout);
  } catch (parseErr) {
    return fail('FFPROBE_PARSE_ERROR', `Failed to parse ffprobe output: ${parseErr.message}`);
  }

  if (!probeData.streams || !Array.isArray(probeData.streams) || probeData.streams.length === 0) {
    return fail('NO_STREAMS', 'File contains no media streams');
  }

  const audioStream = probeData.streams.find(s => s.codec_type === 'audio');
  if (!audioStream) {
    return fail('NO_AUDIO_STREAM', 'File contains no audio stream');
  }

  if (!audioStream.codec_name) {
    return fail('NO_CODEC', 'Audio stream has no identifiable codec');
  }

  if (options.expectedCodec && !audioStream.codec_name.toLowerCase().includes(options.expectedCodec.toLowerCase())) {
    return fail('CODEC_MISMATCH', `Expected codec ${options.expectedCodec}, found ${audioStream.codec_name}`);
  }

  const durationSec = parseFloat(audioStream.duration || probeData.format?.duration || '0');
  if (isNaN(durationSec) || durationSec < minDuration) {
    return fail('INVALID_DURATION', `Audio duration (${durationSec}s) is below minimum threshold (${minDuration}s)`);
  }

  if (options.expectedDuration && Math.abs(durationSec - options.expectedDuration) > (options.durationTolerance || 2.0)) {
    return fail('DURATION_OUT_OF_BOUNDS', `Duration ${durationSec}s exceeds tolerance from expected ${options.expectedDuration}s`);
  }

  // Silence detection via volumedetect
  const shouldCheckSilence = options.rejectSilence === true || (process.env.NODE_ENV === 'production' && options.rejectSilence !== false);
  if (shouldCheckSilence) {
    const ffmpegBin = options.ffmpegBin || getFFmpegBinaryPath();
    const volumeProc = spawnSync(ffmpegBin, [
      '-v', 'info',
      '-i', filePath,
      '-af', 'volumedetect',
      '-f', 'null',
      '-'
    ], { encoding: 'utf8', windowsHide: true });

    const output = (volumeProc.stderr || '') + (volumeProc.stdout || '');
    const maxMatch = output.match(/max_volume:\s*([-\d.]+)\s*dB/i);
    const meanMatch = output.match(/mean_volume:\s*([-\d.]+)\s*dB/i);

    if (maxMatch && meanMatch) {
      const maxVol = parseFloat(maxMatch[1]);
      const meanVol = parseFloat(meanMatch[1]);
      if (maxVol < -50 || meanVol < -60) {
        return fail('SILENT_AUDIO', `Audio contains near-silence (max_volume: ${maxVol} dB, mean_volume: ${meanVol} dB)`);
      }
    }
  }

  // Tone / synthetic-audio detection via astats
  const shouldCheckTone = options.rejectTone === true || (process.env.NODE_ENV === 'production' && options.rejectTone !== false);
  if (shouldCheckTone) {
    const ffmpegBin = options.ffmpegBin || getFFmpegBinaryPath();
    const statsProc = spawnSync(ffmpegBin, [
      '-v', 'info',
      '-i', filePath,
      '-af', 'astats=metadata=1:reset=1',
      '-f', 'null',
      '-'
    ], { encoding: 'utf8', windowsHide: true });

    const statsOutput = (statsProc.stderr || '') + (statsProc.stdout || '');
    const crestMatches = [...statsOutput.matchAll(/Crest factor:\s*([-\d.]+)/gi)];
    const peakMatches = [...statsOutput.matchAll(/Peak level dB:\s*([-\d.]+)/gi)];
    const rmsMatches = [...statsOutput.matchAll(/RMS level dB:\s*([-\d.]+)/gi)];

    if (crestMatches.length > 0) {
      for (let i = 0; i < crestMatches.length; i++) {
        const crest = parseFloat(crestMatches[i][1]);
        const peak = peakMatches[i] ? parseFloat(peakMatches[i][1]) : null;
        const rms = rmsMatches[i] ? parseFloat(rmsMatches[i][1]) : null;
        const peakRmsDiff = (peak !== null && rms !== null) ? Math.abs(peak - rms) : null;

        // Pure sine wave has theoretical crest factor sqrt(2) ~= 1.414, astats measures ~1.35 - 1.52,
        // and peak-to-RMS difference ~3.01 dB.
        if (crest >= 1.35 && crest <= 1.52 && peakRmsDiff !== null && peakRmsDiff >= 2.5 && peakRmsDiff <= 3.8) {
          return fail('SYNTHETIC_TONE_AUDIO', `Audio contains pure synthetic tone (crest_factor: ${crest}, peak_rms_diff: ${peakRmsDiff.toFixed(2)} dB)`);
        }
      }
    }
  }

  // Quick decode test with ffmpeg
  if (decodeTest) {
    const ffmpegBin = options.ffmpegBin || getFFmpegBinaryPath();
    const decodeProc = spawnSync(ffmpegBin, [
      '-v', 'error',
      '-i', filePath,
      '-t', '1',
      '-f', 'null',
      '-'
    ], { encoding: 'utf8', windowsHide: true });

    if (decodeProc.status !== 0 || (decodeProc.stderr && decodeProc.stderr.toLowerCase().includes('moov atom not found'))) {
      return fail('DECODE_FAILED', `FFmpeg failed to decode audio sample: ${decodeProc.stderr || 'exit code ' + decodeProc.status}`);
    }
  }

  return {
    valid: true,
    size: stat.size,
    duration: durationSec,
    codec: audioStream.codec_name,
    sampleRate: parseInt(audioStream.sample_rate || '44100', 10),
    channels: parseInt(audioStream.channels || '2', 10),
    format: probeData.format?.format_name
  };
}

/**
 * Creates a valid PCM 16-bit mono WAV buffer (silence) for test generation and audio pipeline mocking.
 * 
 * @param {number} [durationSeconds=1.0]
 * @param {number} [sampleRate=16000]
 * @param {number} [numChannels=1]
 * @returns {Buffer}
 */
export function createValidWaveBuffer(durationSeconds = 1.0, sampleRate = 16000, numChannels = 1) {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat: 1 (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample: 16

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Synthesize modulated speech-like harmonic PCM audio (non-silent, dynamic crest factor)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = 0.5 + 0.4 * Math.sin(2 * Math.PI * 3.5 * t) * Math.cos(2 * Math.PI * 1.2 * t);
    const s = 0.4 * Math.sin(2 * Math.PI * 180 * t) + 0.3 * Math.sin(2 * Math.PI * 360 * t) + 0.15 * Math.sin(2 * Math.PI * 720 * t);
    const sample = Math.max(-32768, Math.min(32767, Math.round(s * env * 22000)));
    for (let c = 0; c < numChannels; c++) {
      buffer.writeInt16LE(sample, 44 + (i * numChannels + c) * bytesPerSample);
    }
  }

  return buffer;
}

export default validateGeneratedAudio;

