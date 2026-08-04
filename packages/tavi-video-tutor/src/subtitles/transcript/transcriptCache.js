import fs from 'fs';
import path from 'path';

export class TranscriptCache {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.transcriptsDir = path.join(cwd, '.aitutor', 'transcripts');
    fs.mkdirSync(this.transcriptsDir, { recursive: true });
  }

  getTranscriptPath(videoId) {
    return path.join(this.transcriptsDir, `${videoId}.json`);
  }

  hasMasterTranscript(videoId, expectedFingerprint = null) {
    const p = this.getTranscriptPath(videoId);
    if (!fs.existsSync(p)) return false;
    if (!expectedFingerprint) return true;

    try {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      return !data.fingerprint || data.fingerprint === expectedFingerprint;
    } catch (_) {
      return false;
    }
  }

  loadMasterTranscript(videoId, expectedFingerprint = null) {
    const p = this.getTranscriptPath(videoId);
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (expectedFingerprint && data.fingerprint && data.fingerprint !== expectedFingerprint) {
          return null;
        }
        // Normalize structure if loaded from legacy format
        if (!data.normalized && data.segments) {
          data.normalized = { segments: data.segments };
        }
        if (!data.raw && data.segments) {
          data.raw = { segments: data.segments };
        }
        if (!data.segments && data.normalized?.segments) {
          data.segments = data.normalized.segments;
        }
        return data;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  saveMasterTranscript(videoId, sourceLanguage, rawSegments, normalizedSegments = null, fingerprint = null) {
    const p = this.getTranscriptPath(videoId);
    const rawList = Array.isArray(rawSegments) ? rawSegments : [];
    const normList = Array.isArray(normalizedSegments) ? normalizedSegments : rawList;

    const data = {
      videoId,
      fingerprint: fingerprint || null,
      sourceLanguage: sourceLanguage || 'en',
      createdAt: new Date().toISOString(),
      raw: {
        segments: rawList
      },
      normalized: {
        segments: normList
      },
      segments: normList // Backward compatibility
    };

    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
    return data;
  }
}
