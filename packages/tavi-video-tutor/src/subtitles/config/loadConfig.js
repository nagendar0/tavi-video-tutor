import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { AITUTOR_LANGUAGES } from '../languages/registry.js';

export class VideoEntry {
  constructor(entry, defaultLanguages = ['en'], defaultIndex = 1) {
    if (typeof entry === 'string') {
      this.src = entry;
      this.id = this.deriveIdFromSrc(entry, defaultIndex);
      this.languages = defaultLanguages;
    } else if (entry && typeof entry === 'object' && entry.src) {
      this.src = entry.src;
      this.id = entry.id || this.deriveIdFromSrc(entry.src, defaultIndex);
      this.languages = entry.subtitles?.languages || entry.languages || defaultLanguages;
    } else {
      throw new Error('Malformed video configuration entry');
    }

    if (this.languages === 'all') {
      this.languages = AITUTOR_LANGUAGES.map(l => l.code);
    } else if (!Array.isArray(this.languages)) {
      this.languages = ['en'];
    }
  }

  deriveIdFromSrc(src, index) {
    if (!src) return `video_${index}`;
    const clean = src.split('?')[0].split('#')[0];
    const filename = clean.split('/').pop() || `video_${index}`;
    return filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

export const loadConfig = async (cwd = process.cwd()) => {
  const configNames = ['aitutor.config.js', 'aitutor.config.mjs', 'aitutor.config.cjs', 'aitutor.config.json'];
  let configPath = null;

  for (const name of configNames) {
    const p = path.join(cwd, name);
    if (fs.existsSync(p)) {
      configPath = p;
      break;
    }
  }

  if (!configPath) {
    throw new Error(`AITutor configuration file not found in ${cwd}. Please create aitutor.config.js.`);
  }

  let rawConfig = null;
  if (configPath.endsWith('.json')) {
    rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    const fileUrl = pathToFileURL(configPath).href;
    const mod = await import(fileUrl);
    rawConfig = mod.default || mod.config || mod;
  }

  if (!rawConfig || !Array.isArray(rawConfig.videos)) {
    throw new Error(`Invalid configuration in ${configPath}. Expected { videos: [...] }.`);
  }

  let globalLanguages = rawConfig.subtitles?.languages || ['en'];
  if (globalLanguages === 'all') {
    globalLanguages = AITUTOR_LANGUAGES.map(l => l.code);
  }

  const videos = [];
  const seenIds = new Set();

  rawConfig.videos.forEach((entry, idx) => {
    const video = new VideoEntry(entry, globalLanguages, idx + 1);
    if (seenIds.has(video.id)) {
      throw new Error(`Duplicate video ID "${video.id}" found in configuration.`);
    }
    seenIds.add(video.id);
    videos.push(video);
  });

  const quality = rawConfig.subtitles?.quality || 'balanced';
  const transcription = rawConfig.subtitles?.transcription || {};
  const translation = rawConfig.subtitles?.translation || {};
  const glossary = Array.isArray(rawConfig.subtitles?.glossary) ? rawConfig.subtitles.glossary : [];

  return {
    configPath,
    globalLanguages,
    quality,
    transcription,
    translation,
    glossary,
    videos
  };
};
