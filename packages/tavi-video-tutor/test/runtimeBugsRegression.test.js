import assert from 'node:assert';
import test from 'node:test';
import { resolveQualityAvailability, resolveQualitySources } from '../src/subtitles/resolver/qualityResolver.js';
import { resolveSubtitleAvailability, resolveSubtitleSources } from '../src/subtitles/resolver/subtitleResolver.js';
import { resolveAudioAvailability, resolveAudioSources } from '../src/subtitles/resolver/audioResolver.js';
import { parseWebVTTWorker as parseWebVTT, findActiveCueBinary as findActiveCue } from '../src/v2/workers/subtitleWorker.js';

test('BUG 1 REGRESSION: Quality Default & Whitelist Resolution', async (t) => {
  const manifestQualities = [
    { label: '1080p', src: '/lesson_1080.mp4', height: 1080 },
    { label: '720p', src: '/lesson_720.mp4', height: 720 },
    { label: '480p', src: '/lesson_480.mp4', height: 480 }
  ];

  await t.test('1.1 Omitted qualities prop defaults to all manifest qualities', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: undefined,
      manifestQualities
    });

    assert.strictEqual(res.enabled, true);
    assert.strictEqual(res.mode, 'all');
    assert.strictEqual(res.visibleQualities.length, 3);
    assert.deepStrictEqual(res.visibleQualities, ['1080p', '720p', '480p']);
    assert.strictEqual(res.hasAvailableQualities, true);
  });

  await t.test('1.2 qualities="all" behaves identically to omitted prop', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: 'all',
      manifestQualities
    });

    assert.strictEqual(res.enabled, true);
    assert.strictEqual(res.mode, 'all');
    assert.strictEqual(res.visibleQualities.length, 3);
    assert.deepStrictEqual(res.visibleQualities, ['1080p', '720p', '480p']);
  });

  await t.test('1.3 qualities={false} explicitly disables the quality UI', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: false,
      manifestQualities
    });

    assert.strictEqual(res.enabled, false);
    assert.strictEqual(res.mode, 'disabled');
    assert.strictEqual(res.visibleQualities.length, 0);
  });

  await t.test('1.4 qualities={["720p", "480p"]} filters qualities correctly', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['720p', '480p'],
      manifestQualities
    });

    assert.strictEqual(res.enabled, true);
    assert.strictEqual(res.mode, 'filter');
    assert.strictEqual(res.visibleQualities.length, 2);
    assert.deepStrictEqual(res.visibleQualities, ['720p', '480p']);
    assert.strictEqual(res.missingQualities.length, 0);
  });

  await t.test('1.5 qualities={[]} acts as an intentional empty filter', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: [],
      manifestQualities
    });

    assert.strictEqual(res.enabled, false);
    assert.strictEqual(res.mode, 'filter');
    assert.strictEqual(res.visibleQualities.length, 0);
    assert.strictEqual(res.resolvedQualities.length, 0);
  });

  await t.test('1.6 No manifest qualities returns enabled: false gracefully', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: undefined,
      manifestQualities: []
    });

    assert.strictEqual(res.enabled, false);
    assert.strictEqual(res.hasAvailableQualities, false);
    assert.strictEqual(res.visibleQualities.length, 0);
  });
});

test('BUG 2 REGRESSION: Subtitle Cues Lifecycle & Continuous Rendering', async (t) => {
  const sampleVtt = `WEBVTT

1
00:00:01.000 --> 00:00:05.000
Welcome to this online lesson.

2
00:00:06.000 --> 00:00:10.000
Today we will explore multilingual tutoring.
`;

  await t.test('2.1 VTT parser produces valid timestamped cues', () => {
    const cues = parseWebVTT(sampleVtt);
    assert.strictEqual(cues.length, 2);
    assert.strictEqual(cues[0].start, 1.0);
    assert.strictEqual(cues[0].end, 5.0);
    assert.strictEqual(cues[0].text, 'Welcome to this online lesson.');
    assert.strictEqual(cues[1].start, 6.0);
    assert.strictEqual(cues[1].end, 10.0);
    assert.strictEqual(cues[1].text, 'Today we will explore multilingual tutoring.');
  });

  await t.test('2.2 Subtitle resolver resolves manifest subtitles per language', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: undefined,
      generatedSubtitles: {
        en: '/aitutor/subtitles/lesson/en.vtt',
        hi: '/aitutor/subtitles/lesson/hi.vtt',
        te: '/aitutor/subtitles/lesson/te.vtt'
      }
    });

    assert.strictEqual(res.enabled, true);
    assert.strictEqual(res.mode, 'all');
    assert.strictEqual(res.visibleLanguages.length, 3);
    assert.strictEqual(res.resolvedTracks.en, '/aitutor/subtitles/lesson/en.vtt');
    assert.strictEqual(res.resolvedTracks.hi, '/aitutor/subtitles/lesson/hi.vtt');
    assert.strictEqual(res.resolvedTracks.te, '/aitutor/subtitles/lesson/te.vtt');
  });

  await t.test('2.3 Subtitle cue state lookup works across playhead positions', () => {
    const cues = parseWebVTT(sampleVtt);
    const findCue = (time) => {
      let low = 0;
      let high = cues.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const cue = cues[mid];
        if (time >= cue.start && time <= cue.end) return cue;
        else if (time < cue.start) high = mid - 1;
        else low = mid + 1;
      }
      return null;
    };

    assert.strictEqual(findCue(0.5), null);
    assert.strictEqual(findCue(2.5)?.text, 'Welcome to this online lesson.');
    assert.strictEqual(findCue(5.5), null);
    assert.strictEqual(findCue(8.0)?.text, 'Today we will explore multilingual tutoring.');
    assert.strictEqual(findCue(15.0), null);
  });
});

test('BUG 3 REGRESSION: Audio Language Switching & Synchronization', async (t) => {
  const manifestAudio = {
    en: { label: 'English', src: '/aitutor/audio/lesson/en.wav', language: 'en', source: true },
    hi: { label: 'Hindi', src: '/aitutor/audio/lesson/hi.m4a', language: 'hi' },
    te: { label: 'Telugu', src: '/aitutor/audio/lesson/te.m4a', language: 'te' }
  };

  await t.test('3.1 Audio availability defaults selectedLanguage to source/original', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: undefined,
      manifestAudio,
      sourceLanguage: 'en'
    });

    assert.strictEqual(res.enabled, true);
    assert.strictEqual(res.sourceLanguage, 'en');
    assert.strictEqual(res.selectedLanguage, 'en');
    assert.strictEqual(res.visibleLanguages.length, 3);
  });

  await t.test('3.2 Audio resolver converts Hindi & Telugu languages into distinct URLs', () => {
    const res = resolveAudioSources({
      manifestAudio
    });

    assert.strictEqual(res.resolvedTracks.en.src, '/aitutor/audio/lesson/en.wav');
    assert.strictEqual(res.resolvedTracks.hi.src, '/aitutor/audio/lesson/hi.m4a');
    assert.strictEqual(res.resolvedTracks.te.src, '/aitutor/audio/lesson/te.m4a');
    assert.strictEqual(res.sourceByLanguage.hi, 'generated');
    assert.strictEqual(res.sourceByLanguage.te, 'generated');
  });

  await t.test('3.3 Developer audio override takes precedence over generated audio', () => {
    const res = resolveAudioSources({
      developerAudio: {
        hi: { src: '/custom/override_hi.wav', label: 'Custom Hindi Dub' }
      },
      manifestAudio
    });

    assert.strictEqual(res.resolvedTracks.hi.src, '/custom/override_hi.wav');
    assert.strictEqual(res.resolvedTracks.hi.label, 'Custom Hindi Dub');
    assert.strictEqual(res.sourceByLanguage.hi, 'developer');
    // Telugu remains generated
    assert.strictEqual(res.resolvedTracks.te.src, '/aitutor/audio/lesson/te.m4a');
    assert.strictEqual(res.sourceByLanguage.te, 'generated');
  });

  await t.test('3.4 Audio filtering keeps source/original language available', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['te'],
      manifestAudio,
      sourceLanguage: 'en'
    });

    assert.strictEqual(res.enabled, true);
    assert.ok(res.visibleLanguages.includes('en'), 'Original source language is protected');
    assert.ok(res.visibleLanguages.includes('te'), 'Telugu requested language is visible');
    assert.ok(!res.visibleLanguages.includes('hi'), 'Hindi is excluded by filter');
  });

  await t.test('3.5 audioLanguages={false} completely hides audio language controls', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: false,
      manifestAudio,
      sourceLanguage: 'en'
    });

    assert.strictEqual(res.enabled, false);
    assert.strictEqual(res.visibleLanguages.length, 0);
  });
});
