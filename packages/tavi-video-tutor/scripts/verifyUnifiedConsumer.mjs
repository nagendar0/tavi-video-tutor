import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'url';

const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-unified-consumer-'));
console.log('Testing Unified Media Availability in fresh consumer at:', consumerDir);

try {
  fs.writeFileSync(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({ name: 'aitutor-unified-consumer-test', type: 'module' }),
    'utf8'
  );

  const tarballPath = path.resolve('tavi-video-tutor-2.1.1.tgz');
  console.log(`Installing react, react-dom and tarball ${tarballPath}...`);
  execSync(`npm install react@19 react-dom@19 "${tarballPath}"`, { cwd: consumerDir, stdio: 'inherit' });

  const pkgBase = path.join(consumerDir, 'node_modules', 'tavi-video-tutor');

  // Test 1: Main package exports
  console.log('\n--- 1. Testing main exports ---');
  const mainMod = await import(pathToFileURL(path.join(pkgBase, 'dist', 'tavi-video-tutor.js')).href);
  assert.ok(mainMod.resolveSubtitleAvailability, 'Main export must include resolveSubtitleAvailability');
  assert.ok(mainMod.resolveAudioAvailability, 'Main export must include resolveAudioAvailability');
  assert.ok(mainMod.resolveQualityAvailability, 'Main export must include resolveQualityAvailability');
  assert.ok(mainMod.resolveQualitySources, 'Main export must include resolveQualitySources');

  // Test 2: Subpath exports
  console.log('--- 2. Testing subpath exports ---');
  const subMod = await import(pathToFileURL(path.join(pkgBase, 'src', 'subtitles', 'resolver', 'subtitleResolver.js')).href);
  const audioMod = await import(pathToFileURL(path.join(pkgBase, 'src', 'subtitles', 'resolver', 'audioResolver.js')).href);
  const qualMod = await import(pathToFileURL(path.join(pkgBase, 'src', 'subtitles', 'resolver', 'qualityResolver.js')).href);

  // Test 3: Subtitles availability contract
  console.log('--- 3. Testing subtitle availability contract ---');
  const subAvail = subMod.resolveSubtitleAvailability({
    subtitlesConfig: ['en', 'hi', 'te'],
    generatedSubtitles: { en: '/en.vtt', hi: '/hi.vtt' }
  });
  assert.equal(subAvail.enabled, true);
  assert.deepEqual(subAvail.visibleItems, ['en', 'hi']);
  assert.deepEqual(subAvail.missingItems, ['te']);
  assert.ok(!subAvail.visibleItems.includes('te'), 'Missing subtitle language MUST NOT appear');

  // Subtitles false mode
  const subDisabled = subMod.resolveSubtitleAvailability({ subtitlesConfig: false });
  assert.equal(subDisabled.enabled, false);
  assert.deepEqual(subDisabled.visibleItems, []);

  // Test 4: Audio availability contract
  console.log('--- 4. Testing audio availability contract ---');
  const audioAvail = audioMod.resolveAudioAvailability({
    audioLanguagesConfig: ['hi', 'te'],
    sourceLanguage: 'en',
    manifestAudio: { en: { src: '/en.mp3', source: true } }
  });
  assert.equal(audioAvail.enabled, false);
  assert.deepEqual(audioAvail.visibleItems, []);
  assert.deepEqual(audioAvail.missingItems, ['hi', 'te']);
  assert.equal(audioAvail.sourceLanguage, 'en', 'Source language must remain authoritative');

  // Audio false mode
  const audioDisabled = audioMod.resolveAudioAvailability({ audioLanguagesConfig: false });
  assert.equal(audioDisabled.enabled, false);
  assert.deepEqual(audioDisabled.visibleItems, []);

  // Test 5: Quality availability contract
  console.log('--- 5. Testing quality availability contract ---');
  const qualAvail = qualMod.resolveQualityAvailability({
    qualitiesConfig: ['1080p', '720p', '4K'],
    manifestQualities: [
      { label: '1080p', src: '/1080.mp4' },
      { label: '720p', src: '/720.mp4' },
      { label: '480p', src: '/480.mp4' }
    ]
  });
  assert.equal(qualAvail.enabled, true);
  assert.deepEqual(qualAvail.visibleItems, ['1080p', '720p']);
  assert.deepEqual(qualAvail.missingItems, ['4K']);
  assert.ok(!qualAvail.visibleItems.includes('4K'), '4K MUST NOT appear because it is not in manifest');

  // Quality false mode
  const qualDisabled = qualMod.resolveQualityAvailability({ qualitiesConfig: false });
  assert.equal(qualDisabled.enabled, false);
  assert.deepEqual(qualDisabled.visibleItems, []);

  // Test 6: 3-way State Independence
  console.log('--- 6. Testing 3-way media system independence ---');
  const sRes = subMod.resolveSubtitleAvailability({ generatedSubtitles: { te: '/te.vtt' } });
  const aRes = audioMod.resolveAudioAvailability({ sourceLanguage: 'en', manifestAudio: { en: { src: '/en.mp3', source: true }, hi: { src: '/hi.mp3' } } });
  const qRes = qualMod.resolveQualityAvailability({ manifestQualities: [{ label: '720p', src: '/720.mp4' }] });

  assert.deepEqual(sRes.visibleItems, ['te']);
  assert.deepEqual(aRes.visibleItems, ['en', 'hi']);
  assert.deepEqual(qRes.visibleItems, ['720p']);

  console.log('\n✓ ALL UNIFIED CONSUMER VERIFICATION CHECKS PASSED SUCCESSFULLY!');
} finally {
  fs.rmSync(consumerDir, { recursive: true, force: true });
}
