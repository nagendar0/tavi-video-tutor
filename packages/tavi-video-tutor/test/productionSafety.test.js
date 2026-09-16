import test from 'node:test';
import assert from 'node:assert/strict';
import { NodeTTSProvider } from '../src/subtitles/tts/NodeTTSProvider.js';
import { VideoEntry } from '../src/subtitles/config/loadConfig.js';
import { SpeakerDiarizer } from '../src/subtitles/audio/diarization/SpeakerDiarizer.js';

test('production safety: synthetic TTS is disabled unless explicitly enabled', () => {
  const provider = new NodeTTSProvider();
  assert.equal(provider.allowSyntheticFallback, false);
});

test('production safety: configured video IDs cannot escape artifact directories', () => {
  assert.throws(
    () => new VideoEntry({ id: '../outside', src: 'lesson.mp4' }),
    /invalid video id/i
  );
});

test('production safety: diarization reports unavailable without audio rather than inventing speakers', async () => {
  const diarizer = new SpeakerDiarizer();
  const result = await diarizer.diarize(null, [{ start: 0, end: 1, text: 'hello' }]);
  assert.equal(result.status, 'unavailable');
  assert.equal(result.detectedSpeakerCount, 0);
  assert.deepEqual(result.segments, []);
});
