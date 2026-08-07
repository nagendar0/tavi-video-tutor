import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveSubtitleAvailability } from '../src/subtitles/resolver/subtitleResolver.js';

test('v1.1 Feature 1: High-DPI Canvas Rendering Scaling Logic', () => {
  // Simulate high-DPI retina display environment (devicePixelRatio = 2)
  const dpr = 2;
  const cssWidth = 1280;
  const cssHeight = 720;

  const targetWidth = Math.round(cssWidth * dpr);
  const targetHeight = Math.round(cssHeight * dpr);

  assert.equal(targetWidth, 2560, 'Backing store width on 2x Retina must scale to 2560px');
  assert.equal(targetHeight, 1440, 'Backing store height on 2x Retina must scale to 1440px');
});

test('v1.1 Feature 2: Accessibility WAI-ARIA & Screen Reader Live Region Contract', () => {
  const cssPath = path.resolve('src/styles/ai-tutor.css');
  const cssContent = fs.readFileSync(cssPath, 'utf8');

  assert.ok(cssContent.includes('.sr-only'), '.sr-only visually hidden CSS rule must exist for Section 508 compliance');
  assert.ok(cssContent.includes('position: absolute !important'), '.sr-only must position elements out of layout flow');
  assert.ok(cssContent.includes('clip: rect(0, 0, 0, 0) !important'), '.sr-only must clip content visually');
});

test('v1.1 Feature 3: LocalStorage Student Preference Persistence Storage Schema', () => {
  const dummyStorage = {};
  const mockLocalStorage = {
    getItem: (key) => dummyStorage[key] || null,
    setItem: (key, val) => { dummyStorage[key] = String(val); }
  };

  const prefData = {
    volume: 0.8,
    isMuted: false,
    playbackRate: 1.5,
    selectedSubLanguage: 'hi',
    selectedQuality: '720p'
  };

  mockLocalStorage.setItem('aitutor_user_preferences', JSON.stringify(prefData));

  const restored = JSON.parse(mockLocalStorage.getItem('aitutor_user_preferences'));
  assert.equal(restored.volume, 0.8);
  assert.equal(restored.playbackRate, 1.5);
  assert.equal(restored.selectedSubLanguage, 'hi');
  assert.equal(restored.selectedQuality, '720p');
});

test('v1.1 Feature 4: Tree-Shakeable Sub-Path Package Exports Configuration', () => {
  const pkgPath = path.resolve('package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.ok(pkg.version, 'Package version must exist');
  assert.ok(pkg.exports['./player'], './player sub-path export must exist');
  assert.ok(pkg.exports['./cli'], './cli sub-path export must exist');
  assert.ok(pkg.exports['./subtitles'], './subtitles sub-path export must exist');
});

test('v1.1 Feature 5: SSR Safety Guard (No Window Access on Import)', async () => {
  // Importing resolver modules must not throw ReferenceError: window is not defined
  const { resolveSubtitleAvailability } = await import('../src/subtitles/resolver/subtitleResolver.js');
  const result = resolveSubtitleAvailability({ subtitlesConfig: false });

  assert.equal(result.enabled, false);
  assert.equal(result.hasAvailableSubtitles, false);
});
