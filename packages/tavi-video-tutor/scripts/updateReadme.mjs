import { execSync } from 'child_process';
import fs from 'fs';

// Get exact previous content from git commit e3f3b44
const previousContent = execSync('git show e3f3b44:packages/tavi-video-tutor/README.md').toString('utf8');

// The new extra features sections to append
const extraSections = `
## 33. MULTILINGUAL AUDIO DUBBING (\`audioLanguages\`) — STEP-BY-STEP GUIDE

AITutor introduces a decoupled, clean multilingual audio architecture where build-time generation and runtime player visibility are separated.

### Step 1: Generate Audio Dubs at Build Time
Configure the languages you want to generate in \`aitutor.config.mjs\` or pass them via CLI:
\`\`\`bash
npx aitutor generate --audio-languages en,hi,te
\`\`\`
This produces synchronized audio tracks in \`public/aitutor/audio/<id>/<lang>.m4a\` and records them in \`public/aitutor/manifest.json\`.

---

### Step 2: Automatic Original Language Default (Zero Config)
When the player mounts, it inspects \`sourceLanguage\` in the manifest and **automatically defaults to the video's original language**:
- If the original video is English (\`sourceLanguage: "en"\`), the player defaults to English.
- If the original video is Hindi (\`sourceLanguage: "hi"\`), the player defaults to Hindi.
- If the original video is Telugu (\`sourceLanguage: "te"\`), the player defaults to Telugu.

\`\`\`jsx
// No props needed! Automatically detects source language & exposes all generated dubs
<AITutor src="/lesson.mp4" />
\`\`\`

---

### Step 3: Runtime Audio Filtering (\`audioLanguages\` Prop)
The \`audioLanguages\` prop acts as a **runtime visibility filter** over generated tracks (just like the \`subtitles\` prop):
\`\`\`jsx
// Expose only Hindi and Telugu dubs to the student in the player menu
<AITutor 
  src="/lesson.mp4" 
  audioLanguages={["hi", "te"]} 
/>
\`\`\`
> **Note:** The original source audio is immutable and remains protected. Passing \`audioLanguages={["hi", "te"]}\` filters the menu options but never overwrites the underlying \`sourceLanguage\`.

---

### Step 4: Custom Developer Audio Tracks
You can also provide custom audio dub tracks directly via React props:
\`\`\`jsx
<AITutor
  src="/lesson.mp4"
  audioLanguages={{
    en: "/custom-audio/lesson_en.mp3",
    hi: { label: "Hindi Audio", src: "/custom-audio/lesson_hi.mp3", language: "hi" }
  }}
/>
\`\`\`

---

### Step 5: Disabling Audio Dubbing Completely
If you want to hide the Audio Language menu and play only the original video audio:
\`\`\`jsx
<AITutor src="/lesson.mp4" audioLanguages={false} />
\`\`\`

---

### Step 6: Handling Audio Language Change Events
Listen to user audio language switches via \`onAudioLanguageChange\`:
\`\`\`jsx
<AITutor
  src="/lesson.mp4"
  onAudioLanguageChange={(event) => {
    console.log('Selected language:', event.language); // e.g. 'hi'
    console.log('Previous language:', event.previousLanguage); // e.g. 'en'
    console.log('Source:', event.source); // 'generated' | 'developer' | 'demo'
  }}
/>
\`\`\`

---

## 34. MULTI-CONTAINER MEDIA INPUT SUPPORT (MP4, MKV, AVI, MOV, WebM)

AITutor accepts multiple media container formats as input:
- **\`.mp4\`** (MPEG-4 Part 14)
- **\`.mkv\`** (Matroska Video)
- **\`.avi\`** (Audio Video Interleave)
- **\`.mov\`** (QuickTime Movie)
- **\`.webm\`** (WebM Video)

### How Multi-Container Normalization Works:
1. **Stream-Aware Media Probing**: FFmpeg inspects actual video/audio streams, sample rates, channels, and rotation tags.
2. **Canonical Processing**: Audio extraction, Whisper transcription, translation, and TTS dubbing execute identically regardless of container format.
3. **Browser Normalization**: Non-browser native containers (e.g. \`.avi\`, \`.mkv\`, \`.mov\`, \`.webm\`) are automatically transcoded to browser-compatible H.264/AAC MP4 renditions stored in \`/public/aitutor/videos/<id>/<height>.mp4\`.
4. **Source Preservation**: **Original source files are 100% preserved and never modified or overwritten.**

\`\`\`jsx
// Works directly with MKV, AVI, MOV, or WebM sources:
<AITutor src="/recording.mkv" />
\`\`\`
`;

// Update Section 31 props table to include audioLanguages and onAudioLanguageChange
let updatedContent = previousContent;

const oldPropsRow = "| **`subtitles`** | `object` | `{}` | Map of developer manual WebVTT paths (`{ en: '/en.vtt' }`) |";
const newPropsRows = `| **\`subtitles\`** | \`'all' \\| false \\| string[] \\| Record<string, string>\` | \`'all'\` | Subtitle configuration & runtime visibility filter |
| **\`audioLanguages\`** | \`'all' \\| false \\| string[] \\| Record<string, string \\| AudioTrack>\` | \`'all'\` | Audio dub configuration & runtime visibility filter |`;

const oldCallbackRow = "| **`onSubLanguageChange`** | `function` | `undefined` | Subtitle language change callback |";
const newCallbackRows = `| **\`onSubLanguageChange\`** | \`function\` | \`undefined\` | Subtitle language change callback |
| **\`onAudioLanguageChange\`** | \`function\` | \`undefined\` | Audio language change callback |`;

if (updatedContent.includes(oldPropsRow)) {
  updatedContent = updatedContent.replace(oldPropsRow, newPropsRows);
}
if (updatedContent.includes(oldCallbackRow)) {
  updatedContent = updatedContent.replace(oldCallbackRow, newCallbackRows);
}

// Insert the new extra sections right before Section 33 (LICENSE)
if (updatedContent.includes('## 33. LICENSE')) {
  updatedContent = updatedContent.replace('## 33. LICENSE', extraSections.trim() + '\n\n---\n\n## 35. LICENSE');
} else {
  updatedContent = updatedContent.trim() + '\n\n' + extraSections.trim();
}

fs.writeFileSync('packages/tavi-video-tutor/README.md', updatedContent, 'utf8');
fs.writeFileSync('README.md', updatedContent, 'utf8');
console.log('Successfully updated both README files: preserved all 33 previous sections and appended extra features 34 and 35!');
