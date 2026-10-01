import { TTSProvider } from './TTSProvider.js';
import { TTSError, escapeXml } from './EdgeTTSProvider.js';
import { normalizeLanguageCode } from '../languages/registry.js';
import { resolveNeuralVoice, isNeuralLanguageSupported } from './neuralVoiceRegistry.js';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { validateGeneratedAudio } from '../audio/validateAudio.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';

/**
 * Azure Neural Text-to-Speech Provider.
 * 
 * Complies strictly with Phase 8 Isolation Architecture:
 * - Inherits directly from TTSProvider (zero inheritance from EdgeTTSProvider).
 * - Direct Azure Cognitive Services Speech REST API.
 * - Zero silent fallback to Edge, Google, or system speech.
 * - Deterministic error classification:
 *   * Missing credentials -> PROVIDER_AUTH_ERROR
 *   * HTTP 401/403 -> PROVIDER_AUTH_ERROR
 *   * HTTP 429 -> PROVIDER_QUOTA_EXCEEDED
 *   * HTTP 5xx -> PROVIDER_SERVICE_UNAVAILABLE
 *   * Network failure -> PROVIDER_UNAVAILABLE
 *   * Offline mode -> OFFLINE_PROVIDER_FORBIDDEN
 */
export class AzureNeuralTTSProvider extends TTSProvider {
  constructor(options = {}) {
    super(options);
    this.providerId = 'azure-byok';
    this.engine = 'azure';
    this.azureKey = options.azureKey || process.env.AZURE_SPEECH_KEY || null;
    this.azureRegion = options.azureRegion || process.env.AZURE_SPEECH_REGION || 'eastus';
    this.timeoutMs = options.timeoutMs || options.timeout || 15000;
    this.networkPolicy = options.networkPolicy || null;
  }

  /**
   * Check whether this provider supports the given language code.
   * 
   * @param {string} language 
   * @returns {boolean}
   */
  supportsLanguage(language) {
    const norm = normalizeLanguageCode(language);
    return isNeuralLanguageSupported(norm);
  }

  /**
   * Synthesize text into WAV audio via direct Azure Cognitive Services Speech REST API.
   * Strictly isolated: zero silent fallback to Edge or any other provider.
   * 
   * @param {string} text 
   * @param {string} language 
   * @param {Object} [options] 
   * @returns {Promise<{ audioPath: string, duration: number, format: string, voiceId: string }>}
   */
  async synthesize(text, language, options = {}) {
    if (options.offline === true) {
      throw new TTSError('OFFLINE_PROVIDER_FORBIDDEN', 'Azure Neural TTS requires network access and cannot be used in offline mode.');
    }

    if (!this.azureKey) {
      throw new TTSError('PROVIDER_AUTH_ERROR', 'Azure Speech credentials missing. AZURE_SPEECH_KEY or options.azureKey is required.');
    }

    return this.synthesizeWithAzureRest(text, language, options);
  }

  /**
   * Direct Azure Speech Service REST Synthesis.
   */
  async synthesizeWithAzureRest(text, language, options = {}) {
    const normLang = normalizeLanguageCode(language);
    if (!normLang || !this.supportsLanguage(normLang)) {
      throw new TTSError('TTS_LANGUAGE_UNAVAILABLE', `Language '${language}' is not supported by Azure Neural TTS.`);
    }

    const voice = resolveNeuralVoice(normLang, options);
    if (!voice) {
      throw new TTSError('TTS_VOICE_UNAVAILABLE', `No neural voice available for language '${normLang}'.`);
    }

    const outputDir = options.outputDir || process.cwd();
    fs.mkdirSync(outputDir, { recursive: true });
    const fileId = `azure_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const outputPath = path.join(outputDir, `${fileId}.wav`);
    const tempMp3Path = path.join(outputDir, `${fileId}.mp3`);

    const pitchOffset = typeof options.pitchOffset === 'number' ? options.pitchOffset : 0;
    const rateOffset = typeof options.rateOffset === 'number' ? options.rateOffset : 1.0;
    const pitchStr = pitchOffset !== 0 ? `${pitchOffset > 0 ? '+' : ''}${Math.round(pitchOffset)}Hz` : '+0Hz';
    const ratePercent = Math.round((rateOffset - 1.0) * 100);
    const rateStr = ratePercent !== 0 ? `${ratePercent > 0 ? '+' : ''}${ratePercent}%` : '+0%';

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.locale}"><voice name="${voice.voiceId}"><prosody pitch="${pitchStr}" rate="${rateStr}">${escapeXml(text)}</prosody></voice></speak>`;

    const endpoint = `https://${this.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const policy = options.networkPolicy || this.networkPolicy;
    if (policy) {
      policy.assertAllowed(endpoint, { provider: this.providerId, stage: 'tts_synthesis' });
    }

    try {
      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': this.azureKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
            'User-Agent': 'TaviVideoTutor-AzureTTS'
          },
          body: ssml,
          signal: AbortSignal.timeout(this.timeoutMs)
        });
      } catch (netErr) {
        if (netErr.code === 'OFFLINE_VIOLATION_BLOCKED' || netErr.code === 'SSRF_BLOCKED' || netErr.code === 'BLOCKED_PROTOCOL') {
          throw netErr;
        }
        if (netErr.name === 'TimeoutError' || netErr.name === 'AbortError' || netErr.message?.includes('timed out')) {
          throw new TTSError('NETWORK_TIMEOUT', `Azure Speech API request timed out after ${this.timeoutMs}ms`, { cause: netErr });
        }
        throw new TTSError('PROVIDER_UNAVAILABLE', `Azure Speech API network request failed: ${netErr.message}`, { cause: netErr });
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new TTSError('PROVIDER_AUTH_ERROR', `Azure Speech API Authentication failed (HTTP ${response.status}). Verify AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.`);
        }
        if (response.status === 429) {
          throw new TTSError('PROVIDER_QUOTA_EXCEEDED', 'Azure Speech API rate limit / quota exceeded (HTTP 429).');
        }
        if (response.status >= 500 && response.status <= 599) {
          const bodyText = await response.text().catch(() => '');
          throw new TTSError('PROVIDER_SERVICE_UNAVAILABLE', `Azure Speech API service unavailable (HTTP ${response.status}): ${bodyText}`);
        }
        const bodyText = await response.text().catch(() => '');
        throw new TTSError('TTS_SYNTHESIS_FAILED', `Azure Speech API error HTTP ${response.status}: ${bodyText}`);
      }

      const maxResponseSizeBytes = options.maxResponseSizeBytes || 50 * 1024 * 1024;
      const contentLengthHeader = response.headers.get('content-length');
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > maxResponseSizeBytes) {
        throw new TTSError('RESPONSE_TOO_LARGE', `Azure Speech response size ${contentLengthHeader} bytes exceeds maximum limit.`);
      }

      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      if (buffer.length > maxResponseSizeBytes) {
        throw new TTSError('RESPONSE_TOO_LARGE', `Azure Speech response size ${buffer.length} bytes exceeds maximum limit.`);
      }
      if (buffer.length < 500) {
        throw new TTSError('TTS_OUTPUT_INVALID', 'Azure Speech API returned empty or truncated audio stream.');
      }

      fs.writeFileSync(tempMp3Path, buffer);

      const ffmpeg = getFFmpegBinaryPath();
      const transcode = spawnSync(ffmpeg, [
        '-y',
        '-i', tempMp3Path,
        '-ar', '44100',
        '-ac', '2',
        '-c:a', 'pcm_s16le',
        outputPath
      ], { encoding: 'utf8', windowsHide: true });

      if (transcode.status !== 0 || !fs.existsSync(outputPath)) {
        throw new TTSError('TTS_SYNTHESIS_FAILED', `Transcoding Azure audio to WAV failed: ${transcode.stderr}`);
      }

      const validation = validateGeneratedAudio(outputPath, {
        minSizeBytes: 500,
        expectedCodec: 'pcm_s16le',
        rejectSilence: true,
        rejectTone: true,
        decodeTest: true,
        throwOnError: false
      });

      if (!validation.valid) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
        throw new TTSError('TTS_OUTPUT_INVALID', `Validation failed for Azure output [${validation.code}]: ${validation.message}`);
      }

      return {
        audioPath: outputPath,
        duration: validation.duration,
        format: 'wav',
        voiceId: voice.voiceId
      };
    } finally {
      try { if (fs.existsSync(tempMp3Path)) fs.unlinkSync(tempMp3Path); } catch (_) {}
    }
  }
}

export default AzureNeuralTTSProvider;
