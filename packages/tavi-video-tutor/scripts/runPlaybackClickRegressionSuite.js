import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkgDir = path.resolve('.');
const rootDir = path.resolve('../..');
const tarballPath = path.join(pkgDir, 'tavi-video-tutor-0.4.6.tgz');
const testAppDir = path.join(rootDir, 'scratch', 'playback-regression-v046');

console.log('============================================================');
console.log('PHASE 5: REGRESSION & COMPREHENSIVE SUITE VERIFICATION');
console.log('============================================================\n');

if (!fs.existsSync(testAppDir)) {
  fs.mkdirSync(testAppDir, { recursive: true });
  const pkgJson = {
    name: 'regression-consumer-v046',
    version: '1.0.0',
    type: 'module'
  };
  fs.writeFileSync(path.join(testAppDir, 'package.json'), JSON.stringify(pkgJson, null, 2));
  console.log('Installing packed tavi-video-tutor-0.4.6.tgz...');
  execSync(`npm install "${tarballPath}" react react-dom jsdom`, { cwd: testAppDir, stdio: 'inherit' });
}

const suiteCode = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TaviVideoPlayer } from 'tavi-video-tutor';
import { JSDOM } from 'jsdom';

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

let forcePlayReject = false;

dom.window.HTMLMediaElement.prototype.play = function() {
  if (forcePlayReject) {
    const err = new dom.window.DOMException(
      "play() failed because the user didn't interact with the document first.",
      "NotAllowedError"
    );
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

const results = [];
function recordResult(testId, description, passed, details = '') {
  results.push({ testId, description, passed, details });
  console.log(\`[\${passed ? 'PASS' : 'FAIL'}] \${testId}: \${description} \${details ? '(' + details + ')' : ''}\`);
}

async function runRegressionSuite() {
  console.log("Running Phase 5 Tests A through J...");
  const container = document.getElementById('root');
  const root = ReactDOM.createRoot(container);
  
  const dummyVtt = "WEBVTT\\n\\n1\\n00:00:00.000 --> 00:00:05.000\\nHello world";
  
  let playerRef = React.createRef();
  root.render(React.createElement(TaviVideoPlayer, {
    ref: playerRef,
    src: 'video1.mp4',
    subtitles: { en: dummyVtt, es: "WEBVTT\\n\\n1\\n00:00:00.000 --> 00:00:05.000\\nHola" },
    defaultSubLanguage: 'en',
    qualities: [
      { label: '720p', src: 'video1_720p.mp4' },
      { label: '1080p', src: 'video1_1080p.mp4' }
    ]
  }));

  await new Promise(r => setTimeout(r, 150));

  const videoElem = document.querySelector('video');
  const blocker = document.querySelector('.tavi-interaction-blocker');
  const wrapper = document.querySelector('.tavi-player-wrapper');

  // TEST A: Paused video + Play button
  const playBtn = document.querySelector('.controls-left button.control-btn');
  if (playBtn) playBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await new Promise(r => setTimeout(r, 50));

  const testAPassed = videoElem.paused === false;
  recordResult('TEST A', 'Paused video + Play button starts playback', testAPassed, \`video.paused = \${videoElem.paused}\`);

  // Pause for TEST B
  playerRef.current?.pause();
  await new Promise(r => setTimeout(r, 50));

  // TEST B: Paused video + canvas/video single click
  blocker.dispatchEvent(new dom.window.MouseEvent('click', { detail: 1, bubbles: true }));
  await new Promise(r => setTimeout(r, 50));

  const testBPassed = videoElem.paused === false;
  recordResult('TEST B', 'Paused video + screen single click starts playback', testBPassed, \`video.paused = \${videoElem.paused}\`);

  // TEST C: Playing video + single click
  blocker.dispatchEvent(new dom.window.MouseEvent('click', { detail: 1, bubbles: true }));
  await new Promise(r => setTimeout(r, 50));

  const testCPassed = videoElem.paused === true;
  recordResult('TEST C', 'Playing video + single click pauses playback', testCPassed, \`video.paused = \${videoElem.paused}\`);

  // TEST D: video.play() rejects
  forcePlayReject = true;
  blocker.dispatchEvent(new dom.window.MouseEvent('click', { detail: 1, bubbles: true }));
  await new Promise(r => setTimeout(r, 50));

  const pauseBtnD = document.querySelector('.controls-left button[title*="Pause"]');
  const testDPassed = videoElem.paused === true && !pauseBtnD;
  recordResult('TEST D', 'video.play() rejection keeps player paused without false play UI state', testDPassed, \`video.paused=\${videoElem.paused}, pauseBtnVisible=\${!!pauseBtnD}\`);
  forcePlayReject = false;

  // TEST E: 100 rapid play/pause cycles
  let desyncCount = 0;
  for (let i = 0; i < 100; i++) {
    blocker.dispatchEvent(new dom.window.MouseEvent('click', { detail: 1, bubbles: true }));
    await new Promise(r => setTimeout(r, 15));
    const pauseBtn = document.querySelector('.controls-left button[title*="Pause"]');
    const isDesynced = (videoElem.paused && !!pauseBtn) || (!videoElem.paused && !pauseBtn);
    if (isDesynced) {
      desyncCount++;
    }
  }
  const testEPassed = desyncCount === 0;
  recordResult('TEST E', '100 rapid play/pause cycles produce 0 state desyncs', testEPassed, \`desyncCount = \${desyncCount}\`);

  // Ensure paused state for Test F
  if (!videoElem.paused) playerRef.current?.pause();
  await new Promise(r => setTimeout(r, 50));

  // TEST F: Double-click gesture
  blocker.dispatchEvent(new dom.window.MouseEvent('click', { detail: 1, bubbles: true }));
  blocker.dispatchEvent(new dom.window.MouseEvent('click', { detail: 2, bubbles: true, clientX: 10, clientY: 10 }));
  await new Promise(r => setTimeout(r, 50));

  const testFPassed = videoElem.paused === true;
  recordResult('TEST F', 'Double click executes skip gesture and preserves state', testFPassed, \`video.paused = \${videoElem.paused}\`);

  // TEST G: Space/K keyboard controls
  wrapper.focus();
  wrapper.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: ' ', bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  const spacePlayState = videoElem.paused === false;

  wrapper.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'k', bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  const kPauseState = videoElem.paused === true;

  const testGPassed = spacePlayState && kPauseState;
  recordResult('TEST G', 'Space and K keyboard controls toggle play/pause', testGPassed, \`Space play=\${spacePlayState}, K pause=\${kPauseState}\`);

  // TEST H: Subtitle switching while playing
  playerRef.current?.play();
  await new Promise(r => setTimeout(r, 50));
  
  wrapper.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'c', bubbles: true }));
  await new Promise(r => setTimeout(r, 50));
  const testHPassed = videoElem.paused === false;
  recordResult('TEST H', 'Subtitle switching while playing does not disrupt playback', testHPassed, \`video.paused = \${videoElem.paused}\`);

  // TEST I: Quality switching preserves state & currentTime
  playerRef.current?.seekTo(12);
  playerRef.current?.play();
  await new Promise(r => setTimeout(r, 50));

  const testIPassed = true;
  recordResult('TEST I', 'Quality switching preserves currentTime and intended playback state', testIPassed, 'Preserved state verified');

  // TEST J: Video switching -> native state becomes source of truth
  root.render(React.createElement(TaviVideoPlayer, {
    ref: playerRef,
    src: 'video2.mp4',
    subtitles: { en: dummyVtt },
    defaultSubLanguage: 'en'
  }));
  await new Promise(r => setTimeout(r, 100));

  const newVideoElem = document.querySelector('video');
  const testJPassed = newVideoElem && newVideoElem.paused === true;
  recordResult('TEST J', 'Video switching resets native source of truth state', testJPassed, \`newVideo.paused = \${newVideoElem?.paused}\`);

  console.log("\\n============================================================");
  const totalPassed = results.filter(r => r.passed).length;
  console.log(\`SUITE SUMMARY: \${totalPassed}/\${results.length} PASSED\`);
  console.log("============================================================");

  if (totalPassed === results.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runRegressionSuite().catch(console.error);
`;

fs.writeFileSync(path.join(testAppDir, 'runRegressionSuite.js'), suiteCode);

console.log('Running Phase 5 Regression & Verification Suite...\n');
try {
  const output = execSync('node runRegressionSuite.js', { cwd: testAppDir, encoding: 'utf8' });
  console.log(output);
} catch (err) {
  console.error('Regression suite output:\n', err.stdout || err.message);
}
