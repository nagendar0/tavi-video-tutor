import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { TranslationProvider } from './TranslationProvider.js';
import { AITUTOR_LANGUAGES, getLanguageByCode } from '../languages/registry.js';
import { protectTokens, restoreTokens } from './ProtectedTerms.js';
import { getTransformers } from '../transcription/transformersLoader.js';

// Global in-memory cache for NLLB translation pipeline
let NLLB_PIPELINE_INSTANCE = null;
let isInitializingPipeline = false;

// Persistent text cache map
const LOCAL_CACHE_MAP = new Map();
let isCacheLoaded = false;
let cacheFilePath = null;

const getCachePath = () => {
  if (!cacheFilePath) {
    const cwd = process.cwd();
    const cacheDir = path.join(cwd, '.aitutor', 'cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    cacheFilePath = path.join(cacheDir, 'translation-text-cache.json');
  }
  return cacheFilePath;
};

const loadCache = () => {
  if (isCacheLoaded) return;
  isCacheLoaded = true;
  try {
    const file = getCachePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      Object.entries(data).forEach(([key, val]) => LOCAL_CACHE_MAP.set(key, val));
    }
  } catch (_) {}
};

const saveCache = () => {
  try {
    const file = getCachePath();
    const obj = {};
    LOCAL_CACHE_MAP.forEach((val, key) => { obj[key] = val; });
    const tmpFile = `${file}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(obj, null, 2), 'utf8');
    fs.renameSync(tmpFile, file);
  } catch (_) {}
};

const makeCacheKey = (text, srcLang, tgtLang, providerId = 'nllb', modelId = 'nllb-200-distilled-600m') => {
  const payload = `${text.trim()}|${srcLang.toLowerCase()}|${tgtLang.toLowerCase()}|${providerId.toLowerCase()}|${modelId.toLowerCase()}`;
  return crypto.createHash('md5').update(payload).digest('hex');
};

// FLORES-200 Language Codes for NLLB-200
export const FLORES_200_MAPPING = {
  af: 'afr_Latn', sq: 'als_Latn', am: 'amh_Ethi', ar: 'arb_Arab', hy: 'hye_Armn',
  as: 'asm_Beng', az: 'azj_Latn', eu: 'eus_Latn', be: 'bel_Cyrl', bn: 'ben_Beng',
  bho: 'bho_Deva', bi: null, bg: 'bul_Cyrl', my: 'mym_Mymr', yue: 'yue_Hant',
  ca: 'cat_Latn', ceb: 'ceb_Latn', ch: null, zh: 'zho_Hans', hr: 'hrv_Latn',
  cs: 'ces_Latn', da: 'dan_Latn', doi: null, nl: 'nld_Latn', en: 'eng_Latn',
  et: 'est_Latn', fj: 'fij_Latn', tl: 'tgl_Latn', fi: 'fin_Latn', fr: 'fra_Latn',
  gl: 'glg_Latn', ka: 'kat_Geor', de: 'deu_Latn', el: 'ell_Grek', kl: 'kal_Latn',
  gu: 'guj_Gujr', ha: 'hau_Latn', haw: 'haw_Latn', he: 'heb_Hebr', hi: 'hin_Deva',
  hu: 'hun_Latn', is: 'isl_Latn', ig: 'ibo_Latn', id: 'ind_Latn', ga: 'gle_Latn',
  it: 'ita_Latn', ja: 'jpn_Jpan', jv: 'jav_Latn', kn: 'kan_Knda', ks: 'kas_Arab',
  kk: 'kaz_Cyrl', km: 'khm_Khmr', rw: 'kin_Latn', kok: 'gom_Deva', ko: 'kor_Hang',
  ku: 'kmr_Latn', ky: 'kir_Cyrl', lo: 'lao_Laoo', lv: 'lvs_Latn', lt: 'lit_Latn',
  lb: 'ltz_Latn', mk: 'mkd_Cyrl', mai: 'mai_Deva', mg: 'plt_Latn', ms: 'zsm_Latn',
  ml: 'mal_Mlym', mt: 'mlt_Latn', mni: 'mni_Beng', mi: 'mri_Latn', mr: 'mar_Deva',
  mn: 'khk_Cyrl', ne: 'npi_Deva', no: 'nob_Latn', or: 'ory_Orya', om: 'gaz_Latn',
  ps: 'pbt_Arab', fa: 'pes_Arab', pl: 'pol_Latn', pt: 'por_Latn', pa: 'pan_Guru',
  ro: 'ron_Latn', ru: 'rus_Cyrl', sm: 'smo_Latn', sa: 'san_Deva', sat: 'sat_Olck',
  sr: 'srp_Cyrl', sd: 'snd_Arab', si: 'sin_Sinh', sk: 'slk_Latn', sl: 'slv_Latn',
  so: 'som_Latn', es: 'spa_Latn', su: 'sun_Latn', sw: 'swh_Latn', sv: 'swe_Latn',
  tg: 'tgk_Cyrl', ta: 'tam_Taml', te: 'tel_Telu', th: 'tha_Thai', to: 'ton_Latn',
  tr: 'tur_Latn', tk: 'tuk_Latn', uk: 'ukr_Cyrl', ur: 'urd_Arab', uz: 'uzn_Latn',
  vi: 'vie_Latn', cy: 'cym_Latn', xh: 'xho_Latn', zu: 'zul_Latn'
};

export class LocalNllbProvider extends TranslationProvider {
  constructor(options = {}) {
    super();
    this.options = options;
    this.providerId = 'nllb';
    this.modelId = options.modelId || 'Xenova/nllb-200-distilled-600m';
    loadCache();
  }

  supports(sourceLanguage, targetLanguage) {
    if (!targetLanguage) return false;
    const tgtClean = String(targetLanguage).toLowerCase();
    const floresCode = FLORES_200_MAPPING[tgtClean];
    return Boolean(floresCode);
  }

  async getPipeline() {
    if (this.options.allowTestFallback) {
      throw new Error('Test fallback active for LocalNllbProvider unit testing.');
    }

    if (NLLB_PIPELINE_INSTANCE) {
      return NLLB_PIPELINE_INSTANCE;
    }

    const { pipeline, env } = await getTransformers();
    if (env) {
      env.allowLocalModels = true;
      if (env.wasm) {
        env.wasm.numThreads = this.options.numThreads || 4;
      }
    }

    console.log(`\nLocal NLLB Translation Engine\n──────────────\nModel: ${this.modelId}\nStatus: Loading model into memory...\n`);

    NLLB_PIPELINE_INSTANCE = await pipeline('translation', this.modelId);
    console.log(`✓ Local NLLB model loaded successfully!\n`);
    return NLLB_PIPELINE_INSTANCE;
  }

  async translateSegments(segments, sourceLanguage = 'en', targetLanguage) {
    const srcClean = String(sourceLanguage).toLowerCase();
    const tgtClean = String(targetLanguage).toLowerCase();

    if (srcClean === tgtClean) {
      return segments.map(s => ({ ...s }));
    }

    if (!Array.isArray(segments) || segments.length === 0) {
      return [];
    }

    const srcFlores = FLORES_200_MAPPING[srcClean] || 'eng_Latn';
    const tgtFlores = FLORES_200_MAPPING[tgtClean];

    if (!tgtFlores) {
      throw new Error(`UNSUPPORTED_OFFLINE: Language '${targetLanguage}' is not natively supported by local NLLB-200 model.`);
    }

    const results = new Array(segments.length);
    const uncachedIndices = [];

    // Step 1: Assign cue IDs and check provider-specific cache
    for (let i = 0; i < segments.length; i++) {
      const cue = segments[i];
      const cueId = cue.id || `cue_${String(i + 1).padStart(6, '0')}`;
      const origText = String(cue.text || '').trim();

      if (!origText) {
        results[i] = { id: cueId, start: Number(cue.start), end: Number(cue.end), text: '' };
        continue;
      }

      const cacheKey = makeCacheKey(origText, srcClean, tgtClean, this.providerId, this.modelId);
      if (LOCAL_CACHE_MAP.has(cacheKey)) {
        results[i] = {
          id: cueId,
          start: Number(cue.start),
          end: Number(cue.end),
          text: LOCAL_CACHE_MAP.get(cacheKey)
        };
      } else {
        uncachedIndices.push(i);
      }
    }

    if (uncachedIndices.length === 0) {
      return results;
    }

    // Step 2: Lazy load model on-demand only when uncached items exist
    let translator = null;
    try {
      translator = await this.getPipeline();
    } catch (err) {
      if (this.options.allowTestFallback) {
        // Safe test fallback for offline environments where weights aren't pre-downloaded
        for (const idx of uncachedIndices) {
          const cue = segments[idx];
          const cueId = cue.id || `cue_${String(idx + 1).padStart(6, '0')}`;
          results[idx] = {
            id: cueId,
            start: Number(cue.start),
            end: Number(cue.end),
            text: `[NLLB-${tgtClean}] ${cue.text}`
          };
        }
        return results;
      }
      throw err;
    }

    // Step 3: Inference across uncached cues with token protection & 1-to-1 cue preservation
    let cacheUpdated = false;

    for (const idx of uncachedIndices) {
      const cue = segments[idx];
      const cueId = cue.id || `cue_${String(idx + 1).padStart(6, '0')}`;
      const origText = String(cue.text || '').trim();

      const { text: protectedText, map: tokenMap } = protectTokens(origText);

      let translatedText = origText;
      try {
        const output = await translator(protectedText, {
          src_lang: srcFlores,
          tgt_lang: tgtFlores
        });

        if (output && output[0] && output[0].translation_text) {
          translatedText = output[0].translation_text;
        }
      } catch (_) {
        translatedText = origText;
      }

      const finalText = restoreTokens(translatedText, tokenMap);

      results[idx] = {
        id: cueId,
        start: Number(cue.start),
        end: Number(cue.end),
        text: finalText
      };

      const cacheKey = makeCacheKey(origText, srcClean, tgtClean, this.providerId, this.modelId);
      LOCAL_CACHE_MAP.set(cacheKey, finalText);
      cacheUpdated = true;
    }

    if (cacheUpdated) {
      saveCache();
    }

    return results;
  }
}
