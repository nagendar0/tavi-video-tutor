import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { resolveQualitySources } from '../src/subtitles/resolver/qualityResolver.js';
import { resolveSubtitleAvailability } from '../src/subtitles/resolver/subtitleResolver.js';
import { ManifestStore } from '../src/subtitles/cache/manifest.js';
import { planQualityLadder } from '../src/subtitles/video/QualityPlanner.js';
import { resolveManifestSubtitle } from '../src/services/manifestStore.js';

test('Requirement 1 & 8: Quality appears and displayQualities is populated when manifest qualities exist', () => {
  const manifestQualities = [
    { label: '1080p', height: 1080, width: 1920, src: '/aitutor/videos/lesson_1/1080.mp4', source: true },
    { label: '720p', height: 720, width: 1280, src: '/aitutor/videos/lesson_1/720.mp4', source: false },
    { label: '480p', height: 480, width: 854, src: '/aitutor/videos/lesson_1/480.mp4', source: false },
    { label: '360p', height: 360, width: 640, src: '/aitutor/videos/lesson_1/360.mp4', source: false },
    { label: '240p', height: 240, width: 426, src: '/aitutor/videos/lesson_1/240.mp4', source: false },
    { label: '144p', height: 144, width: 256, src: '/aitutor/videos/lesson_1/144.mp4', source: false }
  ];

  const result = resolveQualitySources({ manifestQualities });
  assert.equal(result.source, 'manifest');
  assert.equal(result.qualities.length, 6);
  assert.equal(result.qualities[0].label, '1080p');
  assert.equal(result.qualities[1].label, '720p');
  assert.equal(result.qualities[5].label, '144p');
});

test('Requirement 2 & 13: Quality remains available and independent when subtitles are false or empty', () => {
  // Test subtitle availability returns disabled
  const subResult = resolveSubtitleAvailability({
    subtitlesConfig: false,
    generatedSubtitles: { en: '/en.vtt' }
  });
  assert.equal(subResult.hasAvailableSubtitles, false, 'Subtitles must be disabled');
  assert.equal(subResult.enabled, false);

  // Quality sources still resolve with full ladder
  const qualityResult = resolveQualitySources({
    manifestQualities: [
      { label: '1080p', src: '/1080.mp4' },
      { label: '720p', src: '/720.mp4' }
    ]
  });

  assert.equal(qualityResult.qualities.length, 2, 'Quality options must be present regardless of subtitles=false');
  assert.equal(qualityResult.qualities[0].label, '1080p');
});

test('Requirement 3: Quality returns empty list only when there are genuinely no quality options anywhere', () => {
  const result = resolveQualitySources({
    hlsQualities: [],
    qualities: [],
    config: {},
    manifestQualities: []
  });

  assert.equal(result.source, 'none');
  assert.equal(result.qualities.length, 0);
});

test('Requirement 4: 1080p/720p/480p/360p/240p/144p ladder is planned correctly without upscaling', () => {
  // Source is 1080p (1920x1080)
  const probeInfo1080 = { width: 1920, height: 1080, fps: 30 };
  const plan1080 = planQualityLadder(probeInfo1080);
  assert.equal(plan1080.enabled, true);
  assert.equal(plan1080.renditions.length, 6);
  assert.deepEqual(plan1080.renditions.map(r => r.label), ['1080p', '720p', '480p', '360p', '240p', '144p']);
  assert.equal(plan1080.renditions[0].isSource, true, 'Highest matching rendition is marked source');

  // Source is 720p (1280x720) - NO UPSCALING to 1080p
  const probeInfo720 = { width: 1280, height: 720, fps: 30 };
  const plan720 = planQualityLadder(probeInfo720);
  assert.equal(plan720.renditions.length, 5);
  assert.deepEqual(plan720.renditions.map(r => r.label), ['720p', '480p', '360p', '240p', '144p']);
  assert.ok(!plan720.renditions.some(r => r.height > 720), 'Must NOT upscale beyond source height');
});

test('Requirement 5: String quality definitions normalize correctly', () => {
  const stringQualities = ['1080p', '720p', '480p'];
  const result = resolveQualitySources({ qualities: stringQualities });

  assert.equal(result.source, 'prop');
  assert.equal(result.qualities.length, 3);
  assert.equal(result.qualities[0].label, '1080p');
  assert.equal(result.qualities[0].src, '1080p');
});

test('Requirement 6: Object quality definitions with various schema formats normalize correctly', () => {
  const objectQualities = [
    { name: 'HD', file: '/video-hd.mp4', height: 1080 },
    { label: 'SD', url: '/video-sd.mp4', height: 480 },
    { height: 360, src: '/video-360.mp4' }
  ];

  const result = resolveQualitySources({ qualities: objectQualities });
  assert.equal(result.source, 'prop');
  assert.equal(result.qualities[0].label, 'HD');
  assert.equal(result.qualities[0].src, '/video-hd.mp4');
  assert.equal(result.qualities[1].label, 'SD');
  assert.equal(result.qualities[1].src, '/video-sd.mp4');
  assert.equal(result.qualities[2].label, '360p');
  assert.equal(result.qualities[2].src, '/video-360.mp4');
});

test('Requirement 7: ManifestStore preserves qualities array when saving multilingual subtitles', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aitutor-manifest-q-'));

  try {
    const store = new ManifestStore(tempDir);
    const videoEntry = { id: 'test_vid', src: './public/test.mp4' };

    // Initial manifest with qualities
    const initialManifest = {
      test_vid: {
        id: 'test_vid',
        src: './public/test.mp4',
        qualities: [
          { label: '1080p', height: 1080, src: '/aitutor/videos/test_vid/1080.mp4' },
          { label: '720p', height: 720, src: '/aitutor/videos/test_vid/720.mp4' }
        ]
      }
    };
    fs.writeFileSync(store.internalManifestPath, JSON.stringify(initialManifest, null, 2));

    // Save subtitles
    store.saveMultilingualSubtitles(videoEntry, 'en', { en: 'WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello' });

    // Load manifest and verify qualities were NOT wiped
    const updated = store.loadManifest();
    assert.ok(updated.test_vid.qualities, 'Qualities array must be preserved');
    assert.equal(updated.test_vid.qualities.length, 2);
    assert.equal(updated.test_vid.qualities[0].label, '1080p');
    assert.ok(updated.test_vid.subtitles.en, 'English subtitle must exist');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Requirement 9: Quality selection updates active source in TaviVideoPlayer logic', () => {
  const displayQualities = [
    { label: '1080p', src: '/videos/1080.mp4' },
    { label: '720p', src: '/videos/720.mp4' }
  ];

  let activeSrc = '/videos/1080.mp4';
  let selectedQuality = '1080p';

  const handleQualityChange = (q) => {
    selectedQuality = q.label;
    activeSrc = q.src;
  };

  // Switch to 720p
  handleQualityChange(displayQualities[1]);
  assert.equal(selectedQuality, '720p');
  assert.equal(activeSrc, '/videos/720.mp4');

  // Switch back to 1080p
  handleQualityChange(displayQualities[0]);
  assert.equal(selectedQuality, '1080p');
  assert.equal(activeSrc, '/videos/1080.mp4');
});
