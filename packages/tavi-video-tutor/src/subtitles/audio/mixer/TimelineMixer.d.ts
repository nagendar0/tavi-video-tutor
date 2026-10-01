export interface TimelineMixerOptions {
  ffmpegBin?: string;
  audioBitrate?: string;
  sampleRate?: number;
  maxBatchInputs?: number;
}

export interface MixExecutionOptions {
  totalDuration?: number;
  ambientAudioPath?: string | null;
  ambientDuckingDb?: number;
  sidechainDucking?: boolean;
  useSidechain?: boolean;
}

export declare class TimelineMixer {
  ffmpegBin: string;
  audioBitrate: string;
  sampleRate: number;
  maxBatchInputs: number;

  constructor(options?: TimelineMixerOptions);
  mix(segments: Array<Record<string, any>>, outputPath: string, options?: MixExecutionOptions): Promise<string>;
  singlePassMix(segments: Array<Record<string, any>>, outputPath: string, totalDuration: number, options?: MixExecutionOptions): Promise<string>;
  hierarchicalBatchMix(segments: Array<Record<string, any>>, outputPath: string, totalDuration: number, options?: MixExecutionOptions): Promise<string>;
  generateSilentTrack(outputPath: string, duration?: number): string;
}

export default TimelineMixer;
