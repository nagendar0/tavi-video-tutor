# Quality and Adversarial Review Report

## Review Summary

**Verdict**: REQUEST_CHANGES

This review evaluates the code changes in `examples/react-demo/src/App.jsx` and the translation database `examples/react-demo/src/subtitles.js`. While the translation file structure is valid and the searchable dropdown features robust query filtering and state encapsulation, multiple major bugs were identified:
1. **RTL Rendering Gaps**: Pashto (`ps`), Sindhi (`sd`), and Kashmiri (`ks`) are rendered Left-to-Right (`ltr`), violating internationalization standards.
2. **Numeric Subtitle Drop**: Subtitle lines consisting solely of numbers are discarded by the parser as cue numbers.
3. **Paused Frame Redraw Lag**: Subtitles do not reactively update on the canvas when the video is paused.
4. **State Desynchronization**: Child-to-parent sync is missing, causing the dropdown and the player controls to display mismatching selected languages.

---

## Quality Review Findings

### [Critical] Finding 1: RTL Formatting Missing for Pashto, Sindhi, and Kashmiri
- **What**: Subtitles in Pashto (`ps`), Sindhi (`sd`), and Kashmiri (`ks`) are drawn as Left-to-Right (`ltr`) text on the canvas.
- **Where**: `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` (line 5) and `packages/tavi-video-tutor/src/components/SubtitleEngine.jsx` (line 69).
- **Why**: The helper function `isRTL` only checks if the language is one of `['ar', 'he', 'fa', 'ur']`. It misses other Perso-Arabic script-based RTL languages present in the 109 target languages, specifically Pashto, Sindhi, and Kashmiri. This causes incorrect layout direction and punctuation placement on the canvas.
- **Suggestion**: Update the `isRTL` helper to include `'ps'`, `'sd'`, and `'ks'`:
  ```javascript
  const isRTL = (lang) => ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ks'].includes(lang);
  ```

### [Major] Finding 2: Subtitle Parser Numeric Line Exclusion
- **What**: Text lines in subtitles containing only numeric values are completely ignored by the parser.
- **Where**: `packages/tavi-video-tutor/src/components/SubtitleEngine.jsx` (line 40).
- **Why**: The parser uses `isNaN(Number(line))` to distinguish between subtitle text lines and cue numbers. If a subtitle text line contains only a number (e.g., a year like `"2026"` or a count like `"3"`), this condition evaluates to `false` and the line is skipped.
- **Suggestion**: Rewrite the parser logic to track line states sequentially (cue number ➔ timing line ➔ subtitle text) rather than relying on content-type heuristics.

### [Major] Finding 3: Subtitle Reactivity Bug on Pause
- **What**: Changing subtitle language does not redraw the canvas if the player is paused.
- **Where**: `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` (lines 899-903).
- **Why**: The canvas paint logic only redraws single frames when `currentTime` updates or when quality changes. Because switching languages does not change `currentTime` or play state, `paintSingleFrame` is never executed, and the old subtitle remains frozen on the canvas until the user plays or seeks.
- **Suggestion**: Update the `useEffect` on `currentTime` to also depend on `selectedSubLanguage` and `isDualSubtitles` so that `paintSingleFrame()` runs immediately when subtitles are updated while paused:
  ```javascript
  useEffect(() => {
    if (!isPlaying) {
      paintSingleFrame();
    }
  }, [currentTime, selectedSubLanguage, isDualSubtitles]);
  ```

### [Minor] Finding 4: Missing Language Name Mappings in App.jsx
- **What**: Missing language mappings for `gu`, `ha`, `jv`, `kn`, and `ks` in `LANGUAGE_NAMES`.
- **Where**: `examples/react-demo/src/App.jsx` (lines 6-111).
- **Why**: There are 109 languages in `subtitles.js` but only 104 keys defined in `LANGUAGE_NAMES`. The missing languages cause the dropdown to fallback to displaying their uppercase codes ("GU (GU)", "HA (HA)", "JV (JV)", "KN (KN)", "KS (KS)") instead of their full names ("Gujarati", "Hausa", "Javanese", "Kannada", "Kashmiri").
- **Suggestion**: Add the following entries to `LANGUAGE_NAMES`:
  ```javascript
  gu: "Gujarati",
  ha: "Hausa",
  jv: "Javanese",
  kn: "Kannada",
  ks: "Kashmiri",
  ```

### [Minor] Finding 5: Child-to-Parent State Desynchronization
- **What**: Toggling subtitles or changing subtitle tracks in the player's internal settings menu desynchronizes the external dropdown controller.
- **Where**: `examples/react-demo/src/App.jsx` (lines 580-584) & `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx`
- **Why**: State synchronization is unidirectional (Parent ➔ Child). If a user uses the player's native controls (the CC button or settings menu) to change subtitles, this state change is not sent back to the parent `App` component. The external Testing Controller dropdown still displays the old selected language.
- **Suggestion**: Add an `onSubLanguageChange` callback prop to `<AITutor>` and `<TaviVideoPlayer>`, and call it inside the player's settings click handlers and the `handleCCToggle` handler to sync the parent's `selectedLang` state.

---

## Verified Claims

- **Claim 1**: `subtitles.js` contains valid WebVTT structures for all 109 target languages.
  - *Method*: Static analysis of `subtitles.js` generation loop and structure. Verified `WEBVTT` file header presence, correct line breaks, cue numbering, non-overlapping timestamps (`00:00:00.500 --> 00:00:04.000` etc.), and presence of exactly 109 language key arrays in `translations` database.
  - *Status*: **PASS**

- **Claim 2**: Searchable dropdown UI implementation in `App.jsx` has clean styling, proper state management, and robust search filtering.
  - *Method*: Code review of `SearchableLanguageDropdown`. Verified inline layout styles, customized scrollbars, click-outside modal close shield, autoFocus search text field, correct case-insensitive sub-string filtering against names/codes, and state encapsulation (typing in search box does not trigger parent re-renders).
  - *Status*: **PASS**

- **Claim 3**: Changing subtitle tracks reactively passes variables correctly without forcing player remounts.
  - *Method*: Traced key rendering path. Key on `<AITutor>` is bound to `videoSrc`. Prop updates to `defaultSubLanguage` bypass remounts and propagate to `selectedSubLanguage` state in `TaviVideoPlayer`, triggering memo updates.
  - *Status*: **PASS** (However, paused rendering fails as described in Finding 3).

---

## Coverage Gaps

- **Greenfield / Custom Players**: The testing of YouTube and Vimeo video streams with the custom subtitle renderer is a gap. Because YouTube and Vimeo use iframe wrappers, the custom canvas drawing layer does not paint over their native iframe canvases, so subtitles must fall back to the DOM-based `SubtitleRenderer` overlay. This overlay doesn't use the canvas drawing loop and is therefore not covered by the zero-latency rendering optimization.
  - *Risk*: **MEDIUM**
  - *Recommendation*: Document the iframe rendering limitation clearly in the design docs and ensure the DOM overlay works seamlessly as a fallback.

---

## Unverified Items

- **HLS Subtitle Sync**: Checking synchrony between dynamic HLS video levels and local subtitles under low network bandwidth was not verified.
  - *Reason*: Requires live network simulation and browser devtools debugging.

---

## Adversarial Review (Challenge Report)

**Overall risk assessment**: MEDIUM

### Challenges

#### [High] Challenge 1: Subtitle Parser Numeric Line Exclusion
- **Assumption challenged**: Subtitle text lines always contain alphabetic characters and are never purely numeric.
- **Attack scenario**: Subtitles displaying numbers like a year ("2026") or numeric data.
- **Blast radius**: The parser treats the numeric subtitle line as a cue number and drops it, rendering incomplete subtitles.
- **Mitigation**: Parse WebVTT sequentially using timing markers (`-->`) rather than checking `isNaN(Number(line))`.

#### [High] Challenge 2: Pashto, Sindhi, and Kashmiri Layout Distortion
- **Assumption challenged**: The list of RTL languages in the player is limited to Arabic, Hebrew, Persian, and Urdu.
- **Attack scenario**: Rendering Pashto (`ps`), Sindhi (`sd`), or Kashmiri (`ks`) translations.
- **Blast radius**: Subtitles are displayed LTR, distorting punctuation and alignment for millions of speakers.
- **Mitigation**: Update `isRTL` to check against the full set of RTL languages in the 109 target languages.

#### [Medium] Challenge 3: Paused Frame Redraw Lag
- **Assumption challenged**: Subtitles only need to update when the video playhead position changes (`currentTime`).
- **Attack scenario**: User switches language while the video is paused.
- **Blast radius**: The old subtitle stays on screen on the canvas, mismatching the user's active selection.
- **Mitigation**: Add `selectedSubLanguage` to the dependencies of the pause-paint effect hook.
