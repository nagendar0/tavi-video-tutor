# Handoff Report — Reviewer 1

## 1. Observation

- **`examples/react-demo/src/subtitles.js` (lines 553-567)**:
  ```javascript
  const subtitles = {};
  for (const [langCode, lines] of Object.entries(translations)) {
    subtitles[langCode] = `WEBVTT
  
  1
  00:00:00.500 --> 00:00:04.000
  ${lines[0]}
  
  2
  00:00:04.500 --> 00:00:09.500
  ${lines[1]}
  
  3
  00:00:10.000 --> 00:00:15.000
  ${lines[2]}`;
  }
  ```
  The `translations` object contains exactly 109 keys, starting with `af:` on line 5 and ending with `zu:` on line 545.

- **`examples/react-demo/src/App.jsx` (lines 6-111)**:
  Defines `LANGUAGE_NAMES` containing exactly 104 entries. Entries for `gu` (Gujarati), `ha` (Hausa), `jv` (Javanese), `kn` (Kannada), and `ks` (Kashmiri) are missing.
  
- **`packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` (lines 899-903)**:
  ```javascript
  // Paint single frame when paused and seeking
  useEffect(() => {
    if (!isPlaying) {
      paintSingleFrame();
    }
  }, [currentTime]);
  ```
  The effect hook depends solely on `currentTime`. There are no calls to `paintSingleFrame()` inside effects watching `selectedSubLanguage` or `isDualSubtitles`.

- **`packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` (line 5)** and **`packages/tavi-video-tutor/src/components/SubtitleEngine.jsx` (line 69)**:
  ```javascript
  const isRTL = (lang) => ['ar', 'he', 'fa', 'ur'].includes(lang);
  ```
  Pashto (`ps`), Sindhi (`sd`), and Kashmiri (`ks`) are present in `translations` but are not in the `isRTL` array.

- **`packages/tavi-video-tutor/src/components/SubtitleEngine.jsx` (line 40)**:
  ```javascript
  } else if (currentCue && line !== '' && isNaN(Number(line))) {
    // Append text line to active cue
    currentCue.text += (currentCue.text ? ' ' : '') + line;
  }
  ```
  The parser ignores any non-empty subtitle text line if `isNaN(Number(line))` is `false` (i.e. it is a number).

---

## 2. Logic Chain

1. **WebVTT Validity**: The string template in `subtitles.js` starts with `WEBVTT`, has a blank line, cue numbers, valid non-overlapping timestamp blocks, and text content. Because the loop iterates over all 109 languages in `translations` and inserts them into this template, all 109 languages produce valid WebVTT structures.
2. **Missing Names**: `LANGUAGE_NAMES` has 104 entries, while `subtitles.js` has 109 entries. The codes `gu`, `ha`, `jv`, `kn`, and `ks` are in `subtitles.js` but missing from `LANGUAGE_NAMES`. When mapped in `App.jsx` (lines 113-116), they fallback to their uppercase codes. Therefore, the dropdown will display codes like "GU (GU)" instead of full language names.
3. **Paused Frame Redraw Lag**: The draw loop only runs when `!video.paused`. When the video is paused, the only redraw mechanism is `paintSingleFrame()` within the `[currentTime]` effect hook. When `selectedSubLanguage` changes while paused, `currentTime` does not change, so the effect is not triggered and the canvas does not redraw. Therefore, subtitles do not update immediately when paused.
4. **RTL Formatting Gap**: Pashto (`ps`), Sindhi (`sd`), and Kashmiri (`ks`) are RTL languages. Because they are not checked in `isRTL`, the layout direction remains LTR, causing layout distortion for these languages on the canvas.
5. **Numeric Subtitle Drop**: If a subtitle text line consists solely of a number, `isNaN(Number(line))` returns `false`. This causes the parser to skip the line, dropping numeric captions.

---

## 3. Caveats

- **Build and Runtime Validation**: The build execution via `run_command` timed out waiting for user approval. However, the static code analysis of the files is comprehensive and sufficient to confidently identify the findings.
- **IFrame Video Players**: The canvas subtitle drawing optimization is only valid for canvas-rendered HTML5 videos and HLS feeds. Iframe sources (YouTube/Vimeo) cannot be drawn on canvas and will fall back to HTML overlay rendering.

---

## 4. Conclusion

The code changes pass on basic WebVTT structures and reactive track changing (without remounting). However, they fail on correctness, completeness, and internationalization:
- **RTL rendering**: Pashto, Sindhi, and Kashmiri are rendered LTR.
- **Numeric captions**: Purely numeric subtitle lines are completely ignored.
- **Paused reactivity**: Canvas subtitles do not redraw when changed while paused.
- **Display names**: Five languages are missing mappings, resulting in uppercase codes in the dropdown.
- **State desync**: Child-to-parent synchronization is missing.

Action is required to address these issues. The verdict is `REQUEST_CHANGES`.

---

## 5. Verification Method

To verify the findings:
1. Open `examples/react-demo/src/App.jsx` and inspect lines 6-111 to confirm the missing language keys (`gu`, `ha`, `jv`, `kn`, `ks`).
2. Open `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` and search for `isRTL` to verify Pashto (`ps`), Sindhi (`sd`), and Kashmiri (`ks`) are missing.
3. Run the demo application:
   ```bash
   cd examples/react-demo
   npm install
   npm run dev
   ```
4. Pause the video player, change the subtitle track from the Testing Controller, and check if the canvas subtitle updates (it will not).
5. Load a subtitle track containing a numeric line (e.g. "2026") and verify it is not rendered.
