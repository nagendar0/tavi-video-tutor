/**
 * Central Video Quality Availability & Source Resolver
 * 
 * Implements 5-tier Quality Source Priority (Highest to Lowest):
 * 1. Adaptive HLS stream levels (hlsQualities)
 * 2. Developer top-level qualities prop (qualities)
 * 3. Config qualities (config.qualities)
 * 4. Config file qualities (config.file.qualities)
 * 5. Generated Manifest qualities (manifestQualities)
 */

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze([]);

function normalizeQualities(list) {
  if (!Array.isArray(list)) return [];
  return list.map((q, idx) => {
    if (typeof q === 'string') {
      return { label: q, src: q, index: idx };
    }
    if (typeof q === 'object' && q !== null) {
      const derivedLabel = q.label || q.name || (q.height ? `${q.height}p` : 'Auto');
      const derivedSrc = q.src || q.file || q.url || (typeof q.label === 'string' ? q.label : '');
      return {
        ...q,
        label: derivedLabel,
        src: derivedSrc,
        index: q.index !== undefined ? q.index : idx
      };
    }
    return null;
  }).filter(Boolean);
}

const warnedMissingQuality = new Set();

/**
 * Resets the DX warning deduplication cache for video qualities.
 */
export function clearWarnedQualityCache() {
  warnedMissingQuality.clear();
}

/**
 * Emits a deduplicated DX development console warning when requested video qualities are missing.
 */
export function emitQualityDXWarning(missingList, availableList = [], requestedListOrKey = null, videoKeyParam = 'default') {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production') {
    return;
  }
  if (!missingList || missingList.length === 0) return;

  let requestedList = [];
  let videoKey = 'default';

  if (Array.isArray(requestedListOrKey)) {
    requestedList = requestedListOrKey;
    videoKey = videoKeyParam || 'default';
  } else if (typeof requestedListOrKey === 'string') {
    videoKey = requestedListOrKey;
    requestedList = [...missingList];
  } else {
    requestedList = [...missingList];
  }

  if (!requestedList || requestedList.length === 0) {
    requestedList = [...missingList];
  }

  const reqKey = [...requestedList].sort().join(',');
  const availKey = [...availableList].sort().join(',');
  const missKey = [...missingList].sort().join(',');
  const warnKey = `qualities:${videoKey}:${reqKey}:${availKey}:${missKey}`;

  if (warnedMissingQuality.has(warnKey)) return;
  warnedMissingQuality.add(warnKey);

  const requestedStr = requestedList.join(', ');
  const availableStr = availableList && availableList.length > 0 ? availableList.join(', ') : 'none';
  const missingStr = missingList.join(', ');

  if (typeof console !== 'undefined' && console.warn) {
    console.warn(
      `\n[AITutor DX Warning]\n` +
      `Requested video qualities: ${requestedStr}\n` +
      `Available video qualities: ${availableStr}\n` +
      `Missing: ${missingStr}\n\n` +
      `Generate available video qualities using:\n` +
      `npx aitutor generate\n`
    );
  }
}

/**
 * Raw Quality Sources Resolver (preserves source priority tiers)
 */
export function resolveRawQualitySources({
  hlsQualities = [],
  qualities = [],
  config = {},
  manifestQualities = []
} = {}) {
  // 1. Adaptive HLS levels override everything
  if (Array.isArray(hlsQualities) && hlsQualities.length > 0) {
    return {
      rawQualities: normalizeQualities(hlsQualities),
      source: 'hls'
    };
  }

  // 2. Explicit developer qualities prop (when provided as array of objects with distinct src)
  if (Array.isArray(qualities) && qualities.length > 0 && qualities.some(q => typeof q === 'object' && q !== null && q.src && !q.src.startsWith('1080') && !q.src.startsWith('720') && !q.src.startsWith('480') && !q.src.startsWith('360') && !q.src.startsWith('4K') && !q.src.startsWith('2160'))) {
    return {
      rawQualities: normalizeQualities(qualities),
      source: 'prop'
    };
  }

  // 3. Config qualities (config.qualities)
  if (config?.qualities && Array.isArray(config.qualities) && config.qualities.length > 0) {
    return {
      rawQualities: normalizeQualities(config.qualities),
      source: 'config'
    };
  }

  // 4. Config file qualities (config.file.qualities)
  if (config?.file?.qualities && Array.isArray(config.file.qualities) && config.file.qualities.length > 0) {
    return {
      rawQualities: normalizeQualities(config.file.qualities),
      source: 'config.file'
    };
  }

  // 5. Manifest qualities
  if (Array.isArray(manifestQualities) && manifestQualities.length > 0) {
    return {
      rawQualities: normalizeQualities(manifestQualities),
      source: 'manifest'
    };
  }

  // 6. Generic developer qualities prop fallback if none of above
  if (Array.isArray(qualities) && qualities.length > 0) {
    return {
      rawQualities: normalizeQualities(qualities),
      source: 'prop'
    };
  }

  return {
    rawQualities: EMPTY_ARRAY,
    source: 'none'
  };
}

/**
 * SINGLE SOURCE OF TRUTH: Video Quality Availability & Visibility Resolver
 * 
 * Follows the universal availability-first contract:
 * DISCOVERY -> RESOLVER -> RUNTIME FILTER -> VISIBLE VALID OPTIONS
 */
export function resolveQualityAvailability({
  qualitiesConfig,
  qualities,
  hlsQualities = [],
  config = {},
  manifestQualities = [],
  videoKey = 'default'
} = {}) {
  const effectiveConfig = qualitiesConfig !== undefined ? qualitiesConfig : qualities;

  // Disabled mode: qualities={false}
  if (effectiveConfig === false) {
    return {
      enabled: false,
      hasAvailableItems: false,
      hasAvailableQualities: false,
      mode: 'disabled',
      requestedItems: false,
      requestedQualities: false,
      availableItems: EMPTY_ARRAY,
      availableQualities: EMPTY_ARRAY,
      visibleItems: EMPTY_ARRAY,
      visibleQualities: EMPTY_ARRAY,
      resolvedItems: EMPTY_ARRAY,
      resolvedQualities: EMPTY_ARRAY,
      qualities: EMPTY_ARRAY,
      sourceByItem: {},
      sourceByQuality: {},
      source: 'none',
      primarySource: 'none',
      missingItems: EMPTY_ARRAY,
      missingQualities: EMPTY_ARRAY,
      reason: 'Video quality selector disabled by developer config (qualities={false}).'
    };
  }

  const hasManifestOrConfigOrHls = (Array.isArray(hlsQualities) && hlsQualities.length > 0) ||
    (config?.qualities && Array.isArray(config.qualities) && config.qualities.length > 0) ||
    (config?.file?.qualities && Array.isArray(config.file.qualities) && config.file.qualities.length > 0) ||
    (Array.isArray(manifestQualities) && manifestQualities.length > 0);

  let mode = 'all';
  let isStringFilter = false;
  let filterList = null;

  if (Array.isArray(effectiveConfig)) {
    if (effectiveConfig.every(item => typeof item === 'string')) {
      if (qualitiesConfig !== undefined || hasManifestOrConfigOrHls) {
        mode = 'filter';
        isStringFilter = true;
        filterList = effectiveConfig;
      } else {
        mode = 'all';
      }
    }
  }

  // Discover actual available renditions across priority tiers
  const { rawQualities, source } = resolveRawQualitySources({
    hlsQualities,
    qualities: isStringFilter ? [] : (Array.isArray(effectiveConfig) ? effectiveConfig : []),
    config,
    manifestQualities
  });

  const availableQualities = rawQualities.map(q => q.label);
  const hasAvailableQualities = rawQualities.length > 0;

  if (!hasAvailableQualities) {
    const missing = isStringFilter ? filterList : EMPTY_ARRAY;
    if (missing.length > 0) {
      emitQualityDXWarning(missing, availableQualities, filterList || missing, videoKey);
    }
    return {
      enabled: false,
      hasAvailableItems: false,
      hasAvailableQualities: false,
      mode,
      requestedItems: effectiveConfig || 'all',
      requestedQualities: effectiveConfig || 'all',
      availableItems: EMPTY_ARRAY,
      availableQualities: EMPTY_ARRAY,
      visibleItems: EMPTY_ARRAY,
      visibleQualities: EMPTY_ARRAY,
      resolvedItems: EMPTY_ARRAY,
      resolvedQualities: EMPTY_ARRAY,
      qualities: EMPTY_ARRAY,
      sourceByItem: {},
      sourceByQuality: {},
      source: 'none',
      primarySource: 'none',
      missingItems: missing,
      missingQualities: missing,
      reason: 'No video quality renditions found in manifest, HLS, or configuration.'
    };
  }

  let visibleQualities = [];
  let missingQualities = [];
  let resolvedQualities = [];

  if (mode === 'all') {
    resolvedQualities = [...rawQualities];
    visibleQualities = resolvedQualities.map(q => q.label);
  } else if (mode === 'filter') {
    const availableMap = new Map();
    rawQualities.forEach(q => {
      availableMap.set(q.label.toLowerCase(), q);
      // Also index by height if available (e.g. "1080" -> "1080p")
      if (q.height) {
        availableMap.set(`${q.height}`.toLowerCase(), q);
        availableMap.set(`${q.height}p`.toLowerCase(), q);
      }
    });

    const matching = [];
    const missing = [];

    filterList.forEach(req => {
      const normalizedReq = String(req).trim().toLowerCase();
      const matched = availableMap.get(normalizedReq);
      if (matched) {
        if (!matching.some(m => m.label === matched.label)) {
          matching.push(matched);
        }
      } else {
        missing.push(req);
      }
    });

    missingQualities = missing;
    resolvedQualities = matching;
    visibleQualities = matching.map(q => q.label);

    if (missingQualities.length > 0) {
      emitQualityDXWarning(missingQualities, availableQualities, filterList, videoKey);
    }
  }

  if (resolvedQualities.length === 0) {
    return {
      enabled: false,
      hasAvailableItems: hasAvailableQualities,
      hasAvailableQualities,
      mode,
      requestedItems: filterList || effectiveConfig,
      requestedQualities: filterList || effectiveConfig,
      availableItems: availableQualities,
      availableQualities,
      visibleItems: EMPTY_ARRAY,
      visibleQualities: EMPTY_ARRAY,
      resolvedItems: EMPTY_ARRAY,
      resolvedQualities: EMPTY_ARRAY,
      qualities: EMPTY_ARRAY,
      sourceByItem: {},
      sourceByQuality: {},
      source,
      primarySource: source,
      missingItems: missingQualities,
      missingQualities,
      reason: missingQualities.length > 0
        ? `Requested video qualities "${missingQualities.join(', ')}" are not available.`
        : 'No visible quality renditions matched the filter.'
    };
  }

  const sourceByQuality = {};
  resolvedQualities.forEach(q => {
    sourceByQuality[q.label] = source;
  });

  return {
    enabled: true,
    hasAvailableItems: true,
    hasAvailableQualities: true,
    mode,
    requestedItems: effectiveConfig || 'all',
    requestedQualities: effectiveConfig || 'all',
    availableItems: availableQualities,
    availableQualities,
    visibleItems: visibleQualities,
    visibleQualities,
    resolvedItems: resolvedQualities,
    resolvedQualities,
    qualities: resolvedQualities, // Backward compatibility for existing code expecting `res.qualities`
    sourceByItem: sourceByQuality,
    sourceByQuality,
    source,
    primarySource: source,
    missingItems: missingQualities.length > 0 ? missingQualities : EMPTY_ARRAY,
    missingQualities: missingQualities.length > 0 ? missingQualities : EMPTY_ARRAY,
    reason: 'Active quality renditions available.'
  };
}

/**
 * Backward compatibility alias for existing callers
 */
export function resolveQualitySources(params = {}) {
  return resolveQualityAvailability(params);
}

export default resolveQualityAvailability;
