# AITutor

AITutor is an open-source, zero-dependency React video player and Socratic AI tutor engine with native canvas rendering, audio dub sync, and automated 109-language WebVTT subtitle generation. It combines FFmpeg audio extraction, Whisper speech recognition, transcript normalization, cue segmentation, and multilingual translation into a unified developer SDK.

```jsx
import { AITutor } from "tavi-video-tutor";
import "tavi-video-tutor/dist/style.css";

export default function App() {
  return <AITutor src="/lesson.mp4" />;
}
```

```bash
# Generate WebVTT subtitles and manifest for configured videos
npx aitutor
```

---

## 1. FEATURES

- **React Video Tutor Component**: Custom HTML5 video player with subtitle rendering, audio dub sync, quality selection, and modal editing.
- **Automated Subtitle Pipeline**: End-to-end processing from video file to Whisper speech-to-text, transcript normalization, cue segmentation, and WebVTT generation.
- **109-Language Registry**: Standardized language metadata and WebVTT generation for 109 global languages with full Right-to-Left (RTL) support for Arabic, Hebrew, Urdu, etc.
- **Hybrid Online/Offline Translation**: High-speed online translation with automatic offline local NLLB (`@xenova/transformers`) fallback.
- **Content-Aware Media Identity**: Smart cache fingerprinting based on canonical path, size, modification timestamp, and sampled binary content chunks (head + middle + tail 64KB).
- **Four-Tier Subtitle Priority**: Smart resolver supporting User Uploaded > Developer Manual > Generated > Demo Fallback tracks per language.
- **Local & Remote Video Resolution**: Safe resolution for local assets (`public/`) and remote HTTP/HTTPS video streams with built-in SSRF protection.
- **CLI Management Suite**: Complete command-line tools for subtitle generation, cache status auditing, WebVTT validation, and selective cache cleanup.

---

## 2. HOW AITUTOR WORKS

AITutor separates expensive heavy media processing (audio extraction, speech-to-text, and translation) from lightweight runtime client rendering:

```text
Video File (Local / Remote)
         ↓
FFmpeg Audio Extraction (16kHz PCM WAV)
         ↓
Whisper Speech-to-Text (Master Transcript)
         ↓
Transcript Normalizer (Glossary & Punctuation)
         ↓
Subtitle Segmenter (Readability & Timing Constraints)
         ↓
Multilingual Translation (Online / Local NLLB Fallback)
         ↓
WebVTT File Generator (en.vtt, te.vtt, hi.vtt...)
         ↓
Manifest Store (/public/aitutor/manifest.json)
         ↓
<AITutor /> Player (Renders VTT in Browser)
```

- **Preprocessing Stage**: The CLI command `npx aitutor` processes video files, runs Whisper ASR, translates transcriptions into target languages, writes `.vtt` files into `public/aitutor/subtitles/{videoId}/`, and updates `public/aitutor/manifest.json`.
- **Runtime Stage**: When `<AITutor src="/lesson.mp4" />` mounts in the browser, it loads `/aitutor/manifest.json`, finds the matching video entry, and fetches the requested WebVTT subtitle track. Heavy processing (FFmpeg/Whisper) **never** runs in the student's browser when pre-generated tracks exist.

---

## 3. REQUIREMENTS

- **Node.js**: `v18.0.0` or higher.
- **npm**: `v9.0.0` or higher.
- **React**: `^18.0.0` or `^19.0.0` (Peer dependency).
- **FFmpeg**: System `ffmpeg` binary on PATH or specified via `process.env.FFMPEG_PATH`. (Local fallback binaries in `bin/ffmpeg.exe` are auto-resolved if available).
- **Browsers**: Any modern browser supporting HTML5 Video and ES2022 JavaScript (Chrome, Firefox, Safari, Edge).

---

## 4. INSTALLATION

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

## 5. YOUR FIRST AITUTOR VIDEO

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

## 6. AUTOMATIC SUBTITLE GENERATION

Follow this step-by-step workflow to generate multilingual subtitles for your videos from zero:

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
    videos: [{ id: 'lesson', src: './public/lesson.mp4' }]
  };
  ```
- **`aitutor.config.cjs` (CommonJS)**:
  ```javascript
  module.exports = {
    subtitles: { languages: ['en', 'es', 'hi', 'te'] },
    videos: [{ id: 'lesson', src: './public/lesson.mp4' }]
  };
  ```
- **`aitutor.config.json` (JSON)**:
  ```json
  {
    "subtitles": { "languages": ["en", "es", "hi", "te"] },
    "videos": [{ "id": "lesson", "src": "./public/lesson.mp4" }]
  }
  ```
- **`aitutor.config.js`**: Uses `export default` when host `package.json` contains `"type": "module"`, or `module.exports` when host `package.json` uses CommonJS.

### Step 2: Run the Subtitle Generator
Run the CLI generator from your project terminal:

```bash
npx aitutor
```

### Execution Output:
```text
AITUTOR SUBTITLE GENERATOR
─────────────────────────────
Processing video 1 of 1: lesson
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

## 7. GENERATED FILES

Subtitle generation outputs public production assets and maintains an internal processing cache:

```text
my-tutor-app/
├── public/
│   ├── lesson.mp4
│   └── aitutor/                            # PUBLIC ASSETS (Deploy to Production)
│       ├── manifest.json                   # Subtitle registry index
│       └── subtitles/
│           └── lesson/
│               ├── en.vtt
│               ├── es.vtt
│               ├── hi.vtt
│               └── te.vtt
│
└── .aitutor/                               # INTERNAL CACHE (DO NOT Commit/Deploy)
    ├── manifest.json
    ├── transcripts/
    │   └── lesson.json                     # Master ASR transcript cache
    └── subtitles/
        └── lesson/
```

- **`public/aitutor/`**: Production static artifacts loaded by browser client. Must be included in your static site deployment.
- **`.aitutor/`**: Local caching directory storing raw speech transcripts to prevent re-running Whisper ASR when modifying subtitle styles or adding languages.

---

## 8. USING GENERATED SUBTITLES

Once `npx aitutor` finishes, `<AITutor src="/lesson.mp4" />` automatically detects pre-generated subtitles without requiring manual VTT imports:

1. `<AITutor />` fetches `/aitutor/manifest.json`.
2. It matches the video `src` or `id`.
3. It loads the corresponding WebVTT track (e.g., `/aitutor/subtitles/lesson/en.vtt`).
4. Subtitles display dynamically synced to video playback.

---

## 9. SELECTING SUBTITLE LANGUAGES & SHORTCUTS

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

## 10. 109 SUPPORTED LANGUAGES

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

## 11. SUBTITLE SOURCE PRIORITY

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

## 12. DEVELOPER SUBTITLE VISIBILITY & CUSTOM TRACKS

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

## 13. USER-UPLOADED SUBTITLES

The player UI includes a runtime subtitle upload button in the subtitle settings menu. Uploaded VTT/SRT files take the **highest priority** (Tier 1) for the current user session.

---

## 14. LOCAL VIDEOS

Specify relative paths to files located in your React `public/` directory:

```jsx
// Resolves to public/courses/react-101.mp4
<AITutor src="/courses/react-101.mp4" id="react_101" />
```

---

## 15. REMOTE VIDEO URLS

AITutor supports direct remote HTTP/HTTPS video URLs:

```jsx
<AITutor src="https://cdn.example.com/videos/lesson1.mp4" />
```

- **Authentication Tokens**: Ephemeral signed query parameters (`token=`, `signature=`, `expires=`) are automatically stripped during fingerprinting so signed URL updates do not cause unnecessary re-transcription.
- **SSRF Protection**: Private IP ranges (`127.0.0.1`, `10.x.x.x`, `192.168.x.x`, `169.254.169.254`) and non-HTTP protocols (`file://`, `gopher://`) are blocked for security.

---

## 16. CACHE SYSTEM & MEDIA FINGERPRINT

AITutor implements a content-aware media fingerprint:

```text
Canonical Path + File Size + mtimeMs + Sampled Binary Hash (Head 64KB + Mid 64KB + Tail 64KB)
```

- **Cache Hit**: Running `npx aitutor` on an unchanged file completes in `<1ms`, skipping audio extraction and speech-to-text.
- **Performance**: Reading 192KB sampled chunks uses **<0.5ms** CPU time and **<200KB** RAM, making it safe for 1GB+ video files.

---

## 17. CHANGING A VIDEO

If you replace a video file (e.g. replacing `/public/lesson.mp4` with a new recording using the same filename):

1. Run `npx aitutor`.
2. AITutor detects that the media content fingerprint changed.
3. Old transcripts and WebVTT tracks are invalidated and re-generated automatically.

To force re-generation manually:
```bash
npx aitutor --force
```

---

## 18. TRANSLATION MODES

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

## 19. CUSTOM TERMINOLOGY / GLOSSARY

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

## 20. CONFIGURATION REFERENCE (`aitutor.config.js`)

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

## 21. CLI COMMAND REFERENCE

Execute the CLI using `npx aitutor`:

| Command | Description | Example |
| :--- | :--- | :--- |
| `npx aitutor` / `npx aitutor generate` | Generate subtitles and manifest for configured videos | `npx aitutor --force` |
| `npx aitutor status` | Display cache status, transcripts, and generated tracks | `npx aitutor status` |
| `npx aitutor validate` | Audit generated WebVTT headers and manifest integrity | `npx aitutor validate` |
| `npx aitutor clean` | Clean all generated public/internal subtitles and manifests | `npx aitutor clean --video lesson_1` |

### Command Flags:
- `--force`: Ignore existing cache and force full re-transcription & translation.
- `--keep-temp`: Retain temporary audio extraction workspace for debugging.
- `--video <id>`: Target specific video ID for cleanup.

---

## 22. DEVELOPMENT WORKFLOW

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

## 23. PRODUCTION DEPLOYMENT

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

## 24. DEPLOYMENT EXAMPLES & SERVING

### Static Server Headers (Nginx / Vercel / Netlify / Cloudflare)
Ensure `.vtt` files are served with the correct MIME type:

```text
Content-Type: text/vtt; charset=utf-8
Access-Control-Allow-Origin: *
```

---

## 25. TROUBLESHOOTING

| Problem | Cause | Solution |
| :--- | :--- | :--- |
| **Subtitles not appearing in browser** | `public/aitutor/manifest.json` missing | Run `npx aitutor` to generate manifest & WebVTT tracks. |
| **Stale subtitles after changing video** | Same filename retained old cache | Run `npx aitutor` (media identity fingerprint auto-detects changes). Use `--force` if needed. |
| **FFmpeg exited with error** | FFmpeg binary not found on PATH | Install FFmpeg globally or set `process.env.FFMPEG_PATH="C:\\path\\to\\ffmpeg.exe"`. |
| **Remote video 403 / CORS Error** | Remote server blocks cross-origin requests | Ensure remote video host sets `Access-Control-Allow-Origin: *`. |
| **Offline translation missing language** | Language unsupported by NLLB offline model | `bi`, `ch`, and `doi` require `online` or `auto` translation mode. |

---

## 26. DEBUGGING SUBTITLE SOURCES

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

## 27. ACCESSIBILITY & RTL SUPPORT

AITutor includes native accessibility and internationalization support:
- **Right-to-Left (RTL)**: Automatic text direction formatting for Arabic (`ar`), Hebrew (`he`), Persian (`fa`), Pashto (`ps`), Urdu (`ur`), and Sindhi (`sd`).
- **Keyboard Navigation**: Complete player navigation via standard hotkeys (`Space`, `K`, `C`, `S`, `M`, `F`, Arrow keys).

---

## 28. PERFORMANCE

- **ASR & Translation Caching**: Pre-calculated master transcripts prevent duplicate Whisper processing.
- **Memory Footprint**: Stabilized memory consumption (**<6.5 MB heap**) during long playback and 500+ language switches.
- **Sampled File Fingerprinting**: Fast 192KB chunk reads enable instant cache checks for large multi-gigabyte video files.

---

## 29. SECURITY

- **SSRF Protection**: Remote video URLs targeting localhost, private subnets (`10.0.0.0/8`, `192.168.0.0/16`), or metadata IPs are rejected.
- **Process Isolation**: Safe `spawn` argument array passing prevents command injection vulnerabilities during FFmpeg invocation.
- **Token Sanitization**: Signed URL query tokens are sanitized before computing cache fingerprints.

---

## 30. API REFERENCE

### `<AITutor />` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`src`** | `string` | *(Required)* | Video file path (`/lesson.mp4`) or remote URL (`https://...`) |
| **`id`** | `string` | `undefined` | Optional explicit video identifier |
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

## 31. COMPLETE COPY-PASTE EXAMPLE

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

## 32. LICENSE

MIT License © 2026 AITutor Maintainers
