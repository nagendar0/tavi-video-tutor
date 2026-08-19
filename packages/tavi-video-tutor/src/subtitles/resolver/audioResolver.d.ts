export interface AudioTrack {
  label: string;
  src: string;
  language: string;
  source?: boolean;
}

export interface AudioAvailability {
  enabled: boolean;
  hasAvailableItems: boolean;
  hasAvailableAudio: boolean;
  requestedItems?: string[] | null | 'all' | false;
  requestedLanguages?: string[] | null | 'all' | false;
  availableItems: string[];
  availableLanguages: string[];
  visibleItems: string[];
  visibleLanguages: string[];
  resolvedItems: Record<string, AudioTrack>;
  resolvedTracks: Record<string, AudioTrack>;
  sourceByItem: Record<string, string>;
  sourceByLanguage: Record<string, string>;
  sourceLanguage: string;
  originalTrack: AudioTrack | null;
  translatedTracks: Record<string, AudioTrack>;
  selectedLanguage: string;
  missingItems?: string[];
  missingLanguages?: string[];
  reason: string;
}

export interface ResolveAudioSourcesOptions {
  demoAudio?: Record<string, any>;
  manifestAudio?: Record<string, any>;
  developerAudio?: Record<string, any>;
}

export interface ResolvedAudioSources {
  resolvedTracks: Record<string, AudioTrack>;
  sourceByLanguage: Record<string, string>;
}

export function resolveAudioSources(options?: ResolveAudioSourcesOptions): ResolvedAudioSources;

export interface ResolveAudioAvailabilityOptions {
  audioLanguagesConfig?: 'all' | false | string[] | Record<string, any>;
  manifestAudio?: Record<string, any>;
  developerAudio?: Record<string, any>;
  demoAudio?: Record<string, any>;
  sourceLanguage?: string | null;
  selectedLanguage?: string;
  videoKey?: string;
}

export function resolveAudioAvailability(options?: ResolveAudioAvailabilityOptions): AudioAvailability;
export function emitAudioDXWarning(missingList: string[], availableList?: string[], requestedList?: string[] | string, videoKey?: string): void;
export function clearWarnedAudioCache(): void;

export default resolveAudioAvailability;
