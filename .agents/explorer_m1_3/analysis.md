# Subtitle Rendering Optimization Report: Canvas-based Zero Latency Engine

## 1. Executive Summary
This report analyzes the current subtitle rendering architecture in the `tavi-video-tutor` player and proposes a high-performance design to achieve frame-accurate, zero-latency subtitle synchronization. 

By replacing the current React-state and DOM-overlay-based subtitle rendering with a direct 2D HTML5 Canvas rendering engine executed inside the 60fps `requestAnimationFrame` loop, we completely eliminate React reconciliation overhead, browser layout thrashing, and timing drift. Subtitles are drawn synchronously on top of each video frame using the direct `currentTime` clock of the offscreen video decoder.

---

## 2. Current Architecture Analysis

### Relevant Files & Code Locations
1. **`packages/tavi-video-tutor/src/components/SubtitleEngine.jsx`**:
   - Parses WebVTT captions (lines 3–47) using a standard string parser.
   - Exports the `SubtitleRenderer` React component (lines 50–91) which performs standard cue searches:
     ```javascript
     const activePrimary = primaryCues.find(
       cue => currentTime >= cue.start && currentTime <= cue.end
     );
     ```
   - Renders subtitles as standard HTML `div` overlay elements (`.subtitle-line.primary` and `.subtitle-line.secondary`) positioned above the video container.
2. **`packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`**:
   - Manages the player state and standard control logic.
   - Captures playback tick updates via the offscreen video element's `ontimeupdate` handler (lines 557–560):
     ```javascript
     video.ontimeupdate = () => {
       setCurrentTime(video.currentTime);
       onProgress?.({ playedSeconds: video.currentTime });
     };
     ```
   - Uses `currentTime` React state to trigger component-wide re-renders.
   - Conditionally mounts and updates the DOM-based `<SubtitleRenderer>` component (lines 942–953).
   - Separately draws the video frames onto the visual `<canvas>` using a `requestAnimationFrame` loop (lines 705–726):
     ```javascript
     const draw = () => {
       if (!active) return;
       const video = offscreenVideoRef.current;
       const canvas = canvasRef.current;
       if (video && canvas && !video.paused && !video.ended && !video.seeking) {
         const ctx = canvas.getContext('2d');
         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
       }
       requestAnimationFrame(draw);
     };
     ```

---

## 3. Root Causes of Subtitle Lag and Synchronization Drift

The current implementation suffers from noticeable lag, stuttering, and drift between the video frames and text overlay. The three main root causes are:

### A. The HTML5 Media `timeupdate` Event Firing Frequency
* **Problem**: The HTML5 `timeupdate` event frequency is dictated by the browser and operating system. The specification requires it to fire between 4 to 250 milliseconds (typically 4–6 times per second, roughly every 150–250ms).
* **Impact**: Subtitle text only updates when `timeupdate` fires. In a 60fps video, 15 frames are displayed every 250ms. As a result, subtitles can lag behind a speaker's audio or scene transitions by up to **250ms**, making rapid conversations or precise translations feel sluggish and out of sync.

### B. React Scheduler & Virtual DOM Reconciliation Latency
* **Problem**: Updating subtitles relies on calling `setCurrentTime(video.currentTime)` in React. This schedules a state update, triggers virtual DOM reconciliation, and forces a re-render of the massive `TaviVideoPlayer` component tree.
* **Impact**: React state updates are asynchronous and subject to browser main-thread scheduling. Under CPU-intensive tasks (e.g., buffering, rendering heavy controls, or rendering higher-resolution video frames), the React scheduler may delay the re-render. Additionally, diffing the virtual DOM for a full video player component structure takes precious milliseconds.

### C. Mismatched Rendering Loops (Canvas vs. DOM)
* **Problem**: Visual video frames are drawn onto the canvas at a smooth 60fps (via `requestAnimationFrame`), while the text overlay updates asynchronously at ~4–10fps in the DOM.
* **Impact**: This decoupled architecture guarantees drift. The canvas is always painting the most current video frame decoder buffer, whereas the HTML DOM text node laggingly waits for the next React cycle to retrieve the old timestamp snapshot.

---

## 4. Proposed Design: Synchronous Canvas Subtitle Engine

To achieve **zero latency** and **perfect frame-level synchronization**, subtitles must be treated as visual frame overlays drawn directly onto the `<canvas>` in the same execution context and thread frame as the video drawing.

```
+----------------------------------------------------------------------+
|                     requestAnimationFrame (60fps)                   |
|                                                                      |
|  +------------------------+          +----------------------------+  |
|  | Read currentTime from  |          | Query Subtitle Cue using   |  |
|  | offscreen <video> directly| ------> | Binary Search on Cues Ref  |  |
|  +------------------------+          +----------------------------+  |
|                                                     |                |
|                                                     v                |
|  +------------------------+          +----------------------------+  |
|  | Render Video Frame to  |          | Draw Text wrapping, shadow,|  |
|  | Canvas (ctx.drawImage) | -------> | box overlays to Canvas     |  |
|  +------------------------+          +----------------------------+  |
+----------------------------------------------------------------------+
```

### Key Architectural Pillars:
1. **Decouple from React Re-renders**: During playback, subtitle lookup and canvas painting will bypass React entirely. No React state updates are needed to draw subtitles.
2. **Access State via Refs**: Subtitle cues and user settings (e.g., active language, dual subtitles enabled, subtitles on/off) are stored in React `useRef` containers that are updated when props change. The canvas loop reads directly from these refs to get the latest settings synchronously.
3. **Synchronous Direct Reading**: Inside the loop, the engine reads `offscreenVideoRef.current.currentTime` directly. This gets the exact high-precision time of the frame being drawn, instead of relying on the low-frequency `currentTime` state.
4. **Co-located Rendering**: Subtitles are drawn immediately after `ctx.drawImage` in both the `requestAnimationFrame` loop (during playback) and the single frame paint handler (when paused or seeking).

---

## 5. Technical Implementation Details

### A. Unified Draw Loop Pipeline
A single draw function paints both the video frame and active subtitles onto the canvas:

```javascript
const paintFrame = () => {
  const video = offscreenVideoRef.current;
  const canvas = canvasRef.current;
  if (!video || !canvas) return;

  const ctx = canvas.getContext('2d');
  
  // 1. Paint the video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 2. Paint subtitles if subtitles are enabled
  if (selectedSubLanguageRef.current !== 'none') {
    drawCanvasSubtitles(
      ctx,
      video.currentTime,
      canvas.width,
      canvas.height,
      primaryCuesRef.current,
      secondaryCuesRef.current,
      isDualSubtitlesRef.current,
      selectedSubLanguageRef.current,
      secondarySubLanguageRef.current
    );
  }
};
```

### B. High-Performance Cue Lookup (Binary Search)
Instead of $O(N)$ linear scans with `Array.prototype.find()`, a binary search yields $O(\log N)$ complexity, taking less than 11 iterations for 2000 cues.

```javascript
const findActiveCue = (cues, time) => {
  if (!cues || cues.length === 0) return null;
  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];
    if (time >= cue.start && time <= cue.end) {
      return cue;
    } else if (time < cue.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return null;
};
```

### C. Responsive Canvas Text Styling & Layout
Subtitles must scale proportionally to the canvas size so they look sharp at any resolution (e.g., 360p vs 1080p, fullscreen).

* **Relative Font Sizing**:
  ```javascript
  const baseFontSize = Math.max(14, canvasHeight * 0.045); // 4.5% of canvas height
  ```
* **Font Configuration**:
  ```javascript
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ```
* **RTL Language Support**:
  ```javascript
  ctx.direction = isRTL(lang) ? 'rtl' : 'ltr';
  ```

### D. Canvas Text Wrapping Algorithm
Because Canvas 2D does not wrap text automatically, a helper splits subtitle text into lines based on a maximum width boundary (typically 80% of canvas width).

```javascript
const wrapText = (ctx, text, maxWidth) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};
```

### E. Contrast Background Boxes Drawing
Drawing semi-transparent black boxes behind subtitle text provides high legibility on any visual backdrop.
* **Math details**:
  - Horizontal padding: `fontSize * 0.4`
  - Vertical padding: `fontSize * 0.2`
  - For each line, compute the width: `w = ctx.measureText(line).width`.
  - Draw a rounded rectangle at:
    - `x = (canvasWidth - w) / 2 - hPadding`
    - `y = lineY - fontSize / 2 - vPadding`
    - `width = w + (hPadding * 2)`
    - `height = fontSize + (vPadding * 2)`
  - Use `ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'` followed by text painting in `#ffffff` or `#ffea00`.

### F. Dual Subtitles Stacking Algorithm
When dual subtitles are active, the primary and secondary subtitles must stack without overlapping. We render bottom-up:

1. **Calculate boundaries**:
   - `lineHeight = fontSize * 1.35`
   - `bottomMargin = canvasHeight * 0.08`
2. **Primary Subtitles (Bottom)**:
   - Wrapped lines: $P$
   - Total primary height: $H_p = P \times lineHeight$
   - Primary start Y (top line): $Y_{p0} = canvasHeight - bottomMargin - H_p + (lineHeight / 2)$
   - Draw primary lines.
3. **Secondary Subtitles (Top-stacked)**:
   - Wrapped lines: $S$
   - Gap between subtitle languages: $G = fontSize * 0.5$
   - Total secondary height: $H_s = S \times lineHeight$
   - Secondary start Y (top line): $Y_{s0} = (canvasHeight - bottomMargin - H_p) - G - H_s + (lineHeight / 2)$
   - Draw secondary lines in a distinct color (e.g., `#ffea00` or `#e0e0e0`).

---

## 6. Full Design Sketch of the Canvas Subtitle Drawer

This self-contained drawer function can be added directly inside `TaviVideoPlayer.jsx` or imported from `SubtitleEngine.jsx`:

```javascript
const isRTL = (lang) => ['ar', 'he', 'fa', 'ur'].includes(lang);

export const drawCanvasSubtitles = (
  ctx,
  currentTime,
  canvasWidth,
  canvasHeight,
  primaryCues,
  secondaryCues,
  isDualEnabled,
  primaryLang,
  secondaryLang
) => {
  const activePrimary = findActiveCue(primaryCues, currentTime);
  const activeSecondary = isDualEnabled 
    ? findActiveCue(secondaryCues, currentTime) 
    : null;

  if (!activePrimary && !activeSecondary) return;

  const baseFontSize = Math.max(14, canvasHeight * 0.045);
  const maxWidth = canvasWidth * 0.85;
  const bottomMargin = canvasHeight * 0.085;
  const gap = baseFontSize * 0.5;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Process and wrap primary text
  let primaryLines = [];
  let primaryLineHeight = baseFontSize * 1.3;
  if (activePrimary) {
    ctx.font = `bold ${baseFontSize}px sans-serif`;
    ctx.direction = isRTL(primaryLang) ? 'rtl' : 'ltr';
    primaryLines = wrapText(ctx, activePrimary.text, maxWidth);
  }
  const primaryTotalHeight = primaryLines.length * primaryLineHeight;

  // 2. Process and wrap secondary text
  let secondaryLines = [];
  const secondaryFontSize = baseFontSize * 0.9; // slightly smaller
  let secondaryLineHeight = secondaryFontSize * 1.3;
  if (activeSecondary) {
    ctx.font = `bold ${secondaryFontSize}px sans-serif`;
    ctx.direction = isRTL(secondaryLang) ? 'rtl' : 'ltr';
    secondaryLines = wrapText(ctx, activeSecondary.text, maxWidth);
  }
  const secondaryTotalHeight = secondaryLines.length * secondaryLineHeight;

  // 3. Draw Primary lines (Bottom)
  if (primaryLines.length > 0) {
    ctx.font = `bold ${baseFontSize}px sans-serif`;
    ctx.direction = isRTL(primaryLang) ? 'rtl' : 'ltr';
    const primaryStartY = canvasHeight - bottomMargin - primaryTotalHeight + (primaryLineHeight / 2);
    
    primaryLines.forEach((line, index) => {
      const lineY = primaryStartY + (index * primaryLineHeight);
      drawSubtitleLine(ctx, line, canvasWidth / 2, lineY, baseFontSize, '#ffffff');
    });
  }

  // 4. Draw Secondary lines (Stacked above Primary)
  if (secondaryLines.length > 0) {
    ctx.font = `bold ${secondaryFontSize}px sans-serif`;
    ctx.direction = isRTL(secondaryLang) ? 'rtl' : 'ltr';
    
    // Stack location offset by primary block height and gap
    const secondaryBottomBoundary = activePrimary 
      ? (canvasHeight - bottomMargin - primaryTotalHeight - gap)
      : (canvasHeight - bottomMargin);

    const secondaryStartY = secondaryBottomBoundary - secondaryTotalHeight + (secondaryLineHeight / 2);

    secondaryLines.forEach((line, index) => {
      const lineY = secondaryStartY + (index * secondaryLineHeight);
      drawSubtitleLine(ctx, line, canvasWidth / 2, lineY, secondaryFontSize, '#fef08a'); // Tailwind yellow-200
    });
  }

  ctx.restore();
};

const drawSubtitleLine = (ctx, text, x, y, fontSize, textColor) => {
  const hPadding = fontSize * 0.45;
  const vPadding = fontSize * 0.22;
  const metrics = ctx.measureText(text);
  const boxWidth = metrics.width + (hPadding * 2);
  const boxHeight = fontSize + (vPadding * 2);
  const boxX = x - (metrics.width / 2) - hPadding;
  const boxY = y - (fontSize / 2) - vPadding;

  // Draw semi-transparent background box
  ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, fontSize * 0.2);
    ctx.fill();
  } else {
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  }

  // Draw text stroke outline for extra legibility
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = fontSize * 0.12;
  ctx.strokeText(text, x, y);

  // Draw foreground text
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);
};
```

---

## 7. Synchronization Verification Strategy

To confirm the optimizations and ensure zero synchronization drift, the following manual and programmatic validation steps should be completed after implementation:

1. **Precision Timing Analysis**:
   - Programmatically log the duration between a cue's scheduled start time and its actual canvas rendering time.
   - Assert that latency remains strictly under **16.6ms** (within the 1-frame budget of a 60fps refresh rate), compared to the 100ms–250ms latency of the current DOM system.
2. **Scrubbing/Seeking Robustness**:
   - Manually trigger multiple rapid timeline scrub operations.
   - Verify that the correct subtitle is drawn immediately on the canvas frame upon seek completion (`onseeked`), even when paused.
3. **Playback Rate Testing**:
   - Speed up playback to `2.0x`.
   - Verify that dual subtitles continue to align frame-accurately with the faster-changing audio and visual frames.
