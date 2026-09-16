import fs from 'fs';
import path from 'path';
import { TimelineMixer } from './mixer/TimelineMixer.js';

/**
 * Stitch timestamp-aligned audio segments into a single full-length browser-compatible audio track (.m4a AAC).
 * 
 * Anchors segments to absolute timestamps [start, end] so timing errors NEVER accumulate.
 * Uses robust TimelineMixer process invocation with -filter_complex_script and hierarchical batching.
 * Validates generated media with ffprobe/ffmpeg decode test and rejects dummy files.
 * 
 * @param {Array<{ start: number, end: number, audioPath: string }>} segments 
 * @param {string} outputPath - Target final file path (e.g. /public/aitutor/audio/lesson_1/hi.m4a)
 * @param {number} [totalVideoDuration] - Total duration of source video in seconds
 * @param {Object} [options]
 * @returns {Promise<string>} Output M4A track file path
 */
export async function stitchAudioSegments(segments, outputPath, totalVideoDuration = null, options = {}) {
  if (segments && segments.length > 0) {
    const validSegments = segments.filter(s => s && (s.audioPath || s.alignedAudioPath) && fs.existsSync(s.audioPath || s.alignedAudioPath));
    if (validSegments.length === 0) {
      throw new Error('stitchAudioSegments: None of the provided segment audio files exist on disk.');
    }
  }

  const mixer = new TimelineMixer(options);
  return await mixer.mix(segments, outputPath, {
    totalDuration: totalVideoDuration,
    ...options
  });
}

export default stitchAudioSegments;
