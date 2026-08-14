export interface AudioTrack {
  label: string;
  src: string;
  language: string;
  source?: boolean;
}

export interface AudioAvailability {
  enabled: boolean;
  hasAvailableAudio: boolean;
  sourceLanguage: string;
  originalTrack: AudioTrack | null;
  translatedTracks: Record<string, AudioTrack>;
  availableLanguages: string[];
  visibleLanguages: string[];
  resolvedTracks: Record<string, AudioTrack>;
  sourceByLanguage: Record<string, string>;
  selectedLanguage: string;
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
}

export function resolveAudioAvailability(options?: ResolveAudioAvailabilityOptions): AudioAvailability;

export default resolveAudioAvailability;

