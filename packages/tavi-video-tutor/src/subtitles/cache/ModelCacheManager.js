// @ts-check
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getModel } from '../models/modelRegistry.js';
import { PolicyEngine } from '../policy/PolicyEngine.js';
import { TaviCacheError, TaviNetworkError } from '../errors/index.js';

/**
 * Standard cache error class for ModelCacheManager operations.
 */
export class CacheError extends TaviCacheError {
  /**
   * @param {string} message 
   * @param {string} code 
   */
  constructor(message, code) {
    super(message, {
      name: 'CacheError',
      code: code || 'MODEL_CACHE_INVALID'
    });
    this.name = 'CacheError';
    this.code = code;
  }
}

/**
 * Cache status enumeration.
 * @readonly
 * @enum {string}
 */
export const CACHE_STATUS = Object.freeze({
  NOT_CACHED: 'NOT_CACHED',                   // Artifact does not exist on disk
  PARTIAL: 'PARTIAL',                         // Only a .part download file exists; incomplete
  CACHED_UNVERIFIED: 'CACHED_UNVERIFIED',     // Artifact exists, hash computed locally but not verified against authoritative registry hash
  CACHED_VERIFIED: 'CACHED_VERIFIED',         // Artifact exists and byte-level SHA-256 matches authoritative registry hash
  CHECKSUM_MISMATCH: 'CHECKSUM_MISMATCH',     // Computed SHA-256 differs from authoritative expected hash (corrupted)
  SIZE_MISMATCH: 'SIZE_MISMATCH',             // On-disk byte size differs from expected registry sizeBytes (truncated)
  INVALID: 'INVALID'                          // Model metadata or directory state is invalid/unresolvable
});

/**
 * Verification state taxonomy.
 * @readonly
 * @enum {string}
 */
export const VERIFICATION_STATUS = Object.freeze({
  AUTHORITATIVE_VERIFIED: 'AUTHORITATIVE_VERIFIED',     // Matched authoritative registry SHA-256
  COMPUTED_LOCAL_UNTRUSTED: 'COMPUTED_LOCAL_UNTRUSTED', // Computed locally; registry has null hash (untrusted baseline)
  CHECKSUM_MISMATCH: 'CHECKSUM_MISMATCH',               // Hash mismatch
  TRUNCATED_OR_SIZE_MISMATCH: 'TRUNCATED_OR_SIZE_MISMATCH', // Size mismatch
  UNVERIFIED: 'UNVERIFIED'                              // Not yet verified
});

/**
 * Resolves the platform-appropriate default cache root directory.
 * 
 * Precedence:
 * 1. TAVI_MODEL_CACHE_DIR env var
 * 2. Windows: %LOCALAPPDATA%/tavi/models (fallback: ~/.cache/tavi/models)
 * 3. macOS: ~/Library/Caches/tavi/models
 * 4. Linux/Unix: $XDG_CACHE_HOME/tavi/models or ~/.cache/tavi/models
 * 5. Fallback: <cwd>/.tavi/models
 * 
 * @returns {string} Absolute path to cache directory
 */
export function getDefaultCacheDir() {
  if (process.env.TAVI_MODEL_CACHE_DIR) {
    return path.resolve(process.env.TAVI_MODEL_CACHE_DIR);
  }
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || (home ? path.join(home, 'AppData', 'Local') : '');
    if (localAppData) {
      return path.join(localAppData, 'tavi', 'models');
    }
  } else if (process.platform === 'darwin') {
    if (home) {
      return path.join(home, 'Library', 'Caches', 'tavi', 'models');
    }
  } else {
    // Linux / Unix
    const xdg = process.env.XDG_CACHE_HOME;
    if (xdg) {
      return path.join(xdg, 'tavi', 'models');
    }
    if (home) {
      return path.join(home, '.cache', 'tavi', 'models');
    }
  }
  return path.join(process.cwd(), '.tavi', 'models');
}

/**
 * Sanitizes a model ID into a safe cross-platform directory name.
 * Prevents directory traversal and characters invalid in Windows/POSIX paths.
 * 
 * @param {string} modelId 
 * @returns {string}
 */
export function sanitizeModelDirectoryName(modelId) {
  if (!modelId || typeof modelId !== 'string') {
    throw new CacheError('MODEL_PATH_INVALID: Invalid modelId for path construction', 'MODEL_PATH_INVALID');
  }
  if (modelId.includes('..') || modelId.includes('\0')) {
    throw new CacheError(`MODEL_PATH_INVALID: Path traversal attempt detected in modelId '${modelId}'`, 'MODEL_PATH_INVALID');
  }
  return modelId.replace(/[:/\\]+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Computes a deterministic cache key from canonical model metadata.
 * 
 * @param {Record<string, any>} model 
 * @returns {string} SHA-256 hex string
 */
export function computeModelCacheKey(model) {
  if (!model || typeof model !== 'object') {
    throw new CacheError('MODEL_CACHE_INVALID: Invalid model object provided for cache key computation', 'MODEL_CACHE_INVALID');
  }
  const engine = String(model.engine || '').toLowerCase().trim();
  const modelId = String(model.modelId || '').trim();
  const modelType = String(model.modelType || '').trim();
  const artifactPath = String(model.artifactPath || '').trim();
  const languageCode = String(model.languageCode || '').toLowerCase().trim();

  if (!modelId) {
    throw new CacheError('MODEL_CACHE_INVALID: Model definition must contain a valid modelId', 'MODEL_CACHE_INVALID');
  }

  // Pipe-delimited canonical string avoids non-deterministic JSON object serialization issues
  const canonicalString = [
    `engine:${engine}`,
    `modelId:${modelId}`,
    `languageCode:${languageCode}`,
    `modelType:${modelType}`,
    `artifactPath:${artifactPath}`
  ].join('|');

  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Computes SHA-256 checksum from actual on-disk file bytes.
 * 
 * @param {string} filePath 
 * @param {string} [algorithm='sha256']
 * @returns {string} Hexadecimal hash
 */
export function computeFileChecksum(filePath, algorithm = 'sha256') {
  if (!fs.existsSync(filePath)) {
    throw new CacheError(`MODEL_NOT_CACHED: File does not exist at '${filePath}'`, 'MODEL_NOT_CACHED');
  }
  const hash = crypto.createHash(algorithm);
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(64 * 1024);
  let bytesRead = 0;
  try {
    while ((bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null)) > 0) {
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

/**
 * Validates a remote artifact URL for security.
 * Rejects non-HTTP(S) protocols and malformed URLs.
 * 
 * @param {string} urlString 
 * @param {Array<string>|null} [allowedDomains] - Optional domain whitelist
 * @returns {boolean}
 */
export function validateArtifactUrl(urlString, allowedDomains = null) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (allowedDomains && Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(d => hostname === d || hostname.endsWith(`.${d}`));
      if (!isAllowed) return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Content-Addressed Model Cache Manager for Tavi.
 * 
 * Features:
 * - Content-addressed & engine-partitioned filesystem layout.
 * - Byte-level SHA-256 integrity verification against actual on-disk files.
 * - Clear distinction between authoritative verification and computed untrusted hashes.
 * - Atomic promotion of downloaded files via temporary .part staging.
 * - In-process and cross-process cooperative locking to prevent concurrent write corruption.
 * - Strict offline enforcement: zero network calls when offline=true.
 * - Complete separation from policy decisions and TTS generation logic.
 */
export class ModelCacheManager {
  /**
   * @param {Object} [options]
   * @param {string} [options.cacheDir] - Custom root directory for cached models
   * @param {Function} [options.downloader] - Custom downloader function (artifactUrl, tempPath, model) => Promise<{ bytesWritten: number }>
   * @param {Array<string>} [options.allowedDomains] - Whitelisted domains for artifact downloads
   * @param {any} [options.networkPolicy]
   * @param {any} [options.policyEngine]
   */
  constructor(options = {}) {
    this.cacheDir = options.cacheDir ? path.resolve(options.cacheDir) : getDefaultCacheDir();
    this.downloader = typeof options.downloader === 'function' ? options.downloader : null;
    this.allowedDomains = options.allowedDomains || ['huggingface.co', 'github.com', 'raw.githubusercontent.com'];
    this.networkPolicy = options.networkPolicy || null;
    this.policyEngine = options.policyEngine || null;

    // In-process lock tracker: Map<string, Promise<any>>
    this._activeDownloads = new Map();
  }

  /**
   * Resolves the target directory for a specific model inside the cache.
   * Format: <cacheDir>/<engine>/<sanitizedModelId>/
   * 
   * @param {Object|string} model - Model definition or modelId
   * @returns {string} Absolute directory path
   */
  getModelDirectory(model) {
    const modelDef = this._resolveModelDef(model);
    const engine = String(modelDef.engine || 'common').toLowerCase().trim();
    const safeDir = sanitizeModelDirectoryName(modelDef.modelId);
    return path.join(this.cacheDir, engine, safeDir);
  }

  /**
   * Resolves the primary artifact file path for a model.
   * 
   * @param {Object|string} model 
   * @returns {string} Absolute path to final artifact file
   */
  getCachePath(model) {
    const modelDef = this._resolveModelDef(model);
    const dir = this.getModelDirectory(modelDef);
    const fileName = modelDef.modelName ? path.basename(modelDef.modelName) : (modelDef.artifactPath ? path.basename(modelDef.artifactPath) : 'model.bin');
    return path.join(dir, fileName);
  }

  /**
   * Returns true only if the model is locally cached and not a partial download.
   * 
   * @param {Object|string} model 
   * @returns {boolean}
   */
  isCached(model) {
    try {
      const status = this.getCacheStatus(model);
      return status.status === CACHE_STATUS.CACHED_VERIFIED || status.status === CACHE_STATUS.CACHED_UNVERIFIED;
    } catch (_) {
      return false;
    }
  }

  /**
   * Inspects the local cache state for a model and returns a structured status report.
   * 
   * @param {Object|string} model 
   * @returns {{
   *   status: string,
   *   modelId: string,
   *   path: string,
   *   exists: boolean,
   *   sizeBytes: number|null,
   *   expectedSizeBytes: number|null,
   *   computedSha256: string|null,
   *   expectedSha256: string|null,
   *   verificationStatus: string,
   *   verifiedAt: string|null,
   *   metadataPath: string|null
   * }}
   */
  getCacheStatus(model) {
    const modelDef = this._resolveModelDef(model);
    const artifactPath = this.getCachePath(modelDef);
    const modelDir = this.getModelDirectory(modelDef);
    const partPath = `${artifactPath}.part`;
    const metadataPath = path.join(modelDir, 'metadata.json');
    const verifiedFlagPath = path.join(modelDir, '.verified.sha256');

    const expectedSha256 = modelDef.checksumSha256 || null;
    const expectedSizeBytes = typeof modelDef.sizeBytes === 'number' ? modelDef.sizeBytes : null;

    // 1. Check for partial .part artifact
    if (fs.existsSync(partPath) && !fs.existsSync(artifactPath)) {
      return {
        status: CACHE_STATUS.PARTIAL,
        modelId: modelDef.modelId,
        path: artifactPath,
        exists: false,
        sizeBytes: fs.statSync(partPath).size,
        expectedSizeBytes,
        computedSha256: null,
        expectedSha256,
        verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
        verifiedAt: null,
        metadataPath: null
      };
    }

    // 2. Check if main artifact exists
    if (!fs.existsSync(artifactPath)) {
      return {
        status: CACHE_STATUS.NOT_CACHED,
        modelId: modelDef.modelId,
        path: artifactPath,
        exists: false,
        sizeBytes: null,
        expectedSizeBytes,
        computedSha256: null,
        expectedSha256,
        verificationStatus: VERIFICATION_STATUS.UNVERIFIED,
        verifiedAt: null,
        metadataPath: null
      };
    }

    // 3. Inspect existing artifact file size
    const stat = fs.statSync(artifactPath);
    const actualSize = stat.size;

    if (expectedSizeBytes !== null && actualSize !== expectedSizeBytes) {
      return {
        status: CACHE_STATUS.SIZE_MISMATCH,
        modelId: modelDef.modelId,
        path: artifactPath,
        exists: true,
        sizeBytes: actualSize,
        expectedSizeBytes,
        computedSha256: null,
        expectedSha256,
        verificationStatus: VERIFICATION_STATUS.TRUNCATED_OR_SIZE_MISMATCH,
        verifiedAt: null,
        metadataPath: fs.existsSync(metadataPath) ? metadataPath : null
      };
    }

    // 4. Compute real byte-level checksum from file on disk
    const computedHash = computeFileChecksum(artifactPath);

    // Read stored verification flag if available
    let storedVerifiedAt = null;
    if (fs.existsSync(verifiedFlagPath)) {
      try {
        const flagContent = fs.readFileSync(verifiedFlagPath, 'utf8').trim();
        if (flagContent.includes('|')) {
          storedVerifiedAt = flagContent.split('|')[1];
        }
      } catch (_) {}
    }

    // 5. Authoritative comparison when registry defines expected SHA-256
    if (expectedSha256) {
      if (computedHash.toLowerCase() === expectedSha256.toLowerCase()) {
        return {
          status: CACHE_STATUS.CACHED_VERIFIED,
          modelId: modelDef.modelId,
          path: artifactPath,
          exists: true,
          sizeBytes: actualSize,
          expectedSizeBytes,
          computedSha256: computedHash,
          expectedSha256,
          verificationStatus: VERIFICATION_STATUS.AUTHORITATIVE_VERIFIED,
          verifiedAt: storedVerifiedAt || new Date().toISOString(),
          metadataPath: fs.existsSync(metadataPath) ? metadataPath : null
        };
      } else {
        return {
          status: CACHE_STATUS.CHECKSUM_MISMATCH,
          modelId: modelDef.modelId,
          path: artifactPath,
          exists: true,
          sizeBytes: actualSize,
          expectedSizeBytes,
          computedSha256: computedHash,
          expectedSha256,
          verificationStatus: VERIFICATION_STATUS.CHECKSUM_MISMATCH,
          verifiedAt: null,
          metadataPath: fs.existsSync(metadataPath) ? metadataPath : null
        };
      }
    }

    // 6. When registry has null SHA-256: local hash is computed, but explicitly untrusted
    return {
      status: CACHE_STATUS.CACHED_UNVERIFIED,
      modelId: modelDef.modelId,
      path: artifactPath,
      exists: true,
      sizeBytes: actualSize,
      expectedSizeBytes,
      computedSha256: computedHash,
      expectedSha256: null,
      verificationStatus: VERIFICATION_STATUS.COMPUTED_LOCAL_UNTRUSTED,
      verifiedAt: null,
      metadataPath: fs.existsSync(metadataPath) ? metadataPath : null
    };
  }

  /**
   * Ensures the model is present, intact, and integrity-verified in local cache.
   * If missing and offline=false, triggers atomic download and promotion.
   * 
   * @param {Object|string} model - Model definition or modelId
   * @param {Object} [options]
   * @param {boolean} [options.offline=false] - When true, strictly forbids network operations
   * @param {boolean} [options.forceDownload=false] - When true, re-downloads even if cached
   * @returns {Promise<Object>} Resolved cache status report
   */
  async ensureModel(model, options = {}) {
    const modelDef = this._resolveModelDef(model);
    const offline = Boolean(options.offline);
    const forceDownload = Boolean(options.forceDownload);
    const cacheKey = computeModelCacheKey(modelDef);

    // Concurrency guard: serialize concurrent requests for the same model in-process
    if (this._activeDownloads.has(cacheKey)) {
      return this._activeDownloads.get(cacheKey);
    }

    const taskPromise = this._executeEnsureModel(modelDef, offline, forceDownload, options);
    this._activeDownloads.set(cacheKey, taskPromise);

    try {
      return await taskPromise;
    } finally {
      this._activeDownloads.delete(cacheKey);
    }
  }

  /**
   * Explicitly downloads and caches a model artifact under policy validation.
   * Rejects immediately in offline mode with OFFLINE_VIOLATION_BLOCKED.
   * 
   * @param {Object|string} model 
   * @param {Record<string, any>} [options={}]
   * @returns {Promise<Object>}
   */
  async downloadArtifact(model, options = {}) {
    const modelDef = this._resolveModelDef(model);
    const policy = options.networkPolicy || this.networkPolicy;
    if (options.offline === true || (policy && policy.isOffline())) {
      throw new TaviNetworkError(`Model artifact download blocked: Offline mode active. Cannot download '${modelDef.modelId}'`, {
        code: 'OFFLINE_VIOLATION_BLOCKED',
        stage: 'model_download',
        action: 'Run in online mode or provide the required local cached assets.',
        blocking: true,
        details: {
          operation: 'model_download',
          modelId: modelDef.modelId,
          artifactUrl: modelDef.artifactUrl
        }
      });
    }

    if (options.executionMode === 'COMMERCIAL') {
      const policyEngine = options.policyEngine || this.policyEngine || new PolicyEngine();
      const policyResult = policyEngine.evaluate(modelDef, {
        policyProfile: options.policyProfile || 'RELAXED',
        executionMode: 'COMMERCIAL'
      });
      if (!policyResult.permitted) {
        throw new CacheError(`MODEL_POLICY_RESTRICTED: Cannot download model '${modelDef.modelId}': prohibited in commercial execution mode: ${policyResult.reason}`, 'MODEL_POLICY_RESTRICTED');
      }
    }

    if (policy && modelDef.artifactUrl) {
      policy.assertAllowed(modelDef.artifactUrl, { stage: 'model_download', provider: modelDef.engine });
    }

    return this.ensureModel(modelDef, { ...options, forceDownload: true });
  }

  /**
   * Internal worker for ensureModel.
   * 
   * @param {any} modelDef
   * @param {boolean} offline
   * @param {boolean} forceDownload
   * @param {Record<string, any>} [options={}]
   * @private
   */
  async _executeEnsureModel(modelDef, offline, forceDownload, options = {}) {
    // Commercial policy enforcement on cache operations
    if (options.executionMode === 'COMMERCIAL') {
      const policyEngine = options.policyEngine || this.policyEngine || new PolicyEngine();
      const policyResult = policyEngine.evaluate(modelDef, {
        policyProfile: options.policyProfile || 'RELAXED',
        executionMode: 'COMMERCIAL'
      });
      if (!policyResult.permitted) {
        throw new CacheError(`MODEL_POLICY_RESTRICTED: Model '${modelDef.modelId}' is prohibited in commercial execution mode: ${policyResult.reason}`, 'MODEL_POLICY_RESTRICTED');
      }
    }

    const currentStatus = this.getCacheStatus(modelDef);

    // Check if already cached and intact
    if (!forceDownload) {
      if (currentStatus.status === CACHE_STATUS.CACHED_VERIFIED ||
          currentStatus.status === CACHE_STATUS.CACHED_UNVERIFIED) {
        return currentStatus;
      }
    }

    const policy = options.networkPolicy || this.networkPolicy;
    if (policy && policy.isOffline()) {
      throw new TaviNetworkError(`Model artifact download blocked: Offline mode active. Cannot download '${modelDef.modelId}'`, {
        code: 'OFFLINE_VIOLATION_BLOCKED',
        stage: 'model_download',
        action: 'Run in online mode or provide the required local cached assets.',
        blocking: true,
        details: {
          operation: 'model_download',
          modelId: modelDef.modelId,
          artifactUrl: modelDef.artifactUrl
        }
      });
    }

    // Offline enforcement: never attempt download when offline=true
    if (offline) {
      if (currentStatus.status === CACHE_STATUS.CHECKSUM_MISMATCH ||
          currentStatus.status === CACHE_STATUS.SIZE_MISMATCH) {
        throw new CacheError(`MODEL_CHECKSUM_MISMATCH: Cached artifact for '${modelDef.modelId}' is corrupted/mismatched and network download is prohibited in offline mode.`, 'MODEL_CHECKSUM_MISMATCH');
      }
      throw new CacheError(`MODEL_NOT_CACHED: Model '${modelDef.modelId}' is not cached locally and network download is prohibited in offline mode.`, 'MODEL_NOT_CACHED');
    }

    if (policy && modelDef.artifactUrl) {
      policy.assertAllowed(modelDef.artifactUrl, { stage: 'model_download', provider: modelDef.engine });
    }

    // URL validation
    if (!modelDef.artifactUrl || !validateArtifactUrl(modelDef.artifactUrl, this.allowedDomains)) {
      throw new CacheError(`MODEL_DOWNLOAD_FAILED: Invalid or disallowed artifact URL '${modelDef.artifactUrl}' for model '${modelDef.modelId}'.`, 'MODEL_DOWNLOAD_FAILED');
    }

    const modelDir = this.getModelDirectory(modelDef);
    const finalArtifactPath = this.getCachePath(modelDef);
    const tempPartPath = `${finalArtifactPath}.part`;
    const lockFilePath = path.join(modelDir, '.download.lock');

    // Create target directory
    fs.mkdirSync(modelDir, { recursive: true });

    // Cross-process cooperative file lock
    const lockAcquired = this._acquireFileLock(lockFilePath);
    if (!lockAcquired) {
      throw new CacheError(`MODEL_CACHE_INVALID: Failed to acquire lock for model '${modelDef.modelId}'; another process is currently downloading it.`, 'MODEL_CACHE_INVALID');
    }

    try {
      // Discard previous partial file to ensure clean restart
      if (fs.existsSync(tempPartPath)) {
        try { fs.unlinkSync(tempPartPath); } catch (_) {}
      }

      // Execute download via injected or default downloader
      if (typeof this.downloader !== 'function') {
        throw new CacheError(`MODEL_DOWNLOAD_FAILED: No downloader function configured on ModelCacheManager for model '${modelDef.modelId}'.`, 'MODEL_DOWNLOAD_FAILED');
      }

      await this.downloader(modelDef.artifactUrl, tempPartPath, modelDef);

      if (!fs.existsSync(tempPartPath)) {
        throw new CacheError(`MODEL_DOWNLOAD_FAILED: Downloader finished but temporary artifact was not created at '${tempPartPath}'.`, 'MODEL_DOWNLOAD_FAILED');
      }

      // Validate byte size if known in registry
      const actualSize = fs.statSync(tempPartPath).size;
      if (typeof modelDef.sizeBytes === 'number' && actualSize !== modelDef.sizeBytes) {
        try { fs.unlinkSync(tempPartPath); } catch (_) {}
        throw new CacheError(`MODEL_DOWNLOAD_FAILED: Downloaded artifact size (${actualSize} bytes) does not match expected size (${modelDef.sizeBytes} bytes).`, 'MODEL_DOWNLOAD_FAILED');
      }

      // Compute actual SHA-256 on .part file
      const computedHash = computeFileChecksum(tempPartPath);

      // Validate authoritative checksum if available in registry
      if (modelDef.checksumSha256) {
        if (computedHash.toLowerCase() !== modelDef.checksumSha256.toLowerCase()) {
          try { fs.unlinkSync(tempPartPath); } catch (_) {}
          throw new CacheError(`MODEL_CHECKSUM_MISMATCH: Computed SHA-256 (${computedHash}) does not match authoritative registry checksum (${modelDef.checksumSha256}).`, 'MODEL_CHECKSUM_MISMATCH');
        }
      }

      // Atomic rename from .part to final artifact location
      fs.renameSync(tempPartPath, finalArtifactPath);

      // Write cache metadata
      const verificationStatus = modelDef.checksumSha256
        ? VERIFICATION_STATUS.AUTHORITATIVE_VERIFIED
        : VERIFICATION_STATUS.COMPUTED_LOCAL_UNTRUSTED;

      const cacheMetadata = {
        modelId: modelDef.modelId,
        engine: modelDef.engine,
        languageCode: modelDef.languageCode,
        artifactPath: finalArtifactPath,
        sizeBytes: actualSize,
        computedSha256: computedHash,
        expectedSha256: modelDef.checksumSha256 || null,
        verificationStatus,
        downloadedAt: new Date().toISOString()
      };

      fs.writeFileSync(path.join(modelDir, 'metadata.json'), JSON.stringify(cacheMetadata, null, 2), 'utf8');

      if (verificationStatus === VERIFICATION_STATUS.AUTHORITATIVE_VERIFIED) {
        fs.writeFileSync(path.join(modelDir, '.verified.sha256'), `${computedHash}|${cacheMetadata.downloadedAt}`, 'utf8');
      }

      return this.getCacheStatus(modelDef);
    } finally {
      this._releaseFileLock(lockFilePath);
    }
  }

  /**
   * Compares the computed hash of a local file against an expected hash.
   * 
   * @param {string} filePath 
   * @param {string} expectedHash 
   * @returns {boolean}
   */
  verifyChecksum(filePath, expectedHash) {
    if (!expectedHash || typeof expectedHash !== 'string') return false;
    try {
      const computed = computeFileChecksum(filePath);
      return computed.toLowerCase() === expectedHash.trim().toLowerCase();
    } catch (_) {
      return false;
    }
  }

  /**
   * Computes SHA-256 for a file.
   * 
   * @param {string} filePath 
   * @returns {string}
   */
  computeChecksum(filePath) {
    return computeFileChecksum(filePath);
  }

  /**
   * Marks a model artifact verified with explicit external verification data.
   * 
   * @param {Object|string} model 
   * @param {{ expectedSha256: string, verifiedBy?: string }} verificationData 
   * @returns {Object} Updated cache status
   */
  markVerified(model, verificationData) {
    const modelDef = this._resolveModelDef(model);
    const artifactPath = this.getCachePath(modelDef);
    const modelDir = this.getModelDirectory(modelDef);

    if (!fs.existsSync(artifactPath)) {
      throw new CacheError(`MODEL_NOT_CACHED: Cannot mark un-cached model '${modelDef.modelId}' as verified.`, 'MODEL_NOT_CACHED');
    }

    if (!verificationData || !verificationData.expectedSha256) {
      throw new CacheError('MODEL_CACHE_INVALID: Verification data must include expectedSha256', 'MODEL_CACHE_INVALID');
    }

    const computed = computeFileChecksum(artifactPath);
    if (computed.toLowerCase() !== verificationData.expectedSha256.trim().toLowerCase()) {
      throw new CacheError(`MODEL_CHECKSUM_MISMATCH: Computed hash (${computed}) does not match expected hash (${verificationData.expectedSha256}).`, 'MODEL_CHECKSUM_MISMATCH');
    }

    const now = new Date().toISOString();
    fs.writeFileSync(path.join(modelDir, '.verified.sha256'), `${computed}|${now}`, 'utf8');
    return this.getCacheStatus(modelDef);
  }

  /**
   * Invalidates a model in cache by deleting verification flag and quarantine metadata.
   * 
   * @param {Object|string} model 
   * @returns {boolean} True if invalidated
   */
  invalidate(model) {
    const modelDef = this._resolveModelDef(model);
    const modelDir = this.getModelDirectory(modelDef);
    const flagPath = path.join(modelDir, '.verified.sha256');
    let removed = false;
    if (fs.existsSync(flagPath)) {
      try {
        fs.unlinkSync(flagPath);
        removed = true;
      } catch (_) {}
    }
    return removed;
  }

  /**
   * Evicts a model completely from local cache, deleting its directory and artifacts.
   * 
   * @param {Object|string} model 
   * @returns {boolean} True if evicted
   */
  evict(model) {
    const modelDef = this._resolveModelDef(model);
    const modelDir = this.getModelDirectory(modelDef);
    if (fs.existsSync(modelDir)) {
      try {
        fs.rmSync(modelDir, { recursive: true, force: true });
        return true;
      } catch (_) {
        return false;
      }
    }
    return false;
  }

  /**
   * Internal helper to acquire a simple cross-process file lock.
   * 
   * @param {string} lockFilePath
   * @returns {boolean}
   * @private
   */
  _acquireFileLock(lockFilePath) {
    const maxRetries = 10;
    const retryDelayMs = 50;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const fd = fs.openSync(lockFilePath, 'wx');
        fs.writeSync(fd, `${process.pid}|${Date.now()}`);
        fs.closeSync(fd);
        return true;
      } catch (/** @type {any} */ err) {
        if (err.code === 'EEXIST') {
          // Check for stale lock (older than 60s)
          try {
            const stat = fs.statSync(lockFilePath);
            if (Date.now() - stat.mtimeMs > 60000) {
              fs.unlinkSync(lockFilePath);
              continue;
            }
          } catch (_) {}
          // Wait briefly before retrying
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelayMs);
        } else {
          return false;
        }
      }
    }
    return false;
  }

  /**
   * Internal helper to release cross-process file lock.
   * 
   * @param {string} lockFilePath
   * @private
   */
  _releaseFileLock(lockFilePath) {
    if (fs.existsSync(lockFilePath)) {
      try { fs.unlinkSync(lockFilePath); } catch (_) {}
    }
  }

  /**
   * Resolves a model definition from a string or object.
   * 
   * @param {any} model
   * @returns {any}
   * @private
   */
  _resolveModelDef(model) {
    if (!model) {
      throw new CacheError('MODEL_CACHE_INVALID: Model definition or identifier cannot be null/undefined', 'MODEL_CACHE_INVALID');
    }
    if (typeof model === 'string') {
      const def = getModel(model.trim());
      if (def) return def;
      // Synthesize minimal model def if not in registry
      return {
        modelId: model.trim(),
        engine: model.includes(':') ? model.split(':')[0] : 'common',
        modelName: `${sanitizeModelDirectoryName(model)}.bin`,
        sizeBytes: null,
        checksumSha256: null,
        artifactUrl: null
      };
    }
    if (typeof model === 'object' && model.modelId) {
      return model;
    }
    throw new CacheError('MODEL_CACHE_INVALID: Unrecognized model parameter format', 'MODEL_CACHE_INVALID');
  }
}

/**
 * Default singleton instance of ModelCacheManager.
 */
export const defaultModelCacheManager = new ModelCacheManager();

export default ModelCacheManager;
