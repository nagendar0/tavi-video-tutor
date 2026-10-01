import { URL } from 'url';

export type NetworkMode = 'OFFLINE' | 'ONLINE_RESTRICTED';

export declare const NETWORK_MODES: Readonly<{
  OFFLINE: 'OFFLINE';
  ONLINE_RESTRICTED: 'ONLINE_RESTRICTED';
}>;

export declare const DEFAULT_ONLINE_ALLOWLIST: Readonly<string[]>;

export interface NetworkPolicyOptions {
  mode?: NetworkMode;
  offline?: boolean;
  allowedDomains?: string[];
  allowPrivateNetwork?: boolean;
  allowLocalTestEndpoints?: boolean;
}

export declare class NetworkPolicy {
  mode: NetworkMode;
  allowedDomains: string[];
  allowPrivateNetwork: boolean;
  allowLocalTestEndpoints: boolean;

  constructor(options?: NetworkPolicyOptions);
  isOffline(): boolean;
  setMode(mode: NetworkMode): void;
  matchesDomainPattern(hostname: string, pattern: string): boolean;
  parseUrl(urlInput: string | URL): URL;
  assertAllowed(urlInput: string | URL, context?: Record<string, any>): URL;
  isAllowed(urlInput: string | URL, context?: Record<string, any>): boolean;
  validateRedirect(currentUrl: string | URL, redirectUrl: string | URL, context?: Record<string, any>): URL;
}

export default NetworkPolicy;
