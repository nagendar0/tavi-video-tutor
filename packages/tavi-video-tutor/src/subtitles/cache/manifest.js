import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getLanguageByCode, normalizeLanguageCode } from '../languages/registry.js';

export const computeMediaFingerprint = (srcOrEntry, cwd = process.cwd(), extra = null, remoteMetadata = null) => {
  const src = typeof srcOrEntry === 'string' ? srcOrEntry : (srcOrEntry && srcOrEntry.src ? srcOrEntry.src : '');
  if (!src) {
    return crypto.createHash('sha256').update(JSON.stringify({ src: '', extra })).digest('hex').substring(0, 16);
  }

  // 1. Remote HTTP/HTTPS URL Media Identity
  if (src.startsWith('http://') || src.startsWith('https://')) {
    let cleanUrl = src;
    try {
      const parsed = new URL(src);
      // Clean sensitive/ephemeral query tokens so identical videos with different signed tokens match if remote metadata matches
      const sensitiveKeys = ['token', 'signature', 'key', 'expires', 'auth', 'sig', 'access_token', 'apiKey'];
      sensitiveKeys.forEach(k => {
        parsed.searchParams.forEach((_, pKey) => {
          if (pKey.toLowerCase().includes(k.toLowerCase())) {
            parsed.searchParams.delete(pKey);
          }
        });
      });
      cleanUrl = parsed.toString();
    } catch (_) {}

    const payload = JSON.stringify({
      url: cleanUrl,
      etag: remoteMetadata?.etag || null,
      lastModified: remoteMetadata?.lastModified || null,
      contentLength: remoteMetadata?.contentLength || null,
      extra
    });
    return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
  }

  // 2. Local File Media Identity
  let localPath = path.isAbsolute(src) ? src : path.join(cwd, src);
  if (!fs.existsSync(localPath) && src.startsWith('/')) {
    const publicPath = path.join(cwd, 'public', src.slice(1));
    if (fs.existsSync(publicPath)) {
      localPath = publicPath;
    }
  }

  if (fs.existsSync(localPath)) {
    try {
      const canonicalPath = path.normalize(fs.realpathSync.native ? fs.realpathSync.native(localPath) : fs.realpathSync(localPath)).replace(/\\/g, '/');
      const stat = fs.statSync(localPath);
      const size = stat.size;
      const mtimeMs = stat.mtimeMs;

      let contentSample = '';
      if (size <= 2 * 1024 * 1024) { // <= 2MB: read full file into hash
        const buf = fs.readFileSync(localPath);
        contentSample = crypto.createHash('sha256').update(buf).digest('hex');
      } else { // > 2MB: sampled head (64KB), middle (64KB), tail (64KB)
        const fd = fs.openSync(localPath, 'r');
        const chunkSize = 64 * 1024;
        const headBuf = Buffer.alloc(chunkSize);
        const midBuf = Buffer.alloc(chunkSize);
        const tailBuf = Buffer.alloc(chunkSize);

        fs.readSync(fd, headBuf, 0, chunkSize, 0);
        fs.readSync(fd, midBuf, 0, chunkSize, Math.floor(size / 2));
        fs.readSync(fd, tailBuf, 0, chunkSize, size - chunkSize);
        fs.closeSync(fd);

        contentSample = crypto.createHash('sha256')
          .update(headBuf)
          .update(midBuf)
          .update(tailBuf)
          .digest('hex');
      }

      const payload = JSON.stringify({
        path: canonicalPath,
        size,
        mtimeMs,
        sample: contentSample,
        extra
      });

      return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
    } catch (_) {
      // Fallback on read error
    }
  }

  // Fallback string hash
  const payload = extra ? JSON.stringify({ src: String(src || ''), extra }) : String(src || '');
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 16);
};

export const computeFingerprint = (src, extra = null, cwd = process.cwd()) => {
  return computeMediaFingerprint(src, cwd, extra);
};

export const normalizeSubtitlePath = (srcUrl, basePublicDir) => {
  if (!srcUrl || typeof srcUrl !== 'string') return null;

  // 1. Normalize slashes to POSIX format
  let clean = srcUrl.trim().replace(/\\/g, '/');

  // 2. Strip leading / or ./
  clean = clean.replace(/^(\.\/|\/)+/, '');

  // 3. Prevent duplicate 'aitutor/' prefix if basePublicDir already ends with 'aitutor'
  const isBaseAitutor = path.basename(basePublicDir) === 'aitutor';
  if (isBaseAitutor && clean.startsWith('aitutor/')) {
    clean = clean.slice('aitutor/'.length);
  }

  // 4. Resolve target path
  const resolvedPath = path.resolve(basePublicDir, clean);

  // 5. Security boundary check — prevent directory traversal outside basePublicDir
  const canonicalBase = path.resolve(basePublicDir);
  if (!resolvedPath.startsWith(canonicalBase + path.sep) && resolvedPath !== canonicalBase) {
    throw new Error(`Security Violation: Subtitle path "${srcUrl}" escapes public directory boundary.`);
  }

  return resolvedPath;
};

export class ManifestStore {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.internalDir = path.join(cwd, '.aitutor');
    this.internalSubDir = path.join(this.internalDir, 'subtitles');
    this.internalAudioDir = path.join(this.internalDir, 'audio');
    this.internalManifestPath = path.join(this.internalDir, 'manifest.json');

    this.publicDir = path.join(cwd, 'public', 'aitutor');
    this.publicSubDir = path.join(this.publicDir, 'subtitles');
    this.publicAudioDir = path.join(this.publicDir, 'audio');
    this.publicManifestPath = path.join(this.publicDir, 'manifest.json');

    fs.mkdirSync(this.internalSubDir, { recursive: true });
    fs.mkdirSync(this.internalAudioDir, { recursive: true });
    fs.mkdirSync(this.publicSubDir, { recursive: true });
    fs.mkdirSync(this.publicAudioDir, { recursive: true });
  }

  loadManifest() {
    if (fs.existsSync(this.internalManifestPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.internalManifestPath, 'utf8'));
      } catch (_) {
        return {};
      }
    }
    return {};
  }

  isCached(videoEntry, force = false, extraFingerprint = null) {
    if (force) return false;

    const manifest = this.loadManifest();
    const entry = manifest[videoEntry.id];
    const fingerprint = extraFingerprint || computeMediaFingerprint(videoEntry, this.cwd);

    if (!entry || entry.fingerprint !== fingerprint) {
      return false;
    }

    const requestedLangs = Array.isArray(videoEntry.languages) ? videoEntry.languages : ['en'];
    return requestedLangs.every(lang => this.isLanguageCached(videoEntry.id, lang, fingerprint));
  }

  isLanguageCached(videoId, langCode, fingerprint = null) {
    const manifest = this.loadManifest();
    const entry = manifest[videoId];
    if (!entry) return false;
    if (fingerprint && entry.fingerprint !== fingerprint) return false;

    const normLang = normalizeLanguageCode(langCode) || langCode;
    const subInfo = entry.subtitles?.[normLang] || entry.subtitles?.[langCode] || (entry.language === normLang || entry.language === langCode ? { src: entry.subtitle } : null);
    if (!subInfo || !subInfo.src) return false;

    try {
      const publicPath = normalizeSubtitlePath(subInfo.src, this.publicDir);
      return fs.existsSync(publicPath);
    } catch (_) {
      return false;
    }
  }

  isAudioLanguageCached(videoId, langCode, fingerprint = null) {
    const manifest = this.loadManifest();
    const entry = manifest[videoId];
    if (!entry) return false;
    if (fingerprint && entry.fingerprint !== fingerprint) return false;

    const normLang = normalizeLanguageCode(langCode) || langCode;
    const audioInfo = entry.audioLanguages?.[normLang] || entry.audioLanguages?.[langCode];
    if (!audioInfo || !audioInfo.src) return false;

    try {
      const publicPath = normalizeSubtitlePath(audioInfo.src, this.publicDir);
      return fs.existsSync(publicPath);
    } catch (_) {
      return false;
    }
  }

  saveSubtitle(videoEntry, vttContent, language = 'en', extraFingerprint = null) {
    return this.saveMultilingualSubtitles(videoEntry, language, { [language]: vttContent }, extraFingerprint)[language]?.src;
  }

  saveMultilingualSubtitles(videoEntry, sourceLanguage, subtitlesMap, extraFingerprint = null) {
    const manifest = this.loadManifest();
    const videoSubDirName = videoEntry.id;
    
    const internalVideoDir = path.join(this.internalSubDir, videoSubDirName);
    const publicVideoDir = path.join(this.publicSubDir, videoSubDirName);

    fs.mkdirSync(internalVideoDir, { recursive: true });
    fs.mkdirSync(publicVideoDir, { recursive: true });

    const fingerprint = extraFingerprint || computeMediaFingerprint(videoEntry, this.cwd);
    const existingEntry = manifest[videoEntry.id] || {};
    const subtitlesEntryMap = existingEntry.subtitles || {};

    Object.entries(subtitlesMap).forEach(([langCode, vttContent]) => {
      const filename = `${langCode}.vtt`;
      const internalFilePath = path.join(internalVideoDir, filename);
      const publicFilePath = path.join(publicVideoDir, filename);
      const publicUrl = `/aitutor/subtitles/${videoSubDirName}/${filename}`;

      // Write files
      fs.writeFileSync(internalFilePath, vttContent, 'utf8');
      fs.writeFileSync(publicFilePath, vttContent, 'utf8');

      // Legacy flat copy for backwards compatibility
      const flatFilename = `${videoEntry.id}.${langCode}.vtt`;
      fs.writeFileSync(path.join(this.internalSubDir, flatFilename), vttContent, 'utf8');
      fs.writeFileSync(path.join(this.publicSubDir, flatFilename), vttContent, 'utf8');

      const langMeta = getLanguageByCode(langCode);
      const label = langMeta ? (langMeta.nativeName || langMeta.name) : langCode;

      subtitlesEntryMap[langCode] = {
        src: publicUrl,
        label: label,
        name: langMeta ? langMeta.name : langCode
      };
    });

    const container = existingEntry.source?.container || path.extname(videoEntry.src || '').replace('.', '') || 'mp4';

    manifest[videoEntry.id] = {
      ...existingEntry,
      id: videoEntry.id,
      src: videoEntry.src,
      source: existingEntry.source || {
        src: videoEntry.src,
        container: container,
        sourceLanguage: sourceLanguage || 'en'
      },
      playback: existingEntry.playback || (existingEntry.qualities ? { qualities: existingEntry.qualities } : {}),
      sourceLanguage: sourceLanguage || existingEntry.sourceLanguage || 'en',
      language: sourceLanguage || existingEntry.sourceLanguage || 'en',
      subtitle: subtitlesEntryMap['en']?.src || Object.values(subtitlesEntryMap)[0]?.src || '',
      subtitles: subtitlesEntryMap,
      ...(existingEntry.qualities && Array.isArray(existingEntry.qualities) ? { qualities: existingEntry.qualities } : {}),
      ...(existingEntry.audioLanguages ? { audioLanguages: existingEntry.audioLanguages } : {}),
      fingerprint: fingerprint,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(this.internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    fs.writeFileSync(this.publicManifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return subtitlesEntryMap;
  }

  saveMultilingualAudio(videoEntry, sourceLanguage, audioMap, extraFingerprint = null) {
    const manifest = this.loadManifest();
    const videoSubDirName = videoEntry.id;

    const internalAudioSubDir = path.join(this.internalAudioDir, videoSubDirName);
    const publicAudioSubDir = path.join(this.publicAudioDir, videoSubDirName);

    fs.mkdirSync(internalAudioSubDir, { recursive: true });
    fs.mkdirSync(publicAudioSubDir, { recursive: true });

    const fingerprint = extraFingerprint || computeMediaFingerprint(videoEntry, this.cwd);
    const existingEntry = manifest[videoEntry.id] || {};
    const audioLanguagesEntryMap = existingEntry.audioLanguages || {};
    const container = existingEntry.source?.container || path.extname(videoEntry.src || '').replace('.', '') || 'mp4';

    Object.entries(audioMap).forEach(([langCode, audioData]) => {
      const srcFile = typeof audioData === 'string' ? audioData : audioData.filePath || audioData.src;
      const filename = `${langCode}.m4a`;
      const internalFilePath = path.join(internalAudioSubDir, filename);
      const publicFilePath = path.join(publicAudioSubDir, filename);
      const publicUrl = `/aitutor/audio/${videoSubDirName}/${filename}`;

      if (srcFile && fs.existsSync(srcFile) && srcFile !== publicFilePath && srcFile !== internalFilePath) {
        fs.copyFileSync(srcFile, internalFilePath);
        fs.copyFileSync(srcFile, publicFilePath);
      }

      const langMeta = getLanguageByCode(langCode);
      const label = langMeta ? (langMeta.nativeName ? `${langMeta.nativeName} / ${langMeta.name}` : langMeta.name) : langCode;

      audioLanguagesEntryMap[langCode] = {
        label: audioData.label || label,
        src: publicUrl,
        language: langCode,
        source: langCode === (sourceLanguage || existingEntry.sourceLanguage || 'en'),
        speakerAware: Boolean(audioData && (audioData.speakerAware !== undefined ? audioData.speakerAware : true))
      };
    });

    manifest[videoEntry.id] = {
      ...existingEntry,
      id: videoEntry.id,
      src: videoEntry.src,
      source: existingEntry.source || {
        src: videoEntry.src,
        container: container,
        sourceLanguage: sourceLanguage || existingEntry.sourceLanguage || 'en'
      },
      playback: existingEntry.playback || (existingEntry.qualities ? { qualities: existingEntry.qualities } : {}),
      sourceLanguage: sourceLanguage || existingEntry.sourceLanguage || 'en',
      audioLanguages: audioLanguagesEntryMap,
      fingerprint: fingerprint,
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(this.internalManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    fs.writeFileSync(this.publicManifestPath, JSON.stringify(manifest, null, 2), 'utf8');

    return audioLanguagesEntryMap;
  }

  saveSpeakerMetadata(videoId, metadata) {
    const metaDir = path.join(this.internalDir, 'metadata');
    fs.mkdirSync(metaDir, { recursive: true });
    const metaFile = path.join(metaDir, `${videoId}-speakers.json`);
    fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2), 'utf8');
    return metaFile;
  }

  loadSpeakerMetadata(videoId) {
    const metaFile = path.join(this.internalDir, 'metadata', `${videoId}-speakers.json`);
    if (fs.existsSync(metaFile)) {
      try {
        return JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      } catch (_) {}
    }
    return null;
  }
}
