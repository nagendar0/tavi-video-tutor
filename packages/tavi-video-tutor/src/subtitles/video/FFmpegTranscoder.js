import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';

export const transcodeRendition = async ({
  inputPath,
  outputPath,
  targetHeight,
  probeInfo,
  onProgress
}) => {
  if (!inputPath || !fs.existsSync(inputPath)) {
    throw new Error(`FFmpegTranscoder Error: Input file does not exist at '${inputPath}'`);
  }

  const ffmpegPath = getFFmpegBinaryPath();
  const tempOutputPath = `${outputPath}.tmp.mp4`;

  // Ensure target directory exists
  const targetDir = path.dirname(outputPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Clean up any stale temp file
  if (fs.existsSync(tempOutputPath)) {
    try { fs.unlinkSync(tempOutputPath); } catch (_) {}
  }

  const totalDuration = probeInfo?.duration || 0;
  const hasAudio = probeInfo?.hasAudio !== false;

  const vfFilter = `scale=-2:${targetHeight}`;

  const args = [
    '-y',
    '-i', inputPath,
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '23',
    '-vf', vfFilter,
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart'
  ];

  if (hasAudio) {
    args.push('-c:a', 'aac', '-b:a', '128k');
  } else {
    args.push('-an');
  }

  args.push(tempOutputPath);

  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);
    let stderrData = '';

    proc.stderr.on('data', chunk => {
      const text = chunk.toString();
      stderrData += text;

      if (totalDuration > 0 && onProgress) {
        const timeMatch = text.match(/time=\s*(\d+):(\d+):(\d+\.\d+)/);
        if (timeMatch) {
          const hrs = parseFloat(timeMatch[1]);
          const mins = parseFloat(timeMatch[2]);
          const secs = parseFloat(timeMatch[3]);
          const currentSecs = hrs * 3600 + mins * 60 + secs;
          const percent = Math.min(99, Math.round((currentSecs / totalDuration) * 100));
          onProgress({ height: targetHeight, percent, currentSecs, totalDuration });
        }
      }
    });

    proc.on('error', err => {
      if (fs.existsSync(tempOutputPath)) {
        try { fs.unlinkSync(tempOutputPath); } catch (_) {}
      }
      reject(new Error(`Failed to start FFmpeg process: ${err.message}`));
    });

    proc.on('close', code => {
      if (code !== 0) {
        if (fs.existsSync(tempOutputPath)) {
          try { fs.unlinkSync(tempOutputPath); } catch (_) {}
        }
        reject(new Error(`FFmpeg transcoding failed with code ${code}: ${stderrData.slice(-300)}`));
        return;
      }

      if (!fs.existsSync(tempOutputPath)) {
        reject(new Error(`FFmpeg completed but temp output file was not created: ${tempOutputPath}`));
        return;
      }

      const stat = fs.statSync(tempOutputPath);
      if (stat.size === 0) {
        if (fs.existsSync(tempOutputPath)) {
          try { fs.unlinkSync(tempOutputPath); } catch (_) {}
        }
        reject(new Error(`FFmpeg output file is 0 bytes: ${tempOutputPath}`));
        return;
      }

      // Atomic rename from temp file to final target file
      try {
        fs.renameSync(tempOutputPath, outputPath);
      } catch (e) {
        // Fallback copy if cross-device link error
        fs.copyFileSync(tempOutputPath, outputPath);
        fs.unlinkSync(tempOutputPath);
      }

      onProgress?.({ height: targetHeight, percent: 100, currentSecs: totalDuration, totalDuration });

      const finalStat = fs.statSync(outputPath);
      resolve({
        outputPath,
        targetHeight,
        sizeBytes: finalStat.size,
        sizeMB: (finalStat.size / (1024 * 1024)).toFixed(2)
      });
    });
  });
};

export default transcodeRendition;
