# AITutor (tavi-video-tutor)

AITutor is an enterprise-grade React video player SDK & automated multilingual subtitle & audio dubbing engine powered by Web Worker VTT parsing, TTS speech synthesis, timestamp alignment, automatic video quality ladder, and WAI-ARIA accessibility.

```jsx
import { AITutor } from "tavi-video-tutor";
import "tavi-video-tutor/dist/style.css"; // or import "tavi-video-tutor/style.css";

export default function App() {
  return <AITutor src="/lesson.mp4" />;
}
```

```bash
# Generate WebVTT subtitles, audio dubs, video quality renditions, and manifest
npx aitutor
```

---

## 1. NEW IN v2.1.1 — MULTILINGUAL AUDIO DUBBING & RELEASE REMEDIATION

### 🔊 Multilingual Audio Dubbing Engine (`audioLanguages`)
- **Runtime Filter Control (`audioLanguages`)**: The `audioLanguages` React prop operates as a runtime visibility/filter control over already-generated tracks from `manifest.json` (mirroring the `subtitles` prop). It does not trigger build-time TTS or Whisper generation.
- **Automatic Original Language Default**: The video's original language (`sourceLanguage: "en"`, `"hi"`, or `"te"`) is detected and automatically selected as the default audio language without requiring developer prop configuration.
- **Immutable Source Language**: The original source language is authoritative and protected. It cannot be overridden by developer props.
- **Audio Language Switching**: Seamlessly switch spoken audio tracks at runtime using the `audioLanguages` prop or manifest audio dub tracks without interrupting video playback or resetting subtitle selections.
- **Audio + Subtitle Independence**: Switching audio language operates independently from subtitle language selection. You can listen to Hindi audio while reading English subtitles.
- **Audio + Video Quality Independence**: Switching audio tracks preserves the selected video quality ladder rendition (`1080p`, `720p`, `480p`, etc.) without video reloading stutters.
- **Multi-Container Media Normalization**: Full end-to-end support for **MP4**, **MKV**, **AVI**, **MOV**, and **WebM** inputs. Non-browser containers are normalized to standard H.264 MP4 renditions while keeping the original source file untouched.
- **Lazy Loading Audio Dub Tracks**: Audio files are lazy-loaded on demand when selected by the user, preventing bulk pre-fetching overhead on page mount.
- **Disable Audio Dubbing (`audioLanguages={false}`)**: Completely disables audio dubbing controls and track resolution for lightweight deployments.

### 📦 Clean CLI & Subpath Architecture
- **CLI Dependency Resolution**: `@huggingface/transformers` is installed as a production dependency for the CLI generator runtime (`npx aitutor generate` / `npx aitutor`), enabling speech recognition and translation out-of-the-box.
- **Pure Lightweight Browser Player (`tavi-video-tutor/player`)**: Browser bundles (`dist/player.js`) remain 100% free of heavy AI runtime code (ONNX / Transformers / WASM binaries).
- **TypeScript Subpath Declarations**: Full `.d.ts` declaration files for `tavi-video-tutor/subtitles` and `tavi-video-tutor/audio` subpath exports.

### ♿ Full WAI-ARIA Accessibility & Screen Reader Support (Section 508)
- **Screen Reader Live Region (`aria-live="polite"`)**: Synchronizes and announces active subtitle text for VoiceOver, NVDA, or JAWS.
- **Comprehensive WAI-ARIA Controls**: Full keyboard navigation (`Space`, `K`, `C`, `S`, `M`, `F`, Arrow keys) and accessible labels.

---

## 2. FEATURES

- **React Video Tutor Component**: Custom HTML5 video player with canvas subtitle rendering, audio dub sync, automatic video quality ladder selection (`144p` to `1080p`), and modal editing.
- **Automated Video Quality Transcoding Pipeline**: Multi-resolution H.264/AAC quality ladder generation (`720p`, `480p`, `360p`, `240p`, `144p`) with aspect ratio preservation (16:9, 4:3, 9:16 portrait, 1:1 square).
- **Automated Subtitle & Audio Pipeline**: End-to-end processing from video file to Whisper speech-to-text, transcript normalization, cue segmentation, WebVTT generation, and audio dub creation.
- **109-Language Registry**: Standardized language metadata and WebVTT generation for 109 global languages with full Right-to-Left (RTL) support.
- **Multi-Container Support**: Ingest `.mp4`, `.mkv`, `.avi`, `.mov`, or `.webm` files seamlessly.
- **Subpath Package Exports**:
  - `import { AITutor } from "tavi-video-tutor";` (Main bundle)
  - `import { AITutor } from "tavi-video-tutor/player";` (Pure React Player — Zero AI runtime)
  - `import { resolveSubtitleSources, resolveSubtitleAvailability } from "tavi-video-tutor/subtitles";` (Subtitle resolvers)
  - `import { resolveAudioSources, resolveAudioAvailability } from "tavi-video-tutor/audio";` (Audio resolvers)
  - `import "tavi-video-tutor/dist/style.css";` or `import "tavi-video-tutor/style.css";` (CSS styling)

---

## 3. REQUIREMENTS & PREREQUISITES

- **Node.js**: `v18.0.0` or higher.
- **npm**: `v9.0.0` or higher.
- **React**: `^18.0.0` or `^19.0.0` (Peer dependency).
- **FFmpeg**: Required on system PATH for audio extraction and video transcoding (`ffmpeg`).
- **TTS Engines**: Required for automatic audio dubbing generation (Online TTS APIs or local TTS synthesis).

---

## 4. INSTALLATION & SETUP

### Step 1 — Install AITutor
```bash
npm install tavi-video-tutor
```

### Step 2 — Import CSS & Component
```jsx
import React from 'react';
import { AITutor } from 'tavi-video-tutor';
import 'tavi-video-tutor/dist/style.css'; // or import 'tavi-video-tutor/style.css';

export default function App() {
  return <AITutor src="/lesson.mp4" />;
}
```

---

## 5. AUTOMATIC GENERATION CLI (`npx aitutor`)

Generate subtitles, audio dubs, quality renditions, and `/public/aitutor/manifest.json`:

```bash
# Primary workflow: generates media configured in aitutor.config.mjs
npx aitutor

# Optional: build-time CLI override for audio languages
npx aitutor generate --audio-languages en,hi,te
```

### Starter Configuration (`aitutor.config.mjs`)
```javascript
export default {
  subtitles: {
    languages: ['en', 'es', 'hi', 'te'],
    glossary: ['React', 'AITutor']
  },
  audio: {
    languages: ['en', 'hi', 'te']
  },
  qualities: {
    generate: true,
    targets: [1080, 720, 480, 360, 240, 144]
  },
  videos: [
    {
      id: 'lesson',
      src: './public/lesson.mp4',
      languages: ['en', 'es', 'hi', 'te'],
      audio: {
        languages: ['en', 'hi', 'te']
      }
    }
  ]
};
```

---

## 6. STEP-BY-STEP GUIDE: USING MULTILINGUAL AUDIO DUBBING (`audioLanguages`)

AITutor v2.1 introduces a decoupled, clean multilingual audio architecture where build-time generation and runtime player visibility are separated.

### Step 1: Generate Audio Dubs at Build Time
Configure the languages you want to generate in `aitutor.config.mjs` or pass them via CLI:
```bash
npx aitutor generate --audio-languages en,hi,te
```
This produces synchronized audio tracks in `public/aitutor/audio/<id>/<lang>.m4a` and records them in `public/aitutor/manifest.json`.

---

### Step 2: Automatic Original Language Default (Zero Config)
When the player mounts, it inspects `sourceLanguage` in the manifest and **automatically defaults to the video's original language**:
- If the original video is English (`sourceLanguage: "en"`), the player defaults to English.
- If the original video is Hindi (`sourceLanguage: "hi"`), the player defaults to Hindi.
- If the original video is Telugu (`sourceLanguage: "te"`), the player defaults to Telugu.

```jsx
// No props needed! Automatically detects source language & exposes all generated dubs
<AITutor src="/lesson.mp4" />
```

---

### Step 3: Runtime Audio Filtering (`audioLanguages` Prop)
The `audioLanguages` prop acts as a **runtime visibility filter** over generated tracks (just like the `subtitles` prop):
```jsx
// Expose only Hindi and Telugu dubs to the student in the player menu
<AITutor 
  src="/lesson.mp4" 
  audioLanguages={["hi", "te"]} 
/>
```
> **Note:** The original source audio is immutable and remains protected. Passing `audioLanguages={["hi", "te"]}` filters the menu options but never overwrites the underlying `sourceLanguage`.

---

### Step 4: Custom Developer Audio Tracks
You can also provide custom audio dub tracks directly via React props:
```jsx
<AITutor
  src="/lesson.mp4"
  audioLanguages={{
    en: "/custom-audio/lesson_en.mp3",
    hi: { label: "Hindi Audio", src: "/custom-audio/lesson_hi.mp3", language: "hi" }
  }}
/>
```

---

### Step 5: Disabling Audio Dubbing Completely
If you want to hide the Audio Language menu and play only the original video audio:
```jsx
<AITutor src="/lesson.mp4" audioLanguages={false} />
```

---

### Step 6: Handling Audio Language Change Events
Listen to user audio language switches via `onAudioLanguageChange`:
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

---

## 7. MULTI-CONTAINER MEDIA INPUT SUPPORT

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

## 8. MANIFEST FORMAT (`/public/aitutor/manifest.json`)

The generator writes a unified manifest index:

```json
{
  "version": "2.1.1",
  "videos": {
    "lesson": {
      "id": "lesson",
      "src": "/lesson.mp4",
      "sourceLanguage": "en",
      "source": {
        "src": "/lesson.mp4",
        "container": "mp4",
        "sourceLanguage": "en"
      },
      "playback": {
        "qualities": [
          { "label": "720p", "src": "/aitutor/videos/lesson/720.mp4", "width": 1280, "height": 720 },
          { "label": "480p", "src": "/aitutor/videos/lesson/480.mp4", "width": 854, "height": 480 }
        ]
      },
      "subtitles": {
        "en": "/aitutor/subtitles/lesson/en.vtt",
        "hi": "/aitutor/subtitles/lesson/hi.vtt",
        "te": "/aitutor/subtitles/lesson/te.vtt"
      },
      "audioLanguages": {
        "en": { "label": "English", "src": "/aitutor/audio/lesson/en.m4a", "language": "en", "source": true },
        "hi": { "label": "Hindi / हिन्दी", "src": "/aitutor/audio/lesson/hi.m4a", "language": "hi", "source": false },
        "te": { "label": "Telugu / తెలుగు", "src": "/aitutor/audio/lesson/te.m4a", "language": "te", "source": false }
      },
      "qualities": [
        { "label": "720p", "src": "/aitutor/videos/lesson/720.mp4", "index": 0 },
        { "label": "480p", "src": "/aitutor/videos/lesson/480.mp4", "index": 1 }
      ]
    }
  }
}
```

---

## 9. SUBPATH EXPORTS & TYPESCRIPT RESOLVERS

### Subtitles Resolver (`tavi-video-tutor/subtitles`)
```typescript
import { resolveSubtitleSources, resolveSubtitleAvailability } from 'tavi-video-tutor/subtitles';

const availability = resolveSubtitleAvailability({
  subtitlesConfig: ['en', 'hi'],
  generatedSubtitles: { en: '/en.vtt', hi: '/hi.vtt' },
  selectedLanguage: 'en'
});
```

### Audio Resolver (`tavi-video-tutor/audio`)
```typescript
import { resolveAudioSources, resolveAudioAvailability } from 'tavi-video-tutor/audio';

const availability = resolveAudioAvailability({
  audioLanguagesConfig: ['en', 'te'],
  manifestAudio: {
    en: { label: 'English', src: '/audio_en.mp3', language: 'en', source: true }
  },
  sourceLanguage: 'en',
  selectedLanguage: 'en'
});
```

---

## 10. API REFERENCE

### `<AITutor />` Props

| Prop | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **`src`** | `string` | *(Required)* | Video file path (`/lesson.mp4`, `/recording.mkv`) or remote URL (`https://...`) |
| **`id`** | `string` | `undefined` | Optional video identifier |
| **`subtitles`** | `'all' \| false \| string[] \| Record<string, string>` | `'all'` | Subtitle configuration & runtime visibility filter |
| **`audioLanguages`** | `'all' \| false \| string[] \| Record<string, string \| AudioTrack>` | `'all'` | Audio dub configuration & runtime visibility filter |
| **`defaultSubLanguage`** | `string` | `'en'` | Initial subtitle language code |
| **`defaultAudioLanguage`** | `string` | `'original'` | Initial audio language code (`'original'` uses source video track) |
| **`qualities`** | `VideoQuality[]` | `undefined` | Optional explicit video quality ladder renditions |
| **`playbackRates`** | `number[]` | `[0.5, 1, 1.25, 1.5, 2]` | Available playback speed options |
| **`onSubLanguageChange`** | `(lang: string) => void` | `undefined` | Subtitle language change callback |
| **`onAudioLanguageChange`** | `(event: AudioLanguageChangeEvent) => void` | `undefined` | Audio language change callback |
| **`onQualityChange`** | `(quality: VideoQuality \| string) => void` | `undefined` | Video quality change callback |

---

## 11. LICENSE

MIT License © 2026 AITutor Maintainers