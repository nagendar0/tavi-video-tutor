import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { resolveSubtitleSources, resolveSubtitleAvailability } from '../src/subtitles/resolver/subtitleResolver.js';
import { resolveAudioSources, resolveAudioAvailability } from '../src/subtitles/resolver/audioResolver.js';
import { resolveQualitySources } from '../src/subtitles/resolver/qualityResolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');

test('v2.1.1 Release Blocker 1 — CLI & Whisper Production Dependency', async () => {
  // 1. Check package.json has @huggingface/transformers in peerDependencies or dependencies
  const pkgPath = path.join(packageRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  const hasTransformers = (pkg.dependencies && pkg.dependencies['@huggingface/transformers']) ||
    (pkg.peerDependencies && pkg.peerDependencies['@huggingface/transformers']);
  assert.ok(hasTransformers, 
    '@huggingface/transformers must be configured in package dependencies or peerDependencies');

  // 2. Verify transformersLoader can resolve @huggingface/transformers
  const { getTransformers } = await import('../src/subtitles/transcription/transformersLoader.js');
  const transformers = await getTransformers();
  assert.ok(transformers, 'getTransformers() must successfully resolve transformers module');
  assert.equal(typeof transformers.pipeline, 'function', 'transformers module must expose pipeline() function');
});

test('v2.1.1 Release Blocker 1 — npm audit --omit=dev remains 0 vulnerabilities', () => {
  const auditOutput = execSync('npm audit --omit=dev --json', { cwd: packageRoot, encoding: 'utf8' });
  const auditResult = JSON.parse(auditOutput);
  
  const vulnCount = auditResult.metadata?.vulnerabilities?.total || 0;
  assert.equal(vulnCount, 0, `npm audit --omit=dev must have 0 vulnerabilities, found ${vulnCount}`);
});

test('v2.1.1 Release Blocker 2 — TypeScript Subpath Declarations', () => {
  // Check subtitle subpath d.ts
  const subDtsPath = path.join(packageRoot, 'src/subtitles/resolver/subtitleResolver.d.ts');
  assert.ok(fs.existsSync(subDtsPath), 'src/subtitles/resolver/subtitleResolver.d.ts must exist');
  const subDtsContent = fs.readFileSync(subDtsPath, 'utf8');
  assert.match(subDtsContent, /export function resolveSubtitleSources/);

  // Check audio subpath d.ts
  const audioDtsPath = path.join(packageRoot, 'src/subtitles/resolver/audioResolver.d.ts');
  assert.ok(fs.existsSync(audioDtsPath), 'src/subtitles/resolver/audioResolver.d.ts must exist');
  const audioDtsContent = fs.readFileSync(audioDtsPath, 'utf8');
  assert.match(audioDtsContent, /export function resolveAudioSources/);

  // Check exports in package.json
  const pkg = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(pkg.exports['./subtitles'].types, './src/subtitles/resolver/subtitleResolver.d.ts');
  assert.equal(pkg.exports['./audio'].types, './src/subtitles/resolver/audioResolver.d.ts');

  // Check onAudioLanguageChange in index.d.ts
  const indexDtsPath = path.join(packageRoot, 'src/index.d.ts');
  const indexDtsContent = fs.readFileSync(indexDtsPath, 'utf8');
  assert.match(indexDtsContent, /onAudioLanguageChange\?: \(event: AudioLanguageChangeEvent\) => void;/);
});

test('v2.1.1 Release Blocker 3 — README Package Documentation Completeness', () => {
  const readmePath = path.join(packageRoot, 'README.md');
  assert.ok(fs.existsSync(readmePath), 'README.md must exist');
  const readmeContent = fs.readFileSync(readmePath, 'utf8');

  // Verify all 13 required items are documented
  const requiredDocs = [
    'audioLanguages',
    'audioLanguages={false}',
    'onAudioLanguageChange',
    '--audio-languages',
    'aitutor.config.mjs',
    'manifest.json',
    'tavi-video-tutor/audio',
    'resolveAudioAvailability',
    'Audio + Subtitle Independence',
    'Audio + Video Quality Independence',
    'FFmpeg',
    'tavi-video-tutor/dist/style.css',
    'v2.1.1'
  ];

  for (const docItem of requiredDocs) {
    assert.ok(readmeContent.includes(docItem), `README.md must document '${docItem}'`);
  }
});

test('v2.1.1 Bundle Architecture — Player Bundle Free of Heavy AI Runtime', () => {
  // Ensure dist is built first
  execSync('npm run build', { cwd: packageRoot, stdio: 'ignore' });

  const playerJsPath = path.join(packageRoot, 'dist/player.js');
  assert.ok(fs.existsSync(playerJsPath), 'dist/player.js must exist');
  
  const stats = fs.statSync(playerJsPath);
  assert.ok(stats.size < 500000, `player.js size must be under 500KB (actual: ${stats.size} bytes)`);

  const playerJsContent = fs.readFileSync(playerJsPath, 'utf8');
  assert.ok(!playerJsContent.includes('onnxruntime'), 'player.js must not contain onnxruntime');
  assert.ok(!playerJsContent.includes('WhisperForConditionalGeneration'), 'player.js must not contain Whisper models');
});

test('v2.1.1 Audio Feature & Matrix Switching Regression Test', () => {
  // Test Audio Availability
  const audioAvail = resolveAudioAvailability({
    audioLanguagesConfig: ['en', 'hi', 'te'],
    manifestAudio: {
      en: { label: 'English', src: '/en.mp3', language: 'en' },
      hi: { label: 'Hindi', src: '/hi.mp3', language: 'hi' },
      te: { label: 'Telugu', src: '/te.mp3', language: 'te' }
    },
    selectedLanguage: 'hi'
  });

  assert.equal(audioAvail.enabled, true);
  assert.equal(audioAvail.selectedLanguage, 'hi');
  assert.deepEqual(audioAvail.availableLanguages, ['en', 'hi', 'te']);

  // Test Subtitle Availability concurrently (Independence)
  const subAvail = resolveSubtitleAvailability({
    subtitlesConfig: ['en', 'es'],
    generatedSubtitles: { en: '/en.vtt', es: '/es.vtt' }
  });

  assert.equal(subAvail.enabled, true);
  assert.equal(subAvail.hasAvailableSubtitles, true);

  // Test Quality Resolver concurrently (Independence)
  const qualityAvail = resolveQualitySources({
    manifestQualities: [
      { label: '720p', src: '/720.mp4', index: 0 },
      { label: '480p', src: '/480.mp4', index: 1 }
    ]
  });

  assert.equal(qualityAvail.qualities.length, 2);

  // 100 Audio Switches stability
  let currentLang = 'en';
  const langs = ['en', 'hi', 'te'];
  for (let i = 0; i < 100; i++) {
    currentLang = langs[i % langs.length];
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['en', 'hi', 'te'],
      manifestAudio: {
        en: { label: 'English', src: '/en.mp3', language: 'en' },
        hi: { label: 'Hindi', src: '/hi.mp3', language: 'hi' },
        te: { label: 'Telugu', src: '/te.mp3', language: 'te' }
      },
      selectedLanguage: currentLang
    });
    assert.equal(res.selectedLanguage, currentLang);
  }
});
