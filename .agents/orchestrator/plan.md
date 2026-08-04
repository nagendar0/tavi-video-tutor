# Execution Plan — AI Tutor Multilingual Subtitles & Zero-Latency Player

This document outlines the milestones and step-by-step plan for implementing multilingual subtitle translations, UI integration, and canvas-based subtitle rendering optimization.

## Milestones

### Milestone 1: Setup and Subtitle Translation Generation (R1)
- **Objective**: Translate 3 English demo subtitle cues into 100+ specified languages, format them as valid WebVTT structures, and store them in a JSON/JS file accessible by the application.
- **Verification**: Script verifies that all 100+ target languages from `ORIGINAL_REQUEST.md` have corresponding valid WebVTT strings containing the 3 cues.

### Milestone 2: Searchable Language Selector in Testing Controller UI (R2)
- **Objective**: Replace or enhance the quick preset buttons with a clean, searchable dropdown menu for language selection in the Testing Controller UI of `App.jsx`.
- **Verification**: Dropdown lists all 100+ languages by code and name, filters dynamically when typing, and updates the player subtitles immediately.

### Milestone 3: Canvas Subtitle Rendering Optimization (R3)
- **Objective**: Optimize subtitle rendering inside the canvas player (`TaviVideoPlayer.jsx`) by drawing subtitles directly on the canvas context in the requestAnimationFrame render loop, ensuring frame-accurate, zero-latency synchronization.
- **Verification**: Subtitles are synchronized perfectly with video frames, update in real-time inside the canvas render loop, and support both single and dual subtitles.

### Milestone 4: Integration, Build, and Acceptance Verification (R4)
- **Objective**: Run full E2E testing and run `npm run build` in `examples/react-demo` to ensure zero compilation or bundling issues.
- **Verification**: Acceptance criteria are fully verified and building succeeds.

---

## Detailed Step-by-Step Task List

### Track A: Implementation Track
1. **A1. Translate Subtitles**: Write and execute a Node script to translate the 3 subtitle cues into the 100+ languages specified in `ORIGINAL_REQUEST.md`. Keep the original English timestamps. Save as `examples/react-demo/src/subtitles.js` (or similar).
2. **A2. Update App.jsx**: Modify `examples/react-demo/src/App.jsx` to load all 100+ translation subtitles and pass them to the `AITutor` player.
3. **A3. Implement Searchable Dropdown**:
   - Add a custom searchable dropdown component in the Testing Controller UI of `App.jsx` showing "Language (code)".
   - Implement filtering logic so that typing in the dropdown dynamically filters the list of 100+ languages.
   - When a language is selected, update the active subtitle track in the player.
4. **A4. Sync App to Player**: Enhance `AITutor` and `TaviVideoPlayer` to support a controlled `selectedSubLanguage` prop or allow syncing of subtitle tracks from external controls without video reloading.
5. **A5. Canvas Render optimization**:
   - Move or duplicate subtitle rendering into the Canvas context inside `TaviVideoPlayer.jsx`'s `requestAnimationFrame` loop.
   - Read the exact `video.currentTime` directly from the video element during each animation frame (avoiding React state update delays).
   - Draw primary and secondary subtitles directly on the canvas using standard HTML5 Canvas 2D text APIs (supporting RTL languages, layout spacing, background wraps).
6. **A6. Verify & Build**: Build the project and test the canvas rendering, dropdown filtering, and subtitle switching.

### Track B: Verification Track
1. **B1. Integrity Check**: Ensure no hardcoded dummy outputs or cheating patterns.
2. **B2. Compile Check**: Run `npm run build` in both `packages/tavi-video-tutor` and `examples/react-demo`.
3. **B3. Verification Check**: Audit the final result with a Forensic Auditor to guarantee correctness.
