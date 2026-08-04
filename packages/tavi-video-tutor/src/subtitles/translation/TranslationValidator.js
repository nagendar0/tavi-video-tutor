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
}
