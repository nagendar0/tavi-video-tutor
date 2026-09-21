import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'module';

const rootDir = path.resolve('..', '..');
const pkgDir = path.resolve('.');

console.log('================================================================');
console.log(' NEURAL TTS PACKAGING & CLEAN CONSUMER VERIFICATION ');
console.log('================================================================\n');

// 1. Rebuild package
console.log('[STEP 1: REBUILD PACKAGE]');
execSync('npm run build', { cwd: pkgDir, stdio: 'inherit' });
console.log('✓ Package rebuilt successfully.\n');

// 2. Create fresh tarball
console.log('[STEP 2: CREATE FRESH NPM TARBALL]');
const packOutput = execSync('npm pack', { cwd: pkgDir, encoding: 'utf8' }).trim();
const tarballFileName = packOutput.split('\n').filter(Boolean).pop().trim();
const tarballPath = path.resolve(pkgDir, tarballFileName);
console.log(`✓ Tarball created: ${tarballPath}\n`);

// 3. Create clean consumer outside the package source in os.tmpdir()
console.log('[STEP 3: CREATE CLEAN CONSUMER IN OS.TMPDIR()]');
const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-clean-consumer-'));
console.log(`Consumer Directory: ${consumerDir}`);

const initialPkgJson = {
  name: 'clean-aitutor-consumer',
  version: '1.0.0',
  type: 'module',
  private: true
};
fs.writeFileSync(path.join(consumerDir, 'package.json'), JSON.stringify(initialPkgJson, null, 2), 'utf8');

// 4. Install ONLY the tarball — NO manual install of ws or any other dependency!
console.log('\n[STEP 4: INSTALL ONLY THE TARBALL (NO MANUAL WS INSTALL)]');
console.log(`Running: npm install "${tarballPath}"`);
execSync(`npm install "${tarballPath}"`, { cwd: consumerDir, stdio: 'inherit' });

// 5. Verify consumer dependencies in package.json
console.log('\n[STEP 5: VERIFY CONSUMER DEPENDENCIES DECLARATIONS]');
const installedPkgJson = JSON.parse(fs.readFileSync(path.join(consumerDir, 'package.json'), 'utf8'));
console.log('Consumer package.json dependencies:', JSON.stringify(installedPkgJson.dependencies, null, 2));
const depKeys = Object.keys(installedPkgJson.dependencies || {});
assert.equal(depKeys.length, 1, `Consumer package.json must contain ONLY tavi-video-tutor, found: ${depKeys.join(', ')}`);
assert.equal(depKeys[0], 'tavi-video-tutor', 'The single dependency must be tavi-video-tutor');
console.log('✓ Proof verified: NO undeclared dependency was installed into consumer package.json.\n');

// 6. Verify ws is installed in consumer/node_modules and require.resolve() points there
console.log('[STEP 6: VERIFY REQUIRE.RESOLVE() POINTS INTO CONSUMER/NODE_MODULES]');
const consumerRequire = createRequire(path.join(consumerDir, 'index.js'));
const resolvedWsPath = consumerRequire.resolve('ws');
console.log(`- Resolved ws path: ${resolvedWsPath}`);
assert.ok(
  resolvedWsPath.toLowerCase().startsWith(consumerDir.toLowerCase()),
  `require.resolve('ws') must resolve to consumer/node_modules, but resolved to: ${resolvedWsPath}`
);
assert.ok(
  !resolvedWsPath.toLowerCase().includes(rootDir.toLowerCase()),
  `require.resolve('ws') must NOT resolve into monorepo root: ${resolvedWsPath}`
);
console.log('✓ Proof verified: ws was resolved strictly from consumer/node_modules (transitive dependency).\n');

// 7. Verify package exports resolution
console.log('[STEP 7: VERIFY PACKAGE EXPORTS RESOLUTION]');
const resolvedTtsPath = consumerRequire.resolve('tavi-video-tutor/tts');
console.log(`- Resolved tavi-video-tutor/tts path: ${resolvedTtsPath}`);
assert.ok(
  resolvedTtsPath.toLowerCase().startsWith(consumerDir.toLowerCase()),
  `require.resolve('tavi-video-tutor/tts') must resolve to consumer/node_modules, but resolved to: ${resolvedTtsPath}`
);
console.log('✓ Proof verified: tavi-video-tutor/tts export resolves cleanly.\n');

// 8. Run consumer test script for Neural TTS & Hindi/Telugu synthesis
console.log('[STEP 8: RUN CONSUMER SCRIPT FOR NEURAL IMPORT & REAL SYNTHESIS]');
const testScriptContent = `
import {
  EdgeTTSProvider,
  createTTSProvider,
  isNeuralLanguageSupported,
  isNeuralVoiceSupported,
  resolveNeuralVoice,
  VERIFIED_NEURAL_VOICES,
  TTSError
} from 'tavi-video-tutor/tts';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

console.log('Testing Neural TTS imports from tavi-video-tutor/tts...');

// 1. Verify exports & classes
assert.ok(EdgeTTSProvider, 'EdgeTTSProvider must be exported');
assert.ok(createTTSProvider, 'createTTSProvider must be exported');
assert.ok(isNeuralLanguageSupported, 'isNeuralLanguageSupported must be exported');
assert.ok(resolveNeuralVoice, 'resolveNeuralVoice must be exported');
assert.ok(VERIFIED_NEURAL_VOICES, 'VERIFIED_NEURAL_VOICES must be exported');
assert.ok(TTSError, 'TTSError must be exported');

assert.equal(isNeuralLanguageSupported('hi'), true, 'Hindi must be supported');
assert.equal(isNeuralLanguageSupported('te'), true, 'Telugu must be supported');

// 2. Test createTTSProvider({ provider: 'neural' })
const neuralProvider = createTTSProvider({ provider: 'neural' });
assert.ok(neuralProvider instanceof EdgeTTSProvider, 'Factory must return EdgeTTSProvider instance');
console.log('✓ EdgeTTSProvider imported & instantiated via createTTSProvider({ provider: "neural" }).');

// 3. Real Hindi Neural Synthesis
console.log('\\nSynthesizing Real Hindi Neural Audio...');
const hindiText = 'नमस्ते, यह एक वास्तविक हिंदी तंत्रिका भाषण संश्लेषण परीक्षण है।';
const hindiResult = await neuralProvider.synthesize(hindiText, 'hi', {
  gender: 'female',
  voiceId: 'hi-IN-SwaraNeural'
});

console.log('Hindi synthesis result:', {
  audioPath: hindiResult.audioPath,
  format: hindiResult.format,
  duration: hindiResult.duration,
  voiceId: hindiResult.voiceId
});

assert.ok(hindiResult.audioPath, 'Hindi audio path must exist');
assert.ok(fs.existsSync(hindiResult.audioPath), 'Hindi audio file must exist on disk');
assert.equal(hindiResult.format, 'wav', 'Format must be wav');
assert.equal(hindiResult.voiceId, 'hi-IN-SwaraNeural', 'Voice must be hi-IN-SwaraNeural');
assert.ok(hindiResult.duration > 0.5, 'Hindi duration must be > 0.5s');
const hindiStat = fs.statSync(hindiResult.audioPath);
assert.ok(hindiStat.size > 5000, 'Hindi audio size must be > 5KB');
console.log(\`✓ Real Hindi synthesis PASS: \${hindiResult.duration}s, \${hindiStat.size} bytes.\`);

// 4. Real Telugu Neural Synthesis
console.log('\\nSynthesizing Real Telugu Neural Audio...');
const teluguText = 'నమస్కారం, ఇది నిజమైన తెలుగు న్యూరల్ స్పీచ్ సింథసిస్ పరీక్ష.';
const teluguResult = await neuralProvider.synthesize(teluguText, 'te', {
  gender: 'female',
  voiceId: 'te-IN-ShrutiNeural'
});

console.log('Telugu synthesis result:', {
  audioPath: teluguResult.audioPath,
  format: teluguResult.format,
  duration: teluguResult.duration,
  voiceId: teluguResult.voiceId
});

assert.ok(teluguResult.audioPath, 'Telugu audio path must exist');
assert.ok(fs.existsSync(teluguResult.audioPath), 'Telugu audio file must exist on disk');
assert.equal(teluguResult.format, 'wav', 'Format must be wav');
assert.equal(teluguResult.voiceId, 'te-IN-ShrutiNeural', 'Voice must be te-IN-ShrutiNeural');
assert.ok(teluguResult.duration > 0.5, 'Telugu duration must be > 0.5s');
const teluguStat = fs.statSync(teluguResult.audioPath);
assert.ok(teluguStat.size > 5000, 'Telugu audio size must be > 5KB');
console.log(\`✓ Real Telugu synthesis PASS: \${teluguResult.duration}s, \${teluguStat.size} bytes.\`);

// 5. Test package exports without requiring peer React dependency
console.log('\\nVerifying headless package subpath exports...');
const subPkg = await import('tavi-video-tutor/subtitles');
assert.ok(subPkg.resolveSubtitleSources, 'tavi-video-tutor/subtitles must export resolveSubtitleSources');
assert.ok(subPkg.resolveSubtitleAvailability, 'tavi-video-tutor/subtitles must export resolveSubtitleAvailability');
console.log('✓ tavi-video-tutor/subtitles exported successfully.');

const audioPkg = await import('tavi-video-tutor/audio');
assert.ok(audioPkg.resolveAudioSources, 'tavi-video-tutor/audio must export resolveAudioSources');
assert.ok(audioPkg.resolveAudioAvailability, 'tavi-video-tutor/audio must export resolveAudioAvailability');
console.log('✓ tavi-video-tutor/audio exported successfully.');

const qualityPkg = await import('tavi-video-tutor/quality');
assert.ok(qualityPkg.resolveQualitySources, 'tavi-video-tutor/quality must export resolveQualitySources');
assert.ok(qualityPkg.resolveQualityAvailability, 'tavi-video-tutor/quality must export resolveQualityAvailability');
console.log('✓ tavi-video-tutor/quality exported successfully.');

// Check package.json exports mapping
const pkgJsonPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'node_modules', 'tavi-video-tutor', 'package.json');
const installedPkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

assert.ok(installedPkgJson.exports['.'], 'Root export "." must exist in exports map');
assert.ok(installedPkgJson.exports['./player'], 'Player export "./player" must exist in exports map');
assert.ok(installedPkgJson.exports['./tts'], 'TTS export "./tts" must exist in exports map');
assert.ok(installedPkgJson.exports['./subtitles'], 'Subtitles export "./subtitles" must exist in exports map');
assert.ok(installedPkgJson.exports['./audio'], 'Audio export "./audio" must exist in exports map');
assert.ok(installedPkgJson.exports['./quality'], 'Quality export "./quality" must exist in exports map');
console.log('✓ All package exports map entries verified successfully.');
`;

fs.writeFileSync(path.join(consumerDir, 'run-verification.mjs'), testScriptContent, 'utf8');

execSync('node run-verification.mjs', { cwd: consumerDir, stdio: 'inherit' });

console.log('\n================================================================');
console.log(' ALL CLEAN CONSUMER & NEURAL VERIFICATION TESTS PASSED ');
console.log('================================================================\n');

// Clean up temporary consumer directory and tarball
try {
  fs.rmSync(consumerDir, { recursive: true, force: true });
  fs.unlinkSync(tarballPath);
} catch (e) {
  // ignore
}
