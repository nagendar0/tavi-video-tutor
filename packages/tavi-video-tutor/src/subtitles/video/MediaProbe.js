import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';

export const getFFprobeBinaryPath = () => {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }

  const isWin = process.platform === 'win32';
  const exeName = isWin ? 'ffprobe.exe' : 'ffprobe';

  // 1. Same directory as ffmpeg binary
  const ffmpegPath = getFFmpegBinaryPath();
  if (ffmpegPath && ffmpegPath !== 'ffmpeg') {
    const ffprobeSibling = path.join(path.dirname(ffmpegPath), exeName);
    if (fs.existsSync(ffprobeSibling)) {
      return ffprobeSibling;
    }
  }

  // 2. Local bin fallback
  const localBin = path.resolve(process.cwd(), 'bin', exeName);
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  return 'ffprobe';
};

export const probeMedia = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`MediaProbe Error: File does not exist at '${filePath}'`);
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    throw new Error(`MediaProbe Error: File is 0 bytes at '${filePath}'`);
  }

  // Attempt probing with ffprobe first
  try {
    const ffprobePath = getFFprobeBinaryPath();
    const probeData = await new Promise((resolve, reject) => {
      const proc = spawn(ffprobePath, [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ]);

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', chunk => { stdout += chunk.toString(); });
      proc.stderr.on('data', chunk => { stderr += chunk.toString(); });

      proc.on('error', err => reject(err));
      proc.on('close', code => {
        if (code === 0 && stdout.trim()) {
          try {
            resolve(JSON.parse(stdout));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
        }
      });
    });

    if (probeData && probeData.streams) {
      const videoStream = probeData.streams.find(s => s.codec_type === 'video');
      const audioStream = probeData.streams.find(s => s.codec_type === 'audio');

      if (!videoStream) {
        throw new Error(`MediaProbe Error: No video stream found in '${filePath}'`);
      }

      const width = parseInt(videoStream.width || 0, 10);
      const height = parseInt(videoStream.height || 0, 10);

      if (!width || !height) {
        throw new Error(`MediaProbe Error: Invalid video dimensions ${width}x${height} in '${filePath}'`);
      }

      let duration = parseFloat(probeData.format?.duration || videoStream.duration || 0);
      let fps = 30;
      if (videoStream.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        if (parts.length === 2 && parseFloat(parts[1]) > 0) {
          fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
        }
      }

      return {
        width,
        height,
        duration,
        fps: fps || 30,
        videoCodec: videoStream.codec_name || 'h264',
        audioCodec: audioStream ? audioStream.codec_name || 'aac' : 'none',
        hasAudio: !!audioStream,
        bitrate: parseInt(probeData.format?.bit_rate || videoStream.bit_rate || 0, 10),
        pixelFormat: videoStream.pix_fmt || 'yuv420p',
        sizeBytes: stat.size,
        sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
      };
    }
  } catch (_) {
    // Fallback to ffmpeg -i parsing if ffprobe fails or is missing
  }

  // Fallback parsing via ffmpeg -i
  const ffmpegPath = getFFmpegBinaryPath();
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ['-i', filePath]);
    let stderr = '';
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
    proc.on('close', () => {
      const dimMatch = stderr.match(/(\d{2,5})x(\d{2,5})/);
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      const fpsMatch = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);

      if (!dimMatch) {
        reject(new Error(`MediaProbe Error: Unable to extract video dimensions from FFmpeg fallback output for '${filePath}'`));
        return;
      }

      const width = parseInt(dimMatch[1], 10);
      const height = parseInt(dimMatch[2], 10);

      let duration = 0;
      if (durationMatch) {
        const hrs = parseFloat(durationMatch[1]);
        const mins = parseFloat(durationMatch[2]);
        const secs = parseFloat(durationMatch[3]);
        duration = hrs * 3600 + mins * 60 + secs;
      }

      const fps = fpsMatch ? Math.round(parseFloat(fpsMatch[1])) : 30;
      const hasAudio = /Stream #.*: Audio:/i.test(stderr);

      resolve({
        width,
        height,
        duration,
        fps,
        videoCodec: 'h264',
        audioCodec: hasAudio ? 'aac' : 'none',
        hasAudio,
        bitrate: 0,
        pixelFormat: 'yuv420p',
        sizeBytes: stat.size,
        sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
      });
    });
  });
};

export default probeMedia;
