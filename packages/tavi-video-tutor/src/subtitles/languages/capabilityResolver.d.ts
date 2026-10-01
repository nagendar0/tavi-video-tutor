import { ModelDefinition, TechnicalCapability, EngineType, EvidenceState, RuntimeRequirements } from '../models/modelRegistry.d.ts';

export interface LanguageCapabilityReport {
  languageCode: string;
  languageName: string | null;
  nativeName: string | null;
  iso639_2: string | null;
  bcp47: string | null;
  supported: boolean;
  translationSupported: boolean;
  translationCapability: boolean;
  technicalCapability: TechnicalCapability;
  ttsSupported: boolean;
  canonicalEngine: EngineType | null;
  canonicalModel: ModelDefinition | null;
  alternativeModels: ModelDefinition[];
  allModels: ModelDefinition[];
  offlineCapability: boolean;
  runtimeRequirements: RuntimeRequirements | null;
  provenance: {
    publishedLicense: string | null;
    datasetLicense: string | null;
    baseLineage: string | null;
    lineageMentionsLessac: boolean | null;
    lineageMentionsNC: boolean | null;
    isFinetuned: boolean | null;
    evidence: EvidenceState;
  };
  error?: string;
}

export interface ResolverOptions {
  engine?: EngineType | null;
}

export class CapabilityResolver {
  constructor(options?: ResolverOptions);
  resolve(languageCode: string, options?: ResolverOptions): LanguageCapabilityReport;
  listAllCapabilities(options?: ResolverOptions): LanguageCapabilityReport[];
}

export const defaultCapabilityResolver: CapabilityResolver;
export function resolveCapability(languageCode: string, options?: ResolverOptions): LanguageCapabilityReport;
export function listAllCapabilities(options?: ResolverOptions): LanguageCapabilityReport[];

export default CapabilityResolver;
