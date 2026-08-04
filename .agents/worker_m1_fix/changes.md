# Worker Fix Iteration Workspace
This directory belongs to the Worker subagent for the second iteration (fixing RTL gaps, TDZ ReferenceError, drift correction loop, numeric subtitles, paused redraw lag, and child-to-parent sync).

## Implemented Fixes
1. **RTL Rendering Gaps**: Added Pashto (`ps`), Sindhi (`sd`), and Kashmiri (`ks`) to the list of RTL languages in `TaviVideoPlayer.jsx` and `SubtitleEngine.jsx`.
2. **TDZ ReferenceError**: Relocated subtitle-related refs below the `primaryCues`, `secondaryCues`, and `secondarySubLanguage` declarations in `TaviVideoPlayer.jsx`.
3. **Drift Correction Loop Bug**: Utilized a `currentTimeRef` inside `useAudioDubSync` to maintain reference without clearing and reinstantiating the interval on every playhead tick.
4. **Numeric Subtitle Drop**: Modified WebVTT parser to reset `currentCue = null` on empty line and capture all non-empty lines including numeric lines.
5. **Paused Frame Redraw Lag**: Added subtitle states as dependencies to the paused frame paint hook.
6. **Child-to-Parent State Sync**: Added `onSubLanguageChange` prop to `<AITutor>` and `<TaviVideoPlayer>`, firing it in player settings and CC toggle to keep `selectedLang` updated in `App.jsx`.
7. **Controls HUD Overlap**: Dynamic canvas bottom margin adjustment based on `areControlsVisible` state.
8. **Overlapping Multi-line Background Boxes**: Adjusted horizontal and vertical paddings in subtitle canvas box drawing.
9. **CJK wrapping**: Added character-by-character tokenization and wrapping support in `wrapText`.
10. **Missing display names**: Registered display names for gu, ha, jv, kn, ks in `App.jsx`.
