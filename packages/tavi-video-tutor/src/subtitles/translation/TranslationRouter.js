import { AITutorTranslationProvider, MyMemoryTranslationProvider } from './TranslationProvider.js';
import { LocalNllbProvider } from './LocalNllbProvider.js';

export class TranslationRouter {
  constructor(options = {}) {
    this.options = options;
    this.mode = options.mode || 'auto'; // 'auto' | 'online' | 'offline'
    this.onlineProvider = new AITutorTranslationProvider(options);
    this.localProvider = new LocalNllbProvider(options);
  }

  supports(sourceLang, targetLang) {
    if (this.mode === 'offline') {
      return this.localProvider.supports(sourceLang, targetLang);
    }
    return this.onlineProvider.supports(sourceLang, targetLang) || this.localProvider.supports(sourceLang, targetLang);
  }

  async translateSegments(segments, sourceLang, targetLang) {
    const srcClean = String(sourceLang).toLowerCase();
    const tgtClean = String(targetLang).toLowerCase();

    if (srcClean === tgtClean) {
      return segments.map((s, idx) => ({
        id: s.id || `cue_${String(idx + 1).padStart(6, '0')}`,
        start: Number(s.start),
        end: Number(s.end),
        text: s.text
      }));
    }

    // Explicit Offline Mode
    if (this.mode === 'offline') {
      if (!this.localProvider.supports(srcClean, tgtClean)) {
        throw new Error(`UNSUPPORTED_OFFLINE: Offline translation unavailable for language '${targetLang}' (Unsupported by local NLLB-200 model).`);
      }
      console.log(`[TranslationRouter] Offline Mode Active → Routing ${targetLang} to Local NLLB Provider`);
      return await this.localProvider.translateSegments(segments, srcClean, tgtClean);
    }

    // Auto Mode: Online Preferred → Local Fallback
    try {
      if (this.mode !== 'offline') {
        return await this.onlineProvider.translateSegments(segments, srcClean, tgtClean);
      }
    } catch (onlineErr) {
      if (this.mode === 'online') {
        throw onlineErr;
      }

      console.warn(`\n⚠ Online translation provider unavailable for ${targetLang}: ${onlineErr.message}`);

      if (this.localProvider.supports(srcClean, tgtClean)) {
        console.log(`→ Switching to Local NLLB Fallback for ${targetLang}...`);
        return await this.localProvider.translateSegments(segments, srcClean, tgtClean);
      } else {
        throw new Error(`UNSUPPORTED_OFFLINE: Online translation failed and language '${targetLanguage}' is unsupported by local NLLB-200 fallback model.`);
      }
    }

    // Fallback if online provider returned empty
    if (this.localProvider.supports(srcClean, tgtClean)) {
      return await this.localProvider.translateSegments(segments, srcClean, tgtClean);
    }

    throw new Error(`No translation provider available for pair ${sourceLang} -> ${targetLang}`);
  }
}

