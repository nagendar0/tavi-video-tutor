import { AITutorTranslationProvider } from './TranslationProvider.js';
import { LocalNllbProvider } from './LocalNllbProvider.js';
import { normalizeLanguageCode } from '../languages/registry.js';

export class TranslationRouter {
  constructor(options = {}) {
    this.options = options;
    this.mode = options.mode || options.provider || 'auto'; // 'auto' | 'online' | 'offline'
    this.onlineProvider = options.onlineProvider || new AITutorTranslationProvider(options);
    this.localProvider = options.localProvider || new LocalNllbProvider(options);
  }

  supports(sourceLang, targetLang) {
    const srcClean = normalizeLanguageCode(sourceLang) || String(sourceLang || 'en').toLowerCase().trim();
    const tgtClean = normalizeLanguageCode(targetLang) || String(targetLang || 'en').toLowerCase().trim();
    if (srcClean === tgtClean) return true;
    if (this.mode === 'offline') {
      return this.localProvider.supports(srcClean, tgtClean);
    }
    return this.onlineProvider.supports(srcClean, tgtClean) || this.localProvider.supports(srcClean, tgtClean);
  }

  async translateSegments(segments, sourceLang, targetLang) {
    const srcClean = normalizeLanguageCode(sourceLang) || String(sourceLang || 'en').toLowerCase().trim();
    const tgtClean = normalizeLanguageCode(targetLang) || String(targetLang || 'en').toLowerCase().trim();

    if (srcClean === tgtClean) {
      return segments.map((s, idx) => ({
        ...s,
        id: s.id || s.segmentId || `cue_${String(idx + 1).padStart(6, '0')}`,
        start: Number(s.start !== undefined ? s.start : s.startTime),
        end: Number(s.end !== undefined ? s.end : s.endTime),
        text: s.text || s.originalText,
        originalText: s.originalText || s.text,
        translatedText: s.text || s.originalText
      }));
    }

    let translated = null;

    // Explicit Offline Mode
    if (this.mode === 'offline') {
      if (!this.localProvider.supports(srcClean, tgtClean)) {
        throw new Error(`UNSUPPORTED_OFFLINE: Offline translation unavailable for language '${targetLang}' (Unsupported by local NLLB-200 model).`);
      }
      console.log(`[TranslationRouter] Offline Mode Active → Routing ${targetLang} to Local NLLB Provider`);
      translated = await this.localProvider.translateSegments(segments, srcClean, tgtClean);
    } else {
      // Auto Mode: Online Preferred → Local Fallback
      try {
        if (this.mode !== 'offline') {
          const onlineResult = await this.onlineProvider.translateSegments(segments, srcClean, tgtClean);
          if (onlineResult && Array.isArray(onlineResult) && onlineResult.length > 0) {
            translated = onlineResult;
          }
        }
      } catch (onlineErr) {
        if (this.mode === 'online') {
          throw onlineErr;
        }

        console.warn(`\n⚠ Online translation provider unavailable for ${targetLang}: ${onlineErr.message}`);

        if (this.localProvider.supports(srcClean, tgtClean)) {
          console.log(`→ Switching to Local NLLB Fallback for ${targetLang}...`);
          translated = await this.localProvider.translateSegments(segments, srcClean, tgtClean);
        } else {
          throw new Error(`TRANSLATION NOT AVAILABLE FOR <${targetLang}> [UNSUPPORTED_OFFLINE]: Online translation failed (${onlineErr.message}) and language '${targetLang}' is unsupported by local NLLB-200 fallback model.`);
        }
      }

      // Fallback if online provider returned empty
      if (!translated && this.localProvider.supports(srcClean, tgtClean)) {
        translated = await this.localProvider.translateSegments(segments, srcClean, tgtClean);
      }
    }

    if (!translated) {
      throw new Error(`TRANSLATION NOT AVAILABLE FOR <${targetLang}>: No translation provider available for pair ${sourceLang} -> ${targetLang}`);
    }


    // Preserve speaker identity and timeline invariants from source segments
    return translated.map((t, idx) => {
      const orig = segments[idx] || {};
      const targetText = String(t.translatedText || t.text || '').trim();
      const sourceText = String(orig.originalText || orig.text || '').trim();

      return {
        ...orig,
        ...t,
        speakerId: orig.speakerId || t.speakerId,
        segmentId: orig.segmentId || t.segmentId || t.id,
        originalText: sourceText,
        translatedText: targetText,
        text: targetText || (srcClean === tgtClean ? sourceText : '')
      };
    });
  }
}

export default TranslationRouter;
