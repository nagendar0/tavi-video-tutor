import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveSubtitleAvailability,
  resolveSubtitleSources,
  emitSubtitleDXWarning,
  clearWarnedSubtitleCache
} from '../src/subtitles/resolver/subtitleResolver.js';

import {
  resolveAudioAvailability,
  resolveAudioSources,
  emitAudioDXWarning,
  clearWarnedAudioCache
} from '../src/subtitles/resolver/audioResolver.js';

import {
  resolveQualityAvailability,
  resolveQualitySources,
  emitQualityDXWarning,
  clearWarnedQualityCache
} from '../src/subtitles/resolver/qualityResolver.js';

describe('Unified Media Availability Architecture Test Matrix (40 Invariants)', () => {
  beforeEach(() => {
    clearWarnedSubtitleCache();
    clearWarnedAudioCache();
    clearWarnedQualityCache();
  });

  // ==========================================
  // SYSTEM 1: SUBTITLES (Tests 1 - 10)
  // ==========================================

  test('1. Subtitles: No subtitle tracks', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: 'all',
      generatedSubtitles: {},
      developerSubtitles: {},
      uploadedSubtitles: {},
      demoSubtitles: {}
    });

    assert.equal(res.enabled, false);
    assert.equal(res.hasAvailableItems, false);
    assert.equal(res.hasAvailableSubtitles, false);
    assert.deepEqual(res.availableItems, []);
    assert.deepEqual(res.visibleItems, []);
    assert.deepEqual(res.resolvedItems, {});
  });

  test('2. Subtitles: One subtitle track', () => {
    const res = resolveSubtitleAvailability({
      generatedSubtitles: { en: '/subtitles/en.vtt' }
    });

    assert.equal(res.enabled, true);
    assert.equal(res.hasAvailableItems, true);
    assert.deepEqual(res.availableItems, ['en']);
    assert.deepEqual(res.visibleItems, ['en']);
    assert.equal(res.resolvedItems['en'], '/subtitles/en.vtt');
    assert.equal(res.sourceByItem['en'], 'generated');
  });

  test('3. Subtitles: Multiple subtitle tracks', () => {
    const res = resolveSubtitleAvailability({
      generatedSubtitles: {
        en: '/subtitles/en.vtt',
        hi: '/subtitles/hi.vtt',
        te: '/subtitles/te.vtt'
      }
    });

    assert.equal(res.enabled, true);
    assert.equal(res.hasAvailableItems, true);
    assert.deepEqual(res.availableItems, ['en', 'hi', 'te']);
    assert.deepEqual(res.visibleItems, ['en', 'hi', 'te']);
  });

  test('4. Subtitles: subtitles={false} completely disables subtitle UI and loading', () => {
    const res = resolveSubtitleAvailability({
      subtitlesConfig: false,
      generatedSubtitles: { en: '/subtitles/en.vtt', hi: '/subtitles/hi.vtt' }
    });

    assert.equal(res.enabled, false);
    assert.equal(res.hasAvailableItems, false);
    assert.equal(res.mode, 'disabled');
    assert.deepEqual(res.visibleItems, []);
    assert.deepEqual(res.resolvedItems, {});
  });

  test('5. Subtitles: requested missing language emits DX warning and does not appear', () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
      const res = resolveSubtitleAvailability({
        subtitlesConfig: ['te'],
        generatedSubtitles: { en: '/subtitles/en.vtt', hi: '/subtitles/hi.vtt' },
        videoKey: 'video_sub_5'
      });

      assert.equal(res.enabled, false);
      assert.deepEqual(res.visibleItems, []);
      assert.deepEqual(res.missingItems, ['te']);
      assert.ok(warnings.some(w => w.includes('[AITutor DX Warning]') && w.includes('Missing: te')));
    } finally {
      console.warn = origWarn;
    }
  });

  test('6. Subtitles: requested subset exposes only matching existing tracks', () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
      const res = resolveSubtitleAvailability({
        subtitlesConfig: ['en', 'hi', 'te'],
        generatedSubtitles: { en: '/subtitles/en.vtt', hi: '/subtitles/hi.vtt' },
        videoKey: 'video_sub_6'
      });

      assert.equal(res.enabled, true);
      assert.deepEqual(res.visibleItems, ['en', 'hi']);
      assert.ok(!res.visibleItems.includes('te'));
      assert.deepEqual(res.missingItems, ['te']);
      assert.ok(warnings.some(w => w.includes('[AITutor DX Warning]') && w.includes('Missing: te')));
    } finally {
      console.warn = origWarn;
    }
  });

  test('7. Subtitles: developer override takes priority over generated manifest', () => {
    const res = resolveSubtitleAvailability({
      generatedSubtitles: { en: '/gen/en.vtt', hi: '/gen/hi.vtt' },
      developerSubtitles: { en: '/dev/en.vtt' }
    });

    assert.equal(res.resolvedItems['en'], '/dev/en.vtt');
    assert.equal(res.sourceByItem['en'], 'developer');
    assert.equal(res.resolvedItems['hi'], '/gen/hi.vtt');
    assert.equal(res.sourceByItem['hi'], 'generated');
  });

  test('8. Subtitles: uploaded subtitle overrides developer and generated', () => {
    const res = resolveSubtitleAvailability({
      generatedSubtitles: { en: '/gen/en.vtt' },
      developerSubtitles: { en: '/dev/en.vtt' },
      uploadedSubtitles: { en: 'WEBVTT\n1\n00:00:00.000 --> 00:00:02.000\nUploaded text' }
    });

    assert.ok(res.resolvedItems['en'].includes('Uploaded text'));
    assert.equal(res.sourceByItem['en'], 'uploaded');
  });

  test('9. Subtitles: generated manifest subtitle resolves correctly per language', () => {
    const sources = resolveSubtitleSources({
      generatedSubtitles: {
        fr: '/manifest/fr.vtt',
        es: { src: '/manifest/es.vtt' }
      }
    });

    assert.equal(sources.resolvedTracks['fr'], '/manifest/fr.vtt');
    assert.equal(sources.resolvedTracks['es'], '/manifest/es.vtt');
    assert.equal(sources.sourceByLanguage['fr'], 'generated');
  });

  test('10. Subtitles: no fake registry languages leaked in visibleItems', () => {
    const res = resolveSubtitleAvailability({
      generatedSubtitles: { en: '/en.vtt' }
    });

    assert.equal(res.visibleItems.length, 1);
    assert.deepEqual(res.visibleItems, ['en']);
    assert.ok(!res.visibleItems.includes('te'));
    assert.ok(!res.visibleItems.includes('hi'));
    assert.ok(!res.visibleItems.includes('es'));
  });

  // ==========================================
  // SYSTEM 2: AUDIO LANGUAGES (Tests 11 - 20)
  // ==========================================

  test('11. Audio: No audio tracks', () => {
    const res = resolveAudioAvailability({
      manifestAudio: {},
      developerAudio: {},
      demoAudio: {}
    });

    assert.equal(res.enabled, false);
    assert.equal(res.hasAvailableItems, false);
    assert.deepEqual(res.availableItems, []);
    assert.deepEqual(res.visibleItems, []);
  });

  test('12. Audio: Original only audio track', () => {
    const res = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: { en: { label: 'English (Original)', src: '/audio/en.mp3', source: true } }
    });

    assert.equal(res.enabled, true);
    assert.equal(res.hasAvailableItems, true);
    assert.deepEqual(res.availableItems, ['en']);
    assert.deepEqual(res.visibleItems, ['en']);
    assert.equal(res.originalTrack.language, 'en');
  });

  test('13. Audio: Generated tracks resolution', () => {
    const res = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: {
        en: { src: '/audio/en.mp3', source: true },
        hi: { src: '/audio/hi.mp3' },
        te: { src: '/audio/te.mp3' }
      }
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.availableItems, ['en', 'hi', 'te']);
    assert.deepEqual(res.visibleItems, ['en', 'hi', 'te']);
    assert.equal(res.sourceByItem['hi'], 'generated');
  });

  test('14. Audio: Developer audio dubbing override', () => {
    const res = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: {
        en: { src: '/audio/en.mp3', source: true },
        hi: { src: '/audio/gen-hi.mp3' }
      },
      developerAudio: {
        hi: { src: '/audio/dev-hi.mp3', label: 'Studio Hindi Dub' }
      }
    });

    assert.equal(res.resolvedItems['hi'].src, '/audio/dev-hi.mp3');
    assert.equal(res.resolvedItems['hi'].label, 'Studio Hindi Dub');
    assert.equal(res.sourceByItem['hi'], 'developer');
  });

  test('15. Audio: Developer overrides generated priority check', () => {
    const sources = resolveAudioSources({
      manifestAudio: { fr: '/gen/fr.mp3' },
      developerAudio: { fr: '/dev/fr.mp3' }
    });

    assert.equal(sources.resolvedTracks['fr'].src, '/dev/fr.mp3');
    assert.equal(sources.sourceByLanguage['fr'], 'developer');
  });

  test('16. Audio: audioLanguages={false} completely hides audio language UI', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: false,
      manifestAudio: { en: '/en.mp3', hi: '/hi.mp3' }
    });

    assert.equal(res.enabled, false);
    assert.equal(res.hasAvailableItems, false);
    assert.deepEqual(res.visibleItems, []);
    assert.deepEqual(res.resolvedItems, {});
  });

  test('17. Audio: requested missing language emits DX warning and is not displayed', () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
      const res = resolveAudioAvailability({
        audioLanguagesConfig: ['hi', 'te'],
        sourceLanguage: 'en',
        manifestAudio: { en: { src: '/en.mp3', source: true } },
        videoKey: 'video_audio_17'
      });

      assert.equal(res.enabled, false);
      assert.deepEqual(res.visibleItems, []);
      assert.deepEqual(res.missingItems, ['hi', 'te']);
      assert.ok(warnings.some(w => w.includes('[AITutor DX Warning]') && w.includes('Missing: hi, te')));
    } finally {
      console.warn = origWarn;
    }
  });

  test('18. Audio: requested subset keeps original language protected and visible', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      sourceLanguage: 'en',
      manifestAudio: {
        en: { src: '/en.mp3', source: true },
        hi: { src: '/hi.mp3' },
        te: { src: '/te.mp3' }
      }
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['en', 'hi']);
    assert.ok(!res.visibleItems.includes('te'));
  });

  test('19. Audio: immutable source language cannot be redefined by filter', () => {
    const res = resolveAudioAvailability({
      audioLanguagesConfig: ['hi'],
      sourceLanguage: 'en',
      manifestAudio: {
        en: { src: '/en.mp3', source: true },
        hi: { src: '/hi.mp3' }
      }
    });

    assert.equal(res.sourceLanguage, 'en');
    assert.equal(res.originalTrack.language, 'en');
    assert.equal(res.originalTrack.source, true);
  });

  test('20. Audio: no fake 109 registry languages leaked', () => {
    const res = resolveAudioAvailability({
      manifestAudio: { en: { src: '/en.mp3', source: true } }
    });

    assert.equal(res.visibleItems.length, 1);
    assert.deepEqual(res.visibleItems, ['en']);
  });

  // ==========================================
  // SYSTEM 3: VIDEO QUALITY (Tests 21 - 27)
  // ==========================================

  test('21. Quality: One quality rendition', () => {
    const res = resolveQualityAvailability({
      manifestQualities: [{ label: '1080p', src: '/1080.mp4', height: 1080 }]
    });

    assert.equal(res.enabled, true);
    assert.equal(res.hasAvailableItems, true);
    assert.deepEqual(res.availableItems, ['1080p']);
    assert.deepEqual(res.visibleItems, ['1080p']);
    assert.equal(res.source, 'manifest');
  });

  test('22. Quality: Multiple qualities resolution', () => {
    const res = resolveQualityAvailability({
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' },
        { label: '480p', src: '/480.mp4' }
      ]
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.availableItems, ['1080p', '720p', '480p']);
    assert.deepEqual(res.visibleItems, ['1080p', '720p', '480p']);
  });

  test('23. Quality: requested unavailable quality emits DX warning and is omitted', () => {
    const warnings = [];
    const origWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    try {
      const res = resolveQualityAvailability({
        qualitiesConfig: ['1080p', '720p', '4K'],
        manifestQualities: [
          { label: '1080p', src: '/1080.mp4' },
          { label: '720p', src: '/720.mp4' },
          { label: '480p', src: '/480.mp4' }
        ],
        videoKey: 'video_qual_23'
      });

      assert.equal(res.enabled, true);
      assert.deepEqual(res.visibleItems, ['1080p', '720p']);
      assert.ok(!res.visibleItems.includes('4K'));
      assert.deepEqual(res.missingItems, ['4K']);
      assert.ok(warnings.some(w => w.includes('[AITutor DX Warning]') && w.includes('Missing: 4K')));
    } finally {
      console.warn = origWarn;
    }
  });

  test('24. Quality: requested subset resolves only requested valid renditions', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['720p', '480p'],
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' },
        { label: '480p', src: '/480.mp4' },
        { label: '360p', src: '/360.mp4' }
      ]
    });

    assert.equal(res.enabled, true);
    assert.deepEqual(res.visibleItems, ['720p', '480p']);
    assert.equal(res.resolvedItems.length, 2);
  });

  test('25. Quality: no fake quality options created', () => {
    const res = resolveQualityAvailability({
      manifestQualities: [{ label: '720p', src: '/720.mp4' }]
    });

    assert.equal(res.visibleItems.length, 1);
    assert.deepEqual(res.visibleItems, ['720p']);
  });

  test('26. Quality: no upscaling of video to satisfy nonexistent quality', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: ['4K'],
      manifestQualities: [{ label: '1080p', src: '/1080.mp4' }]
    });

    assert.equal(res.enabled, false);
    assert.deepEqual(res.visibleItems, []);
    assert.deepEqual(res.missingItems, ['4K']);
  });

  test('27. Quality: qualities={false} completely disables quality UI', () => {
    const res = resolveQualityAvailability({
      qualitiesConfig: false,
      manifestQualities: [{ label: '1080p', src: '/1080.mp4' }]
    });

    assert.equal(res.enabled, false);
    assert.equal(res.hasAvailableItems, false);
    assert.equal(res.mode, 'disabled');
    assert.deepEqual(res.visibleItems, []);
  });

  // ==========================================
  // CROSS-SYSTEM & INVARIANTS (Tests 28 - 40)
  // ==========================================

  test('28. Cross-System: audio + subtitles independence', () => {
    const subRes = resolveSubtitleAvailability({
      generatedSubtitles: { en: '/en.vtt', hi: '/hi.vtt' }
    });
    const audioRes = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: { en: { src: '/en.mp3', source: true }, te: { src: '/te.mp3' } }
    });

    assert.deepEqual(subRes.visibleItems, ['en', 'hi']);
    assert.deepEqual(audioRes.visibleItems, ['en', 'te']);
    // State in subRes does not alter audioRes
    assert.ok(!audioRes.visibleItems.includes('hi'));
    assert.ok(!subRes.visibleItems.includes('te'));
  });

  test('29. Cross-System: audio + quality independence', () => {
    const audioRes = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: { en: { src: '/en.mp3', source: true } }
    });
    const qualRes = resolveQualityAvailability({
      manifestQualities: [{ label: '1080p', src: '/1080.mp4' }]
    });

    assert.equal(audioRes.enabled, true);
    assert.equal(qualRes.enabled, true);
    assert.deepEqual(audioRes.visibleItems, ['en']);
    assert.deepEqual(qualRes.visibleItems, ['1080p']);
  });

  test('30. Cross-System: subtitles + quality independence', () => {
    const subRes = resolveSubtitleAvailability({
      subtitlesConfig: false
    });
    const qualRes = resolveQualityAvailability({
      manifestQualities: [{ label: '720p', src: '/720.mp4' }]
    });

    assert.equal(subRes.enabled, false);
    assert.equal(qualRes.enabled, true);
  });

  test('31. Cross-System: audio + subtitles + quality 3-way independence', () => {
    const subRes = resolveSubtitleAvailability({
      generatedSubtitles: { hi: '/hi.vtt' }
    });
    const audioRes = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: { en: { src: '/en.mp3', source: true }, te: { src: '/te.mp3' } }
    });
    const qualRes = resolveQualityAvailability({
      manifestQualities: [{ label: '480p', src: '/480.mp4' }]
    });

    assert.equal(subRes.enabled, true);
    assert.equal(audioRes.enabled, true);
    assert.equal(qualRes.enabled, true);
    assert.deepEqual(subRes.visibleItems, ['hi']);
    assert.deepEqual(audioRes.visibleItems, ['en', 'te']);
    assert.deepEqual(qualRes.visibleItems, ['480p']);
  });

  test('32. Cross-System: rapid switching preserves resolution stability', () => {
    const languages = ['en', 'hi', 'te', 'es', 'fr'];
    for (let i = 0; i < 50; i++) {
      const selected = languages[i % languages.length];
      const res = resolveAudioAvailability({
        audioLanguagesConfig: [selected],
        sourceLanguage: 'en',
        manifestAudio: {
          en: { src: '/en.mp3', source: true },
          hi: { src: '/hi.mp3' },
          te: { src: '/te.mp3' },
          es: { src: '/es.mp3' },
          fr: { src: '/fr.mp3' }
        }
      });
      assert.ok(res.visibleItems.includes(selected));
      assert.ok(res.visibleItems.includes('en'));
    }
  });

  test('33. Cross-System: React StrictMode idempotency (multiple invocations produce identical output)', () => {
    const opts = {
      subtitlesConfig: ['en', 'hi'],
      generatedSubtitles: { en: '/en.vtt', hi: '/hi.vtt' }
    };
    const call1 = resolveSubtitleAvailability(opts);
    const call2 = resolveSubtitleAvailability(opts);

    assert.deepEqual(call1, call2);
  });

  test('34. Cross-System: React 18 component contract invariants', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const pkgPath = path.resolve('package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

    assert.ok(pkg.peerDependencies.react.includes('18') && pkg.peerDependencies.react.includes('19'));
    assert.ok(pkg.peerDependencies['react-dom'].includes('18') && pkg.peerDependencies['react-dom'].includes('19'));

    const aiTutorSrc = fs.readFileSync(path.resolve('src/components/AITutor.jsx'), 'utf8');
    assert.ok(aiTutorSrc.includes('forwardRef'), 'AITutor must use forwardRef for React 18 & 19 compatibility');
    assert.ok(aiTutorSrc.includes('resolveQualityAvailability'), 'AITutor must wire resolveQualityAvailability');
    assert.ok(aiTutorSrc.includes('resolveAudioAvailability'), 'AITutor must wire resolveAudioAvailability');
    assert.ok(aiTutorSrc.includes('resolveSubtitleAvailability'), 'AITutor must wire resolveSubtitleAvailability');
  });

  test('35. Cross-System: React 19 JSX component verification', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const playerSrc = fs.readFileSync(path.resolve('src/components/TaviVideoPlayer.jsx'), 'utf8');

    assert.ok(playerSrc.includes('forwardRef'), 'TaviVideoPlayer must use forwardRef');
    assert.ok(playerSrc.includes('qualityAvailability'), 'TaviVideoPlayer must accept qualityAvailability');
    assert.ok(playerSrc.includes('audioAvailability'), 'TaviVideoPlayer must accept audioAvailability');
    assert.ok(playerSrc.includes('subtitleAvailability'), 'TaviVideoPlayer must accept subtitleAvailability');
  });

  test('36. Cross-System: missing manifest gracefully returns disabled states without crash', () => {
    const subRes = resolveSubtitleAvailability({});
    const audioRes = resolveAudioAvailability({});
    const qualRes = resolveQualityAvailability({});

    assert.equal(subRes.enabled, false);
    assert.equal(audioRes.enabled, false);
    assert.equal(qualRes.enabled, false);
  });

  test('37. Cross-System: partial manifest (audio only, no subtitles or quality)', () => {
    const subRes = resolveSubtitleAvailability({});
    const audioRes = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: { en: { src: '/en.mp3', source: true } }
    });
    const qualRes = resolveQualityAvailability({});

    assert.equal(subRes.enabled, false);
    assert.equal(audioRes.enabled, true);
    assert.equal(qualRes.enabled, false);
  });

  test('38. Cross-System: stale manifest update resets available tracks correctly', () => {
    const initialSub = resolveSubtitleAvailability({
      generatedSubtitles: { en: '/old/en.vtt' }
    });
    assert.equal(initialSub.resolvedItems['en'], '/old/en.vtt');

    const updatedSub = resolveSubtitleAvailability({
      generatedSubtitles: { en: '/new/en.vtt', hi: '/new/hi.vtt' }
    });
    assert.equal(updatedSub.resolvedItems['en'], '/new/en.vtt');
    assert.deepEqual(updatedSub.visibleItems, ['en', 'hi']);
  });

  test('39. Cross-System: deleted media asset is immediately removed from visibleItems', () => {
    const initialAudio = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: { en: { src: '/en.mp3', source: true }, hi: { src: '/hi.mp3' } }
    });
    assert.deepEqual(initialAudio.visibleItems, ['en', 'hi']);

    // Asset deleted in regenerated manifest
    const updatedAudio = resolveAudioAvailability({
      sourceLanguage: 'en',
      manifestAudio: { en: { src: '/en.mp3', source: true } }
    });
    assert.deepEqual(updatedAudio.visibleItems, ['en']);
  });

  test('40. Cross-System: cache regeneration restores availability', () => {
    const regenQual = resolveQualityAvailability({
      manifestQualities: [
        { label: '1080p', src: '/1080.mp4' },
        { label: '720p', src: '/720.mp4' }
      ]
    });

    assert.equal(regenQual.enabled, true);
    assert.deepEqual(regenQual.visibleItems, ['1080p', '720p']);
  });
});
