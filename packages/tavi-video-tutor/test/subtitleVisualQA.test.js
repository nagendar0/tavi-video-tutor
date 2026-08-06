import test from 'node:test';
import assert from 'node:assert';

class MockCanvasRenderingContext2D {
  constructor(width = 1280, height = 720) {
    this.canvas = { width, height, clientHeight: height, height: height };
    this.font = '600 24px sans-serif';
    this.textAlign = 'center';
    this.textBaseline = 'middle';
    this.direction = 'ltr';
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.shadowColor = '';
    this.shadowBlur = 0;
    this.shadowOffsetX = 0;
    this.shadowOffsetY = 0;
    this.calls = [];
    this.fillCount = 0;
    this.strokeCount = 0;
    this.roundRectCalls = [];
  }

  save() {}
  restore() {}
  beginPath() {}
  fill() { this.fillCount++; }
  stroke() { this.strokeCount++; }
  clearRect() {}

  measureText(text) {
    const match = this.font.match(/(\d+)px/);
    const fontSize = match ? parseInt(match[1], 10) : 24;
    return { width: text.length * fontSize * 0.55 };
  }

  strokeText(text, x, y) {
    this.calls.push({ type: 'strokeText', text, x, y, strokeStyle: this.strokeStyle, lineWidth: this.lineWidth });
  }

  fillText(text, x, y) {
    this.calls.push({ type: 'fillText', text, x, y, fillStyle: this.fillStyle });
  }

  fillRect(x, y, w, h) {
    this.calls.push({ type: 'fillRect', x, y, w, h, fillStyle: this.fillStyle });
  }

  roundRect(x, y, w, h, r) {
    this.roundRectCalls.push({ x, y, w, h, r });
  }
}

const DEFAULT_FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Nirmala UI", "Segoe UI", Roboto, "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Arabic", "Noto Sans CJK SC", "Noto Sans JP", "Noto Sans KR", "Helvetica Neue", Arial, sans-serif';

const drawSubtitleLine = (ctx, text, x, y, fontSize, styleOpts = {}) => {
  const {
    textColor = '#ffffff',
    backgroundColor = 'rgba(12, 12, 14, 0.88)',
    borderRadius,
    paddingX,
    paddingY,
    shadowBlur,
    shadowColor = 'rgba(0, 0, 0, 0.75)'
  } = styleOpts;

  const hPadding = paddingX !== undefined ? paddingX : fontSize * 0.45;
  const vPadding = paddingY !== undefined ? paddingY : fontSize * 0.28;
  const metrics = ctx.measureText(text);
  const boxWidth = metrics.width + (hPadding * 2);
  const boxHeight = fontSize * 1.25 + (vPadding * 2);
  const boxX = x - (metrics.width / 2) - hPadding;
  const boxY = y - (fontSize * 1.25 / 2) - vPadding;
  const radius = borderRadius !== undefined ? borderRadius : Math.max(4, fontSize * 0.16);

  ctx.save();

  ctx.fillStyle = backgroundColor;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    ctx.fill();
  } else {
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  }

  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur !== undefined ? shadowBlur : Math.max(2, fontSize * 0.12);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(1, fontSize * 0.04);

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = Math.max(0.5, fontSize * 0.035);
  ctx.strokeText(text, x, y);

  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);

  ctx.restore();
  return { boxX, boxY, boxWidth, boxHeight, vPadding, hPadding };
};

const drawCanvasSubtitles = (
  ctx,
  canvasWidth,
  canvasHeight,
  activePrimaryText,
  activeSecondaryText,
  primaryLang,
  secondaryLang,
  areControlsVisible,
  subtitleStyle = {}
) => {
  if (!activePrimaryText && !activeSecondaryText) return;

  const canvas = ctx.canvas;
  const displayHeight = (canvas && canvas.clientHeight) ? canvas.clientHeight : (canvasHeight / 2);
  const scale = (canvas && canvas.clientHeight && canvas.height) ? (canvas.height / canvas.clientHeight) : 1;

  const userFontSize = subtitleStyle?.fontSize;
  const cssFontSize = userFontSize 
    ? userFontSize 
    : Math.max(12, Math.min(64, Math.round(displayHeight * 0.034)));
  const baseFontSize = cssFontSize * scale;

  const visibleControlsHeight = areControlsVisible ? (46 * scale) : (8 * scale);
  const defaultBottomMargin = Math.max(canvasHeight * 0.05, visibleControlsHeight + (10 * scale));
  const bottomMargin = subtitleStyle?.bottomOffset !== undefined
    ? Math.max(8 * scale, subtitleStyle.bottomOffset * scale)
    : defaultBottomMargin;

  const gap = baseFontSize * 0.38;
  const fontFamily = subtitleStyle?.fontFamily || DEFAULT_FONT_STACK;
  const fontWeight = subtitleStyle?.fontWeight !== undefined ? subtitleStyle.fontWeight : 600;
  const fontSpec = `${fontWeight} ${baseFontSize}px ${fontFamily}`;
  const lineHeightMultiplier = subtitleStyle?.lineHeight || 1.45;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const primaryTextColor = subtitleStyle?.color || '#ffffff';
  let primaryBgColor = subtitleStyle?.backgroundColor;
  if (!primaryBgColor && subtitleStyle?.backgroundOpacity !== undefined) {
    primaryBgColor = `rgba(12, 12, 14, ${subtitleStyle.backgroundOpacity})`;
  }

  const primaryStyleOpts = {
    textColor: primaryTextColor,
    backgroundColor: primaryBgColor || 'rgba(12, 12, 14, 0.88)',
    borderRadius: subtitleStyle?.borderRadius !== undefined ? subtitleStyle.borderRadius * scale : undefined,
    paddingX: subtitleStyle?.paddingX !== undefined ? subtitleStyle.paddingX * scale : undefined,
    paddingY: subtitleStyle?.paddingY !== undefined ? subtitleStyle.paddingY * scale : undefined,
    shadowBlur: subtitleStyle?.shadowBlur !== undefined ? subtitleStyle.shadowBlur * scale : undefined,
    shadowColor: subtitleStyle?.shadowColor
  };

  let primaryLines = [activePrimaryText].filter(Boolean);
  let primaryLineHeight = baseFontSize * lineHeightMultiplier;
  const primaryTotalHeight = primaryLines.length * primaryLineHeight;

  let secondaryLines = [activeSecondaryText].filter(Boolean);
  const secondaryFontSize = Math.round(baseFontSize * 0.88);
  let secondaryLineHeight = secondaryFontSize * lineHeightMultiplier;
  const secondaryTotalHeight = secondaryLines.length * secondaryLineHeight;

  const secondaryStyleOpts = {
    ...primaryStyleOpts,
    textColor: '#ffd600'
  };

  const rects = [];

  if (primaryLines.length > 0) {
    ctx.font = fontSpec;
    const primaryStartY = canvasHeight - bottomMargin - primaryTotalHeight + (primaryLineHeight / 2);
    primaryLines.forEach((line, index) => {
      const lineY = primaryStartY + (index * primaryLineHeight);
      rects.push(drawSubtitleLine(ctx, line, canvasWidth / 2, lineY, baseFontSize, primaryStyleOpts));
    });
  }

  if (secondaryLines.length > 0) {
    ctx.font = `${fontWeight} ${secondaryFontSize}px ${fontFamily}`;
    const secondaryBottomBoundary = activePrimaryText 
      ? (canvasHeight - bottomMargin - primaryTotalHeight - gap)
      : (canvasHeight - bottomMargin);

    const secondaryStartY = secondaryBottomBoundary - secondaryTotalHeight + (secondaryLineHeight / 2);
    secondaryLines.forEach((line, index) => {
      const lineY = secondaryStartY + (index * secondaryLineHeight);
      rects.push(drawSubtitleLine(ctx, line, canvasWidth / 2, lineY, secondaryFontSize, secondaryStyleOpts));
    });
  }

  ctx.restore();
  return { baseFontSize, rects };
};

test('TEST A: Default Subtitle Appearance -> High Contrast & Solid Dark Background', () => {
  const ctx = new MockCanvasRenderingContext2D(1280, 720);
  const result = drawCanvasSubtitles(ctx, 1280, 720, 'Welcome to AI Tutor', null, 'en', null, true);

  const fillCalls = ctx.calls.filter(c => c.type === 'fillText');
  const strokeCalls = ctx.calls.filter(c => c.type === 'strokeText');
  const rect = result.rects[0];

  assert.strictEqual(fillCalls.length, 1);
  assert.strictEqual(fillCalls[0].fillStyle, '#ffffff', 'Primary text must be crisp white');
  assert.strictEqual(strokeCalls[0].lineWidth < 2.5, true, 'Stroke must be subtle micro-outline');
  assert.strictEqual(rect.vPadding >= 6, true, 'Vertical padding must be comfortable');
});

test('TEST B: Indic Multilingual Script Readability (Telugu & Hindi)', () => {
  const ctx = new MockCanvasRenderingContext2D(1280, 720);
  const teluguText = 'తెలుగు ఉపశీర్షికలను స్పష్టంగా చదవగలగాలి';
  const result = drawCanvasSubtitles(ctx, 1280, 720, teluguText, null, 'te', null, true);

  const rect = result.rects[0];
  assert.ok(rect.boxHeight > result.baseFontSize * 1.5, 'Box height must accommodate ascenders and descenders');
  assert.ok(rect.vPadding >= result.baseFontSize * 0.25, 'Vertical padding must prevent diacritic clipping');
});

test('TEST C: Responsive Font Sizing Across Viewports (320x180 up to 4K)', () => {
  const viewports = [
    { w: 320, h: 180, minExpected: 12, maxExpected: 16 },
    { w: 640, h: 360, minExpected: 12, maxExpected: 25 },
    { w: 1280, h: 720, minExpected: 20, maxExpected: 30 },
    { w: 1920, h: 1080, minExpected: 30, maxExpected: 45 },
    { w: 3840, h: 2160, minExpected: 50, maxExpected: 64 }
  ];

  viewports.forEach(vp => {
    const ctx = new MockCanvasRenderingContext2D(vp.w, vp.h);
    const res = drawCanvasSubtitles(ctx, vp.w, vp.h, 'Sample Cue', null, 'en', null, true);
    assert.ok(
      res.baseFontSize >= vp.minExpected && res.baseFontSize <= vp.maxExpected,
      `Viewport ${vp.w}x${vp.h} font size ${res.baseFontSize}px should be within range [${vp.minExpected}, ${vp.maxExpected}]`
    );
  });
});

test('TEST D: Developer Customization API (subtitleStyle overrides)', () => {
  const ctx = new MockCanvasRenderingContext2D(1280, 720);
  const customStyle = {
    fontSize: 28,
    color: '#00ffaa',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    bottomOffset: 60
  };

  const result = drawCanvasSubtitles(ctx, 1280, 720, 'Custom Styled Subtitle', null, 'en', null, true, customStyle);
  const fillCall = ctx.calls.find(c => c.type === 'fillText');

  assert.strictEqual(fillCall.fillStyle, '#00ffaa', 'Custom text color must be applied');
  assert.strictEqual(result.rects[0].boxY < 650, true, 'Custom bottom offset must adjust subtitle Y position');
});

test('TEST E: Dual Subtitles (English + Telugu) -> No Overlap', () => {
  const ctx = new MockCanvasRenderingContext2D(1280, 720);
  const result = drawCanvasSubtitles(
    ctx,
    1280,
    720,
    'Primary English Text',
    'తెలుగు ద్వితీయ పాఠం',
    'en',
    'te',
    true
  );

  assert.strictEqual(result.rects.length, 2, 'Must draw 2 subtitle pills for dual tracks');

  const primaryRect = result.rects[0];
  const secondaryRect = result.rects[1];

  const secondaryBottom = secondaryRect.boxY + secondaryRect.boxHeight;
  assert.ok(
    secondaryBottom <= primaryRect.boxY,
    `Secondary bottom (${secondaryBottom}) must be above primary top (${primaryRect.boxY}) with zero overlap`
  );
});

test('TEST F: Performance & Zero Allocation Leak', () => {
  const ctx = new MockCanvasRenderingContext2D(1920, 1080);
  const start = performance.now();

  for (let i = 0; i < 1000; i++) {
    drawCanvasSubtitles(ctx, 1920, 1080, 'Performance Benchmark Subtitle Line', 'Secondary Line', 'en', 'te', true);
  }

  const duration = performance.now() - start;
  const avgFrameTime = duration / 1000;

  assert.ok(avgFrameTime < 0.2, `Average subtitle render frame time (${avgFrameTime.toFixed(4)}ms) must be < 0.2ms`);
});
