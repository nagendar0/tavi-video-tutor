import { NetworkPolicy, NetworkPolicyOptions } from './NetworkPolicy.js';

export interface NetworkAuditRecord {
  timestamp: string;
  operation: string;
  target: string;
  status: 'ALLOWED' | 'BLOCKED';
  reason?: string;
}

export declare class NetworkGuard {
  static activePolicy: NetworkPolicy | null;
  static isEnabled: boolean;
  static auditLog: NetworkAuditRecord[];

  static enable(policy?: NetworkPolicy | NetworkPolicyOptions): void;
  static disable(): void;
  static runIsolated<T>(
    policy: NetworkPolicy | NetworkPolicyOptions,
    fn: () => Promise<T> | T
  ): Promise<T>;
  static isLocalIpcPath(target: any): boolean;
}

export default NetworkGuard;
