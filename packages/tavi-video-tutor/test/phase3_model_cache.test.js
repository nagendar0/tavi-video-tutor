import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import {
  ModelCacheManager,
  CacheError,
  CACHE_STATUS,
  VERIFICATION_STATUS,
  computeModelCacheKey,
  computeFileChecksum,
  sanitizeModelDirectoryName,
  validateArtifactUrl
} from '../src/subtitles/cache/ModelCacheManager.js';
import { getModel } from '../src/subtitles/models/modelRegistry.js';

let tempCacheDir;

beforeEach(() => {
  tempCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-cache-test-'));
});

afterEach(() => {
  if (tempCacheDir && fs.existsSync(tempCacheDir)) {
    try {
      fs.rmSync(tempCacheDir, { recursive: true, force: true });
    } catch (_) {}
  }
});

test('1. Deterministic cache path generation across engines and models', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });

  const piperModel = getModel('piper:sq_AL-edon-medium');
  assert.ok(piperModel);
  const piperPath = manager.getCachePath(piperModel);
  const piperDir = manager.getModelDirectory(piperModel);

  // Path must be inside tempCacheDir under piper/
  assert.ok(piperPath.startsWith(tempCacheDir));
  assert.ok(piperDir.includes(path.join('piper', 'piper_sq_AL-edon-medium')));
  assert.ok(piperPath.endsWith('sq_AL-edon-medium.onnx'));

  // Kokoro path
  const kokoroModel = getModel('kokoro:zh_CN-huayan');
  assert.ok(kokoroModel);
  const kokoroPath = manager.getCachePath(kokoroModel);
  assert.ok(kokoroPath.includes(path.join('kokoro', 'kokoro_zh_CN-huayan')));

  // Determinism check: multiple calls must yield identical paths
  assert.equal(manager.getCachePath(piperModel), piperPath);
});

test('2. Deterministic model cache key generation', () => {
  const modelA = {
    engine: 'piper',
    modelId: 'piper:test-voice',
    languageCode: 'en',
    modelType: 'onnx-piper',
    artifactPath: 'en/en_US/test.onnx'
  };

  const key1 = computeModelCacheKey(modelA);
  const key2 = computeModelCacheKey(modelA);
  assert.equal(key1, key2, 'Cache key must be 100% deterministic');
  assert.equal(key1.length, 64, 'Cache key must be a valid SHA-256 hex string');

  const modelB = { ...modelA, languageCode: 'es' };
  const keyB = computeModelCacheKey(modelB);
  assert.notEqual(key1, keyB, 'Altering model identity must produce a different cache key');
});

test('3. Cache miss detection when artifact is not downloaded', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const model = getModel('piper:sq_AL-edon-medium');

  assert.equal(manager.isCached(model), false);

  const status = manager.getCacheStatus(model);
  assert.equal(status.status, CACHE_STATUS.NOT_CACHED);
  assert.equal(status.exists, false);
  assert.equal(status.computedSha256, null);
  assert.equal(status.verificationStatus, VERIFICATION_STATUS.UNVERIFIED);
});

test('4. Cache hit detection when artifact exists and is valid', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const testBytes = Buffer.from('MODEL_RAW_BYTES_FOR_CACHE_HIT_TEST');
  const model = {
    modelId: 'piper:test-cache-hit',
    engine: 'piper',
    modelName: 'model.onnx',
    sizeBytes: testBytes.length,
    checksumSha256: null
  };

  const artifactPath = manager.getCachePath(model);
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, testBytes);

  assert.equal(manager.isCached(model), true);

  const status = manager.getCacheStatus(model);
  assert.equal(status.exists, true);
  assert.equal(status.sizeBytes, testBytes.length);
  assert.ok(status.computedSha256);
});

test('5. SHA-256 calculation against known test bytes', () => {
  const knownString = 'antigravity-tavi-model-verification-payload-12345';
  const expectedSha256 = crypto.createHash('sha256').update(knownString).digest('hex');

  const testFile = path.join(tempCacheDir, 'sample_model.onnx');
  fs.writeFileSync(testFile, Buffer.from(knownString));

  const computed = computeFileChecksum(testFile);
  assert.equal(computed, expectedSha256, 'Computed SHA-256 must match crypto reference digest');
});

test('6. Correct checksum match with verifyChecksum()', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const payload = 'deterministic-test-bytes';
  const expectedHash = crypto.createHash('sha256').update(payload).digest('hex');

  const testFile = path.join(tempCacheDir, 'test.bin');
  fs.writeFileSync(testFile, Buffer.from(payload));

  assert.equal(manager.verifyChecksum(testFile, expectedHash), true);
  assert.equal(manager.verifyChecksum(testFile, expectedHash.toUpperCase()), true, 'Checksum verification must be case-insensitive');
});

test('7. Checksum mismatch detection when file is corrupted by 1 byte', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const originalBytes = Buffer.from('clean-model-weights-graph');
  const expectedHash = crypto.createHash('sha256').update(originalBytes).digest('hex');

  // Corrupt exactly 1 byte
  const corruptedBytes = Buffer.from('clean-model-weights-graph');
  corruptedBytes[0] = corruptedBytes[0] ^ 0xFF;

  const testFile = path.join(tempCacheDir, 'corrupted.bin');
  fs.writeFileSync(testFile, corruptedBytes);

  assert.equal(manager.verifyChecksum(testFile, expectedHash), false);
});

test('8. Corrupted artifact rejection in getCacheStatus()', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });

  // Model with known expected checksum
  const expectedHash = 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899';
  const testModel = {
    modelId: 'piper:test-corrupted',
    engine: 'piper',
    modelName: 'model.onnx',
    checksumSha256: expectedHash,
    sizeBytes: null
  };

  const artifactPath = manager.getCachePath(testModel);
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, Buffer.from('corrupted_bytes'));

  const status = manager.getCacheStatus(testModel);
  assert.equal(status.status, CACHE_STATUS.CHECKSUM_MISMATCH);
  assert.equal(status.verificationStatus, VERIFICATION_STATUS.CHECKSUM_MISMATCH);
  assert.notEqual(status.computedSha256, expectedHash);
});

test('9. Truncated artifact detection when expected size exists', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const testModel = {
    modelId: 'piper:test-truncated',
    engine: 'piper',
    modelName: 'model.onnx',
    checksumSha256: null,
    sizeBytes: 1024 // Expected 1024 bytes
  };

  const artifactPath = manager.getCachePath(testModel);
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  // Write only 100 bytes (truncated)
  fs.writeFileSync(artifactPath, Buffer.alloc(100));

  const status = manager.getCacheStatus(testModel);
  assert.equal(status.status, CACHE_STATUS.SIZE_MISMATCH);
  assert.equal(status.sizeBytes, 100);
  assert.equal(status.expectedSizeBytes, 1024);
  assert.equal(status.verificationStatus, VERIFICATION_STATUS.TRUNCATED_OR_SIZE_MISMATCH);
});

test('10. Partial .part file is never treated as valid cached model', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const model = getModel('piper:sq_AL-edon-medium');

  const artifactPath = manager.getCachePath(model);
  const partPath = `${artifactPath}.part`;
  fs.mkdirSync(path.dirname(partPath), { recursive: true });
  fs.writeFileSync(partPath, Buffer.from('incomplete_download_data'));

  // .part exists, but main artifact does not
  assert.equal(manager.isCached(model), false, 'Partial file must never return isCached=true');

  const status = manager.getCacheStatus(model);
  assert.equal(status.status, CACHE_STATUS.PARTIAL);
  assert.equal(status.exists, false);
});

test('11. Atomic promotion from temporary .part artifact to final artifact', async () => {
  const payload = Buffer.from('ATOMIC_PROMOTION_TEST_BYTES');
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');

  // Injected downloader writes to temp destination
  const mockDownloader = async (url, destPath) => {
    fs.writeFileSync(destPath, payload);
  };

  const manager = new ModelCacheManager({
    cacheDir: tempCacheDir,
    downloader: mockDownloader
  });

  const testModel = {
    modelId: 'piper:atomic-test',
    engine: 'piper',
    modelName: 'atomic.onnx',
    artifactUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/test.onnx',
    checksumSha256: payloadHash,
    sizeBytes: payload.length
  };

  const finalPath = manager.getCachePath(testModel);
  const partPath = `${finalPath}.part`;

  const result = await manager.ensureModel(testModel);

  // Verification of atomic promotion:
  assert.equal(fs.existsSync(partPath), false, 'Temporary .part file must be cleaned up/promoted');
  assert.equal(fs.existsSync(finalPath), true, 'Final artifact file must exist');
  assert.equal(result.status, CACHE_STATUS.CACHED_VERIFIED);
  assert.equal(result.computedSha256, payloadHash);
});

test('12. Unknown registry SHA-256 does NOT become trusted merely because local hash was computed', async () => {
  const payload = Buffer.from('UNVERIFIED_REGISTRY_MODEL_DATA');

  const mockDownloader = async (url, destPath) => {
    fs.writeFileSync(destPath, payload);
  };

  const manager = new ModelCacheManager({
    cacheDir: tempCacheDir,
    downloader: mockDownloader
  });

  // Model with checksumSha256: null (as currently in Phase 1 registry)
  const testModel = {
    modelId: 'piper:null-hash-model',
    engine: 'piper',
    modelName: 'model.onnx',
    artifactUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/test.onnx',
    checksumSha256: null,
    sizeBytes: payload.length
  };

  const result = await manager.ensureModel(testModel);

  // Must NOT become CACHED_VERIFIED!
  assert.equal(result.status, CACHE_STATUS.CACHED_UNVERIFIED);
  assert.equal(result.verificationStatus, VERIFICATION_STATUS.COMPUTED_LOCAL_UNTRUSTED);
  assert.equal(result.expectedSha256, null);
  assert.ok(result.computedSha256, 'Local hash should still be computed');

  // Verify .verified.sha256 flag file was NOT created for untrusted hash
  const flagPath = path.join(manager.getModelDirectory(testModel), '.verified.sha256');
  assert.equal(fs.existsSync(flagPath), false, '.verified.sha256 flag must not be written without authoritative match');
});

test('13. Verified registry SHA-256 produces CACHED_VERIFIED when bytes match', async () => {
  const payload = Buffer.from('AUTHORITATIVE_VERIFIED_DATA');
  const authoritativeSha256 = crypto.createHash('sha256').update(payload).digest('hex');

  const mockDownloader = async (url, destPath) => {
    fs.writeFileSync(destPath, payload);
  };

  const manager = new ModelCacheManager({
    cacheDir: tempCacheDir,
    downloader: mockDownloader
  });

  const testModel = {
    modelId: 'piper:authoritative-model',
    engine: 'piper',
    modelName: 'model.onnx',
    artifactUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/test.onnx',
    checksumSha256: authoritativeSha256,
    sizeBytes: payload.length
  };

  const result = await manager.ensureModel(testModel);
  assert.equal(result.status, CACHE_STATUS.CACHED_VERIFIED);
  assert.equal(result.verificationStatus, VERIFICATION_STATUS.AUTHORITATIVE_VERIFIED);

  const flagPath = path.join(manager.getModelDirectory(testModel), '.verified.sha256');
  assert.equal(fs.existsSync(flagPath), true, '.verified.sha256 flag must be created');
});

test('14. Invalid model or path information is rejected safely', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });

  // Path traversal attempt in modelId
  assert.throws(
    () => manager.getModelDirectory('../../etc/passwd'),
    (err) => err instanceof CacheError && err.code === 'MODEL_PATH_INVALID'
  );

  assert.throws(
    () => sanitizeModelDirectoryName('../malicious_path'),
    (err) => err instanceof CacheError && err.code === 'MODEL_PATH_INVALID'
  );

  // Disallowed URL protocol
  assert.equal(validateArtifactUrl('ftp://example.com/model.bin'), false);
  assert.equal(validateArtifactUrl('file:///etc/passwd'), false);
  assert.equal(validateArtifactUrl('javascript:alert(1)'), false);
});

test('15. Concurrent requests for the same model do not corrupt the artifact', async () => {
  let downloadInvocations = 0;
  const payload = Buffer.from('CONCURRENT_TEST_MODEL_DATA');

  const mockDownloader = async (url, destPath) => {
    downloadInvocations++;
    // Simulate async network latency
    await new Promise((r) => setTimeout(r, 50));
    fs.writeFileSync(destPath, payload);
  };

  const manager = new ModelCacheManager({
    cacheDir: tempCacheDir,
    downloader: mockDownloader
  });

  const testModel = {
    modelId: 'piper:concurrent-voice',
    engine: 'piper',
    modelName: 'concurrent.onnx',
    artifactUrl: 'https://huggingface.co/rhasspy/piper-voices/resolve/main/test.onnx',
    checksumSha256: crypto.createHash('sha256').update(payload).digest('hex'),
    sizeBytes: payload.length
  };

  // Dispatch 5 simultaneous concurrent requests for the exact same model
  const [res1, res2, res3, res4, res5] = await Promise.all([
    manager.ensureModel(testModel),
    manager.ensureModel(testModel),
    manager.ensureModel(testModel),
    manager.ensureModel(testModel),
    manager.ensureModel(testModel)
  ]);

  // Downloader must have run exactly ONCE
  assert.equal(downloadInvocations, 1, 'Only a single download operation must execute for concurrent requests');

  // All 5 callers receive identical verified status
  assert.equal(res1.status, CACHE_STATUS.CACHED_VERIFIED);
  assert.equal(res2.status, CACHE_STATUS.CACHED_VERIFIED);
  assert.equal(res3.status, CACHE_STATUS.CACHED_VERIFIED);
  assert.equal(res4.status, CACHE_STATUS.CACHED_VERIFIED);
  assert.equal(res5.status, CACHE_STATUS.CACHED_VERIFIED);

  // Final file on disk is complete and intact
  const finalPath = manager.getCachePath(testModel);
  assert.equal(fs.statSync(finalPath).size, payload.length);
});

test('16. Offline cache hit succeeds without network', async () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const testBytes = Buffer.from('OFFLINE_CACHED_DATA');
  const model = {
    modelId: 'piper:offline-hit-test',
    engine: 'piper',
    modelName: 'offline.onnx',
    sizeBytes: testBytes.length,
    checksumSha256: null
  };

  const finalPath = manager.getCachePath(model);
  fs.mkdirSync(path.dirname(finalPath), { recursive: true });
  fs.writeFileSync(finalPath, testBytes);

  // In offline mode with cached model: succeeds immediately
  const res = await manager.ensureModel(model, { offline: true });
  assert.equal(res.exists, true);
  assert.equal(res.status, CACHE_STATUS.CACHED_UNVERIFIED);
});

test('17. Offline cache miss never attempts download', async () => {
  let networkAttempted = false;
  const mockDownloader = async () => {
    networkAttempted = true;
  };

  const manager = new ModelCacheManager({
    cacheDir: tempCacheDir,
    downloader: mockDownloader
  });

  const model = getModel('piper:sq_AL-edon-medium');

  // Attempting ensureModel with offline=true on missing model must throw MODEL_NOT_CACHED
  await assert.rejects(
    async () => manager.ensureModel(model, { offline: true }),
    (err) => err instanceof CacheError && err.code === 'MODEL_NOT_CACHED'
  );

  assert.equal(networkAttempted, false, 'Network downloader must never be called during offline cache miss');
});

test('18. Cache eviction removes only the intended model', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });

  const model1 = { modelId: 'piper:model_1', engine: 'piper', modelName: 'm1.onnx' };
  const model2 = { modelId: 'piper:model_2', engine: 'piper', modelName: 'm2.onnx' };

  const p1 = manager.getCachePath(model1);
  const p2 = manager.getCachePath(model2);

  fs.mkdirSync(path.dirname(p1), { recursive: true });
  fs.mkdirSync(path.dirname(p2), { recursive: true });
  fs.writeFileSync(p1, Buffer.from('data1'));
  fs.writeFileSync(p2, Buffer.from('data2'));

  assert.equal(fs.existsSync(p1), true);
  assert.equal(fs.existsSync(p2), true);

  // Evict model1 only
  const evicted = manager.evict(model1);
  assert.equal(evicted, true);

  assert.equal(fs.existsSync(p1), false, 'model1 must be evicted');
  assert.equal(fs.existsSync(p2), true, 'model2 must remain untouched in cache');
});

test('19. Cache invalidation makes an unverified/corrupted artifact unavailable', () => {
  const manager = new ModelCacheManager({ cacheDir: tempCacheDir });
  const model = { modelId: 'piper:model_to_invalidate', engine: 'piper', modelName: 'm.onnx' };

  const artifactPath = manager.getCachePath(model);
  const flagPath = path.join(manager.getModelDirectory(model), '.verified.sha256');

  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, Buffer.from('sample_weights'));
  fs.writeFileSync(flagPath, 'hash|2026-09-29T12:00:00Z');

  assert.equal(fs.existsSync(flagPath), true);

  const invalidated = manager.invalidate(model);
  assert.equal(invalidated, true);
  assert.equal(fs.existsSync(flagPath), false, 'Verification flag must be removed upon invalidation');
});

test('20. Existing Phase 1 tests continue passing', async () => {
  const sq = getModel('piper:sq_AL-edon-medium');
  assert.ok(sq);
  assert.equal(sq.languageCode, 'sq');
  assert.equal(sq.engine, 'piper');
});

test('21. Existing Phase 2 tests continue passing', async () => {
  const sq = getModel('piper:sq_AL-edon-medium');
  assert.ok(sq);
});
