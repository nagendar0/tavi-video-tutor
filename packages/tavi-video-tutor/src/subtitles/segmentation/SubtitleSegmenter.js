export const ATOMIC_PATTERNS = [
  // Multi-word commands & tech terms
  /\bnpm\s+run\s+[a-zA-Z0-9_-]+\b/gi,
  /\bnpm\s+install(\s+[a-zA-Z0-9_@/-]+)?\b/gi,
  /\bgit\s+(commit|push|pull|status|checkout|branch)\b/gi,
  /\bnode\s+[a-zA-Z0-9_.-]+\b/gi,
  /\bpython\s+[a-zA-Z0-9_.-]+\b/gi,
  /\b(Claude|GPT|Node|Python|React|FFmpeg)\s+\d+(\.\d+)*\b/gi,
  /\b(React|Next|Node|Vue|Express|Angular)\.js\b/gi,
  /\b(Tailwind\s+CSS|React\s+Router|OpenAI\s+API)\b/gi,
  // URLs, paths, JSX
  /https?:\/\/[^\s]+/gi,
  /localhost:\d+[^\s]*/gi,
  /\/api\/[^\s]+/gi,
  /<[A-Za-z0-9_.]+(\s+[^>]*)?\/?>/g,
  // Units & Numbers
  /\b\d+(\.\d+)?\s*(GB|MB|KB|%|ms|s|units|px)\b/gi,
  // Math & Science expressions
  /\b6\s*CO2\b/gi,
  /\b6\s*H2O\b/gi,
  /\bx\s*squared\b/gi,
  /\b\d+x\b/gi
];

export class SubtitleSegmenter {
  constructor(options = {}) {
    this.maxLines = options.maxLines || 2;
    this.maxCharsPerLine = options.maxCharsPerLine || 37;
    this.minDuration = options.minDuration || 1.0;
    this.maxDuration = options.maxDuration || 6.0;
    this.targetReadingSpeed = options.targetReadingSpeed || 17.0; // characters per second
    this.minGap = options.minGap || 0.1;
  }

  /**
   * Protect atomic multi-word or compound technical entities into indivisible placeholders
   */
  protectAtomicTokens(text) {
    if (!text || typeof text !== 'string') {
      return { text: '', map: new Map() };
    }

    let result = text;
    const map = new Map();
    let count = 0;

    for (const pattern of ATOMIC_PATTERNS) {
      result = result.replace(pattern, (match) => {
        const placeholder = `__ATOMIC_${count}__`;
        map.set(placeholder, match);
        count++;
        return placeholder;
      });
    }

    return { text: result, map };
  }

  /**
   * Restore atomic placeholders back to original text
   */
  restoreAtomicTokens(text, map) {
    if (!text || !map || map.size === 0) return text;
    let restored = text;
    map.forEach((original, placeholder) => {
      restored = restored.replace(new RegExp(placeholder, 'g'), original);
    });
    return restored;
  }

  /**
   * Split a single raw ASR segment into readable subtitle cues
   */
  segmentSingleCue(segment) {
    const text = String(segment.text || '').trim();
    if (!text) return [];

    const start = Number(segment.start);
    const end = Number(segment.end);
    const totalDuration = Math.max(0.1, end - start);
    const maxCharsPerCue = this.maxLines * this.maxCharsPerLine;

    // Check if cue fits naturally without splitting
    if (text.length <= maxCharsPerCue && totalDuration <= this.maxDuration) {
      const formattedText = this.wrapText(text);
      return [{
        start,
        end: Math.max(start + this.minDuration, end),
        text: formattedText
      }];
    }

    // Split text into phrase-aligned chunks
    const textChunks = this.splitTextIntoPhraseChunks(text, maxCharsPerCue);
    const totalLength = textChunks.reduce((sum, chunk) => sum + chunk.length, 0);

    const cues = [];
    let currentStart = start;

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const weight = totalLength > 0 ? (chunk.length / totalLength) : (1 / textChunks.length);
      const chunkDuration = Math.max(this.minDuration, totalDuration * weight);
      const chunkEnd = i === textChunks.length - 1 ? end : Math.min(end, currentStart + chunkDuration);

      cues.push({
        start: currentStart,
        end: Math.max(currentStart + this.minDuration, chunkEnd),
        text: this.wrapText(chunk)
      });

      currentStart = chunkEnd + this.minGap;
    }

    return cues;
  }

  /**
   * Split text cleanly at phrase boundaries, punctuation, or word boundaries
   */
  splitTextIntoPhraseChunks(text, maxChars) {
    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const testChunk = currentChunk ? `${currentChunk} ${word}` : word;

      if (testChunk.length <= maxChars) {
        currentChunk = testChunk;
        // Natural punctuation split
        if (/[.!?]$/.test(word) && currentChunk.length >= Math.floor(maxChars * 0.5)) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = word;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Format text into 1 or 2 lines without breaking atomic entities or words
   */
  wrapText(text) {
    if (!text || text.length <= this.maxCharsPerLine) {
      return text;
    }

    // 1. Protect atomic entities (Node.js, npm run dev, Claude 3.5, URLs)
    const { text: protectedText, map } = this.protectAtomicTokens(text);

    // 2. Tokenize words with placeholders intact
    const rawWords = protectedText.split(/\s+/);
    let line1 = '';
    let line2 = '';

    for (let i = 0; i < rawWords.length; i++) {
      const token = rawWords[i];
      const realTokenLength = map.has(token) ? map.get(token).length : token.length;

      // Test line 1 length using actual restored string length
      const testLine1 = line1 ? `${line1} ${token}` : token;
      const testLine1RealLength = this.restoreAtomicTokens(testLine1, map).length;

      if (testLine1RealLength <= this.maxCharsPerLine) {
        line1 = testLine1;
      } else {
        const testLine2 = line2 ? `${line2} ${token}` : token;
        line2 = testLine2;
      }
    }

    const finalLine1 = this.restoreAtomicTokens(line1, map);
    const finalLine2 = this.restoreAtomicTokens(line2, map);

    if (finalLine2) {
      return `${finalLine1}\n${finalLine2}`;
    }
    return finalLine1;
  }

  /**
   * Process an array of ASR segments into readable subtitle cues
   */
  segmentTranscript(segments = []) {
    if (!Array.isArray(segments)) return [];
    const result = [];

    for (const segment of segments) {
      const subCues = this.segmentSingleCue(segment);
      result.push(...subCues);
    }

    // Post-process to ensure no overlaps and minimum gaps
    for (let i = 0; i < result.length - 1; i++) {
      const current = result[i];
      const next = result[i + 1];

      if (current.end > next.start) {
        current.end = Math.max(current.start + 0.5, next.start - this.minGap);
      }
    }

    return result;
  }
}

