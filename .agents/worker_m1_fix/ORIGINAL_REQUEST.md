## 2026-07-16T11:13:03Z

You are the Worker. Your task is to implement the fixes for all identified bugs across the workspace.

Please review the handoff and review reports in `.agents/reviewer_m1_1/` and `.agents/reviewer_m1_2/` and implement the following changes:

1. **RTL Rendering Gaps**: Add Pashto (`ps`), Sindhi (`sd`), and Kashmiri (`ks`) to the list of RTL languages in both `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` and `packages/tavi-video-tutor/src/components/SubtitleEngine.jsx`:
   `const isRTL = (lang) => ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ks'].includes(lang);`

2. **TDZ ReferenceError (TaviVideoPlayer.jsx)**: Move the declaration of all subtitle-related refs (`primaryCuesRef`, `secondaryCuesRef`, `secondarySubLanguageRef`, `selectedSubLanguageRef`, `isDualSubtitlesRef`) below the line where their corresponding target variables (`primaryCues`, `secondaryCues`, etc.) are declared to avoid block-scoped temporal dead zone runtime errors.

3. **Drift Correction Loop Bug (AudioDubSync.jsx)**:
   - Store `currentTime` in a ref `currentTimeRef` and update it on every render.
   - Use `currentTimeRef.current` inside the `setInterval` loop to check for drift.
   - Remove `currentTime` from the `useEffect` dependency list so the interval is not constantly destroyed and re-created on every playback tick.

4. **Numeric Subtitle Drop (SubtitleEngine.jsx)**:
   - In the `parseWebVTT` function, set `currentCue = null` when encountering an empty line (`line === ''`).
   - Treat any non-empty line parsed when `currentCue` is not null as subtitle text, appending it directly. Do NOT check for `isNaN(Number(line))`, so numeric subtitle lines are not ignored.

5. **Paused Frame Redraw Lag (TaviVideoPlayer.jsx)**:
   - Add `selectedSubLanguage`, `isDualSubtitles`, `primaryCues`, and `secondaryCues` to the dependency array of the `useEffect` that calls `paintSingleFrame()` when the player is paused.

6. **Child-to-Parent State Sync**:
   - Add an `onSubLanguageChange` callback prop to `<AITutor>` and `<TaviVideoPlayer>`.
   - Call this callback inside `TaviVideoPlayer.jsx` settings selectors and `handleCCToggle` handlers to pass the new language code back to the parent.
   - In `App.jsx`, listen to this callback and update the parent's `selectedLang` state, ensuring the external dropdown stays in sync with the player's internal settings UI.

7. **Controls HUD Overlap**:
   - Pass `areControlsVisible` to `drawCanvasSubtitles` and use it to adjust the bottom margin dynamically:
     `const visibleControlsHeight = areControlsVisible ? 58 : 12;`
     `const bottomMargin = Math.max(canvasHeight * 0.085, visibleControlsHeight + 8);`

8. **Overlapping Multi-line Background Boxes**:
   - Increase the line height factor in drawing or reduce vertical padding (e.g. `vPadding = fontSize * 0.16` and `hPadding = fontSize * 0.4`) to prevent background boxes of consecutive lines from overlapping.

9. **Non-Space-Separated Languages (CJK Wrapping)**:
   - Update `wrapText` in `TaviVideoPlayer.jsx` to support CJK character-by-character wrapping:
     Check each character. If it falls within CJK Unicode ranges (Hiragana, Katakana, Hangul, CJK Unified Ideographs), treat it as an individual word/boundary to wrap text properly.

10. **Missing Display Names**:
    - Add missing languages (`gu`: "Gujarati", `ha`: "Hausa", `jv`: "Javanese", `kn`: "Kannada", `ks`: "Kashmiri") to the static `LANGUAGES` array in `App.jsx`.

After implementing these fixes, run builds to verify compilation succeeds. Write your handoff report to `c:\Users\nagen\ai-tutor-system\.agents\worker_m1_fix\handoff.md` and report back when finished.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
