## 2026-07-16T05:52:30Z
You are the Worker. Your task is to perform the final fixes and package builds for the AI Video Tutor player.

Please implement the following changes:

1. **Paused State Redraw Lag (TaviVideoPlayer.jsx)**:
   - Update the paused redraw `useEffect` (which calls `paintSingleFrame()`) to include `isPlaying` and `areControlsVisible` in its dependency array. This ensures that when the user pauses the video and the controls HUD transitions to visible, the canvas is immediately repainted and the subtitles are shifted up correctly.
   ```javascript
   useEffect(() => {
     if (!isPlaying) {
       paintSingleFrame();
     }
   }, [currentTime, selectedSubLanguage, isDualSubtitles, primaryCues, secondaryCues, isPlaying, areControlsVisible]);
   ```

2. **Resolution-Adaptive Controls HUD Margin (TaviVideoPlayer.jsx)**:
   - In `drawCanvasSubtitles`, calculate the scaling ratio between the canvas resolution height (`canvas.height`) and its physical client layout height (`canvas.clientHeight`) dynamically:
     `const canvas = ctx.canvas;`
     `const scale = canvas && canvas.clientHeight ? (canvas.height / canvas.clientHeight) : 1;`
   - Use this scale factor to adjust the controls HUD height and bottom margin in canvas coordinates:
     `const visibleControlsHeight = areControlsVisible ? (52 * scale) : (12 * scale);`
     `const bottomMargin = Math.max(canvasHeight * 0.085, visibleControlsHeight + (8 * scale));`
   This guarantees that subtitles dynamically adjust and clear the controls HUD at all player sizes and video resolutions.

3. **Fresh Production Build Compilation**:
   - Run `npm run build` inside `packages/tavi-video-tutor` to regenerate the built bundle files in `dist/`.
   - Run `npm run build` inside `examples/react-demo` to verify bundling succeeds with the new library build and database imports.
   Both builds must run successfully to ensure the pre-compiled assets (`dist/tavi-video-tutor.js`) are up to date and contain the final `onSubLanguageChange` and rendering logic.

Write your handoff report to `c:\Users\nagen\ai-tutor-system\.agents\worker_m2_fix\handoff.md` and report back.
