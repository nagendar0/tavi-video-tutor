/**
 * Central Quality Planner
 * 
 * Standard Quality Ladder Heights: [2160, 1440, 1080, 720, 480, 360, 240, 144]
 * 
 * Rules:
 * 1. NO UPSCALING: Never generate renditions with height greater than source height.
 * 2. Preserve Aspect Ratio: Calculate target width = Math.round(targetHeight * (srcWidth / srcHeight)).
 * 3. H.264 Encoder Safety: Ensure both width and height are even integers (divisible by 2).
 */

export const STANDARD_HEIGHTS = [2160, 1440, 1080, 720, 480, 360, 240, 144];

export const makeEven = (num) => {
  const rounded = Math.round(num);
  return rounded % 2 === 0 ? rounded : rounded - 1;
};

export const planQualityLadder = (probeInfo, configOptions = {}) => {
  if (!probeInfo || !probeInfo.height || !probeInfo.width) {
    throw new Error('QualityPlanner Error: Invalid probeInfo provided');
  }

  const { width: srcW, height: srcH } = probeInfo;
  const isPortrait = srcH > srcW;

  // Check if quality generation is explicitly disabled in config
  if (configOptions.generate === false || configOptions.qualities === false) {
    return {
      enabled: false,
      reason: 'Quality generation disabled via configuration',
      source: { label: `${srcH}p`, width: srcW, height: srcH },
      renditions: []
    };
  }

  // Parse explicit target height preferences if provided
  let targetHeights = STANDARD_HEIGHTS;
  if (Array.isArray(configOptions.targets) && configOptions.targets.length > 0) {
    targetHeights = configOptions.targets.map(t => {
      if (typeof t === 'number') return t;
      if (typeof t === 'string') return parseInt(t.replace(/[^\d]/g, ''), 10);
      return null;
    }).filter(Boolean);
  }

  // Filter out any target height that would require upscaling
  const validHeights = targetHeights.filter(h => h <= srcH);

  // Deduplicate and sort descending
  const uniqueSortedHeights = Array.from(new Set(validHeights)).sort((a, b) => b - a);

  const aspectRatio = srcW / srcH;

  const renditions = uniqueSortedHeights.map(targetH => {
    let targetW = Math.round(targetH * aspectRatio);
    targetW = makeEven(targetW);
    const evenH = makeEven(targetH);

    const isSource = targetH === srcH;
    const label = `${targetH}p`;

    return {
      label,
      height: evenH,
      width: targetW,
      isSource,
      filename: `${targetH}.mp4`
    };
  });

  return {
    enabled: true,
    source: {
      label: `${srcH}p`,
      width: srcW,
      height: srcH,
      aspectRatio: aspectRatio.toFixed(2),
      isPortrait
    },
    renditions,
    skippedUpscalesCount: 0
  };
};

export default planQualityLadder;
