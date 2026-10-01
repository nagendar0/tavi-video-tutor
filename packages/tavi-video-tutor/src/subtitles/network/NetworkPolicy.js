// @ts-check
import { isPrivateHost, redactUrlSecrets } from '../video/resolveVideo.js';
import { TaviNetworkError } from '../errors/index.js';

/**
 * Operational network modes.
 * @readonly
 * @enum {string}
 */
export const NETWORK_MODES = Object.freeze({
  OFFLINE: 'OFFLINE',
  ONLINE_RESTRICTED: 'ONLINE_RESTRICTED'
});

/**
 * Default authorized domains for online operations.
 */
export const DEFAULT_ONLINE_ALLOWLIST = Object.freeze([
  // Azure Cognitive Services Speech
  '*.tts.speech.microsoft.com',
  '*.cognitiveservices.azure.com',
  // Edge Speech synthesis WebSocket
  'speech.platform.bing.com',
  // Translation provider
  'api.mymemory.translated.net',
  // Model artifact repositories
  'huggingface.co',
  '*.huggingface.co',
  'github.com',
  '*.github.com',
  'raw.githubusercontent.com',
  '*.githubusercontent.com'
]);

/**
 * Central runtime network policy engine.
 * Enforces strict offline boundary (zero external network connections)
 * and destination allowlisting for authorized online connections.
 */
export class NetworkPolicy {
  /**
   * @param {Object} [options={}]
   * @param {'OFFLINE'|'ONLINE_RESTRICTED'} [options.mode='OFFLINE']
   * @param {string[]} [options.allowedDomains]
   * @param {boolean} [options.allowPrivateNetwork=false]
   * @param {boolean} [options.allowLocalTestEndpoints=false]
   */
  constructor(options = {}) {
    this.mode = options.mode || (options['offline'] === false ? NETWORK_MODES.ONLINE_RESTRICTED : NETWORK_MODES.OFFLINE);
    this.allowedDomains = Array.isArray(options.allowedDomains)
      ? [...options.allowedDomains]
      : [...DEFAULT_ONLINE_ALLOWLIST];
    this.allowPrivateNetwork = options.allowPrivateNetwork === true;
    this.allowLocalTestEndpoints = options.allowLocalTestEndpoints === true;
  }

  /**
   * Whether the policy is in offline mode.
   * @returns {boolean}
   */
  isOffline() {
    return this.mode === NETWORK_MODES.OFFLINE;
  }

  /**
   * Sets policy operational mode.
   * @param {'OFFLINE'|'ONLINE_RESTRICTED'} mode 
   */
  setMode(mode) {
    if (mode !== NETWORK_MODES.OFFLINE && mode !== NETWORK_MODES.ONLINE_RESTRICTED) {
      throw new Error(`Invalid network policy mode: '${mode}'`);
    }
    this.mode = mode;
  }

  /**
   * Checks whether a host pattern matches an allowed domain wildcard.
   * e.g. "eastus.tts.speech.microsoft.com" matches "*.tts.speech.microsoft.com"
   * 
   * @param {string} hostname 
   * @param {string} pattern 
   * @returns {boolean}
   */
  matchesDomainPattern(hostname, pattern) {
    const host = hostname.toLowerCase();
    const pat = pattern.toLowerCase();
    if (pat.startsWith('*.')) {
      const root = pat.slice(2);
      return host === root || host.endsWith('.' + root);
    }
    return host === pat;
  }

  /**
   * Parses and validates a URL string or URL object.
   * 
   * @param {string|URL} urlInput 
   * @returns {URL} Parsed and validated URL instance
   */
  parseUrl(urlInput) {
    if (!urlInput) {
      throw new TaviNetworkError('Network URL must be a non-empty string or URL instance', {
        code: 'INVALID_ARGUMENT',
        details: { urlInput }
      });
    }

    try {
      return urlInput instanceof URL ? urlInput : new URL(urlInput);
    } catch (err) {
      throw new TaviNetworkError(`Failed to parse network URL '${redactUrlSecrets(String(urlInput))}': ${err.message}`, {
        code: 'INVALID_ARGUMENT',
        cause: err,
        details: { rawUrl: redactUrlSecrets(String(urlInput)) }
      });
    }
  }

  /**
   * Verifies if a given destination is allowed under current policy.
   * 
   * @param {string|URL} urlInput 
   * @param {Object} [context={}]
   * @param {string} [context.operation='connect']
   * @param {string} [context.stage='network_access']
   * @param {string} [context.provider]
   * @throws {TaviNetworkError} If network access is blocked
   * @returns {URL} Validated URL instance
   */
  assertAllowed(urlInput, context = {}) {
    const url = this.parseUrl(urlInput);
    const protocol = url.protocol.toLowerCase();
    const hostname = url.hostname.toLowerCase();
    const port = url.port ? parseInt(url.port, 10) : (protocol === 'https:' || protocol === 'wss:' ? 443 : 80);

    // 1. OFFLINE ENFORCEMENT: Absolute zero external network connections
    if (this.isOffline()) {
      // Local IPC / named pipes are not external sockets
      const isApprovedLocalTest = this.allowLocalTestEndpoints && (hostname === 'localhost' || hostname === '127.0.0.1');
      if (!isApprovedLocalTest) {
        throw new TaviNetworkError(`Network access blocked: Offline mode active. Cannot connect to ${protocol}//${hostname}:${port}`, {
          code: 'OFFLINE_VIOLATION_BLOCKED',
          stage: context.stage || 'network_access',
          provider: context.provider || null,
          action: 'Run in online mode or provide the required local cached assets.',
          blocking: true,
          retryable: false,
          details: {
            operation: context.operation || 'connect',
            protocol: protocol.replace(':', ''),
            host: hostname,
            port,
            stage: context.stage || 'network_access',
            action: 'Run in online mode or provide the required local cached assets.',
            blocking: true
          }
        });
      }
    }

    // 2. PROTOCOL SAFETY CHECK
    const allowedProtocols = this.allowLocalTestEndpoints
      ? ['https:', 'http:', 'wss:', 'ws:']
      : ['https:', 'wss:'];

    if (!allowedProtocols.includes(protocol)) {
      throw new TaviNetworkError(`Protocol '${protocol}' is prohibited by network security policy. Only secure protocols (https, wss) are permitted.`, {
        code: 'BLOCKED_PROTOCOL',
        stage: context.stage || 'protocol_validation',
        blocking: true,
        retryable: false,
        details: { protocol, host: hostname, port }
      });
    }

    // 3. SSRF / PRIVATE NETWORK CHECK
    const isPrivate = isPrivateHost(hostname);
    if (isPrivate) {
      const isPermittedLocalTest = (this.allowLocalTestEndpoints || this.allowPrivateNetwork) &&
        (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1');

      if (!isPermittedLocalTest) {
        throw new TaviNetworkError(`Hostname '${hostname}' resolves to a restricted private or loopback network address.`, {
          code: 'SSRF_BLOCKED',
          stage: context.stage || 'ssrf_validation',
          blocking: true,
          retryable: false,
          details: { host: hostname, port, protocol }
        });
      }
    }

    // 4. DESTINATION ALLOWLIST CHECK (for online mode)
    if (!this.allowLocalTestEndpoints || !isPrivate) {
      const isDomainAllowed = this.allowedDomains.some(pattern => this.matchesDomainPattern(hostname, pattern));
      if (!isDomainAllowed) {
        throw new TaviNetworkError(`Destination host '${hostname}' is not in the approved online allowlist.`, {
          code: 'PROVIDER_UNAVAILABLE',
          stage: context.stage || 'allowlist_validation',
          blocking: true,
          retryable: false,
          details: { host: hostname, port, protocol, allowedDomains: this.allowedDomains }
        });
      }
    }

    return url;
  }

  /**
   * Non-throwing check if destination is allowed.
   * 
   * @param {string|URL} urlInput 
   * @param {Object} [context={}] 
   * @returns {boolean}
   */
  isAllowed(urlInput, context = {}) {
    try {
      this.assertAllowed(urlInput, context);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Validates HTTP redirect targets.
   * Prevents redirects from escaping to unapproved domains, downgrading protocol, or hitting SSRF targets.
   * 
   * @param {string|URL} currentUrl 
   * @param {string|URL} redirectUrl 
   * @param {Object} [context={}] 
   * @returns {URL} Validated redirect target URL
   */
  validateRedirect(currentUrl, redirectUrl, context = {}) {
    const from = this.parseUrl(currentUrl);
    const to = this.parseUrl(redirectUrl);

    // 1. Protocol downgrade prevention (e.g. HTTPS -> HTTP)
    if (from.protocol === 'https:' && to.protocol === 'http:' && !this.allowLocalTestEndpoints) {
      throw new TaviNetworkError(`Insecure redirect downgrade from HTTPS to HTTP blocked for '${to.hostname}'.`, {
        code: 'BLOCKED_PROTOCOL',
        stage: 'redirect_validation',
        blocking: true,
        retryable: false,
        details: { from: from.protocol, to: to.protocol, host: to.hostname }
      });
    }

    // 2. Validate redirect destination against full policy
    return this.assertAllowed(to, { ...context, stage: 'redirect_validation' });
  }
}

export default NetworkPolicy;
