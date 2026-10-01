// @ts-check
import http from 'http';
import https from 'https';
import net from 'net';
import tls from 'tls';
import dns from 'dns';
import { NetworkPolicy, NETWORK_MODES } from './NetworkPolicy.js';
import { TaviNetworkError } from '../errors/index.js';

/**
 * References to original native modules before interception.
 */
const original = {
  httpRequest: http.request,
  httpGet: http.get,
  httpsRequest: https.request,
  httpsGet: https.get,
  netConnect: net.connect,
  netSocketConnect: net.Socket.prototype.connect,
  tlsConnect: tls.connect,
  dnsLookup: dns.lookup,
  dnsResolve: dns.resolve,
  dnsPromisesLookup: dns.promises.lookup,
  dnsPromisesResolve: dns.promises.resolve,
  globalFetch: globalThis.fetch
};

/**
 * Interception audit record.
 * @typedef {{
 *   timestamp: string;
 *   operation: string;
 *   target: string;
 *   status: 'ALLOWED' | 'BLOCKED';
 *   reason?: string;
 * }} NetworkAuditRecord
 */

/**
 * Runtime Network Guard (Layer 2 Enforcement).
 * Intercepts Node core network primitives (http, https, net, tls, dns, fetch)
 * to structurally prevent external egress in offline mode and enforce domain allowlisting online.
 */
export class NetworkGuard {
  /** @type {NetworkPolicy|null} */
  static activePolicy = null;
  /** @type {boolean} */
  static isEnabled = false;
  /** @type {NetworkAuditRecord[]} */
  static auditLog = [];

  /**
   * Activates network interception with the given policy.
   * 
   * @param {NetworkPolicy|Object} [policy] 
   */
  static enable(policy = new NetworkPolicy({ mode: NETWORK_MODES.OFFLINE })) {
    this.activePolicy = policy instanceof NetworkPolicy ? policy : new NetworkPolicy(policy);
    this.isEnabled = true;
    this.auditLog = [];

    this._patchHttp();
    this._patchHttps();
    this._patchNet();
    this._patchTls();
    this._patchDns();
    this._patchFetch();
  }

  /**
   * Restores all native network methods and disables interception.
   */
  static disable() {
    this.isEnabled = false;
    this.activePolicy = null;

    http.request = original.httpRequest;
    http.get = original.httpGet;
    https.request = original.httpsRequest;
    https.get = original.httpsGet;
    net.connect = original.netConnect;
    net.Socket.prototype.connect = original.netSocketConnect;
    tls.connect = original.tlsConnect;
    dns.lookup = original.dnsLookup;
    dns.resolve = original.dnsResolve;
    dns.promises.lookup = original.dnsPromisesLookup;
    dns.promises.resolve = original.dnsPromisesResolve;
    globalThis.fetch = original.globalFetch;
  }

  /**
   * Executes an asynchronous task inside an isolated network policy scope.
   * Restores previous network state guaranteed in finally block.
   * 
   * @template T
   * @param {NetworkPolicy|Object} policy 
   * @param {() => Promise<T>|T} fn 
   * @returns {Promise<T>}
   */
  static async runIsolated(policy, fn) {
    const prevPolicy = this.activePolicy;
    const prevEnabled = this.isEnabled;

    try {
      this.enable(policy);
      return await fn();
    } finally {
      if (prevEnabled && prevPolicy) {
        this.enable(prevPolicy);
      } else {
        this.disable();
      }
    }
  }

  /**
   * Records an audit log entry.
   * 
   * @param {string} operation 
   * @param {string} target 
   * @param {'ALLOWED'|'BLOCKED'} status 
   * @param {string} [reason] 
   */
  static _recordAudit(operation, target, status, reason) {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      operation,
      target,
      status,
      reason
    });
  }

  /**
   * Checks whether a path string represents a local Unix socket or Windows named pipe.
   * 
   * @param {any} target 
   * @returns {boolean}
   */
  static isLocalIpcPath(target) {
    if (typeof target !== 'string') return false;
    // Windows Named Pipe (\\.\pipe\...) or Unix domain socket (/...)
    return target.startsWith('\\\\.\\pipe\\') || target.startsWith('/') || target.startsWith('./');
  }

  /**
   * Patches Node core http.request and http.get.
   */
  static _patchHttp() {
    const guard = this;

    // @ts-ignore
    http.request = function (urlOrOpts, options, cb) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.httpRequest.apply(http, arguments);
      }

      const target = guard._resolveUrlFromArgs('http:', urlOrOpts, options);
      try {
        guard.activePolicy.assertAllowed(target, { operation: 'http.request' });
        guard._recordAudit('http.request', target.href, 'ALLOWED');
        return original.httpRequest.apply(http, arguments);
      } catch (err) {
        guard._recordAudit('http.request', String(target.href || target), 'BLOCKED', err.message);
        throw err;
      }
    };

    // @ts-ignore
    http.get = function (urlOrOpts, options, cb) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.httpGet.apply(http, arguments);
      }

      const target = guard._resolveUrlFromArgs('http:', urlOrOpts, options);
      try {
        guard.activePolicy.assertAllowed(target, { operation: 'http.get' });
        guard._recordAudit('http.get', target.href, 'ALLOWED');
        return original.httpGet.apply(http, arguments);
      } catch (err) {
        guard._recordAudit('http.get', String(target.href || target), 'BLOCKED', err.message);
        throw err;
      }
    };
  }

  /**
   * Patches Node core https.request and https.get.
   */
  static _patchHttps() {
    const guard = this;

    // @ts-ignore
    https.request = function (urlOrOpts, options, cb) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.httpsRequest.apply(https, arguments);
      }

      const target = guard._resolveUrlFromArgs('https:', urlOrOpts, options);
      try {
        guard.activePolicy.assertAllowed(target, { operation: 'https.request' });
        guard._recordAudit('https.request', target.href, 'ALLOWED');
        return original.httpsRequest.apply(https, arguments);
      } catch (err) {
        guard._recordAudit('https.request', String(target.href || target), 'BLOCKED', err.message);
        throw err;
      }
    };

    // @ts-ignore
    https.get = function (urlOrOpts, options, cb) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.httpsGet.apply(https, arguments);
      }

      const target = guard._resolveUrlFromArgs('https:', urlOrOpts, options);
      try {
        guard.activePolicy.assertAllowed(target, { operation: 'https.get' });
        guard._recordAudit('https.get', target.href, 'ALLOWED');
        return original.httpsGet.apply(https, arguments);
      } catch (err) {
        guard._recordAudit('https.get', String(target.href || target), 'BLOCKED', err.message);
        throw err;
      }
    };
  }

  /**
   * Patches raw TCP socket creation (net.connect, net.Socket.prototype.connect).
   */
  static _patchNet() {
    const guard = this;

    // @ts-ignore
    net.connect = function () {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.netConnect.apply(net, arguments);
      }

      const normalized = guard._normalizeSocketArgs(arguments);
      if (normalized.isIpc) {
        // Local IPC / named pipes are not external network connections
        guard._recordAudit('net.connect', normalized.target, 'ALLOWED', 'LOCAL_IPC');
        return original.netConnect.apply(net, arguments);
      }

      try {
        const dummyUrl = `tcp://${normalized.host}:${normalized.port}`;
        guard.activePolicy.assertAllowed(dummyUrl, { operation: 'net.connect' });
        guard._recordAudit('net.connect', normalized.target, 'ALLOWED');
        return original.netConnect.apply(net, arguments);
      } catch (err) {
        guard._recordAudit('net.connect', normalized.target, 'BLOCKED', err.message);
        throw err;
      }
    };

    // @ts-ignore
    net.Socket.prototype.connect = function () {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.netSocketConnect.apply(this, arguments);
      }

      const normalized = guard._normalizeSocketArgs(arguments);
      if (normalized.isIpc) {
        guard._recordAudit('net.Socket.connect', normalized.target, 'ALLOWED', 'LOCAL_IPC');
        return original.netSocketConnect.apply(this, arguments);
      }

      try {
        const dummyUrl = `tcp://${normalized.host}:${normalized.port}`;
        guard.activePolicy.assertAllowed(dummyUrl, { operation: 'net.Socket.connect' });
        guard._recordAudit('net.Socket.connect', normalized.target, 'ALLOWED');
        return original.netSocketConnect.apply(this, arguments);
      } catch (err) {
        guard._recordAudit('net.Socket.connect', normalized.target, 'BLOCKED', err.message);
        throw err;
      }
    };
  }

  /**
   * Patches TLS socket creation (tls.connect).
   */
  static _patchTls() {
    const guard = this;

    // @ts-ignore
    tls.connect = function () {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.tlsConnect.apply(tls, arguments);
      }

      const normalized = guard._normalizeSocketArgs(arguments);
      if (normalized.isIpc) {
        guard._recordAudit('tls.connect', normalized.target, 'ALLOWED', 'LOCAL_IPC');
        return original.tlsConnect.apply(tls, arguments);
      }

      try {
        const dummyUrl = `https://${normalized.host}:${normalized.port}`;
        guard.activePolicy.assertAllowed(dummyUrl, { operation: 'tls.connect' });
        guard._recordAudit('tls.connect', normalized.target, 'ALLOWED');
        return original.tlsConnect.apply(tls, arguments);
      } catch (err) {
        guard._recordAudit('tls.connect', normalized.target, 'BLOCKED', err.message);
        throw err;
      }
    };
  }

  /**
   * Patches DNS lookup/resolution to prevent external DNS data egress in offline mode.
   */
  static _patchDns() {
    const guard = this;

    // @ts-ignore
    dns.lookup = function (hostname, options, callback) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.dnsLookup.apply(dns, arguments);
      }

      const cb = typeof options === 'function' ? options : callback;
      const host = String(hostname || '').toLowerCase();

      if (guard.activePolicy.isOffline()) {
        const isPermittedLocal = guard.activePolicy.allowLocalTestEndpoints && (host === 'localhost' || host === '127.0.0.1');
        if (!isPermittedLocal) {
          const err = new TaviNetworkError(`DNS lookup blocked: Offline mode active. Cannot resolve '${host}'.`, {
            code: 'OFFLINE_VIOLATION_BLOCKED',
            stage: 'dns_lookup',
            action: 'Run in online mode or use local cached assets.',
            blocking: true,
            details: { operation: 'dns.lookup', host }
          });
          guard._recordAudit('dns.lookup', host, 'BLOCKED', err.message);
          if (typeof cb === 'function') {
            return process.nextTick(() => cb(err));
          }
          throw err;
        }
      }

      guard._recordAudit('dns.lookup', host, 'ALLOWED');
      return original.dnsLookup.apply(dns, arguments);
    };

    // @ts-ignore
    dns.resolve = function (hostname, rrtype, callback) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return original.dnsResolve.apply(dns, arguments);
      }

      const cb = typeof rrtype === 'function' ? rrtype : callback;
      const host = String(hostname || '').toLowerCase();

      if (guard.activePolicy.isOffline()) {
        const err = new TaviNetworkError(`DNS resolve blocked: Offline mode active. Cannot resolve '${host}'.`, {
          code: 'OFFLINE_VIOLATION_BLOCKED',
          stage: 'dns_resolve',
          action: 'Run in online mode or use local cached assets.',
          blocking: true,
          details: { operation: 'dns.resolve', host }
        });
        guard._recordAudit('dns.resolve', host, 'BLOCKED', err.message);
        if (typeof cb === 'function') {
          return process.nextTick(() => cb(err));
        }
        throw err;
      }

      guard._recordAudit('dns.resolve', host, 'ALLOWED');
      return original.dnsResolve.apply(dns, arguments);
    };

    // Promises DNS
    // @ts-ignore
    dns.promises.lookup = async function (hostname, options) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return await original.dnsPromisesLookup.apply(dns.promises, arguments);
      }

      const host = String(hostname || '').toLowerCase();
      if (guard.activePolicy.isOffline()) {
        const isPermittedLocal = guard.activePolicy.allowLocalTestEndpoints && (host === 'localhost' || host === '127.0.0.1');
        if (!isPermittedLocal) {
          const err = new TaviNetworkError(`DNS lookup blocked: Offline mode active. Cannot resolve '${host}'.`, {
            code: 'OFFLINE_VIOLATION_BLOCKED',
            stage: 'dns_promises_lookup',
            action: 'Run in online mode or use local cached assets.',
            blocking: true,
            details: { operation: 'dns.promises.lookup', host }
          });
          guard._recordAudit('dns.promises.lookup', host, 'BLOCKED', err.message);
          throw err;
        }
      }

      guard._recordAudit('dns.promises.lookup', host, 'ALLOWED');
      return await original.dnsPromisesLookup.apply(dns.promises, arguments);
    };

    // @ts-ignore
    dns.promises.resolve = async function (hostname, rrtype) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return await original.dnsPromisesResolve.apply(dns.promises, arguments);
      }

      const host = String(hostname || '').toLowerCase();
      if (guard.activePolicy.isOffline()) {
        const err = new TaviNetworkError(`DNS resolve blocked: Offline mode active. Cannot resolve '${host}'.`, {
          code: 'OFFLINE_VIOLATION_BLOCKED',
          stage: 'dns_promises_resolve',
          action: 'Run in online mode or use local cached assets.',
          blocking: true,
          details: { operation: 'dns.promises.resolve', host }
        });
        guard._recordAudit('dns.promises.resolve', host, 'BLOCKED', err.message);
        throw err;
      }

      guard._recordAudit('dns.promises.resolve', host, 'ALLOWED');
      return await original.dnsPromisesResolve.apply(dns.promises, arguments);
    };
  }

  /**
   * Patches globalThis.fetch.
   */
  static _patchFetch() {
    const guard = this;
    if (typeof globalThis.fetch !== 'function') return;

    // @ts-ignore
    globalThis.fetch = async function (input, init) {
      if (!guard.isEnabled || !guard.activePolicy) {
        return await original.globalFetch.apply(globalThis, arguments);
      }

      let rawUrl = '';
      if (typeof input === 'string') {
        rawUrl = input;
      } else if (input instanceof URL) {
        rawUrl = input.href;
      } else if (input && typeof input.url === 'string') {
        rawUrl = input.url;
      }

      try {
        guard.activePolicy.assertAllowed(rawUrl, { operation: 'fetch' });
        guard._recordAudit('fetch', rawUrl, 'ALLOWED');
        return await original.globalFetch.apply(globalThis, arguments);
      } catch (err) {
        guard._recordAudit('fetch', rawUrl, 'BLOCKED', err.message);
        throw err;
      }
    };
  }

  /**
   * Helper to normalize socket arguments.
   * @param {IArguments} args 
   * @returns {{ host: string, port: number, isIpc: boolean, target: string }}
   */
  static _normalizeSocketArgs(args) {
    let port = 80;
    let host = 'localhost';
    let path = '';

    if (typeof args[0] === 'number') {
      port = args[0];
      if (typeof args[1] === 'string') host = args[1];
    } else if (typeof args[0] === 'string') {
      path = args[0];
    } else if (typeof args[0] === 'object' && args[0] !== null) {
      const opts = args[0];
      port = opts.port || port;
      host = opts.host || opts.hostname || host;
      path = opts.path || '';
    }

    const isIpc = Boolean(path && this.isLocalIpcPath(path));
    const target = isIpc ? `ipc:${path}` : `${host}:${port}`;
    return { host, port, isIpc, target };
  }

  /**
   * Resolves URL from HTTP/HTTPS arguments.
   * @param {'http:'|'https:'} defaultProto 
   * @param {any} urlOrOpts 
   * @param {any} options 
   * @returns {URL}
   */
  static _resolveUrlFromArgs(defaultProto, urlOrOpts, options) {
    if (urlOrOpts instanceof URL) {
      return urlOrOpts;
    }
    if (typeof urlOrOpts === 'string') {
      try {
        return new URL(urlOrOpts);
      } catch (_) {
        return new URL(urlOrOpts, `${defaultProto}//localhost`);
      }
    }

    const opts = (typeof urlOrOpts === 'object' && urlOrOpts !== null) ? urlOrOpts : (options || {});
    const protocol = opts.protocol || defaultProto;
    const host = opts.hostname || opts.host || 'localhost';
    const port = opts.port ? `:${opts.port}` : '';
    const path = opts.path || '/';
    return new URL(`${protocol}//${host}${port}${path}`);
  }
}

export default NetworkGuard;
