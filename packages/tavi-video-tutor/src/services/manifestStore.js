const cachedManifests = new Map();
const manifestFetches = new Map();

export const clearManifestCache = (manifestUrl = null) => {
  if (manifestUrl) {
    cachedManifests.delete(manifestUrl);
    manifestFetches.delete(manifestUrl);
  } else {
    cachedManifests.clear();
    manifestFetches.clear();
  }
};

export const normalizeSrc = (src) => {
  if (!src || typeof src !== 'string') return '';
  let clean = src.trim();
  try {
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const url = new URL(clean);
      clean = url.pathname;
    }
  } catch (_) {}
  clean = clean.replace(/^\.?\/?public\//i, '/').replace(/^\.\//, '');
  if (!clean.startsWith('/') && !clean.startsWith('http')) {
    clean = '/' + clean;
  }
  return clean;
};

export const loadManifest = async (manifestUrl = '/aitutor/manifest.json', options = {}) => {
  if (options.forceReload) {
    cachedManifests.delete(manifestUrl);
    manifestFetches.delete(manifestUrl);
  }

  if (cachedManifests.has(manifestUrl)) return cachedManifests.get(manifestUrl);

  if (manifestFetches.has(manifestUrl)) return manifestFetches.get(manifestUrl);

  const fetchPromise = (async () => {
    try {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        return null;
      }
      const response = await fetch(manifestUrl);
      if (response.ok) {
        const manifest = await response.json();
        cachedManifests.set(manifestUrl, manifest);
        return manifest;
      }
    } catch (_) {
      // Manifest not found or not generated yet
    } finally {
      manifestFetches.delete(manifestUrl);
    }
    return null;
  })();

  manifestFetches.set(manifestUrl, fetchPromise);
  return fetchPromise;
};

export const resolveManifestSubtitle = async (videoSrc, videoId = null, manifestUrl = '/aitutor/manifest.json') => {
  if (!videoSrc) return null;

  const manifest = await loadManifest(manifestUrl);
  if (!manifest || typeof manifest !== 'object') return null;

  const entries = Object.values(manifest);

  // 1. Match by explicit videoId
  if (videoId && manifest[videoId]) {
    return manifest[videoId];
  }

  // 2. Match by exact src URL
  const exactMatch = entries.find(entry => entry.src === videoSrc);
  if (exactMatch) {
    return exactMatch;
  }

  // 3. Match by normalized src (stripping ./public/, leading slashes, origin)
  const normInput = normalizeSrc(videoSrc);
  const normMatch = entries.find(entry => normalizeSrc(entry.src) === normInput);
  if (normMatch) {
    return normMatch;
  }

  return null;
};
