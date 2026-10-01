import { ModelDefinition } from '../models/modelRegistry.d.ts';

export type PolicyProfile = 'RELAXED' | 'STRICT' | 'CUSTOM';
export type ExecutionMode = 'COMMERCIAL' | 'RESEARCH';
export type PolicyStatus = 'PERMITTED' | 'RESEARCH_ONLY' | 'CONTESTED' | 'UNKNOWN';
export type EvidenceState = 'VERIFIED' | 'OBSERVED' | 'RESEARCHED' | 'UNKNOWN' | 'TO_BE_VERIFIED';

export declare const POLICY_PROFILES: Readonly<Record<PolicyProfile, PolicyProfile>>;
export declare const EXECUTION_MODES: Readonly<Record<ExecutionMode, ExecutionMode>>;
export declare const POLICY_STATUS: Readonly<Record<PolicyStatus, PolicyStatus>>;

import { TaviPolicyError } from '../errors/index.d.ts';

export declare class PolicyError extends TaviPolicyError {
  code: string;
  constructor(message: string, code: string);
}

export interface PolicyEvaluationResult {
  readonly modelId: string | null;
  readonly languageCode: string | null;
  readonly policyProfile: PolicyProfile;
  readonly executionMode: ExecutionMode;
  readonly policyStatus: PolicyStatus;
  readonly permitted: boolean;
  readonly reason: string;
  readonly evidence: EvidenceState;
  readonly restrictions: readonly string[];
  readonly technicalCapability: string;
  readonly engine: string | null;
}

export interface PolicyEngineOptions {
  defaultProfile?: PolicyProfile | string;
  defaultExecutionMode?: ExecutionMode | string;
  customEvaluator?: (modelDef: ModelDefinition, context: { profile: string; mode: string }) => {
    policyStatus: PolicyStatus;
    permitted: boolean;
    reason: string;
    evidence?: EvidenceState;
    restrictions?: string[];
  };
}

export interface EvaluateOptions {
  policyProfile?: PolicyProfile | string;
  executionMode?: ExecutionMode | string;
  engine?: string | null;
}

export interface MatrixEvaluationResult {
  readonly results: readonly PolicyEvaluationResult[];
  readonly counts: {
    readonly totalLanguages: number;
    readonly commercialPermitted: number;
    readonly researchOnly: number;
    readonly subtitleOnly: number;
    readonly contested: number;
    readonly unknown: number;
  };
  readonly summary: {
    readonly policyProfile: string;
    readonly executionMode: string;
    readonly distributionString: string;
  };
}

export declare class PolicyEngine {
  defaultProfile: PolicyProfile;
  defaultExecutionMode: ExecutionMode;
  customEvaluator: ((modelDef: ModelDefinition, context: { profile: string; mode: string }) => any) | null;
  constructor(options?: PolicyEngineOptions);
  evaluate(modelOrLanguage: string | ModelDefinition, options?: EvaluateOptions): PolicyEvaluationResult;
  evaluateModel(model: string | ModelDefinition, options?: EvaluateOptions): PolicyEvaluationResult;
  evaluateLanguage(languageCode: string, options?: EvaluateOptions): PolicyEvaluationResult;
  evaluateMatrix(options?: EvaluateOptions): MatrixEvaluationResult;
}

export declare const defaultPolicyEngine: PolicyEngine;
export declare function evaluatePolicy(modelOrLanguage: string | ModelDefinition, options?: EvaluateOptions): PolicyEvaluationResult;
export declare function normalizePolicyProfile(profile: string): PolicyProfile;
export declare function normalizeExecutionMode(mode: string): ExecutionMode;

export default PolicyEngine;
