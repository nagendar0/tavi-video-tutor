import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import fs from 'fs';

function getBrowserExecutable() {
  const paths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

async function run() {
  console.log('Starting Vite server...');
  const server = await createServer({
    root: process.cwd(),
    server: { port: 5173 }
  });
  await server.listen();
  console.log('Vite server running on http://localhost:5173');

  const executablePath = getBrowserExecutable();
  console.log('Using browser executable:', executablePath);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  const networkLogs = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('.vtt') || url.includes('/api/translate') || url.includes('/aitutor/')) {
      networkLogs.push({ type: 'request', url });
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('.vtt') || url.includes('/api/translate') || url.includes('/aitutor/')) {
      networkLogs.push({ type: 'response', url, status: res.status() });
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Error') || text.includes('VTT') || text.includes('Translation') || text.includes('batch')) {
      console.log('Browser console:', text);
    }
  });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  console.log('Page loaded successfully.');

  const testLangs = ['en', 'te', 'hi', 'ta', 'kn', 'ml', 'bn', 'es', 'fr', 'de', 'ar', 'he', 'ur', 'zh', 'ja', 'ko', 'ru', 'th'];

  const results = [];

  for (const lang of testLangs) {
    const reqsBefore = networkLogs.length;
    
    // Select language in the dropdown
    await page.evaluate((targetLang) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const langBtn = buttons.find(b => b.textContent.includes('Testing Controller') || b.textContent.includes('English (') || b.textContent.includes('Spanish (') || b.textContent.includes('Telugu (') || b.textContent.includes('Hindi (') || b.textContent.includes('French (') || b.textContent.includes('German ('));
      if (langBtn) {
        langBtn.click();
      }
    }, lang);

    await new Promise(r => setTimeout(r, 200));

    await page.evaluate((targetLang) => {
      const input = document.querySelector('input[placeholder="Search language..."]');
      if (input) {
        input.value = targetLang;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, lang);

    await new Promise(r => setTimeout(r, 200));

    await page.evaluate((targetLang) => {
      const itemBtns = Array.from(document.querySelectorAll('button'));
      const targetBtn = itemBtns.find(b => b.textContent.includes(`(${targetLang.toUpperCase()})`));
      if (targetBtn) {
        targetBtn.click();
      }
    }, lang);

    await new Promise(r => setTimeout(r, 1000));

    const reqsAfter = networkLogs.slice(reqsBefore);

    results.push({
      lang,
      networkActivity: reqsAfter
    });
  }

  console.log('\n--- NETWORK & STATE TEST RESULTS ---');
  console.log(JSON.stringify(results, null, 2));

  await browser.close();
  await server.close();
}

run().catch(err => {
  console.error('Error running test:', err);
  process.exit(1);
});
