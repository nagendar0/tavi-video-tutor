// @ts-check
import { TaviAudioError } from '../../errors/index.js';

/**
 * Validates a subtitle/audio cue timing object.
 * 
 * Invariants:
 * 1. start >= 0
 * 2. end > start
 * 3. duration > 0
 * 4. Numbers must be finite, non-NaN
 * 
 * @param {Record<string, any>} cue - Cue with start/startTime, end/endTime
 * @param {number} [index=0] - Optional index in cue sequence
 * @returns {{ start: number, end: number, duration: number }}
 */
export function validateCueTiming(cue, index = 0) {
  if (!cue || typeof cue !== 'object') {
    throw new TaviAudioError(`Cue at index ${index} must be an object`, {
      code: 'AUDIO_TIMELINE_INVALID',
      stage: 'timing_validation',
      details: { cueIndex: index, cue }
    });
  }

  const start = cue.startTime !== undefined ? cue.startTime : cue.start;
  const end = cue.endTime !== undefined ? cue.endTime : cue.end;

  if (typeof start !== 'number' || typeof end !== 'number') {
    throw new TaviAudioError(`Cue at index ${index} must have numeric start and end timestamps`, {
      code: 'AUDIO_TIMELINE_INVALID',
      stage: 'timing_validation',
      details: { cueIndex: index, start, end }
    });
  }

  if (isNaN(start) || isNaN(end) || !isFinite(start) || !isFinite(end)) {
    throw new TaviAudioError(`Cue at index ${index} has NaN or non-finite timestamp (start: ${start}, end: ${end})`, {
      code: 'AUDIO_TIMELINE_INVALID',
      stage: 'timing_validation',
      details: { cueIndex: index, start, end }
    });
  }

  if (start < 0) {
    throw new TaviAudioError(`Cue at index ${index} has negative start timestamp: ${start}`, {
      code: 'AUDIO_TIMELINE_INVALID',
      stage: 'timing_validation',
      details: { cueIndex: index, start, end }
    });
  }

  if (end <= start) {
    throw new TaviAudioError(`Cue at index ${index} has end timestamp <= start (start: ${start}, end: ${end})`, {
      code: 'AUDIO_TIMELINE_INVALID',
      stage: 'timing_validation',
      details: { cueIndex: index, start, end }
    });
  }

  const duration = Number((end - start).toFixed(4));
  if (duration <= 0) {
    throw new TaviAudioError(`Cue at index ${index} has non-positive duration: ${duration}`, {
      code: 'AUDIO_DURATION_INVALID',
      stage: 'timing_validation',
      details: { cueIndex: index, start, end, duration }
    });
  }

  return { start, end, duration };
}

/**
 * Decomposes an arbitrary tempo factor into a sequence of FFmpeg atempo filters
 * where each filter's factor is strictly bounded within [0.5, 2.0].
 * 
 * Ensures universal cross-platform compatibility across all FFmpeg versions.
 * 
 * @param {number} factor 
 * @returns {number[]} Array of factors in [0.5, 2.0]
 */
export function decomposeAtempo(factor) {
  if (typeof factor !== 'number' || isNaN(factor) || !isFinite(factor) || factor <= 0) {
    return [1.0];
  }

  if (Math.abs(factor - 1.0) < 0.0001) {
    return [1.0];
  }

  const factors = [];
  let remaining = factor;

  if (remaining > 2.0) {
    while (remaining > 2.0) {
      factors.push(2.0);
      remaining /= 2.0;
    }
    factors.push(Number(remaining.toFixed(4)));
  } else if (remaining < 0.5) {
    while (remaining < 0.5) {
      factors.push(0.5);
      remaining /= 0.5;
    }
    factors.push(Number(remaining.toFixed(4)));
  } else {
    factors.push(Number(remaining.toFixed(4)));
  }

  return factors;
}

/**
 * Pure, deterministic rate adaptation calculator.
 * 
 * Determines how speech audio should be dynamically transformed to fit
 * within the target subtitle cue window while preserving intelligibility
 * and acoustic quality without destructive over-distortion.
 * 
 * @param {Object} params
 * @param {number} params.targetDuration - Cue window duration in seconds (> 0)
 * @param {number} params.sourceDuration - Actual synthesized speech duration in seconds (> 0)
 * @param {Object} [params.limits]
 * @param {number} [params.limits.minRateFactor=0.75] - Minimum slowdown factor (e.g. 0.75x)
 * @param {number} [params.limits.maxRateFactor=1.50] - Maximum speedup factor (e.g. 1.50x)
 * @param {boolean} [params.limits.allowPadding=true] - Pad with silence when speech is shorter
 * @param {boolean} [params.limits.allowTruncate=false] - Truncate audio when speech exceeds limits
 * @param {boolean} [params.limits.allowOverflow=false] - Allow audio to extend past cue window
 * @param {boolean} [params.limits.strictErrorOnOverflow=false] - Strict error mode on overflow
 * @param {boolean} [params.limits.preferNaturalPace=true] - Preserve normal 1.0x pace with padding for shorter speech
 * @param {number} [params.limits.toleranceSec=0.05] - Tolerance threshold in seconds
 * @returns {{
 *   mode: 'EXACT'|'STRETCH'|'PAD'|'BOUNDED_STRETCH_AND_PAD'|'BOUNDED_STRETCH'|'TRUNCATE'|'UNSATISFIABLE',
 *   rateFactor: number,
 *   tempoFactors: number[],
 *   expectedDuration: number,
 *   paddingBefore: number,
 *   paddingAfter: number,
 *   truncated: boolean,
 *   reason: string
 * }}
 */
export function calculateRateAdaptation({
  targetDuration,
  sourceDuration,
  limits = {}
}) {
  if (typeof targetDuration !== 'number' || isNaN(targetDuration) || !isFinite(targetDuration) || targetDuration <= 0) {
    throw new TaviAudioError(`Target duration must be a positive finite number: ${targetDuration}`, {
      code: 'AUDIO_DURATION_INVALID',
      stage: 'rate_adaptation',
      details: { targetDuration, sourceDuration }
    });
  }

  if (typeof sourceDuration !== 'number' || isNaN(sourceDuration) || !isFinite(sourceDuration) || sourceDuration <= 0) {
    throw new TaviAudioError(`Source duration must be a positive finite number: ${sourceDuration}`, {
      code: 'AUDIO_DURATION_INVALID',
      stage: 'rate_adaptation',
      details: { targetDuration, sourceDuration }
    });
  }

  const minRateFactor = limits.minRateFactor ?? 0.75;
  const maxRateFactor = limits.maxRateFactor ?? 1.50;
  const allowPadding = limits.allowPadding ?? true;
  const allowTruncate = limits.allowTruncate ?? false;
  const allowOverflow = limits.allowOverflow ?? false;
  const preferNaturalPace = limits.preferNaturalPace ?? true;
  const toleranceSec = limits.toleranceSec ?? 0.05;

  const rawRatio = sourceDuration / targetDuration;

  // 1. Exact match within tolerance
  if (Math.abs(sourceDuration - targetDuration) <= toleranceSec) {
    return {
      mode: 'EXACT',
      rateFactor: 1.0,
      tempoFactors: [1.0],
      expectedDuration: sourceDuration,
      paddingBefore: 0,
      paddingAfter: Math.max(0, Number((targetDuration - sourceDuration).toFixed(4))),
      truncated: false,
      reason: 'Speech duration closely matches cue target window'
    };
  }

  // 2. Speech longer than target window (requires speedup)
  if (sourceDuration > targetDuration) {
    if (rawRatio <= maxRateFactor) {
      const factor = Number(rawRatio.toFixed(4));
      return {
        mode: 'STRETCH',
        rateFactor: factor,
        tempoFactors: decomposeAtempo(factor),
        expectedDuration: Number(targetDuration.toFixed(4)),
        paddingBefore: 0,
        paddingAfter: 0,
        truncated: false,
        reason: 'Speech sped up within acceptable distortion limits to match target duration'
      };
    }

    // Exceeds max allowable speedup
    if (allowTruncate) {
      return {
        mode: 'TRUNCATE',
        rateFactor: maxRateFactor,
        tempoFactors: decomposeAtempo(maxRateFactor),
        expectedDuration: Number(targetDuration.toFixed(4)),
        paddingBefore: 0,
        paddingAfter: 0,
        truncated: true,
        reason: 'Speech clamped to maximum tempo and truncated to cue boundary'
      };
    }

    if (limits.strictErrorOnOverflow) {
      const expected = Number((sourceDuration / maxRateFactor).toFixed(4));
      return {
        mode: 'UNSATISFIABLE',
        rateFactor: maxRateFactor,
        tempoFactors: decomposeAtempo(maxRateFactor),
        expectedDuration: expected,
        paddingBefore: 0,
        paddingAfter: 0,
        truncated: false,
        reason: `Speech duration (${sourceDuration.toFixed(3)}s) exceeds target duration (${targetDuration.toFixed(3)}s) beyond maximum allowable stretch factor (${maxRateFactor}x)`
      };
    }

    // Default strategy: Bounded stretch to maxRateFactor
    const expected = Number((sourceDuration / maxRateFactor).toFixed(4));
    return {
      mode: 'BOUNDED_STRETCH',
      rateFactor: maxRateFactor,
      tempoFactors: decomposeAtempo(maxRateFactor),
      expectedDuration: expected,
      paddingBefore: 0,
      paddingAfter: 0,
      truncated: false,
      reason: 'Speech clamped to maximum tempo and permitted to overflow cue window'
    };
  }

  // 3. Speech shorter than target window (requires padding or slowdown)
  if (allowPadding) {
    if (preferNaturalPace || rawRatio < minRateFactor) {
      const padding = Number((targetDuration - sourceDuration).toFixed(4));
      return {
        mode: 'PAD',
        rateFactor: 1.0,
        tempoFactors: [1.0],
        expectedDuration: sourceDuration,
        paddingBefore: 0,
        paddingAfter: Math.max(0, padding),
        truncated: false,
        reason: 'Speech duration padded with trailing silence to preserve natural speech tempo'
      };
    }

    // Moderate slowdown within limits
    const factor = Number(rawRatio.toFixed(4));
    return {
      mode: 'STRETCH',
      rateFactor: factor,
      tempoFactors: decomposeAtempo(factor),
      expectedDuration: Number(targetDuration.toFixed(4)),
      paddingBefore: 0,
      paddingAfter: 0,
      truncated: false,
      reason: 'Speech slowed down to fill target duration'
    };
  }

  // No padding allowed
  if (rawRatio >= minRateFactor) {
    const factor = Number(rawRatio.toFixed(4));
    return {
      mode: 'STRETCH',
      rateFactor: factor,
      tempoFactors: decomposeAtempo(factor),
      expectedDuration: Number(targetDuration.toFixed(4)),
      paddingBefore: 0,
      paddingAfter: 0,
      truncated: false,
      reason: 'Speech slowed down within acceptable distortion limits to fill cue window'
    };
  }

  const expected = Number((sourceDuration / minRateFactor).toFixed(4));
  return {
    mode: 'UNSATISFIABLE',
    rateFactor: minRateFactor,
    tempoFactors: decomposeAtempo(minRateFactor),
    expectedDuration: expected,
    paddingBefore: 0,
    paddingAfter: 0,
    truncated: false,
    reason: `Speech duration (${sourceDuration.toFixed(3)}s) is shorter than target duration (${targetDuration.toFixed(3)}s) beyond minimum allowable stretch factor (${minRateFactor}x)`
  };
}

export default {
  validateCueTiming,
  decomposeAtempo,
  calculateRateAdaptation
};
