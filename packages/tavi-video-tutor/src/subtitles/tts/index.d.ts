export interface TTSOptions {
  voiceId?: string;
  gender?: 'female' | 'male';
  pitchOffset?: number;
  rateOffset?: number;
  outputDir?: string;
  timeoutMs?: number;
  maxRetries?: number;
  [key: string]: any;
}

export interface TTSSynthesizeResult {
  audioPath: string;
  duration: number;
  format: string;
  voiceId: string;
  diagnostics?: Record<string, any>;
  fallbackUsed?: boolean;
}

import { TaviTTSError, TaviProviderError } from '../errors/index.d.ts';

export declare class TTSError extends TaviTTSError {
  code: string;
  details: Record<string, any>;
  constructor(code: string, message: string, details?: Record<string, any>);
}

export declare class FactoryError extends TaviProviderError {
  code: string;
  provider: string | null;
  fallbackAttempted: boolean;
  details: Record<string, any>;
  cause?: Error;
  constructor(code: string, message: string, details?: Record<string, any>);
}

export declare class TTSProvider {
  options: Record<string, any>;
  providerId?: string;
  engine?: string;
  constructor(options?: Record<string, any>);
  synthesize(text: string, language: string, options?: TTSOptions): Promise<TTSSynthesizeResult>;
  supportsLanguage(language: string): boolean;
}

export declare class NodeTTSProvider extends TTSProvider {
  constructor(options?: Record<string, any>);
}

export declare class EdgeTTSProvider extends TTSProvider {
  constructor(options?: Record<string, any>);
  supportsVoice(voiceId: string): boolean;
}

export declare class AzureNeuralTTSProvider extends TTSProvider {
  constructor(options?: Record<string, any>);
}

export declare class AutoTTSProvider extends TTSProvider {
  constructor(options?: Record<string, any>);
}

export declare class ExplicitFallbackTTSProvider extends TTSProvider {
  constructor(params: {
    primaryProvider: TTSProvider;
    primaryProviderId: string;
    fallbackConfig: Record<string, any>;
    factoryOptions: Record<string, any>;
  });
}

export declare function normalizeTTSProviderId(rawMode: string): string | null;
export declare function getTTSProviderCapabilities(): Record<string, any>;
export declare function resolveTTSProvider(options?: Record<string, any> | string): TTSProvider;
export declare function createTTSProvider(options?: Record<string, any> | string): TTSProvider;

export declare const CLOUD_PROVIDERS: ReadonlySet<string>;
export declare const LOCAL_PROVIDERS: ReadonlySet<string>;

export declare function isNeuralLanguageSupported(language: string): boolean;
export declare function isNeuralVoiceSupported(voiceId: string): boolean;
export declare function resolveNeuralVoice(language: string, options?: Record<string, any>): {
  voiceId: string;
  locale: string;
  gender: string;
  name: string;
} | null;

export {
  PiperTTSAdapter,
  PiperTTSAdapterOptions,
  PiperSynthesizeOptions,
  PiperSynthesizeResult,
  PiperProcessParams,
  PiperError,
  findPiperExecutable,
  verifyPiperExecutable,
  validateWavOutput
} from './PiperTTSAdapter.js';

export {
  KokoroTTSAdapter,
  KokoroTTSAdapterOptions,
  KokoroSynthesizeOptions,
  KokoroSynthesizeResult,
  KokoroProcessParams,
  KokoroError,
  findKokoroRuntime,
  verifyKokoroRuntime
} from './KokoroTTSAdapter.js';

export {
  MmsTTSAdapter,
  MmsTTSAdapterOptions,
  MmsSynthesizeOptions,
  MmsSynthesizeResult,
  MmsProcessParams,
  MmsError,
  findMmsRuntime,
  verifyMmsRuntime
} from './MmsTTSAdapter.js';
