/**
 * Speaker Identity Model & Speaker Segment Model.
 * 
 * Implements strict, immutable data contracts for speaker representation across
 * transcription, translation, voice allocation, TTS synthesis, and timeline mixing.
 */

/**
 * Validates and normalizes a Speaker Identity profile.
 * @param {Object} profile 
 * @returns {Object}
 */
export function createSpeakerIdentity({
  speakerId,
  confidence = 1.0,
  characteristics = {},
  totalDuration = 0,
  segmentCount = 0
}) {
  if (!speakerId || typeof speakerId !== 'string') {
    throw new Error('createSpeakerIdentity: speakerId must be a non-empty string.');
  }

  return {
    speakerId,
    confidence: Number(Number(confidence).toFixed(3)),
    totalDuration: Number(Number(totalDuration).toFixed(3)),
    segmentCount: Math.max(0, parseInt(segmentCount, 10) || 0),
    characteristics: {
      pitchMeanHz: Number(characteristics.pitchMeanHz || 160),
      spectralCentroid: Number(characteristics.spectralCentroid || 1500),
      energyMean: Number(characteristics.energyMean || 0.1),
      speakingRateWpm: Number(characteristics.speakingRateWpm || 130),
      genderHint: characteristics.genderHint || (characteristics.pitchMeanHz > 175 ? 'female' : 'male')
    }
  };
}

/**
 * Validates and normalizes a Speaker Segment across pipeline stages.
 * 
 * Stage 1 (ASR / Detection):
 *   { segmentId, speakerId, startTime, endTime, duration, originalText, confidence, language }
 * 
 * Stage 2 (Post-Translation):
 *   { ..., translatedText, targetLanguage }
 * 
 * Stage 3 (Post-TTS / Alignment):
 *   { ..., generatedAudio, generatedDuration, voiceId }
 * 
 * @param {Object} seg 
 * @returns {Object}
 */
export function createSpeakerSegment(seg = {}) {
  if (!seg.speakerId) {
    throw new Error('createSpeakerSegment: speakerId is required.');
  }

  const startTime = Number(seg.startTime !== undefined ? seg.startTime : seg.start);
  const endTime = Number(seg.endTime !== undefined ? seg.endTime : seg.end);

  if (isNaN(startTime) || isNaN(endTime) || endTime < startTime) {
    throw new Error(`createSpeakerSegment: Invalid segment timestamps [${startTime}, ${endTime}].`);
  }

  const duration = Number((endTime - startTime).toFixed(3));
  const segmentId = seg.segmentId || seg.id || `seg_${Math.round(startTime * 1000)}_${Math.round(endTime * 1000)}`;

  const canonicalText = String(seg.text || seg.originalText || '').trim();
  const segment = {
    segmentId,
    speakerId: seg.speakerId,
    startTime,
    endTime,
    duration,
    text: canonicalText,
    originalText: canonicalText,
    confidence: Number((seg.confidence !== undefined ? seg.confidence : 1.0).toFixed(3)),
    language: String(seg.language || 'en').toLowerCase()
  };

  if (seg.translatedText !== undefined) {
    segment.translatedText = String(seg.translatedText).trim();
  }

  if (seg.targetLanguage !== undefined) {
    segment.targetLanguage = String(seg.targetLanguage).toLowerCase();
  }

  if (seg.voiceId !== undefined) {
    segment.voiceId = String(seg.voiceId);
  }

  if (seg.generatedAudio !== undefined) {
    segment.generatedAudio = seg.generatedAudio;
  }

  if (seg.generatedDuration !== undefined) {
    segment.generatedDuration = Number(seg.generatedDuration);
  }

  return segment;
}

export default {
  createSpeakerIdentity,
  createSpeakerSegment
};
