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
}

export declare class TTSError extends Error {
  code: string;
  details: Record<string, any>;
  constructor(code: string, message: string, details?: Record<string, any>);
}

export declare class TTSProvider {
  options: Record<string, any>;
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

export declare class AzureNeuralTTSProvider extends EdgeTTSProvider {
  constructor(options?: Record<string, any>);
}

export declare class AutoTTSProvider extends TTSProvider {
  constructor(options?: Record<string, any>);
}

export declare function createTTSProvider(options?: Record<string, any>): TTSProvider;

export declare function isNeuralLanguageSupported(language: string): boolean;
export declare function isNeuralVoiceSupported(voiceId: string): boolean;
export declare function resolveNeuralVoice(language: string, options?: Record<string, any>): {
  voiceId: string;
  locale: string;
  gender: string;
  name: string;
} | null;
