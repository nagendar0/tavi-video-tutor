let cachedManifest = null;
let fetchPromise = null;

export const loadManifest = async (manifestUrl = '/aitutor/manifest.json') => {
  if (cachedManifest) return cachedManifest;

  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        return null;
      }
      const response = await fetch(manifestUrl);
      if (response.ok) {
        cachedManifest = await response.json();
        return cachedManifest;
      }
    } catch (_) {
      // Manifest not found or not generated yet
    } finally {
      fetchPromise = null;
    }
    return null;
  })();

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

  // 3. Match by normalized filename/basename
  const getBasename = (urlStr) => {
    if (!urlStr) return '';
    const clean = urlStr.split('?')[0].split('#')[0];
    return clean.split('/').pop() || '';
  };

  const targetBasename = getBasename(videoSrc);
  if (targetBasename) {
    const filenameMatch = entries.find(entry => getBasename(entry.src) === targetBasename);
    if (filenameMatch) {
      return filenameMatch;
    }
  }

  return null;
};
