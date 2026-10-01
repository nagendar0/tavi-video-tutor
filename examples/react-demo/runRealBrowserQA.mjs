import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || 'C:\\Users\\nagen\\.gemini\\antigravity-ide\\brain\\f9526e3b-f82c-4c2e-aa34-6a7b00feb7ef';

if (!fs.existsSync(ARTIFACTS_DIR)) {
  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

function getChromePath() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (fs.existsSync(chromePath)) return chromePath;
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  if (fs.existsSync(edgePath)) return edgePath;
  return undefined;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean scenario navigation helper
async function gotoScenario(page, scenario) {
  await page.goto(`http://localhost:5180/?qa=1&scenario=${scenario}`, { waitUntil: 'load' });
  await sleep(400);
}

// Helper to reliably open the Audio Language submenu
async function openAudioMenu(page) {
  await page.evaluate(() => {
    if (document.querySelector('.settings-submenu[aria-label="Audio language settings"]')) return;
    const card = document.querySelector('.tavi-settings-card');
    if (!card) {
      const btn = document.querySelector('button.settings-btn, button[aria-label="Player settings"]');
      if (btn) btn.click();
    }
  });
  await sleep(250);

  await page.evaluate(() => {
    if (document.querySelector('.settings-submenu[aria-label="Audio language settings"]')) return;
    const backBtn = document.querySelector('.submenu-header');
    if (backBtn) backBtn.click();

    const items = Array.from(document.querySelectorAll('.settings-item'));
    const audioItem = items.find(el => el.textContent.includes('Audio Language'));
    if (audioItem) audioItem.click();
  });
  await sleep(300);
}

// Helper to set search query cleanly triggering React's synthetic event system
async function setSearchQuery(page, query) {
  await page.evaluate((q) => {
    const input = document.querySelector('input[placeholder="Search language..."]');
    if (input) {
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, q);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, query);
  await sleep(200);
}

async function run() {
  console.log('============================================================');
  console.log('REAL CHROMIUM BROWSER VISUAL QA: EXACT 5-ROW LIMIT VERIFICATION');
  console.log('============================================================\n');

  // 1. Start Vite Server
  console.log('[1/10] Starting Vite Server on port 5180...');
  const server = await createServer({
    root: __dirname,
    server: { port: 5180 }
  });
  await server.listen();
  console.log('  ✓ Vite server running at http://localhost:5180\n');

  // 2. Launch Real Chrome via Puppeteer
  const executablePath = getChromePath();
  console.log(`[2/10] Launching Chrome executable: ${executablePath}...`);
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    protocolTimeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--mute-audio',
      '--autoplay-policy=no-user-gesture-required',
      '--window-size=1280,900'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('Autoplay')) {
        consoleErrors.push(text);
        console.error('  [Browser Error]:', text);
      }
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.error('  [Page Error]:', err.message);
  });

  const results = {};

  try {
    // =========================================================================
    // TEST 1 - 5 LANGUAGES (All 5 Visible, No Search, No Scrollbar)
    // =========================================================================
    console.log('\n--- TEST 1: 5 LANGUAGES (ALL 5 VISIBLE, NO SCROLLBAR) ---');
    await gotoScenario(page, '5lang');
    await openAudioMenu(page);

    const t1Data = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder="Search language..."]');
      const submenu = document.querySelector('.settings-submenu[aria-label="Audio language settings"]');
      const items = Array.from(submenu ? submenu.querySelectorAll('.submenu-item') : []);
      const scrollList = submenu ? submenu.querySelector('.custom-scrollbar') : null;

      // Check if each item is visible
      const itemRects = items.map(el => {
        const r = el.getBoundingClientRect();
        return { height: r.height, top: r.top, bottom: r.bottom };
      });

      const listRect = scrollList ? scrollList.getBoundingClientRect() : null;
      const all5Visible = itemRects.length === 5 && itemRects.every(r => r.height === 38);
      const hasScrollbar = scrollList ? scrollList.scrollHeight > scrollList.clientHeight : false;

      return {
        hasSearch: searchInput !== null,
        itemCount: items.length,
        hasScrollbar,
        scrollHeight: scrollList ? scrollList.scrollHeight : 0,
        clientHeight: scrollList ? scrollList.clientHeight : 0,
        all5Visible,
        pageScrollY: window.scrollY
      };
    });

    const shot1Path = path.join(ARTIFACTS_DIR, 'evidence_5lang_no_scrollbar.png');
    await page.screenshot({ path: shot1Path });

    const passT1 = !t1Data.hasSearch && t1Data.itemCount === 5 && !t1Data.hasScrollbar && t1Data.all5Visible && t1Data.pageScrollY === 0;
    results['5-language UI (all 5 visible, no scrollbar)'] = passT1 ? 'PASS' : 'FAIL';
    console.log(`  ✓ Search bar visible: ${t1Data.hasSearch} (Expected: false)`);
    console.log(`  ✓ All 5 language items visible: ${t1Data.all5Visible}`);
    console.log(`  ✓ Scrollbar present: ${t1Data.hasScrollbar} (Expected: false)`);
    console.log(`  ✓ Client height equals scroll height: ${t1Data.clientHeight}px == ${t1Data.scrollHeight}px`);
    console.log(`  ✓ Screenshot saved: ${shot1Path}`);
    console.log(`  RESULT: ${results['5-language UI (all 5 visible, no scrollbar)']}`);

    // =========================================================================
    // TEST 2 - 6 LANGUAGES (Search Visible, Exactly 5 Rows Visible, 6th Reachable by Scrolling)
    // =========================================================================
    console.log('\n--- TEST 2: 6 LANGUAGES (EXACTLY 5 ROWS VISIBLE + 6th BY SCROLLING) ---');
    await gotoScenario(page, '6lang');
    await openAudioMenu(page);

    const t2Initial = await page.evaluate(() => {
      const searchInput = document.querySelector('input[placeholder="Search language..."]');
      const submenu = document.querySelector('.settings-submenu[aria-label="Audio language settings"]');
      const items = Array.from(submenu ? submenu.querySelectorAll('.submenu-item') : []);
      const scrollList = submenu ? submenu.querySelector('.custom-scrollbar') : null;
      const listRect = scrollList.getBoundingClientRect();

      // Check how many items are fully in viewport initially (scrollTop = 0)
      const visibleCount = items.filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= listRect.top - 1 && r.bottom <= listRect.bottom + 1;
      }).length;

      // Check 6th item position initially
      const sixthItem = items[5];
      const sixthRect = sixthItem.getBoundingClientRect();
      const isSixthVisibleInitially = sixthRect.bottom <= listRect.bottom;

      return {
        hasSearch: searchInput !== null,
        totalItems: items.length,
        listClientHeight: scrollList.clientHeight,
        listScrollHeight: scrollList.scrollHeight,
        expectedViewportHeight: 5 * 38, // 190px
        visibleCount,
        isSixthVisibleInitially,
        sixthLanguage: sixthItem.textContent.trim()
      };
    });

    const shot2Path = path.join(ARTIFACTS_DIR, 'evidence_5_row_limit_6lang.png');
    await page.screenshot({ path: shot2Path });

    // Scroll to reveal the 6th language
    const t2Scrolled = await page.evaluate(() => {
      const scrollList = document.querySelector('.settings-submenu .custom-scrollbar');
      scrollList.scrollTop = scrollList.scrollHeight;
      const listRect = scrollList.getBoundingClientRect();
      const items = Array.from(document.querySelectorAll('.settings-submenu .submenu-item'));
      const sixthItem = items[5];
      const sixthRect = sixthItem.getBoundingClientRect();
      const isSixthVisibleNow = sixthRect.top >= listRect.top - 1 && sixthRect.bottom <= listRect.bottom + 1;
      return {
        scrollTop: scrollList.scrollTop,
        isSixthVisibleNow
      };
    });

    const passT2 = t2Initial.hasSearch &&
      t2Initial.totalItems === 6 &&
      t2Initial.listClientHeight === 190 &&
      t2Initial.visibleCount === 5 &&
      !t2Initial.isSixthVisibleInitially &&
      t2Scrolled.isSixthVisibleNow;

    results['6-language UI (search visible, exactly 5 rows visible, 6th by scroll)'] = passT2 ? 'PASS' : 'FAIL';
    console.log(`  ✓ Search visible: ${t2Initial.hasSearch}`);
    console.log(`  ✓ Viewport height: ${t2Initial.listClientHeight}px (Expected: 190px = 5 * 38px)`);
    console.log(`  ✓ Initially visible rows: ${t2Initial.visibleCount} (Expected: exactly 5)`);
    console.log(`  ✓ 6th item ("${t2Initial.sixthLanguage}") hidden initially: ${!t2Initial.isSixthVisibleInitially}`);
    console.log(`  ✓ 6th item accessible after scrolling: ${t2Scrolled.isSixthVisibleNow}`);
    console.log(`  ✓ Screenshot saved: ${shot2Path}`);
    console.log(`  RESULT: ${results['6-language UI (search visible, exactly 5 rows visible, 6th by scroll)']}`);

    // =========================================================================
    // TEST 3 - 13 LANGUAGES (Exactly 5 Rows Visible, Full Scroll Reachability 1 to 13)
    // =========================================================================
    console.log('\n--- TEST 3: 13 LANGUAGES (EXACTLY 5 ROWS, SCROLL FROM 1 TO 13) ---');
    await gotoScenario(page, '13lang');
    await openAudioMenu(page);

    const t3Initial = await page.evaluate(() => {
      const submenu = document.querySelector('.settings-submenu[aria-label="Audio language settings"]');
      const items = Array.from(submenu.querySelectorAll('.submenu-item'));
      const scrollList = submenu.querySelector('.custom-scrollbar');
      const listRect = scrollList.getBoundingClientRect();

      const visibleCount = items.filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= listRect.top - 1 && r.bottom <= listRect.bottom + 1;
      }).length;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];

      return {
        totalItems: items.length,
        listClientHeight: scrollList.clientHeight,
        listScrollHeight: scrollList.scrollHeight,
        visibleCount,
        firstItemVisible: firstItem.getBoundingClientRect().top >= listRect.top - 1,
        lastItemVisible: lastItem.getBoundingClientRect().bottom <= listRect.bottom + 1,
        firstName: firstItem.textContent.trim(),
        lastName: lastItem.textContent.trim()
      };
    });

    const shot3Path = path.join(ARTIFACTS_DIR, 'evidence_5_row_limit_13lang.png');
    await page.screenshot({ path: shot3Path });

    // Scroll to the bottom and verify language 13 is fully in view
    const t3Scrolled = await page.evaluate(() => {
      const scrollList = document.querySelector('.settings-submenu .custom-scrollbar');
      scrollList.scrollTop = scrollList.scrollHeight;
      const listRect = scrollList.getBoundingClientRect();
      const items = Array.from(document.querySelectorAll('.settings-submenu .submenu-item'));
      const lastItem = items[items.length - 1];
      const r = lastItem.getBoundingClientRect();
      const lastItemVisibleNow = r.top >= listRect.top - 1 && r.bottom <= listRect.bottom + 1;

      return {
        scrollTop: scrollList.scrollTop,
        maxScrollTop: scrollList.scrollHeight - scrollList.clientHeight,
        lastItemVisibleNow,
        pageScrollY: window.scrollY
      };
    });

    const shot3BottomPath = path.join(ARTIFACTS_DIR, 'evidence_13lang_scrolled_to_bottom.png');
    await page.screenshot({ path: shot3BottomPath });

    // Verify all 13 items are reachable sequentially
    const reachableResults = await page.evaluate(() => {
      const scrollList = document.querySelector('.settings-submenu .custom-scrollbar');
      const items = Array.from(document.querySelectorAll('.settings-submenu .submenu-item'));
      const reachable = [];

      for (let i = 0; i < items.length; i++) {
        items[i].scrollIntoView({ block: 'nearest' });
        const listRect = scrollList.getBoundingClientRect();
        const r = items[i].getBoundingClientRect();
        const isVisible = r.top >= listRect.top - 2 && r.bottom <= listRect.bottom + 2;
        reachable.push(isVisible);
      }
      return reachable;
    });

    const all13Reachable = reachableResults.length === 13 && reachableResults.every(Boolean);
    const passT3 = t3Initial.totalItems === 13 &&
      t3Initial.listClientHeight === 190 &&
      t3Initial.visibleCount === 5 &&
      t3Initial.firstItemVisible &&
      !t3Initial.lastItemVisible &&
      t3Scrolled.lastItemVisibleNow &&
      all13Reachable &&
      t3Scrolled.pageScrollY === 0;

    results['13-language UI (5 visible, full scroll 1 to 13)'] = passT3 ? 'PASS' : 'FAIL';
    console.log(`  ✓ Total items: ${t3Initial.totalItems}`);
    console.log(`  ✓ Viewport height: ${t3Initial.listClientHeight}px (Expected: 190px = 5 * 38px)`);
    console.log(`  ✓ Exactly 5 rows visible: ${t3Initial.visibleCount === 5}`);
    console.log(`  ✓ First language ("${t3Initial.firstName}") visible initially: ${t3Initial.firstItemVisible}`);
    console.log(`  ✓ Last language ("${t3Initial.lastName}") hidden initially: ${!t3Initial.lastItemVisible}`);
    console.log(`  ✓ Last language reached on scroll: ${t3Scrolled.lastItemVisibleNow}`);
    console.log(`  ✓ All 13 languages sequentially reachable: ${all13Reachable} (${reachableResults.filter(Boolean).length}/13)`);
    console.log(`  ✓ Page scrollY untouched: ${t3Scrolled.pageScrollY === 0}`);
    console.log(`  ✓ Screenshot saved: ${shot3Path}`);
    console.log(`  RESULT: ${results['13-language UI (5 visible, full scroll 1 to 13)']}`);

    // =========================================================================
    // TEST 4 - 109 LANGUAGES (Exactly 5 Rows Visible, Search Works, Full Range Scroll)
    // =========================================================================
    console.log('\n--- TEST 4: 109 LANGUAGES (5 ROWS, SEARCH & FULL SCROLL) ---');
    await gotoScenario(page, '109lang');
    await openAudioMenu(page);

    const t4Initial = await page.evaluate(() => {
      const submenu = document.querySelector('.settings-submenu[aria-label="Audio language settings"]');
      const items = Array.from(submenu.querySelectorAll('.submenu-item'));
      const scrollList = submenu.querySelector('.custom-scrollbar');
      const listRect = scrollList.getBoundingClientRect();

      const visibleCount = items.filter(el => {
        const r = el.getBoundingClientRect();
        return r.top >= listRect.top - 1 && r.bottom <= listRect.bottom + 1;
      }).length;

      return {
        totalItems: items.length,
        listClientHeight: scrollList.clientHeight,
        listScrollHeight: scrollList.scrollHeight,
        expectedScrollHeight: 109 * 38, // 4142px
        visibleCount,
        firstItem: items[0].textContent.trim(),
        lastItem: items[items.length - 1].textContent.trim()
      };
    });

    const shot4Path = path.join(ARTIFACTS_DIR, 'evidence_5_row_limit_109lang.png');
    await page.screenshot({ path: shot4Path });

    // Test scrolling to beginning, middle, and end of 109 languages
    const t4ScrollChecks = await page.evaluate(() => {
      const scrollList = document.querySelector('.settings-submenu .custom-scrollbar');
      const items = Array.from(document.querySelectorAll('.settings-submenu .submenu-item'));
      const listRect = scrollList.getBoundingClientRect();

      // Beginning
      scrollList.scrollTop = 0;
      const itemBeg = items[0];
      const begVisible = itemBeg.getBoundingClientRect().top >= listRect.top - 1;

      // Middle (item 54)
      items[54].scrollIntoView({ block: 'center' });
      const itemMid = items[54];
      const midRect = itemMid.getBoundingClientRect();
      const midVisible = midRect.top >= listRect.top - 1 && midRect.bottom <= listRect.bottom + 1;

      // End (item 108 - Zulu)
      scrollList.scrollTop = scrollList.scrollHeight;
      const itemEnd = items[items.length - 1];
      const endRect = itemEnd.getBoundingClientRect();
      const endVisible = endRect.top >= listRect.top - 1 && endRect.bottom <= listRect.bottom + 1;

      return {
        begVisible,
        midVisible,
        midName: itemMid.textContent.trim(),
        endVisible,
        endName: itemEnd.textContent.trim(),
        pageScrollY: window.scrollY
      };
    });

    // Test search works in 109-lang mode
    const searchTargets109 = ['English', 'Hindi', 'Telugu', 'Spanish', 'Arabic', 'Chinese', 'Japanese', 'Malayalam'];
    const found109 = {};
    for (const target of searchTargets109) {
      await setSearchQuery(page, target);
      const f = await page.evaluate((t) => {
        const items = Array.from(document.querySelectorAll('.settings-submenu .submenu-item'));
        return items.some(el => el.textContent.toLowerCase().includes(t.toLowerCase()));
      }, target);
      found109[target] = f;
    }
    await setSearchQuery(page, '');

    const passT4 = t4Initial.totalItems === 109 &&
      t4Initial.listClientHeight === 190 &&
      t4Initial.visibleCount === 5 &&
      t4ScrollChecks.begVisible &&
      t4ScrollChecks.midVisible &&
      t4ScrollChecks.endVisible &&
      Object.values(found109).every(Boolean) &&
      t4ScrollChecks.pageScrollY === 0;

    results['109-language UI (5 visible, full scroll beg/mid/end, search)'] = passT4 ? 'PASS' : 'FAIL';
    console.log(`  ✓ Total registry items: ${t4Initial.totalItems}`);
    console.log(`  ✓ Viewport height: ${t4Initial.listClientHeight}px (Expected: 190px = 5 * 38px)`);
    console.log(`  ✓ Exactly 5 rows visible: ${t4Initial.visibleCount === 5}`);
    console.log(`  ✓ Beginning reached: ${t4ScrollChecks.begVisible} ("${t4Initial.firstItem}")`);
    console.log(`  ✓ Middle reached: ${t4ScrollChecks.midVisible} ("${t4ScrollChecks.midName}")`);
    console.log(`  ✓ End reached: ${t4ScrollChecks.endVisible} ("${t4ScrollChecks.endName}")`);
    console.log(`  ✓ Search works across registry:`, found109);
    console.log(`  ✓ Page scrollY: ${t4ScrollChecks.pageScrollY}`);
    console.log(`  ✓ Screenshot saved: ${shot4Path}`);
    console.log(`  RESULT: ${results['109-language UI (5 visible, full scroll beg/mid/end, search)']}`);

    // =========================================================================
    // TEST 5 - VERIFY STICKY SEARCH STAYS VISIBLE WHILE SCROLLING
    // =========================================================================
    console.log('\n--- TEST 5: STICKY SEARCH HEADER PERSISTENCE ---');
    await gotoScenario(page, '13lang');
    await openAudioMenu(page);

    const stickyResult = await page.evaluate(() => {
      const scrollList = document.querySelector('.settings-submenu .custom-scrollbar');
      const searchHeader = document.querySelector('.settings-submenu input[placeholder="Search language..."]');
      const initialInputTop = searchHeader.getBoundingClientRect().top;

      // Scroll list down
      scrollList.scrollTop = 150;
      const scrolledInputTop = searchHeader.getBoundingClientRect().top;
      const isVisible = searchHeader.getBoundingClientRect().height > 0;

      return {
        initialInputTop,
        scrolledInputTop,
        isSticky: initialInputTop === scrolledInputTop,
        isVisible,
        pageScrollY: window.scrollY
      };
    });

    const passT5 = stickyResult.isSticky && stickyResult.isVisible && stickyResult.pageScrollY === 0;
    results['sticky search stays visible while rows scroll'] = passT5 ? 'PASS' : 'FAIL';
    console.log(`  ✓ Search header top position unchanged after scroll: ${stickyResult.isSticky}`);
    console.log(`  ✓ Search header is visible: ${stickyResult.isVisible}`);
    console.log(`  ✓ Page scrollY untouched: ${stickyResult.pageScrollY === 0}`);
    console.log(`  RESULT: ${results['sticky search stays visible while rows scroll']}`);

    // =========================================================================
    // TEST 6 - VERIFY PAGE SCROLLY REMAINS UNCHANGED
    // =========================================================================
    console.log('\n--- TEST 6: OUTER PAGE SCROLL ISOLATION ---');
    const pageScrollY = await page.evaluate(() => window.scrollY);
    const passT6 = pageScrollY === 0;
    results['page scrollY remains unchanged (0)'] = passT6 ? 'PASS' : 'FAIL';
    console.log(`  ✓ window.scrollY = ${pageScrollY} (Expected: 0)`);
    console.log(`  RESULT: ${results['page scrollY remains unchanged (0)']}`);

    // =========================================================================
    // TEST 7 - VERIFY SELECTING A LANGUAGE CHANGES AUDIO CORRECTLY
    // =========================================================================
    console.log('\n--- TEST 7: AUDIO SELECTION INTEGRATION ---');
    await gotoScenario(page, '13lang');

    // Cycle through: Original -> Hindi -> Telugu -> Spanish -> Original
    const testLanguages = ['original', 'hi', 'te', 'es', 'original'];
    const audioEvents = [];

    for (const lang of testLanguages) {
      await openAudioMenu(page);
      await page.evaluate((target) => {
        const items = Array.from(document.querySelectorAll('.settings-submenu .submenu-item'));
        let match;
        if (target === 'original') match = items.find(el => el.textContent.includes('(Original)'));
        else if (target === 'hi') match = items.find(el => el.textContent.includes('Hindi'));
        else if (target === 'te') match = items.find(el => el.textContent.includes('Telugu'));
        else if (target === 'es') match = items.find(el => el.textContent.includes('Spanish'));
        if (match) match.click();
      }, lang);
      await sleep(250);

      const state = await page.evaluate(() => ({
        currentAudio: window.__QA_STATE__?.currentAudio,
        latestEvent: (window.__QA_STATE__?.audioEvents || []).slice(-1)[0]
      }));
      audioEvents.push(state);
    }

    const passT7 = audioEvents.length === 5 &&
      audioEvents[0].currentAudio === 'original' &&
      audioEvents[1].currentAudio === 'hi' &&
      audioEvents[2].currentAudio === 'te' &&
      audioEvents[3].currentAudio === 'es' &&
      audioEvents[4].currentAudio === 'original';

    results['selecting a language still changes audio correctly'] = passT7 ? 'PASS' : 'FAIL';
    audioEvents.forEach((ev, i) => {
      console.log(`  ✓ Step ${i + 1}: ${testLanguages[i]} -> Active: "${ev.currentAudio}" (Event lang: "${ev.latestEvent?.language}")`);
    });
    console.log(`  RESULT: ${results['selecting a language still changes audio correctly']}`);

  } catch (err) {
    console.error('Test Execution Error:', err);
  } finally {
    await browser.close();
    await server.close();
  }

  // =========================================================================
  // ERRORS AUDIT
  // =========================================================================
  console.log('\n--- CONSOLE & PAGE ERRORS ---');
  console.log(`  Browser Console Errors: ${consoleErrors.length}`);
  console.log(`  Browser Page Errors: ${pageErrors.length}`);

  // =========================================================================
  // FINAL REPORT
  // =========================================================================
  console.log('\n============================================================');
  console.log('FINAL BROWSER VISUAL QA REPORT: 5-ROW LIMIT REFINEMENT');
  console.log('============================================================');
  for (const [key, val] of Object.entries(results)) {
    console.log(`- ${key} = ${val}`);
  }
  console.log(`- console errors = ${consoleErrors.length}`);
  console.log(`- page errors = ${pageErrors.length}`);
  console.log('============================================================\n');

  const hasFails = Object.values(results).some(v => v === 'FAIL') || consoleErrors.length > 0 || pageErrors.length > 0;
  process.exit(hasFails ? 1 : 0);
}

run();
