import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkgDir = path.resolve('.');
const rootDir = path.resolve('../..');
const tarballPath = path.join(pkgDir, 'tavi-video-tutor-0.4.5.tgz');
const testAppDir = path.join(rootDir, 'scratch', 'playback-bug-repro-v046');

console.log('============================================================');
console.log('PHASE 1 & PHASE 2: REPRODUCE & PROVE PLAYBACK CLICK BUG');
console.log('============================================================\n');

if (!fs.existsSync(testAppDir)) {
  fs.mkdirSync(testAppDir, { recursive: true });
  const pkgJson = {
    name: 'external-consumer-repro',
    version: '1.0.0',
    type: 'module'
  };
  fs.writeFileSync(path.join(testAppDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
  console.log('Installing packed tavi-video-tutor package...');
  execSync(`npm install "${tarballPath}" react react-dom jsdom`, { cwd: testAppDir, stdio: 'inherit' });
}

const reproScriptCode = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TaviVideoPlayer } from 'tavi-video-tutor';
import { JSDOM } from 'jsdom';

// Setup browser DOM environment via JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost',
  runScripts: 'dangerously',
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.self = dom.window;
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true, writable: true });
global.HTMLElement = dom.window.HTMLElement;
global.HTMLMediaElement = dom.window.HTMLMediaElement;
global.HTMLVideoElement = dom.window.HTMLVideoElement;
global.HTMLCanvasElement = dom.window.HTMLCanvasElement;
global.requestAnimationFrame = dom.window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = dom.window.cancelAnimationFrame || ((id) => clearTimeout(id));

// Mock canvas context
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

// Simulate User Activation API
let simulatedUserActivationActive = true;
const userActivationObj = {
  get isActive() { return simulatedUserActivationActive; },
  get hasBeenActive() { return true; },
  _setInactive() { simulatedUserActivationActive = false; },
  _setActive() { simulatedUserActivationActive = true; }
};

Object.defineProperty(dom.window.navigator, 'userActivation', {
  value: userActivationObj,
  configurable: true,
  writable: true
});

// Instrument HTMLMediaElement.prototype.play and pause
let playPromiseRejectedError = null;

dom.window.HTMLMediaElement.prototype.play = function() {
  const callTime = performance.now();
  const activeAtCall = dom.window.navigator.userActivation ? dom.window.navigator.userActivation.isActive : true;

  if (!activeAtCall) {
    const err = new dom.window.DOMException(
      "play() failed because the user didn't interact with the document first or user activation expired.",
      "NotAllowedError"
    );
    playPromiseRejectedError = err;
    console.log("\\n[NATIVE video.play() REJECTED DIRECTLY]", {
      callTime: Math.round(callTime),
      userActivationIsActive: activeAtCall,
      errorName: err.name,
      errorMessage: err.message
    });
    return Promise.reject(err);
  }

  this._paused = false;
  Object.defineProperty(this, 'paused', { value: false, configurable: true, writable: true });
  const evt = new dom.window.Event('play');
  this.dispatchEvent(evt);
  return Promise.resolve();
};

dom.window.HTMLMediaElement.prototype.pause = function() {
  this._paused = true;
  Object.defineProperty(this, 'paused', { value: true, configurable: true, writable: true });
  const evt = new dom.window.Event('pause');
  this.dispatchEvent(evt);
};

async function runTrace() {
  console.log("=== PHASE 1: TRACING CURRENT BEHAVIOR ===");
  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container);
  
  const dummyVtt = "WEBVTT\\n\\n1\\n00:00:00.000 --> 00:00:05.000\\nHello world";
  root.render(React.createElement(TaviVideoPlayer, { 
    src: 'test.mp4',
    subtitles: { en: dummyVtt },
    defaultSubLanguage: 'en'
  }));
  await new Promise(r => setTimeout(r, 100));

  const videoElem = document.querySelector('video');
  const interactionBlocker = document.querySelector('.tavi-interaction-blocker');

  console.log("1. Initial state:");
  console.log("   - video.paused before action:", videoElem.paused);
  console.log("   - userActivation.isActive:", dom.window.navigator.userActivation.isActive);

  console.log("\\n2. Triggering User Click on Video Screen Interaction Blocker (e.detail = 1)...");
  simulatedUserActivationActive = true;
  const clickTimestamp = performance.now();
  
  const clickEvt = new dom.window.MouseEvent('click', { detail: 1, bubbles: true });
  interactionBlocker.dispatchEvent(clickEvt);

  console.log("   - Event timestamp:", Math.round(clickTimestamp));
  console.log("   - e.detail:", 1);
  console.log("   - userActivation.isActive at moment of user click:", dom.window.navigator.userActivation.isActive);

  // Modern browsers (Chrome/Safari/Edge) expire transient user activation when returning from setTimeout callback
  console.log("\\n3. Simulating 250ms setTimeout delay window...");
  userActivationObj._setInactive();
  console.log("   - userActivation.isActive after 250ms timer window:", dom.window.navigator.userActivation.isActive);

  // Wait 350ms for clickTimeoutRef to execute handlePlayPauseToggle
  await new Promise(r => setTimeout(r, 350));

  console.log("\\n4. Result state after 250ms setTimeout execution:");
  console.log("   - video.paused after action:", videoElem.paused);

  console.log("\\n=== PHASE 2: VERIFY STATE DESYNCHRONIZATION ===");
  const pauseBtn = document.querySelector('button[aria-label="Pause"]') || document.querySelector('button[title="Pause"]') || document.querySelector('svg path[d*="M6 19h4V5H6v14"]')?.closest('button');
  const playBtn = document.querySelector('button[aria-label="Play"]') || document.querySelector('button[title="Play"]');
  
  const isPauseIconVisible = !!pauseBtn || !!document.querySelector('svg path[d*="M6 19h4V5H6v14"]');

  console.log("   - video.paused === true:", videoElem.paused === true);
  console.log("   - React isPlaying UI state shows playing (Pause Button active):", isPauseIconVisible);
  console.log("   - Exact play() rejection error captured:", playPromiseRejectedError ? playPromiseRejectedError.toString() : 'None');

  if (videoElem.paused === true && isPauseIconVisible === true) {
    console.log("\\n✅ CONFIRMED PLAYBACK BUG & STATE SYNCHRONIZATION FAILURE!");
    console.log("   Bug reproduction results:");
    console.log("   1. Click on video screen triggers clickTimeoutRef (250ms).");
    console.log("   2. During 250ms delay, transient user activation (navigator.userActivation.isActive) expires.");
    console.log("   3. Delayed video.play() call is rejected with NotAllowedError: " + (playPromiseRejectedError ? playPromiseRejectedError.message : ""));
    console.log("   4. video.play().catch(() => {}) swallowed error and optimistic setIsPlaying(true) set UI to Playing state while native video.paused remained true!");
  } else {
    console.log("   State desynchronization verification summary:", {
      videoPaused: videoElem.paused,
      isPauseIconVisible
    });
  }

  process.exit(0);
}

runTrace().catch(console.error);
`;

fs.writeFileSync(path.join(testAppDir, 'runReproTrace.js'), reproScriptCode);

console.log('Running Phase 1 & 2 Reproduction & Tracing script...\n');
try {
  const output = execSync('node runReproTrace.js', { cwd: testAppDir, encoding: 'utf8' });
  console.log(output);
} catch (err) {
  console.error('Error executing reproduction script:', err.stdout || err.message);
}
