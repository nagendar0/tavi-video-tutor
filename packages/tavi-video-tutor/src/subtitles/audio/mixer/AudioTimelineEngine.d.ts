export interface AudioTimelineEngineOptions {
  minTempo?: number;
  maxTempo?: number;
  allowPadding?: boolean;
  allowTruncate?: boolean;
  allowOverflow?: boolean;
  preferNaturalPace?: boolean;
  sampleRate?: number;
  outputDir?: string;
}

export interface AlignedSegment {
  startTime: number;
  endTime: number;
  targetDuration: number;
  actualSpeechDuration: number;
  alignedAudioPath: string;
  alignedDuration: number;
  appliedTempo: number;
  tempoFactors: number[];
  adaptationMode: string;
  paddingBefore: number;
  paddingAfter: number;
  truncated: boolean;
  speakerId?: string;
  voiceId?: string;
  targetLanguage?: string;
  cueIndex?: number;
  [key: string]: any;
}

export interface MasterTimelineResult {
  speakerTracks?: Record<string, Array<any>>;
  totalCues?: number;
  timelineStart?: number;
  timelineEnd?: number;
  cumulativeDrift?: number;
  overlaps?: Array<{
    spkA: string;
    spkB: string;
    start: number;
    end: number;
    overlapSec: number;
  }>;
  [speakerId: string]: any;
}

export declare class AudioTimelineEngine {
  minTempo: number;
  maxTempo: number;
  allowPadding: boolean;
  allowTruncate: boolean;
  allowOverflow: boolean;
  preferNaturalPace: boolean;
  sampleRate: number;
  outputDir: string;

  constructor(options?: AudioTimelineEngineOptions);
  measureAudioDuration(filePath: string, fallbackDuration?: number): number;
  alignSegment(segment: Record<string, any>, workspaceDir?: string): Promise<AlignedSegment>;
  buildMasterTimeline(alignedSegments?: Array<Record<string, any>>): MasterTimelineResult;
}

export default AudioTimelineEngine;
