/**
 * Central Quality Resolver
 * 
 * Implements 5-tier Quality Source Priority (Highest to Lowest):
 * 1. Adaptive HLS stream levels (hlsQualities)
 * 2. Developer top-level qualities prop (qualities)
 * 3. Config qualities (config.qualities)
 * 4. Config file qualities (config.file.qualities)
 * 5. Generated Manifest qualities (manifestQualities)
 */

export function resolveQualitySources({
  hlsQualities = [],
  qualities = [],
  config = {},
  manifestQualities = []
} = {}) {
  // 1. Adaptive HLS levels override everything
  if (Array.isArray(hlsQualities) && hlsQualities.length > 0) {
    return {
      qualities: hlsQualities,
      source: 'hls'
    };
  }

  // 2. Explicit developer qualities prop
  if (Array.isArray(qualities) && qualities.length > 0) {
    return {
      qualities,
      source: 'prop'
    };
  }

  // 3. Config qualities (config.qualities)
  if (config?.qualities && Array.isArray(config.qualities) && config.qualities.length > 0) {
    return {
      qualities: config.qualities,
      source: 'config'
    };
  }

  // 4. Config file qualities (config.file.qualities)
  if (config?.file?.qualities && Array.isArray(config.file.qualities) && config.file.qualities.length > 0) {
    return {
      qualities: config.file.qualities,
      source: 'config.file'
    };
  }

  // 5. Manifest qualities
  if (Array.isArray(manifestQualities) && manifestQualities.length > 0) {
    return {
      qualities: manifestQualities,
      source: 'manifest'
    };
  }

  return {
    qualities: [],
    source: 'none'
  };
}

export default resolveQualitySources;
