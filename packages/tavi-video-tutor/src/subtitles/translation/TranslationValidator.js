import { ProtectedTerms } from './ProtectedTerms.js';

export const SCRIPT_RANGE_MAP = {
  te: /[\u0C00-\u0C7F]/, // Telugu
  hi: /[\u0900-\u097F]/, // Devanagari (Hindi, Marathi, etc.)
  ta: /[\u0B80-\u0BFF]/, // Tamil
  kn: /[\u0C80-\u0CFF]/, // Kannada
  ml: /[\u0D00-\u0D7F]/, // Malayalam
  bn: /[\u0980-\u09FF]/, // Bengali
  ar: /[\u0600-\u06FF]/, // Arabic
  he: /[\u0590-\u05FF]/, // Hebrew
  ja: /[\u3040-\u30FF\u4E00-\u9FFF]/, // Japanese (Hiragana/Katakana/Kanji)
  ko: /[\u3130-\u318F\uAC00-\uD7AF]/, // Korean (Hangul)
  zh: /[\u4E00-\u9FFF]/, // Chinese (CJK)
  th: /[\u0E00-\u0E7F]/, // Thai
  ru: /[\u0400-\u04FF]/  // Cyrillic
};

export class TranslationValidator {
  constructor(options = {}) {
    this.protectedTerms = options.protectedTerms instanceof ProtectedTerms
      ? options.protectedTerms
      : new ProtectedTerms(options.customProtectedTerms || []);
  }

  validateTranslation(sourceText, translatedText, targetLangCode) {
    const srcStr = String(sourceText || '').trim();
    const tgtStr = String(translatedText || '').trim();

    // 1. Non-empty check
    if (!tgtStr) {
      return { status: 'FAIL', reason: 'Empty translation output' };
    }

    // 2. HTML or API Error response check
    if (/<html|<!DOCTYPE/i.test(tgtStr) || /^\{.*"error".*\}$/i.test(tgtStr)) {
      return { status: 'FAIL', reason: 'Provider returned HTML or API error payload' };
    }

    // 3. Same language pair return check
    if (srcStr.toLowerCase() === tgtStr.toLowerCase()) {
      // Check if source was purely numbers, symbols, or protected terms
      const words = srcStr.split(/\s+/);
      const allProtected = words.every(w => this.protectedTerms.isProtectedTerm(w) || /^[\d\s\W]+$/.test(w));
      if (allProtected) {
        return { status: 'PASS', reason: 'Source contains only protected terms or numbers' };
      }
      return { status: 'SUSPICIOUS', reason: 'Source and translation are identical without full protected term coverage' };
    }

    // 4. Script Signal check
    const scriptRegex = SCRIPT_RANGE_MAP[targetLangCode];
    if (scriptRegex) {
      const hasScriptMatch = scriptRegex.test(tgtStr);
      if (!hasScriptMatch) {
        // If target requires distinct script but has none, check if remaining non-ascii words exist
        const nonProtectedWords = tgtStr.split(/\s+/).filter(w => !this.protectedTerms.isProtectedTerm(w) && !/^[\d\s\W]+$/.test(w));
        if (nonProtectedWords.length > 0) {
          return { status: 'SUSPICIOUS', reason: `Expected script signal for '${targetLangCode}' missing in output` };
        }
      }
    }

    // 5. Protected Terms Preservation check
    const srcProtected = this.protectedTerms.extractProtectedTerms(srcStr);
    const hasTargetScript = scriptRegex ? scriptRegex.test(tgtStr) : false;

    for (const term of srcProtected) {
      const cleanTerm = term.replace(/^[^\w]+|[^\w]+$/g, '');
      if (cleanTerm && !new RegExp(`\\b${cleanTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(tgtStr)) {
        if (hasTargetScript) {
          continue;
        }
        return { status: 'SUSPICIOUS', reason: `Protected term '${cleanTerm}' missing from translated output` };
      }
    }

    return { status: 'PASS', reason: 'Translation validated successfully' };
  }

  validateSegments(sourceSegments = [], translatedSegments = [], targetLangCode) {
    if (!Array.isArray(sourceSegments) || !Array.isArray(translatedSegments)) {
      return { status: 'FAIL', details: [] };
    }

    if (sourceSegments.length !== translatedSegments.length) {
      return {
        status: 'FAIL',
        passCount: 0,
        suspiciousCount: 0,
        failCount: Math.abs(sourceSegments.length - translatedSegments.length),
        details: [{ status: 'FAIL', reason: 'Source and translated cue counts differ' }]
      };
    }

    let passCount = 0;
    let suspiciousCount = 0;
    let failCount = 0;
    const details = [];

    const minLen = Math.min(sourceSegments.length, translatedSegments.length);
    for (let i = 0; i < minLen; i++) {
      const srcCue = sourceSegments[i];
      const tgtCue = translatedSegments[i];
      const res = this.validateTranslation(srcCue.text, tgtCue.text, targetLangCode);

      if (res.status === 'PASS') passCount++;
      else if (res.status === 'SUSPICIOUS') suspiciousCount++;
      else failCount++;

      details.push(res);
    }

    let overallStatus = 'PASS';
    if (failCount > 0) overallStatus = 'FAIL';
    else if (suspiciousCount > passCount) overallStatus = 'SUSPICIOUS';

    return {
      status: overallStatus,
      passCount,
      suspiciousCount,
      failCount,
      details
    };
  }

  /**
   * Parses timestamp string (00:00:00.000 or 00:00.000) into milliseconds.
   */
  parseVttTimestampToMs(ts) {
    if (!ts || typeof ts !== 'string') return null;
    const parts = ts.trim().split(':');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;
    let ms = 0;
    if (parts.length === 3) {
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
      const secParts = parts[2].split('.');
      seconds = parseInt(secParts[0], 10);
      ms = parseInt(secParts[1] || '0', 10);
    } else if (parts.length === 2) {
      minutes = parseInt(parts[0], 10);
      const secParts = parts[1].split('.');
      seconds = parseInt(secParts[0], 10);
      ms = parseInt(secParts[1] || '0', 10);
    } else {
      return null;
    }
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(ms)) return null;
    return (hours * 3600 + minutes * 60 + seconds) * 1000 + ms;
  }

  /**
   * Validates raw WebVTT content for header integrity, valid timestamp arrows,
   * non-empty cues, strictly monotonic timestamp ordering, and expected script presence for target language.
   */
  validateVttContent(vttContent, targetLangCode = null, sourceLangCode = 'en', sourceVttContent = null) {
    if (!vttContent || typeof vttContent !== 'string') {
      return { valid: false, reason: 'Empty VTT content' };
    }
    const lines = vttContent.split(/\r?\n/);
    if (!lines[0].startsWith('WEBVTT')) {
      return { valid: false, reason: 'Missing WEBVTT header' };
    }

    const cueTexts = [];
    const arrowLineRegex = /((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}\.\d{3})/;
    let prevStartMs = -1;
    let cueCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const match = line.match(arrowLineRegex);
      if (match) {
        cueCount++;
        const startMs = this.parseVttTimestampToMs(match[1]);
        const endMs = this.parseVttTimestampToMs(match[2]);

        if (startMs === null || endMs === null) {
          return { valid: false, reason: `Malformed timestamp in cue: ${line}` };
        }
        if (startMs >= endMs) {
          return { valid: false, reason: `Cue start timestamp (${match[1]}) must be strictly before end timestamp (${match[2]})` };
        }
        if (startMs < prevStartMs) {
          return { valid: false, reason: `Out-of-order cue timestamps detected: start ${match[1]} preceded previous start` };
        }
        prevStartMs = startMs;

        let text = '';
        let j = i + 1;
        while (j < lines.length && lines[j].trim() && !arrowLineRegex.test(lines[j].trim())) {
          text += (text ? ' ' : '') + lines[j].trim();
          j++;
        }
        if (!text.trim()) {
          return { valid: false, reason: `Empty cue text found after timestamp '${line}'` };
        }
        cueTexts.push(text.trim());
      }
    }

    if (cueCount === 0) {
      return { valid: false, reason: 'No valid timestamped cues found in VTT' };
    }

    if (targetLangCode && sourceLangCode && targetLangCode !== sourceLangCode) {
      const scriptRegex = SCRIPT_RANGE_MAP[targetLangCode];
      if (scriptRegex) {
        const fullText = cueTexts.join(' ');
        if (!scriptRegex.test(fullText)) {
          return { valid: false, reason: `Target script missing for '${targetLangCode}' in VTT` };
        }

        const words = fullText.split(/\s+/).filter(Boolean);
        const latinWords = words.filter(w => /^[a-zA-Z]{3,}$/.test(w) && !this.protectedTerms.isProtectedTerm(w));
        if (words.length > 2 && latinWords.length > words.length * 0.7) {
          return { valid: false, reason: `Excessive untranslated Latin/English text detected in '${targetLangCode}' VTT` };
        }
      }

      if (sourceVttContent && typeof sourceVttContent === 'string') {
        const cleanTgt = vttContent.replace(/^WEBVTT[^\n]*\r?\n+/i, '').trim();
        const cleanSrc = sourceVttContent.replace(/^WEBVTT[^\n]*\r?\n+/i, '').trim();
        if (cleanTgt === cleanSrc) {
          return { valid: false, reason: 'VTT content is identical to source language VTT (untranslated)' };
        }
      }
    }

    return { valid: true };
  }
}
