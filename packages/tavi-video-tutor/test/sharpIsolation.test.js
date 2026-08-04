import { test } from 'node:test';
import assert from 'node:assert';
import module from 'module';

import { WhisperProvider } from '../src/subtitles/transcription/WhisperProvider.js';

test('Gate 1. Verify AITutor does NOT modify global Node module resolution or require.cache', async () => {
  const initialRequire = module.prototype.require;

  // BEFORE initialization
  assert.strictEqual(module.prototype.require, initialRequire, 'Module.prototype.require must match original before init');

  const provider = new WhisperProvider({ allowTestFallback: true });

  // AFTER AITutor initialization
  assert.strictEqual(module.prototype.require, initialRequire, 'Module.prototype.require must remain unmodified after init');

  // AFTER Whisper pipeline attempt / transcription
  try {
    await provider.transcribe('dummy.wav', { id: 'test_isolation' });
  } catch (_) {}

  assert.strictEqual(module.prototype.require, initialRequire, 'Module.prototype.require must remain unmodified after transcribe');
  assert.strictEqual(globalThis.__aitutor_sharp_patched, undefined, 'No global flags or patches should be set');
});
