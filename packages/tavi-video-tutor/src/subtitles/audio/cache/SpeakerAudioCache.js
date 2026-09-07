import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Granular Segment-Level Audio Cache.
 * 
 * Caches individual synthesized audio clips keyed by:
 * videoFingerprint + speakerId + segmentId + text + targetLanguage + voiceId + provider
 * 
 * Prevents redundant TTS synthesis when only a subset of segments or languages changes.
 */
export class SpeakerAudioCache {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.cacheDir = path.join(cwd, '.aitutor', 'cache', 'audio-segments');
    this.indexFile = path.join(this.cacheDir, 'index.json');
    this.index = new Map();
    this.loaded = false;
  }

  load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (fs.existsSync(this.indexFile)) {
        const data = JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
        Object.entries(data).forEach(([k, v]) => this.index.set(k, v));
      }
    } catch (_) {}
  }

  save() {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      const obj = {};
      this.index.forEach((v, k) => { obj[k] = v; });
      const tempFile = `${this.indexFile}.tmp_${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(obj, null, 2), 'utf8');
      fs.renameSync(tempFile, this.indexFile);
    } catch (_) {}
  }

  computeKey({
    videoFingerprint = 'default',
    speakerId = 'spk_000001',
    segmentId = 'seg_001',
    text = '',
    targetLanguage = 'en',
    voiceId = 'voice_1',
    provider = 'node-tts'
  }) {
    const payload = [
      String(videoFingerprint).trim(),
      String(speakerId).trim(),
      String(segmentId).trim(),
      String(text).trim(),
      String(targetLanguage).toLowerCase().trim(),
      String(voiceId).trim(),
      String(provider).trim()
    ].join('::');

    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 24);
  }

  getSegmentAudio(params) {
    this.load();
    const key = this.computeKey(params);
    const entry = this.index.get(key);

    if (entry && entry.audioPath && fs.existsSync(entry.audioPath)) {
      return {
        cached: true,
        key,
        audioPath: entry.audioPath,
        duration: entry.duration
      };
    }

    return null;
  }

  saveSegmentAudio(params, sourceAudioPath, duration) {
    this.load();
    fs.mkdirSync(this.cacheDir, { recursive: true });

    const key = this.computeKey(params);
    const targetPath = path.join(this.cacheDir, `${key}.wav`);

    if (sourceAudioPath !== targetPath && fs.existsSync(sourceAudioPath)) {
      fs.copyFileSync(sourceAudioPath, targetPath);
    }

    const entry = {
      key,
      audioPath: targetPath,
      duration: Number(duration || 0),
      cachedAt: new Date().toISOString()
    };

    this.index.set(key, entry);
    this.save();
    return entry;
  }

  clear() {
    this.index.clear();
    try {
      if (fs.existsSync(this.cacheDir)) {
        fs.rmSync(this.cacheDir, { recursive: true, force: true });
      }
    } catch (_) {}
  }
}

export default SpeakerAudioCache;
