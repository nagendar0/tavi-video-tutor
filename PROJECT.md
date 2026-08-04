# Project: AI Video Tutor Multilingual Subtitles & Optimization

This project implements subtitle translations into 100+ languages, a searchable dropdown selector in the controller UI, and an optimized, zero-latency canvas subtitle rendering engine.

## Architecture

- **`packages/tavi-video-tutor`**: Zero-dependency canvas video player core.
  - **`TaviVideoPlayer.jsx`**: Renders video frames onto a canvas using `requestAnimationFrame`. Controls playback speed, volume, fullscreen, and subtitle selection.
  - **`SubtitleEngine.jsx`**: WebVTT parsing and DOM-based subtitle overlay rendering.
  - **`AudioDubSync.jsx`**: Synchronization helper for translated audio dubbing tracks.
- **`examples/react-demo`**: A React application demonstrating the player with various video streams and controls.
  - **`App.jsx`**: Main demo component displaying the Testing Controller and video player.

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| 1 | Subtitle Translation Generation | Generate WebVTT translations for all 100+ specified languages, stored in `subtitles.js`. | None | COMPLETED |
| 2 | Searchable Dropdown selector | Add searchable language selection dropdown to Testing Controller UI in `App.jsx` and sync with player. | Milestone 1 | COMPLETED |
| 3 | Canvas Subtitle Rendering | Optimize rendering by drawing subtitles directly inside the Canvas element at 60fps to ensure zero latency. | Milestone 2 | COMPLETED |
| 4 | Integration & Build Verification | Verify all acceptance criteria and ensure `npm run build` succeeds. | Milestone 3 | COMPLETED |

## Interface Contracts

### Subtitles Prop (`subtitles`)
- Structure: `{ [langCode: string]: string }` where `string` is a valid WebVTT string.
- Keys must match the 100+ specified language codes (e.g. `af`, `sq`, `ar`, etc.).

### Dropdown ↔ Player Sync
- A new prop `subLanguage` (or extending `defaultSubLanguage` to behave reactively) to allow external selection of subtitle language from the Testing Controller UI without reloading the entire player component or video stream.

## Code Layout

- `packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx` — Canvas loop, playback, controls and settings.
- `packages/tavi-video-tutor/src/components/SubtitleEngine.jsx` — Parsing and subtitle rendering logic.
- `examples/react-demo/src/App.jsx` — Demo application and Testing Controller UI.
- `examples/react-demo/src/subtitles.js` — Auto-generated subtitle translation database.
