import * as React from 'react';

export interface SubtitleStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  color?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  borderRadius?: number;
  paddingX?: number;
  paddingY?: number;
  lineHeight?: number;
  shadowBlur?: number;
  shadowColor?: string;
  bottomOffset?: number;
}

export interface VideoQuality {
  label: string;
  src: string;
  index?: number;
  height?: number;
  width?: number;
  bitrate?: number;
  [key: string]: any;
}

export interface AudioTrack {
  label: string;
  src: string;
  language: string;
  source?: boolean;
}

export type AudioLanguage = string;
export type AudioLanguageMap = Record<string, string | AudioTrack>;
export type AudioLanguages = 'all' | false | string[] | AudioLanguageMap;

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

export interface AudioLanguageChangeEvent {
  language: string;
  previousLanguage?: string;
  source?: string;
  [key: string]: any;
}

export interface AITutorProps {
  src: string;
  id?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  subtitles?: 'all' | false | string[] | Record<string, string>;
  audioLanguages?: AudioLanguages;
  sourceLanguage?: string;
  tracks?: any[];
  config?: any;
  audioDubs?: Record<string, string | AudioTrack>;
  qualities?: 'all' | false | string[] | VideoQuality[];
  subLanguage?: string;
  defaultSubLanguage?: string;
  playbackRates?: number[];
  subtitleStyle?: SubtitleStyle;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (progress: { playedSeconds: number }) => void;
  onSubLanguageChange?: (lang: string) => void;
  onAudioLanguageChange?: (event: AudioLanguageChangeEvent) => void;
  onQualityChange?: (quality: VideoQuality | string) => void;
  onSubtitleGenerated?: (vttText: string, videoSrc: string) => void;
  onUpdateSubtitles?: (updatedSubtitles: any) => void;
  onTracksChange?: (tracks: any[]) => void;
}

export interface TaviVideoPlayerProps extends AITutorProps {
  manifestSubtitles?: Record<string, string>;
  manifestQualities?: VideoQuality[];
  manifestAudioLanguages?: Record<string, AudioTrack>;
  manifestSourceLanguage?: string;
  resolvedSubtitles?: Record<string, string>;
  resolvedAudioTracks?: Record<string, AudioTrack>;
  subtitleAvailability?: SubtitleAvailability;
  audioAvailability?: AudioAvailability;
  qualityAvailability?: QualityAvailability;
  demoSubtitles?: Record<string, string>;
}

export declare const AITutor: React.ForwardRefExoticComponent<AITutorProps & React.RefAttributes<any>>;
export declare const TaviVideoPlayer: React.ForwardRefExoticComponent<TaviVideoPlayerProps & React.RefAttributes<any>>;

export declare function resolveSubtitleVisibility(params?: any): any;
export declare function resolveSubtitleSources(params?: any): any;
export declare function resolveSubtitleAvailability(params?: any): SubtitleAvailability;
export declare function emitSubtitleDXWarning(missingList: string[], availableList: string[], videoKey?: string): void;
export declare function clearWarnedSubtitleCache(): void;

export declare function resolveQualitySources(params?: any): any;
export declare function resolveQualityAvailability(params?: any): QualityAvailability;
export declare function emitQualityDXWarning(missingList: string[], availableList: string[], videoKey?: string): void;
export declare function clearWarnedQualityCache(): void;

export declare function resolveAudioSources(params?: any): any;
export declare function resolveAudioAvailability(params?: any): AudioAvailability;
export declare function emitAudioDXWarning(missingList: string[], availableList: string[], videoKey?: string): void;
export declare function clearWarnedAudioCache(): void;

export default AITutor;
