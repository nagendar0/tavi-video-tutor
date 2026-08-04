# Handoff Report — Subtitle Rendering & Dropdown Selector

## 1. Observation

- **Video Reload Behavior**:
  - `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` lines 813-887 handles source loading within a `useEffect` hooked on `[activeSrc]`:
    ```jsx
    useEffect(() => {
      const video = offscreenVideoRef.current;
      ...
      video.src = activeSrc;
      video.load();
      ...
    }, [activeSrc]);
    ```
  - Subtitle updates are synced via lines 280-284:
    ```jsx
    useEffect(() => {
      if (defaultSubLanguage) {
        setSelectedSubLanguage(defaultSubLanguage);
      }
    }, [defaultSubLanguage]);
    ```
    which updates `selectedSubLanguage` state but does not change `activeSrc`.

- **Paused Rendering Behavior**:
  - Continuous draw loop in `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` lines 905-942:
    ```jsx
    if (video && canvas && !video.paused && !video.ended && !video.seeking) {
      ...
    }
    ```
  - Subtitle draw function is only called when the video is playing. When paused (`video.paused === true`), draw loop bypasses canvas painting.
  - The single frame painter `paintSingleFrame()` is only invoked by `[currentTime]` (lines 899-903) and `[selectedQuality]` (lines 979-996). No effect triggers it when `selectedSubLanguage`, `primaryCues`, or `secondaryCues` changes.

- **Stacking Logic**:
  - In `TaviVideoPlayer.jsx` lines 76-155:
    - Primary subtitle block bottom edge is `canvasHeight - bottomMargin` (where `bottomMargin = canvasHeight * 0.085`).
    - Secondary subtitle block bottom boundary is `canvasHeight - bottomMargin - primaryTotalHeight - gap` (where `gap = baseFontSize * 0.5`).
    - Fixed controls bar height is `52px` (from `packages/tavi-video-tutor/src/styles/ai-tutor.css` line 62).

- **Timestamp & Dropdown**:
  - Cues are located using binary search in `TaviVideoPlayer.jsx` lines 7-24 (`findActiveCue`) with exact comparisons `time >= cue.start && time <= cue.end`.
  - Dropdown filtering in `examples/react-demo/src/App.jsx` lines 126-133:
    ```jsx
    const filteredLanguages = useMemo(() => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return LANGUAGES;
      return LANGUAGES.filter(lang => 
        lang.name.toLowerCase().includes(query) || 
        lang.code.toLowerCase().includes(query)
      );
    }, [searchQuery]);
    ```

## 2. Logic Chain

1. **Video Stream Reloading**: Since `activeSrc` is not modified by changes to `defaultSubLanguage`/`selectedSubLanguage`, the `useEffect` containing `video.load()` is not triggered when the selected language changes. Thus, changing subtitles does not reload the video stream.
2. **Paused State Lag**: Because `paintSingleFrame()` is not called when subtitle states change, and the main `requestAnimationFrame` loop does not execute canvas drawing when `video.paused` is true, switching subtitle language while the video is paused fails to repaint the canvas. Thus, the old subtitle text persists on screen.
3. **Dual Subtitles separation**: The mathematical ranges of the subtitle blocks are:
   - Primary: `[canvasHeight - bottomMargin - primaryTotalHeight, canvasHeight - bottomMargin]`
   - Secondary: `[canvasHeight - bottomMargin - primaryTotalHeight - gap - secondaryTotalHeight, canvasHeight - bottomMargin - primaryTotalHeight - gap]`
   Since `gap = baseFontSize * 0.5 > 0`, the bottom of the secondary block is separated from the top of the primary block by `gap` pixels, guaranteeing zero overlap.
4. **Controls HUD Overlap**: The controls bar overlay has a fixed height of `52px`. At 360p height, the dynamic subtitle bottom margin is `360 * 0.085 = 30.6px`. Since the subtitle block extends to `329.4px` (leaving `30.6px` clearance) and the controls bar goes up to `308px` (height of `52px`), the controls overlap the subtitles by `329.4 - 308 = 21.4px`. At 480p, the overlap is `11.2px`.

## 3. Caveats

- Functional testing via active browser execution was simulated using code logic validation and static math simulation because terminal commands timed out due to the automated non-interactive terminal approval window.

## 4. Conclusion

- Selecting any language updates the state immediately without reloading the video stream.
- A **Paused State Rendering Lag** bug exists: changing the subtitle language while paused does not redraw the canvas, leaving the old subtitle on the screen.
- A **Controls HUD Overlap** bug exists: at resolutions of 480p and lower, the subtitles overlap with the visible controls HUD bar.
- Subtitle timings match timestamps exactly (using binary search) and the dropdown filters 100+ languages dynamically.
- Dual subtitles stack correctly with a mathematical gap and do not overlap with each other.

## 5. Verification Method

- Run the verification script using node:
  ```bash
  node examples/verify_subtitles.js
  ```
- Files to inspect:
  - `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`
  - `packages/tavi-video-tutor/src/components/SubtitleEngine.jsx`
  - `examples/verify_subtitles.js`
