import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const pkgDir = path.resolve('.');
const rootDir = path.resolve('../..');
const tarballPath = path.join(pkgDir, 'tavi-video-tutor-0.4.3.tgz');
const testAppDir = path.join(rootDir, 'scratch', 'fresh-v043-test');

async function runVerification() {
  console.log('============================================================');
  console.log('AITUTOR v0.4.3 — FRESH EXTERNAL CONSUMER VERIFICATION');
  console.log('============================================================\n');

  if (fs.existsSync(testAppDir)) {
    fs.rmSync(testAppDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testAppDir, { recursive: true });

  console.log('1. Initializing fresh package.json...');
  const pkgJson = {
    name: 'fresh-v043-app',
    version: '1.0.0',
    type: 'module',
    scripts: {
      build: 'vite build'
    }
  };
  fs.writeFileSync(path.join(testAppDir, 'package.json'), JSON.stringify(pkgJson, null, 2));

  console.log('2. Installing packed tavi-video-tutor-0.4.3.tgz...');
  execSync(`npm install "${tarballPath}" react react-dom vite @vitejs/plugin-react`, { cwd: testAppDir, stdio: 'inherit' });
  console.log('✓ npm install PASS\n');

  console.log('3. Running npx aitutor init...');
  execSync('npx aitutor init --force', { cwd: testAppDir, stdio: 'inherit' });
  console.log('✓ npx aitutor init PASS\n');

  // Place dummy video file for generation
  const publicDir = path.join(testAppDir, 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  
  // Copy dummy.wav to public/lesson.mp4
  const dummySrc = path.join(pkgDir, 'dummy.wav');
  fs.copyFileSync(dummySrc, path.join(publicDir, 'lesson.mp4'));

  console.log('4. Running first npx aitutor generate...');
  const gen1Output = execSync('npx aitutor generate', { cwd: testAppDir, encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' } });
  console.log(gen1Output);
  console.log('✓ First generation & model feedback PASS\n');

  console.log('5. Running npx aitutor validate...');
  const valOutput = execSync('npx aitutor validate', { cwd: testAppDir, encoding: 'utf8' });
  console.log(valOutput);
  if (!valOutput.includes('PASS')) throw new Error('npx aitutor validate failed!');
  console.log('✓ npx aitutor validate PASS\n');

  console.log('6. Running second npx aitutor generate (verifying cache hit & no re-download)...');
  const gen2Output = execSync('npx aitutor generate', { cwd: testAppDir, encoding: 'utf8' });
  console.log(gen2Output);
  if (!gen2Output.includes('cached')) throw new Error('Second generation did not use cache!');
  console.log('✓ Second generation cache verification PASS\n');

  console.log('7. Creating Vite React component consumer App.jsx & index.html...');
  const srcDir = path.join(testAppDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  const appJsx = `import React from 'react';
import { AITutor, TaviVideoPlayer, resolveSubtitleSources } from 'tavi-video-tutor';
import 'tavi-video-tutor/dist/style.css';

export default function App() {
  return <AITutor src="/lesson.mp4" />;
}
`;
  fs.writeFileSync(path.join(srcDir, 'App.jsx'), appJsx);

  const mainJsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`;
  fs.writeFileSync(path.join(srcDir, 'main.jsx'), mainJsx);

  const indexHtml = `<!DOCTYPE html>
<html>
  <head><title>Test</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
  fs.writeFileSync(path.join(testAppDir, 'index.html'), indexHtml);

  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()]
});
`;
  fs.writeFileSync(path.join(testAppDir, 'vite.config.js'), viteConfig);

  console.log('8. Building Vite production bundle...');
  execSync('npx vite build', { cwd: testAppDir, stdio: 'inherit' });
  
  // Inspect build dist bundle size
  const distDir = path.join(testAppDir, 'dist', 'assets');
  const files = fs.readdirSync(distDir);
  let totalJsBytes = 0;
  files.forEach(f => {
    if (f.endsWith('.js')) {
      const stats = fs.statSync(path.join(distDir, f));
      totalJsBytes += stats.size;
      console.log(`Bundle Asset File: ${f} — ${(stats.size / 1024).toFixed(2)} KB`);
    }
  });

  console.log(`✓ Vite production build PASS! Total JS Bundle size: ${(totalJsBytes / 1024).toFixed(2)} KB\n`);
  console.log('============================================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('============================================================');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
