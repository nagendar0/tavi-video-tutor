import { EdgeTTSProvider, TTSError, escapeXml } from './EdgeTTSProvider.js';
import { normalizeLanguageCode } from '../languages/registry.js';
import { resolveNeuralVoice } from './neuralVoiceRegistry.js';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { validateGeneratedAudio } from '../audio/validateAudio.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';

/**
 * Azure Neural Text-to-Speech Provider.
 * 
 * Supports two operational tiers:
 * 1. Direct Azure Cognitive Services Speech API (when AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are supplied).
 * 2. High-performance Edge Neural TTS fallback (when no Azure API key is configured).
 * 
 * Legal & Commercial Notice:
 * Direct Azure Speech API requires a valid Microsoft Azure subscription subject to Azure Cognitive Services terms.
 * Edge Read Aloud endpoints are provided by Microsoft Edge and subject to service availability and acceptable use.
 */
export class AzureNeuralTTSProvider extends EdgeTTSProvider {
  constructor(options = {}) {
    super(options);
    this.azureKey = options.azureKey || process.env.AZURE_SPEECH_KEY || null;
    this.azureRegion = options.azureRegion || process.env.AZURE_SPEECH_REGION || 'eastus';
  }

  /**
   * Synthesize text into WAV audio.
   * Routes to Azure Cognitive Services REST API if credentials exist,
   * otherwise routes to Edge Neural TTS.
   * 
   * @param {string} text 
   * @param {string} language 
   * @param {Object} [options] 
   * @returns {Promise<{ audioPath: string, duration: number, format: string, voiceId: string }>}
   */
  async synthesize(text, language, options = {}) {
    if (this.azureKey) {
      return this.synthesizeWithAzureRest(text, language, options);
    }
    return super.synthesize(text, language, options);
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

    try {
      const response = await fetch(endpoint, {
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

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new TTSError('TTS_AUTH_ERROR', `Azure Speech API Authentication failed (HTTP ${response.status}). Verify AZURE_SPEECH_KEY and AZURE_SPEECH_REGION.`);
        }
        throw new TTSError('TTS_SYNTHESIS_FAILED', `Azure Speech API error HTTP ${response.status}: ${await response.text()}`);
      }

      const arrayBuf = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
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
