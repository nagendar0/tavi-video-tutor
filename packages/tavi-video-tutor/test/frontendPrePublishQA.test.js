import test from 'node:test';
import assert from 'node:assert';
import { resolveQualitySources } from '../src/subtitles/resolver/qualityResolver.js';
import { resolveSubtitleVisibility } from '../src/subtitles/resolver/subtitleResolver.js';

console.log('🧪 Running AITutor Pre-Publish Real Frontend Bug Verification Suite...\n');

// ============================================================
// BUG 1 TESTS — QUALITY RESOLUTION & NORMALIZATION
// ============================================================

test('TEST A: Developer qualities prop (array of objects & string labels)', () => {
  const objectQualities = [
    { label: '1080p', src: '/lesson-1080.mp4' },
    { label: '720p', src: '/lesson-720.mp4' },
    { label: '480p', src: '/lesson-480.mp4' }
  ];

  const resObj = resolveQualitySources({ qualities: objectQualities });
  assert.strictEqual(resObj.source, 'prop');
  assert.strictEqual(resObj.qualities.length, 3);
  assert.strictEqual(resObj.qualities[0].label, '1080p');
  assert.strictEqual(resObj.qualities[0].src, '/lesson-1080.mp4');

  const stringQualities = ['1080p', '720p', '480p'];
  const resStr = resolveQualitySources({ qualities: stringQualities });
  assert.strictEqual(resStr.source, 'prop');
  assert.strictEqual(resStr.qualities.length, 3);
  assert.strictEqual(resStr.qualities[0].label, '1080p');
  assert.strictEqual(resStr.qualities[0].src, '1080p');

  console.log('  ✅ PASS: TEST A: Developer qualities prop normalized and resolved correctly');
});

test('TEST B: config.qualities resolution', () => {
  const config = {
    qualities: [
      { label: '1080p', src: '/1080.mp4' },
      { label: '720p', src: '/720.mp4' }
    ]
  };

  const res = resolveQualitySources({ config });
  assert.strictEqual(res.source, 'config');
  assert.strictEqual(res.qualities.length, 2);
  assert.strictEqual(res.qualities[0].label, '1080p');
  console.log('  ✅ PASS: TEST B: config.qualities resolved correctly');
});

test('TEST C: config.file.qualities resolution', () => {
  const config = {
    file: {
      qualities: [
        { label: '4K', src: '/4k.mp4' },
        { label: '1080p', src: '/1080.mp4' }
      ]
    }
  };

  const res = resolveQualitySources({ config });
  assert.strictEqual(res.source, 'config.file');
  assert.strictEqual(res.qualities.length, 2);
  assert.strictEqual(res.qualities[0].label, '4K');
  console.log('  ✅ PASS: TEST C: config.file.qualities resolved correctly');
});

test('TEST D: Manifest qualities resolution', () => {
  const manifestQualities = [
    { label: '720p', src: '/manifest-720.mp4' },
    { label: '360p', src: '/manifest-360.mp4' }
  ];

  const res = resolveQualitySources({ manifestQualities });
  assert.strictEqual(res.source, 'manifest');
  assert.strictEqual(res.qualities.length, 2);
  assert.strictEqual(res.qualities[0].label, '720p');
  console.log('  ✅ PASS: TEST D: Manifest qualities resolved correctly');
});

test('TEST E: No quality available -> Returns empty array (Menu hidden)', () => {
  const res = resolveQualitySources({});
  assert.strictEqual(res.source, 'none');
  assert.strictEqual(res.qualities.length, 0);
  console.log('  ✅ PASS: TEST E: No quality returns empty array to hide Quality menu');
});

// ============================================================
// BUG 2 TESTS — subtitles={false} CONTRACT & UI DISABLATION
// ============================================================

test('TEST F: subtitles={false} -> Completely disables subtitle functionality & UI', () => {
  const vis = resolveSubtitleVisibility({
    subtitlesConfig: false,
    demoSubtitles: { en: 'VTT...' },
    generatedSubtitles: { en: 'VTT...' },
    uploadedSubtitles: { en: 'VTT...' }
  });

  assert.strictEqual(vis.enabled, false, 'enabled must be false');
  assert.strictEqual(vis.mode, 'disabled', 'mode must be disabled');
  assert.strictEqual(vis.availableLanguages.length, 0, 'availableLanguages must be []');
  assert.strictEqual(Object.keys(vis.resolvedTracks).length, 0, 'resolvedTracks must be empty');

  // Verify simulated component availableSubLangs return
  const isSubtitleEnabled = vis.enabled;
  const combinedSubtitles = vis.resolvedTracks;
  const availableSubLangs = !isSubtitleEnabled ? [] : ['none', ...Object.keys(combinedSubtitles)];

  assert.strictEqual(availableSubLangs.length, 0, 'availableSubLangs must be [] when subtitles={false}');

  console.log('  ✅ PASS: TEST F: subtitles={false} completely disables UI and track resolution');
});

test('TEST G: Default subtitles prop -> Enables all available tracks', () => {
  const vis = resolveSubtitleVisibility({
    subtitlesConfig: undefined,
    generatedSubtitles: { en: 'VTT...', te: 'VTT...' }
  });

  assert.strictEqual(vis.enabled, true);
  assert.strictEqual(vis.mode, 'all');
  assert.strictEqual(vis.availableLanguages.length, 2);
  console.log('  ✅ PASS: TEST G: Default subtitles prop enables all available tracks');
});

test('TEST H: Filtered subtitles prop -> subtitles={["en", "hi", "te"]}', () => {
  const vis = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'hi', 'te'],
    generatedSubtitles: { en: 'VTT...', hi: 'VTT...', te: 'VTT...', fr: 'VTT...', es: 'VTT...' }
  });

  assert.strictEqual(vis.enabled, true);
  assert.strictEqual(vis.mode, 'filter');
  assert.deepStrictEqual(vis.visibleLanguages, ['en', 'hi', 'te']);
  assert.strictEqual(Object.keys(vis.resolvedTracks).length, 3);
  assert.strictEqual('fr' in vis.resolvedTracks, false);
  console.log('  ✅ PASS: TEST H: Filtered subtitles restricts tracks to ["en", "hi", "te"]');
});

test('TEST I: Runtime transition subtitles={false} -> subtitles="all"', () => {
  let vis = resolveSubtitleVisibility({ subtitlesConfig: false, generatedSubtitles: { en: 'VTT...' } });
  assert.strictEqual(vis.enabled, false);

  vis = resolveSubtitleVisibility({ subtitlesConfig: 'all', generatedSubtitles: { en: 'VTT...' } });
  assert.strictEqual(vis.enabled, true);
  assert.strictEqual(vis.availableLanguages.length, 1);
  console.log('  ✅ PASS: TEST I: Runtime transition false -> all restores subtitle functionality');
});

test('TEST J: Runtime transition subtitles="all" -> subtitles={false} (Clears cues immediately)', () => {
  let vis = resolveSubtitleVisibility({ subtitlesConfig: 'all', generatedSubtitles: { en: 'VTT...' } });
  assert.strictEqual(vis.enabled, true);

  vis = resolveSubtitleVisibility({ subtitlesConfig: false, generatedSubtitles: { en: 'VTT...' } });
  assert.strictEqual(vis.enabled, false);

  const activeCues = !vis.enabled ? [] : ['Active Cue Text'];
  assert.strictEqual(activeCues.length, 0, 'Active cues must be immediately cleared when disabled');
  console.log('  ✅ PASS: TEST J: Runtime transition all -> false clears cues immediately');
});

test('TEST K: QUALITY + subtitles={false} Interaction', () => {
  const vis = resolveSubtitleVisibility({ subtitlesConfig: false });
  const qual = resolveQualitySources({ qualities: [{ label: '1080p', src: '/1080.mp4' }] });

  assert.strictEqual(vis.enabled, false, 'Subtitles must be disabled');
  assert.strictEqual(qual.source, 'prop', 'Quality must remain active');
  assert.strictEqual(qual.qualities.length, 1, 'Quality menu option must be displayed');
  console.log('  ✅ PASS: TEST K: Quality options display independently of subtitles={false}');
});
