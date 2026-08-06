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
}

export interface AITutorProps {
  src: string;
  id?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  className?: string;
  subtitles?: 'all' | false | string[] | Record<string, string>;
  tracks?: any[];
  config?: any;
  audioDubs?: Record<string, string>;
  qualities?: VideoQuality[];
  subLanguage?: string;
  defaultSubLanguage?: string;
  defaultAudioLanguage?: string;
  playbackRates?: number[];
  subtitleStyle?: SubtitleStyle;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onProgress?: (progress: { playedSeconds: number }) => void;
  onSubLanguageChange?: (lang: string) => void;
  onSubtitleGenerated?: (vttText: string, videoSrc: string) => void;
  onUpdateSubtitles?: (updatedSubtitles: any) => void;
  onTracksChange?: (tracks: any[]) => void;
}

export interface TaviVideoPlayerProps extends AITutorProps {
  manifestSubtitles?: Record<string, string>;
  manifestQualities?: VideoQuality[];
  resolvedSubtitles?: Record<string, string>;
  demoSubtitles?: Record<string, string>;
}

export declare const AITutor: React.ForwardRefExoticComponent<AITutorProps & React.RefAttributes<any>>;
export declare const TaviVideoPlayer: React.ForwardRefExoticComponent<TaviVideoPlayerProps & React.RefAttributes<any>>;

export declare function resolveSubtitleVisibility(params: any): any;
export declare function resolveSubtitleSources(params: any): any;
export declare function resolveQualitySources(params: any): any;

export default AITutor;
