import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkgDir = path.resolve('.');
const rootDir = path.resolve('../..');
const tarballPath = path.join(pkgDir, 'tavi-video-tutor-0.4.5.tgz');
const testAppDir = path.join(rootDir, 'scratch', 'playback-bug-repro');

console.log('============================================================');
console.log('PHASE 1 & 2: REPRODUCING PLAYBACK CLICK FAILURE & STATE DESYNC');
console.log('============================================================\n');

// 1. Setup fresh external consumer dir
if (fs.existsSync(testAppDir)) {
  fs.rmSync(testAppDir, { recursive: true, force: true });
}
fs.mkdirSync(testAppDir, { recursive: true });

console.log('1. Initializing external consumer package.json...');
const pkgJson = {
  name: 'playback-bug-repro-app',
  version: '1.0.0',
  type: 'module'
};
fs.writeFileSync(path.join(testAppDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

console.log('2. Installing packed tavi-video-tutor-0.4.5.tgz and React...');
execSync(`npm install "${tarballPath}" react react-dom jsdom`, { cwd: testAppDir, stdio: 'inherit' });
console.log('✓ External consumer npm install PASS\n');

console.log('3. Running Tracing & State Synchronization Test in JSDOM Browser Environment...\n');

const jsdomCode = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TaviVideoPlayer } from 'tavi-video-tutor';
import { JSDOM } from 'jsdom';

// Create DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLVideoElement = dom.window.HTMLVideoElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.requestAnimationFrame = dom.window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = dom.window.cancelAnimationFrame || ((id) => clearTimeout(id));

// Canvas context mock for JSDOM
HTMLCanvasElement.prototype.getContext = function() {
  return {
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    measureText: () => ({ width: 50 }),
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    roundRect: () => {},
    canvas: this
  };
};

// Mock userActivation if missing in jsdom
if (!global.navigator.userActivation) {
  let activeState = true;
  global.navigator.userActivation = {
    get isActive() { return activeState; },
    get hasBeenActive() { return true; },
    _setInactive() { activeState = false; },
    _setActive() { activeState = true; }
  };
}

// Mock HTMLMediaElement.prototype.play and pause
let mockPlayShouldReject = false;
let mockPlayRejectionError = null;

HTMLMediaElement.prototype.play = function() {
  const self = this;
  const userActive = global.navigator.userActivation ? global.navigator.userActivation.isActive : false;
  const playTime = performance.now();
  
  if (!userActive || mockPlayShouldReject) {
    const err = mockPlayRejectionError || new dom.window.DOMException(
      "play() failed because the user didn't interact with the document first or user activation expired.",
      "NotAllowedError"
    );
    console.log("[NATIVE video.play() REJECTED]", {
      playCallTime: playTime,
      userActivationIsActive: userActive,
      errorMessage: err.message,
      errorName: err.name
    });
    return Promise.reject(err);
  }

  console.log("[NATIVE video.play() SUCCESS]", { playCallTime: playTime });
  return new Promise((resolve) => {
    self._paused = false;
    Object.defineProperty(self, 'paused', { value: false, configurable: true, writable: true });
    
    // Dispatch native play event
    const playEvt = new dom.window.Event('play');
    self.dispatchEvent(playEvt);
    resolve();
  });
};

HTMLMediaElement.prototype.pause = function() {
  this._paused = true;
  Object.defineProperty(this, 'paused', { value: true, configurable: true, writable: true });
  const pauseEvt = new dom.window.Event('pause');
  this.dispatchEvent(pauseEvt);
};

// Instrument logs
const traceLogs = [];

function logTrace(step, data) {
  traceLogs.push({ step, timestamp: Date.now(), ...data });
  console.log(\`[TRACE \${step}]\`, JSON.stringify(data, null, 2));
}

// Test Runner inside JSDOM
async function testReproduction() {
  console.log("=== PHASE 1: TRACING CURRENT BEHAVIOR ===");
  
  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container);
  
  root.render(React.createElement(TaviVideoPlayer, { src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }));

  await new Promise(r => setTimeout(r, 100)); // wait for mount
  
  const videoElem = document.querySelector('video');
  const playerScreen = document.querySelector('div[tabindex="0"]');

  console.log("Initial state: video.paused =", videoElem ? videoElem.paused : 'N/A');

  // Trigger screen click
  if (playerScreen) {
    console.log("\\n--- Action: Single Click Screen ---");
    logTrace("CLICK_EVENT", {
      e_detail: 1,
      video_paused_before: videoElem.paused,
      userActivation_isActive: navigator.userActivation.isActive,
      eventTimestamp: performance.now()
    });

    // Simulate click event tick
    const clickEvt = new dom.window.MouseEvent('click', { detail: 1, bubbles: true });
    playerScreen.dispatchEvent(clickEvt);

    // Expire user activation during the 250ms setTimeout
    navigator.userActivation._setInactive();
    console.log("Simulating 250ms delay... userActivation.isActive is now:", navigator.userActivation.isActive);

    // Wait for the 250ms setTimeout in TaviVideoPlayer to fire
    await new Promise(r => setTimeout(r, 350));

    console.log("\\n--- After 250ms setTimeout execution ---");
    console.log("video.paused after action:", videoElem.paused);
    
    // Check Phase 2: State desynchronization
    // Since play() was called after userActivation expired, play() rejected!
    // But handlePlayPauseToggle called setIsPlaying(true) optimistically!
    
    console.log("\\n=== PHASE 2: VERIFY STATE DESYNCHRONIZATION ===");
    console.log("video.paused (native element):", videoElem.paused);
    const playPauseBtn = document.querySelector('button[aria-label="Pause"]') || document.querySelector('button[title="Pause"]');
    console.log("UI Pause Button Present (React isPlaying state is true):", !!playPauseBtn);
    
    if (videoElem.paused === true && !!playPauseBtn) {
      console.log("\\nCONFIRMED STATE SYNCHRONIZATION BUG: video.paused === true WHILE isPlaying === true!");
    } else {
      console.log("State desynchronization result: video.paused =", videoElem.paused, "UI shows playing =", !!playPauseBtn);
    }
  } else {
    console.error("Player container element not found in DOM");
  }
}

testReproduction().catch(err => console.error("Test Error:", err));
`;

fs.writeFileSync(path.join(testAppDir, 'runRepro.js'), jsdomCode);

console.log('Running JSDOM bug reproduction trace...');
try {
  const output = execSync('node runRepro.js', { cwd: testAppDir, encoding: 'utf8' });
  console.log(output);
} catch (err) {
  console.log('Reproduction execution output:\n', err.stdout || err.message);
}
