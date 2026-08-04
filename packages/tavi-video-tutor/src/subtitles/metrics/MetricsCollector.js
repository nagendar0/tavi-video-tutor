export class MetricsCollector {
  constructor(videoDuration = 0) {
    this.videoDuration = Number(videoDuration) || 0;
    this.startTime = Date.now();
    this.timing = {
      audioExtractionTime: 0,
      asrTime: 0,
      translationTime: 0,
      vttTime: 0,
      totalTime: 0
    };
    this.cacheStats = {
      hits: 0,
      misses: 0
    };
    this.qualityStats = {
      cuesCount: 0,
      avgDuration: 0,
      maxDuration: 0,
      avgReadingSpeed: 0, // cps
      maxReadingSpeed: 0,
      overlongCues: 0,
      overlappingCues: 0,
      zeroDurationCues: 0,
      readingSpeedWarnings: 0
    };
  }

  recordTiming(phase, durationMs) {
    if (this.timing.hasOwnProperty(phase)) {
      this.timing[phase] += durationMs;
    }
  }

  getRealTimeFactor() {
    if (!this.videoDuration || this.videoDuration <= 0) return 0;
    const asrSec = this.timing.asrTime / 1000;
    return Number((asrSec / this.videoDuration).toFixed(2));
  }

  analyzeQuality(cues = []) {
    if (!Array.isArray(cues) || cues.length === 0) return;

    this.qualityStats.cuesCount = cues.length;
    let totalDur = 0;
    let totalChars = 0;
    let maxDur = 0;
    let maxSpeed = 0;

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      const dur = Math.max(0, Number(cue.end) - Number(cue.start));
      const charCount = String(cue.text || '').length;

      if (dur === 0) {
        this.qualityStats.zeroDurationCues++;
      }
      if (dur > 6.0) {
        this.qualityStats.overlongCues++;
      }

      totalDur += dur;
      totalChars += charCount;

      if (dur > maxDur) maxDur = dur;

      if (dur > 0) {
        const speed = charCount / dur;
        if (speed > maxSpeed) maxSpeed = speed;
        if (speed > 20) { // Warning threshold: >20 cps
          this.qualityStats.readingSpeedWarnings++;
        }
      }

      // Check overlap
      if (i < cues.length - 1) {
        const next = cues[i + 1];
        if (Number(cue.end) > Number(next.start)) {
          this.qualityStats.overlappingCues++;
        }
      }
    }

    this.qualityStats.avgDuration = cues.length > 0 ? Number((totalDur / cues.length).toFixed(1)) : 0;
    this.qualityStats.maxDuration = Number(maxDur.toFixed(1));
    this.qualityStats.avgReadingSpeed = totalDur > 0 ? Number((totalChars / totalDur).toFixed(1)) : 0;
    this.qualityStats.maxReadingSpeed = Number(maxSpeed.toFixed(1));
  }

  getSummaryReport(videoId) {
    this.timing.totalTime = Date.now() - this.startTime;
    const rtf = this.getRealTimeFactor();

    return {
      videoId,
      videoDuration: `${this.videoDuration.toFixed(1)}s`,
      timing: {
        audioExtraction: `${(this.timing.audioExtractionTime / 1000).toFixed(1)}s`,
        asr: `${(this.timing.asrTime / 1000).toFixed(1)}s`,
        translation: `${(this.timing.translationTime / 1000).toFixed(1)}s`,
        vtt: `${(this.timing.vttTime / 1000).toFixed(1)}s`,
        total: `${(this.timing.totalTime / 1000).toFixed(1)}s`
      },
      rtf: rtf > 0 ? rtf : 'N/A',
      cacheStats: this.cacheStats,
      qualityStats: this.qualityStats
    };
  }
}
