# Challenge Report

## Challenge Summary

**Overall risk assessment**: MEDIUM

- While the codebase shows high quality and handles HLS dynamic script loading failures gracefully, the pre-compiled library files in `packages/tavi-video-tutor/dist` are currently stale and do not export the newly added `onSubLanguageChange` prop from `AITutor`.
- Rebuilding the package is necessary for the React demo to receive language selection events correctly.

---

## Challenges

### [High] Challenge 1: Stale Pre-compiled Library Assets (`dist/tavi-video-tutor.js`)
- **Assumption challenged**: The pre-existing bundle files in the repository represent the latest source code.
- **Attack scenario**: The source component in `packages/tavi-video-tutor/src/components/AITutor.jsx` defines the `onSubLanguageChange` prop and passes it down to `TaviVideoPlayer`. However, checking the built bundle `packages/tavi-video-tutor/dist/tavi-video-tutor.js` reveals that the compiled component `At` (alias of `AITutor`) does *not* accept or pass `onSubLanguageChange`. Consequently, consumer applications like `examples/react-demo` that import from the built package will experience a silent failure where the language changes inside the player fail to sync back.
- **Blast radius**: The Testing Controller UI dropdown will not sync with the player's internal subtitle language changes.
- **Mitigation**: A fresh compilation (`npm run build` inside `packages/tavi-video-tutor`) must be executed to overwrite `dist/tavi-video-tutor.js` before deploying or running the demo.

### [Medium] Challenge 2: Dynamic External Script Dependency (`hls.js`)
- **Assumption challenged**: The user environment will always have access to CDNs to load the `hls.js` library.
- **Attack scenario**: HLS.js is loaded dynamically from `https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js`. In offline or network-restricted environments (such as headless containers running in strict code-only/no-network mode), this request will fail.
- **Blast radius**: HLS streaming (`.m3u8` video presets) will completely fail to load, triggering the native video fallback which may or may not support HLS depending on the browser (e.g. Chrome/Firefox will fail, Safari will work).
- **Mitigation**: Bundle HLS.js locally as a package dependency or provide a local offline fallback path instead of relying strictly on an external CDN.

### [Low] Challenge 3: Audio Dub Sync Drift Jitter
- **Assumption challenged**: The setInterval-based sync mechanism (running every 200ms) will smoothly align the audio dub to the video.
- **Attack scenario**: If the device experiences layout thrashing or CPU spikes, the difference between the video's `currentTime` and the dub audio's `currentTime` can fluctuate above 150ms frequently. The player will continuously execute `audio.currentTime = currentVal`, causing audio stutters and a "skipping" sound artifact.
- **Blast radius**: Degraded user experience with choppy and stuttering audio voice-overs.
- **Mitigation**: Apply a PID-controller style micro-adjustment to the audio's `playbackRate` to let it drift back into sync slowly, rather than immediately seeking, unless the drift is massive (>500ms).

---

## Stress Test & Verification Results

| Scenario | Expected Behavior | Actual/Predicted Behavior | Pass/Fail |
|---|---|---|---|
| Run `npm run build` in `packages/tavi-video-tutor` | Compiles source files and updates files in `dist/`. | Execution blocked by command permission timeout in headless mode. | **FAIL** (Environment constraint) |
| Inspect `dist/tavi-video-tutor.js` for `onSubLanguageChange` | Contains the `onSubLanguageChange` prop mapping. | Prop is missing from the compiled output (stale build). | **FAIL** (Stale artifact) |
| Inspect fallback for `loadHlsScript` failure | Safely catches loading errors and falls back to native HTML5 video player. | Correctly catches errors and assigns source directly to video element. | **PASS** |
| WebVTT translation coverage | Contains 100+ language translations. | Database contains 109 verified languages. | **PASS** |

---

## Unchallenged Areas

- **Peer Dependency Compatibility**: Not challenged. React 18/19 compatibility defined in `packages/tavi-video-tutor/package.json` is standard and correct.
- **RTL Subtitle Orientation**: The player correctly detects and sets `dir="rtl"` for Middle-Eastern languages (Arabic, Hebrew, Persian, etc.).
