import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  EdgeTTSProvider,
  TTSError,
  escapeXml,
  generateSecMsGec
} from '../src/subtitles/tts/EdgeTTSProvider.js';
import {
  isNeuralLanguageSupported,
  isNeuralVoiceSupported,
  resolveNeuralVoice
} from '../src/subtitles/tts/neuralVoiceRegistry.js';
import { createTTSProvider, AutoTTSProvider } from '../src/subtitles/tts/ttsFactory.js';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { AzureNeuralTTSProvider } from '../src/subtitles/tts/AzureNeuralTTSProvider.js';
import { SpeakerAudioCache } from '../src/subtitles/audio/cache/SpeakerAudioCache.js';

test('1. Neural Language Support & Capability Detection', () => {
  assert.equal(isNeuralLanguageSupported('hi'), true, 'Hindi must be supported');
  assert.equal(isNeuralLanguageSupported('hi-IN'), true, 'Hindi locale must be supported');
  assert.equal(isNeuralLanguageSupported('te'), true, 'Telugu must be supported');
  assert.equal(isNeuralLanguageSupported('te-IN'), true, 'Telugu locale must be supported');
  assert.equal(isNeuralLanguageSupported('en'), true, 'English must be supported');
  assert.equal(isNeuralLanguageSupported('xyz_unsupported'), false, 'Fake language must not be supported');
  assert.equal(isNeuralLanguageSupported(''), false, 'Empty language must not be supported');

  const provider = new EdgeTTSProvider();
  assert.equal(provider.supportsLanguage('hi'), true);
  assert.equal(provider.supportsLanguage('te'), true);
  assert.equal(provider.supportsLanguage('zz'), false);
});

test('2. Neural Voice Registry & Resolution Contract', () => {
  // Hindi Swara & Madhur
  const hiFemale = resolveNeuralVoice('hi', { gender: 'female' });
  assert.ok(hiFemale);
  assert.equal(hiFemale.voiceId, 'hi-IN-SwaraNeural');
  assert.equal(hiFemale.locale, 'hi-IN');

  const hiMale = resolveNeuralVoice('hi', { gender: 'male' });
  assert.ok(hiMale);
  assert.equal(hiMale.voiceId, 'hi-IN-MadhurNeural');
  assert.equal(hiMale.locale, 'hi-IN');

  // Telugu Shruti & Mohan
  const teFemale = resolveNeuralVoice('te', { gender: 'female' });
  assert.ok(teFemale);
  assert.equal(teFemale.voiceId, 'te-IN-ShrutiNeural');
  assert.equal(teFemale.locale, 'te-IN');

  const teMale = resolveNeuralVoice('te', { gender: 'male' });
  assert.ok(teMale);
  assert.equal(teMale.voiceId, 'te-IN-MohanNeural');
  assert.equal(teMale.locale, 'te-IN');

  // Voice supports checks
  assert.equal(isNeuralVoiceSupported('hi-IN-SwaraNeural'), true);
  assert.equal(isNeuralVoiceSupported('hi-IN-MadhurNeural'), true);
  assert.equal(isNeuralVoiceSupported('te-IN-ShrutiNeural'), true);
  assert.equal(isNeuralVoiceSupported('te-IN-MohanNeural'), true);
  assert.equal(isNeuralVoiceSupported('non_existent_voice'), false);

  // Fallback to voiceId string match
  const explicitSwara = resolveNeuralVoice('hi', { voiceId: 'hi-IN-SwaraNeural' });
  assert.equal(explicitSwara.voiceId, 'hi-IN-SwaraNeural');

  // Abstract voice ID mapping (e.g. hi_voice_1 -> Swara, hi_voice_2 -> Madhur)
  const mapped1 = resolveNeuralVoice('hi', { voiceId: 'hi_voice_1' });
  assert.equal(mapped1.voiceId, 'hi-IN-SwaraNeural');
  const mapped2 = resolveNeuralVoice('hi', { voiceId: 'hi_voice_2' });
  assert.equal(mapped2.voiceId, 'hi-IN-MadhurNeural');
});

test('3. SSML & XML Sanitization Prevents Malformed Injections', () => {
  const dangerous = `Hello <script>alert("hack")</script> & 'goodbye' > < "done"`;
  const sanitized = escapeXml(dangerous);
  assert.equal(sanitized.includes('<script>'), false);
  assert.equal(sanitized.includes('&amp;'), true);
  assert.equal(sanitized.includes('&lt;'), true);
  assert.equal(sanitized.includes('&gt;'), true);
  assert.equal(sanitized.includes('&quot;'), true);
  assert.equal(sanitized.includes('&apos;'), true);
});

test('4. Sec-MS-GEC Token Generation Integrity', () => {
  const token = generateSecMsGec(0);
  assert.equal(typeof token, 'string');
  assert.equal(token.length, 64);
  assert.ok(/^[0-9A-F]{64}$/.test(token), 'Must be uppercase 64-character SHA-256 hex');

  // Skew adjustment changes hash deterministically
  const skewedToken = generateSecMsGec(600);
  assert.notEqual(token, skewedToken);
});

test('5. Error Classification — Unsupported Language & Empty Text', async () => {
  const provider = new EdgeTTSProvider();

  // Unsupported language
  await assert.rejects(
    async () => {
      await provider.synthesize('Hello', 'zz_unsupported_lang');
    },
    (err) => {
      assert.ok(err instanceof TTSError);
      assert.equal(err.code, 'TTS_LANGUAGE_UNAVAILABLE');
      return true;
    }
  );

  // Empty text
  await assert.rejects(
    async () => {
      await provider.synthesize('   ', 'hi');
    },
    (err) => {
      assert.ok(err instanceof TTSError);
      assert.equal(err.code, 'TTS_SYNTHESIS_FAILED');
      return true;
    }
  );
});

test('6. Error Classification — Network Timeout Handling', async () => {
  // Set tiny timeout of 1ms to trigger timeout
  const provider = new EdgeTTSProvider({ timeoutMs: 1, maxRetries: 0 });

  await assert.rejects(
    async () => {
      await provider.synthesize('नमस्ते दुनिया', 'hi');
    },
    (err) => {
      assert.ok(err instanceof TTSError);
      assert.ok(err.code === 'TTS_NETWORK_ERROR' || err.code === 'TTS_SYNTHESIS_FAILED');
      return true;
    }
  );
});

test('7. TTS Factory & Provider Mode Switching', () => {
  // Default is system (NodeTTSProvider)
  const defaultProvider = createTTSProvider();
  assert.ok(defaultProvider instanceof NodeTTSProvider);
  assert.equal(defaultProvider.constructor.name, 'NodeTTSProvider');

  // Explicit neural provider
  const neuralProvider = createTTSProvider({ provider: 'neural' });
  assert.ok(neuralProvider instanceof EdgeTTSProvider);
  assert.equal(neuralProvider.constructor.name, 'EdgeTTSProvider');

  // Explicit azure provider
  const azureProvider = createTTSProvider({ provider: 'azure' });
  assert.ok(azureProvider instanceof AzureNeuralTTSProvider);

  // Auto provider
  const autoProvider = createTTSProvider({ provider: 'auto' });
  assert.ok(autoProvider instanceof AutoTTSProvider);

  // Pre-existing instance passthrough
  const existing = new EdgeTTSProvider();
  const passed = createTTSProvider(existing);
  assert.strictEqual(passed, existing);
});

test('8. Cache Isolation & Corruption Resilience', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cache_unit_test_'));
  try {
    const audioCache = new SpeakerAudioCache(tmpDir);

    const neuralKeyParams = {
      videoFingerprint: 'fp_123',
      speakerId: 'spk_000001',
      segmentId: 'seg_000001',
      text: 'नमस्ते दुनिया',
      sourceLanguage: 'en',
      targetLanguage: 'hi',
      voiceId: 'hi-IN-SwaraNeural',
      provider: 'EdgeTTSProvider',
      config: 'real-speech-v1'
    };

    const systemKeyParams = {
      ...neuralKeyParams,
      voiceId: 'hi_voice_1',
      provider: 'NodeTTSProvider'
    };

    const neuralKey = audioCache.computeKey(neuralKeyParams);
    const systemKey = audioCache.computeKey(systemKeyParams);

    // Assert cache keys are strictly distinct between providers
    assert.notEqual(neuralKey, systemKey, 'Neural cache key must never collide with system TTS cache key');

    // Create a dummy valid audio clip for testing cache save/get
    const dummyAudio = path.join(tmpDir, 'dummy.wav');
    // Write valid WAV header + modulated data
    const wavBuffer = Buffer.alloc(44 + 44100 * 2);
    wavBuffer.write('RIFF', 0);
    wavBuffer.writeUInt32LE(36 + 44100 * 2, 4);
    wavBuffer.write('WAVE', 8);
    wavBuffer.write('fmt ', 12);
    wavBuffer.writeUInt32LE(16, 16);
    wavBuffer.writeUInt16LE(1, 20); // PCM
    wavBuffer.writeUInt16LE(1, 22); // Mono
    wavBuffer.writeUInt32LE(44100, 24);
    wavBuffer.writeUInt32LE(88200, 28);
    wavBuffer.writeUInt16LE(2, 32);
    wavBuffer.writeUInt16LE(16, 34);
    wavBuffer.write('data', 36);
    wavBuffer.writeUInt32LE(44100 * 2, 40);
    fs.writeFileSync(dummyAudio, wavBuffer);

    // Save entry
    const saved = audioCache.saveSegmentAudio(neuralKeyParams, dummyAudio, 1.0);
    assert.ok(saved);

    // Cache hit
    const hit = audioCache.getSegmentAudio(neuralKeyParams);
    assert.ok(hit);
    assert.equal(hit.cached, true);

    // Corrupt the cached file (truncate to 10 bytes)
    fs.writeFileSync(hit.audioPath, Buffer.alloc(10));

    // Corrupt entry should be discarded and deleted automatically
    const afterCorrupt = audioCache.getSegmentAudio(neuralKeyParams);
    assert.equal(afterCorrupt, null, 'Corrupt cache entry must be discarded and return null');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
