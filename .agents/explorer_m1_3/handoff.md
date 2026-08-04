# Handoff Report — Explorer 3: Subtitle Rendering Optimization

## 1. Observation
We examined the current subtitle rendering implementation in two main files:
1. **`packages/tavi-video-tutor/src/components/SubtitleEngine.jsx`**:
   - The active cues matching `currentTime` are queried using standard array searches:
     ```javascript
     const activePrimary = primaryCues.find(
       cue => currentTime >= cue.start && currentTime <= cue.end
     );
     ```
   - Subtitles are rendered as DOM elements overlays:
     ```javascript
     return (
       <div className="tavi-subtitles-container">
         {activePrimary && (
           <div className="subtitle-line primary" dir={isRTL(primaryLang) ? 'rtl' : 'ltr'}>
             {activePrimary.text}
           </div>
         )}
         ...
       </div>
     );
     ```
2. **`packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`**:
   - The media time updates are captured using the browser's standard low-frequency `ontimeupdate` handler (lines 557-560):
     ```javascript
     video.ontimeupdate = () => {
       setCurrentTime(video.currentTime);
       onProgress?.({ playedSeconds: video.currentTime });
     };
     ```
   - The canvas element visual frame drawing runs inside a 60fps `requestAnimationFrame` loop (lines 708-718):
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
   - Subtitles are rendered asynchronously via a mounted React DOM component (`<SubtitleRenderer>`) located at lines 942-953.

## 2. Logic Chain
- **Observation 1**: Visual frames are painted to the canvas in a continuous `requestAnimationFrame` loop at 60fps (Observation 2).
- **Observation 2**: Subtitle content updates depend on React state updates (`currentTime`) triggered by `ontimeupdate` (Observation 2).
- **Inference 1**: The browser's native `timeupdate` event fires infrequently (approx. every 150ms–250ms), creating an inherent delay between subtitle updates and the actual frame content.
- **Inference 2**: React state updates (`setCurrentTime`) schedule asynchronous virtual DOM reconciliations and component re-renders, introducing main-thread latency and layout cost.
- **Inference 3**: Rendering visual frames on canvas at 60fps, while rendering subtitles asynchronously in the DOM at ~4-10fps, creates a decoupled rendering loop. This mismatch guarantees synchronization drift and text rendering lag.
- **Conclusion**: Drawing subtitles directly onto the canvas in the same `requestAnimationFrame` thread context, reading the high-precision `video.currentTime` directly from the video decoder element, completely bypasses React state lag and ensures zero-latency, frame-accurate synchronization.

## 3. Caveats
- Subtitle stylings (font, colors, background box properties) must be hardcoded or passed as configuration options to the canvas context, rather than using CSS stylesheets.
- Rich-text or complex HTML/CSS inside subtitles (e.g. bold tags, italics, Ruby characters) is not natively parsed by Canvas 2D and would require a custom canvas text parser if utilized in subtitles.
- The canvas sizing is dynamic (changes with video resolution/player size). Font sizing and vertical layout heights must be carefully calculated relative to the canvas height to ensure responsive design matches the original DOM-based appearance.

## 4. Conclusion
We propose drawing subtitles directly onto the canvas in the 60fps `requestAnimationFrame` loop using a unified canvas render pipeline. By threading cues through refs (`primaryCuesRef`, etc.) and using an efficient binary search algorithm to retrieve active cues, we completely avoid React updates during video playback. Text wrapping, background box drawing, and dual-subtitle stacked coordinates are handled programmatically relative to canvas size.

## 5. Verification Method
- **Inspect Files**: Review `analysis.md` for the complete design details and the proposed implementation functions (`drawCanvasSubtitles`, `wrapText`, `findActiveCue`).
- **Integration Test**: Check if the code runs frame-accurately under stressful system conditions (such as high CPU load or high playback speed rates like 2.0x).
- **Regression Check**: Ensure subtitles update instantly when a seek occurs while paused, by calling the draw pipeline within the `paintSingleFrame()` method.
