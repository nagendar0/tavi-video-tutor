## Review Summary

**Verdict**: REQUEST_CHANGES

This review assessed the implementation of the canvas-based subtitle player in `TaviVideoPlayer.jsx`, along with its dependencies `SubtitleEngine.jsx` and `AudioDubSync.jsx`. While the canvas rendering loop and double-stacked layout math are well-conceived and performant, several critical and major issues prevent the code from functioning correctly. 

Chief among these is a **Temporal Dead Zone (TDZ) ReferenceError** during render which crashes the component on load. Additionally, the drift correction mechanism in `AudioDubSync` is disabled due to a standard React interval lifecycle bug, and the WebVTT parser silently discards numeric subtitles.

---

## Findings

### [Critical] Finding 1: Temporal Dead Zone (TDZ) ReferenceError on Render
- **What**: ReferenceError when initializing subtitle-related refs.
- **Where**: `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`, lines 289-291:
  ```javascript
  289:   const primaryCuesRef = useRef(primaryCues);
  290:   const secondaryCuesRef = useRef(secondaryCues);
  291:   const secondarySubLanguageRef = useRef(secondarySubLanguage);
  ```
- **Why**: The variables `primaryCues`, `secondaryCues`, and `secondarySubLanguage` are declared later in the component function (lines 428-442) using `const`. In JavaScript, `const` declarations are block-scoped and are not initialized until their declaration line is evaluated (Temporal Dead Zone). Referencing them at lines 289-291 throws a runtime `ReferenceError: Cannot access 'primaryCues' before initialization` and crashes the entire component immediately.
- **Suggestion**: Move the declaration of the refs (lines 287-291) below the definitions of `primaryCues`, `secondaryCues`, and `secondarySubLanguage` (line 442). Alternatively, update the refs directly during the render phase rather than using separate `useEffect` hooks, which simplifies the code.

### [Major] Finding 2: Non-functional Audio Dub Drift Correction Loop
- **What**: The drift correction interval is repeatedly cleared and restarted, rendering it ineffective.
- **Where**: `packages/tavi-video-tutor/src/components/AudioDubSync.jsx`, lines 51-68:
  ```javascript
  51:   useEffect(() => {
  52:     if (isPlaying && audioRef.current && audioUrl) {
  53:       syncLoopRef.current = setInterval(() => {
  ...
  62:       }, 200);
  63:     }
  ...
  68:   }, [isPlaying, currentTime, audioUrl, onDriftCorrect]);
  ```
- **Why**: The `useEffect` has `currentTime` as a dependency. Since `currentTime` updates continuously (typically 4 to 25 times per second) during video playback, this effect is cleaned up and re-instantiated constantly. Because the interval is cleared and recreated faster than its 200ms duration, the callback inside `setInterval` is never (or highly irregularly) executed, completely breaking the drift correction.
- **Suggestion**: Store `currentTime` in a `useRef` that is updated synchronously on every render. Omit `currentTime` from the `useEffect` dependency array, and read from the ref inside the interval callback.

### [Major] Finding 3: WebVTT Parser discards numeric subtitle lines
- **What**: Subtitle lines that consist only of numbers are ignored.
- **Where**: `packages/tavi-video-tutor/src/components/SubtitleEngine.jsx`, line 40:
  ```javascript
  40:     } else if (currentCue && line !== '' && isNaN(Number(line))) {
  ```
- **Why**: To filter out numeric cue identifiers, the parser checks if the line is not a number (`isNaN(Number(line))`). However, this also filters out actual subtitle text that is purely numeric (e.g., years like "2026", counts, measurements, or sports scores like "100").
- **Suggestion**: Set `currentCue = null` when encountering an empty line, and treat any non-empty line parsed when `currentCue` is not null as text, regardless of whether it is numeric.

### [Minor] Finding 4: Subtitles don't update when changed while paused
- **What**: Changing subtitle options does not immediately update the canvas when the video is paused.
- **Where**: `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`, lines 899-903.
- **Why**: When paused, the 60fps RAF loop is suspended for performance. Single frames are only painted when `currentTime` changes. Toggling subtitles or changing language while paused does not trigger a redraw, leaving the old subtitle on the screen until the video is played or scrubbed.
- **Suggestion**: Add subtitle-related states (`selectedSubLanguage`, `isDualSubtitles`, `primaryCues`, `secondaryCues`) to the dependency array of the paused redraw effect, or call `paintSingleFrame()` when they change.

### [Minor] Finding 5: Overlapping multi-line background boxes
- **What**: Background boxes of consecutive lines overlap slightly, creating darker blended stripes.
- **Where**: `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`, lines 128-152.
- **Why**: The vertical distance between adjacent line centers is `baseFontSize * 1.3` (`primaryLineHeight`), but the box height is `baseFontSize * 1.44` (due to `vPadding = baseFontSize * 0.22` on both top and bottom). This causes an overlap of `0.14 * baseFontSize` between adjacent boxes.
- **Suggestion**: Set the line height factor to at least `1.45` or reduce `vPadding` to `0.15 * fontSize` to ensure the background boxes do not overlap.

---

## Verified Claims

- **`defaultSubLanguage` synchronization** → Verified via code analysis → **PASS (with caveats)**
  - *Details*: The internal state `selectedSubLanguage` correctly initializes and syncs with `defaultSubLanguage` prop changes via `useEffect`. However, there is no back-synchronization from the player's settings UI to the parent controller, leading to an out-of-sync state if the user manually changes language in the player.
- **Canvas-based 60fps rendering loop** → Verified via code analysis → **PASS**
  - *Details*: The loop correctly runs inside `requestAnimationFrame`, reads `video.currentTime` directly from the video element, and paints onto the 2D canvas context without triggering React re-renders.
- **Dual subtitle stacking math** → Verified via code analysis → **PASS**
  - *Details*: The vertical positioning offsets the secondary block using `primaryTotalHeight` and `gap`. The lowest point of the secondary block starts exactly above the primary block, mathematically avoiding overlaps.

---

## Coverage Gaps

- **Non-space-separated languages (CJK)** — *Risk Level: Medium* — *Recommendation: Investigate*
  - *Details*: The `wrapText` function splits subtitles by space (`text.split(' ')`). Languages like Chinese, Japanese, and Thai do not use spaces. Consequently, the entire subtitle is treated as a single word and will fail to wrap, leading to text truncation and off-screen overflow.
- **Top clipping on very small canvas heights** — *Risk Level: Low* — *Recommendation: Accept Risk*
  - *Details*: Under extremely small canvas heights (e.g. `< 150px`), if there are multiple lines of stacked dual subtitles, the top of the secondary subtitle block can compute to a negative Y coordinate, causing it to render off-screen. Since very small canvas sizes are rare, this is a low-priority risk.

---

## Unverified Items

- **Actual build and runtime validation** — Could not run `npm run build` or inspect runtime behavior in the browser because terminal execution timed out waiting for user permission.
