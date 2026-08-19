export interface ResolveSubtitleSourcesOptions {
  demoSubtitles?: Record<string, any>;
  generatedSubtitles?: Record<string, any>;
  developerSubtitles?: Record<string, any>;
  uploadedSubtitles?: Record<string, any>;
}

export interface ResolvedSubtitleSources {
  resolvedTracks: Record<string, string>;
  sourceByLanguage: Record<string, string>;
}

export function resolveSubtitleSources(options?: ResolveSubtitleSourcesOptions): ResolvedSubtitleSources;

export interface SubtitleAvailability {
  enabled: boolean;
  hasAvailableItems: boolean;
  hasAvailableSubtitles: boolean;
  mode: string;
  requestedItems: string[] | null | 'all' | false;
  requestedLanguages: string[] | null | 'all' | false;
  availableItems: string[];
  availableLanguages: string[];
  visibleItems: string[];
  visibleLanguages: string[];
  resolvedItems: Record<string, string>;
  resolvedTracks: Record<string, string>;
  sourceByItem: Record<string, string>;
  sourceByLanguage: Record<string, string>;
  missingItems?: string[];
  missingLanguages?: string[];
  primarySource: string | null;
  reason: string;
}

export interface ResolveSubtitleAvailabilityOptions {
  subtitlesConfig?: 'all' | false | string[] | Record<string, string>;
  generatedSubtitles?: Record<string, string>;
  developerSubtitles?: Record<string, string>;
  uploadedSubtitles?: Record<string, string>;
  demoSubtitles?: Record<string, string>;
  embeddedTracks?: any[];
  selectedLanguage?: string;
  videoKey?: string;
}

export function resolveSubtitleAvailability(options?: ResolveSubtitleAvailabilityOptions): SubtitleAvailability;
export function resolveSubtitleVisibility(options?: any): any;
export function emitSubtitleDXWarning(missingList: string[], availableList?: string[], requestedList?: string[] | string, videoKey?: string): void;
export function clearWarnedSubtitleCache(): void;

export default resolveSubtitleAvailability;
