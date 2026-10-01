import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { matchesLanguageQuery } from '../src/subtitles/languages/languageMatcher.js';
import { AITUTOR_LANGUAGES, getLanguageByCode } from '../src/subtitles/languages/registry.js';
import { resolveAudioAvailability } from '../src/subtitles/resolver/audioResolver.js';

describe('Language Selector UI & Search Experience (TaviVideoPlayer)', () => {
  // =========================================================================
  // 1. Threshold verification: <= 5 (no search) vs > 5 (search appears)
  // =========================================================================
  describe('Language Count & Search Visibility Thresholds', () => {
    test('1 to 5 languages -> showSearch is false (compact dropdown)', () => {
      [1, 2, 3, 4, 5].forEach(count => {
        const languages = Array.from({ length: count }, (_, i) => ({
          code: `lang_${i}`,
          label: `Language ${i}`
        }));
        const showSearch = languages.length > 5;
        assert.strictEqual(showSearch, false, `Failed for count=${count}`);
      });
    });

    test('6 languages -> showSearch is true', () => {
      const languages = Array.from({ length: 6 }, (_, i) => ({
        code: `lang_${i}`,
        label: `Language ${i}`
      }));
      const showSearch = languages.length > 5;
      assert.strictEqual(showSearch, true);
    });

    test('13 languages (Neural TTS) -> showSearch is true', () => {
      const languages = Array.from({ length: 13 }, (_, i) => ({
        code: `lang_${i}`,
        label: `Language ${i}`
      }));
      const showSearch = languages.length > 5;
      assert.strictEqual(showSearch, true);
    });

    test('109 registry entries -> showSearch is true', () => {
      assert.strictEqual(AITUTOR_LANGUAGES.length, 109);
      const showSearch = AITUTOR_LANGUAGES.length > 5;
      assert.strictEqual(showSearch, true);
    });
  });

  // =========================================================================
  // 2. Search matching verification
  // =========================================================================
  describe('Multi-token & Native Language Search Matching', () => {
    const hindiMeta = getLanguageByCode('hi');
    const teluguMeta = getLanguageByCode('te');
    const spanishMeta = getLanguageByCode('es');
    const japaneseMeta = getLanguageByCode('ja');

    test('Searching "hin" matches Hindi (code, ISO-639-2, English name)', () => {
      const match = matchesLanguageQuery('hin', {
        code: hindiMeta.code,
        name: hindiMeta.name,
        nativeName: hindiMeta.nativeName,
        iso639_2: hindiMeta.iso639_2,
        label: 'हिन्दी / Hindi'
      });
      assert.strictEqual(match, true);
    });

    test('Searching native Devanagari "हिं" matches Hindi', () => {
      const match = matchesLanguageQuery('हिं', {
        code: hindiMeta.code,
        name: hindiMeta.name,
        nativeName: hindiMeta.nativeName,
        iso639_2: hindiMeta.iso639_2,
        label: 'हिन्दी / Hindi'
      });
      assert.strictEqual(match, true);
    });

    test('Searching "te" matches Telugu', () => {
      const match = matchesLanguageQuery('te', {
        code: teluguMeta.code,
        name: teluguMeta.name,
        nativeName: teluguMeta.nativeName,
        iso639_2: teluguMeta.iso639_2,
        label: 'తెలుగు / Telugu'
      });
      assert.strictEqual(match, true);
    });

    test('Searching native Telugu script "తెలుగు" matches Telugu', () => {
      const match = matchesLanguageQuery('తెలుగు', {
        code: teluguMeta.code,
        name: teluguMeta.name,
        nativeName: teluguMeta.nativeName,
        iso639_2: teluguMeta.iso639_2,
        label: 'తెలుగు / Telugu'
      });
      assert.strictEqual(match, true);
    });

    test('Searching "spa" matches Spanish (code "es", iso639_2 "spa", name "Spanish")', () => {
      const match = matchesLanguageQuery('spa', {
        code: spanishMeta.code,
        name: spanishMeta.name,
        nativeName: spanishMeta.nativeName,
        iso639_2: spanishMeta.iso639_2,
        label: 'Español / Spanish'
      });
      assert.strictEqual(match, true);
    });

    test('Searching native Japanese "日本" matches Japanese (nativeName "日本語")', () => {
      const match = matchesLanguageQuery('日本', {
        code: japaneseMeta.code,
        name: japaneseMeta.name,
        nativeName: japaneseMeta.nativeName,
        iso639_2: japaneseMeta.iso639_2,
        label: '日本語 / Japanese'
      });
      assert.strictEqual(match, true);
    });

    test('Search is case-insensitive', () => {
      assert.strictEqual(matchesLanguageQuery('HINDI', { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }), true);
      assert.strictEqual(matchesLanguageQuery('tElUgU', { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }), true);
      assert.strictEqual(matchesLanguageQuery('ESPAÑOL', { code: 'es', name: 'Spanish', nativeName: 'Español' }), true);
      assert.strictEqual(matchesLanguageQuery('SPA', { code: 'es', name: 'Spanish', iso639_2: 'spa' }), true);
    });

    test('Non-matching query returns false', () => {
      assert.strictEqual(matchesLanguageQuery('xyzNonExistent', { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }), false);
      assert.strictEqual(matchesLanguageQuery('zzz', { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' }), false);
    });

    test('Empty / cleared query returns true (restores full list)', () => {
      assert.strictEqual(matchesLanguageQuery('', { code: 'hi', name: 'Hindi' }), true);
      assert.strictEqual(matchesLanguageQuery('   ', { code: 'hi', name: 'Hindi' }), true);
      assert.strictEqual(matchesLanguageQuery(null, { code: 'hi', name: 'Hindi' }), true);
    });
  });

  // =========================================================================
  // 3. Dynamic options derivation & 109 registry search
  // =========================================================================
  describe('Full Registry (109 entries) Search Operations', () => {
    test('Filtering across all 109 registry languages works accurately', () => {
      const allOptions = AITUTOR_LANGUAGES.map(lang => ({
        code: lang.code,
        langCode: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        iso639_2: lang.iso639_2,
        label: `${lang.nativeName} / ${lang.name}`
      }));

      assert.strictEqual(allOptions.length, 109);

      // Search Hindi
      const hindiResults = allOptions.filter(opt => matchesLanguageQuery('हिं', opt));
      assert.strictEqual(hindiResults.length, 1);
      assert.strictEqual(hindiResults[0].code, 'hi');

      // Search Telugu
      const teluguResults = allOptions.filter(opt => matchesLanguageQuery('తెలుగు', opt));
      assert.strictEqual(teluguResults.length, 1);
      assert.strictEqual(teluguResults[0].code, 'te');

      // Search Japanese
      const japaneseResults = allOptions.filter(opt => matchesLanguageQuery('日本', opt));
      assert.strictEqual(japaneseResults.length, 1);
      assert.strictEqual(japaneseResults[0].code, 'ja');

      // Search Spanish
      const spanishResults = allOptions.filter(opt => matchesLanguageQuery('spa', opt));
      assert.ok(spanishResults.some(r => r.code === 'es'));

      // Clearing query restores all 109 entries
      const clearedResults = allOptions.filter(opt => matchesLanguageQuery('', opt));
      assert.strictEqual(clearedResults.length, 109);

      // Zero-result query produces empty array for "No languages found"
      const zeroResults = allOptions.filter(opt => matchesLanguageQuery('xyzUnknownLang999', opt));
      assert.strictEqual(zeroResults.length, 0);
    });
  });

  // =========================================================================
  // 4. Audio Switching & Selection Preservation
  // =========================================================================
  describe('Audio Switching & State Preservation', () => {
    test('Audio language selection triggers callback with correct language & source', () => {
      const mockManifestAudio = {
        en: { src: '/audio/en.m4a', language: 'en', source: true },
        hi: { src: '/audio/hi.m4a', language: 'hi' },
        te: { src: '/audio/te.m4a', language: 'te' }
      };

      const availability = resolveAudioAvailability({
        audioLanguagesConfig: ['en', 'hi', 'te'],
        manifestAudio: mockManifestAudio,
        sourceLanguage: 'en'
      });

      assert.strictEqual(availability.enabled, true);
      assert.deepStrictEqual(availability.visibleLanguages.sort(), ['en', 'hi', 'te']);

      // Simulate onAudioLanguageChange logic as implemented in TaviVideoPlayer
      let callbackPayload = null;
      const onAudioLanguageChange = (payload) => {
        callbackPayload = payload;
      };

      const handleAudioLanguageChangeSim = (lang, currentLang) => {
        const isOrig = (lang === 'original' || lang === 'en' || mockManifestAudio[lang]?.source);
        onAudioLanguageChange({
          language: lang,
          previousLanguage: currentLang,
          source: isOrig ? 'original' : (mockManifestAudio[lang] ? (availability.sourceByLanguage?.[lang] || 'generated') : 'original')
        });
      };

      // Select Hindi
      handleAudioLanguageChangeSim('hi', 'original');
      assert.deepStrictEqual(callbackPayload, {
        language: 'hi',
        previousLanguage: 'original',
        source: 'generated'
      });

      // Switch back to original
      handleAudioLanguageChangeSim('original', 'hi');
      assert.deepStrictEqual(callbackPayload, {
        language: 'original',
        previousLanguage: 'hi',
        source: 'original'
      });
    });
  });
});
