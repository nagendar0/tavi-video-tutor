export interface RateAdaptationLimits {
  minRateFactor?: number;
  maxRateFactor?: number;
  allowPadding?: boolean;
  allowTruncate?: boolean;
  allowOverflow?: boolean;
  strictErrorOnOverflow?: boolean;
  preferNaturalPace?: boolean;
  toleranceSec?: number;
}

export interface RateAdaptationResult {
  mode: 'EXACT' | 'STRETCH' | 'PAD' | 'BOUNDED_STRETCH_AND_PAD' | 'BOUNDED_STRETCH' | 'TRUNCATE' | 'UNSATISFIABLE';
  rateFactor: number;
  tempoFactors: number[];
  expectedDuration: number;
  paddingBefore: number;
  paddingAfter: number;
  truncated: boolean;
  reason: string;
}

export interface ValidatedCueTiming {
  start: number;
  end: number;
  duration: number;
}

export declare function validateCueTiming(cue: Record<string, any>, index?: number): ValidatedCueTiming;
export declare function decomposeAtempo(factor: number): number[];
export declare function calculateRateAdaptation(params: {
  targetDuration: number;
  sourceDuration: number;
  limits?: RateAdaptationLimits;
}): RateAdaptationResult;

declare const _default: {
  validateCueTiming: typeof validateCueTiming;
  decomposeAtempo: typeof decomposeAtempo;
  calculateRateAdaptation: typeof calculateRateAdaptation;
};

export default _default;
