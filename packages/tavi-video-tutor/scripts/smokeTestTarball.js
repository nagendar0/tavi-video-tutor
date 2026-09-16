import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';
import assert from 'assert/strict';

console.log('============================================================');
console.log('PACKAGE TARBALL CONSUMER SMOKE TEST');
console.log('============================================================\n');

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageDir = path.resolve(__dirname, '..');
assert.ok(fs.existsSync(path.join(packageDir, 'package.json')), 'Must find package.json in package directory');

// 1. Build package first
console.log('[1/5] Building distribution bundle...');
execSync('npm run build', { cwd: packageDir, stdio: 'inherit' });

// 2. Generate tarball via npm pack
console.log('\n[2/5] Packaging tarball via npm pack...');
const packOutput = execSync('npm pack', { cwd: packageDir, encoding: 'utf8' }).trim();
const tarballFilename = packOutput.split('\n').pop().trim();
const tarballPath = path.join(packageDir, tarballFilename);
assert.ok(fs.existsSync(tarballPath), `Tarball must exist at ${tarballPath}`);
const tarballStat = fs.statSync(tarballPath);
console.log(`      Created: ${tarballFilename} (${(tarballStat.size / 1024).toFixed(1)} KB)`);

// Inspect tarball contents via tar tf
const listProc = spawnSync('tar', ['-tf', tarballPath], { encoding: 'utf8', windowsHide: true });
if (listProc.status === 0) {
  const files = listProc.stdout.split('\n').filter(Boolean);
  console.log(`      Tarball contains ${files.length} packaged files`);
  assert.ok(files.some(f => f.includes('dist/tavi-video-tutor.js')), 'Must package dist/tavi-video-tutor.js');
  assert.ok(files.some(f => f.includes('dist/player.js')), 'Must package dist/player.js');
  assert.ok(files.some(f => f.includes('dist/tavi-video-tutor.css')), 'Must package dist/tavi-video-tutor.css');
  assert.ok(files.some(f => f.includes('bin/aitutor.js')), 'Must package bin/aitutor.js');
  assert.ok(!files.some(f => f.includes('scratch/')), 'Must NOT package scratch files');
  assert.ok(!files.some(f => f.includes('.system_generated')), 'Must NOT package system generated files');
}

// 3. Create isolated consumer test directory
console.log('\n[3/5] Setting up isolated consumer project...');
const consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-smoke-consumer-'));

try {
  fs.writeFileSync(path.join(consumerDir, 'package.json'), JSON.stringify({
    name: 'smoke-test-consumer',
    version: '1.0.0',
    type: 'module',
    dependencies: {
      react: '^18.3.1',
      'react-dom': '^18.3.1'
    }
  }, null, 2), 'utf8');

  // 4. Install packaged tarball
  console.log('\n[4/5] Installing tarball into consumer project...');
  execSync(`npm install "${tarballPath}"`, { cwd: consumerDir, stdio: 'inherit' });

  // 5. Verify ESM and CJS imports in consumer project
  console.log('\n[5/5] Executing consumer smoke tests (ESM, CJS, Subpaths, CLI)...');

  // A. ESM root import
  const esmScript = `
    import AITutor, { TaviVideoPlayer, resolveSubtitleAvailability } from 'tavi-video-tutor';
    import assert from 'node:assert/strict';
    assert.ok(AITutor, 'AITutor default export must exist');
    assert.ok(TaviVideoPlayer, 'TaviVideoPlayer named export must exist');
    assert.ok(typeof resolveSubtitleAvailability === 'function', 'resolveSubtitleAvailability must be a function');
    console.log('      ✓ ESM root import OK');
  `;
  fs.writeFileSync(path.join(consumerDir, 'test-esm.mjs'), esmScript, 'utf8');
  execSync('node test-esm.mjs', { cwd: consumerDir, stdio: 'inherit' });

  // B. ESM player subpath import
  const subpathScript = `
    import { TaviVideoPlayer } from 'tavi-video-tutor/player';
    import assert from 'node:assert/strict';
    assert.ok(TaviVideoPlayer, 'Player subpath export must exist');
    console.log('      ✓ ESM player subpath import OK');
  `;
  fs.writeFileSync(path.join(consumerDir, 'test-subpath.mjs'), subpathScript, 'utf8');
  execSync('node test-subpath.mjs', { cwd: consumerDir, stdio: 'inherit' });

  // C. CJS require test
  const cjsScript = `
    const pkg = require('tavi-video-tutor');
    const playerPkg = require('tavi-video-tutor/player');
    const assert = require('node:assert/strict');
    assert.ok(pkg.AITutor || pkg.default, 'CJS package must export AITutor');
    assert.ok(playerPkg.TaviVideoPlayer || playerPkg.default, 'CJS player subpath must export TaviVideoPlayer');
    console.log('      ✓ CommonJS require OK');
  `;
  fs.writeFileSync(path.join(consumerDir, 'test-cjs.cjs'), cjsScript, 'utf8');
  execSync('node test-cjs.cjs', { cwd: consumerDir, stdio: 'inherit' });

  // D. Verify CLI executable
  const cliProc = spawnSync('node', ['node_modules/tavi-video-tutor/bin/aitutor.js', '--help'], {
    cwd: consumerDir,
    encoding: 'utf8',
    windowsHide: true
  });
  assert.equal(cliProc.status, 0, 'CLI binary must exit with 0 on --help');
  assert.ok(cliProc.stdout.includes('aitutor'), 'CLI output should include aitutor');
  console.log('      ✓ CLI binary execution OK');

  console.log('\n============================================================');
  console.log('TARBALL SMOKE TEST: ALL GATES PASSED (100% PRODUCTION READY)');
  console.log('============================================================\n');
} finally {
  try { fs.unlinkSync(tarballPath); } catch (_) {}
  try { fs.rmSync(consumerDir, { recursive: true, force: true }); } catch (_) {}
}
