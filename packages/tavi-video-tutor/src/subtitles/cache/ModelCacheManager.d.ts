import { ModelDefinition } from '../models/modelRegistry.d.ts';

export type CacheStatus =
  | 'NOT_CACHED'
  | 'PARTIAL'
  | 'CACHED_UNVERIFIED'
  | 'CACHED_VERIFIED'
  | 'CHECKSUM_MISMATCH'
  | 'SIZE_MISMATCH'
  | 'INVALID';

export type VerificationStatus =
  | 'AUTHORITATIVE_VERIFIED'
  | 'COMPUTED_LOCAL_UNTRUSTED'
  | 'CHECKSUM_MISMATCH'
  | 'TRUNCATED_OR_SIZE_MISMATCH'
  | 'UNVERIFIED';

export declare const CACHE_STATUS: Readonly<Record<CacheStatus, CacheStatus>>;
export declare const VERIFICATION_STATUS: Readonly<Record<VerificationStatus, VerificationStatus>>;

import { TaviCacheError } from '../errors/index.d.ts';

export declare class CacheError extends TaviCacheError {
  code: string;
  constructor(message: string, code: string);
}

export interface ModelCacheStatusReport {
  status: CacheStatus;
  modelId: string;
  path: string;
  exists: boolean;
  sizeBytes: number | null;
  expectedSizeBytes: number | null;
  computedSha256: string | null;
  expectedSha256: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  metadataPath: string | null;
}

export interface EnsureModelOptions {
  offline?: boolean;
  forceDownload?: boolean;
  networkPolicy?: any;
  executionMode?: string;
  policyProfile?: string;
  policyEngine?: any;
}

export interface ModelCacheManagerOptions {
  cacheDir?: string;
  downloader?: (artifactUrl: string, destinationPath: string, model: ModelDefinition) => Promise<{ bytesWritten: number } | void>;
  allowedDomains?: string[];
  networkPolicy?: any;
  policyEngine?: any;
}

export declare class ModelCacheManager {
  cacheDir: string;
  networkPolicy?: any;
  policyEngine?: any;
  constructor(options?: ModelCacheManagerOptions);
  getModelDirectory(model: ModelDefinition | string): string;
  getCachePath(model: ModelDefinition | string): string;
  isCached(model: ModelDefinition | string): boolean;
  getCacheStatus(model: ModelDefinition | string): ModelCacheStatusReport;
  ensureModel(model: ModelDefinition | string, options?: EnsureModelOptions): Promise<ModelCacheStatusReport>;
  downloadArtifact(model: ModelDefinition | string, options?: EnsureModelOptions): Promise<ModelCacheStatusReport>;
  verifyChecksum(filePath: string, expectedHash: string): boolean;
  computeChecksum(filePath: string): string;
  markVerified(model: ModelDefinition | string, verificationData: { expectedSha256: string; verifiedBy?: string }): ModelCacheStatusReport;
  invalidate(model: ModelDefinition | string): boolean;
  evict(model: ModelDefinition | string): boolean;
}

export declare const defaultModelCacheManager: ModelCacheManager;
export declare function getDefaultCacheDir(): string;
export declare function computeModelCacheKey(model: ModelDefinition | object): string;
export declare function computeFileChecksum(filePath: string, algorithm?: string): string;
export declare function sanitizeModelDirectoryName(modelId: string): string;
export declare function validateArtifactUrl(urlString: string, allowedDomains?: string[] | null): boolean;

export default ModelCacheManager;
