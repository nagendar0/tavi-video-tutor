# AI Tutor Video System: Scratch Architecture Blueprint

This document defines the blueprint and specifications for the new, lightweight, and custom AI Tutor Video System built completely from scratch (both frontend and backend) with zero external player library dependencies.

---

## 1. Core Concept & State Flow

The application switches between three states:
1. **WATCHING**: A custom video player renders the lecture (MP4, YouTube, Vimeo, HLS, or DASH).
2. **LISTENING (Doubt Interrupt)**: When the user says "Hey Tavi" or clicks the microphone, the video pauses, the whiteboard mounts, and the mic listens for voice input with a visualizer wave.
3. **WHITEBOARDING (Explaining)**: The AI Agent explains the concept. It speaks audio and draws dynamic canvas drawings (shapes, stacks, trees) synchronized with the voice.

---

## 2. Frontend Specifications

### A. The Unified Video Player Engine (`<AITutor src=""/>`)
Built natively in React without `Video.js` or `react-player`:
* **HTML5 Player**: Native `<video>` for local MP4/WebM/OGG.
* **YouTube Engine**: Dynamic loader for `https://www.youtube.com/iframe_api`.
* **Vimeo Engine**: Dynamic loader for `https://player.vimeo.com/api/player.js`.
* **Streaming Engine (HLS & DASH)**: Uses browser **Media Source Extensions (MSE)**. In Chrome/Firefox, we dynamically load `hls.js` or `dash.js` via a CDN URL when a streaming source is detected.
* **Shield Blocker**: A transparent `div` layer sits on top of all players to block native clicks/controls and redirect all events to our custom controls bar.

### B. Subtitles & Audio Dubbing Engine
* **100+ Language JSON Translation**: Subtitles are stored in a unified JSON map. Instantly switches active subtitle language in React without track reloads.
* **Dual Subtitle Mode**: Renders both primary (spoken) and secondary (translated) subtitles simultaneously for learning accessibility.
* **Interactive Cues (Click-to-Learn)**: Clicking any word in the subtitle pauses the player and triggers a Tavi concept explanation.
* **Audio Track Sync**: Syncs external translation audio tracks (`.mp3`) with the running video. Mutes the original video and adjusts audio playback speed and drift dynamically.

### C. Voice & Canvas Whiteboard
* **Speech Recognition**: Uses native browser Web Speech API (`webkitSpeechRecognition`) for voice input.
* **Whiteboard Animator**: Pure HTML5 Canvas rendering engine. Drawings, text, lines, and tree nodes animate on-screen based on coordinate streams sent by the AI Agent.

---

## 3. Backend Specifications

### A. Realtime FastAPI App
* **WebSockets**: Realtime duplex communication between the frontend client and the AI Tutor agent.
* **Socratic Dialogue Engine**: Connects to the LLM backend to answer user doubts Socratically (using questions to guide them to the answer).
* **Coordinate Generator**: Translates explanations into drawing instructions (coordinates and commands) sent to the frontend whiteboard.

### B. Translation Database
* Stores and serves the JSON subtitle files and synchronized audio dub tracks.
