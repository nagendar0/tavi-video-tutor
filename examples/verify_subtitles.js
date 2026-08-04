/**
 * Verification script for Subtitle Rendering and Dropdown Selector
 * Runs in Node.js to verify component logic, timestamp matching,
 * and draw coordinates.
 */

const fs = require('fs');
const path = require('path');

// Helper to simulate imports by reading files directly
const rootPath = 'c:/Users/nagen/ai-tutor-system';
const playerFile = path.join(rootPath, 'packages/tavi-video-tutor/src/components/TaviVideoPlayer.jsx');
const engineFile = path.join(rootPath, 'packages/tavi-video-tutor/src/components/SubtitleEngine.jsx');
const subtitlesFile = path.join(rootPath, 'examples/react-demo/src/subtitles.js');

console.log('--- Subtitle & Dropdown Verification Run ---');

// 1. Verify exact WebVTT timestamp parsing and findActiveCue timing
function testParserAndSearch() {
  console.log('\n[Test 1] Parsing & Search Verification');
  
  // Minimal WebVTT Parser mockup matching SubtitleEngine.jsx
  const parseTime = (timeStr) => {
    const parts = timeStr.trim().split(':');
    let hrs = 0, mins = 0, secs = 0;
    if (parts.length === 3) {
      hrs = parseInt(parts[0], 10);
      mins = parseInt(parts[1], 10);
      secs = parseFloat(parts[2]);
    } else if (parts.length === 2) {
      mins = parseInt(parts[0], 10);
      secs = parseFloat(parts[1]);
    }
    return hrs * 3600 + mins * 60 + secs;
  };

  const parseWebVTTMock = (vttText) => {
    const lines = vttText.split(/\r?\n/);
    const cues = [];
    let currentCue = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        const times = line.split('-->');
        currentCue = {
          id: cues.length.toString(),
          start: parseTime(times[0]),
          end: parseTime(times[1]),
          text: ''
        };
        cues.push(currentCue);
      } else if (currentCue && line !== '' && isNaN(Number(line))) {
        currentCue.text += (currentCue.text ? ' ' : '') + line;
      }
    }
    return cues;
  };

  const findActiveCueMock = (cues, time) => {
    if (!cues || cues.length === 0) return null;
    let low = 0;
    let high = cues.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const cue = cues[mid];
      if (time >= cue.start && time <= cue.end) {
        return cue;
      } else if (time < cue.start) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    return null;
  };

  // Test WebVTT parser
  const sampleVTT = `WEBVTT

1
00:00:00.500 --> 00:00:04.000
Welcome to the custom AI Video Tutor workspace.

2
00:00:04.500 --> 00:00:09.500
This player runs completely on a canvas screen.`;

  const cues = parseWebVTTMock(sampleVTT);
  console.log(`Parsed Cues:`, cues);
  
  // Verify precise timestamp matches
  const testTimes = [0.0, 0.5, 2.0, 4.0, 4.2, 4.5, 9.5, 10.0];
  testTimes.forEach(t => {
    const active = findActiveCueMock(cues, t);
    console.log(`Time: ${t.toFixed(3)}s -> Active Cue: ${active ? `"${active.text}" [${active.start}-${active.end}]` : 'None'}`);
  });
}

// 2. Verify Dropdown Filtering
function testDropdownFiltering() {
  console.log('\n[Test 2] Dropdown 100+ Language Filter Verification');
  
  const playerContent = fs.readFileSync(playerFile, 'utf8');
  const matchBlock = playerContent.match(/const LANGUAGE_NAMES = \{([\s\S]*?)\};/);
  const languagesFound = [];
  
  if (matchBlock && matchBlock[1]) {
    const regex = /([a-z]{2,3}):\s*"/g;
    let match;
    while ((match = regex.exec(matchBlock[1])) !== null) {
      languagesFound.push(match[1]);
    }
  }
  
  console.log(`Total languages generated in DB: ${languagesFound.length}`);
  
  // Simulation of dropdown search query filtering
  const simulateSearch = (query) => {
    const term = query.toLowerCase().trim();
    return languagesFound.filter(code => code.includes(term));
  };
  
  const searchQueries = ['en', 'hi', 'z', 'b'];
  searchQueries.forEach(q => {
    const results = simulateSearch(q);
    console.log(`Search query "${q}" matches codes: ${JSON.stringify(results.slice(0, 5))}... (total ${results.length} matches)`);
  });
}

// 3. Stacking and Overlap Math
function verifySubtitlesStacking() {
  console.log('\n[Test 3] Subtitles Overlap with UI Controls Math');

  const heights = [240, 360, 480, 720, 1080];
  const controlsHeight = 52; // .tavi-controls-bar height is 52px

  heights.forEach(canvasHeight => {
    const baseFontSize = Math.max(14, canvasHeight * 0.035);
    const bottomMargin = canvasHeight * 0.085;
    
    // Primary subtitle height (1 line)
    const primaryLineHeight = baseFontSize * 1.3;
    const primaryStartY = canvasHeight - bottomMargin - primaryLineHeight + (primaryLineHeight / 2);
    
    // Bottom edge of primary text line (y + fontSize/2)
    const primaryBottom = primaryStartY + (baseFontSize / 2);
    
    // Controls position starts at: canvasHeight - controlsHeight
    const controlsTop = canvasHeight - controlsHeight;
    
    const overlapPx = primaryBottom - controlsTop;
    const isOverlapping = overlapPx > 0;

    console.log(`Canvas Height: ${canvasHeight}px:`);
    console.log(`  - baseFontSize: ${baseFontSize.toFixed(1)}px`);
    console.log(`  - bottomMargin: ${bottomMargin.toFixed(1)}px`);
    console.log(`  - Subtitle Bottom Edge: ${primaryBottom.toFixed(1)}px`);
    console.log(`  - Controls Top Edge: ${controlsTop.toFixed(1)}px`);
    console.log(`  - Overlaps when controls visible: ${isOverlapping ? `YES (by ${overlapPx.toFixed(1)}px)` : 'NO'}`);
  });
}

// 4. Verify Immediate updates without Video Reload logic
function verifyReloadAndRenderLifecycle() {
  console.log('\n[Test 4] State and Reload Lifecycle Audit');
  const playerCode = fs.readFileSync(playerFile, 'utf8');

  // Verify that activeSrc triggers video reload
  const hasActiveSrcReload = playerCode.includes('video.load()') && playerCode.includes('[activeSrc]');
  console.log(`Audit: Does video reload when activeSrc changes? ${hasActiveSrcReload ? 'Yes' : 'No'}`);

  // Verify that defaultSubLanguage updates selectedSubLanguage
  const hasSubLangSync = playerCode.includes('setSelectedSubLanguage(defaultSubLanguage)');
  console.log(`Audit: Does selectedSubLanguage sync with defaultSubLanguage? ${hasSubLangSync ? 'Yes' : 'No'}`);

  // Check if paintSingleFrame is called on selectedSubLanguage change when paused
  const lines = playerCode.split('\n');
  let hasSubLangPaintEffect = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('paintSingleFrame')) {
      const block = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10)).join('\n');
      if (block.includes('selectedSubLanguage') || block.includes('primaryCues')) {
        console.log(`Found paintSingleFrame call at line ${i+1}: "${lines[i].trim()}"`);
        console.log(`Surrounding block:\n${block}`);
        hasSubLangPaintEffect = true;
        break;
      }
    }
  }

  console.log(`Audit: Is paintSingleFrame() triggered when subtitle selection changes? ${hasSubLangPaintEffect ? 'Yes' : 'No (Paused rendering lag bug exists)'}`);
}

// 5. Verify Embedded Track Integration
function verifyEmbeddedTrackIntegration() {
  console.log('\n[Test 5] Embedded Track Extraction & Integration Audit');
  const playerCode = fs.readFileSync(playerFile, 'utf8');

  // Verify that the code has embeddedTracks state
  const hasEmbeddedTracksState = playerCode.includes('useState') && playerCode.includes('embeddedTracks');
  console.log(`Audit: Does player have embeddedTracks state? ${hasEmbeddedTracksState ? 'Yes' : 'No'}`);

  // Verify that TextTrack events (onaddtrack, onremovetrack) are registered
  const hasAddTrackListener = playerCode.includes('onaddtrack') || playerCode.includes('onremovetrack');
  console.log(`Audit: Does player subscribe to dynamic track additions? ${hasAddTrackListener ? 'Yes' : 'No'}`);

  // Verify that the helper getActiveSubtitleText is defined
  const hasGetActiveTextHelper = playerCode.includes('getActiveSubtitleText');
  console.log(`Audit: Is getActiveSubtitleText helper present? ${hasGetActiveTextHelper ? 'Yes' : 'No'}`);

  // Verify that the draw loops call drawCanvasSubtitles with activePrimaryText and activeSecondaryText
  const hasUpdatedDrawSignature = playerCode.includes('activePrimaryText') && playerCode.includes('activeSecondaryText');
  console.log(`Audit: Does canvas draw loop invoke renderer with text strings? ${hasUpdatedDrawSignature ? 'Yes' : 'No'}`);
}

// 6. Verify Translation and Proxy Configuration
function verifyTranslationAndProxyConfig() {
  console.log('\n[Test 6] YouTube Transcript & Auto-Translation Integration Audit');
  const playerCode = fs.readFileSync(playerFile, 'utf8');
  
  // Verify that vite.config.js has configureServer with both api endpoints
  const viteConfigPath = path.join(__dirname, 'react-demo', 'vite.config.js');
  if (fs.existsSync(viteConfigPath)) {
    const viteCode = fs.readFileSync(viteConfigPath, 'utf8');
    const hasTranscriptApi = viteCode.includes('/api/youtube-transcript');
    const hasTranslateApi = viteCode.includes('/api/translate');
    console.log(`Audit: Does Vite server support /api/youtube-transcript endpoint? ${hasTranscriptApi ? 'Yes' : 'No'}`);
    console.log(`Audit: Does Vite server support /api/translate endpoint? ${hasTranslateApi ? 'Yes' : 'No'}`);
  } else {
    console.log('Audit Warning: vite.config.js not found in expected path');
  }

  // Verify that TaviVideoPlayer has translateCues defined
  const hasTranslateCues = playerCode.includes('translateCues');
  console.log(`Audit: Is translateCues helper present in player? ${hasTranslateCues ? 'Yes' : 'No'}`);

  // Verify that TaviVideoPlayer does NOT have YouTube subtitle fetch input fields (removed for automation)
  const hasYtSubsUI = playerCode.includes('ytUrlOrId') && playerCode.includes('isFetchingYtSubs');
  console.log(`Audit: Does player exclude YouTube subtitles fetcher input UI? ${!hasYtSubsUI ? 'Yes' : 'No'}`);
}

// 7. Verify AI Transcriber Configuration
function verifyAITranscriberConfig() {
  console.log('\n[Test 7] In-Browser AI Auto-Transcriber Integration Audit');
  const playerCode = fs.readFileSync(playerFile, 'utf8');

  // Verify that the transcriber service is imported
  const hasTranscriberImport = playerCode.includes('transcribeVideoAudio');
  console.log(`Audit: Is transcribeVideoAudio imported in TaviVideoPlayer? ${hasTranscriberImport ? 'Yes' : 'No'}`);

  // Verify that the UI button is NOT present (removed for automation)
  const hasAITranscribeBtn = playerCode.includes('Generate AI Subtitles');
  console.log(`Audit: Is the manual "Generate AI Subtitles" button UI removed? ${!hasAITranscribeBtn ? 'Yes' : 'No'}`);

  // Verify that the progress states are declared
  const hasAIProgressStates = playerCode.includes('isTranscribingAI') && playerCode.includes('aiTranscriptionProgress');
  console.log(`Audit: Are AI progress tracker state variables declared? ${hasAIProgressStates ? 'Yes' : 'No'}`);

  // Verify that the canvas draw loops contain the transcription overlay check
  const hasCanvasOverlayCheck = playerCode.includes('isTranscribingAIRef.current') && playerCode.includes('drawTranscriptionOverlay');
  console.log(`Audit: Do canvas draw loops overlay the transcription progress bar? ${hasCanvasOverlayCheck ? 'Yes' : 'No'}`);
}

// 8. Verify Auto-Subtitle Storage and Callback Pipeline
function verifyAutoSubtitleStoragePipeline() {
  console.log('\n[Test 8] Auto-Subtitle Storage & Callback Pipeline Audit');
  const playerCode = fs.readFileSync(playerFile, 'utf8');
  const wrapperCode = fs.readFileSync(path.join(__dirname, '..', 'packages', 'tavi-video-tutor', 'src', 'components', 'AITutor.jsx'), 'utf8');
  
  // Verify that SubtitleCache is imported in player
  const hasCacheImport = playerCode.includes('getCachedSubtitle') && playerCode.includes('setCachedSubtitle');
  console.log(`Audit: Are getCachedSubtitle and setCachedSubtitle imported in player? ${hasCacheImport ? 'Yes' : 'No'}`);

  // Verify that onSubtitleGenerated prop is declared and passed in AITutor
  const hasCallbackInWrapper = wrapperCode.includes('onSubtitleGenerated');
  console.log(`Audit: Is onSubtitleGenerated forwarded by AITutor wrapper? ${hasCallbackInWrapper ? 'Yes' : 'No'}`);

  // Verify that onSubtitleGenerated is called when subtitles are set/loaded
  const hasCallbackCalls = playerCode.includes('onSubtitleGenerated?.(cachedVtt') || playerCode.includes('onSubtitleGenerated?.(vtt');
  console.log(`Audit: Does the player trigger onSubtitleGenerated callback? ${hasCallbackCalls ? 'Yes' : 'No'}`);
}

testParserAndSearch();
testDropdownFiltering();
verifySubtitlesStacking();
verifyReloadAndRenderLifecycle();
verifyEmbeddedTrackIntegration();
verifyTranslationAndProxyConfig();
verifyAITranscriberConfig();
verifyAutoSubtitleStoragePipeline();

