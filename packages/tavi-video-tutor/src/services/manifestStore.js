const cachedManifests = new Map();
const manifestFetches = new Map();

export const loadManifest = async (manifestUrl = '/aitutor/manifest.json') => {
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

export const resolveManifestSubtitle = async (videoSrc, videoId = null) => {
  if (!videoSrc) return null;

  const manifest = await loadManifest();
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

  return null;
};
