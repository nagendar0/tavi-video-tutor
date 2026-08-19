export interface VideoQuality {
  label: string;
  src: string;
  index?: number;
  height?: number;
  width?: number;
  bitrate?: number;
  [key: string]: any;
}

export interface QualityAvailability {
  enabled: boolean;
  hasAvailableItems: boolean;
  hasAvailableQualities: boolean;
  mode: string;
  requestedItems: string[] | VideoQuality[] | null | 'all' | false;
  requestedQualities: string[] | VideoQuality[] | null | 'all' | false;
  availableItems: string[];
  availableQualities: string[];
  visibleItems: string[];
  visibleQualities: string[];
  resolvedItems: VideoQuality[];
  resolvedQualities: VideoQuality[];
  qualities: VideoQuality[];
  sourceByItem: Record<string, string>;
  sourceByQuality: Record<string, string>;
  source: string;
  primarySource: string;
  missingItems?: string[];
  missingQualities?: string[];
  reason: string;
}

export interface ResolveQualityAvailabilityOptions {
  qualitiesConfig?: 'all' | false | string[] | VideoQuality[];
  qualities?: 'all' | false | string[] | VideoQuality[];
  hlsQualities?: VideoQuality[];
  config?: any;
  manifestQualities?: VideoQuality[];
  videoKey?: string;
}

export function resolveQualityAvailability(options?: ResolveQualityAvailabilityOptions): QualityAvailability;
export function resolveQualitySources(options?: ResolveQualityAvailabilityOptions): QualityAvailability;
export function emitQualityDXWarning(missingList: string[], availableList?: string[], requestedList?: string[] | string, videoKey?: string): void;
export function clearWarnedQualityCache(): void;

export default resolveQualityAvailability;
