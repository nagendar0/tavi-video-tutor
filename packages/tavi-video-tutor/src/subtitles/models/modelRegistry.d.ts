export type TechnicalCapability = 'NONE' | 'SUBTITLE_ONLY' | 'LOCAL_NEURAL' | 'LOCAL_NEURAL_RESEARCH';
export type EngineType = 'piper' | 'kokoro' | 'mms';
export type ModelType = 'onnx-piper' | 'onnx-kokoro' | 'vits-mms';
export type EvidenceState = 'VERIFIED' | 'OBSERVED' | 'RESEARCHED' | 'UNKNOWN' | 'TO_BE_VERIFIED';

export interface RuntimeRequirements {
  minMemoryMB: number;
  recommendedThreads: number;
  supportedPlatforms: string[];
}

export interface ModelDefinition {
  modelId: string;
  languageCode: string;
  languageName: string;
  bcp47: string;
  engine: EngineType;
  modelName: string;
  modelType: ModelType;
  artifactUrl: string | null;
  artifactPath: string | null;
  checksumSha256: string | null;
  checksumMd5: string | null;
  sizeBytes: number | null;
  sampleRate: number | null;
  voiceGenders: string[];
  publishedLicense: string | null;
  datasetLicense: string | null;
  baseLineage: string | null;
  isFinetuned: boolean | null;
  lineageMentionsLessac: boolean | null;
  lineageMentionsNC: boolean | null;
  offlineCapability: boolean;
  runtimeRequirements: RuntimeRequirements;
  evidence: EvidenceState;
}

export interface LanguageModelEntry {
  languageCode: string;
  languageName: string;
  iso639_2: string;
  bcp47: string;
  translationCapability: boolean;
  technicalCapability: TechnicalCapability;
  canonicalEngine: EngineType | null;
  canonicalModel: ModelDefinition | null;
  alternativeModels: ModelDefinition[];
  offlineCapability: boolean;
  runtimeRequirements: RuntimeRequirements;
  provenance: {
    publishedLicense: string | null;
    datasetLicense: string | null;
    baseLineage: string | null;
    lineageMentionsLessac: boolean | null;
    lineageMentionsNC: boolean | null;
    isFinetuned: boolean | null;
    evidence: EvidenceState;
  };
}

export interface ModelInventoryStats {
  totalLanguages: number;
  localNeuralCapable: number;
  subtitleOnly: number;
  canonicalByEngine: { piper: number; mms: number; kokoro: number };
  technicalCapabilityCounts: { LOCAL_NEURAL: number; LOCAL_NEURAL_RESEARCH: number; SUBTITLE_ONLY: number };
  totalModels: number;
}

export function getModel(modelId: string): ModelDefinition | null;
export function getCanonicalModel(languageCode: string, engine?: EngineType | null): ModelDefinition | null;
export function getAlternativeModels(languageCode: string): ModelDefinition[];
export function findModelsForLanguage(languageCode: string): ModelDefinition[];
export function getAllModels(): ModelDefinition[];
export function getLanguageModelEntry(languageCode: string): LanguageModelEntry | null;
export function getAllLanguageModelEntries(): LanguageModelEntry[];
export function getModelInventoryStats(): ModelInventoryStats;

export const ModelRegistry: {
  getModel: typeof getModel;
  getCanonicalModel: typeof getCanonicalModel;
  getAlternativeModels: typeof getAlternativeModels;
  findModelsForLanguage: typeof findModelsForLanguage;
  getAllModels: typeof getAllModels;
  getLanguageModelEntry: typeof getLanguageModelEntry;
  getAllLanguageModelEntries: typeof getAllLanguageModelEntries;
  getModelInventoryStats: typeof getModelInventoryStats;
};

export default ModelRegistry;
