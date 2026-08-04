## 2026-07-16T05:35:00Z

<USER_REQUEST>
You are the Worker. Your task is to implement all three requirements for the AI Tutor subtitle system in `c:\Users\nagen\ai-tutor-system`.

Please follow these exact steps:

### Phase 1: Subtitle Translation Database
1. Run the local subtitle generator script: `node .agents/explorer_m1_1/generate_subtitles.js` to write `examples/react-demo/src/subtitles.js`.
2. Verify that the file `examples/react-demo/src/subtitles.js` has been created and exports the database.

### Phase 2: Searchable Language Selector in Testing Controller
1. Modify `examples/react-demo/src/App.jsx`:
   - Import the `subtitles` object from `./subtitles.js`.
   - Remove the old `sampleSubtitles` object.
   - Implement the `SearchableLanguageDropdown` component and select state (`selectedLang`, default `'en'`) based on the design in `c:\Users\nagen\ai-tutor-system\.agents\explorer_m1_2\analysis.md`.
   - Add dynamic fallback translation generation for any of the 100+ languages that may not be predefined in `sampleSubtitles` (if any are missing, though `generate_subtitles.js` should cover all 109).
   - Integrate the `SearchableLanguageDropdown` into the Testing Controller UI.
   - Pass the reactively selected language to `AITutor` as `defaultSubLanguage` and pass the merged `subtitles` database so it reactively updates without component remounting (keep the player `key` bound to `videoSrc` only).

### Phase 3: Zero-Latency Canvas Subtitle Rendering
1. Modify `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` to draw subtitles directly inside the Canvas element at 60fps:
   - Add a `useEffect` to sync the internal state `selectedSubLanguage` when the prop `defaultSubLanguage` changes.
   - Implement React `useRef` trackers to store `selectedSubLanguage`, `isDualSubtitles`, `primaryCues`, `secondaryCues`, `selectedSubLanguage` and target codes, so the 60fps canvas draw loop has access to the most up-to-date parameters without closure staleness.
   - Update these refs when their corresponding states or memoized values change.
   - Refactor the canvas drawing loop (`paintSingleFrame` and the continuous `requestAnimationFrame` loop) to call a canvas subtitle drawing helper (e.g. `drawCanvasSubtitles`) immediately after drawing the video frame (`ctx.drawImage`).
   - Read `video.currentTime` directly from the offscreen video element inside the loop to ensure frame-accurate sync.
   - Implement text wrapping, background boxes, RTL handling (`direction = isRTL(lang) ? 'rtl' : 'ltr'`), relative font-sizing based on canvas height, and dual subtitle stacking based on the design in `c:\Users\nagen\ai-tutor-system\.agents\explorer_m1_3\analysis.md`.
   - Disable/remove the old DOM-based `<div className="tavi-subtitle-display-overlay">` so subtitles are not rendered twice.

### Phase 4: Build Verification
1. Run `npm run build` in `packages/tavi-video-tutor` to build the player library first.
2. Run `npm run build` in `examples/react-demo` to ensure there are no bundling or compilation issues.
3. Write your completion report in `c:\Users\nagen\ai-tutor-system\.agents\worker_m1\handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

</USER_REQUEST>
