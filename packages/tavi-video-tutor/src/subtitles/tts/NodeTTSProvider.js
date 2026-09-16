import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import { TTSProvider } from './TTSProvider.js';
import { getFFmpegBinaryPath } from '../audio/extractAudio.js';
import { validateGeneratedAudio } from '../audio/validateAudio.js';
import { normalizeLanguageCode, resolveLanguageCapability } from '../languages/registry.js';

export class NodeTTSProvider extends TTSProvider {
  constructor(options = {}) {
    super(options);
    // Synthetic tones/silence are strictly prohibited in production paths.
    // They may only be enabled in test environments with both an environment flag and an explicit test option.
    const isTestEnv = process.env.AITUTOR_TEST_MODE === 'true' || process.env.NODE_ENV === 'test';
    this.allowSyntheticFallback = isTestEnv && (options.allowSyntheticFallback === true || options.__testOnlyExplicitFallback === true);
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
        if (winRes && fs.existsSync(winRes.audioPath)) {
          const val = validateGeneratedAudio(winRes.audioPath, { rejectSilence: true, rejectTone: true, decodeTest: true });
          if (val.valid) return winRes;
        }
      } else if (process.platform === 'darwin') {
        const macRes = await this.synthesizeDarwinSpeech(sanitizedText, normLang, outputPath, options);
        if (macRes && fs.existsSync(macRes.audioPath)) {
          const val = validateGeneratedAudio(macRes.audioPath, { rejectSilence: true, rejectTone: true, decodeTest: true });
          if (val.valid) return macRes;
        }
      } else if (process.platform === 'linux') {
        const linRes = await this.synthesizeLinuxSpeech(sanitizedText, normLang, outputPath, options);
        if (linRes && fs.existsSync(linRes.audioPath)) {
          const val = validateGeneratedAudio(linRes.audioPath, { rejectSilence: true, rejectTone: true, decodeTest: true });
          if (val.valid) return linRes;
        }
      }
    } catch (_sysErr) {
      // System speech failed or unsupported for this language, proceed to online/fallback
    }

    // 2. Try High-Fidelity Online TTS Fallback
    if (this.onlineFallback && options.offline !== true) {
      try {
        const onlineRes = await this.synthesizeOnlineTTS(sanitizedText, normLang, outputPath, options);
        if (onlineRes && fs.existsSync(onlineRes.audioPath)) {
          const val = validateGeneratedAudio(onlineRes.audioPath, { rejectSilence: true, rejectTone: true, decodeTest: true });
          if (val.valid) return onlineRes;
        }
      } catch (_onlineErr) {
        // Online TTS failed or offline
      }
    }

    // 3. Test-only synthetic fallback (strictly guarded: impossible to activate in production)
    const isExplicitTestMode = (process.env.AITUTOR_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') &&
      (this.allowSyntheticFallback || options.__testOnlyExplicitFallback === true);

    if (isExplicitTestMode) {
      this.generateFFmpegSyntheticAudio(sanitizedText, estimatedDuration, outputPath, options);
      return {
        audioPath: outputPath,
        duration: estimatedDuration,
        format: 'wav',
        voiceId: options.voiceId || `${normLang}_synth_fallback`,
        synthetic: true
      };
    }

    throw new Error(`AUDIO_NOT_AVAILABLE_FOR_LANGUAGE: Speech synthesis failed for language '${normLang}'. No real speech could be generated.`);
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

      const args = [
        ...(matchingVoice ? ['-v', matchingVoice] : []),
        '-o', outputPath,
        '--data-format=LEI16@44100',
        text
      ];
      const result = spawnSync('say', args, { stdio: 'ignore', timeout: 8000 });
      if (result.status !== 0 || result.error) return null;

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
      const result = spawnSync('espeak-ng', ['-v', langCode, '-w', outputPath, text], {
        stdio: 'ignore',
        timeout: 8000
      });
      if (result.status !== 0 || result.error) return null;

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
    try {
      const transcodeProc = spawnSync(ffmpeg, [
        '-y',
        '-i', tempMp3,
        '-ar', '44100',
        '-ac', '2',
        '-c:a', 'pcm_s16le',
        outputPath
      ], { windowsHide: true });

      if (transcodeProc.status !== 0 && transcodeProc.error) {
        throw new Error(`Online TTS transcode failed: ${transcodeProc.error.message}`);
      }
    } finally {
      if (fs.existsSync(tempMp3)) {
        try { fs.unlinkSync(tempMp3); } catch (_) {}
      }
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
    const isExplicitTestMode = (process.env.AITUTOR_TEST_MODE === 'true' || process.env.NODE_ENV === 'test') &&
      (this.allowSyntheticFallback || options.__testOnlyExplicitFallback === true);
    if (!isExplicitTestMode) {
      throw new Error('SYNTHETIC_AUDIO_DISALLOWED: Synthetic speech tones or silence cannot be generated in production.');
    }
    const ffmpegBin = getFFmpegBinaryPath();
    const durFixed = Math.max(0.5, duration).toFixed(3);
    const isFemale = options.gender === 'female' || (options.pitchOffset && options.pitchOffset > 0);
    const baseF1 = isFemale ? 420 : 280;
    const baseF2 = isFemale ? 840 : 560;
    const pitchFactor = 1.0 + ((options.pitchOffset || 0) / 100.0);
    const f1 = Math.round(Math.max(100, Math.min(1000, baseF1 * pitchFactor)));
    const f2 = Math.round(Math.max(200, Math.min(2000, baseF2 * pitchFactor)));

    // Formant dual-sine harmonic voice synthesis exclusively for isolated tests
    const sineArgs = [
      '-y',
      '-f', 'lavfi', '-i', `sine=frequency=${f1}:duration=${durFixed}`,
      '-f', 'lavfi', '-i', `sine=frequency=${f2}:duration=${durFixed}`,
      '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first,volume=0.3',
      '-c:a', 'pcm_s16le',
      '-ar', '44100',
      '-ac', '2',
      outputPath
    ];

    let proc = spawnSync(ffmpegBin, sineArgs, { encoding: 'utf8', windowsHide: true });
    if (proc.status === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 500) {
      return outputPath;
    }

    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch (_) {}
    }

    const stderr = (proc.stderr || proc.error?.message || 'Unknown error').trim();
    throw new Error(`Failed to generate test synthetic audio [exitCode=${proc.status}]: ${stderr}`);
  }

  getAudioDuration(filePath) {
    try {
      const ffmpegBin = getFFmpegBinaryPath();
      let ffprobeBin = ffmpegBin.replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
      if (!fs.existsSync(ffprobeBin)) {
        ffprobeBin = 'ffprobe';
      }
      const probe = spawnSync(ffprobeBin, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', filePath], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
      if (probe.status !== 0 || probe.error) return null;
      const parsed = parseFloat((probe.stdout || '').trim());
      return isNaN(parsed) ? null : parsed;
    } catch (_) {
      return null;
    }
  }
}

export default NodeTTSProvider;
