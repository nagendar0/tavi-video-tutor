import fs from 'fs';
import path from 'path';

/**
 * Speaker Voice Assignment Cache.
 * 
 * Persists speakerId + targetLanguage -> voiceId mappings to disk
 * under .aitutor/cache/speaker-voice-assignments.json.
 * 
 * Ensures generation resumes use identical voices and avoids voice hopping across runs.
 */
export class SpeakerVoiceCache {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.cacheDir = path.join(cwd, '.aitutor', 'cache');
    this.cacheFile = path.join(this.cacheDir, 'speaker-voice-assignments.json');
    this.memoryCache = new Map();
    this.loaded = false;
  }

  load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (fs.existsSync(this.cacheFile)) {
        const data = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
        Object.entries(data).forEach(([key, val]) => {
          this.memoryCache.set(key, val);
        });
      }
    } catch (_) {
      // Non-fatal if cache read fails
    }
  }

  save() {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      const obj = {};
      this.memoryCache.forEach((val, key) => {
        obj[key] = val;
      });
      const tempFile = `${this.cacheFile}.tmp_${Date.now()}`;
      fs.writeFileSync(tempFile, JSON.stringify(obj, null, 2), 'utf8');
      fs.renameSync(tempFile, this.cacheFile);
    } catch (_) {
      // Non-fatal if cache write fails
    }
  }

  makeKey(videoFingerprint, speakerId, targetLanguage) {
    const fp = String(videoFingerprint || 'default').trim();
    const spk = String(speakerId).trim();
    const lang = String(targetLanguage).toLowerCase().trim();
    return `${fp}::${spk}::${lang}`;
  }

  getAssignment(videoFingerprint, speakerId, targetLanguage) {
    this.load();
    const key = this.makeKey(videoFingerprint, speakerId, targetLanguage);
    return this.memoryCache.get(key) || null;
  }

  saveAssignment(videoFingerprint, speakerId, targetLanguage, voiceData) {
    this.load();
    const key = this.makeKey(videoFingerprint, speakerId, targetLanguage);
    this.memoryCache.set(key, voiceData);
    this.save();
  }

  saveJobAssignments(videoFingerprint, targetLanguage, assignmentsMap) {
    this.load();
    for (const [spkId, voiceData] of Object.entries(assignmentsMap)) {
      const key = this.makeKey(videoFingerprint, spkId, targetLanguage);
      this.memoryCache.set(key, voiceData);
    }
    this.save();
  }

  getJobAssignments(videoFingerprint, targetLanguage) {
    this.load();
    const prefix = `${String(videoFingerprint || 'default').trim()}::`;
    const suffix = `::${String(targetLanguage).toLowerCase().trim()}`;
    const result = {};

    for (const [key, val] of this.memoryCache.entries()) {
      if (key.startsWith(prefix) && key.endsWith(suffix)) {
        const parts = key.split('::');
        const spkId = parts[1];
        result[spkId] = val;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  clear() {
    this.memoryCache.clear();
    try {
      if (fs.existsSync(this.cacheFile)) {
        fs.unlinkSync(this.cacheFile);
      }
    } catch (_) {}
  }
}

export default SpeakerVoiceCache;
