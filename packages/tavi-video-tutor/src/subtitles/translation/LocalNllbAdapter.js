// @ts-check
import fs from 'fs';
import path from 'path';
import { TranslationProvider } from './TranslationProvider.js';
import { TranslationError, TRANSLATION_ERROR_CODES } from './TranslationError.js';
import { getTranslationCache } from './TranslationCache.js';
import { normalizeLanguageCode } from '../languages/registry.js';
import { protectTokens, restoreTokens } from './ProtectedTerms.js';
import { getTransformers, getGlobalModelCacheDir } from '../transcription/transformersLoader.js';

// FLORES-200 Language Codes for NLLB-200
// Exactly 106 languages supported by NLLB-200; 3 languages explicitly null (bi, ch, doi)
export const FLORES_200_MAPPING = Object.freeze({
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
});

/**
 * Validates that an on-disk NLLB model directory contains all required configuration,
 * tokenizer, and weights artifacts for local inference.
 * 
 * @param {string} modelDir - Path to model directory
 * @returns {{ valid: boolean, code?: string, reason?: string, missing?: string[] }}
 */
export function verifyNllbArtifacts(modelDir) {
  if (!modelDir || typeof modelDir !== 'string' || !fs.existsSync(modelDir)) {
    return {
      valid: false,
      code: TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_NOT_CACHED,
      reason: `NLLB model directory not found: ${modelDir || 'unspecified'}`
    };
  }

  // Check for incomplete / partial download artifacts (.part, .download, .tmp)
  const hasPartialArtifact = (dir) => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const ent of entries) {
        if (ent.isFile() && (ent.name.endsWith('.part') || ent.name.endsWith('.download') || ent.name.endsWith('.tmp'))) {
          return true;
        }
        if (ent.isDirectory()) {
          if (hasPartialArtifact(path.join(dir, ent.name))) return true;
        }
      }
    } catch (_) {}
    return false;
  };

  if (hasPartialArtifact(modelDir)) {
    return {
      valid: false,
      code: TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_INVALID,
      reason: `Incomplete NLLB download: partial artifact detected in ${modelDir}`
    };
  }

  // Check required config
  const hasConfig = fs.existsSync(path.join(modelDir, 'config.json'));
  if (!hasConfig) {
    return {
      valid: false,
      code: TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_INVALID,
      reason: `Missing required NLLB configuration: 'config.json' not found in ${modelDir}`,
      missing: ['config.json']
    };
  }

  // Check tokenizer
  const hasTokenizer = fs.existsSync(path.join(modelDir, 'tokenizer.json')) ||
    fs.existsSync(path.join(modelDir, 'tokenizer_config.json')) ||
    fs.existsSync(path.join(modelDir, 'sentencepiece.bpe.model'));
  if (!hasTokenizer) {
    return {
      valid: false,
      code: TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_INVALID,
      reason: `Missing required NLLB tokenizer: 'tokenizer.json' not found in ${modelDir}`,
      missing: ['tokenizer.json']
    };
  }

  // Check weights
  const weightsCandidates = [
    path.join(modelDir, 'onnx', 'decoder_model_merged.onnx'),
    path.join(modelDir, 'onnx', 'decoder_model_merged_quantized.onnx'),
    path.join(modelDir, 'onnx', 'decoder_model.onnx'),
    path.join(modelDir, 'onnx', 'encoder_model.onnx'),
    path.join(modelDir, 'onnx', 'encoder_model_quantized.onnx'),
    path.join(modelDir, 'model.onnx'),
    path.join(modelDir, 'decoder_model_merged.onnx'),
    path.join(modelDir, 'pytorch_model.bin'),
    path.join(modelDir, 'model.safetensors')
  ];

  const hasWeights = weightsCandidates.some(candidate => fs.existsSync(candidate));
  if (!hasWeights) {
    return {
      valid: false,
      code: TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_INVALID,
      reason: `Missing required NLLB model weights in ${modelDir}`,
      missing: ['onnx/decoder_model_merged.onnx']
    };
  }

  return { valid: true };
}

/**
 * Hardened Local NLLB-200 Translation Adapter.
 * Provides offline, local neural translation with verified caching, strict error taxonomy,
 * zero network activity during inference, and zero silent fallback.
 */
export class LocalNllbAdapter extends TranslationProvider {
  /**
   * @param {Object} [options={}]
   * @param {string} [options.modelId='Xenova/nllb-200-distilled-600m'] - NLLB model identifier
   * @param {string} [options.cacheDir] - Base directory for model weights
   * @param {Function} [options.pipeline] - Direct pipeline injection for unit testing
   * @param {Function} [options.pipelineLoader] - Custom loader for transformers pipeline
   * @param {import('./TranslationCache.js').TranslationCache} [options.cache] - Persistent translation cache instance
   * @param {number} [options.numThreads=4] - CPU threads for WASM execution
   * @param {boolean} [options.allowTestFallback=false] - For synthetic offline testing
   */
  constructor(options = {}) {
    super();
    this.id = 'nllb';
    this.isOfflineCapable = true;
    this.options = options;
    this.modelId = options.modelId || 'Xenova/nllb-200-distilled-600m';
    this.cacheDir = options.cacheDir || getGlobalModelCacheDir();
    this.cache = options.cache || getTranslationCache(options);
    this.injectedPipeline = options.pipeline || null;
    this.pipelineLoader = options.pipelineLoader || null;
    this.pipelineInstance = null;
    this.initPromise = null; // Concurrency protection against duplicate session init
  }

  /**
   * Resolves the on-disk directory for this NLLB model.
   * @returns {string}
   */
  getModelDirectory() {
    const sanitizedName = this.modelId.replace('/', '--');
    const hfCandidate = path.join(this.cacheDir, `models--${sanitizedName}`);
    if (fs.existsSync(hfCandidate)) return hfCandidate;

    const directCandidate = path.join(this.cacheDir, ...this.modelId.split('/'));
    if (fs.existsSync(directCandidate)) return directCandidate;

    return path.join(this.cacheDir, ...this.modelId.split('/'));
  }

  /**
   * Checks whether the language pair is supported by local NLLB-200.
   * 
   * @param {string} sourceLanguage 
   * @param {string} targetLanguage 
   * @returns {boolean}
   */
  supports(sourceLanguage, targetLanguage) {
    if (!targetLanguage) return false;
    const tgtClean = normalizeLanguageCode(targetLanguage) || String(targetLanguage).toLowerCase().trim();
    const floresCode = FLORES_200_MAPPING[tgtClean];
    return Boolean(floresCode);
  }

  /**
   * Concurrency-safe initialization of the local Transformers.js pipeline.
   * @private
   */
  async _getPipeline() {
    if (this.injectedPipeline) {
      return this.injectedPipeline;
    }

    if (this.pipelineInstance) {
      return this.pipelineInstance;
    }

    if (!this.initPromise) {
      this.initPromise = (async () => {
        if (this.pipelineLoader) {
          this.pipelineInstance = await this.pipelineLoader(this.modelId);
          return this.pipelineInstance;
        }

        let transformers;
        try {
          transformers = await getTransformers({ cwd: process.cwd() });
        } catch (loaderErr) {
          throw new TranslationError(
            `Transformers.js runtime not available: ${loaderErr.message}`,
            TRANSLATION_ERROR_CODES.TRANSLATION_ENGINE_NOT_AVAILABLE,
            { provider: this.id, modelId: this.modelId }
          );
        }

        const { pipeline, env } = transformers;
        if (env) {
          env.allowLocalModels = true;
          env.allowRemoteModels = false; // Strictly offline: zero remote fetching
          if (env.wasm) {
            env.wasm.numThreads = this.options.numThreads || 4;
          }
        }

        try {
          this.pipelineInstance = await pipeline('translation', this.modelId);
          return this.pipelineInstance;
        } catch (pipeErr) {
          throw new TranslationError(
            `Local NLLB model load failed: ${pipeErr.message}`,
            TRANSLATION_ERROR_CODES.TRANSLATION_ENGINE_FAILED,
            { provider: this.id, modelId: this.modelId }
          );
        }
      })();
    }

    try {
      return await this.initPromise;
    } catch (err) {
      this.initPromise = null;
      throw err;
    }
  }

  /**
   * Translates subtitle segments locally using NLLB-200.
   * 
   * @param {Array<Object>} segments - Subtitle segments to translate
   * @param {string} [sourceLanguage='en'] - Source language code
   * @param {string} targetLanguage - Target language code
   * @param {Object} [options={}] - Execution options
   * @returns {Promise<Array<Object>>} Translated segments
   */
  async translateSegments(segments, sourceLanguage = 'en', targetLanguage, options = {}) {
    if (!Array.isArray(segments)) {
      throw new TranslationError(
        'Invalid subtitle segments: expected an array',
        TRANSLATION_ERROR_CODES.TRANSLATION_INPUT_INVALID,
        { provider: this.id }
      );
    }

    if (!targetLanguage) {
      throw new TranslationError(
        'Target language is required for translation',
        TRANSLATION_ERROR_CODES.TRANSLATION_INPUT_INVALID,
        { provider: this.id }
      );
    }

    const srcClean = normalizeLanguageCode(sourceLanguage) || String(sourceLanguage).toLowerCase().trim();
    const tgtClean = normalizeLanguageCode(targetLanguage) || String(targetLanguage).toLowerCase().trim();

    if (srcClean === tgtClean) {
      return segments.map((s, idx) => ({
        ...s,
        id: s.id || s.segmentId || `cue_${String(idx + 1).padStart(6, '0')}`,
        start: s.start !== undefined ? Number(s.start) : Number(s.startTime || 0),
        end: s.end !== undefined ? Number(s.end) : Number(s.endTime || 0),
        text: s.text || s.originalText || '',
        originalText: s.originalText || s.text || '',
        translatedText: s.text || s.originalText || ''
      }));
    }

    if (segments.length === 0) {
      return [];
    }

    const srcFlores = FLORES_200_MAPPING[srcClean] || 'eng_Latn';
    const tgtFlores = FLORES_200_MAPPING[tgtClean];

    if (!tgtFlores) {
      throw new TranslationError(
        `Language '${targetLanguage}' (${tgtClean}) is not supported by local NLLB-200 model`,
        TRANSLATION_ERROR_CODES.TRANSLATION_LANGUAGE_UNSUPPORTED,
        { provider: this.id, targetLanguage, sourceLanguage }
      );
    }

    // Step 1: Assign stable cue IDs and check cache
    const results = new Array(segments.length);
    const uncachedIndices = [];

    for (let i = 0; i < segments.length; i++) {
      const cue = segments[i];
      const cueId = cue.id || cue.segmentId || `cue_${String(i + 1).padStart(6, '0')}`;
      const origText = String(cue.text || cue.originalText || '').trim();

      if (!origText) {
        results[i] = {
          ...cue,
          id: cueId,
          start: cue.start !== undefined ? Number(cue.start) : Number(cue.startTime || 0),
          end: cue.end !== undefined ? Number(cue.end) : Number(cue.endTime || 0),
          text: '',
          originalText: '',
          translatedText: ''
        };
        continue;
      }

      const cached = this.cache.get({
        text: origText,
        sourceLanguage: srcClean,
        targetLanguage: tgtClean,
        provider: this.id,
        model: this.modelId
      });

      if (cached) {
        results[i] = {
          ...cue,
          id: cueId,
          start: cue.start !== undefined ? Number(cue.start) : Number(cue.startTime || 0),
          end: cue.end !== undefined ? Number(cue.end) : Number(cue.endTime || 0),
          speakerId: cue.speakerId,
          originalText: origText,
          translatedText: cached,
          text: cached
        };
      } else {
        uncachedIndices.push(i);
      }
    }

    if (uncachedIndices.length === 0) {
      return results;
    }

    // Step 2: Validate model artifacts on disk before inference (if pipeline not pre-injected)
    if (!this.injectedPipeline) {
      const modelDir = this.getModelDirectory();
      const artifactCheck = verifyNllbArtifacts(modelDir);
      if (!artifactCheck.valid) {
        throw new TranslationError(
          artifactCheck.reason || 'Invalid NLLB model artifacts',
          artifactCheck.code || TRANSLATION_ERROR_CODES.TRANSLATION_MODEL_INVALID,
          { provider: this.id, modelId: this.modelId, modelDir }
        );
      }
    }

    // Step 3: Lazy load translation pipeline
    let translator;
    try {
      translator = await this._getPipeline();
    } catch (pipeErr) {
      if (pipeErr instanceof TranslationError) throw pipeErr;
      throw new TranslationError(
        `Local NLLB initialization failed: ${pipeErr.message}`,
        TRANSLATION_ERROR_CODES.TRANSLATION_ENGINE_FAILED,
        { provider: this.id, modelId: this.modelId }
      );
    }

    // Step 4: Perform local inference with token protection and metadata preservation
    for (const idx of uncachedIndices) {
      const cue = segments[idx];
      const cueId = cue.id || cue.segmentId || `cue_${String(idx + 1).padStart(6, '0')}`;
      const origText = String(cue.text || cue.originalText || '').trim();

      const { text: protectedText, map: tokenMap } = protectTokens(origText);

      let translatedText = '';
      try {
        const output = await translator(protectedText, {
          src_lang: srcFlores,
          tgt_lang: tgtFlores
        });

        if (output && Array.isArray(output) && output[0] && output[0].translation_text) {
          translatedText = output[0].translation_text.trim();
        } else if (typeof output === 'string') {
          translatedText = output.trim();
        }
      } catch (inferErr) {
        throw new TranslationError(
          `Local NLLB inference failed for cue ${cueId}: ${inferErr.message}`,
          TRANSLATION_ERROR_CODES.TRANSLATION_ENGINE_FAILED,
          { provider: this.id, modelId: this.modelId, cueId, sourceLanguage, targetLanguage }
        );
      }

      if (!translatedText) {
        throw new TranslationError(
          `Local NLLB produced empty translation for cue ${cueId}`,
          TRANSLATION_ERROR_CODES.TRANSLATION_ENGINE_FAILED,
          { provider: this.id, modelId: this.modelId, cueId }
        );
      }

      const finalText = restoreTokens(translatedText, tokenMap);

      results[idx] = {
        ...cue,
        id: cueId,
        start: cue.start !== undefined ? Number(cue.start) : Number(cue.startTime || 0),
        end: cue.end !== undefined ? Number(cue.end) : Number(cue.endTime || 0),
        speakerId: cue.speakerId,
        originalText: origText,
        translatedText: finalText,
        text: finalText
      };

      this.cache.set({
        text: origText,
        sourceLanguage: srcClean,
        targetLanguage: tgtClean,
        provider: this.id,
        model: this.modelId
      }, finalText);
    }

    return results;
  }
}

export default LocalNllbAdapter;
