import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

import {
  PreflightDoctor,
  runPreflight,
  checkNode,
  checkNodeVersion,
  checkFFmpeg,
  checkFFprobe,
  checkWorkspaceWritable,
  checkDiskSpace,
  checkTTSProvider,
  checkTranslationProvider,
  checkWhisperModel,
  formatPreflightTable,
  formatDoctorReport,
  CHECK_CATEGORIES,
  CHECK_RESULTS,
  PREFLIGHT_ERROR_CODES
} from '../src/subtitles/env/preflight.js';

import { ModelRegistry, getCanonicalModel } from '../src/subtitles/models/modelRegistry.js';
import { ModelCacheManager, CACHE_STATUS, VERIFICATION_STATUS } from '../src/subtitles/cache/ModelCacheManager.js';
import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES } from '../src/subtitles/policy/PolicyEngine.js';
import { processSingleVideo } from '../src/subtitles/pipeline/processVideo.js';

test('1. Node version PASS on current runtime (>= 18)', () => {
  const result = checkNodeVersion(process.version);
  assert.equal(result.pass, true);
  assert.ok(result.major >= 18);
  assert.equal(result.reason, null);
});

test('2. Unsupported Node version FAIL (< 18)', () => {
  const result = checkNodeVersion('v16.14.2');
  assert.equal(result.pass, false);
  assert.equal(result.major, 16);
  assert.ok(result.reason?.includes('Requires Node.js >= 18.0.0'));

  const malformed = checkNodeVersion('invalid-version');
  assert.equal(malformed.pass, false);
});

test('3. FFmpeg missing FAIL', async () => {
  const origPath = process.env.FFMPEG_PATH;
  try {
    process.env.FFMPEG_PATH = path.join(os.tmpdir(), 'non_existent_ffmpeg_99999.exe');
    const doctor = new PreflightDoctor();
    const res = await doctor.run({ skipModelCheck: true });
    assert.equal(res.checks.ffmpeg.pass, false);
    const ffmpegCheck = res.checks.find(c => c.checkId === 'BINARY_FFMPEG');
    assert.ok(ffmpegCheck);
    assert.equal(ffmpegCheck.result, CHECK_RESULTS.FAIL);
    assert.equal(ffmpegCheck.blocking, true);
    assert.ok(ffmpegCheck.action);
  } finally {
    if (origPath !== undefined) process.env.FFMPEG_PATH = origPath;
    else delete process.env.FFMPEG_PATH;
  }
});

test('4. FFmpeg executable but broken invocation FAIL', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-broken-ffmpeg-'));
  const origPath = process.env.FFMPEG_PATH;
  try {
    const isWin = process.platform === 'win32';
    const fakeBin = path.join(tmpDir, isWin ? 'ffmpeg.bat' : 'ffmpeg');
    if (isWin) {
      fs.writeFileSync(fakeBin, '@echo off\r\necho Invalid FFmpeg build\r\nexit /b 1\r\n');
    } else {
      fs.writeFileSync(fakeBin, '#!/bin/sh\necho "Invalid FFmpeg build"\nexit 1\n');
      fs.chmodSync(fakeBin, 0o755);
    }

    process.env.FFMPEG_PATH = fakeBin;
    const res = await checkFFmpeg();
    assert.equal(res.pass, false);
    assert.ok(res.error);
  } finally {
    if (origPath !== undefined) process.env.FFMPEG_PATH = origPath;
    else delete process.env.FFMPEG_PATH;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('5. FFprobe missing FAIL', async () => {
  const origPath = process.env.FFPROBE_PATH;
  try {
    process.env.FFPROBE_PATH = path.join(os.tmpdir(), 'non_existent_ffprobe_99999.exe');
    const res = await checkFFprobe();
    assert.equal(res.pass, false);
    assert.ok(res.error?.includes('FFprobe'));
  } finally {
    if (origPath !== undefined) process.env.FFPROBE_PATH = origPath;
    else delete process.env.FFPROBE_PATH;
  }
});

test('6. Workspace write access PASS', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-writable-ws-'));
  try {
    const res = checkWorkspaceWritable(tmpDir);
    assert.equal(res.pass, true);
    assert.equal(res.reason, null);
    const remaining = fs.readdirSync(tmpDir);
    assert.equal(remaining.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('7. Workspace write access failure FAIL on unwritable directory', () => {
  const invalidDir = process.platform === 'win32' ? 'Z:\\non_existent_drive_9999\\forbidden' : '/root/non_existent_9999';
  const res = checkWorkspaceWritable(invalidDir);
  assert.equal(res.pass, false);
  assert.ok(res.reason?.includes('not writable'));
});

test('8. Disk-space requirement handling', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-disk-test-'));
  try {
    const resNormal = checkDiskSpace(tmpDir, 10);
    assert.equal(resNormal.name, 'Disk Space');

    const resHuge = checkDiskSpace(tmpDir, 500_000_000);
    if (resHuge.availableMB !== null) {
      assert.equal(resHuge.pass, false);
      assert.ok(resHuge.details.includes('min 500000000 MB'));
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('9. Requested provider is checked', async () => {
  const doctor = new PreflightDoctor();
  const res = await doctor.run({
    provider: 'piper',
    skipModelCheck: true,
    piperBin: path.join(os.tmpdir(), 'non_existent_piper_123.exe')
  });

  const ttsCheck = res.checks.find(c => c.checkId === 'PROVIDER_TTS_RUNTIME');
  assert.ok(ttsCheck);
  assert.equal(ttsCheck.details.provider, 'piper');
  assert.equal(ttsCheck.result, CHECK_RESULTS.FAIL);
});

test('10. Unselected providers are not invoked', async () => {
  const doctor = new PreflightDoctor();
  const res = await doctor.run({
    provider: 'system',
    skipModelCheck: true
  });

  const checkIds = res.checks.map(c => c.checkId);
  assert.ok(!checkIds.includes('PROVIDER_TTS_PIPER'));
  assert.ok(!checkIds.includes('PROVIDER_TTS_KOKORO'));
  assert.ok(!checkIds.includes('CREDENTIAL_AZURE'));
});

test('11. Missing local TTS runtime FAIL', () => {
  const res = checkTTSProvider({ provider: 'piper', piperBin: '/path/to/missing_piper' });
  assert.equal(res.pass, false);
  assert.equal(res.result, CHECK_RESULTS.FAIL);
  assert.ok(res.reason?.includes('Local Piper TTS binary not found'));
  assert.ok(res.action?.includes('Install Piper binary'));
});

test('12. Missing local TTS model FAIL', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-missing-model-'));
  try {
    const customCacheManager = new ModelCacheManager({ cacheDir: path.join(tmpDir, 'cache') });
    const doctor = new PreflightDoctor({
      modelCacheManager: customCacheManager
    });

    const res = await doctor.run({
      provider: 'piper',
      audioLanguages: ['hi'],
      skipModelCheck: true
    });

    const modelCheck = res.checks.find(c => c.checkId.startsWith('MODEL_TTS_PIPER_HI'));
    assert.ok(modelCheck);
    assert.equal(modelCheck.result, CHECK_RESULTS.FAIL);
    assert.ok(modelCheck.reason?.includes('artifact is not present in cache'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('13. Partial model (.part artifact) FAIL', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-partial-model-'));
  try {
    const cacheDir = path.join(tmpDir, 'cache');
    const customCacheManager = new ModelCacheManager({ cacheDir });
    const modelDef = ModelRegistry.getCanonicalModel('hi', 'piper');
    assert.ok(modelDef);

    const modelDir = customCacheManager.getModelDirectory(modelDef);
    fs.mkdirSync(modelDir, { recursive: true });
    const partFile = `${customCacheManager.getCachePath(modelDef)}.part`;
    fs.writeFileSync(partFile, 'partial download data');

    const doctor = new PreflightDoctor({ modelCacheManager: customCacheManager });
    const res = await doctor.run({
      provider: 'piper',
      audioLanguages: ['hi'],
      skipModelCheck: true
    });

    const modelCheck = res.checks.find(c => c.checkId.startsWith('MODEL_TTS_PIPER_HI'));
    assert.ok(modelCheck);
    assert.equal(modelCheck.result, CHECK_RESULTS.FAIL);
    assert.ok(modelCheck.reason?.includes('download is incomplete'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('14. Corrupt model (checksum mismatch) FAIL', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-corrupt-model-'));
  try {
    const cacheDir = path.join(tmpDir, 'cache');
    const customCacheManager = new ModelCacheManager({ cacheDir });

    const testModel = {
      modelId: 'piper:test-checksum-corrupt',
      engine: 'piper',
      modelName: 'test_voice.onnx',
      checksumSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      sizeBytes: 15
    };

    const modelDir = customCacheManager.getModelDirectory(testModel);
    fs.mkdirSync(modelDir, { recursive: true });
    const artifactPath = customCacheManager.getCachePath(testModel);

    fs.writeFileSync(artifactPath, Buffer.from('corrupted_bytes'));

    const status = customCacheManager.getCacheStatus(testModel);
    assert.equal(status.status, CACHE_STATUS.CHECKSUM_MISMATCH);
    assert.equal(status.verificationStatus, VERIFICATION_STATUS.CHECKSUM_MISMATCH);
    assert.notEqual(status.computedSha256, testModel.checksumSha256);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('15. Unverified model is not reported as VERIFIED', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-unverified-model-'));
  try {
    const cacheDir = path.join(tmpDir, 'cache');
    const customCacheManager = new ModelCacheManager({ cacheDir });

    const canonicalModel = ModelRegistry.getCanonicalModel('hi', 'piper');
    assert.ok(canonicalModel);
    assert.equal(canonicalModel.checksumSha256, null);

    const modelDir = customCacheManager.getModelDirectory(canonicalModel);
    fs.mkdirSync(modelDir, { recursive: true });
    const artifactPath = customCacheManager.getCachePath(canonicalModel);
    const expectedSize = typeof canonicalModel.sizeBytes === 'number' ? canonicalModel.sizeBytes : 64;
    fs.writeFileSync(artifactPath, Buffer.alloc(expectedSize, 0x5a));

    const status = customCacheManager.getCacheStatus(canonicalModel);
    assert.equal(status.status, CACHE_STATUS.CACHED_UNVERIFIED);
    assert.equal(status.verificationStatus, VERIFICATION_STATUS.COMPUTED_LOCAL_UNTRUSTED);

    const doctor = new PreflightDoctor({ modelCacheManager: customCacheManager });
    const res = await doctor.run({
      provider: 'piper',
      audioLanguages: ['hi'],
      skipModelCheck: true
    });

    const check = res.checks.find(c => c.details?.modelId === canonicalModel.modelId);
    assert.ok(check);
    assert.equal(check.result, CHECK_RESULTS.PASS);
    assert.equal(check.details.verificationStatus, 'COMPUTED_LOCAL_UNTRUSTED');
    assert.notEqual(check.details.verificationStatus, 'AUTHORITATIVE_VERIFIED');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('16. Known authoritative checksum match PASS', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-checksum-pass-'));
  try {
    const cacheDir = path.join(tmpDir, 'cache');
    const customCacheManager = new ModelCacheManager({ cacheDir });

    const testPayload = Buffer.from('authoritative_test_payload_12345');
    const expectedSha256 = crypto.createHash('sha256').update(testPayload).digest('hex');

    const testModel = {
      modelId: 'piper:test-checksum-verified',
      engine: 'piper',
      modelName: 'test_voice_verified.onnx',
      checksumSha256: expectedSha256,
      sizeBytes: testPayload.length
    };

    const modelDir = customCacheManager.getModelDirectory(testModel);
    fs.mkdirSync(modelDir, { recursive: true });
    fs.writeFileSync(customCacheManager.getCachePath(testModel), testPayload);

    const status = customCacheManager.getCacheStatus(testModel);
    assert.equal(status.status, CACHE_STATUS.CACHED_VERIFIED);
    assert.equal(status.verificationStatus, VERIFICATION_STATUS.AUTHORITATIVE_VERIFIED);
    assert.equal(status.computedSha256, expectedSha256);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('17. Policy restriction FAIL on MMS commercial execution', async () => {
  const doctor = new PreflightDoctor({
    executionMode: EXECUTION_MODES.COMMERCIAL,
    policyProfile: POLICY_PROFILES.RELAXED
  });

  const res = await doctor.run({
    provider: 'mms',
    audioLanguages: ['hi'],
    skipModelCheck: true
  });

  const policyCheck = res.checks.find(c => c.category === CHECK_CATEGORIES.POLICY);
  assert.ok(policyCheck);
  assert.equal(policyCheck.result, CHECK_RESULTS.FAIL);
  assert.equal(policyCheck.blocking, true);
  assert.ok(policyCheck.reason?.includes('restricted under RELAXED policy for COMMERCIAL execution'));
  assert.ok(policyCheck.action?.includes('Switch execution mode to RESEARCH'));
});

test('18. Valid research-mode restricted model is allowed', async () => {
  const doctor = new PreflightDoctor({
    executionMode: EXECUTION_MODES.RESEARCH,
    policyProfile: POLICY_PROFILES.RELAXED
  });

  const res = await doctor.run({
    provider: 'mms',
    audioLanguages: ['hi'],
    skipModelCheck: true
  });

  const policyCheck = res.checks.find(c => c.category === CHECK_CATEGORIES.POLICY);
  assert.ok(policyCheck);
  assert.equal(policyCheck.result, CHECK_RESULTS.PASS);
  assert.equal(policyCheck.blocking, false);
});

test('19. Offline + Azure FAIL', async () => {
  const doctor = new PreflightDoctor({ offline: true });
  const res = await doctor.run({ provider: 'azure-byok', skipModelCheck: true });
  assert.equal(res.passed, false);
  const gate = res.checks.find(c => c.checkId === 'CONFIG_OFFLINE_TTS_PROVIDER');
  assert.ok(gate);
  assert.equal(gate.result, CHECK_RESULTS.FAIL);
  assert.ok(gate.reason?.includes('cannot be used in offline mode'));
});

test('20. Offline + Edge FAIL', async () => {
  const doctor = new PreflightDoctor({ offline: true });
  const res = await doctor.run({ provider: 'edge', skipModelCheck: true });
  assert.equal(res.passed, false);
  const gate = res.checks.find(c => c.checkId === 'CONFIG_OFFLINE_TTS_PROVIDER');
  assert.ok(gate);
  assert.equal(gate.result, CHECK_RESULTS.FAIL);
});

test('21. Offline + external translation FAIL', async () => {
  const doctor = new PreflightDoctor({ offline: true });
  const res = await doctor.run({
    translation: true,
    translationProvider: 'mymemory',
    skipModelCheck: true
  });
  assert.equal(res.passed, false);
  const transGate = res.checks.find(c => c.checkId === 'CONFIG_OFFLINE_TRANSLATION');
  assert.ok(transGate);
  assert.equal(transGate.result, CHECK_RESULTS.FAIL);
});

test('22. Offline + missing local model FAIL', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-offline-model-'));
  try {
    const customCacheManager = new ModelCacheManager({ cacheDir: path.join(tmpDir, 'cache') });
    const doctor = new PreflightDoctor({
      offline: true,
      modelCacheManager: customCacheManager
    });

    const res = await doctor.run({
      provider: 'piper',
      audioLanguages: ['hi'],
      skipModelCheck: true
    });

    assert.equal(res.passed, false);
    const modelCheck = res.checks.find(c => c.checkId.startsWith('MODEL_TTS_PIPER_HI'));
    assert.ok(modelCheck);
    assert.equal(modelCheck.result, CHECK_RESULTS.FAIL);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('23. Offline + valid local requirements PASS where runtime is available', async () => {
  const doctor = new PreflightDoctor({ offline: true });
  const res = await doctor.run({
    provider: 'system',
    skipModelCheck: true,
    languages: ['en']
  });

  const offlineCheck = res.checks.find(c => c.checkId === 'NETWORK_OFFLINE_VERIFICATION');
  assert.ok(offlineCheck);
  assert.equal(offlineCheck.result, CHECK_RESULTS.PASS);
  assert.equal(res.checks.tts.provider, 'Windows System.Speech');
});

test('24. Missing Azure credentials FAIL when Azure is explicitly selected', async () => {
  const origKey = process.env.AZURE_SPEECH_KEY;
  const origRegion = process.env.AZURE_SPEECH_REGION;
  try {
    delete process.env.AZURE_SPEECH_KEY;
    delete process.env.AZURE_SPEECH_REGION;

    const doctor = new PreflightDoctor();
    const res = await doctor.run({ provider: 'azure-byok', skipModelCheck: true });
    assert.equal(res.passed, false);
    const credCheck = res.checks.find(c => c.checkId === 'CREDENTIAL_AZURE');
    assert.ok(credCheck);
    assert.equal(credCheck.result, CHECK_RESULTS.FAIL);
    assert.ok(credCheck.reason?.includes('subscriptionKey and serviceRegion'));
  } finally {
    if (origKey !== undefined) process.env.AZURE_SPEECH_KEY = origKey;
    if (origRegion !== undefined) process.env.AZURE_SPEECH_REGION = origRegion;
  }
});

test('25. Invalid Azure configuration produces actionable diagnostics', async () => {
  const doctor = new PreflightDoctor();
  const res = await doctor.run({
    provider: 'azure-byok',
    subscriptionKey: '',
    serviceRegion: '',
    skipModelCheck: true
  });
  const credCheck = res.checks.find(c => c.checkId === 'CREDENTIAL_AZURE');
  assert.ok(credCheck);
  assert.equal(credCheck.result, CHECK_RESULTS.FAIL);
  assert.ok(credCheck.action?.includes('AZURE_SPEECH_KEY'));
});

test('26. No credentials are leaked in output', async () => {
  const secretKey = 'super_secret_azure_api_key_xyz987654321';
  const doctor = new PreflightDoctor();
  const res = await doctor.run({
    provider: 'azure-byok',
    subscriptionKey: secretKey,
    serviceRegion: 'eastus',
    skipModelCheck: true
  });

  const serialized = JSON.stringify(res);
  assert.equal(serialized.includes(secretKey), false, 'Subscription key must never appear in serialized diagnostics');

  const report = formatDoctorReport(res);
  assert.equal(report.includes(secretKey), false, 'Subscription key must never appear in doctor report');
});

test('27. External provider checks are only performed when explicitly selected', async () => {
  const doctor = new PreflightDoctor();
  const res = await doctor.run({ provider: 'system', skipModelCheck: true });
  const hasAzure = res.checks.some(c => c.checkId === 'CREDENTIAL_AZURE');
  assert.equal(hasAzure, false);
});

test('28. Preflight does not silently invoke fallback providers', async () => {
  const doctor = new PreflightDoctor();
  const res = await doctor.run({
    provider: 'piper',
    piperBin: '/nonexistent/piper_bin_9999',
    skipModelCheck: true
  });

  const ttsCheck = res.checks.find(c => c.checkId === 'PROVIDER_TTS_RUNTIME');
  assert.ok(ttsCheck);
  assert.equal(ttsCheck.result, CHECK_RESULTS.FAIL);
  assert.equal(ttsCheck.details.provider, 'piper');
});

test('29. Preflight does not mutate ModelRegistry', async () => {
  const countBefore = Object.keys(ModelRegistry.getAllModels()).length;
  const doctor = new PreflightDoctor();
  await doctor.run({ provider: 'piper', skipModelCheck: true });
  const countAfter = Object.keys(ModelRegistry.getAllModels()).length;
  assert.equal(countBefore, countAfter);
});

test('30. Preflight does not mutate PolicyEngine', async () => {
  const pe = new PolicyEngine();
  const origProfile = pe.defaultProfile;
  const doctor = new PreflightDoctor({ policyEngine: pe });
  await doctor.run({ provider: 'mms', skipModelCheck: true });
  assert.equal(pe.defaultProfile, origProfile);
});

test('31. Preflight does not silently download models', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-no-download-'));
  try {
    const cacheDir = path.join(tmpDir, 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    const customCacheManager = new ModelCacheManager({ cacheDir });

    const doctor = new PreflightDoctor({ modelCacheManager: customCacheManager });
    await doctor.run({
      provider: 'piper',
      audioLanguages: ['hi'],
      skipModelCheck: true
    });

    const entries = fs.readdirSync(cacheDir);
    assert.equal(entries.length, 0, 'Preflight must not download model artifacts');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('32. Every blocking failure contains reason + action', async () => {
  const doctor = new PreflightDoctor();
  const res = await doctor.run({
    provider: 'piper',
    piperBin: '/nonexistent/binary',
    skipModelCheck: true
  });

  const blockingFailures = res.checks.filter(c => c.blocking && c.result === CHECK_RESULTS.FAIL);
  assert.ok(blockingFailures.length > 0);
  for (const f of blockingFailures) {
    assert.ok(typeof f.reason === 'string' && f.reason.length > 0, `Check ${f.checkId} missing reason`);
    assert.ok(typeof f.action === 'string' && f.action.length > 0, `Check ${f.checkId} missing action`);
  }
});

test('33. NOT_CURRENTLY_POSSIBLE is not converted to PASS', () => {
  const check = {
    checkId: 'TEST_REMOTE_PROBE',
    result: CHECK_RESULTS.NOT_CURRENTLY_POSSIBLE,
    blocking: true
  };
  assert.notEqual(check.result, CHECK_RESULTS.PASS);
});

test('34. Complete diagnostic output is deterministic', async () => {
  const doctor = new PreflightDoctor();
  const opts = { provider: 'system', skipModelCheck: true };
  const res1 = await doctor.run(opts);
  const res2 = await doctor.run(opts);

  assert.equal(res1.passed, res2.passed);
  assert.equal(res1.checks.length, res2.checks.length);
  for (let i = 0; i < res1.checks.length; i++) {
    assert.equal(res1.checks[i].checkId, res2.checks[i].checkId);
    assert.equal(res1.checks[i].result, res2.checks[i].result);
  }
});

test('35. Preflight result totals are mathematically consistent', async () => {
  const doctor = new PreflightDoctor();
  const res = await doctor.run({ provider: 'system', skipModelCheck: true });
  const { total, passed, failed, warnings, skipped } = res.summary;

  assert.equal(total, passed + failed + warnings + skipped, 'Total must equal passed + failed + warnings + skipped');
  assert.equal(total, res.checks.length, 'Total must match checks array length');
});

test('36. Preflight runs before expensive pipeline stages', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-precheck-gate-'));
  try {
    const videoEntry = { id: 'test_vid', src: 'https://example.com/test.mp4' };
    const manifestStore = { cwd: tmpDir, isCached: () => false, isAudioLanguageCached: () => false };

    await assert.rejects(
      async () => {
        await processSingleVideo(videoEntry, manifestStore, {
          enforcePreflight: true,
          provider: 'unknown_impossible_provider'
        });
      },
      (err) => {
        assert.equal(err.code, 'PRECHECK_FAILED');
        assert.ok(err.preflight);
        return true;
      }
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('37. Source-level audit: absence of passive/unconditional TTS pass and Google scraper', () => {
  const preflightSrc = fs.readFileSync(path.resolve('src/subtitles/env/preflight.js'), 'utf8');
  assert.equal(preflightSrc.includes('translate.google.com'), false);
  assert.equal(preflightSrc.includes('translate_tts'), false);
  assert.equal(preflightSrc.includes('Auto (Neural + System Fallback)'), false);
});
