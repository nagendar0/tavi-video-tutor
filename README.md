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

## 1. NEW IN v2.0.1 — ENTERPRISE PLAYER SDK & RELEASE REMEDIATION

### ⚡ Pure Lightweight Browser Player (`tavi-video-tutor/player`)
- **Zero AI Runtime Bloat**: Normal player imports (`import { AITutor } from "tavi-video-tutor/player"`) bundle only the vector-sharp React video player, canvas subtitle renderer, and resolution hooks with **0 ONNX WASM runtime files** and **0 Transformers overhead**.
- **On-Demand Auto-Transcription**: In-browser Whisper ASR speech-to-text is fully isolated behind dynamic import and only loaded if `autoTranscribe={true}` is explicitly passed.

### 🔍 Razor-Sharp High-DPI Canvas Rendering (`devicePixelRatio`)
- **Retina & 4K Auto-Scaling**: Automatically detects `window.devicePixelRatio` and scales the canvas backing store resolution (`canvas.width = rect.width * dpr`) to guarantee vector-sharp subtitle typography on MacBook Retina displays, 4K monitors, Surface devices, and high-DPI mobile screens.
- **Zero-Allocation 60fps Rendering Loop**: Prevents layout thrashing and V8 Garbage Collection micro-stutters during 4K video playback.

### ♿ Full WAI-ARIA Accessibility & Screen Reader Support (Section 508)
- **Screen Reader Live Region (`aria-live="polite"`)**: Includes a visually-hidden live region (`<div className="sr-only" aria-live="polite">`) that synchronizes and announces active subtitle text for visually impaired students using VoiceOver, NVDA, or JAWS.
- **Comprehensive WAI-ARIA Controls**: Full `aria-label`, `aria-expanded`, `aria-pressed`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `:focus-visible` outline indicators across all player buttons and volume sliders.

### 💾 LocalStorage Student Preference Persistence
- **Automatic Preference Restoration**: Student player choices (`volume`, `isMuted`, `playbackRate`, `selectedSubLanguage`, `selectedQuality`) are automatically saved to `localStorage` (`aitutor_user_preferences`) and restored seamlessly across course modules and page reloads.

### 🌲 Tree-Shakeable Sub-Path Package Exports
- **Modular Entrypoints**: Sub-path exports configured in `package.json`:
  - `import { AITutor } from "tavi-video-tutor";` (Main bundle)
  - `import { AITutor } from "tavi-video-tutor/player";` (Pure React Player - Zero CLI bloat)
  - `import { resolveSubtitleAvailability } from "tavi-video-tutor/subtitles";` (Resolver logic)
  - `import { resolveAudioAvailability } from "tavi-video-tutor/audio";` (Audio Resolver logic)
  - `import "tavi-video-tutor/style.css";` (CSS styling)

### 🚀 Next.js & Server-Side Rendering (SSR) Integration
- **SSR Safe**: Fully safe for Next.js (App Router & Pages Router) using `next/dynamic` with `ssr: false`:
```jsx
// components/VideoPlayer.jsx
import dynamic from 'next/dynamic';
import 'tavi-video-tutor/style.css';

const AITutor = dynamic(() => import('tavi-video-tutor/player').then(m => m.AITutor), {
  ssr: false
});

export default function VideoLesson() {
  return <AITutor src="/lesson.mp4" />;
}
```

---

## 2. FEATURES

- **React Video Tutor Component**: Custom HTML5 video player with subtitle rendering, audio dub sync, automatic video quality ladder selection (`144p` to `1080p`), canvas rendering, and modal editing.
- **Automated Video Quality Transcoding Pipeline**: Multi-resolution H.264/AAC quality ladder generation (`720p`, `480p`, `360p`, `240p`, `144p`) with aspect ratio preservation and no-upscaling guarantee.
- **Automated Subtitle Pipeline**: End-to-end processing from video file to Whisper speech-to-text, transcript normalization, cue segmentation, and WebVTT generation.
- **109-Language Registry**: Standardized language metadata and WebVTT generation for 109 global languages with full Right-to-Left (RTL) support for Arabic, Hebrew, Urdu, etc.
- **Hybrid Online/Offline Translation**: High-speed online translation with automatic offline local NLLB (`@xenova/transformers`) fallback.
- **Content-Aware Media Identity**: Smart cache fingerprinting based on canonical path, size, modification timestamp, and sampled binary content chunks (head + middle + tail 64KB).
- **Four-Tier Subtitle Priority**: Smart resolver supporting User Uploaded > Developer Manual > Generated > Demo Fallback tracks per language.
- **Local & Remote Video Resolution**: Safe resolution for local assets (`public/`) and remote HTTP/HTTPS video streams with built-in SSRF protection.
- **CLI Management Suite**: Complete command-line tools for subtitle generation, cache status auditing, WebVTT validation, and selective cache cleanup.

---

## 3. HOW AITUTOR WORKS

AITutor separates expensive heavy media processing (audio extraction, speech-to-text, multilingual translation, and multi-resolution video transcoding) from lightweight runtime client rendering:

```text
                        Video File (Local / Remote)
                                     │
            ┌────────────────────────┴────────────────────────┐
            ▼                                                 ▼
[ Subtitle Processing Pipeline ]             [ Video Quality Transcoding Pipeline ]
            │                                                 │
FFmpeg Audio Extraction (16kHz PCM WAV)             FFmpeg Probe Video Metadata
            │                                                 │
Whisper Speech-to-Text (Master Transcript)          Quality Ladder Planner (Height <= Source)
            │                                                 │
Transcript Normalizer (Glossary Preservation)       Multi-Resolution H.264/AAC Encoder
            │                                       (720p, 480p, 360p, 240p, 144p)
Subtitle Segmenter (Readability & Timing)                     │
            │                                                 │
Multilingual Translation (Online / Offline NLLB)              │
            │                                                 │
WebVTT File Generator (en.vtt, te.vtt...)                      │
            │                                                 │
            └────────────────────────┬────────────────────────┘
                                     ▼
                      Manifest Store (/public/aitutor/manifest.json)
                                     ▼
                <AITutor /> Player (Renders VTT & Transcoded Qualities)
```

- **Preprocessing Stage**: The CLI command `npx aitutor` probes video files, runs Whisper ASR speech-to-text, translates transcriptions into target languages, transcodes downscaled H.264/AAC quality renditions (`720p`, `480p`, `360p`, `240p`, `144p`), writes static assets to `public/aitutor/`, and registers everything in `public/aitutor/manifest.json`.
- **Runtime Stage**: When `<AITutor src="/lesson.mp4" />` mounts in the browser, it loads `/aitutor/manifest.json`, discovers available WebVTT subtitle tracks and video quality renditions, and enables dynamic language & quality switching. Heavy processing (FFmpeg/Whisper/Transcoding) **never** runs in the student's browser.


---

## 4. REQUIREMENTS

- **Node.js**: `v18.0.0` or higher.
- **npm**: `v9.0.0` or higher.
- **React**: `^18.0.0` or `^19.0.0` (Peer dependency).
- **FFmpeg**: System `ffmpeg` binary on PATH or specified via `process.env.FFMPEG_PATH`. (Windows: `winget install Gyan.FFmpeg`, macOS: `brew install ffmpeg`, Linux: `sudo apt install ffmpeg`).
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

### Step 3 — Install Peer Dependencies
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

## 7. AUTOMATIC SUBTITLE & VIDEO QUALITY GENERATION

Follow this step-by-step workflow to generate multilingual subtitles and video quality renditions for your videos from zero:

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
    generate: true,                      // Automatically generate quality ladder (720p, 480p, 360p, 240p, 144p)
    targets: [1080, 720, 480, 360, 240, 144]
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

#### Supported Configuration Formats

AITutor automatically detects and loads any of the following configuration files in your project root:

- **`aitutor.config.mjs` (ESM — Recommended)**:
  ```javascript
  export default {
    subtitles: { languages: ['en', 'es', 'hi', 'te'] },
    qualities: { generate: true },
    videos: [{ id: 'lesson', src: './public/lesson.mp4' }]
  };
  ```
- **`aitutor.config.cjs` (CommonJS)**:
  ```javascript
  module.exports = {
    subtitles: { languages: ['en', 'es', 'hi', 'te'] },
    qualities: { generate: true },
    videos: [{ id: 'lesson', src: './public/lesson.mp4' }]
  };
  ```
- **`aitutor.config.json` (JSON)**:
  ```json
  {
    "subtitles": { "languages": ["en", "es", "hi", "te"] },
    "qualities": { "generate": true },
    "videos": [{ "id": "lesson", "src": "./public/lesson.mp4" }]
  }
  ```
- **`aitutor.config.js`**: Uses `export default` when host `package.json` contains `"type": "module"`, or `module.exports` when host `package.json` uses CommonJS.

### Step 2: Run the AITutor Generator
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
  → Reading video URL with FFmpeg
  → Extracting audio stream
  ✓ Audio extracted (audio.wav, 2.40 MB)
  → Running Whisper Speech-to-Text
  ✓ Detected source language: English
  ✓ Segments count: 12
  → Generating WebVTT subtitles
  ✓ Generated en.vtt [PASS]
  ✓ Generated es.vtt [PASS]
  ✓ Generated hi.vtt [PASS]
  ✓ Generated te.vtt [PASS]
✓ Video lesson completed successfully
```

---

## 8. GENERATED ASSETS STRUCTURE

Subtitle generation and video quality transcoding output public production assets and maintain an internal processing cache:

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

- **`public/aitutor/`**: Production static artifacts loaded by browser client. Must be included in your static site deployment.
- **`.aitutor/`**: Local caching directory storing raw speech transcripts to prevent re-running Whisper ASR when modifying subtitle styles or adding languages.

---

## 9. USING GENERATED SUBTITLES

Once `npx aitutor` finishes, `<AITutor src="/lesson.mp4" />` automatically detects pre-generated subtitles without requiring manual VTT imports:

1. `<AITutor />` fetches `/aitutor/manifest.json`.
2. It matches the video `src` or `id`.
3. It loads the corresponding WebVTT track (e.g., `/aitutor/subtitles/lesson/en.vtt`).
4. Subtitles display dynamically synced to video playback.

---

## 10. SELECTING SUBTITLE LANGUAGES & SHORTCUTS

Users can control subtitle display via the player UI controls or keyboard shortcuts:

| Control / Shortcut | Action |
| :--- | :--- |
| **Subtitle Menu (`S`)** | Open/close language selection dropdown |
| **Caption Toggle (`C`)** | Toggle subtitle visibility ON / OFF |
| **Play / Pause (`Space` / `K`)** | Toggle video playback |
| **Mute (`M`)** | Toggle audio mute |
| **Fullscreen (`F`)** | Toggle full-screen mode |
| **Seek Backward (`Left Arrow` / `J`)** | Seek backward 5 / 10 seconds |
| **Seek Forward (`Right Arrow` / `L`)** | Seek forward 5 / 10 seconds |

---

## 11. 109 SUPPORTED LANGUAGES

AITutor provides a built-in registry of **109 global languages**:

- **Online Translation Coverage**: **109 / 109 languages** supported via translation providers.
- **Native Offline NLLB Coverage**: **106 / 109 languages** supported locally via `@xenova/transformers`.
- **Unsupported Offline Languages**: `bi` (Bislama), `ch` (Chamorro), `doi` (Dogri).

<details>
<summary><strong>Click to View Complete 109 Language Code Registry</strong></summary>

| Code | Name | Native Name | Direction |
| :--- | :--- | :--- | :--- |
| `af` | Afrikaans | Afrikaans | ltr |
| `sq` | Albanian | Shqip | ltr |
| `am` | Amharic | አማርኛ | ltr |
| `ar` | Arabic | العربية | rtl |
| `hy` | Armenian | Հայերեն | ltr |
| `as` | Assamese | অসমীয়া | ltr |
| `az` | Azerbaijani | Azərbaycan | ltr |
| `eu` | Basque | Euskara | ltr |
| `be` | Belarusian | Беларуская | ltr |
| `bn` | Bengali | বাংলা | ltr |
| `bho` | Bhojpuri | भोजपुरी | ltr |
| `bi` | Bislama | Bislama | ltr |
| `bg` | Bulgarian | Български | ltr |
| `my` | Burmese | မြန်မာဘာသာ | ltr |
| `yue` | Cantonese | 廣東話 | ltr |
| `ca` | Catalan | Català | ltr |
| `ceb` | Cebuano | Cebuano | ltr |
| `ch` | Chamorro | Chamorro | ltr |
| `zh` | Chinese (Mandarin) | 中文 | ltr |
| `hr` | Croatian | Hrvatski | ltr |
| `cs` | Czech | Čeština | ltr |
| `da` | Danish | Dansk | ltr |
| `doi` | Dogri | डोगरी | ltr |
| `nl` | Dutch | Nederlands | ltr |
| `en` | English | English | ltr |
| `et` | Estonian | Eesti | ltr |
| `fj` | Fijian | Na Vosa Vakaviti | ltr |
| `tl` | Filipino (Tagalog) | Tagalog | ltr |
| `fi` | Finnish | Suomi | ltr |
| `fr` | French | Français | ltr |
| `gl` | Galician | Galego | ltr |
| `ka` | Georgian | ქართული | ltr |
| `de` | German | Deutsch | ltr |
| `el` | Greek | Ελληνικά | ltr |
| `kl` | Greenlandic | Kalaallisut | ltr |
| `gu` | Gujarati | ગુજરાતી | ltr |
| `ha` | Hausa | Hausa | ltr |
| `haw` | Hawaiian | Ōlelo Hawaiʻi | ltr |
| `he` | Hebrew | עברית | rtl |
| `hi` | Hindi | हिन्दी | ltr |
| `hu` | Hungarian | Magyar | ltr |
| `is` | Icelandic | Íslenska | ltr |
| `ig` | Igbo | Asụsụ Igbo | ltr |
| `id` | Indonesian | Bahasa Indonesia | ltr |
| `ga` | Irish | Gaeilge | ltr |
| `it` | Italian | Italiano | ltr |
| `ja` | Japanese | 日本語 | ltr |
| `jv` | Javanese | Basa Jawa | ltr |
| `kn` | Kannada | ಕನ್ನಡ | ltr |
| `kk` | Kazakh | Қазақ тілі | ltr |
| `km` | Khmer | ភាសាខ្មែរ | ltr |
| `rw` | Kinyarwanda | Ikinyarwanda | ltr |
| `ko` | Korean | 한국어 | ltr |
| `ku` | Kurdish | Kurdî | ltr |
| `ky` | Kyrgyz | Кыргызча | ltr |
| `lo` | Lao | ພາສາລາວ | ltr |
| `la` | Latin | Lingua Latina | ltr |
| `lv` | Latvian | Latviešu | ltr |
| `lt` | Lithuanian | Lietuvių | ltr |
| `lb` | Luxembourgish | Lëtzebuergesch | ltr |
| `mk` | Macedonian | Македонски | ltr |
| `mg` | Malagasy | Malagasy | ltr |
| `ms` | Malay | Bahasa Melayu | ltr |
| `ml` | Malayalam | മലയാളം | ltr |
| `mt` | Maltese | Malti | ltr |
| `mi` | Maori | Te Reo Māori | ltr |
| `mr` | Marathi | मराठी | ltr |
| `mn` | Mongolian | Монгол | ltr |
| `ne` | Nepali | नेपाली | ltr |
| `no` | Norwegian | Norsk | ltr |
| `ny` | Nyanja (Chichewa) | Chinyanja | ltr |
| `or` | Odia (Oriya) | ଓଡ଼ିଆ | ltr |
| `ps` | Pashto | پښتو | rtl |
| `fa` | Persian | فارسی | rtl |
| `pl` | Polish | Polski | ltr |
| `pt` | Portuguese | Português | ltr |
| `pa` | Punjabi | ਪੰਜਾਬੀ | ltr |
| `ro` | Romanian | Română | ltr |
| `ru` | Russian | Русский | ltr |
| `sm` | Samoan | Gagana Samoa | ltr |
| `gd` | Scottish Gaelic | Gàidhlig | ltr |
| `sr` | Serbian | Српски | ltr |
| `st` | Sesotho | Sesotho | ltr |
| `sn` | Shona | chiShona | ltr |
| `sd` | Sindhi | سنڌي | rtl |
| `si` | Sinhala | සිංහල | ltr |
| `sk` | Slovak | Slovenčina | ltr |
| `sl` | Slovenian | Slovenščina | ltr |
| `so` | Somali | Soomaali | ltr |
| `es` | Spanish | Español | ltr |
| `su` | Sundanese | Basa Sunda | ltr |
| `sw` | Swahili | Kiswahili | ltr |
| `sv` | Swedish | Svenska | ltr |
| `tg` | Tajik | Тоҷикӣ | ltr |
| `ta` | Tamil | தமிழ் | ltr |
| `tt` | Tatar | Татар | ltr |
| `te` | Telugu | తెలుగు | ltr |
| `th` | Thai | ไทย | ltr |
| `to` | Tongan | Faka Tonga | ltr |
| `tr` | Turkish | Türkçe | ltr |
| `tk` | Turkmen | Türkmençe | ltr |
| `uk` | Ukrainian | Українська | ltr |
| `ur` | Urdu | اردو | rtl |
| `uz` | Uzbek | Oʻzbekcha | ltr |
| `vi` | Vietnamese | Tiếng Việt | ltr |
| `cy` | Welsh | Cymraeg | ltr |
| `xh` | Xhosa | isiXhosa | ltr |
| `zu` | Zulu | isiZulu | ltr |

</details>

---

## 12. SUBTITLE SOURCE PRIORITY

When multiple subtitle tracks exist for the same language, AITutor resolves tracks per language using a strict 4-tier priority order:

```text
HIGHEST  1. User Uploaded Subtitle   (Runtime UI user upload)
         2. Developer Manual Track   (Passed via `subtitles` prop)
         3. Generated Subtitle Track (From manifest.json)
LOWEST   4. Demo Fallback Track      (Sample demonstration track)
```

### Resolution Example:
- **Generated Tracks**: `en`, `es`, `te`
- **Developer Manual Prop**: `subtitles={{ en: "/custom-en.vtt" }}`

**Resolved Result**:
- `en` → Developer Manual Track (`/custom-en.vtt`)
- `es` → Generated Track (`/aitutor/subtitles/lesson/es.vtt`)
- `te` → Generated Track (`/aitutor/subtitles/lesson/te.vtt`)

---

## 13. DEVELOPER SUBTITLE VISIBILITY & CUSTOM TRACKS

Control subtitle track visibility and supply custom WebVTT files using the `subtitles` prop on `<AITutor />`:

| Configuration | Behavior |
| :--- | :--- |
| **Omitted** | Show all available subtitle tracks (default) |
| `"all"` | Show all available tracks |
| `["en", "hi", "te"]` | Only show those languages in player UI selector |
| `{ en: "/en.vtt", hi: "/hi.vtt" }` | Use developer-provided custom VTT tracks |
| `false` | Disable subtitle UI & cue rendering completely |

### Examples

```jsx
// 1. Default Mode (shows all generated tracks for current video)
<AITutor src="/lesson.mp4" />

// 2. Explicit All Mode
<AITutor src="/lesson.mp4" subtitles="all" />

// 3. Language Visibility Filter (UI menu only displays English, Hindi, Telugu)
<AITutor src="/lesson.mp4" subtitles={["en", "hi", "te"]} />

// 4. Custom Developer WebVTT Files (overrides generated tracks for specified languages)
<AITutor
  src="/lesson.mp4"
  subtitles={{
    en: "/subtitles/custom-en.vtt",
    te: "/subtitles/custom-te.vtt"
  }}
/>

// 5. Disable Subtitle UI Completely
<AITutor src="/lesson.mp4" subtitles={false} />
```

---

## 14. USER-UPLOADED SUBTITLES

The player UI includes a runtime subtitle upload button in the subtitle settings menu. Uploaded VTT/SRT files take the **highest priority** (Tier 1) for the current user session.

---

## 15. LOCAL VIDEOS

Specify relative paths to files located in your React `public/` directory:

```jsx
// Resolves to public/courses/react-101.mp4
<AITutor src="/courses/react-101.mp4" id="react_101" />
```

---

## 16. REMOTE VIDEO URLS

AITutor supports direct remote HTTP/HTTPS video URLs:

```jsx
<AITutor src="https://cdn.example.com/videos/lesson1.mp4" />
```

- **Authentication Tokens**: Ephemeral signed query parameters (`token=`, `signature=`, `expires=`) are automatically stripped during fingerprinting so signed URL updates do not cause unnecessary re-transcription.
- **SSRF Protection**: Private IP ranges (`127.0.0.1`, `10.x.x.x`, `192.168.x.x`, `169.254.169.254`) and non-HTTP protocols (`file://`, `gopher://`) are blocked for security.

---

## 17. CACHE SYSTEM & MEDIA FINGERPRINT

AITutor implements a content-aware media fingerprint:

```text
Canonical Path + File Size + mtimeMs + Sampled Binary Hash (Head 64KB + Mid 64KB + Tail 64KB)
```

- **Cache Hit**: Running `npx aitutor` on an unchanged file completes in `<1ms`, skipping audio extraction and speech-to-text.
- **Performance**: Reading 192KB sampled chunks uses **<0.5ms** CPU time and **<200KB** RAM, making it safe for 1GB+ video files.

---

## 18. CHANGING A VIDEO

If you replace a video file (e.g. replacing `/public/lesson.mp4` with a new recording using the same filename):

1. Run `npx aitutor`.
2. AITutor detects that the media content fingerprint changed.
3. Old transcripts and WebVTT tracks are invalidated and re-generated automatically.

To force re-generation manually:
```bash
npx aitutor --force
```

---

## 19. TRANSLATION MODES

Configure translation behavior in `aitutor.config.js`:

```javascript
export default {
  subtitles: {
    translation: {
      provider: 'auto' // 'auto' | 'online' | 'offline'
    }
  }
};
```

- **`auto`**: Prefers online translation providers; falls back to local NLLB offline model if network is unavailable.
- **`online`**: Online API translation.
- **`offline`**: Pure local NLLB-200 translation running in Node.js via `@xenova/transformers`. (Downloads NLLB model files to local cache directory on first run).

---

## 20. CUSTOM TERMINOLOGY / GLOSSARY

Protect brand names and technical jargon from being mis-translated:

```javascript
// aitutor.config.js
export default {
  subtitles: {
    glossary: [
      'AITutor',
      'React',
      'Node.js',
      'TypeScript',
      'GraphQL'
    ]
  }
};
```

Protected terms are preserved exactly as written during transcript normalization and multilingual translation.

---

## 21. CONFIGURATION REFERENCE (`aitutor.config.js`)

```javascript
export default {
  // Global subtitle settings
  subtitles: {
    languages: ['en', 'es', 'hi', 'te'], // Target language codes
    quality: 'balanced',                 // 'fast' | 'balanced' | 'high'
    glossary: ['React', 'AITutor'],      // Protected terms
    transcription: {
      model: 'Xenova/whisper-base'        // Whisper ASR model
    },
    translation: {
      provider: 'auto'                   // 'auto' | 'online' | 'offline'
    }
  },

  // Video list
  videos: [
    {
      id: 'lesson_1',
      src: './public/lesson.mp4',
      languages: ['en', 'es', 'hi', 'te']
    }
  ]
};
```

---

## 22. CLI COMMAND REFERENCE

Execute the CLI using `npx aitutor`:

| Command | Description | Example |
| :--- | :--- | :--- |
| `npx aitutor` / `npx aitutor generate` | Generate subtitles and manifest for configured videos | `npx aitutor --force` |
| `npx aitutor status` | Display cache status, transcripts, and generated tracks | `npx aitutor status` |
| `npx aitutor validate` | Audit generated WebVTT headers and manifest integrity | `npx aitutor validate` |
| `npx aitutor clean` | Clean all generated public/internal subtitles and manifests | `npx aitutor clean --video lesson_1` |

### Command Flags:
- `--no-quality`: Skip video quality rendition transcoding during subtitle generation pipeline run.
- `--force`: Ignore existing cache and force full re-transcription & translation.
- `--keep-temp`: Retain temporary audio extraction workspace for debugging.
- `--video <id>`: Target specific video ID for cleanup.

---

## 23. DEVELOPMENT WORKFLOW

```text
1. Place video in public/ (e.g., public/lesson.mp4)
         ↓
2. Configure aitutor.config.js
         ↓
3. Run: npx aitutor
         ↓
4. Add <AITutor src="/lesson.mp4" /> to React app
         ↓
5. Start dev server: npm run dev
         ↓
6. Test subtitle rendering & language switching
         ↓
7. Build production site: npm run build
         ↓
8. Deploy public/ & dist/ to static host
```

---

## 24. PRODUCTION DEPLOYMENT

Ensure your production build includes the generated static assets in `public/aitutor/`:

```text
dist/
├── index.html
├── assets/
└── aitutor/
    ├── manifest.json
    └── subtitles/
        └── lesson/
            ├── en.vtt
            └── ...
```

- When students view your application in production, their browser fetches pre-generated WebVTT files directly from static hosting.
- FFmpeg and Whisper **do not** run in the browser.

---

## 25. DEPLOYMENT EXAMPLES & SERVING

### Static Server Headers (Nginx / Vercel / Netlify / Cloudflare)
Ensure `.vtt` files are served with the correct MIME type:

```text
Content-Type: text/vtt; charset=utf-8
Access-Control-Allow-Origin: *
```

---

## 26. TROUBLESHOOTING

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **Subtitles not appearing in browser** | `public/aitutor/manifest.json` missing | Run `npx aitutor` to generate manifest & WebVTT tracks. |
| **Stale subtitles after changing video** | Same filename retained old cache | Run `npx aitutor` (media identity fingerprint auto-detects changes). Use `--force` if needed. |
| **FFmpeg exited with error** | FFmpeg binary not found on PATH | Install FFmpeg globally or set `process.env.FFMPEG_PATH="C:\\path\\to\\ffmpeg.exe"`. |
| **Remote video 403 / CORS Error** | Remote server blocks cross-origin requests | Ensure remote video host sets `Access-Control-Allow-Origin: *`. |
| **Offline translation missing language** | Language unsupported by NLLB offline model | `bi`, `ch`, and `doi` require `online` or `auto` translation mode. |

---

## 27. DEBUGGING SUBTITLE SOURCES

You can inspect resolved track sources at runtime using `resolveSubtitleSources`:

```javascript
import { resolveSubtitleSources } from 'tavi-video-tutor';

const result = resolveSubtitleSources({
  developerSubtitles: { en: '/custom-en.vtt' },
  generatedSubtitles: { en: '/aitutor/subtitles/lesson/en.vtt', es: '/aitutor/subtitles/lesson/es.vtt' }
});

console.log(result.sourceByLanguage);
// Output: { en: 'developer', es: 'generated' }
```

---

## 28. ACCESSIBILITY & RTL SUPPORT

AITutor includes native accessibility and internationalization support:
- **Right-to-Left (RTL)**: Automatic text direction formatting for Arabic (`ar`), Hebrew (`he`), Persian (`fa`), Pashto (`ps`), Urdu (`ur`), and Sindhi (`sd`).
- **Keyboard Navigation**: Complete player navigation via standard hotkeys (`Space`, `K`, `C`, `S`, `M`, `F`, Arrow keys).

---

## 29. PERFORMANCE

- **ASR & Translation Caching**: Pre-calculated master transcripts prevent duplicate Whisper processing.
- **Memory Footprint**: Stabilized memory consumption (**<6.5 MB heap**) during long playback and 500+ language switches.
- **Sampled File Fingerprinting**: Fast 192KB chunk reads enable instant cache checks for large multi-gigabyte video files.

---

## 30. SECURITY

- **SSRF Protection**: Remote video URLs targeting localhost, private subnets (`10.0.0.0/8`, `192.168.0.0/16`), or metadata IPs are rejected.
- **Process Isolation**: Safe `spawn` argument array passing prevents command injection vulnerabilities during FFmpeg invocation.
- **Token Sanitization**: Signed URL query tokens are sanitized before computing cache fingerprints.

---

## 31. API REFERENCE

### `<AITutor />` Props
| Prop | Type | Default | Description |
|---|---|---|---|
| `qualities` | `Array<{quality: string, src: string, height?: number, width?: number}>` | `undefined` | Optional explicit array of video quality renditions. If omitted, renditions are automatically populated from `manifest.json`. |
| `onQualityChange` | `(quality: string) => void` | `undefined` | Optional callback triggered when user switches video quality. |

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`src`** | `string` | *(Required)* | Video file path (`/lesson.mp4`) or remote URL (`https://...`) |
| **`id`** | `string` | `undefined` | Optional explicit video identifier |
| **`subtitles`** | `'all' \| false \| string[] \| Record<string, string>` | `'all'` | Subtitle configuration & runtime visibility filter |
| **`audioLanguages`** | `'all' \| false \| string[] \| Record<string, string \| AudioTrack>` | `'all'` | Audio dub configuration & runtime visibility filter |
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
| **`onAudioLanguageChange`** | `function` | `undefined` | Audio language change callback |

---

## 32. COMPLETE COPY-PASTE EXAMPLE

### `aitutor.config.js`
```javascript
export default {
  subtitles: {
    languages: ['en', 'es', 'hi', 'te'],
    glossary: ['React', 'AITutor']
  },
  videos: [
    {
      id: 'demo_lesson',
      src: './public/demo.mp4',
      languages: ['en', 'es', 'hi', 'te']
    }
  ]
};
```

### `src/App.jsx`
```jsx
import React from 'react';
import { AITutor } from 'tavi-video-tutor';
import 'tavi-video-tutor/dist/style.css';

export default function App() {
  return (
    <div style={{ width: '100%', maxWidth: '960px', margin: '40px auto' }}>
      <h1>React AI Tutor Lesson</h1>
      <div style={{ width: '100%', aspectRatio: '16/9' }}>
        <AITutor
          src="/demo.mp4"
          id="demo_lesson"
          defaultSubLanguage="en"
          onSubLanguageChange={(lang) => console.log('Selected language:', lang)}
        />
      </div>
    </div>
  );
}
```

---

## 33. MULTILINGUAL AUDIO DUBBING (`audioLanguages`) — ARCHITECTURE, GENERATION & CLI GUIDE

AITutor introduces a decoupled, clean multilingual audio dubbing architecture where build-time generation, audio lifecycle management, and runtime player visibility are completely separated.

---

### 🎙️ 1. HOW AUDIO DUBS ARE GENERATED (PIPELINE DEEP DIVE)

Audio generation in AITutor runs at build time via the CLI and follows an automated 7-step neural synchronization pipeline:

```text
SOURCE VIDEO (MP4/MKV/AVI/MOV/WebM)
        ↓  [1. FFmpeg Stream Extraction]
ORIGINAL PCM WAV AUDIO (16kHz Mono)
        ↓  [2. Whisper Neural Speech-to-Text]
TIMESTAMPED CUE TRANSCRIPT (start, end, text)
        ↓  [3. Neural Multilingual Translation + Glossary]
TARGET LANGUAGE CUES (Localized text)
        ↓  [4. Neural Text-To-Speech (TTS) Synthesis]
RAW AUDIO SEGMENTS (per cue)
        ↓  [5. Time Alignment & Tempo Normalization (0.8x - 1.2x)]
SYNCED AUDIO TRACKS
        ↓  [6. Stitching & AAC / M4A Encoding]
public/aitutor/audio/<videoId>/<lang>.m4a
        ↓  [7. Manifest Registration]
public/aitutor/manifest.json (audioLanguages map)
```

#### Step-by-Step Generation Details:
1. **Audio Extraction**: FFmpeg extracts the primary audio stream from local or remote video files without re-encoding video tracks.
2. **Speech-to-Text & Cue Alignment**: Whisper ASR models segment the speech into millisecond-accurate cue blocks with timestamps.
3. **Multilingual Translation**: Neural translation converts speech cues into target languages while preserving technical keywords defined in `aitutor.config.mjs` glossaries.
4. **Neural TTS Synthesis**: Local or cloud neural TTS engines synthesize natural spoken audio for each segment.
5. **Pitch-Preserving Time Alignment (`alignAudioSegment`)**: If a translated spoken segment is longer or shorter than the original video cue duration, AITutor dynamically adjusts playback tempo (clamped safely between `0.8x` and `1.2x`) while preserving natural voice pitch. This guarantees **zero drift** over long 60+ minute lectures.
6. **AAC Encoding & Assembly**: Segment audio buffers are stitched with precise silence gaps into a synchronized `.m4a` (AAC) or `.mp3` track stored in `public/aitutor/audio/<videoId>/<lang>.m4a`.
7. **Manifest Update**: The track is registered in `public/aitutor/manifest.json` under `audioLanguages[lang]` with its native label, source URL, and duration.

---

### 🗑️ 2. HOW AUDIO DUBS ARE REMOVED & CLEARED

AITutor provides granular, non-destructive CLI commands to clear or remove generated audio tracks without affecting other media systems:

```text
npx aitutor audio clear [languages] [--video <id>]
```

#### Removal Scope & Mechanics:
1. **Single Language Removal** (`npx aitutor audio clear hi`):
   - Deletes `public/aitutor/audio/<videoId>/hi.m4a` from disk.
   - Removes the `hi` key from `audioLanguages` in `public/aitutor/manifest.json` and `.aitutor/manifest.json`.
2. **Multi-Language Removal** (`npx aitutor audio clear hi,te`):
   - Deletes all specified language audio files across videos.
   - Cleans corresponding keys in the manifests simultaneously.
3. **Video-Scoped Removal** (`npx aitutor audio clear --video lesson_1`):
   - Deletes the entire directory `public/aitutor/audio/lesson_1/`.
   - Clears `audioLanguages` for `lesson_1` while leaving other videos untouched.
4. **Global Audio Clean** (`npx aitutor audio clear`):
   - Deletes all generated audio files across all videos in `public/aitutor/audio/`.
   - Resets `audioLanguages` in manifests to empty objects `{}`.

#### 🛡️ Audio Clean Safety Invariants:
- **Source Video Preservation**: Original source videos are **never modified or deleted**. The SHA-256 binary hash remains byte-identical.
- **Subtitle & Quality Independence**: WebVTT subtitles (`.vtt`) and video quality renditions (`.mp4`) are **100% preserved**.
- **Instant UI Synchronization**: Cleared audio tracks immediately disappear from the player UI selector on next page load without throwing 404 errors.

---

### 📋 3. AUDIO CLI COMMAND REFERENCE TABLE

| Command | Scope | Description | Practical Example |
| :--- | :--- | :--- | :--- |
| `npx aitutor generate --audio-languages all` | Global / Build | Generate AI-dubbed audio for all 109 registry languages | `npx aitutor generate --audio-languages all` |
| `npx aitutor generate --audio-languages <langs>` | Targeted / Build | Generate audio dubs only for specified comma-separated languages | `npx aitutor generate --audio-languages en,hi,te` |
| `npx aitutor generate --audio-languages <lang> --force` | Targeted / Rebuild | Force re-transcription and re-synthesis, ignoring existing cache | `npx aitutor generate --audio-languages hi --force` |
| `npx aitutor audio status` | Inspection | Display generated audio tracks, cache status, and missing configured languages | `npx aitutor audio status` |
| `npx aitutor audio status --video <id>` | Targeted Inspection | Inspect audio status for a specific video ID | `npx aitutor audio status --video lesson_1` |
| `npx aitutor audio clear <lang>` | Language Removal | Delete generated audio file and manifest entry for a single language | `npx aitutor audio clear hi` |
| `npx aitutor audio clear <lang1>,<lang2>` | Multi-Language Removal | Delete generated audio for multiple languages across all videos | `npx aitutor audio clear hi,te` |
| `npx aitutor audio clear <lang> --video <id>` | Targeted Video Removal | Delete specific language audio only for a designated video ID | `npx aitutor audio clear hi --video lesson_1` |
| `npx aitutor audio clear --video <id>` | Video-Scoped Clear | Delete all generated audio tracks for a designated video ID | `npx aitutor audio clear --video lesson_1` |
| `npx aitutor audio clear` | Global Clear | Delete all generated audio tracks across all videos in the project | `npx aitutor audio clear` |

---

### ⚙️ 4. RUNTIME AUDIO USAGE & REACT PROPS

#### Automatic Original Language Detection (Zero Config):
When the player mounts, it inspects `sourceLanguage` in the manifest and automatically exposes generated dubs while setting the source audio as `(Original)`:

```jsx
// Zero configuration: automatically defaults to video's original language (e.g. English)
<AITutor src="/lesson.mp4" />
```

#### Runtime Audio Filtering (`audioLanguages` Prop):
Filter the options visible to the student in the player menu:
```jsx
// Shows only Hindi and Telugu dubs in the player menu (original audio is always protected)
<AITutor 
  src="/lesson.mp4" 
  audioLanguages={["hi", "te"]} 
/>
```

#### Custom Developer Audio Tracks (`audioDubs`):
Provide your own studio-recorded dubbing tracks to override AI generated audio:
```jsx
<AITutor
  src="/lesson.mp4"
  audioDubs={{
    hi: "/custom-audio/lesson_hi.mp3",
    te: { label: "Telugu Studio Dub", src: "/custom-audio/lesson_te.mp3", language: "te" }
  }}
/>
```

#### Disabling Audio Dubbing:
```jsx
// Completely disables audio selector UI and plays native video audio
<AITutor src="/lesson.mp4" audioLanguages={false} />
```

#### Audio Language Change Events:
```jsx
<AITutor
  src="/lesson.mp4"
  onAudioLanguageChange={(event) => {
    console.log('Selected language:', event.language); // e.g. 'hi'
    console.log('Previous language:', event.previousLanguage); // e.g. 'en'
    console.log('Source:', event.source); // 'generated' | 'developer' | 'demo'
  }}
/>
```

#### Subpath Import for Audio Utilities:
```javascript
import { resolveAudioAvailability, emitAudioDXWarning } from 'tavi-video-tutor/audio';
```

---

### 🛡️ Audio Architecture Guarantees:
- **Audio + Subtitle Independence**: Switching subtitle languages does not change the spoken audio track, and changing audio language does not modify subtitle display.
- **Audio + Video Quality Independence**: Changing video resolution quality preserves active spoken audio dubbing track and playback synchronization seamlessly.

---

## 34. MULTI-CONTAINER MEDIA INPUT SUPPORT (MP4, MKV, AVI, MOV, WebM)

AITutor accepts multiple media container formats as input:
- **`.mp4`** (MPEG-4 Part 14)
- **`.mkv`** (Matroska Video)
- **`.avi`** (Audio Video Interleave)
- **`.mov`** (QuickTime Movie)
- **`.webm`** (WebM Video)

### How Multi-Container Normalization Works:
1. **Stream-Aware Media Probing**: FFmpeg inspects actual video/audio streams, sample rates, channels, and rotation tags.
2. **Canonical Processing**: Audio extraction, Whisper transcription, translation, and TTS dubbing execute identically regardless of container format.
3. **Browser Normalization**: Non-browser native containers (e.g. `.avi`, `.mkv`, `.mov`, `.webm`) are automatically transcoded to browser-compatible H.264/AAC MP4 renditions stored in `/public/aitutor/videos/<id>/<height>.mp4`.
4. **Source Preservation**: **Original source files are 100% preserved and never modified or overwritten.**

```jsx
// Works directly with MKV, AVI, MOV, or WebM sources:
<AITutor src="/recording.mkv" />
```

---

## 35. LICENSE

MIT License © 2026 AITutor Maintainers