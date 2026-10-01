// @ts-check
import {
  ERROR_CATEGORIES,
  ERROR_DEFINITIONS,
  getErrorDefinition
} from './ErrorCatalog.js';

/**
 * Regex for keys in objects that represent sensitive credentials.
 */
const SENSITIVE_KEY_REGEX = /(?:api[_-]?key|subscription[_-]?key|access[_-]?token|auth(?:orization)?|secret|password|passwd|token|credential|cookie)/i;

/**
 * Redacts secrets from a raw string.
 * Masks query parameters, headers, key-value assignments, and bearer tokens.
 * 
 * @param {string} str 
 * @returns {string} Redacted string
 */
export function redactString(str) {
  if (typeof str !== 'string') {
    return str;
  }

  let out = str;

  // 1. Authorization: Bearer / Basic headers
  out = out.replace(/(Authorization:\s*)(?:(?:Bearer|Basic)\s+)?[^\r\n\s]+/gi, '$1[REDACTED]');

  // 2. Standalone Bearer tokens
  out = out.replace(/(Bearer\s+)[A-Za-z0-9_\-\.]{8,}/gi, '$1[REDACTED]');

  // 3. key=value or key: value pairs (apiKey, subscriptionKey, password, secret, accessToken, cookie, token)
  out = out.replace(
    /(?:(apiKey|subscriptionKey|password|secret|accessToken|token|credential)\s*([:=])\s*)(['"]?)[^\s'"&;,]+(['"]?)/gi,
    '$1$2$3[REDACTED]$4'
  );

  // 4. URL query parameters with secret keys
  out = out.replace(
    /([?&](?:key|api_key|apiKey|subscriptionKey|subscription_key|token|access_token|password|secret)=)[^&]+/gi,
    '$1[REDACTED]'
  );

  // 5. Embedded URL credentials: https://user:pass@host
  out = out.replace(/(https?:\/\/)([^:\s\/]+):([^@\s\/]+)@/g, '$1$2:[REDACTED]@');

  // 6. Cookie headers / key=value in cookie strings
  out = out.replace(/(cookie\s*[:=]\s*)(['"]?)[^\r\n;&]+(['"]?)/gi, '$1$2[REDACTED]$3');

  return out;
}

/**
 * Recursively redacts credentials and secrets from plain objects, arrays, and error structures.
 * Bounded depth and circular reference detection.
 * 
 * @param {any} target 
 * @param {number} [depth=0] 
 * @param {WeakSet<object>} [seen=new WeakSet()] 
 * @returns {any} Sanitized clone or primitive
 */
export function redactSecrets(target, depth = 0, seen = new WeakSet()) {
  if (target === null || target === undefined) {
    return target;
  }

  if (typeof target === 'string') {
    return redactString(target);
  }

  if (typeof target !== 'object') {
    return target;
  }

  if (depth > 6) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (seen.has(target)) {
    return '[CIRCULAR_REFERENCE]';
  }
  seen.add(target);

  if (Array.isArray(target)) {
    return target.map(item => redactSecrets(item, depth + 1, seen));
  }

  if (target instanceof Error) {
    const errObj = /** @type {any} */ (target);
    const errorCopy = {
      name: target.name,
      message: redactString(target.message),
      code: errObj.code || undefined
    };
    return errorCopy;
  }

  /** @type {Record<string, any>} */
  const out = {};
  for (const [key, val] of Object.entries(target)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = redactSecrets(val, depth + 1, seen);
    }
  }

  return out;
}

/**
 * Recursively creates a bounded, safe, secret-free serialization of an error cause.
 * 
 * @param {any} cause 
 * @param {number} [depth=0] 
 * @returns {Record<string, any>|null}
 */
export function safeSerializeCause(cause, depth = 0) {
  if (!cause || depth > 2) {
    return null;
  }

  if (cause instanceof Error || (typeof cause === 'object' && cause.message)) {
    const causeObj = /** @type {any} */ (cause);
    /** @type {{ name: string, message: string, code?: string, cause?: any }} */
    const res = {
      name: causeObj.name || 'Error',
      message: redactString(causeObj.message || String(cause))
    };
    if (causeObj.code) {
      res.code = causeObj.code;
    }
    if (causeObj.cause && depth < 2) {
      res.cause = safeSerializeCause(causeObj.cause, depth + 1);
    }
    return res;
  }

  if (typeof cause === 'string') {
    return { message: redactString(cause) };
  }

  return { message: redactString(String(cause)) };
}

/**
 * Standard root error class for all TAVI subsystems.
 */
export class TaviError extends Error {
  /**
   * @param {string|Record<string, any>} [messageOrOptions] - Explanatory message or options object
   * @param {Record<string, any>} [options={}] - Contextual options
   */
  constructor(messageOrOptions = '', options = {}) {
    let rawMessage;
    /** @type {Record<string, any>} */
    let opts;

    if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
      opts = { ...messageOrOptions, ...options };
      rawMessage = opts.message || opts.reason || '';
    } else {
      opts = { ...options };
      rawMessage = typeof messageOrOptions === 'string' ? messageOrOptions : '';
    }

    const catalogDef = getErrorDefinition(opts.code);
    const resolvedCode = opts.code || catalogDef.code;
    const resolvedCategory = opts.category || catalogDef.category;
    const resolvedMessage = rawMessage || catalogDef.defaultMessage || resolvedCode;
    const sanitizedMessage = redactString(resolvedMessage);

    super(sanitizedMessage, { cause: opts.cause });

    this.name = opts.name || 'TaviError';
    this.code = resolvedCode;
    this.category = resolvedCategory;
    this.provider = opts.provider || null;
    this.engine = opts.engine || null;
    this.languageCode = opts.languageCode || opts.language || null;
    this.modelId = opts.modelId || null;
    this.stage = opts.stage || null;
    this.retryable = typeof opts.retryable === 'boolean' ? opts.retryable : catalogDef.retryable;
    this.blocking = typeof opts.blocking === 'boolean' ? opts.blocking : catalogDef.blocking;
    this.action = opts.action || catalogDef.defaultAction || null;
    this.details = redactSecrets(opts.details || {});

    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Serializes the error into a safe, bounded, machine-readable JSON structure.
   * Strips out raw secrets, credentials, environment variables, and stack traces.
   * 
   * @returns {Record<string, any>}
   */
  toJSON() {
    /** @type {Record<string, any>} */
    const payload = {
      name: this.name,
      code: this.code,
      category: this.category,
      message: redactString(this.message),
      retryable: this.retryable,
      blocking: this.blocking,
      action: this.action
    };

    if (this.provider) payload.provider = this.provider;
    if (this.engine) payload.engine = this.engine;
    if (this.languageCode) payload.languageCode = this.languageCode;
    if (this.modelId) payload.modelId = this.modelId;
    if (this.stage) payload.stage = this.stage;

    if (this.details && Object.keys(this.details).length > 0) {
      payload.details = redactSecrets(this.details);
    }

    if (this.cause) {
      const serializedCause = safeSerializeCause(this.cause);
      if (serializedCause) {
        payload.cause = serializedCause;
      }
    }

    return payload;
  }

  /**
   * Standard human-readable string representation.
   * 
   * @returns {string}
   */
  toString() {
    return `[${this.name}: ${this.category}/${this.code}] ${this.message}`;
  }
}

/**
 * Configuration subsystem error.
 */
export class TaviConfigurationError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviConfigurationError',
      category: ERROR_CATEGORIES.CONFIGURATION,
      ...options
    });
  }
}

/**
 * Model registry or artifact error.
 */
export class TaviModelError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviModelError',
      category: ERROR_CATEGORIES.MODEL,
      ...options
    });
  }
}

/**
 * Model cache management error.
 */
export class TaviCacheError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviCacheError',
      category: ERROR_CATEGORIES.CACHE,
      ...options
    });
  }
}

/**
 * Policy evaluation and compliance error.
 */
export class TaviPolicyError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviPolicyError',
      category: ERROR_CATEGORIES.POLICY,
      ...options
    });
  }
}

/**
 * Provider resolution, authentication, or service error.
 */
export class TaviProviderError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviProviderError',
      category: ERROR_CATEGORIES.PROVIDER,
      ...options
    });
  }
}

/**
 * Subtitle and text translation error.
 */
export class TaviTranslationError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviTranslationError',
      category: ERROR_CATEGORIES.TRANSLATION,
      ...options
    });
  }
}

/**
 * Speech synthesis (TTS) error.
 */
export class TaviTTSError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviTTSError',
      category: ERROR_CATEGORIES.TTS,
      ...options
    });
  }
}

/**
 * Preflight Doctor validation and readiness gate error.
 */
export class TaviPreflightError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviPreflightError',
      code: 'PRECHECK_FAILED',
      category: ERROR_CATEGORIES.PREFLIGHT,
      blocking: true,
      retryable: false,
      ...options
    });
    const opts = /** @type {Record<string, any>} */ (options);
    this.preflight = opts.preflight || opts.details?.preflight || null;
  }
}

/**
 * Media pipeline orchestration error.
 */
export class TaviPipelineError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviPipelineError',
      category: ERROR_CATEGORIES.PIPELINE,
      ...options
    });
  }
}

/**
 * Security boundary and SSRF violation error.
 */
export class TaviSecurityError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviSecurityError',
      category: ERROR_CATEGORIES.SECURITY,
      blocking: true,
      retryable: false,
      ...options
    });
  }
}

/**
 * Audio pipeline, timeline, and mixing error.
 */
export class TaviAudioError extends TaviError {
  /**
   * @param {string|Record<string, any>} [message]
   * @param {Record<string, any>} [options]
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviAudioError',
      category: ERROR_CATEGORIES.AUDIO,
      ...options
    });
  }
}

/**
 * Specialized error class for Network and connectivity errors.
 */
export class TaviNetworkError extends TaviError {
  /**
   * @param {string} [message] 
   * @param {import('./index.d.ts').TaviErrorOptions} [options] 
   */
  constructor(message = '', options = {}) {
    super(message, {
      name: 'TaviNetworkError',
      category: ERROR_CATEGORIES.NETWORK,
      ...options
    });
  }
}

/**
 * Converts any arbitrary error into a normalized TaviError instance.
 * Preserves original error as `cause`.
 * 
 * @param {any} err 
 * @param {Record<string, any>} [defaultOptions={}] 
 * @returns {TaviError}
 */
export function toTaviError(err, defaultOptions = {}) {
  if (err instanceof TaviError) {
    return err;
  }

  const opts = /** @type {Record<string, any>} */ (defaultOptions);

  if (err instanceof Error) {
    const errObj = /** @type {any} */ (err);
    const code = errObj.code || opts.code || 'UNKNOWN_ERROR';
    return new TaviError(err.message, {
      code,
      cause: err,
      ...opts,
      details: {
        ...(opts.details || {}),
        originalErrorName: err.name
      }
    });
  }

  const str = typeof err === 'string' ? err : 'Unknown error';
  return new TaviError(str, {
    code: opts.code || 'UNKNOWN_ERROR',
    cause: err,
    ...opts
  });
}

/**
 * Formats an error into a machine-readable JSON string.
 * 
 * @param {any} err 
 * @returns {string}
 */
export function formatErrorJson(err) {
  const taviErr = toTaviError(err);
  return JSON.stringify({
    ok: false,
    error: taviErr.toJSON()
  }, null, 2);
}

/**
 * Formats an error into a human-readable CLI diagnostic string.
 * 
 * @param {any} err 
 * @returns {string}
 */
export function formatErrorCli(err) {
  const taviErr = toTaviError(err);
  const lines = [
    `❌ [${taviErr.category}] ${taviErr.code}: ${taviErr.message}`,
    ...(taviErr.action ? [`   Action: ${taviErr.action}`] : []),
    ...(taviErr.provider ? [`   Provider: ${taviErr.provider}`] : []),
    ...(taviErr.modelId ? [`   Model: ${taviErr.modelId}`] : []),
    ...(taviErr.languageCode ? [`   Language: ${taviErr.languageCode}`] : [])
  ];
  return lines.join('\n');
}

export default TaviError;
