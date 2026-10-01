export type ErrorCategory =
  | 'CONFIGURATION'
  | 'SYSTEM'
  | 'FILESYSTEM'
  | 'BINARY'
  | 'MODEL'
  | 'CACHE'
  | 'TTS'
  | 'TRANSLATION'
  | 'PROVIDER'
  | 'POLICY'
  | 'CREDENTIAL'
  | 'NETWORK'
  | 'PREFLIGHT'
  | 'AUDIO'
  | 'PIPELINE'
  | 'SECURITY';

export declare const ERROR_CATEGORIES: Readonly<Record<ErrorCategory, ErrorCategory>>;

export declare const CLI_EXIT_CODES: Readonly<{
  SUCCESS: 0;
  GENERAL_ERROR: 1;
  INVALID_CONFIG: 2;
  DEPENDENCY_MISSING: 3;
  MODEL_OR_CACHE_ERROR: 4;
  POLICY_OR_SECURITY_RESTRICTION: 5;
  PROVIDER_OR_NETWORK_ERROR: 6;
}>;

export interface ErrorDefinition {
  code: string;
  category: ErrorCategory;
  retryable: boolean;
  blocking: boolean;
  exitCode: number;
  defaultMessage: string;
  defaultAction: string;
}

export declare const ERROR_DEFINITIONS: Readonly<Record<string, ErrorDefinition>>;
export declare function getErrorDefinition(code?: string): ErrorDefinition;
export declare function getExitCodeForError(err: any): number;
export declare function mapHttpStatusToErrorCode(statusCode: number, options?: { isNetworkError?: boolean; isBadResponse?: boolean }): string;

export interface TaviErrorOptions {
  name?: string;
  code?: string;
  category?: ErrorCategory | string;
  provider?: string | null;
  engine?: string | null;
  languageCode?: string | null;
  language?: string | null;
  modelId?: string | null;
  stage?: string | null;
  retryable?: boolean;
  blocking?: boolean;
  action?: string | null;
  details?: Record<string, any>;
  cause?: Error | any;
  message?: string;
  reason?: string;
}

export declare class TaviError extends Error {
  name: string;
  code: string;
  category: ErrorCategory | string;
  provider: string | null;
  engine: string | null;
  languageCode: string | null;
  modelId: string | null;
  stage: string | null;
  retryable: boolean;
  blocking: boolean;
  action: string | null;
  details: Record<string, any>;
  cause?: any;

  constructor(messageOrOptions?: string | TaviErrorOptions, options?: TaviErrorOptions);
  toJSON(): Record<string, any>;
  toString(): string;
}

export declare class TaviConfigurationError extends TaviError {}
export declare class TaviModelError extends TaviError {}
export declare class TaviCacheError extends TaviError {}
export declare class TaviPolicyError extends TaviError {}
export declare class TaviProviderError extends TaviError {}
export declare class TaviTranslationError extends TaviError {}
export declare class TaviTTSError extends TaviError {}
export declare class TaviPreflightError extends TaviError {
  preflight?: any;
}
export declare class TaviPipelineError extends TaviError {}
export declare class TaviSecurityError extends TaviError {}
export declare class TaviAudioError extends TaviError {}
export declare class TaviNetworkError extends TaviError {}

export declare function redactString(str: string): string;
export declare function redactSecrets<T>(target: T, depth?: number, seen?: WeakSet<object>): T;
export declare function safeSerializeCause(cause: any, depth?: number): Record<string, any> | null;
export declare function toTaviError(err: any, defaultOptions?: TaviErrorOptions): TaviError;
export declare function formatErrorJson(err: any): string;
export declare function formatErrorCli(err: any): string;

export default TaviError;
