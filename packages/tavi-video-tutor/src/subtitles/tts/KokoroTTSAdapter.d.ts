import { TTSProvider, TTSOptions, TTSSynthesizeResult } from './index.js';
import { ModelDefinition } from '../models/modelRegistry.js';
import { ModelCacheManager } from '../cache/ModelCacheManager.js';

export interface KokoroTTSAdapterOptions {
  executablePath?: string;
  runtimePath?: string;
  kokoroPath?: string;
  modelRegistry?: any;
  cacheManager?: ModelCacheManager;
  runtimeRunner?: (params: KokoroProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  processRunner?: (params: KokoroProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  timeoutMs?: number;
  [key: string]: any;
}

export interface KokoroSynthesizeOptions extends TTSOptions {
  modelId?: string;
  voiceId?: string;
  voice?: string;
  outputPath?: string;
  outputDir?: string;
  offline?: boolean;
  speakerId?: number;
  speed?: number;
  timeoutMs?: number;
}

export interface KokoroSynthesizeResult extends TTSSynthesizeResult {
  providerId: 'kokoro';
  engine: 'kokoro';
  modelId: string;
  languageCode: string;
  sampleRate: number;
  channels: number;
}

export interface KokoroProcessParams {
  runtimePath: string;
  args: string[];
  text: string;
  outputPath: string;
  timeoutMs: number;
  modelDef: ModelDefinition;
}

import { TaviTTSError } from '../errors/index.d.ts';

export declare class KokoroError extends TaviTTSError {
  code: string;
  provider: 'kokoro';
  engine: 'kokoro';
  fallbackAttempted: false;
  details: Record<string, any>;
  language: string | null;
  modelId: string | null;
  reason: string;
  constructor(code: string, message: string, details?: Record<string, any>);
}

export declare function findKokoroRuntime(customPath?: string | null): string | null;
export declare function verifyKokoroRuntime(runtimePath: string): boolean;
export declare function validateWavOutput(
  filePath: string,
  expectedSampleRate?: number | null
): { valid: boolean; duration: number; sampleRate: number; channels: number };

export declare function defaultKokoroRuntimeRunner(
  params: KokoroProcessParams
): Promise<{ exitCode: number; durationMs: number }>;

export declare class KokoroTTSAdapter extends TTSProvider {
  providerId: 'kokoro';
  engine: 'kokoro';
  modelRegistry: any;
  cacheManager: ModelCacheManager;
  customRuntimePath: string | null;
  runtimeRunner: (params: KokoroProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  timeoutMs: number;
  sessionCache: Map<string, any>;
  initLocks: Map<string, Promise<any>>;

  constructor(options?: KokoroTTSAdapterOptions);
  supportsLanguage(language: string): boolean;
  getRuntimePath(): string | null;
  isEngineAvailable(): boolean;
  resolveKokoroModel(language: string, options?: KokoroSynthesizeOptions): ModelDefinition;
  synthesize(
    text: string,
    language: string,
    options?: KokoroSynthesizeOptions
  ): Promise<KokoroSynthesizeResult>;
}

export default KokoroTTSAdapter;
