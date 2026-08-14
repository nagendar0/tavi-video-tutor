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
  hasAvailableSubtitles: boolean;
  availableLanguages: string[];
  visibleLanguages: string[];
  resolvedTracks: Record<string, string>;
  sourceByLanguage: Record<string, string>;
  selectedLanguage: string;
  reason: string;
}

export interface ResolveSubtitleAvailabilityOptions {
  subtitlesConfig?: 'all' | false | string[] | Record<string, string>;
  generatedSubtitles?: Record<string, string>;
  developerSubtitles?: Record<string, string>;
  uploadedSubtitles?: Record<string, string>;
  demoSubtitles?: Record<string, string>;
  selectedLanguage?: string;
}

export function resolveSubtitleAvailability(options?: ResolveSubtitleAvailabilityOptions): SubtitleAvailability;

export function resolveSubtitleVisibility(options?: any): any;

export default resolveSubtitleAvailability;
