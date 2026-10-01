// @ts-check

/**
 * Standard error categories across all TAVI subsystems.
 * @readonly
 * @enum {string}
 */
export const ERROR_CATEGORIES = Object.freeze({
  CONFIGURATION: 'CONFIGURATION',
  SYSTEM: 'SYSTEM',
  FILESYSTEM: 'FILESYSTEM',
  BINARY: 'BINARY',
  MODEL: 'MODEL',
  CACHE: 'CACHE',
  TTS: 'TTS',
  TRANSLATION: 'TRANSLATION',
  PROVIDER: 'PROVIDER',
  POLICY: 'POLICY',
  CREDENTIAL: 'CREDENTIAL',
  NETWORK: 'NETWORK',
  PREFLIGHT: 'PREFLIGHT',
  AUDIO: 'AUDIO',
  PIPELINE: 'PIPELINE',
  SECURITY: 'SECURITY'
});

/**
 * Deterministic CLI process exit codes.
 * Small stable mapping to preserve scripting compatibility.
 * @readonly
 * @enum {number}
 */
export const CLI_EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  INVALID_CONFIG: 2,
  DEPENDENCY_MISSING: 3,
  MODEL_OR_CACHE_ERROR: 4,
  POLICY_OR_SECURITY_RESTRICTION: 5,
  PROVIDER_OR_NETWORK_ERROR: 6
});

/**
 * @typedef {Object} ErrorDefinition
 * @property {string} code
 * @property {string} category
 * @property {boolean} retryable
 * @property {boolean} blocking
 * @property {number} exitCode
 * @property {string} defaultMessage
 * @property {string} defaultAction
 */

/**
 * Central Error Catalog definitions.
 * @type {Record<string, ErrorDefinition>}
 */
export const ERROR_DEFINITIONS = Object.freeze({
  // CONFIGURATION
  INVALID_CONFIGURATION: {
    code: 'INVALID_CONFIGURATION',
    category: ERROR_CATEGORIES.CONFIGURATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'The provided configuration is invalid or incomplete.',
    defaultAction: 'Verify options, flags, and configuration file settings.'
  },
  UNKNOWN_TTS_PROVIDER: {
    code: 'UNKNOWN_TTS_PROVIDER',
    category: ERROR_CATEGORIES.CONFIGURATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Requested TTS provider is unknown or unresolvable.',
    defaultAction: 'Select a valid provider (e.g., piper, kokoro, mms, system, edge, azure-byok).'
  },
  INVALID_POLICY_PROFILE: {
    code: 'INVALID_POLICY_PROFILE',
    category: ERROR_CATEGORIES.CONFIGURATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Specified policy profile is invalid.',
    defaultAction: 'Specify a valid policy profile: RELAXED or STRICT.'
  },

  // SYSTEM
  UNSUPPORTED_NODE_VERSION: {
    code: 'UNSUPPORTED_NODE_VERSION',
    category: ERROR_CATEGORIES.SYSTEM,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Current Node.js version is unsupported.',
    defaultAction: 'Upgrade Node.js to version 18.0.0 or higher (https://nodejs.org).'
  },

  // BINARY
  ENGINE_NOT_FOUND: {
    code: 'ENGINE_NOT_FOUND',
    category: ERROR_CATEGORIES.BINARY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Required runtime engine binary was not found.',
    defaultAction: 'Install or configure the required local binary and ensure it is on system PATH.'
  },
  ENGINE_EXECUTION_FAILED: {
    code: 'ENGINE_EXECUTION_FAILED',
    category: ERROR_CATEGORIES.BINARY,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Runtime engine execution failed.',
    defaultAction: 'Check engine arguments, execution logs, and runtime dependencies.'
  },
  ENGINE_TIMEOUT: {
    code: 'ENGINE_TIMEOUT',
    category: ERROR_CATEGORIES.BINARY,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Runtime engine execution timed out.',
    defaultAction: 'Increase timeout limits or inspect process resource constraints.'
  },
  FFMPEG_NOT_FOUND: {
    code: 'FFMPEG_NOT_FOUND',
    category: ERROR_CATEGORIES.BINARY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'FFmpeg executable was not found.',
    defaultAction: 'Install FFmpeg and ensure it is on system PATH or configured via FFMPEG_PATH.'
  },
  FFPROBE_NOT_FOUND: {
    code: 'FFPROBE_NOT_FOUND',
    category: ERROR_CATEGORIES.BINARY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'FFprobe executable was not found.',
    defaultAction: 'Install FFprobe and ensure it is on system PATH or configured via FFPROBE_PATH.'
  },

  // MODEL
  MODEL_NOT_FOUND: {
    code: 'MODEL_NOT_FOUND',
    category: ERROR_CATEGORIES.MODEL,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Requested model was not found in ModelRegistry.',
    defaultAction: 'Verify that the model ID or language code is registered in ModelRegistry.'
  },
  MODEL_NOT_CACHED: {
    code: 'MODEL_NOT_CACHED',
    category: ERROR_CATEGORIES.MODEL,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Required model is not cached locally.',
    defaultAction: 'Cache the required model or disable offline mode to permit download.'
  },
  MODEL_CHECKSUM_MISMATCH: {
    code: 'MODEL_CHECKSUM_MISMATCH',
    category: ERROR_CATEGORIES.MODEL,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Cached model artifact failed checksum integrity verification.',
    defaultAction: 'Re-download or re-cache the corrupted model artifact.'
  },
  MODEL_SIZE_MISMATCH: {
    code: 'MODEL_SIZE_MISMATCH',
    category: ERROR_CATEGORIES.MODEL,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Cached model artifact size does not match expected size.',
    defaultAction: 'Re-download the model artifact to ensure complete transfer.'
  },
  MODEL_INVALID: {
    code: 'MODEL_INVALID',
    category: ERROR_CATEGORIES.MODEL,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Model definition or artifact metadata is invalid.',
    defaultAction: 'Verify model file format and required metadata.'
  },
  MODEL_AUXILIARY_MISSING: {
    code: 'MODEL_AUXILIARY_MISSING',
    category: ERROR_CATEGORIES.MODEL,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Required auxiliary model files are missing.',
    defaultAction: 'Ensure required auxiliary files (e.g. config.json) are present in the model directory.'
  },

  // CACHE
  MODEL_CACHE_INVALID: {
    code: 'MODEL_CACHE_INVALID',
    category: ERROR_CATEGORIES.CACHE,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Model cache state or directory structure is invalid.',
    defaultAction: 'Check model cache directory permissions and configuration.'
  },
  MODEL_CACHE_PATH_INVALID: {
    code: 'MODEL_CACHE_PATH_INVALID',
    category: ERROR_CATEGORIES.CACHE,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Computed cache path is invalid or outside allowed boundary.',
    defaultAction: 'Ensure cache path is valid and within allowed boundaries.'
  },
  MODEL_CACHE_WRITE_FAILED: {
    code: 'MODEL_CACHE_WRITE_FAILED',
    category: ERROR_CATEGORIES.CACHE,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Failed to write artifact to model cache.',
    defaultAction: 'Check disk space and write permissions for the model cache directory.'
  },
  MODEL_CACHE_EVICTION_FAILED: {
    code: 'MODEL_CACHE_EVICTION_FAILED',
    category: ERROR_CATEGORIES.CACHE,
    retryable: true,
    blocking: false,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Failed to evict artifact from model cache.',
    defaultAction: 'Inspect file permissions on cache artifacts targeted for eviction.'
  },

  // POLICY
  MODEL_POLICY_RESTRICTED: {
    code: 'MODEL_POLICY_RESTRICTED',
    category: ERROR_CATEGORIES.POLICY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION,
    defaultMessage: 'Requested model is prohibited by the active policy profile in the current execution mode.',
    defaultAction: 'Use research mode or select a model permitted by the active policy profile.'
  },
  POLICY_UNKNOWN: {
    code: 'POLICY_UNKNOWN',
    category: ERROR_CATEGORIES.POLICY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION,
    defaultMessage: 'Model policy status cannot be resolved from registry metadata.',
    defaultAction: 'Verify policy metadata in the model registry.'
  },
  POLICY_EVALUATION_FAILED: {
    code: 'POLICY_EVALUATION_FAILED',
    category: ERROR_CATEGORIES.POLICY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION,
    defaultMessage: 'Policy engine evaluation failed.',
    defaultAction: 'Check policy engine parameters and evaluation context.'
  },

  // CREDENTIAL
  PROVIDER_AUTH_ERROR: {
    code: 'PROVIDER_AUTH_ERROR',
    category: ERROR_CATEGORIES.CREDENTIAL,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Authentication failed for the selected external provider.',
    defaultAction: 'Provide valid credentials and region for the selected cloud provider.'
  },
  PROVIDER_CREDENTIAL_MISSING: {
    code: 'PROVIDER_CREDENTIAL_MISSING',
    category: ERROR_CATEGORIES.CREDENTIAL,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Required credentials are missing for the selected provider.',
    defaultAction: 'Set required environment variables (e.g. AZURE_SPEECH_KEY and AZURE_SPEECH_REGION).'
  },

  // PROVIDER
  PROVIDER_UNAVAILABLE: {
    code: 'PROVIDER_UNAVAILABLE',
    category: ERROR_CATEGORIES.PROVIDER,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'The selected provider is currently unavailable.',
    defaultAction: 'Verify network connectivity and remote service availability.'
  },
  PROVIDER_SERVICE_UNAVAILABLE: {
    code: 'PROVIDER_SERVICE_UNAVAILABLE',
    category: ERROR_CATEGORIES.PROVIDER,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Remote provider service returned a 5xx server error.',
    defaultAction: 'The provider service is temporarily unavailable. Retry with backoff.'
  },
  PROVIDER_QUOTA_EXCEEDED: {
    code: 'PROVIDER_QUOTA_EXCEEDED',
    category: ERROR_CATEGORIES.PROVIDER,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Provider rate limit or quota exceeded (HTTP 429).',
    defaultAction: 'Rate limit or quota reached. Retry after quota reset or upgrade service tier.'
  },
  PROVIDER_BAD_RESPONSE: {
    code: 'PROVIDER_BAD_RESPONSE',
    category: ERROR_CATEGORIES.PROVIDER,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Provider returned a malformed or invalid response.',
    defaultAction: 'Inspect remote provider API response payload or try again.'
  },
  PROVIDER_NOT_CONFIGURED: {
    code: 'PROVIDER_NOT_CONFIGURED',
    category: ERROR_CATEGORIES.PROVIDER,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Provider is not properly configured.',
    defaultAction: 'Configure the selected provider before use.'
  },

  // TRANSLATION
  TRANSLATION_MODEL_NOT_CACHED: {
    code: 'TRANSLATION_MODEL_NOT_CACHED',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Required translation model is not cached locally.',
    defaultAction: 'Cache NLLB translation model or enable online translation.'
  },
  TRANSLATION_MODEL_INVALID: {
    code: 'TRANSLATION_MODEL_INVALID',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Translation model files are invalid or incomplete.',
    defaultAction: 'Re-cache or verify NLLB translation model files.'
  },
  TRANSLATION_ENGINE_NOT_AVAILABLE: {
    code: 'TRANSLATION_ENGINE_NOT_AVAILABLE',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Local translation engine runtime is not available.',
    defaultAction: 'Install required local translation runtime (e.g., @xenova/transformers).'
  },
  TRANSLATION_ENGINE_FAILED: {
    code: 'TRANSLATION_ENGINE_FAILED',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Translation engine inference failed.',
    defaultAction: 'Check translation input text and local runtime memory.'
  },
  TRANSLATION_PROVIDER_UNAVAILABLE: {
    code: 'TRANSLATION_PROVIDER_UNAVAILABLE',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'External translation provider is unavailable.',
    defaultAction: 'Verify external translation service status or switch to local NLLB.'
  },
  TRANSLATION_PROVIDER_QUOTA_EXCEEDED: {
    code: 'TRANSLATION_PROVIDER_QUOTA_EXCEEDED',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'External translation provider quota exceeded.',
    defaultAction: 'External translation quota exceeded. Wait for quota reset or use local NLLB.'
  },
  TRANSLATION_PROVIDER_BAD_RESPONSE: {
    code: 'TRANSLATION_PROVIDER_BAD_RESPONSE',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'External translation provider returned an invalid response.',
    defaultAction: 'Inspect external translation response format.'
  },
  TRANSLATION_LANGUAGE_UNSUPPORTED: {
    code: 'TRANSLATION_LANGUAGE_UNSUPPORTED',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Requested translation language is not supported.',
    defaultAction: 'Select a target language supported by the translation provider.'
  },
  TRANSLATION_INPUT_INVALID: {
    code: 'TRANSLATION_INPUT_INVALID',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Translation input text is null, empty, or invalid.',
    defaultAction: 'Provide non-empty text segments for translation.'
  },
  TRANSLATION_NETWORK_REQUIRED: {
    code: 'TRANSLATION_NETWORK_REQUIRED',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'External translation requires network connectivity.',
    defaultAction: 'Connect to network or switch to offline NLLB translation.'
  },
  OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN: {
    code: 'OFFLINE_TRANSLATION_PROVIDER_FORBIDDEN',
    category: ERROR_CATEGORIES.TRANSLATION,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'External translation provider is prohibited in offline mode.',
    defaultAction: 'Use local NLLB translation when operating in offline mode.'
  },

  // TTS
  TTS_SYNTHESIS_FAILED: {
    code: 'TTS_SYNTHESIS_FAILED',
    category: ERROR_CATEGORIES.TTS,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Text-to-speech synthesis failed.',
    defaultAction: 'Inspect TTS engine synthesis logs and audio parameters.'
  },
  TTS_LANGUAGE_UNSUPPORTED: {
    code: 'TTS_LANGUAGE_UNSUPPORTED',
    category: ERROR_CATEGORIES.TTS,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Requested language is not supported by the selected TTS provider.',
    defaultAction: 'Select a language supported by the requested TTS engine.'
  },
  UNSUPPORTED_LANGUAGE: {
    code: 'UNSUPPORTED_LANGUAGE',
    category: ERROR_CATEGORIES.TTS,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Target language has no registered voices for the requested engine.',
    defaultAction: 'Select a language code with available voice models.'
  },
  INVALID_TTS_INPUT: {
    code: 'INVALID_TTS_INPUT',
    category: ERROR_CATEGORIES.TTS,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Input text for speech synthesis is null, empty, or whitespace only.',
    defaultAction: 'Provide non-empty speech text without invalid control sequences.'
  },
  OFFLINE_PROVIDER_FORBIDDEN: {
    code: 'OFFLINE_PROVIDER_FORBIDDEN',
    category: ERROR_CATEGORIES.TTS,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Cloud TTS provider is prohibited in offline mode.',
    defaultAction: 'Use a local TTS provider (piper, kokoro, mms, system) in offline mode.'
  },

  // PREFLIGHT
  PRECHECK_FAILED: {
    code: 'PRECHECK_FAILED',
    category: ERROR_CATEGORIES.PREFLIGHT,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Preflight Doctor checks failed. Cannot proceed with media processing.',
    defaultAction: 'Review Preflight Doctor diagnostics and resolve failing checks.'
  },
  PREFLIGHT_CHECK_FAILED: {
    code: 'PREFLIGHT_CHECK_FAILED',
    category: ERROR_CATEGORIES.PREFLIGHT,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'One or more preflight environment checks failed.',
    defaultAction: 'Review Preflight Doctor diagnostics and resolve failing checks.'
  },

  // NETWORK
  NETWORK_REQUIRED: {
    code: 'NETWORK_REQUIRED',
    category: ERROR_CATEGORIES.NETWORK,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Network connectivity is required for the requested operation.',
    defaultAction: 'Establish internet connection or switch to offline-capable local providers.'
  },
  OFFLINE_VIOLATION_BLOCKED: {
    code: 'OFFLINE_VIOLATION_BLOCKED',
    category: ERROR_CATEGORIES.NETWORK,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Network request blocked due to active offline mode constraint.',
    defaultAction: 'Do not invoke network-dependent endpoints while --offline is active.'
  },
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    category: ERROR_CATEGORIES.NETWORK,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'Network request timed out or was aborted before completion.',
    defaultAction: 'Verify internet connection stability or increase request timeout.'
  },
  WEBSOCKET_ERROR: {
    code: 'WEBSOCKET_ERROR',
    category: ERROR_CATEGORIES.NETWORK,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR,
    defaultMessage: 'WebSocket connection failed, timed out, or closed unexpectedly.',
    defaultAction: 'Verify remote WebSocket endpoint availability and network stability.'
  },
  BLOCKED_PROTOCOL: {
    code: 'BLOCKED_PROTOCOL',
    category: ERROR_CATEGORIES.SECURITY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION,
    defaultMessage: 'Network protocol is prohibited by security policy.',
    defaultAction: 'Use approved secure network protocols (HTTPS / WSS).'
  },

  // SECURITY
  SECURITY_TRAVERSAL_DETECTED: {
    code: 'SECURITY_TRAVERSAL_DETECTED',
    category: ERROR_CATEGORIES.SECURITY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION,
    defaultMessage: 'Path traversal attempt detected.',
    defaultAction: 'Ensure resource path is within allowed directory boundaries.'
  },
  SECURITY_INVALID_RESOURCE: {
    code: 'SECURITY_INVALID_RESOURCE',
    category: ERROR_CATEGORIES.SECURITY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION,
    defaultMessage: 'Requested resource failed security boundary validation.',
    defaultAction: 'Check resource URL or path for security policy compliance.'
  },
  SSRF_BLOCKED: {
    code: 'SSRF_BLOCKED',
    category: ERROR_CATEGORIES.SECURITY,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION,
    defaultMessage: 'URL resolved to a restricted private or loopback network address.',
    defaultAction: 'Do not target loopback, link-local, or private IP address ranges.'
  },

  // PIPELINE
  PIPELINE_FAILED: {
    code: 'PIPELINE_FAILED',
    category: ERROR_CATEGORIES.PIPELINE,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.GENERAL_ERROR,
    defaultMessage: 'Media processing pipeline execution failed.',
    defaultAction: 'Review pipeline step errors and re-run with valid input.'
  },
  PIPELINE_STAGE_FAILED: {
    code: 'PIPELINE_STAGE_FAILED',
    category: ERROR_CATEGORIES.PIPELINE,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.GENERAL_ERROR,
    defaultMessage: 'A pipeline stage failed to complete.',
    defaultAction: 'Check intermediate stage logs and outputs.'
  },

  // FILESYSTEM
  WORKSPACE_ACCESS_DENIED: {
    code: 'WORKSPACE_ACCESS_DENIED',
    category: ERROR_CATEGORIES.FILESYSTEM,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Workspace directory is not writable or inaccessible.',
    defaultAction: 'Ensure workspace directory exists and has read/write permissions.'
  },
  DISK_SPACE_INSUFFICIENT: {
    code: 'DISK_SPACE_INSUFFICIENT',
    category: ERROR_CATEGORIES.FILESYSTEM,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.DEPENDENCY_MISSING,
    defaultMessage: 'Available disk space is insufficient for the requested operation.',
    defaultAction: 'Free up required disk space or configure a drive with sufficient free storage.'
  },

  // AUDIO
  AUDIO_TIMELINE_INVALID: {
    code: 'AUDIO_TIMELINE_INVALID',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Audio timeline timestamp or cue ordering is invalid.',
    defaultAction: 'Verify that subtitle cue timestamps are non-negative, finite numbers with end > start.'
  },
  AUDIO_DURATION_INVALID: {
    code: 'AUDIO_DURATION_INVALID',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Audio duration is non-positive or exceeds maximum allowable limit.',
    defaultAction: 'Check input media duration and ensure duration is a positive finite number.'
  },
  AUDIO_FORMAT_INVALID: {
    code: 'AUDIO_FORMAT_INVALID',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Audio format or container is unsupported or corrupted.',
    defaultAction: 'Ensure audio file is a valid WAV or M4A container with readable audio streams.'
  },
  AUDIO_SAMPLE_RATE_MISMATCH: {
    code: 'AUDIO_SAMPLE_RATE_MISMATCH',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Audio sample rate does not match target output sample rate and resampling failed.',
    defaultAction: 'Normalize audio sample rate using FFmpeg aresample filter before mixing.'
  },
  AUDIO_CHANNEL_MISMATCH: {
    code: 'AUDIO_CHANNEL_MISMATCH',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Audio channel layout does not match target layout and channel mapping failed.',
    defaultAction: 'Normalize audio channel layout to stereo before mixing multi-speaker stems.'
  },
  AUDIO_TIMING_OVERFLOW: {
    code: 'AUDIO_TIMING_OVERFLOW',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.INVALID_CONFIG,
    defaultMessage: 'Speech audio duration exceeds target cue window beyond allowable stretch limits.',
    defaultAction: 'Increase cue window duration or configure rate adaptation limits.'
  },
  AUDIO_RATE_ADAPTATION_FAILED: {
    code: 'AUDIO_RATE_ADAPTATION_FAILED',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR,
    defaultMessage: 'Audio tempo adaptation or time stretching failed during filter processing.',
    defaultAction: 'Verify FFmpeg atempo filter support and rate factor bounds [0.5, 2.0].'
  },
  AUDIO_MIX_FAILED: {
    code: 'AUDIO_MIX_FAILED',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: true,
    blocking: true,
    exitCode: CLI_EXIT_CODES.GENERAL_ERROR,
    defaultMessage: 'Timeline audio mixing process failed.',
    defaultAction: 'Check FFmpeg process logs, input audio stems, and output destination permissions.'
  },
  AUDIO_OUTPUT_INVALID: {
    code: 'AUDIO_OUTPUT_INVALID',
    category: ERROR_CATEGORIES.AUDIO,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.GENERAL_ERROR,
    defaultMessage: 'Generated mixed audio file failed structural validation or is unplayable.',
    defaultAction: 'Verify that output M4A contains valid AAC audio stream and is non-empty.'
  }
});

/**
 * Retrieves the error definition for a given error code.
 * Falls back to generic metadata if code is uncataloged.
 * 
 * @param {string} [code] 
 * @returns {ErrorDefinition}
 */
export function getErrorDefinition(code) {
  if (code && ERROR_DEFINITIONS[code]) {
    return ERROR_DEFINITIONS[code];
  }
  return {
    code: code || 'UNKNOWN_ERROR',
    category: ERROR_CATEGORIES.SYSTEM,
    retryable: false,
    blocking: true,
    exitCode: CLI_EXIT_CODES.GENERAL_ERROR,
    defaultMessage: 'An unexpected error occurred.',
    defaultAction: 'Check execution logs or contact support.'
  };
}

/**
 * Resolves the deterministic CLI exit code for an error instance or error code.
 * 
 * @param {any} err 
 * @returns {number}
 */
export function getExitCodeForError(err) {
  if (!err) return CLI_EXIT_CODES.SUCCESS;
  if (typeof err === 'number') return err;

  const code = typeof err === 'string' ? err : err.code;
  if (code && ERROR_DEFINITIONS[code]) {
    return ERROR_DEFINITIONS[code].exitCode;
  }

  const category = err.category;
  switch (category) {
    case ERROR_CATEGORIES.CONFIGURATION:
      return CLI_EXIT_CODES.INVALID_CONFIG;
    case ERROR_CATEGORIES.SYSTEM:
    case ERROR_CATEGORIES.BINARY:
    case ERROR_CATEGORIES.FILESYSTEM:
    case ERROR_CATEGORIES.PREFLIGHT:
      return CLI_EXIT_CODES.DEPENDENCY_MISSING;
    case ERROR_CATEGORIES.MODEL:
    case ERROR_CATEGORIES.CACHE:
      return CLI_EXIT_CODES.MODEL_OR_CACHE_ERROR;
    case ERROR_CATEGORIES.POLICY:
    case ERROR_CATEGORIES.SECURITY:
      return CLI_EXIT_CODES.POLICY_OR_SECURITY_RESTRICTION;
    case ERROR_CATEGORIES.PROVIDER:
    case ERROR_CATEGORIES.CREDENTIAL:
    case ERROR_CATEGORIES.NETWORK:
      return CLI_EXIT_CODES.PROVIDER_OR_NETWORK_ERROR;
    case ERROR_CATEGORIES.PIPELINE:
    default:
      return CLI_EXIT_CODES.GENERAL_ERROR;
  }
}

/**
 * Maps an HTTP status code to a standardized provider error code.
 * 
 * @param {number} statusCode 
 * @param {{ isBadResponse?: boolean, isNetworkError?: boolean }} [options={}]
 * @returns {string} Standardized error code
 */
export function mapHttpStatusToErrorCode(statusCode, options = {}) {
  if (statusCode === 401 || statusCode === 403) {
    return 'PROVIDER_AUTH_ERROR';
  }
  if (statusCode === 429) {
    return 'PROVIDER_QUOTA_EXCEEDED';
  }
  if (statusCode >= 500 && statusCode < 600) {
    return 'PROVIDER_SERVICE_UNAVAILABLE';
  }
  if (options.isBadResponse) {
    return 'PROVIDER_BAD_RESPONSE';
  }
  if (options.isNetworkError || !statusCode) {
    return 'PROVIDER_UNAVAILABLE';
  }
  return 'PROVIDER_UNAVAILABLE';
}

export const ErrorCatalog = Object.freeze({
  ERROR_CATEGORIES,
  CLI_EXIT_CODES,
  ERROR_DEFINITIONS,
  getErrorDefinition,
  getExitCodeForError,
  mapHttpStatusToErrorCode
});

export default ErrorCatalog;
