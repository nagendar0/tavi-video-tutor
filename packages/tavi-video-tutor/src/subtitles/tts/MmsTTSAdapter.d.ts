import { TTSProvider, TTSOptions, TTSSynthesizeResult } from './index.js';
import { ModelDefinition } from '../models/modelRegistry.js';
import { ModelCacheManager } from '../cache/ModelCacheManager.js';
import { PolicyEngine, PolicyEvaluationResult } from '../policy/PolicyEngine.js';

export interface MmsTTSAdapterOptions {
  executablePath?: string;
  runtimePath?: string;
  mmsPath?: string;
  modelRegistry?: any;
  cacheManager?: ModelCacheManager;
  policyEngine?: PolicyEngine;
  runtimeRunner?: (params: MmsProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  processRunner?: (params: MmsProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  timeoutMs?: number;
  requireAuxiliaryFiles?: boolean;
  [key: string]: any;
}

export interface MmsSynthesizeOptions extends TTSOptions {
  modelId?: string;
  voiceId?: string;
  voice?: string;
  outputPath?: string;
  outputDir?: string;
  offline?: boolean;
  executionMode?: 'COMMERCIAL' | 'RESEARCH';
  policyProfile?: 'RELAXED' | 'STRICT';
  policyEvaluation?: PolicyEvaluationResult;
  requireAuxiliaryFiles?: boolean;
  speed?: number;
  timeoutMs?: number;
}

export interface MmsSynthesizeResult extends TTSSynthesizeResult {
  providerId: 'mms';
  engine: 'mms';
  modelId: string;
  languageCode: string;
  sampleRate: number;
  channels: number;
}

export interface MmsProcessParams {
  runtimePath: string;
  args: string[];
  text: string;
  outputPath: string;
  timeoutMs: number;
  modelDef: ModelDefinition;
}

import { TaviTTSError } from '../errors/index.d.ts';

export declare class MmsError extends TaviTTSError {
  code: string;
  provider: 'mms';
  engine: 'mms';
  fallbackAttempted: false;
  details: Record<string, any>;
  language: string | null;
  modelId: string | null;
  reason: string;
  constructor(code: string, message: string, details?: Record<string, any>);
}

export declare function findMmsRuntime(customPath?: string | null): string | null;
export declare function verifyMmsRuntime(runtimePath: string): boolean;
export declare function validateWavOutput(
  filePath: string,
  expectedSampleRate?: number | null
): { valid: boolean; duration: number; sampleRate: number; channels: number };

export declare function defaultMmsRuntimeRunner(
  params: MmsProcessParams
): Promise<{ exitCode: number; durationMs: number }>;

export declare class MmsTTSAdapter extends TTSProvider {
  providerId: 'mms';
  engine: 'mms';
  modelRegistry: any;
  cacheManager: ModelCacheManager;
  policyEngine: PolicyEngine;
  customRuntimePath: string | null;
  runtimeRunner: (params: MmsProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  timeoutMs: number;
  requireAuxiliaryFiles: boolean;
  sessionCache: Map<string, any>;
  initLocks: Map<string, Promise<any>>;

  constructor(options?: MmsTTSAdapterOptions);
  supportsLanguage(language: string): boolean;
  getRuntimePath(): string | null;
  isEngineAvailable(): boolean;
  resolveMmsModel(language: string, options?: MmsSynthesizeOptions): ModelDefinition;
  synthesize(
    text: string,
    language: string,
    options?: MmsSynthesizeOptions
  ): Promise<MmsSynthesizeResult>;
}

export default MmsTTSAdapter;
