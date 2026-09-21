import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { EdgeTTSProvider } from '../src/subtitles/tts/EdgeTTSProvider.js';
import { validateGeneratedAudio } from '../src/subtitles/audio/validateAudio.js';

const BENCHMARK_CORPUS = [
  {
    lang: 'hi',
    langName: 'Hindi',
    sentenceId: 'hi_short',
    sentenceLabel: 'Short Sentence',
    text: 'यह हिंदी भाषा का छोटा वाक्य है।'
  },
  {
    lang: 'hi',
    langName: 'Hindi',
    sentenceId: 'hi_tech',
    sentenceLabel: 'Complex Technical Sentence',
    text: 'कंप्यूटर विज्ञान में, एल्गोरिदम 250 मिलीसेकंड में 1000 डेटा नोड्स को प्रोसेस करता है।'
  },
  {
    lang: 'te',
    langName: 'Telugu',
    sentenceId: 'te_short',
    sentenceLabel: 'Short Sentence',
    text: 'ఇది తెలుగు భాషలో చిన్న వాక్యం.'
  },
  {
    lang: 'te',
    langName: 'Telugu',
    sentenceId: 'te_tech',
    sentenceLabel: 'Complex Technical Sentence',
    text: 'కంప్యూటర్ సైన్స్లో, అల్గోరిథం 250 మిల్లీసెకన్లలో 1000 డేటా నోడ్లను ప్రాసెస్ చేస్తుంది.'
  }
];

async function measureExecution(fn) {
  const startCpu = process.cpuUsage();
  const startMem = process.memoryUsage().heapUsed;
  const startHr = process.hrtime.bigint();

  const result = await fn();

  const endHr = process.hrtime.bigint();
  const endCpu = process.cpuUsage(startCpu);
  const endMem = process.memoryUsage().heapUsed;

  const durationMs = Number(endHr - startHr) / 1e6;
  const cpuMs = (endCpu.user + endCpu.system) / 1000;
  const ramMb = (endMem - startMem) / (1024 * 1024);

  return {
    result,
    durationMs: Number(durationMs.toFixed(2)),
    cpuMs: Number(cpuMs.toFixed(2)),
    ramMb: Number(ramMb.toFixed(2))
  };
}

export async function runBenchmark(outputDir = path.resolve('benchmarks/audio')) {
  fs.mkdirSync(outputDir, { recursive: true });

  const systemProvider = new NodeTTSProvider();
  const neuralProvider = new EdgeTTSProvider({ timeoutMs: 20000 });

  console.log('\n============================================================');
  console.log('TAVI TTS BENCHMARK: CURRENT TAVI (SYSTEM) VS NEURAL TTS');
  console.log('============================================================\n');

  const rows = [];

  for (const item of BENCHMARK_CORPUS) {
    console.log(`\n--- [${item.langName}] ${item.sentenceLabel} ---`);
    console.log(`Text: "${item.text}"`);

    // 1. Current Tavi System TTS (Windows SAPI / Online fallback)
    try {
      const sysMeasure = await measureExecution(async () => {
        return await systemProvider.synthesize(item.text, item.lang, {
          outputDir,
          gender: 'female'
        });
      });

      const sysAudioPath = sysMeasure.result.audioPath;
      const targetSysPath = path.join(outputDir, `system_${item.sentenceId}.wav`);
      if (sysAudioPath !== targetSysPath) {
        fs.copyFileSync(sysAudioPath, targetSysPath);
      }

      const sysBytes = fs.readFileSync(targetSysPath);
      const sysSha = crypto.createHash('sha256').update(sysBytes).digest('hex');
      const sysVal = validateGeneratedAudio(targetSysPath, { rejectSilence: true, rejectTone: true, decodeTest: true });

      const sysRow = {
        category: 'CURRENT_TAVI_SYSTEM',
        provider: 'NodeTTSProvider',
        voiceId: sysMeasure.result.voiceId || 'System Voice',
        lang: item.lang,
        langName: item.langName,
        sentenceId: item.sentenceId,
        sentenceLabel: item.sentenceLabel,
        text: item.text,
        generationTimeMs: sysMeasure.durationMs,
        audioDurationSec: Number((sysVal.duration || sysMeasure.result.duration).toFixed(3)),
        fileSizeBytes: sysVal.size || sysBytes.length,
        sampleRate: sysVal.sampleRate || 44100,
        channels: sysVal.channels || 2,
        cpuMs: sysMeasure.cpuMs,
        ramDeltaMb: sysMeasure.ramMb,
        valid: sysVal.valid,
        sha256: sysSha,
        audioPath: targetSysPath
      };
      rows.push(sysRow);
      console.log(`✓ System TTS: ${sysRow.generationTimeMs}ms, ${sysRow.audioDurationSec}s, ${sysRow.fileSizeBytes} bytes [Valid: ${sysRow.valid}]`);
    } catch (sysErr) {
      console.error(`✗ System TTS Failed for ${item.sentenceId}:`, sysErr.message);
      rows.push({
        category: 'CURRENT_TAVI_SYSTEM',
        provider: 'NodeTTSProvider',
        voiceId: 'Unavailable',
        lang: item.lang,
        langName: item.langName,
        sentenceId: item.sentenceId,
        sentenceLabel: item.sentenceLabel,
        text: item.text,
        error: sysErr.message,
        valid: false
      });
    }

    // 2. Neural Provider — Female Voice
    try {
      const neuralFemaleMeasure = await measureExecution(async () => {
        return await neuralProvider.synthesize(item.text, item.lang, {
          outputDir,
          gender: 'female'
        });
      });

      const nfAudioPath = neuralFemaleMeasure.result.audioPath;
      const targetNfPath = path.join(outputDir, `neural_female_${item.sentenceId}.wav`);
      if (nfAudioPath !== targetNfPath) {
        fs.copyFileSync(nfAudioPath, targetNfPath);
      }

      const nfBytes = fs.readFileSync(targetNfPath);
      const nfSha = crypto.createHash('sha256').update(nfBytes).digest('hex');
      const nfVal = validateGeneratedAudio(targetNfPath, { rejectSilence: true, rejectTone: true, decodeTest: true });

      const nfRow = {
        category: 'NEURAL_PROVIDER_FEMALE',
        provider: 'EdgeTTSProvider',
        voiceId: neuralFemaleMeasure.result.voiceId,
        lang: item.lang,
        langName: item.langName,
        sentenceId: item.sentenceId,
        sentenceLabel: item.sentenceLabel,
        text: item.text,
        generationTimeMs: neuralFemaleMeasure.durationMs,
        audioDurationSec: Number(nfVal.duration.toFixed(3)),
        fileSizeBytes: nfVal.size || nfBytes.length,
        sampleRate: nfVal.sampleRate || 44100,
        channels: nfVal.channels || 2,
        cpuMs: neuralFemaleMeasure.cpuMs,
        ramDeltaMb: neuralFemaleMeasure.ramMb,
        valid: nfVal.valid,
        sha256: nfSha,
        audioPath: targetNfPath
      };
      rows.push(nfRow);
      console.log(`✓ Neural Female (${nfRow.voiceId}): ${nfRow.generationTimeMs}ms, ${nfRow.audioDurationSec}s, ${nfRow.fileSizeBytes} bytes [Valid: ${nfRow.valid}]`);
    } catch (nfErr) {
      console.error(`✗ Neural Female Failed:`, nfErr.message);
    }

    // 3. Neural Provider — Male Voice
    try {
      const neuralMaleMeasure = await measureExecution(async () => {
        return await neuralProvider.synthesize(item.text, item.lang, {
          outputDir,
          gender: 'male'
        });
      });

      const nmAudioPath = neuralMaleMeasure.result.audioPath;
      const targetNmPath = path.join(outputDir, `neural_male_${item.sentenceId}.wav`);
      if (nmAudioPath !== targetNmPath) {
        fs.copyFileSync(nmAudioPath, targetNmPath);
      }

      const nmBytes = fs.readFileSync(targetNmPath);
      const nmSha = crypto.createHash('sha256').update(nmBytes).digest('hex');
      const nmVal = validateGeneratedAudio(targetNmPath, { rejectSilence: true, rejectTone: true, decodeTest: true });

      const nmRow = {
        category: 'NEURAL_PROVIDER_MALE',
        provider: 'EdgeTTSProvider',
        voiceId: neuralMaleMeasure.result.voiceId,
        lang: item.lang,
        langName: item.langName,
        sentenceId: item.sentenceId,
        sentenceLabel: item.sentenceLabel,
        text: item.text,
        generationTimeMs: neuralMaleMeasure.durationMs,
        audioDurationSec: Number(nmVal.duration.toFixed(3)),
        fileSizeBytes: nmVal.size || nmBytes.length,
        sampleRate: nmVal.sampleRate || 44100,
        channels: nmVal.channels || 2,
        cpuMs: neuralMaleMeasure.cpuMs,
        ramDeltaMb: neuralMaleMeasure.ramMb,
        valid: nmVal.valid,
        sha256: nmSha,
        audioPath: targetNmPath
      };
      rows.push(nmRow);
      console.log(`✓ Neural Male (${nmRow.voiceId}): ${nmRow.generationTimeMs}ms, ${nmRow.audioDurationSec}s, ${nmRow.fileSizeBytes} bytes [Valid: ${nmRow.valid}]`);
    } catch (nmErr) {
      console.error(`✗ Neural Male Failed:`, nmErr.message);
    }
  }

  // Save report as JSON
  const reportPath = path.join(outputDir, 'benchmark_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(rows, null, 2), 'utf8');

  // Build HTML Listening Suite
  buildHtmlListeningSuite(rows, outputDir);

  return rows;
}

function buildHtmlListeningSuite(rows, outputDir) {
  const htmlPath = path.join(outputDir, 'listening_suite.html');

  const cardHtml = rows.map((r, i) => {
    const relAudio = path.basename(r.audioPath || '');
    return `
    <div class="audio-card">
      <div class="card-header">
        <span class="badge ${r.category.includes('NEURAL') ? 'badge-neural' : 'badge-system'}">${r.category}</span>
        <span class="voice-id">${r.voiceId}</span>
      </div>
      <div class="lang-title">${r.langName} (${r.lang}) — ${r.sentenceLabel}</div>
      <p class="transcript">"${r.text}"</p>
      <audio controls preload="auto" src="${relAudio}" class="player"></audio>
      <table class="meta-table">
        <tr><td>Generation Time:</td><td><strong>${r.generationTimeMs} ms</strong></td></tr>
        <tr><td>Duration:</td><td>${r.audioDurationSec} s</td></tr>
        <tr><td>File Size:</td><td>${(r.fileSizeBytes / 1024).toFixed(1)} KB</td></tr>
        <tr><td>Format:</td><td>${r.sampleRate}Hz 16-bit stereo PCM WAV</td></tr>
        <tr><td>Validation:</td><td><span class="status-pass">${r.valid ? 'PASS (Non-Silent, Valid Waveform)' : 'FAIL'}</span></td></tr>
        <tr><td>SHA-256:</td><td class="mono">${(r.sha256 || '').substring(0, 24)}...</td></tr>
      </table>
    </div>`;
  }).join('\n');

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tavi Audio Listening Suite — Current System vs Neural TTS</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 30px; margin: 0; }
    h1 { margin-bottom: 8px; color: #38bdf8; font-size: 26px; }
    p.lead { color: #94a3b8; margin-top: 0; margin-bottom: 24px; font-size: 15px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; }
    .audio-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-neural { background: #0284c7; color: #fff; }
    .badge-system { background: #475569; color: #e2e8f0; }
    .voice-id { font-size: 12px; color: #a5b4fc; font-family: monospace; }
    .lang-title { font-size: 16px; font-weight: 600; color: #f1f5f9; margin-bottom: 6px; }
    .transcript { font-style: italic; color: #cbd5e1; font-size: 14px; background: #0f172a; padding: 10px; border-radius: 6px; border-left: 3px solid #38bdf8; margin: 10px 0; }
    audio.player { width: 100%; margin: 12px 0; }
    .meta-table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 8px; }
    .meta-table td { padding: 4px 0; border-bottom: 1px solid #334155; }
    .meta-table td:first-child { color: #94a3b8; width: 130px; }
    .mono { font-family: monospace; color: #64748b; }
    .status-pass { color: #4ade80; font-weight: 600; }
  </style>
</head>
<body>
  <h1>Tavi Audio Evaluation Suite</h1>
  <p class="lead">Side-by-Side Verification: Current Tavi System TTS vs Isolated Neural TTS (Hindi & Telugu)</p>
  <div class="grid">
    ${cardHtml}
  </div>
</body>
</html>`;

  fs.writeFileSync(htmlPath, htmlContent, 'utf8');
  console.log(`\n✓ Generated HTML Listening Suite at:\n  ${htmlPath}\n`);
}

if (process.argv[1] && process.argv[1].endsWith('runAudioBenchmark.js')) {
  runBenchmark().catch(err => {
    console.error('Benchmark error:', err);
    process.exit(1);
  });
}
