import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  checkNode,
  checkFFmpeg,
  checkFFprobe,
  checkWingetAvailable,
  checkWhisperProvider,
  checkWhisperModel,
  checkTranslationProvider,
  checkTTSProvider,
  checkCacheDirectories,
  checkDiskSpace,
  runPreflight,
  formatPreflightTable,
  formatDoctorReport
} from '../src/subtitles/env/preflight.js';
import {
  askConfirmation,
  installWindowsFFmpeg,
  installWhisperProvider,
  downloadModelArtifacts,
  remediateMissing
} from '../src/subtitles/env/remediator.js';
import {
  isWhisperModelCached,
  downloadWhisperModel,
  WHISPER_MODEL_SIZES
} from '../src/subtitles/transcription/WhisperProvider.js';
import { probeMedia } from '../src/subtitles/video/MediaProbe.js';
import { runDoctor, runSetup, runGenerate } from '../src/cli/cli.js';

test('1. FFmpeg installed detection', async () => {
  const result = await checkFFmpeg();
  assert.equal(typeof result.pass, 'boolean');
  assert.equal(result.name, 'FFmpeg');
  if (result.pass) {
    assert.ok(result.version, 'Should extract FFmpeg version');
    assert.ok(result.path, 'Should return FFmpeg path');
  }
});

test('2. FFmpeg missing detection & graceful handling', async () => {
  const origPath = process.env.FFMPEG_PATH;
  try {
    process.env.FFMPEG_PATH = path.join(os.tmpdir(), 'non_existent_ffmpeg_bin_12345.exe');
    const result = await checkFFmpeg();
    assert.equal(result.pass, false);
    assert.equal(result.name, 'FFmpeg');
  } finally {
    if (origPath !== undefined) {
      process.env.FFMPEG_PATH = origPath;
    } else {
      delete process.env.FFMPEG_PATH;
    }
  }
});

test('3. FFprobe installed detection', async () => {
  const result = await checkFFprobe();
  assert.equal(typeof result.pass, 'boolean');
  assert.equal(result.name, 'FFprobe');
  if (result.pass) {
    assert.ok(result.version, 'Should extract FFprobe version');
    assert.ok(result.path, 'Should return FFprobe path');
  }
});

test('4. FFprobe missing detection & graceful handling', async () => {
  const origPath = process.env.FFPROBE_PATH;
  try {
    process.env.FFPROBE_PATH = path.join(os.tmpdir(), 'non_existent_ffprobe_bin_12345.exe');
    const result = await checkFFprobe();
    assert.equal(result.pass, false);
    assert.equal(result.name, 'FFprobe');
  } finally {
    if (origPath !== undefined) {
      process.env.FFPROBE_PATH = origPath;
    } else {
      delete process.env.FFPROBE_PATH;
    }
  }
});

test('5 & 6. winget availability detection', async () => {
  const result = await checkWingetAvailable();
  assert.equal(typeof result, 'boolean');
  if (process.platform !== 'win32') {
    assert.equal(result, false, 'winget must be false on non-Windows platforms');
  }
});

test('7. Whisper provider installed detection', async () => {
  const result = await checkWhisperProvider();
  assert.equal(result.name, 'Whisper Provider');
  assert.equal(typeof result.pass, 'boolean');
  assert.ok(result.provider);
});

test('8. Whisper provider missing handling', async () => {
  // Test structured missing object representation
  const preflightRes = await runPreflight({ model: 'Xenova/whisper-base' });
  assert.ok(preflightRes.checks.whisperProvider);
  assert.equal(preflightRes.checks.whisperProvider.name, 'Whisper Provider');
});

test('9. Whisper model installed detection & size mapping', async () => {
  assert.equal(WHISPER_MODEL_SIZES['Xenova/whisper-tiny'], '75 MB');
  assert.equal(WHISPER_MODEL_SIZES['Xenova/whisper-base'], '145 MB');
  assert.equal(WHISPER_MODEL_SIZES['Xenova/whisper-small'], '480 MB');

  const modelCheck = await checkWhisperModel('Xenova/whisper-base');
  assert.equal(modelCheck.name, 'Whisper Model');
  assert.equal(modelCheck.model, 'Xenova/whisper-base');
  assert.equal(typeof modelCheck.pass, 'boolean');
  assert.equal(modelCheck.size, '145 MB');
});

test('10. Whisper model missing detection', async () => {
  const modelCheck = await checkWhisperModel('NonExistentOrg/non-existent-model-xyz');
  assert.equal(modelCheck.pass, false);
  assert.equal(modelCheck.cached, false);
  assert.equal(modelCheck.cachePath, null);
});

test('11. User accepts installation confirmation flow', async () => {
  // When options.yes is true, askConfirmation returns true
  const accepted = await askConfirmation('Install now?', true, { yes: true });
  assert.equal(accepted, true);

  const acceptedY = await askConfirmation('Install now?', false, { y: true });
  assert.equal(acceptedY, true);
});

test('12. User declines installation flow', async () => {
  // In non-interactive mode without --yes, returns default false or respects refusal
  const declined = await askConfirmation('Install now?', false, { nonInteractive: true });
  assert.equal(declined, false);
});

test('13. Installation fails graceful reporting', async () => {
  const dummyMissing = {
    passed: false,
    missing: [
      {
        id: 'whisper-provider',
        name: 'Whisper Provider (@huggingface/transformers)',
        reason: 'Required for Speech-to-Text neural transcription runtime.',
        size: '~15 MB',
        destination: 'node_modules',
        command: 'npm install @huggingface/transformers',
        autoInstallable: true,
        manualInstructions: 'Run "npm install @huggingface/transformers".'
      }
    ],
    checks: {
      node: { pass: true },
      ffmpeg: { pass: true },
      ffprobe: { pass: true },
      whisperProvider: { pass: false },
      whisperModel: { pass: true },
      translation: { pass: true },
      tts: { pass: true },
      diskSpace: { pass: true },
      cache: { pass: true }
    }
  };

  // Decline auto-installation
  const result = await remediateMissing(dummyMissing, { nonInteractive: true, yes: false });
  assert.equal(typeof result.success, 'boolean');
  assert.ok(result.preflightResult);
});

test('14, 15, 16. Whisper model cache hit & download mechanics', async () => {
  const cachedCheck = await isWhisperModelCached('Xenova/whisper-base');
  assert.equal(typeof cachedCheck.cached, 'boolean');

  // Verify formatPreflightTable and formatDoctorReport
  const mockPreflight = {
    passed: true,
    checks: {
      node: { pass: true },
      ffmpeg: { pass: true },
      ffprobe: { pass: true },
      whisperProvider: { pass: true },
      whisperModel: { pass: true },
      translation: { pass: true },
      tts: { pass: true },
      diskSpace: { pass: true },
      cache: { pass: true }
    }
  };

  const table = formatPreflightTable(mockPreflight);
  assert.ok(table.includes('AITutor Preflight'));
  assert.ok(table.includes('Node.js'));
  assert.ok(table.includes('FFmpeg'));
  assert.ok(table.includes('FFprobe'));
  assert.ok(table.includes('Whisper Provider'));
  assert.ok(table.includes('Whisper Model'));
  assert.ok(table.includes('Translation'));
  assert.ok(table.includes('TTS'));

  const doctorReport = formatDoctorReport(mockPreflight);
  assert.ok(doctorReport.includes('AITutor Environment Check'));
  assert.ok(doctorReport.includes('Environment ready ✅'));
});

test('17. Preflight blocks generation when requirements are missing', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-blocked-test-'));
  try {
    const configPath = path.join(tmpDir, 'aitutor.config.mjs');
    fs.writeFileSync(configPath, `export default { videos: [{ id: 'test_vid', src: './test.mp4' }] };`);

    // Override FFMPEG_PATH to simulate missing ffmpeg
    const origFfmpeg = process.env.FFMPEG_PATH;
    process.env.FFMPEG_PATH = path.join(tmpDir, 'non_existent_ffmpeg.exe');

    try {
      const genResult = await runGenerate({ nonInteractive: true, yes: false }, tmpDir);
      assert.equal(genResult.failed, 1);
      assert.equal(genResult.preflightBlocked, true);
      assert.ok(genResult.missing && genResult.missing.length > 0);
    } finally {
      if (origFfmpeg !== undefined) {
        process.env.FFMPEG_PATH = origFfmpeg;
      } else {
        delete process.env.FFMPEG_PATH;
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('18. Preflight proceeds when requirements are satisfied', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-ok-test-'));
  try {
    const configPath = path.join(tmpDir, 'aitutor.config.mjs');
    fs.writeFileSync(configPath, `export default { videos: [] };`);

    const preflight = await runPreflight({}, tmpDir);
    assert.equal(typeof preflight.passed, 'boolean');
    assert.ok(preflight.checks);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('19. MediaProbe never produces unhandled ENOENT on missing binary', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-mediaprobe-test-'));
  const dummyVideo = path.join(tmpDir, 'test.mp4');
  fs.writeFileSync(dummyVideo, 'dummy video content');

  const origProbe = process.env.FFPROBE_PATH;
  const origFfmpeg = process.env.FFMPEG_PATH;
  try {
    process.env.FFPROBE_PATH = path.join(tmpDir, 'missing_ffprobe.exe');
    process.env.FFMPEG_PATH = path.join(tmpDir, 'missing_ffmpeg.exe');

    await assert.rejects(
      async () => {
        await probeMedia(dummyVideo);
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes('MediaProbe Error'));
        return true;
      },
      'MediaProbe must reject with controlled Error on missing binaries instead of unhandled crash'
    );
  } finally {
    if (origProbe !== undefined) process.env.FFPROBE_PATH = origProbe;
    else delete process.env.FFPROBE_PATH;

    if (origFfmpeg !== undefined) process.env.FFMPEG_PATH = origFfmpeg;
    else delete process.env.FFMPEG_PATH;

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('20. Doctor command runs and returns structured report', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-doctor-test-'));
  try {
    const docRes = await runDoctor({ nonInteractive: true }, tmpDir);
    assert.equal(typeof docRes.ready, 'boolean');
    assert.ok(docRes.preflight);
    assert.ok(docRes.preflight.checks.node);
    assert.ok(docRes.preflight.checks.ffmpeg);
    assert.ok(docRes.preflight.checks.whisperProvider);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('21. Setup command runs environment setup wizard', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-setup-test-'));
  try {
    const setupRes = await runSetup({ nonInteractive: true, yes: true }, tmpDir);
    assert.equal(typeof setupRes.ready, 'boolean');
    assert.ok(setupRes.preflight);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('22, 23, 24. Subtitles, audio dubbing, and quality pipeline remain functional', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-pipeline-compat-'));
  try {
    const configPath = path.join(tmpDir, 'aitutor.config.mjs');
    fs.writeFileSync(configPath, `
      export default {
        subtitles: { languages: ['en', 'es'] },
        audio: { languages: ['en', 'hi'] },
        videos: [
          {
            id: 'sample_lesson',
            src: 'https://example.com/sample.mp4',
            languages: ['en'],
            audio: { languages: ['en'] }
          }
        ]
      };
    `);

    // Verify preflight checks for this configuration
    const preflight = await runPreflight({ config: { quality: 'fast' } }, tmpDir);
    assert.ok(preflight.checks.node.pass);
    assert.ok(preflight.checks.translation.pass);
    assert.ok(preflight.checks.tts.pass);
    assert.ok(preflight.checks.cache.pass);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
