import test from 'node:test';
import assert from 'node:assert';

// Mock Component State & Subtitle Engine
class MockPlayerState {
  constructor(options = {}) {
    this.src = options.src || '/lesson.mp4';
    this.subtitles = options.subtitles;
    this.manifestSubtitles = options.manifestSubtitles || {};
    this.localSubtitles = options.localSubtitles || {};
    this.demoSubtitles = options.demoSubtitles || {};
    this.transcribeCallCount = 0;
    this.renderCount = 0;
    this.isTranscribingRef = false;
    this.selectedSubLanguage = 'en';
    this.errorCount = 0;
  }

  get combinedSubtitles() {
    return {
      ...this.demoSubtitles,
      ...this.manifestSubtitles,
      ...(typeof this.subtitles === 'object' ? this.subtitles : {}),
      ...this.localSubtitles
    };
  }

  async evaluateAutoTranscribe(forceError = false) {
    this.renderCount++;

    const hasAnySubtitles = Object.keys(this.combinedSubtitles).length > 0 || 
                             this.subtitles === false || 
                             (this.subtitles && typeof this.subtitles === 'object' && Object.keys(this.subtitles).length > 0);

    if (hasAnySubtitles) {
      return { status: 'bypassed-subtitles-exist' };
    }

    if (this.isTranscribingRef) {
      return { status: 'bypassed-concurrency-lock' };
    }

    this.isTranscribingRef = true;
    this.transcribeCallCount++;

    await new Promise(resolve => setTimeout(resolve, 0));

    try {
      if (forceError) {
        throw new Error('Forced AITranscriber Exception');
      }
      return { status: 'transcribed' };
    } catch (err) {
      this.errorCount++;
      return { status: 'error-handled', error: err.message };
    } finally {
      this.isTranscribingRef = false;
    }
  }
}

test('TEST 1: Generated subtitles exist -> Expected: Browser AI never starts', async () => {
  const player = new MockPlayerState({
    src: '/lesson.mp4',
    manifestSubtitles: { en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHello' }
  });

  const res = await player.evaluateAutoTranscribe();
  assert.strictEqual(res.status, 'bypassed-subtitles-exist');
  assert.strictEqual(player.transcribeCallCount, 0);
});

test('TEST 2: No subtitles exist -> Expected: Browser AI starts once', async () => {
  const player = new MockPlayerState({
    src: '/lesson.mp4',
    manifestSubtitles: {},
    subtitles: undefined
  });

  const res = await player.evaluateAutoTranscribe();
  assert.strictEqual(res.status, 'transcribed');
  assert.strictEqual(player.transcribeCallCount, 1);
});

test('TEST 3: Generated subtitles exist -> Mount component 100 times -> Expected: Called 0 times', async () => {
  const player = new MockPlayerState({
    src: '/lesson.mp4',
    manifestSubtitles: { en: 'WEBVTT\n\n1\n00:00:00.000 --> 00:00:02.000\nHello' }
  });

  for (let i = 0; i < 100; i++) {
    await player.evaluateAutoTranscribe();
  }

  assert.strictEqual(player.transcribeCallCount, 0);
  assert.strictEqual(player.renderCount, 100);
});

test('TEST 4: Force AITranscriber exception -> Expected: 1 error, no infinite render loop', async () => {
  const player = new MockPlayerState({
    src: '/lesson.mp4',
    manifestSubtitles: {}
  });

  const res = await player.evaluateAutoTranscribe(true);
  assert.strictEqual(res.status, 'error-handled');
  assert.strictEqual(player.errorCount, 1);
  assert.strictEqual(player.isTranscribingRef, false);
  assert.strictEqual(player.renderCount, 1);
});

test('TEST 5: Rapid video switching -> Expected: No duplicate transcription jobs', async () => {
  const player = new MockPlayerState({
    src: '/video1.mp4',
    manifestSubtitles: {}
  });

  const p1 = player.evaluateAutoTranscribe();
  const p2 = player.evaluateAutoTranscribe();
  const p3 = player.evaluateAutoTranscribe();

  const results = await Promise.all([p1, p2, p3]);
  const transcribedCount = results.filter(r => r.status === 'transcribed').length;
  const lockedCount = results.filter(r => r.status === 'bypassed-concurrency-lock').length;

  assert.strictEqual(transcribedCount, 1);
  assert.strictEqual(lockedCount, 2);
});

test('TEST 6: Rapid language switching -> Expected: No browser freeze', async () => {
  const player = new MockPlayerState({
    src: '/lesson.mp4',
    manifestSubtitles: { en: 'WEBVTT\n...', es: 'WEBVTT\n...', te: 'WEBVTT\n...' }
  });

  const langs = ['en', 'es', 'te', 'hi', 'fr', 'de', 'ja', 'zh'];
  for (const lang of langs) {
    player.selectedSubLanguage = lang;
    await player.evaluateAutoTranscribe();
  }

  assert.strictEqual(player.transcribeCallCount, 0);
});
