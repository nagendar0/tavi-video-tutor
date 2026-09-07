import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { TTSProvider } from './TTSProvider.js';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { normalizeLanguageCode, resolveLanguageCapability } from '../languages/registry.js';

export class NodeTTSProvider extends TTSProvider {
  constructor(options = {}) {
    super(options);
    this.allowSyntheticFallback = options.allowSyntheticFallback ?? true;
    this.onlineFallback = options.onlineFallback ?? true;
  }

  /**
   * Check whether this provider supports the given language code.
   * 
   * @param {string} language 
   * @returns {boolean}
   */
  supportsLanguage(language) {
    const norm = normalizeLanguageCode(language);
    if (!norm) return false;
    const cap = resolveLanguageCapability(norm);
    return Boolean(cap && cap.ttsSupported);
  }

  /**
   * Synthesize text to WAV file using system speech tool, online TTS,
   * or FFmpeg audio synthesis fallback.
   * 
   * @param {string} text 
   * @param {string} language 
   * @param {Object} [options] 
   * @returns {Promise<{ audioPath: string, duration: number, format: string, voiceId?: string }>}
   */
  async synthesize(text, language, options = {}) {
    const outputDir = options.outputDir || process.cwd();
    fs.mkdirSync(outputDir, { recursive: true });
    const filename = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.wav`;
    const outputPath = path.join(outputDir, filename);

    const normLang = normalizeLanguageCode(language) || String(language || 'en').toLowerCase().trim();
    const cap = resolveLanguageCapability(normLang);
    const sanitizedText = (text || '').trim();
    
    if (!sanitizedText) {
      throw new Error('TTS text cannot be empty');
    }

    const wordsCount = sanitizedText.split(/\s+/).filter(Boolean).length;
    const estimatedDuration = Math.max(0.8, wordsCount * 0.38);

    // 1. Try Native System Speech (Windows OneCore/SAPI, macOS say, Linux espeak)
    try {
      if (process.platform === 'win32') {
        const winRes = await this.synthesizeWindowsSpeech(sanitizedText, normLang, outputPath, options);
        if (winRes) return winRes;
      } else if (process.platform === 'darwin') {
        const macRes = await this.synthesizeDarwinSpeech(sanitizedText, normLang, outputPath, options);
        if (macRes) return macRes;
      } else if (process.platform === 'linux') {
        const linRes = await this.synthesizeLinuxSpeech(sanitizedText, normLang, outputPath, options);
        if (linRes) return linRes;
      }
    } catch (sysErr) {
      // System speech failed or unsupported for this language, proceed to online/fallback
    }

    // 2. Try High-Fidelity Online TTS Fallback
    if (this.onlineFallback && options.offline !== true) {
      try {
        const onlineRes = await this.synthesizeOnlineTTS(sanitizedText, normLang, outputPath, options);
        if (onlineRes) return onlineRes;
      } catch (onlineErr) {
        // Online TTS failed or offline
      }
    }

    // 3. Guaranteed Formant Fallback (if permitted)
    if (this.allowSyntheticFallback || options.allowSyntheticFallback) {
      this.generateFFmpegSyntheticAudio(sanitizedText, estimatedDuration, outputPath, options);
      return {
        audioPath: outputPath,
        duration: estimatedDuration,
        format: 'wav',
        voiceId: options.voiceId || `${normLang}_synth_fallback`,
        synthetic: true
      };
    }

    throw new Error(`AUDIO_NOT_AVAILABLE_FOR_LANGUAGE: Speech synthesis failed for language '${normLang}'`);
  }

  /**
   * Windows Speech Synthesis using SAPI with Speech_OneCore and Speech registry tokens.
   * Uses Base64-encoded UTF-8 to prevent any Windows command-line / code page encoding corruption.
   */
  async synthesizeWindowsSpeech(text, langCode, outputPath, options = {}) {
    const b64 = Buffer.from(text, 'utf8').toString('base64');
    const gender = (options.gender || '').toLowerCase(); // 'female' | 'male'
    const voicePreference = options.voiceId || '';
    const cap = resolveLanguageCapability(langCode);
    const langName = (cap?.displayName || '').toLowerCase();

    const tempPs1 = path.join(os.tmpdir(), `sapi_synth_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.ps1`);
    
    const psScript = `
$ErrorActionPreference = 'Stop'
$b64 = '${b64}'
$bytes = [System.Convert]::FromBase64String($b64)
$decoded = [System.Text.Encoding]::UTF8.GetString($bytes)

# Collect all tokens from both OneCore and standard SAPI
$allTokens = @()

try {
    $oneCoreCat = New-Object -ComObject SAPI.SpObjectTokenCategory
    $oneCoreCat.SetId("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Speech_OneCore\\Voices", $false)
    $ocTokens = $oneCoreCat.EnumerateTokens()
    for ($i = 0; $i -lt $ocTokens.Count; $i++) { $allTokens += $ocTokens.Item($i) }
} catch {}

try {
    $sapiCat = New-Object -ComObject SAPI.SpObjectTokenCategory
    $sapiCat.SetId("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Speech\\Voices", $false)
    $sTokens = $sapiCat.EnumerateTokens()
    for ($i = 0; $i -lt $sTokens.Count; $i++) { $allTokens += $sTokens.Item($i) }
} catch {}

# Find exact matching voice token for requested language
$targetLang = '${langCode}'.ToLower()
$targetName = '${langName}'.ToLower()

$matchingTokens = @()
foreach ($t in $allTokens) {
    $desc = $t.GetDescription().ToLower()
    $tokenName = $t.Id.Split('\\')[-1].ToLower()
    
    $isMatch = ($tokenName -like "*mstts_v110_\${targetLang}*") -or 
               ($tokenName -like "*tts_ms_\${targetLang}-*") -or 
               ($desc -like "*- \${targetName} (*") -or 
               ($desc -like "*(\${targetName})*")
               
    if ($isMatch) {
        $matchingTokens += $t
    }
}

if ($matchingTokens.Count -eq 0) {
    exit 2 # No language voice installed
}

# Select token matching requested gender or preference
$selectedToken = $matchingTokens[0]
$reqGender = '${gender}'
if ($reqGender -eq 'female') {
    foreach ($t in $matchingTokens) {
        $desc = $t.GetDescription()
        if ($desc -like '*Female*' -or $desc -like '*Kalpana*' -or $desc -like '*Zira*' -or $desc -like '*Heera*') {
            $selectedToken = $t
            break
        }
    }
} elseif ($reqGender -eq 'male') {
    foreach ($t in $matchingTokens) {
        $desc = $t.GetDescription()
        if ($desc -like '*Male*' -or $desc -like '*Hemant*' -or $desc -like '*David*' -or $desc -like '*Ravi*' -or $desc -like '*Mark*') {
            $selectedToken = $t
            break
        }
    }
}

$voice = New-Object -ComObject SAPI.SpVoice
$voice.Voice = $selectedToken

# Configure speaking rate if requested (-10 to 10)
$rate = ${options.rateOffset ? Math.round((options.rateOffset - 1.0) * 10) : 0}
if ($rate -ge -10 -and $rate -le 10) {
    $voice.Rate = $rate
}

$fileStream = New-Object -ComObject SAPI.SpFileStream
$fileStream.Open('${outputPath.replace(/\\/g, '\\\\')}', 3, $false)
$voice.AudioOutputStream = $fileStream
$voice.Speak($decoded) | Out-Null
$fileStream.Close()

Write-Output ($selectedToken.GetDescription().Trim())
`;

    try {
      fs.writeFileSync(tempPs1, psScript, 'utf8');
      const voiceDesc = execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs1}"`, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 10000
      }).trim();

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        const dur = this.getAudioDuration(outputPath);
        return {
          audioPath: outputPath,
          duration: dur || 2.0,
          format: 'wav',
          voiceId: voiceDesc || options.voiceId
        };
      }
    } catch (_) {
      // Failed or no installed voice
    } finally {
      if (fs.existsSync(tempPs1)) {
        try { fs.unlinkSync(tempPs1); } catch (_) {}
      }
    }

    return null;
  }

  /**
   * macOS Speech Synthesis via `say` command.
   */
  async synthesizeDarwinSpeech(text, langCode, outputPath, options = {}) {
    try {
      const voicesList = execSync('say -v ?', { encoding: 'utf8' });
      const lines = voicesList.split('\n');
      let matchingVoice = null;

      for (const line of lines) {
        if (line.toLowerCase().includes(`_${langCode.toLowerCase()}`) || line.toLowerCase().includes(`${langCode.toLowerCase()}_`)) {
          matchingVoice = line.split(/\s+/)[0];
          break;
        }
      }

      const voiceArg = matchingVoice ? `-v "${matchingVoice}"` : '';
      execSync(`say ${voiceArg} -o "${outputPath}" --data-format=LEI16@44100 "${text.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore',
        timeout: 8000
      });

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        const dur = this.getAudioDuration(outputPath);
        return { audioPath: outputPath, duration: dur || 2.0, format: 'wav', voiceId: matchingVoice };
      }
    } catch (_) {}
    return null;
  }

  /**
   * Linux Speech Synthesis via `espeak-ng` or `espeak`.
   */
  async synthesizeLinuxSpeech(text, langCode, outputPath, options = {}) {
    try {
      execSync(`espeak-ng -v ${langCode} -w "${outputPath}" "${text.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore',
        timeout: 8000
      });

      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
        const dur = this.getAudioDuration(outputPath);
        return { audioPath: outputPath, duration: dur || 2.0, format: 'wav', voiceId: `espeak_${langCode}` };
      }
    } catch (_) {}
    return null;
  }

  /**
   * High-Fidelity Online TTS Synthesis with chunking and audio conversion.
   */
  async synthesizeOnlineTTS(text, langCode, outputPath, options = {}) {
    const ffmpeg = getFFmpegBinaryPath();
    const tempMp3 = outputPath.replace(/\.wav$/i, '.mp3');

    // Online TTS URL
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${langCode}&client=tw-ob`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) {
      throw new Error(`Online TTS HTTP ${response.status}`);
    }

    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);

    if (buffer.length < 500) {
      throw new Error('Online TTS response too small or invalid');
    }

    fs.writeFileSync(tempMp3, buffer);

    // Transcode MP3 to WAV using FFmpeg
    execSync(`"${ffmpeg}" -y -i "${tempMp3}" -ar 44100 -ac 2 -c:a pcm_s16le "${outputPath}"`, {
      stdio: 'ignore'
    });

    if (fs.existsSync(tempMp3)) {
      try { fs.unlinkSync(tempMp3); } catch (_) {}
    }

    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
      const dur = this.getAudioDuration(outputPath);
      return {
        audioPath: outputPath,
        duration: dur || 2.0,
        format: 'wav',
        voiceId: `${langCode}-online-neural`
      };
    }

    return null;
  }

  generateFFmpegSyntheticAudio(text, duration, outputPath, options = {}) {
    const ffmpegBin = getFFmpegBinaryPath();
    const durFixed = Math.max(0.5, duration).toFixed(3);
    const isFemale = options.gender === 'female' || (options.pitchOffset && options.pitchOffset > 0);
    const baseF1 = isFemale ? 420 : 280;
    const baseF2 = isFemale ? 840 : 560;
    const pitchFactor = 1.0 + ((options.pitchOffset || 0) / 100.0);
    const f1 = Math.round(Math.max(100, Math.min(1000, baseF1 * pitchFactor)));
    const f2 = Math.round(Math.max(200, Math.min(2000, baseF2 * pitchFactor)));

    const ffmpegCmd = `"${ffmpegBin}" -y -f lavfi -i "sine=frequency=${f1}:duration=${durFixed}" -f lavfi -i "sine=frequency=${f2}:duration=${durFixed}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first,volume=0.3" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}"`;
    try {
      execSync(ffmpegCmd, { stdio: 'ignore' });
    } catch (err) {
      try {
        execSync(`"${ffmpegBin}" -y -f lavfi -i "sine=frequency=${f1}:duration=${durFixed}" -c:a pcm_s16le -ar 44100 -ac 2 "${outputPath}"`, { stdio: 'ignore' });
      } catch (_) {
        this.generateDummyWavFile(outputPath, duration);
      }
    }

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      this.generateDummyWavFile(outputPath, duration);
    }
  }

  generateDummyWavFile(outputPath, duration) {
    const sampleRate = 44100;
    const numSamples = Math.round(sampleRate * Math.max(0.5, duration));
    const wavBuffer = Buffer.alloc(44 + numSamples * 2);
    wavBuffer.write('RIFF', 0);
    wavBuffer.writeUInt32LE(36 + numSamples * 2, 4);
    wavBuffer.write('WAVE', 8);
    wavBuffer.write('fmt ', 12);
    wavBuffer.writeUInt32LE(16, 16);
    wavBuffer.writeUInt16LE(1, 20);
    wavBuffer.writeUInt16LE(1, 22);
    wavBuffer.writeUInt32LE(sampleRate, 24);
    wavBuffer.writeUInt32LE(sampleRate * 2, 28);
    wavBuffer.writeUInt16LE(2, 32);
    wavBuffer.writeUInt16LE(16, 34);
    wavBuffer.write('data', 36);
    wavBuffer.writeUInt32LE(numSamples * 2, 40);

    fs.writeFileSync(outputPath, wavBuffer);
  }

  getAudioDuration(filePath) {
    try {
      const ffmpegBin = getFFmpegBinaryPath();
      let ffprobeBin = ffmpegBin.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
      if (!fs.existsSync(ffprobeBin)) {
        ffprobeBin = 'ffprobe';
      }
      const probeOutput = execSync(`"${ffprobeBin}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const parsed = parseFloat(probeOutput.trim());
      return isNaN(parsed) ? null : parsed;
    } catch (_) {
      return null;
    }
  }
}

export default NodeTTSProvider;
