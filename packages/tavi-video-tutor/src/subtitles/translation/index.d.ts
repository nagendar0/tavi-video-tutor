export interface TranslationSegment {
  id?: string;
  segmentId?: string;
  start?: number;
  startTime?: number;
  end?: number;
  endTime?: number;
  text?: string;
  originalText?: string;
  translatedText?: string;
  speakerId?: string;
  [key: string]: any;
}

import { TaviTranslationError } from '../errors/index.d.ts';

export declare class TranslationError extends TaviTranslationError {
  name: 'TranslationError';
  code: string;
  provider: string | null;
  fallbackAttempted: boolean;
  statusCode: number | null;
  sourceLanguage: string | null;
  targetLanguage: string | null;
  details: Record<string, any>;
  constructor(message: string, code: string, details?: Record<string, any>);
}

export declare const TRANSLATION_ERROR_CODES: {
  readonly TRANSLATION_MODEL_NOT_CACHED: 'TRANSLATION_MODEL_NOT_CACHED';
  readonly TRANSLATION_MODEL_INVALID: 'TRANSLATION_MODEL_INVALID';
  readonly TRANSLATION_ENGINE_NOT_AVAILABLE: 'TRANSLATION_ENGINE_NOT_AVAILABLE';
  readonly TRANSLATION_ENGINE_FAILED: 'TRANSLATION_ENGINE_FAILED';
  readonly TRANSLATION_PROVIDER_UNAVAILABLE: 'TRANSLATION_PROVIDER_UNAVAILABLE';
  readonly TRANSLATION_PROVIDER_QUOTA_EXCEEDED: 'TRANSLATION_PROVIDER_QUOTA_EXCEEDED';
  readonly TRANSLATION_PROVIDER_BAD_RESPONSE: 'TRANSLATION_PROVIDER_BAD_RESPONSE';
  readonly TRANSLATION_LANGUAGE_UNSUPPORTED: 'TRANSLATION_LANGUAGE_UNSUPPORTED';
  readonly TRANSLATION_INPUT_INVALID: 'TRANSLATION_INPUT_INVALID';
  readonly TRANSLATION_NETWORK_REQUIRED: 'TRANSLATION_NETWORK_REQUIRED';
  readonly OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN: 'OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN';
};

export declare class TranslationProvider {
  id: string;
  isOfflineCapable: boolean;
  supports(sourceLanguage: string, targetLanguage: string): boolean;
  translateSegments(segments: TranslationSegment[], sourceLanguage?: string, targetLanguage?: string, options?: Record<string, any>): Promise<TranslationSegment[]>;
}

export declare class LocalNllbAdapter extends TranslationProvider {
  id: 'nllb';
  isOfflineCapable: true;
  constructor(options?: Record<string, any>);
  getModelDirectory(): string;
  supports(sourceLanguage: string, targetLanguage: string): boolean;
  translateSegments(segments: TranslationSegment[], sourceLanguage?: string, targetLanguage?: string, options?: Record<string, any>): Promise<TranslationSegment[]>;
}

export declare function verifyNllbArtifacts(modelDir: string): {
  valid: boolean;
  code?: string;
  reason?: string;
  missing?: string[];
};

export declare class ExternalTranslationAdapter extends TranslationProvider {
  id: string;
  isOfflineCapable: false;
  constructor(options?: Record<string, any>);
  supports(sourceLanguage: string, targetLanguage: string): boolean;
  translateSegments(segments: TranslationSegment[], sourceLanguage?: string, targetLanguage?: string, options?: Record<string, any>): Promise<TranslationSegment[]>;
}

export declare class TranslationRouter {
  mode: string;
  provider: string | null;
  allowFallback: boolean;
  localAdapter: LocalNllbAdapter;
  externalAdapter: ExternalTranslationAdapter;
  constructor(options?: Record<string, any>);
  supports(sourceLang: string, targetLang: string): boolean;
  translateSegments(segments: TranslationSegment[], sourceLang: string, targetLang: string, options?: Record<string, any>): Promise<TranslationSegment[]>;
}

export declare function computeTranslationCacheKey(params?: {
  text?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  provider?: string;
  model?: string;
  version?: string;
}): string;

export declare function computeLegacyCacheKey(
  text: string,
  srcLang: string,
  tgtLang: string,
  providerId?: string,
  modelId?: string
): string;

export declare class TranslationCache {
  constructor(options?: Record<string, any>);
  load(): void;
  save(): void;
  get(query: { text: string; sourceLanguage: string; targetLanguage: string; provider?: string; model?: string; version?: string }): string | null;
  set(query: { text: string; sourceLanguage: string; targetLanguage: string; provider?: string; model?: string; version?: string }, translatedText: string): void;
  has(query: { text: string; sourceLanguage: string; targetLanguage: string; provider?: string; model?: string; version?: string }): boolean;
  clear(): void;
  size(): number;
}

export declare function getTranslationCache(options?: Record<string, any>): TranslationCache;

export interface TranslationLanguageRecord {
  languageCode: string;
  name: string;
  bcp47: string;
  nllbCode: string | null;
  offlineSupported: boolean;
  externalProviderSupport: boolean;
  translationSupported: boolean;
  notes: string;
}

export declare const TRANSLATION_LANGUAGE_MATRIX: readonly TranslationLanguageRecord[];
export declare function getLanguageTranslationCapability(languageCode: string): TranslationLanguageRecord | null;
export declare function isNllbLanguageSupported(languageCode: string): boolean;
export declare function getNllbLanguageCode(languageCode: string): string | null;
export declare function getTranslationMatrix(): readonly TranslationLanguageRecord[];
