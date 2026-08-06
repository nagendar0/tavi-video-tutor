# AITutor

AITutor is an open-source, zero-dependency React video player and Socratic AI tutor engine with native canvas rendering, audio dub sync, automated 109-language WebVTT subtitle generation, and an automated multi-resolution video quality transcoding pipeline. It combines FFmpeg audio extraction, Whisper speech recognition, transcript normalization, cue segmentation, multilingual translation, and H.264 video quality ladder generation into a unified developer SDK.

```jsx
import { AITutor } from "tavi-video-tutor";
import "tavi-video-tutor/dist/style.css";

export default function App() {
  return <AITutor src="/lesson.mp4" />;
}
```

```bash
# Generate WebVTT subtitles, video quality renditions, and manifest
npx aitutor
```

---

## 1. NEW IN v0.4.8 — MAJOR FEATURES

### 🎥 Automatic Video Quality Transcoding Pipeline
- **Zero-Config Developer Experience**: Simply place `public/lesson.mp4` and run `npx aitutor`. AITutor automatically probes your video, generates downscaled H.264/AAC quality renditions (`720p`, `480p`, `360p`, `240p`, `144p`), preserves original source resolution for top rendition without re-encoding (`source: true`), and registers them in `manifest.json`.
- **Automatic Quality Discovery**: `<AITutor src="/lesson.mp4" />` automatically discovers all available manifest quality renditions and populates the player's Settings > Quality menu without requiring manual `qualities={[...]}` props.
- **State-Preserved Quality Switching**: Seamlessly switch quality mid-video with **zero timestamp reset**, preserving `currentTime`, playback state (`playing`/`paused`), volume, mute, playback rate, active primary subtitle language, secondary subtitle language, and active cue synchronization.
- **Strict No-Upscaling Guarantee**: Never generates renditions larger than the source video height.
- **Aspect-Ratio & Encoder Safety**: Maintains exact aspect ratio across 16:9, 4:3, 1:1, 9:16 portrait, and ultrawide formats with H.264-safe even integer dimensions.
- **Smart Fingerprinting & Partial Cache Recovery**: Content-aware media fingerprinting skips unchanged files instantly. If a single rendition is missing or deleted, partial recovery regenerates **only** the missing rendition.

### 🎨 Universal High-Contrast Canvas Subtitle System (109 Languages)
- **Universal 109-Language Rendering**: Single unified canvas subtitle engine supporting Latin, Indic (Telugu, Hindi, Tamil, Malayalam, Kannada, Bengali), Arabic/RTL (Arabic, Hebrew, Urdu), CJK (Chinese, Japanese, Korean), Cyrillic, and Southeast Asian scripts.
- **Broadcast-Grade Readability**: Crisp white text (`#FFFFFF`) on dark high-contrast semi-transparent bounding box with subtle text outline and shadow to eliminate character crowding against colorful video backgrounds.
- **Responsive Viewport Auto-Scaling**: Subtitle font sizes and padding automatically scale proportionally across all screen sizes (from 320px mobile to 4K displays).

---

## 2. KEY FEATURES

- **React Video Tutor Component**: Custom HTML5 video player with canvas subtitle rendering, audio dub sync, quality selection, and modal editing.
- **Automated Subtitle Pipeline**: End-to-end processing from video file to Whisper speech-to-text, transcript normalization, cue segmentation, and WebVTT generation.
- **Automatic Video Quality Pipeline**: Automatic media probing, downscaled H.264/AAC MP4 quality ladder planning (2160p down to 144p), background FFmpeg transcoding, and automatic manifest quality discovery in `<AITutor />`.
- **109-Language Registry**: Standardized language metadata and WebVTT generation for 109 global languages with full Right-to-Left (RTL) support for Arabic, Hebrew, Urdu, etc.
- **Hybrid Online/Offline Translation**: High-speed online translation with automatic offline local NLLB (`@xenova/transformers`) fallback.
- **Content-Aware Media Identity**: Smart cache fingerprinting based on canonical path, size, modification timestamp, and sampled binary content chunks (head + middle + tail 64KB).
- **Four-Tier Subtitle Priority**: Smart resolver supporting User Uploaded > Developer Manual > Generated > Demo Fallback tracks per language.
- **Local & Remote Video Resolution**: Safe resolution for local assets (`public/`) and remote HTTP/HTTPS video streams with built-in SSRF protection.
- **CLI Management Suite**: Complete command-line tools for subtitle generation, quality pipeline execution, cache status auditing, WebVTT validation, and selective cache cleanup.

---

## 3. HOW AITUTOR WORKS

AITutor separates expensive heavy media processing (audio extraction, speech-to-text, translation, and video transcoding) from lightweight runtime client rendering:

```text
Video File (e.g. public/lesson.mp4)
         ↓
   MediaProbe & QualityPlanner
         ├── Probes resolution (e.g. 1920x1080)
         └── Plans quality ladder (1080p source, 720p, 480p, 360p, 240p, 144p)
         ↓
FFmpeg Audio & Video Transcoding Pipeline
         ├── Extracts 16kHz WAV audio for Whisper ASR
         └── Transcodes 720p/480p/360p/240p/144p MP4 renditions
         ↓
Whisper Speech-to-Text & Translation Engine
         ├── Generates Master Transcript
         ├── Normalizes transcript with domain glossary
         └── Translates WebVTT tracks into 109 target languages
         ↓
Manifest Store (public/aitutor/manifest.json)
         ↓
<AITutor /> Player (Discovers qualities & WebVTT tracks automatically)
```

- **Preprocessing Stage**: The CLI command `npx aitutor` processes video files, runs Whisper ASR, generates downscaled MP4 qualities into `public/aitutor/videos/{videoId}/`, writes `.vtt` files into `public/aitutor/subtitles/{videoId}/`, and updates `public/aitutor/manifest.json`.
- **Runtime Stage**: When `<AITutor src="/lesson.mp4" />` mounts in the browser, it loads `/aitutor/manifest.json`, finds the matching video entry, discovers available quality renditions (`1080p`, `720p`, `480p`, `360p`, `240p`, `144p`), and fetches requested WebVTT subtitle tracks. Heavy processing (FFmpeg/Whisper) **never** runs in the student's browser.

---

## 4. REQUIREMENTS

- **Node.js**: `v18.0.0` or higher.
- **npm**: `v9.0.0` or higher.
- **React**: `^18.0.0` or `^19.0.0` (Peer dependency).
- **FFmpeg**: System `ffmpeg` binary on PATH or specified via `process.env.FFMPEG_PATH`. (Local fallback binaries in `bin/ffmpeg.exe` are auto-resolved if available).
- **Browsers**: Any modern browser supporting HTML5 Video and ES2022 JavaScript (Chrome, Firefox, Safari, Edge).

---

## 5. INSTALLATION

### Step 1 — Create or Open a React Project
```bash
# Example with Vite React
npm create vite@latest my-tutor-app -- --template react
cd my-tutor-app
```

### Step 2 — Install AITutor
```bash
npm install tavi-video-tutor
```

### Step 3 — Install Required Peer Dependencies
Ensure `react` and `react-dom` are installed in your project:
```bash
npm install react react-dom
```

---

## 6. YOUR FIRST AITUTOR VIDEO

### 1. Place your video in `public/`
Copy your video file into the `public` directory of your React project:

```text
my-tutor-app/
├── public/
│   └── lesson.mp4
├── src/
│   └── App.jsx
├── package.json
└── ...
```

### 2. Add `<AITutor />` to your React component
In `src/App.jsx`:

```jsx
import React from 'react';
import { AITutor } from 'tavi-video-tutor';
import 'tavi-video-tutor/dist/style.css';

export default function App() {
  return (
    <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto', aspectRatio: '16/9' }}>
      <AITutor src="/lesson.mp4" />
    </div>
  );
}
```

---

## 7. AUTOMATIC QUALITY & SUBTITLE GENERATION

Follow this step-by-step workflow to generate multilingual subtitles and video quality renditions for your videos:

### Step 1: Create Starter Configuration (`npx aitutor init`)
Run `npx aitutor init` to generate `aitutor.config.mjs` starter configuration automatically:

```bash
npx aitutor init
```

Or create `aitutor.config.mjs` manually in your project root:

```javascript
export default {
  subtitles: {
    languages: ['en', 'es', 'hi', 'te'], // Target subtitle languages (or 'all' for 109 languages)
    quality: 'balanced',                 // 'fast' | 'balanced' | 'high'
    glossary: ['React', 'AITutor']       // Protected domain terms
  },
  qualities: {
    generate: true,                      // Automatically generate quality ladder
    targets: [2160, 1440, 1080, 720, 480, 360, 240, 144]
  },
  videos: [
    {
      id: 'lesson',
      src: './public/lesson.mp4',
      languages: ['en', 'es', 'hi', 'te']
    }
  ]
};
```

### Step 2: Run the AITutor Pipeline
Run the CLI generator from your project terminal:

```bash
npx aitutor
```

### Execution Output:
```text
AITUTOR PIPELINE ENGINE
─────────────────────────────
Processing video 1 of 1: lesson
  → Probing video metadata for lesson (1920x1080 @ 30fps)
  ✓ Quality plan: 1080p, 720p, 480p, 360p, 240p, 144p
  ✓ 1080p (source file preserved)
  → Generating 720p [████████████████████] 100%
  ✓ 720p complete (8.2 MB)
  → Generating 480p [████████████████████] 100%
  ✓ 480p complete (5.1 MB)
  → Generating 360p [████████████████████] 100%
  ✓ 360p complete (3.3 MB)
  → Generating 240p [████████████████████] 100%
  ✓ 240p complete (2.1 MB)
  → Generating 144p [████████████████████] 100%
  ✓ 144p complete (1.2 MB)
  → Running Whisper Speech-to-Text
  ✓ Generated en.vtt, es.vtt, hi.vtt, te.vtt
✓ Video lesson completed successfully
```

---

## 8. GENERATED ASSETS STRUCTURE

Running `npx aitutor` produces production-ready static assets in `public/aitutor/`:

```text
my-tutor-app/
├── public/
│   ├── lesson.mp4                          # ORIGINAL SOURCE VIDEO
│   └── aitutor/                            # PUBLIC ASSETS (Deploy to Production)
│       ├── manifest.json                   # Subtitles & Quality registry index
│       ├── videos/
│       │   └── lesson/                     # TRANSCODED QUALITIES
│       │       ├── 720.mp4
│       │       ├── 480.mp4
│       │       ├── 360.mp4
│       │       ├── 240.mp4
│       │       └── 144.mp4
│       └── subtitles/
│           └── lesson/                     # MULTILINGUAL SUBTITLES
│               ├── en.vtt
│               ├── es.vtt
│               ├── hi.vtt
│               └── te.vtt
│
└── .aitutor/                               # INTERNAL CACHE (DO NOT Commit/Deploy)
    ├── manifest.json
    ├── transcripts/
    │   └── lesson.json                     # Master ASR transcript cache
    └── videos/                             # Transcoding cache
```

---

## 9. VIDEO QUALITY RESOLUTION PRECEDENCE

AITutor resolves video quality options using a strict priority cascade:

```text
HIGHEST  1. Adaptive HLS Levels       (Automatic HLS level resolution)
         2. Developer `qualities` Prop (Explicit <AITutor qualities={...}>)
         3. Config `config.qualities` (Configured quality array)
         4. Manifest Qualities        (Discovered from public/aitutor/manifest.json)
LOWEST   5. Single Video Source       (Original video src)
```

---

## 10. SUBTITLE SOURCE PRIORITY

When multiple subtitle tracks exist for the same language, AITutor resolves tracks per language using a 4-tier priority order:

```text
HIGHEST  1. User Uploaded Subtitle   (Runtime UI user upload)
         2. Developer Manual Track   (Passed via `subtitles` prop)
         3. Generated Subtitle Track (From manifest.json)
LOWEST   4. Demo Fallback Track      (Sample demonstration track)
```

---

## 11. KEYBOARD SHORTCUTS

| Control / Shortcut | Action |
| :--- | :--- |
| **Quality Menu** | Settings > Quality dropdown selection |
| **Subtitle Menu (`S`)** | Open/close language selection dropdown |
| **Caption Toggle (`C`)** | Toggle subtitle visibility ON / OFF |
| **Play / Pause (`Space` / `K`)** | Toggle video playback |
| **Mute (`M`)** | Toggle audio mute |
| **Fullscreen (`F`)** | Toggle full-screen mode |
| **Seek Backward (`Left Arrow` / `J`)** | Seek backward 5 / 10 seconds |
| **Seek Forward (`Right Arrow` / `L`)** | Seek forward 5 / 10 seconds |

---

## 12. 109 SUPPORTED LANGUAGES

AITutor provides a built-in registry of **109 global languages** with full Right-to-Left (RTL) support for Arabic (`ar`), Hebrew (`he`), Persian (`fa`), Pashto (`ps`), Urdu (`ur`), and Sindhi (`sd`).

---

## 13. CLI COMMAND REFERENCE

Execute the CLI using `npx aitutor`:

| Command | Description | Example |
| :--- | :--- | :--- |
| `npx aitutor` / `npx aitutor generate` | Generate subtitles, video qualities, and manifest | `npx aitutor --force` |
| `npx aitutor status` | Display cache status, transcripts, and generated tracks | `npx aitutor status` |
| `npx aitutor validate` | Audit generated WebVTT headers and manifest integrity | `npx aitutor validate` |
| `npx aitutor clean` | Clean generated public/internal assets and manifests | `npx aitutor clean --video lesson` |

---

## 14. API REFERENCE

### `<AITutor />` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`src`** | `string` | *(Required)* | Video file path (`/lesson.mp4`) or remote URL (`https://...`) |
| **`id`** | `string` | `undefined` | Optional explicit video identifier |
| **`qualities`** | `array` | `undefined` | Optional explicit developer quality ladder override |
| **`subtitles`** | `object` | `{}` | Map of developer manual WebVTT paths (`{ en: '/en.vtt' }`) |
| **`defaultSubLanguage`** | `string` | `'en'` | Initial subtitle language code |
| **`subLanguage`** | `string` | `undefined` | Controlled subtitle language state |
| **`defaultAudioLanguage`** | `string` | `'original'` | Initial audio dub language |
| **`playbackRates`** | `array` | `[0.5, 1, 1.25, 1.5, 2]` | Available playback speed options |
| **`width`** | `string` | `'100%'` | Container width |
| **`height`** | `string` | `'100%'` | Container height |
| **`onPlay`** | `function` | `undefined` | Playback play event handler |
| **`onPause`** | `function` | `undefined` | Playback pause event handler |
| **`onEnded`** | `function` | `undefined` | Playback completion event handler |
| **`onSubLanguageChange`** | `function` | `undefined` | Subtitle language change callback |

---

## 15. LICENSE

MIT License © 2026 AITutor Maintainers