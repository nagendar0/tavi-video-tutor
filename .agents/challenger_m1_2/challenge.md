# Challenge Report — Subtitle Rendering & Dropdown Selector

## Challenge Summary

**Overall risk assessment**: MEDIUM

## Challenges

### [Medium] Paused State Rendering Lag

- **Assumption challenged**: Subtitle language selections in the dropdown or settings menu update the canvas subtitle display immediately.
- **Attack scenario**: The user pauses the video. They change the subtitle language from English to Spanish using the dropdown selector or the settings menu. Since the video is paused, the canvas is not repainted with the new subtitle. The canvas continues to display the English subtitle on the screen.
- **Blast radius**: User interface synchronization. The subtitle displayed on screen remains out-of-sync with the selected language until the user plays the video or seeks.
- **Mitigation**: Add a `useEffect` hook in `TaviVideoPlayer.jsx` to call `paintSingleFrame()` when subtitle-related states change while the video is paused:
  ```jsx
  useEffect(() => {
    if (!isPlaying) {
      paintSingleFrame();
    }
  }, [selectedSubLanguage, isDualSubtitles, primaryCues, secondaryCues]);
  ```

### [Medium] Subtitles Overlapping with UI Controls on Low Canvas Heights

- **Assumption challenged**: Subtitles are positioned correctly and never overlap with other UI elements.
- **Attack scenario**: The video player runs at a smaller size (e.g. embedded at 360p or 480p). When the user hovers over the player or pauses, the controls HUD bar becomes visible. Because the controls HUD has a fixed height of 52px, and the subtitles bottom margin scales dynamically as 8.5% of canvas height, the subtitles overlap with the controls (overlap of 21.4px at 360p, and 11.2px at 480p).
- **Blast radius**: Visual legibility. Subtitles are partially obscured by control buttons, the progress scrubber, or timestamp display.
- **Mitigation**: Adjust the canvas subtitle bottom margin calculation to account for the minimum space required by the controls bar when visible, or push the subtitles higher up when controls are visible:
  ```jsx
  // In drawCanvasSubtitles, pass areControlsVisible and use it to determine margin
  const visibleControlsHeight = areControlsVisible ? 58 : 12;
  const bottomMargin = Math.max(canvasHeight * 0.085, visibleControlsHeight + 8);
  ```

## Stress Test Results

- **Switching language while playing** → Subtitles update dynamically and video stream does not reload → **PASS**
- **Switching language while paused** → Subtitle text on screen does not update until play/seek → **FAIL** (rendering lag bug)
- **Timestamp Matching** → Binary search finds correct cues at boundaries ($0.5$s, $4.0$s, $4.5$s, $9.5$s) → **PASS**
- **Dropdown Search** → 100+ languages filtered reactively based on input changes → **PASS**
- **Dual Subtitles Stacking** → Calculated ranges show clear gap separating primary and secondary text blocks → **PASS**
- **Controls Overlap at High Heights (720p/1080p)** → Subtitles clear controls completely → **PASS**
- **Controls Overlap at Low Heights (360p/480p)** → Subtitles overlap with visible controls bar → **FAIL** (layout bug)

## Unchallenged Areas

- **HLS adaptive rendering** — HLS stream qualities loading and sync are out of scope.
- **Audio dubbing track synchronization** — Synchronization logic is out of scope.
