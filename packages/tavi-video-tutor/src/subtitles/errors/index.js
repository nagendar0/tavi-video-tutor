// @ts-check

export {
  ErrorCatalog,
  ERROR_CATEGORIES,
  CLI_EXIT_CODES,
  ERROR_DEFINITIONS,
  getErrorDefinition,
  getExitCodeForError,
  mapHttpStatusToErrorCode
} from './ErrorCatalog.js';

export {
  TaviError,
  TaviConfigurationError,
  TaviModelError,
  TaviCacheError,
  TaviPolicyError,
  TaviProviderError,
  TaviTranslationError,
  TaviTTSError,
  TaviPreflightError,
  TaviPipelineError,
  TaviSecurityError,
  TaviAudioError,
  TaviNetworkError,
  redactString,
  redactSecrets,
  safeSerializeCause,
  toTaviError,
  formatErrorJson,
  formatErrorCli
} from './TaviError.js';

export { default } from './TaviError.js';
