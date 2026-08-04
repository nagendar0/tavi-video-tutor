# Adversarial Challenge Report: Subtitle Functionality & Layout Edge Cases

## Challenge Summary

**Overall risk assessment**: HIGH

Through detailed static code analysis and mathematical layout verification, we have uncovered a critical functionality bug regarding paused subtitle updates and potential HUD overlap issues at low canvas/player sizes.

---

## Challenges

### [High] Challenge 1: Lack of Immediate Subtitle Repaint on Pause HUD Transition
- **Assumption challenged**: Subtitles are immediately drawn in the correct position when the video is paused and the HUD controls are shown.
- **Attack scenario**: 
  1. The video is playing. The HUD controls auto-hide after 1 second (`areControlsVisible` becomes `false`). The subtitles are rendered lower down using a bottom margin based on `visibleControlsHeight = 12`.
  2. The user clicks pause. The video pauses, and the player sets `areControlsVisible` to `true` (forcing controls to remain visible).
  3. However, the paused-rendering `useEffect` hook in `TaviVideoPlayer.jsx` has the following dependency array:
     ```javascript
     useEffect(() => {
       if (!isPlaying) {
         paintSingleFrame();
       }
     }, [currentTime, selectedSubLanguage, isDualSubtitles, primaryCues, secondaryCues]);
     ```
  4. Notice that neither `isPlaying` nor `areControlsVisible` is in the dependency array. Since `currentTime` and `selectedSubLanguage` do not change at the exact moment of pausing, the effect does NOT run.
  5. The canvas is not repainted after `areControlsVisible` becomes `true`. The subtitles remain at their lower position (20px bottom margin) and are partially or completely covered by the newly visible 52px high controls HUD.
- **Blast radius**: Subtitles will overlap with and be obscured by the controls HUD immediately upon pausing the video.
- **Mitigation**: Update the dependency array of the paused-paint effect to include `isPlaying` and `areControlsVisible`. Better yet, pass the state variables directly to `paintSingleFrame()` instead of relying on refs, eliminating race conditions.

### [Medium] Challenge 2: Fragile Hook Execution Order Dependency
- **Assumption challenged**: The refs used in `paintSingleFrame()` always reflect the most up-to-date state values during the paint phase.
- **Attack scenario**: 
  `TaviVideoPlayer.jsx` implements several effects to synchronize state to refs (lines 469-488):
  ```javascript
  useEffect(() => {
    selectedSubLanguageRef.current = selectedSubLanguage;
  }, [selectedSubLanguage]);
  ```
  And then implements the paint effect (lines 948-952):
  ```javascript
  useEffect(() => {
    if (!isPlaying) {
      paintSingleFrame();
    }
  }, [...]);
  ```
  If these hooks are ever reordered or moved to custom hooks, React might execute the paint effect *before* the ref updates. In that case, `paintSingleFrame()` will draw using stale values of `selectedSubLanguageRef.current`, causing the canvas subtitles to render the previous language instead of the selected one.
- **Blast radius**: Immediate updates on subtitle change while paused will break, displaying stale subtitle text/languages.
- **Mitigation**: Redefine `paintSingleFrame` to accept parameters (`paintSingleFrame(selectedSubLanguage, primaryCues, secondaryCues, isDualSubtitles, areControlsVisible)`) and pass the active state values directly from the effect.

### [Medium] Challenge 3: Subtitle/HUD Overlap at High Canvas Resolutions with Small Player Containers
- **Assumption challenged**: Hardcoding `visibleControlsHeight = 58` in canvas pixels is sufficient to prevent overlap with the controls HUD across all scales.
- **Attack scenario**:
  1. The controls HUD is a DOM overlay with a constant height of `52px` (physical).
  2. The canvas resolution represents the video quality (e.g. 1080p, so $H_{canvas} = 1080$).
  3. The player container is resized to a small height (e.g. $H_{wrapper} = 540px$).
  4. In this case, the physical controls (52px) correspond to $52 \times (1080 / 540) = 104$ canvas pixels.
  5. However, the player hardcodes `visibleControlsHeight = 58` (canvas pixels). The computed `bottomMargin` becomes $\max(1080 \times 0.085, 66) = 91.8$ canvas pixels.
  6. Since the subtitle bottom margin ($91.8$ canvas pixels) is less than the actual controls height ($104$ canvas pixels), the subtitles will be physically drawn at $91.8 \times (540 / 1080) = 45.9$ physical pixels from the bottom.
  7. Since the controls HUD covers 52 physical pixels, the subtitles will overlap/intersect with the HUD.
- **Blast radius**: Visual subtitle-controls collision at high video qualities under small/responsive window sizes.
- **Mitigation**: Pass the actual physical-to-canvas ratio or dynamic wrapper height into the subtitle rendering calculations, or make the bottom margin relative to the actual CSS layout.

---

## Stress Test Results

### 1. Changing Language While Paused
- **Scenario**: Video is paused at 2.0s with English subtitles. User changes language to Spanish (`es`) from the dropdown.
- **Expected behavior**: Canvas immediately repaints, replacing the English subtitle text with Spanish text.
- **Actual behavior**: PASS. The `selectedSubLanguage` changes, triggering the `useEffect` with `selectedSubLanguage` as dependency. It calls `paintSingleFrame()` which redraws with Spanish subtitles.
- **Result**: PASS

### 2. HUD Overlap under Low Canvas Heights (360p / 480p)
- **Scenario 2a (Video Playing, HUD Hidden)**: 360p video playing, HUD hidden.
  - **Expected behavior**: Subtitles are positioned close to the bottom since controls are hidden.
  - **Actual behavior**: PASS. Bottom margin is $\max(30.6, 20) = 30.6$ canvas pixels.
  - **Result**: PASS
- **Scenario 2b (Video Paused, HUD Visible)**: 360p video paused, HUD visible.
  - **Expected behavior**: Subtitles shift up to avoid the 52px high controls HUD.
  - **Actual behavior**: FAIL. Due to Challenge 1, when pausing, the canvas does not repaint. Subtitles remain at the lower position (30.6 canvas pixels / 30.6 physical pixels), which falls behind the 52px controls HUD.
  - **Result**: FAIL
- **Scenario 2c (Small Player Wrapper with High Resolution Video)**: 1080p video ($H_{canvas} = 1080$), player wrapper height is 540px.
  - **Expected behavior**: Subtitles clear the 52px controls HUD.
  - **Actual behavior**: FAIL. The hardcoded 58 canvas-pixel HUD height translates to a smaller physical space than the actual 52px HUD, causing a physical overlap of ~6px.
  - **Result**: FAIL

### 3. CJK Subtitle Wrapping
- **Scenario**: Displaying a long CJK string: `欢迎使用custom AI Video Tutor` or `这是一个非常非常非常非常非常非常长的中文字符串`.
- **Expected behavior**: Long sentences wrap character-by-character without overflow or breaking middle words of English phrases.
- **Actual behavior**: PASS. The `wrapText` tokenizer correctly splits CJK characters individually and leaves English words intact. The layout wraps them properly within `maxWidth`.
- **Result**: PASS

---

## Unchallenged Areas

- **Audio Dubbing Sync** — Out of scope for subtitle layout and immediate redraw tests.
- **Searchable Dropdown Filtering** — Not challenged as it only deals with UI selection and does not affect the canvas layout.
