import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AITUTOR_LANGUAGES,
  normalizeLanguageCode,
  resolveLanguageCapability,
  getLanguageByCode
} from '../src/subtitles/languages/registry.js';
import { VoicePool } from '../src/subtitles/audio/voice/VoicePool.js';
import { VoiceAllocator } from '../src/subtitles/audio/voice/VoiceAllocator.js';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';

test('1. Registry Integrity — All 109 Languages Fully Defined', () => {
  assert.ok(Array.isArray(AITUTOR_LANGUAGES), 'AITUTOR_LANGUAGES must be an array');
  assert.equal(AITUTOR_LANGUAGES.length, 109, `Registry must contain exactly 109 languages, found ${AITUTOR_LANGUAGES.length}`);

  const seenCodes = new Set();

  for (const lang of AITUTOR_LANGUAGES) {
    assert.ok(lang.code, `Language missing code: ${JSON.stringify(lang)}`);
    assert.ok(lang.name, `Language ${lang.code} missing English name`);
    assert.ok(lang.nativeName, `Language ${lang.code} missing nativeName`);
    assert.ok(lang.iso639_2, `Language ${lang.code} missing iso639_2`);
    assert.ok(lang.bcp47, `Language ${lang.code} missing bcp47`);

    assert.ok(lang.code.length === 2 || lang.code.length === 3, `Language code must be 2 or 3 characters: ${lang.code}`);
    assert.ok(lang.iso639_2.length >= 3, `ISO 639-2 code must be >= 3 characters: ${lang.iso639_2}`);
    assert.ok(!seenCodes.has(lang.code), `Duplicate language code detected: ${lang.code}`);
    seenCodes.add(lang.code);
  }
});

test('2. Dynamic Multilingual Normalization Matrix Across All 109 Languages', () => {
  for (const lang of AITUTOR_LANGUAGES) {
    const code = lang.code;

    // 1. Exact 2-letter code
    assert.equal(normalizeLanguageCode(code), code, `Canonical code ${code} must normalize to itself`);
    assert.equal(normalizeLanguageCode(code.toUpperCase()), code, `Uppercase code ${code.toUpperCase()} must normalize to ${code}`);

    // 2. 3-letter ISO 639-2/3 code
    assert.equal(
      normalizeLanguageCode(lang.iso639_2),
      code,
      `ISO 639-2 code "${lang.iso639_2}" must normalize to "${code}"`
    );

    // 3. BCP-47 locale tag
    assert.equal(
      normalizeLanguageCode(lang.bcp47),
      code,
      `BCP-47 locale "${lang.bcp47}" must normalize to "${code}"`
    );

    // 4. English name
    assert.equal(
      normalizeLanguageCode(lang.name),
      code,
      `English name "${lang.name}" must normalize to "${code}"`
    );

    // 5. Native name
    assert.equal(
      normalizeLanguageCode(lang.nativeName),
      code,
      `Native name "${lang.nativeName}" must normalize to "${code}"`
    );

    // 6. getLanguageByCode via aliases
    const byIso3 = getLanguageByCode(lang.iso639_2);
    assert.ok(byIso3, `getLanguageByCode should resolve by ISO 639-2 "${lang.iso639_2}"`);
    assert.equal(byIso3.code, code);

    const byBcp47 = getLanguageByCode(lang.bcp47);
    assert.ok(byBcp47, `getLanguageByCode should resolve by BCP-47 "${lang.bcp47}"`);
    assert.equal(byBcp47.code, code);
  }
});

test('3. Capability Resolution Matrix Across All 109 Languages', () => {
  for (const lang of AITUTOR_LANGUAGES) {
    const code = lang.code;
    const capability = resolveLanguageCapability(code);

    assert.equal(capability.supported, true, `${code} must be marked supported`);
    assert.equal(capability.canonicalCode, code, `${code} canonicalCode mismatch`);
    assert.equal(capability.displayName, lang.name, `${code} displayName mismatch`);
    assert.equal(capability.ttsSupported, true, `${code} must have ttsSupported: true`);
    assert.equal(capability.translationSupported, true, `${code} must have translationSupported: true`);
    assert.ok(capability.ttsLocale, `${code} must have a valid ttsLocale`);
    assert.ok(capability.preferredVoices, `${code} must define preferredVoices`);
    assert.ok(Array.isArray(capability.preferredVoices.female), `${code} female voices must be array`);
    assert.ok(Array.isArray(capability.preferredVoices.male), `${code} male voices must be array`);
  }

  // Edge case: Unsupported language code returns clean unsupported contract
  const unsupported = resolveLanguageCapability('klingon');
  assert.equal(unsupported.supported, false);
  assert.equal(unsupported.canonicalCode, null);
  assert.equal(unsupported.ttsSupported, false);
  assert.equal(unsupported.translationSupported, false);
});

test('4. Voice Pool & Dynamic Allocation Matrix for All 109 Languages', () => {
  const pool = new VoicePool();

  for (const lang of AITUTOR_LANGUAGES) {
    const code = lang.code;
    const voices = pool.getVoicesForLanguage(code, 4);

    assert.ok(Array.isArray(voices), `Voices for ${code} must be an array`);
    assert.ok(voices.length >= 2, `VoicePool must provide at least 2 distinct voices for ${code}, got ${voices.length}`);

    // Ensure distinct voiceIds
    const voiceIds = new Set(voices.map(v => v.voiceId));
    assert.equal(voiceIds.size, voices.length, `Voices for ${code} must have unique voiceIds`);

    // Verify allocator works seamlessly for multi-speaker overlap in this language
    const allocator = new VoiceAllocator({ voicePool: pool });
    const allocation = allocator.allocate({
      speakers: [{ speakerId: 'spk_1' }, { speakerId: 'spk_2' }],
      segments: [
        { segmentId: 'seg_1', speakerId: 'spk_1', startTime: 0, endTime: 2 },
        { segmentId: 'seg_2', speakerId: 'spk_2', startTime: 1, endTime: 3 }
      ],
      targetLanguage: code
    });

    assert.equal(Object.keys(allocation.assignments).length, 2, `Allocator must assign voices for both speakers in ${code}`);
    assert.notEqual(
      allocation.assignments.spk_1.voiceId,
      allocation.assignments.spk_2.voiceId,
      `Overlapping speakers in ${code} must not receive duplicate voice IDs`
    );
  }
});

test('5. NodeTTSProvider Unified Capability Contract for All 109 Languages', () => {
  const tts = new NodeTTSProvider();

  for (const lang of AITUTOR_LANGUAGES) {
    const code = lang.code;
    assert.equal(
      tts.supportsLanguage(code),
      true,
      `NodeTTSProvider must support language ${code} via local voice or online fallback`
    );
  }

  // Unsupported language fails supportsLanguage check
  assert.equal(tts.supportsLanguage('nonexistent_lang'), false);
});
