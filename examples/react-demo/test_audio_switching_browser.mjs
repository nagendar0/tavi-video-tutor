import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function getChromePath() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(chromePath)) return chromePath;
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(edgePath)) return edgePath;
  return undefined;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBrowserTests() {
  console.log('============================================================');
  console.log('REAL CHROMIUM BROWSER AUDIO SWITCHING & FAILURE SUITE');
  console.log('============================================================\n');

  const serverUrl = 'http://localhost:5180';
  console.log(`✓ Using existing Vite server at ${serverUrl}`);

  const executablePath = getChromePath();
  console.log(`✓ Using Chrome executable: ${executablePath}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    protocolTimeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--autoplay-policy=no-user-gesture-required',
      '--window-size=1280,900'
    ]
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('[BROWSER]', msg.text()));
  page.on('pageerror', err => console.error('[Page Error]:', err.message));

  try {
    await page.goto(serverUrl, { waitUntil: 'domcontentloaded' });
    await sleep(1500);

    // Track video.load() calls in page context
    await page.evaluate(() => {
      const v = document.querySelector('video');
      window.__videoLoadCount = 0;
      if (v) {
        const origLoad = v.load.bind(v);
        v.load = function() {
          window.__videoLoadCount++;
          return origLoad();
        };
      }
    });

    // Start video playback
    await page.evaluate(() => {
      const v = document.querySelector('video');
      if (v) {
        v.muted = false;
        v.play().catch(() => {});
      }
    });
    await sleep(600);

    // Initial state (Original)
    const initialMetrics = await page.evaluate(() => {
      const v = document.querySelector('video');
      const audioElements = Array.from(document.querySelectorAll('audio'));
      const activeAudio = audioElements.find(a => a.src && !a.paused) || audioElements[0];
      return {
        videoSrc: v?.src || '',
        videoCurrentSrc: v?.currentSrc || '',
        videoMuted: v?.muted,
        videoPaused: v?.paused,
        videoTime: v?.currentTime || 0,
        audioSrc: activeAudio?.src || '',
        audioPaused: activeAudio ? activeAudio.paused : true,
        videoBuffering: Boolean(document.querySelector('.tavi-buffering-overlay')),
        audioBuffering: Boolean(document.querySelector('.tavi-audio-status-pill')),
        audioError: document.querySelector('.tavi-audio-error-banner')?.textContent?.trim() || null,
        loadCalls: window.__videoLoadCount
      };
    });

    console.log('\n--- State 1: Original Audio ---');
    console.log('video.currentSrc:', initialMetrics.videoCurrentSrc);
    console.log('video.muted:', initialMetrics.videoMuted);
    console.log('video.load() calls:', initialMetrics.loadCalls);
    console.log('videoBuffering overlay:', initialMetrics.videoBuffering);

    const baseVideoSrc = initialMetrics.videoCurrentSrc;

    // Helper to open audio settings and select language
    async function selectAudioLanguage(langCode) {
      await page.evaluate(() => {
        const card = document.querySelector('.tavi-settings-card');
        if (!card) {
          const btn = document.querySelector('button.settings-btn, button[aria-label="Player settings"]');
          if (btn) btn.click();
        }
      });
      await sleep(350);

      await page.evaluate(() => {
        const submenu = document.querySelector('.settings-submenu[aria-label="Audio language settings"]');
        if (submenu) return;
        const items = Array.from(document.querySelectorAll('.settings-item'));
        const audioItem = items.find(el => el.textContent.includes('Audio Language'));
        if (audioItem) audioItem.click();
      });
      await sleep(350);

      await page.evaluate((code) => {
        const items = Array.from(document.querySelectorAll('.submenu-item'));
        let target = null;
        if (code === 'original') {
          target = items.find(el => el.textContent.includes('Original'));
        } else if (code === 'hi') {
          target = items.find(el => el.textContent.includes('Hindi'));
        } else if (code === 'te') {
          target = items.find(el => el.textContent.includes('Telugu'));
        } else if (code === 'es') {
          target = items.find(el => el.textContent.includes('Spanish'));
        }
        if (target) {
          target.click();
        } else {
          console.warn('[selectAudioLanguage] Target not found for:', code);
        }
      }, langCode);
      await sleep(1500);
    }

    // Helper to inspect media states
    async function inspectState() {
      return await page.evaluate(() => {
        const v = document.querySelector('video');
        const activeAudio = window.__aitutor_audio || v?.__audioElement || document.querySelector('audio');
        return {
          videoSrc: v?.src || '',
          videoCurrentSrc: v?.currentSrc || '',
          videoMuted: v?.muted,
          videoPaused: v?.paused,
          videoTime: v?.currentTime || 0,
          audioSrc: activeAudio?.src || '',
          audioCurrentSrc: activeAudio?.currentSrc || '',
          audioPaused: activeAudio ? activeAudio.paused : true,
          audioReadyState: activeAudio ? activeAudio.readyState : 0,
          audioTime: activeAudio ? activeAudio.currentTime : 0,
          videoBuffering: Boolean(document.querySelector('.tavi-buffering-overlay')),
          audioBuffering: Boolean(document.querySelector('.tavi-audio-status-pill')),
          audioError: document.querySelector('.tavi-audio-error-banner')?.textContent?.trim() || null,
          loadCalls: window.__videoLoadCount || 0
        };
      });
    }

    // --- TRANSITION 1: Switch to Hindi ---
    console.log('\n--- Switching to Hindi ---');
    await selectAudioLanguage('hi');
    await sleep(600);
    const hiState1 = await inspectState();
    await sleep(600);
    const hiState2 = await inspectState();

    console.log('video.currentSrc:', hiState2.videoCurrentSrc);
    console.log('audio.currentSrc:', hiState2.audioCurrentSrc);
    console.log('video.muted:', hiState2.videoMuted);
    console.log('audio.paused:', hiState2.audioPaused);
    console.log('audio.readyState:', hiState2.audioReadyState);
    console.log('audio.currentTime:', hiState2.audioTime, 'video.currentTime:', hiState2.videoTime);
    console.log('videoBuffering overlay:', hiState2.videoBuffering);
    console.log('video.load() calls:', hiState2.loadCalls);

    if (hiState2.videoCurrentSrc !== baseVideoSrc) {
      throw new Error(`FAIL: video.currentSrc changed on Hindi switch! (${hiState2.videoCurrentSrc} !== ${baseVideoSrc})`);
    }
    if (!hiState2.videoMuted) {
      throw new Error('FAIL: video was not muted during Hindi dub playback!');
    }
    if (!hiState2.audioCurrentSrc.includes('demo-hi.m4a')) {
      throw new Error(`FAIL: audio.currentSrc does not point to Hindi m4a (${hiState2.audioCurrentSrc})`);
    }
    if (hiState2.loadCalls !== 0) {
      throw new Error(`FAIL: video.load() was called during Hindi switch! (${hiState2.loadCalls})`);
    }
    if (hiState2.videoBuffering) {
      throw new Error('FAIL: video buffering overlay is visible during dub playback!');
    }
    console.log('✓ Hindi transition PASSED all assertions');

    // --- TRANSITION 2: Switch to Telugu ---
    console.log('\n--- Switching to Telugu ---');
    await selectAudioLanguage('te');
    await sleep(600);
    const teState1 = await inspectState();
    await sleep(600);
    const teState2 = await inspectState();

    console.log('video.currentSrc:', teState2.videoCurrentSrc);
    console.log('audio.currentSrc:', teState2.audioCurrentSrc);
    console.log('video.muted:', teState2.videoMuted);
    console.log('audio.paused:', teState2.audioPaused);
    console.log('audio.readyState:', teState2.audioReadyState);
    console.log('audio.currentTime:', teState2.audioTime, 'video.currentTime:', teState2.videoTime);
    console.log('videoBuffering overlay:', teState2.videoBuffering);
    console.log('video.load() calls:', teState2.loadCalls);

    if (teState2.videoCurrentSrc !== baseVideoSrc) {
      throw new Error(`FAIL: video.currentSrc changed on Telugu switch! (${teState2.videoCurrentSrc} !== ${baseVideoSrc})`);
    }
    if (!teState2.videoMuted) {
      throw new Error('FAIL: video was not muted during Telugu dub playback!');
    }
    if (!teState2.audioCurrentSrc.includes('demo-te.m4a')) {
      throw new Error(`FAIL: audio.currentSrc does not point to Telugu m4a (${teState2.audioCurrentSrc})`);
    }
    if (teState2.loadCalls !== 0) {
      throw new Error(`FAIL: video.load() was called during Telugu switch! (${teState2.loadCalls})`);
    }
    console.log('✓ Telugu transition PASSED all assertions');

    // --- TRANSITION 3: Switch to Spanish ---
    console.log('\n--- Switching to Spanish ---');
    await selectAudioLanguage('es');
    await sleep(600);
    const esState1 = await inspectState();
    await sleep(600);
    const esState2 = await inspectState();

    console.log('video.currentSrc:', esState2.videoCurrentSrc);
    console.log('audio.currentSrc:', esState2.audioCurrentSrc);
    console.log('video.muted:', esState2.videoMuted);
    console.log('audio.paused:', esState2.audioPaused);
    console.log('audio.readyState:', esState2.audioReadyState);
    console.log('audio.currentTime:', esState2.audioTime, 'video.currentTime:', esState2.videoTime);
    console.log('videoBuffering overlay:', esState2.videoBuffering);
    console.log('video.load() calls:', esState2.loadCalls);

    if (esState2.videoCurrentSrc !== baseVideoSrc) {
      throw new Error(`FAIL: video.currentSrc changed on Spanish switch!`);
    }
    if (!esState2.videoMuted) {
      throw new Error('FAIL: video was not muted during Spanish dub playback!');
    }
    if (!esState2.audioCurrentSrc.includes('demo-es.m4a')) {
      throw new Error(`FAIL: audio.currentSrc does not point to Spanish m4a (${esState2.audioCurrentSrc})`);
    }
    if (esState2.loadCalls !== 0) {
      throw new Error(`FAIL: video.load() was called during Spanish switch!`);
    }
    console.log('✓ Spanish transition PASSED all assertions');

    // --- TRANSITION 4: Return to Original ---
    console.log('\n--- Returning to Original ---');
    await selectAudioLanguage('original');
    await sleep(600);
    const origState = await inspectState();

    console.log('video.currentSrc:', origState.videoCurrentSrc);
    console.log('video.muted:', origState.videoMuted);
    console.log('audio.paused:', origState.audioPaused);
    console.log('audio.src:', origState.audioSrc);
    console.log('video.load() calls:', origState.loadCalls);

    if (origState.videoCurrentSrc !== baseVideoSrc) {
      throw new Error(`FAIL: video.currentSrc changed on return to Original!`);
    }
    if (origState.videoMuted) {
      throw new Error('FAIL: video remained muted after returning to Original!');
    }
    if (!origState.audioPaused) {
      throw new Error('FAIL: dub audio was not paused after returning to Original!');
    }
    if (origState.loadCalls !== 0) {
      throw new Error(`FAIL: video.load() was called during return to Original!`);
    }
    console.log('✓ Return to Original PASSED all assertions');

    // --- FAILURE TEST (FIX 10): Invalid Audio URL Injection ---
    console.log('\n============================================================');
    console.log('FAILURE TEST (FIX 10): INJECTING INVALID HINDI AUDIO URL');
    console.log('============================================================');

    await page.evaluate(() => {
      // Simulate an invalid audio track URL in audio options
      const v = document.querySelector('video');
      window.__initialSrcBeforeFailure = v.currentSrc;
      window.__initialLoadCountBeforeFailure = window.__videoLoadCount;
    });

    // Directly trigger switch to an invalid Hindi track via audio controller or trigger failure
    const failureResult = await page.evaluate(async () => {
      // Dispatch switch to non-existent Hindi audio
      const audio = document.querySelector('audio');
      if (audio) {
        audio.src = '/demo-audio/nonexistent-invalid-hi.m4a';
        audio.dispatchEvent(new Event('error'));
      }
      await new Promise(r => setTimeout(r, 400));

      const v = document.querySelector('video');
      const errBanner = document.querySelector('.tavi-audio-error-banner, [data-testid="audio-error-banner"]');
      const videoBuffering = document.querySelector('.tavi-buffering-overlay');
      return {
        videoSrcUnchanged: v.currentSrc === window.__initialSrcBeforeFailure,
        videoLoadCountSame: window.__videoLoadCount === window.__initialLoadCountBeforeFailure,
        videoMuted: v.muted,
        videoBufferingVisible: Boolean(videoBuffering),
        errorBannerText: errBanner ? errBanner.textContent.trim() : null
      };
    });

    console.log('video.currentSrc unchanged:', failureResult.videoSrcUnchanged);
    console.log('video.load() not called:', failureResult.videoLoadCountSame);
    console.log('videoBuffering overlay visible:', failureResult.videoBufferingVisible);
    console.log('Error banner text:', failureResult.errorBannerText);

    if (!failureResult.videoSrcUnchanged) {
      throw new Error('FAIL: video.currentSrc changed during audio failure!');
    }
    if (!failureResult.videoLoadCountSame) {
      throw new Error('FAIL: video.load() was invoked during audio failure!');
    }
    if (failureResult.videoBufferingVisible) {
      throw new Error('FAIL: generic VIDEO LOADING overlay is shown during audio failure!');
    }

    console.log('✓ Failure test (FIX 10) PASSED all assertions');
    console.log('\n============================================================');
    console.log('ALL REAL BROWSER TESTS AND INVARIANTS PASSED SUCCESSFULLY!');
    console.log('============================================================');

  } finally {
    await browser.close();
  }
}

runBrowserTests().catch(err => {
  console.error('\n❌ BROWSER TEST FAILED:', err);
  process.exit(1);
});
