import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { TerminologyGlossary } from '../src/subtitles/transcript/glossary.js';
import { TranscriptNormalizer } from '../src/subtitles/transcript/normalizer.js';
import { TranscriptCache } from '../src/subtitles/transcript/transcriptCache.js';
import { SubtitleSegmenter } from '../src/subtitles/segmentation/SubtitleSegmenter.js';
import { ProtectedTerms } from '../src/subtitles/translation/ProtectedTerms.js';
import { TranslationValidator } from '../src/subtitles/translation/TranslationValidator.js';
import { MetricsCollector } from '../src/subtitles/metrics/MetricsCollector.js';
import { WhisperProvider } from '../src/subtitles/transcription/WhisperProvider.js';
import { runStatus, runValidate, runClean, runGenerate } from '../src/cli/cli.js';

test('1. Terminology Glossary & ASR Misrecognition Normalization', () => {
  const glossary = new TerminologyGlossary(['CustomTerm']);
  assert.equal(glossary.normalizeText('welcome to anthropoc and cloud fable 5'), 'welcome to Anthropic and Claude 3.5');
  assert.equal(glossary.normalizeText('learning react js and node js'), 'learning React and Node.js');
  assert.equal(glossary.normalizeText('using customterm with postgres ql'), 'using CustomTerm with PostgreSQL');
});

test('2. Safe Transcript Normalizer — Unicode NFC, Spacing & Punctuation', () => {
  const normalizer = new TranscriptNormalizer();
  const raw = {
    language: 'en',
    segments: [
      { start: 0.5, end: 3.5, text: '  welcome  to  anthropoc , learning react js .  ' }
    ]
  };

  const norm = normalizer.normalizeTranscript(raw);
  assert.equal(norm.segments[0].text, 'Welcome to Anthropic, learning React.');
  assert.equal(norm.segments[0].start, 0.5);
  assert.equal(norm.segments[0].end, 3.5);
});

test('3. Dual Transcript Storage — RAW + NORMALIZED Preservation', () => {
  const tmpCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-raw-norm-'));
  const cache = new TranscriptCache(tmpCwd);

  const rawSegs = [{ start: 1.0, end: 4.0, text: 'raw text anthropoc' }];
  const normSegs = [{ start: 1.0, end: 4.0, text: 'raw text Anthropic' }];

  cache.saveMasterTranscript('demo-vid', 'en', rawSegs, normSegs);

  const loaded = cache.loadMasterTranscript('demo-vid');
  assert.ok(loaded.raw);
  assert.ok(loaded.normalized);
  assert.equal(loaded.raw.segments[0].text, 'raw text anthropoc');
  assert.equal(loaded.normalized.segments[0].text, 'raw text Anthropic');

  fs.rmSync(tmpCwd, { recursive: true, force: true });
});

test('4. Subtitle Segmenter — Readability Rules & No Word-Breaks', () => {
  const segmenter = new SubtitleSegmenter({ maxCharsPerLine: 25, maxLines: 2 });
  const longSegment = {
    start: 0.0,
    end: 8.0,
    text: 'Today we are going to learn about React components and hooks.'
  };

  const cues = segmenter.segmentSingleCue(longSegment);
  assert.ok(cues.length >= 1);
  cues.forEach(cue => {
    const lines = cue.text.split('\n');
    assert.ok(lines.length <= 2, 'Max 2 lines per cue');
    lines.forEach(line => {
      assert.ok(!line.includes('lea\nrn'), 'Words should not be split across lines arbitrarily');
    });
  });
});

test('5. Protected Terms & Multilingual Translation QA Validator', () => {
  const protectedTerms = new ProtectedTerms();
  assert.equal(protectedTerms.isProtectedTerm('React'), true);
  assert.equal(protectedTerms.isProtectedTerm('Claude'), true);
  assert.equal(protectedTerms.isProtectedTerm('v1.2.3'), true);

  const validator = new TranslationValidator();

  // Test Telugu script validation
  const teluguPass = validator.validateTranslation('Welcome to Python', 'పైథాన్‌కు స్వాగతం', 'te');
  assert.equal(teluguPass.status, 'PASS');

  // Test protected term preservation
  const protectedPass = validator.validateTranslation('Learn React with Anthropic', 'Anthropic తో React నేర్చుకోండి', 'te');
  assert.equal(protectedPass.status, 'PASS');

  // Test missing protected term
  const protectedMissing = validator.validateTranslation('Learn React with Anthropic', 'Welcome to Python lecture', 'te');
  assert.equal(protectedMissing.status, 'SUSPICIOUS');
});

test('6. Processing Metrics & Real-Time Factor (RTF)', () => {
  const metrics = new MetricsCollector(60.0); // 60s video
  metrics.recordTiming('asrTime', 6000); // 6s ASR
  assert.equal(metrics.getRealTimeFactor(), 0.1);

  const cues = [
    { start: 0.0, end: 3.0, text: 'Short cue text' },
    { start: 3.1, end: 10.0, text: 'Super long overlong cue text that exceeds 6 seconds duration' }
  ];
  metrics.analyzeQuality(cues);
  assert.equal(metrics.qualityStats.cuesCount, 2);
  assert.equal(metrics.qualityStats.overlongCues, 1);
});

test('7. WhisperProvider — Quality Mode Mapping & Model Selection', () => {
  const fastProvider = new WhisperProvider({ quality: 'fast' });
  assert.equal(fastProvider.resolveModelName(), 'Xenova/whisper-tiny');

  const balancedProvider = new WhisperProvider({ quality: 'balanced' });
  assert.equal(balancedProvider.resolveModelName(), 'Xenova/whisper-base');

  const accurateProvider = new WhisperProvider({ quality: 'accurate' });
  assert.equal(accurateProvider.resolveModelName(), 'Xenova/whisper-small');
});

test('8. CLI Commands — status, validate & clean', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-cli-quality-'));
  const testConfig = {
    videos: [
      { id: 'python-test', src: 'https://example.com/python.mp4' }
    ]
  };

  fs.writeFileSync(path.join(tmpDir, 'aitutor.config.json'), JSON.stringify(testConfig), 'utf8');

  // Run status on empty project
  const statusBefore = await runStatus({}, tmpDir);
  assert.equal(statusBefore.videosCount, 1);

  // Run validate on empty project
  const valBefore = await runValidate({}, tmpDir);
  assert.equal(valBefore.valid, false);

  // Generate test assets
  const transcriber = new WhisperProvider({ allowTestFallback: true });
  await runGenerate({ transcriber }, tmpDir);

  // Validate should pass after generation
  const valAfter = await runValidate({}, tmpDir);
  assert.equal(valAfter.valid, true);

  // Clean
  await runClean({}, tmpDir);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
