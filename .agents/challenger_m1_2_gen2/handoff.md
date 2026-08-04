# Handoff Report: Subtitle Layout & Functionality Verification

## 1. Observation
We analyzed the following source and test files:
- `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`
- `packages/tavi-video-tutor/src/styles/ai-tutor.css`
- `examples/verify_subtitles.js`

Specifically, we observed:
- In `TaviVideoPlayer.jsx` (lines 948-952), the paused paint effect depends on `[currentTime, selectedSubLanguage, isDualSubtitles, primaryCues, secondaryCues]` but does not include `isPlaying` or `areControlsVisible`.
- In `TaviVideoPlayer.jsx` (line 134), `visibleControlsHeight` is hardcoded as `areControlsVisible ? 58 : 12`.
- In `ai-tutor.css` (line 62), the controls bar has a fixed height of `52px` in physical/CSS pixels.

## 2. Logic Chain
1. **Paused Paint Bug on HUD Transition**: 
   - When the player is paused, `areControlsVisible` changes to `true` (making the controls HUD visible).
   - Because `areControlsVisible` is not in the dependency array of the paused-paint `useEffect`, the canvas is not repainted when controls visibility changes on pause.
   - Therefore, the subtitles remain at the lower position (corresponding to hidden controls), colliding directly with the visible controls HUD.
2. **Hook Order Fragility**:
   - The paint effect relies on refs (`selectedSubLanguageRef.current`, etc.) which are synchronized via other `useEffect` hooks.
   - If the paint hook is registered before the ref-sync hooks, or if hooks are reordered, `paintSingleFrame()` will execute with stale ref values, leading to visual lags or incorrect language display.
3. **Responsive Resolution Collisions**:
   - The CSS height of the controls is fixed at 52px, while the canvas height corresponds to the video resolution (e.g. 1080p).
   - If the player is rendered at a small height (e.g., 540px), the 52px HUD corresponds to 104 canvas pixels.
   - The player uses a hardcoded 58 canvas-pixel offset, meaning subtitles are placed at a physical height lower than the top of the HUD controls, creating a visual overlap.

## 3. Caveats
- No browser automation tool (like Selenium or Puppeteer) was executed due to environment restrictions and terminal command timeouts. The findings are based on rigorous static code analysis and mathematical calculations of layout constraints.
- CJK font rendering is assumed to use standard font-families available on the system.

## 4. Conclusion
- **Changing language while paused**: Instantly updates because `selectedSubLanguage` is in the dependency array of the paused-paint effect.
- **HUD overlap at low heights (360p/480p)**: Fails immediately on pause because the canvas does not repaint to shift the subtitles up when the HUD appears. It also fails when the canvas resolution is high and the physical player size is small.
- **CJK subtitles**: Wrap correctly due to the custom character-by-character CJK tokenizer in `wrapText`.

## 5. Verification Method
1. Load `examples/react-demo` in a browser.
2. Pause the video while subtitles are visible. Observe if the subtitles immediately shift upwards or remain overlapped by the visible controls bar.
3. Resize the browser to a small window size and play a 1080p stream. Verify if subtitles are obscured by the controls HUD.
