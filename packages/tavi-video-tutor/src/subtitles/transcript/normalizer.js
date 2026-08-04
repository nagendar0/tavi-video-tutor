import { TerminologyGlossary } from './glossary.js';

export class TranscriptNormalizer {
  constructor(options = {}) {
    this.glossary = options.glossary instanceof TerminologyGlossary
      ? options.glossary
      : new TerminologyGlossary(options.glossaryTerms || []);
  }

  normalizeSegmentText(text) {
    if (!text || typeof text !== 'string') return text;

    // 1. Unicode Normalization (NFC)
    let cleaned = text.normalize('NFC');

    // 2. Normalize repeated whitespace & control chars
    cleaned = cleaned.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

    // 3. Fix obvious punctuation spacing (e.g. space before comma/period, missing space after)
    cleaned = cleaned
      .replace(/\s+([,.!?;:])(?!\d)/g, '$1')
      .replace(/([,.!?;:])(?=[a-zA-Z])/g, '$1 ');

    // 4. Fix capitalized start if missing
    if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    // 5. Terminology Glossing
    cleaned = this.glossary.normalizeText(cleaned);

    return cleaned;
  }

  normalizeSegments(segments = []) {
    if (!Array.isArray(segments)) return [];

    return segments.map((seg) => {
      const normalizedText = this.normalizeSegmentText(seg.text);
      return {
        ...seg,
        start: Number(seg.start),
        end: Number(seg.end),
        text: normalizedText
      };
    });
  }

  normalizeTranscript(rawTranscript) {
    if (!rawTranscript || !Array.isArray(rawTranscript.segments)) {
      return rawTranscript;
    }

    const normalizedSegments = this.normalizeSegments(rawTranscript.segments);
    return {
      language: rawTranscript.language || 'en',
      segments: normalizedSegments
    };
  }
}
