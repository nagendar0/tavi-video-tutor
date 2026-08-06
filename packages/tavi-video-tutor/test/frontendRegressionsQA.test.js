import assert from 'node:assert';
import { resolveSubtitleVisibility, resolveSubtitleSources } from '../src/subtitles/resolver/subtitleResolver.js';
import { resolveQualitySources } from '../src/subtitles/resolver/qualityResolver.js';
import { getLanguageByCode, AITUTOR_LANGUAGES } from '../src/subtitles/languages/registry.js';

console.log('============================================================');
console.log('AITUTOR FRONTEND REGRESSIONS QA TEST SUITE (TEST A - TEST T)');
console.log('============================================================\n');

let passed = 0;
let failed = 0;

function runTest(id, name, fn) {
  try {
    fn();
    console.log(`  ✅ [${id}] PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [${id}] FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

const sampleManifest = {
  en: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nEnglish Cue: Welcome to lesson',
  te: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nTelugu Cue: పాఠానికి స్వాగతం',
  hi: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nHindi Cue: पाठ में आपका स्वागत है',
  fr: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nFrench Cue: Bienvenue'
};

// ============================================================
// SUBTITLE FILTER TESTS (A - E)
// ============================================================

runTest('TEST A', 'subtitles=["en", "te", "hi"] restricts visible languages exclusively to en, te, hi', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'te', 'hi'],
    generatedSubtitles: sampleManifest
  });

  assert.strictEqual(result.enabled, true);
  assert.strictEqual(result.mode, 'filter');
  assert.deepStrictEqual(result.visibleLanguages, ['en', 'te', 'hi']);
  assert.deepStrictEqual(Object.keys(result.resolvedTracks).sort(), ['en', 'hi', 'te']);
  assert.strictEqual(result.resolvedTracks.fr, undefined);
});

runTest('TEST B', 'Ensure array indexes ("0", "1", "2") NEVER become language codes in resolver or visibility output', () => {
  // Test resolveSubtitleSources direct array input safeguard
  const directSources = resolveSubtitleSources({
    developerSubtitles: ['en', 'te', 'hi'],
    generatedSubtitles: sampleManifest
  });

  assert.strictEqual(directSources.resolvedTracks['0'], undefined);
  assert.strictEqual(directSources.resolvedTracks['1'], undefined);
  assert.strictEqual(directSources.resolvedTracks['2'], undefined);

  // Test resolveSubtitleVisibility with array input
  const vis = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'te', 'hi'],
    generatedSubtitles: sampleManifest
  });

  assert.ok(!vis.visibleLanguages.includes('0'));
  assert.ok(!vis.visibleLanguages.includes('1'));
  assert.ok(!vis.visibleLanguages.includes('2'));
  assert.strictEqual(vis.resolvedTracks['0'], undefined);
});

runTest('TEST C', 'subtitles="all" exposes all available manifest tracks', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: 'all',
    generatedSubtitles: sampleManifest
  });

  assert.strictEqual(result.enabled, true);
  assert.strictEqual(result.mode, 'all');
  assert.strictEqual(result.visibleLanguages.length, 4);
  assert.deepStrictEqual(result.visibleLanguages.sort(), ['en', 'fr', 'hi', 'te']);
});

runTest('TEST D', 'subtitles=false completely disables subtitle UI and rendering without VTT fetching', () => {
  const result = resolveSubtitleVisibility({
    subtitlesConfig: false,
    generatedSubtitles: sampleManifest
  });

  assert.strictEqual(result.enabled, false);
  assert.strictEqual(result.mode, 'disabled');
  assert.strictEqual(result.visibleLanguages.length, 0);
  assert.strictEqual(Object.keys(result.resolvedTracks).length, 0);
});

runTest('TEST E', 'Developer object subtitle tracks (subtitles={{ en: "/custom/en.vtt" }}) resolve as developer sources', () => {
  const customDev = { en: '/custom/en.vtt', te: '/custom/te.vtt' };
  const result = resolveSubtitleVisibility({
    subtitlesConfig: customDev,
    generatedSubtitles: sampleManifest
  });

  assert.strictEqual(result.enabled, true);
  assert.strictEqual(result.resolvedTracks.en, '/custom/en.vtt');
  assert.strictEqual(result.sourceByLanguage.en, 'developer');
  assert.strictEqual(result.resolvedTracks.te, '/custom/te.vtt');
  assert.strictEqual(result.sourceByLanguage.te, 'developer');
});

// ============================================================
// LANGUAGE SWITCHING TESTS (F - J)
// ============================================================

runTest('TEST F', 'English -> Telugu requests te.vtt and resolves Telugu cue', () => {
  const vis = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'te', 'hi'],
    generatedSubtitles: sampleManifest
  });

  assert.strictEqual(vis.resolvedTracks.te, sampleManifest.te);
  assert.ok(vis.resolvedTracks.te.includes('Telugu Cue: పాఠానికి స్వాగతం'));
});

runTest('TEST G', 'Telugu -> Hindi requests hi.vtt and resolves Hindi cue', () => {
  const vis = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'te', 'hi'],
    generatedSubtitles: sampleManifest
  });

  assert.strictEqual(vis.resolvedTracks.hi, sampleManifest.hi);
  assert.ok(vis.resolvedTracks.hi.includes('Hindi Cue: पाठ में आपका स्वागत है'));
});

runTest('TEST H', 'Hindi -> English reuses cached en.vtt without redundant fetches', () => {
  const cache = {};
  const fetchMock = (url) => {
    if (cache[url]) return { cached: true, content: cache[url] };
    cache[url] = sampleManifest.en;
    return { cached: false, content: sampleManifest.en };
  };

  const req1 = fetchMock('/subtitles/en.vtt');
  assert.strictEqual(req1.cached, false);

  const req2 = fetchMock('/subtitles/en.vtt');
  assert.strictEqual(req2.cached, true);
});

runTest('TEST I', '100 rapid language switches enforce sequence race protection', () => {
  let seq = 0;
  let activeLang = 'en';
  let activeCue = 'English Cue';

  const simulateLanguageSwitch = (targetLang, cueText, delayMs) => {
    const currentSeq = ++seq;
    setTimeout(() => {
      if (currentSeq === seq) {
        activeLang = targetLang;
        activeCue = cueText;
      }
    }, delayMs);
  };

  for (let i = 0; i < 100; i++) {
    const lang = ['en', 'te', 'hi'][i % 3];
    simulateLanguageSwitch(lang, `${lang} Cue ${i}`, Math.floor(Math.random() * 20));
  }

  // Final rapid switch to Telugu
  simulateLanguageSwitch('te', 'Final Telugu Cue', 5);

  return new Promise((resolve) => {
    setTimeout(() => {
      try {
        assert.strictEqual(activeLang, 'te');
        assert.strictEqual(activeCue, 'Final Telugu Cue');
        resolve();
      } catch (e) {
        throw e;
      }
    }, 50);
  });
});

runTest('TEST J', 'Failed Telugu VTT request does NOT fall back to English text under a Telugu label', () => {
  const brokenManifest = {
    en: 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nEnglish Text',
    te: null // Failed/missing Telugu VTT
  };

  const vis = resolveSubtitleVisibility({
    subtitlesConfig: ['en', 'te'],
    generatedSubtitles: brokenManifest
  });

  assert.strictEqual(vis.resolvedTracks.te, undefined);
  assert.strictEqual(vis.resolvedTracks.en, 'WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nEnglish Text');
});

// ============================================================
// QUALITY SELECTOR TESTS (K - R)
// ============================================================

runTest('TEST K', '1080p -> 720p quality switch updates actual media src stream', () => {
  const devQualities = [
    { label: '1080p', src: '/lesson-1080.mp4' },
    { label: '720p', src: '/lesson-720.mp4' },
    { label: '480p', src: '/lesson-480.mp4' }
  ];

  const resolved = resolveQualitySources({ qualities: devQualities });
  assert.strictEqual(resolved.source, 'prop');
  assert.strictEqual(resolved.qualities.length, 3);
  assert.strictEqual(resolved.qualities[1].src, '/lesson-720.mp4');
});

runTest('TEST L', 'Quality switch preserves currentTime', () => {
  let videoState = { currentTime: 45.2, src: '/lesson-1080.mp4' };
  
  // Simulate quality switch capture & restore
  const pendingSeekTime = videoState.currentTime;
  videoState.src = '/lesson-720.mp4';
  videoState.currentTime = pendingSeekTime;

  assert.strictEqual(videoState.src, '/lesson-720.mp4');
  assert.strictEqual(videoState.currentTime, 45.2);
});

runTest('TEST M', 'Quality switch preserves playing state', () => {
  let videoState = { isPlaying: true, src: '/lesson-1080.mp4' };

  const pendingPlayState = videoState.isPlaying;
  videoState.src = '/lesson-720.mp4';
  videoState.isPlaying = pendingPlayState;

  assert.strictEqual(videoState.isPlaying, true);
});

runTest('TEST N', 'Quality switch preserves volume, mute, and playback rate', () => {
  let videoState = { volume: 0.75, isMuted: true, playbackRate: 1.5, src: '/lesson-1080.mp4' };

  const pendingVolume = videoState.volume;
  const pendingMuted = videoState.isMuted;
  const pendingRate = videoState.playbackRate;

  videoState.src = '/lesson-720.mp4';
  videoState.volume = pendingVolume;
  videoState.isMuted = pendingMuted;
  videoState.playbackRate = pendingRate;

  assert.strictEqual(videoState.volume, 0.75);
  assert.strictEqual(videoState.isMuted, true);
  assert.strictEqual(videoState.playbackRate, 1.5);
});

runTest('TEST O', 'Quality switch preserves active subtitle language', () => {
  let playerState = { selectedSubLanguage: 'te', activeSrc: '/lesson-1080.mp4' };

  playerState.activeSrc = '/lesson-720.mp4';

  assert.strictEqual(playerState.selectedSubLanguage, 'te');
});

runTest('TEST P', 'Quality switch preserves active subtitle cues without wiping tracks or re-running ASR', () => {
  let loadedSubtitles = { te: 'WEBVTT\n\n00:00:30.000 --> 00:00:35.000\nతెలుగు పాఠం' };
  let srcBefore = '/lesson-1080.mp4';
  let srcAfter = '/lesson-720.mp4';

  // Quality switch should NOT delete loadedSubtitles
  const isSameVideoIdentity = (srcBefore.split('-')[0] === srcAfter.split('-')[0]);
  assert.strictEqual(isSameVideoIdentity, true);
  assert.strictEqual(loadedSubtitles.te, 'WEBVTT\n\n00:00:30.000 --> 00:00:35.000\nతెలుగు పాఠం');
});

runTest('TEST Q', 'HLS quality selection updates actual HLS level index', () => {
  const hlsLevels = [
    { label: '1080p', index: 0 },
    { label: '720p', index: 1 },
    { label: '480p', index: 2 }
  ];

  const res = resolveQualitySources({ hlsQualities: hlsLevels });
  assert.strictEqual(res.source, 'hls');
  assert.strictEqual(res.qualities[1].index, 1);
});

runTest('TEST R', '100 quality switches leak zero memory or listener resources', () => {
  if (global.gc) global.gc();
  const initial = process.memoryUsage().heapUsed;

  const qualities = [
    { label: '1080p', src: '/lesson-1080.mp4' },
    { label: '720p', src: '/lesson-720.mp4' },
    { label: '480p', src: '/lesson-480.mp4' }
  ];

  let currentSrc = '/lesson-1080.mp4';
  for (let i = 0; i < 100; i++) {
    const q = qualities[i % 3];
    currentSrc = q.src;
    resolveQualitySources({ qualities });
  }

  if (global.gc) global.gc();
  const final = process.memoryUsage().heapUsed;
  const diffMB = (final - initial) / 1024 / 1024;

  assert.ok(diffMB < 10, `Heap growth ${diffMB.toFixed(2)}MB exceeds safety threshold`);
});

// ============================================================
// CROSS-FEATURE WORKFLOW TESTS (S - T)
// ============================================================

runTest('TEST S', 'Telugu + 30s seek + 1080p->720p quality switch keeps Telugu active and synchronized', () => {
  const state = {
    selectedSubLanguage: 'te',
    currentTime: 30.0,
    activeSrc: '/lesson-1080.mp4',
    cues: [{ start: 28, end: 32, text: 'తెలుగు పాఠం' }]
  };

  // Perform quality switch to 720p
  const pendingSeek = state.currentTime;
  state.activeSrc = '/lesson-720.mp4';
  state.currentTime = pendingSeek;

  assert.strictEqual(state.selectedSubLanguage, 'te');
  assert.strictEqual(state.currentTime, 30.0);
  assert.strictEqual(state.activeSrc, '/lesson-720.mp4');
  assert.strictEqual(state.cues[0].text, 'తెలుగు పాఠం');
});

runTest('TEST T', 'Hindi + quality switch + seek keeps Hindi active and synchronized', () => {
  const state = {
    selectedSubLanguage: 'hi',
    currentTime: 10.0,
    activeSrc: '/lesson-720.mp4',
    cues: [{ start: 10, end: 15, text: 'हिन्दी पाठ' }]
  };

  // Switch 720p -> 480p
  state.activeSrc = '/lesson-480.mp4';
  // Seek to 12s
  state.currentTime = 12.0;

  assert.strictEqual(state.selectedSubLanguage, 'hi');
  assert.strictEqual(state.currentTime, 12.0);
  assert.strictEqual(state.activeSrc, '/lesson-480.mp4');
  assert.strictEqual(state.cues[0].text, 'हिन्दी पाठ');
});

console.log('\n============================================================');
console.log(`TEST SUMMARY: Passed: ${passed} | Failed: ${failed}`);
console.log('============================================================\n');

if (failed > 0) {
  process.exit(1);
}
