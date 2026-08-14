import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { computeMediaFingerprint } from '../cache/manifest.js';

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

const normalizeContainerFormat = (formatName, ext) => {
  if (!formatName && !ext) return 'unknown';
  const cleanExt = (ext || '').replace(/^\./, '').toLowerCase();
  const fmt = (formatName || '').toLowerCase();
  if (fmt.includes('matroska') || fmt.includes('mkv') || fmt.includes('webm')) {
    if (cleanExt === 'webm') return 'webm';
    return 'mkv';
  }
  if (fmt.includes('avi')) return 'avi';
  if (fmt.includes('mov') || fmt.includes('mp4') || fmt.includes('m4a')) {
    if (cleanExt === 'mov') return 'mov';
    return 'mp4';
  }
  return cleanExt || 'mp4';
};

export const probeMedia = async (filePath, options = {}) => {
  if (!filePath) {
    throw new Error('MediaProbe Error: No file path provided');
  }

  const isRemote = /^https?:\/\//i.test(filePath);

  if (!isRemote) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`MediaProbe Error: File does not exist at '${filePath}'`);
    }

    const stat = fs.statSync(filePath);
    if (stat.size === 0) {
      throw new Error(`MediaProbe Error: File is 0 bytes at '${filePath}'`);
    }
  }

  const ext = path.extname(filePath).toLowerCase();
  const ffprobePath = getFFprobeBinaryPath();

  // Attempt probing with ffprobe first
  try {
    const probeData = await new Promise((resolve, reject) => {
      const args = [
        '-v', 'error',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const proc = spawn(ffprobePath, args);
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

    if (probeData && Array.isArray(probeData.streams)) {
      const videoStreams = probeData.streams.filter(s => s.codec_type === 'video');
      const audioStreamsRaw = probeData.streams.filter(s => s.codec_type === 'audio');
      const subtitleStreamsRaw = probeData.streams.filter(s => s.codec_type === 'subtitle');

      if (videoStreams.length === 0) {
        throw new Error(`MediaProbe Error: No video stream found in '${filePath}'`);
      }

      const videoStream = videoStreams[0];
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

      // Detect rotation
      let rotation = 0;
      if (videoStream.tags && videoStream.tags.rotate) {
        rotation = parseInt(videoStream.tags.rotate, 10) || 0;
      } else if (Array.isArray(videoStream.side_data_list)) {
        const rotSide = videoStream.side_data_list.find(s => s.rotation !== undefined);
        if (rotSide) {
          rotation = Math.abs(parseInt(rotSide.rotation, 10) || 0);
        }
      }

      const container = normalizeContainerFormat(probeData.format?.format_name, ext);

      // Parse all audio streams
      const audioStreams = audioStreamsRaw.map((s, idx) => ({
        streamIndex: s.index !== undefined ? s.index : idx,
        codec: s.codec_name || 'unknown',
        sampleRate: parseInt(s.sample_rate || 0, 10),
        channels: parseInt(s.channels || 0, 10),
        channelLayout: s.channel_layout || (s.channels === 2 ? 'stereo' : s.channels === 1 ? 'mono' : `${s.channels || 0}ch`),
        language: s.tags?.language || s.tags?.lang || null,
        title: s.tags?.title || null,
        bitrate: parseInt(s.bit_rate || 0, 10)
      }));

      // Parse embedded subtitles
      const subtitles = subtitleStreamsRaw.map((s, idx) => ({
        streamIndex: s.index !== undefined ? s.index : idx,
        codec: s.codec_name || 'unknown',
        language: s.tags?.language || s.tags?.lang || null,
        title: s.tags?.title || null
      }));

      const primaryAudioStream = audioStreams.length > 0 ? audioStreams[0] : null;
      const statSize = isRemote ? 0 : fs.statSync(filePath).size;
      const fingerprint = isRemote ? null : computeMediaFingerprint(filePath, options.cwd || process.cwd());

      const canonicalVideo = {
        streamIndex: videoStream.index !== undefined ? videoStream.index : 0,
        codec: videoStream.codec_name || 'h264',
        width,
        height,
        fps: fps || 30,
        pixelFormat: videoStream.pix_fmt || 'yuv420p',
        rotation,
        aspectRatio: (width / height).toFixed(2)
      };

      const canonicalAudio = primaryAudioStream ? {
        streamIndex: primaryAudioStream.streamIndex,
        codec: primaryAudioStream.codec,
        sampleRate: primaryAudioStream.sampleRate,
        channels: primaryAudioStream.channels,
        channelLayout: primaryAudioStream.channelLayout
      } : null;

      return {
        // Canonical Media Model
        sourcePath: filePath,
        container,
        duration,
        video: canonicalVideo,
        audio: canonicalAudio,
        audioStreams,
        subtitles,
        hasAudio: audioStreams.length > 0,
        fingerprint,
        sizeBytes: statSize,
        sizeMB: (statSize / (1024 * 1024)).toFixed(2),

        // Backward compatibility flat properties
        width,
        height,
        fps: fps || 30,
        videoCodec: canonicalVideo.codec,
        audioCodec: canonicalAudio ? canonicalAudio.codec : 'none',
        pixelFormat: canonicalVideo.pixelFormat,
        rotation,
        bitrate: parseInt(probeData.format?.bit_rate || videoStream.bit_rate || 0, 10)
      };
    }
  } catch (err) {
    if (err.message && err.message.includes('No video stream found')) {
      throw err;
    }
    // Fallback to ffmpeg -i parsing if ffprobe fails
  }

  // Fallback parsing via ffmpeg -i
  const ffmpegPath = getFFmpegBinaryPath();
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, ['-i', filePath]);
    let stderr = '';
    proc.stderr.on('data', chunk => { stderr += chunk.toString(); });
    proc.on('close', () => {
      // 1. Check if media contains a valid video stream
      const hasVideoStream = /Stream #0:\d+.*?: Video:/i.test(stderr);
      if (!hasVideoStream) {
        reject(new Error(`MediaProbe Error: No video stream found in '${filePath}'`));
        return;
      }

      // 2. Extract dimensions
      const dimMatch = stderr.match(/(\d{2,5})x(\d{2,5})/);
      if (!dimMatch) {
        reject(new Error(`MediaProbe Error: Unable to extract video dimensions for '${filePath}'`));
        return;
      }

      const width = parseInt(dimMatch[1], 10);
      const height = parseInt(dimMatch[2], 10);

      // 3. Extract duration
      const durationMatch = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      let duration = 0;
      if (durationMatch) {
        const hrs = parseFloat(durationMatch[1]);
        const mins = parseFloat(durationMatch[2]);
        const secs = parseFloat(durationMatch[3]);
        duration = hrs * 3600 + mins * 60 + secs;
      }

      // 4. Extract fps
      const fpsMatch = stderr.match(/(\d+(?:\.\d+)?)\s*fps/);
      const fps = fpsMatch ? Math.round(parseFloat(fpsMatch[1])) : 30;

      // 5. Extract bitrate
      const bitrateMatch = stderr.match(/bitrate:\s*(\d+)\s*kb\/s/i);
      const bitrate = bitrateMatch ? parseInt(bitrateMatch[1], 10) * 1000 : 0;

      // 6. Extract container
      const containerMatch = stderr.match(/Input #0,\s*([^,]+),/);
      const container = normalizeContainerFormat(containerMatch ? containerMatch[1].trim() : null, ext);

      // 7. Extract video stream details
      const videoMatch = stderr.match(/Stream #0:(\d+)(?:\((.*?)\))?: Video:\s*([\w\-]+)(?:\s*\([^)]*\))?,\s*([\w\-]+)/i);
      const videoStreamIndex = videoMatch ? parseInt(videoMatch[1], 10) : 0;
      const videoCodec = videoMatch ? videoMatch[3].toLowerCase() : 'h264';
      const pixelFormat = videoMatch && videoMatch[4] ? videoMatch[4] : 'yuv420p';

      // 8. Extract rotation
      let rotation = 0;
      const rotateMatch = stderr.match(/rotate\s*:\s*(\d+)/i) || stderr.match(/rotation of\s*(-?\d+)/i);
      if (rotateMatch) {
        rotation = Math.abs(parseInt(rotateMatch[1], 10));
      }

      // 9. Extract all audio streams
      const audioStreams = [];
      const audioStreamRegex = /Stream #0:(\d+)(?:\((.*?)\))?.*?:\s*Audio:\s*([\w\-]+)(?:[,\s]+(\d+)\s*Hz)?(?:[,\s]+([^,\n\r]+))?/gi;
      let aMatch;
      while ((aMatch = audioStreamRegex.exec(stderr)) !== null) {
        const sIndex = parseInt(aMatch[1], 10);
        const sLang = aMatch[2] || null;
        const sCodec = aMatch[3] ? aMatch[3].toLowerCase() : 'aac';
        const sRate = aMatch[4] ? parseInt(aMatch[4], 10) : 44100;
        const sLayoutRaw = (aMatch[5] || '').trim();
        const sChannels = /mono/i.test(sLayoutRaw) ? 1 : /stereo/i.test(sLayoutRaw) ? 2 : /5\.1/i.test(sLayoutRaw) ? 6 : 2;

        audioStreams.push({
          streamIndex: sIndex,
          codec: sCodec,
          sampleRate: sRate,
          channels: sChannels,
          channelLayout: sLayoutRaw || (sChannels === 1 ? 'mono' : 'stereo'),
          language: sLang,
          title: null,
          bitrate: 0
        });
      }

      // 10. Extract all subtitle streams
      const subtitleStreams = [];
      const subStreamRegex = /Stream #0:(\d+)(?:\((.*?)\))?.*?:\s*Subtitle:\s*([\w\-]+)/gi;
      let sMatch;
      while ((sMatch = subStreamRegex.exec(stderr)) !== null) {
        subtitleStreams.push({
          streamIndex: parseInt(sMatch[1], 10),
          codec: sMatch[3] ? sMatch[3].toLowerCase() : 'unknown',
          language: sMatch[2] || null,
          title: null
        });
      }

      const hasAudio = audioStreams.length > 0;
      const primaryAudio = hasAudio ? audioStreams[0] : null;
      const statSize = isRemote ? 0 : fs.statSync(filePath).size;

      const canonicalVideo = {
        streamIndex: videoStreamIndex,
        codec: videoCodec,
        width,
        height,
        fps,
        pixelFormat,
        rotation,
        aspectRatio: (width / height).toFixed(2)
      };

      const canonicalAudio = primaryAudio ? {
        streamIndex: primaryAudio.streamIndex,
        codec: primaryAudio.codec,
        sampleRate: primaryAudio.sampleRate,
        channels: primaryAudio.channels,
        channelLayout: primaryAudio.channelLayout
      } : null;

      resolve({
        // Canonical Media Model
        sourcePath: filePath,
        container,
        duration,
        video: canonicalVideo,
        audio: canonicalAudio,
        audioStreams,
        subtitles: subtitleStreams,
        hasAudio,
        fingerprint: isRemote ? null : computeMediaFingerprint(filePath, options.cwd || process.cwd()),
        sizeBytes: statSize,
        sizeMB: (statSize / (1024 * 1024)).toFixed(2),

        // Backward compatibility flat properties
        width,
        height,
        fps,
        videoCodec,
        audioCodec: canonicalAudio ? canonicalAudio.codec : 'none',
        pixelFormat,
        rotation,
        bitrate
      });
    });
  });
};

export default probeMedia;

