import { TTSProvider, TTSOptions, TTSSynthesizeResult } from './index.js';
import { ModelDefinition } from '../models/modelRegistry.js';
import { ModelCacheManager } from '../cache/ModelCacheManager.js';

export interface PiperTTSAdapterOptions {
  executablePath?: string;
  piperPath?: string;
  modelRegistry?: any;
  cacheManager?: ModelCacheManager;
  policyEngine?: any;
  processRunner?: (params: PiperProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  timeoutMs?: number;
  [key: string]: any;
}

export interface PiperSynthesizeOptions extends TTSOptions {
  modelId?: string;
  voiceId?: string;
  voice?: string;
  outputPath?: string;
  outputDir?: string;
  offline?: boolean;
  speakerId?: number;
  timeoutMs?: number;
  executionMode?: string;
  policyProfile?: string;
  policyEvaluation?: any;
}

export interface PiperSynthesizeResult extends TTSSynthesizeResult {
  providerId: 'piper';
  engine: 'piper';
  modelId: string;
  languageCode: string;
  sampleRate: number;
  channels: number;
}

export interface PiperProcessParams {
  executablePath: string;
  args: string[];
  text: string;
  outputPath: string;
  timeoutMs: number;
  modelDef: ModelDefinition;
}

import { TaviTTSError } from '../errors/index.d.ts';

export declare class PiperError extends TaviTTSError {
  code: string;
  provider: 'piper';
  engine: 'piper';
  fallbackAttempted: false;
  details: Record<string, any>;
  language: string | null;
  modelId: string | null;
  reason: string;
  constructor(code: string, message: string, details?: Record<string, any>);
}

export declare function findPiperExecutable(customPath?: string | null): string | null;
export declare function verifyPiperExecutable(executablePath: string): boolean;
export declare function validateWavOutput(
  filePath: string,
  expectedSampleRate?: number | null
): { valid: boolean; duration: number; sampleRate: number; channels: number };

export declare function defaultProcessRunner(
  params: PiperProcessParams
): Promise<{ exitCode: number; durationMs: number }>;

export declare class PiperTTSAdapter extends TTSProvider {
  providerId: 'piper';
  engine: 'piper';
  modelRegistry: any;
  cacheManager: ModelCacheManager;
  customExecutablePath: string | null;
  processRunner: (params: PiperProcessParams) => Promise<{ exitCode: number; durationMs: number }>;
  timeoutMs: number;

  constructor(options?: PiperTTSAdapterOptions);
  supportsLanguage(language: string): boolean;
  getExecutablePath(): string | null;
  isEngineAvailable(): boolean;
  resolvePiperModel(language: string, options?: PiperSynthesizeOptions): ModelDefinition;
  synthesize(
    text: string,
    language: string,
    options?: PiperSynthesizeOptions
  ): Promise<PiperSynthesizeResult>;
}

export default PiperTTSAdapter;
