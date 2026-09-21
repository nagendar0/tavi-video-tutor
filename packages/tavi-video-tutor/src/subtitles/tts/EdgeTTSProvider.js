import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import WebSocket from 'ws';

import { TTSProvider } from './TTSProvider.js';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { validateGeneratedAudio } from '../audio/validateAudio.js';
import { normalizeLanguageCode } from '../languages/registry.js';
import {
  isNeuralLanguageSupported,
  isNeuralVoiceSupported,
  resolveNeuralVoice
} from './neuralVoiceRegistry.js';

const WIN_EPOCH = 11644473600n;
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_MAJOR_VERSION = '143';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;

/**
 * Custom Typed Error for TTS operations.
 */
export class TTSError extends Error {
  constructor(code, message, details = {}) {
    super(`[${code}] ${message}`);
    this.name = 'TTSError';
    this.code = code;
    this.details = details;
  }
}

/**
 * XML Sanitizer for SSML input.
 * Strictly escapes &, <, >, ", and ' to prevent malformed SSML injection.
 * 
 * @param {string} unsafe 
 * @returns {string}
 */
export function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates the Sec-MS-GEC token for Edge TTS WebSocket authentication.
 * 
 * @param {number} [clockSkewSeconds=0]
 * @returns {string} Uppercased SHA-256 hex string
 */
export function generateSecMsGec(clockSkewSeconds = 0) {
  const unixSec = BigInt(Math.floor(Date.now() / 1000 + clockSkewSeconds));
  let ticks = unixSec + WIN_EPOCH;
  ticks -= (ticks % 300n);
  ticks = ticks * 10000000n;
  const payload = ticks.toString() + TRUSTED_CLIENT_TOKEN;
  return crypto.createHash('sha256').update(payload, 'ascii').digest('hex').toUpperCase();
}

/**
 * Isolated Neural Text-to-Speech Provider using Microsoft Edge Neural TTS.
 * 
 * Generates natural, human-grade neural speech for supported languages (including Hindi & Telugu)
 * without requiring synthetic tones, silence fallbacks, or third-party API keys.
 */
export class EdgeTTSProvider extends TTSProvider {
  constructor(options = {}) {
    super(options);
    this.timeoutMs = options.timeoutMs || options.timeout || 12000;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    this.clockSkewSeconds = 0;
  }

  /**
   * Check whether this provider supports the given language code.
   * 
   * @param {string} language 
   * @returns {boolean}
   */
  supportsLanguage(language) {
    return isNeuralLanguageSupported(language);
  }

  /**
   * Check whether this provider supports the specific voice identifier.
   * 
   * @param {string} voiceId 
   * @returns {boolean}
   */
  supportsVoice(voiceId) {
    return isNeuralVoiceSupported(voiceId);
  }

  /**
   * Adjust clock skew if server response headers differ from local clock.
   * 
   * @param {number} serverTimestampSec 
   */
  adjustClockSkew(serverTimestampSec) {
    const localSec = Date.now() / 1000;
    this.clockSkewSeconds = serverTimestampSec - localSec;
  }

  /**
   * Synthesize text into high-fidelity PCM WAV audio.
   * 
   * @param {string} text - Segment text to synthesize
   * @param {string} language - Target language code (e.g. 'hi', 'te')
   * @param {Object} [options] - Synthesis options
   * @returns {Promise<{ audioPath: string, duration: number, format: string, voiceId: string }>}
   */
  async synthesize(text, language, options = {}) {
    const normLang = normalizeLanguageCode(language);
    if (!normLang) {
      throw new TTSError('TTS_LANGUAGE_UNAVAILABLE', `Invalid or unrecognized language code: '${language}'`);
    }

    if (!this.supportsLanguage(normLang)) {
      throw new TTSError('TTS_LANGUAGE_UNAVAILABLE', `Language '${normLang}' is not supported by neural TTS provider.`);
    }

    const sanitizedText = String(text || '').trim();
    if (!sanitizedText) {
      throw new TTSError('TTS_SYNTHESIS_FAILED', 'TTS input text cannot be empty or whitespace.');
    }

    // Resolve voice from registry
    const voice = resolveNeuralVoice(normLang, options);
    if (!voice) {
      throw new TTSError('TTS_VOICE_UNAVAILABLE', `No suitable neural voice available for language '${normLang}'.`);
    }

    const outputDir = options.outputDir || process.cwd();
    fs.mkdirSync(outputDir, { recursive: true });
    const fileId = `neural_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const outputPath = path.join(outputDir, `${fileId}.wav`);
    const tempMp3Path = path.join(outputDir, `${fileId}.mp3`);

    // Format prosody attributes
    const pitchOffset = typeof options.pitchOffset === 'number' ? options.pitchOffset : 0;
    const rateOffset = typeof options.rateOffset === 'number' ? options.rateOffset : 1.0;

    const pitchStr = pitchOffset !== 0 ? `${pitchOffset > 0 ? '+' : ''}${Math.round(pitchOffset)}Hz` : '+0Hz';
    const ratePercent = Math.round((rateOffset - 1.0) * 100);
    const rateStr = ratePercent !== 0 ? `${ratePercent > 0 ? '+' : ''}${ratePercent}%` : '+0%';

    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voice.locale}"><voice name="${voice.voiceId}"><prosody pitch="${pitchStr}" rate="${rateStr}">${escapeXml(sanitizedText)}</prosody></voice></speak>`;

    let attempts = 0;
    let lastError = null;

    while (attempts <= this.maxRetries) {
      attempts++;
      try {
        await this.executeSynthesisWebSocket(ssml, tempMp3Path, options);

        // Transcode received MP3 audio to standard PCM 44.1kHz 16-bit stereo WAV
        const ffmpeg = getFFmpegBinaryPath();
        const transcodeProc = spawnSync(ffmpeg, [
          '-y',
          '-i', tempMp3Path,
          '-ar', '44100',
          '-ac', '2',
          '-c:a', 'pcm_s16le',
          outputPath
        ], { encoding: 'utf8', windowsHide: true });

        if (transcodeProc.status !== 0 || !fs.existsSync(outputPath)) {
          throw new TTSError('TTS_SYNTHESIS_FAILED', `Audio transcode to PCM WAV failed: ${transcodeProc.stderr || 'unknown error'}`);
        }

        // Rigorous Audio Validation (ensures genuine non-silent, non-synthetic speech)
        const validation = validateGeneratedAudio(outputPath, {
          minSizeBytes: 500,
          minDuration: 0.1,
          expectedCodec: 'pcm_s16le',
          rejectSilence: true,
          rejectTone: true,
          decodeTest: true,
          throwOnError: false
        });

        if (!validation.valid) {
          try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}
          throw new TTSError('TTS_OUTPUT_INVALID', `Generated audio validation failed [${validation.code}]: ${validation.message}`);
        }

        return {
          audioPath: outputPath,
          duration: validation.duration,
          format: 'wav',
          voiceId: voice.voiceId
        };
      } catch (err) {
        lastError = err;
        // Clean up partial artifacts
        try { if (fs.existsSync(tempMp3Path)) fs.unlinkSync(tempMp3Path); } catch (_) {}
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch (_) {}

        // Fail fast on non-retryable errors
        if (err.code === 'TTS_LANGUAGE_UNAVAILABLE' || err.code === 'TTS_VOICE_UNAVAILABLE' || err.code === 'TTS_OUTPUT_INVALID') {
          throw err;
        }

        if (attempts <= this.maxRetries) {
          // Bounded exponential backoff
          const delay = Math.min(3000, 400 * Math.pow(2, attempts - 1));
          await new Promise(r => setTimeout(r, delay));
        }
      } finally {
        try { if (fs.existsSync(tempMp3Path)) fs.unlinkSync(tempMp3Path); } catch (_) {}
      }
    }

    if (lastError instanceof TTSError) {
      throw lastError;
    }
    throw new TTSError('TTS_SYNTHESIS_FAILED', `Neural TTS synthesis failed after ${this.maxRetries} retries: ${lastError?.message || 'unknown error'}`);
  }

  /**
   * Internal WebSocket worker to transmit SSML and receive binary audio frames.
   */
  async executeSynthesisWebSocket(ssml, targetMp3Path, options = {}) {
    return new Promise((resolve, reject) => {
      const gec = generateSecMsGec(this.clockSkewSeconds);
      const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;
      const muid = crypto.randomBytes(16).toString('hex').toUpperCase();

      let ws = null;
      let timer = null;
      let completed = false;
      const audioBuffers = [];

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        if (ws) {
          try {
            ws.removeAllListeners();
            ws.on('error', () => {});
            if (typeof ws.terminate === 'function') {
              try { ws.terminate(); } catch (_) {}
            } else if (ws.readyState === WebSocket.OPEN) {
              try { ws.close(); } catch (_) {}
            }
          } catch (_) {}
        }
      };

      timer = setTimeout(() => {
        if (!completed) {
          completed = true;
          cleanup();
          reject(new TTSError('TTS_NETWORK_ERROR', `Neural TTS request timed out after ${this.timeoutMs}ms.`));
        }
      }, this.timeoutMs);

      try {
        ws = new WebSocket(url, {
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
            'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cookie': `muid=${muid};`
          }
        });
      } catch (wsInitErr) {
        cleanup();
        return reject(new TTSError('TTS_PROVIDER_UNAVAILABLE', `Failed to initialize WebSocket: ${wsInitErr.message}`));
      }

      ws.on('open', () => {
        try {
          const dateStr = new Date().toUTCString();
          const configMsg = `X-Timestamp:${dateStr}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`;
          ws.send(configMsg);

          const reqId = crypto.randomUUID().replace(/-/g, '');
          const ssmlMsg = `X-RequestId:${reqId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${dateStr}Z\r\nPath:ssml\r\n\r\n${ssml}`;
          ws.send(ssmlMsg);
        } catch (sendErr) {
          completed = true;
          cleanup();
          reject(new TTSError('TTS_NETWORK_ERROR', `Failed to send SSML payload: ${sendErr.message}`));
        }
      });

      ws.on('message', (data, isBinary) => {
        if (completed) return;

        if (isBinary) {
          const buf = Buffer.from(data);
          if (buf.length < 2) return;
          const headerLen = buf.readUInt16BE(0);
          if (buf.length >= 2 + headerLen) {
            const header = buf.toString('utf8', 2, 2 + headerLen);
            if (header.includes('Path:audio')) {
              const audioPayload = buf.subarray(2 + headerLen);
              if (audioPayload.length > 0) {
                audioBuffers.push(audioPayload);
              }
            }
          }
        } else {
          const text = data.toString('utf8');
          if (text.includes('Path:turn.end')) {
            completed = true;
            cleanup();
            if (audioBuffers.length === 0) {
              return reject(new TTSError('TTS_SYNTHESIS_FAILED', 'Neural TTS returned turn.end without audio payload.'));
            }
            const fullMp3 = Buffer.concat(audioBuffers);
            fs.writeFileSync(targetMp3Path, fullMp3);
            resolve();
          }
        }
      });

      ws.on('error', (err) => {
        if (completed) return;
        completed = true;
        cleanup();
        const msg = err.message || String(err);
        if (msg.includes('403')) {
          reject(new TTSError('TTS_AUTH_ERROR', `Authentication refused (HTTP 403): ${msg}`));
        } else {
          reject(new TTSError('TTS_NETWORK_ERROR', `WebSocket error: ${msg}`));
        }
      });

      ws.on('close', (code, reason) => {
        if (completed) return;
        completed = true;
        cleanup();
        const reasonStr = reason ? reason.toString() : '';
        if (code !== 1000) {
          reject(new TTSError('TTS_NETWORK_ERROR', `WebSocket connection closed unexpectedly [code ${code}]: ${reasonStr}`));
        }
      });
    });
  }
}

export default EdgeTTSProvider;
