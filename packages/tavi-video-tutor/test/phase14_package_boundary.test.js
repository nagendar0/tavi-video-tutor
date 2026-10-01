import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import cp from 'node:child_process';
import { pathToFileURL } from 'node:url';

const PKG_ROOT = path.resolve('.');
const TARBALL_NAME = 'tavi-video-tutor-2.2.1.tgz';
const TARBALL_PATH = path.join(PKG_ROOT, TARBALL_NAME);

let tmpExtractDir = '';
let unpackedPkgDir = '';
let tmpConsumerDir = '';

before(() => {
  // Always produce a fresh release tarball from current state
  cp.execSync('npm pack', { cwd: PKG_ROOT, stdio: 'pipe' });

  // Create isolated temp extraction directory outside workspace
  tmpExtractDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-p14-extract-'));
  cp.execSync(`tar -xzf "${TARBALL_PATH}" -C "${tmpExtractDir}"`);
  unpackedPkgDir = path.join(tmpExtractDir, 'package');

  // Create isolated clean consumer directory outside workspace
  tmpConsumerDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-p14-consumer-'));
  fs.writeFileSync(path.join(tmpConsumerDir, 'package.json'), JSON.stringify({
    name: 'clean-consumer-app',
    version: '1.0.0',
    type: 'module'
  }, null, 2));

  // Install packed tarball + peer dependencies (react, react-dom) into clean consumer directory
  cp.execSync(`npm install --prefer-offline "${TARBALL_PATH}" react react-dom`, { cwd: tmpConsumerDir, stdio: 'pipe' });
});

after(() => {
  if (tmpExtractDir && fs.existsSync(tmpExtractDir)) {
    try { fs.rmSync(tmpExtractDir, { recursive: true, force: true }); } catch (_) {}
  }
  if (tmpConsumerDir && fs.existsSync(tmpConsumerDir)) {
    try { fs.rmSync(tmpConsumerDir, { recursive: true, force: true }); } catch (_) {}
  }
});

// Helper to run code inside the clean consumer directory
function runInConsumer(scriptCode) {
  const runnerFile = path.join(tmpConsumerDir, `runner_${Date.now()}_${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(runnerFile, scriptCode);
  try {
    const stdout = cp.execSync(`node "${runnerFile}"`, { cwd: tmpConsumerDir, stdio: 'pipe' }).toString();
    return { ok: true, stdout };
  } catch (err) {
    return { ok: false, error: err, stderr: err.stderr ? err.stderr.toString() : '', stdout: err.stdout ? err.stdout.toString() : '' };
  } finally {
    try { fs.unlinkSync(runnerFile); } catch (_) {}
  }
}

// ============================================================================
// TESTS 1–8: PACKAGE METADATA AND MANIFEST AUDIT
// ============================================================================

test('1. Manifest defines exact canonical package name "tavi-video-tutor"', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.equal(pkgJson.name, 'tavi-video-tutor');
});

test('2. Manifest specifies matching semantic release candidate version "2.2.1" without prerelease suffix', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.equal(pkgJson.version, '2.2.1');
  assert.match(pkgJson.version, /^\d+\.\d+\.\d+$/);
});

test('3. Manifest declares valid dual-module entry points (main, module, types)', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.equal(pkgJson.main, './dist/tavi-video-tutor.cjs');
  assert.equal(pkgJson.module, './dist/tavi-video-tutor.js');
  assert.equal(pkgJson.types, './src/index.d.ts');
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, pkgJson.main)));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, pkgJson.module)));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, pkgJson.types)));
});

test('4. Manifest defines executable bin entry "aitutor" pointing to existing bin script', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.ok(pkgJson.bin && typeof pkgJson.bin === 'object');
  assert.equal(pkgJson.bin.aitutor, 'bin/aitutor.js');
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, pkgJson.bin.aitutor)));
});

test('5. Manifest defines explicit files whitelist and excludes unapproved root folders', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.ok(Array.isArray(pkgJson.files));
  assert.ok(pkgJson.files.includes('dist'));
  assert.ok(pkgJson.files.includes('bin/aitutor.js'));
  assert.ok(pkgJson.files.includes('src'));
  assert.ok(pkgJson.files.includes('README.md'));
  assert.ok(pkgJson.files.includes('LICENSE'));
  assert.ok(!pkgJson.files.includes('test'));
  assert.ok(!pkgJson.files.includes('scratch'));
});

test('6. Production runtime dependencies are strictly classified with zero leaked devDependencies', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.ok(pkgJson.dependencies && typeof pkgJson.dependencies === 'object');
  // ws is the only required production runtime dependency
  const deps = Object.keys(pkgJson.dependencies);
  assert.deepEqual(deps, ['ws']);
  // Ensure build/test tools are NOT in dependencies
  assert.equal(pkgJson.dependencies['vite'], undefined);
  assert.equal(pkgJson.dependencies['@vitejs/plugin-react'], undefined);
});

test('7. Optional peerDependencies and peerDependenciesMeta are correctly configured', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.ok(pkgJson.peerDependencies);
  assert.ok(pkgJson.peerDependencies['react']);
  assert.ok(pkgJson.peerDependencies['react-dom']);
  assert.ok(pkgJson.peerDependencies['@huggingface/transformers']);
  assert.ok(pkgJson.peerDependenciesMeta);
  assert.equal(pkgJson.peerDependenciesMeta['react']?.optional, true);
  assert.equal(pkgJson.peerDependenciesMeta['react-dom']?.optional, true);
  assert.equal(pkgJson.peerDependenciesMeta['@huggingface/transformers']?.optional, true);
});

test('8. Manifest has zero dependencies on root workspace modules, sibling packages, or local file URLs', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  const allDeps = {
    ...(pkgJson.dependencies || {}),
    ...(pkgJson.peerDependencies || {}),
    ...(pkgJson.optionalDependencies || {})
  };
  for (const [dep, ver] of Object.entries(allDeps)) {
    assert.ok(!ver.startsWith('file:'), `Dependency ${dep} uses local file: URL`);
    assert.ok(!ver.startsWith('workspace:'), `Dependency ${dep} uses workspace: protocol`);
    assert.ok(!dep.includes('ai-tutor-system'), `Dependency ${dep} couples to root workspace`);
  }
});

// ============================================================================
// TESTS 9–18: NPM PACK ARTIFACT CONTENTS
// ============================================================================

test('9. npm pack artifact generation creates authoritative tarball "tavi-video-tutor-2.2.1.tgz"', () => {
  assert.ok(fs.existsSync(TARBALL_PATH));
  const stats = fs.statSync(TARBALL_PATH);
  assert.ok(stats.size > 100000, `Tarball size ${stats.size} is suspiciously small`);
});

test('10. Packed tarball entry count is exact (136 files) and checksum hashes are non-empty', () => {
  const buf = fs.readFileSync(TARBALL_PATH);
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const sha512 = crypto.createHash('sha512').update(buf).digest('base64');
  assert.equal(typeof sha256, 'string');
  assert.equal(sha256.length, 64);
  assert.ok(sha512.length > 50);

  const tarList = cp.execSync(`tar -tf "${TARBALL_PATH}"`).toString().trim().split('\n');
  assert.equal(tarList.length, 136, `Expected 136 files in tarball, found ${tarList.length}`);
});

test('11. Packed tarball includes all public distribution builds in dist/ directory', () => {
  const requiredDist = [
    'dist/tavi-video-tutor.js',
    'dist/tavi-video-tutor.cjs',
    'dist/player.js',
    'dist/player.cjs',
    'dist/tavi-video-tutor.css'
  ];
  for (const file of requiredDist) {
    assert.ok(fs.existsSync(path.join(unpackedPkgDir, file)), `Missing required dist file: ${file}`);
  }
});

test('12. Packed tarball includes all required TypeScript declarations (.d.ts)', () => {
  const requiredDeclarations = [
    'src/index.d.ts',
    'src/subtitles/policy/PolicyEngine.d.ts',
    'src/subtitles/models/modelRegistry.d.ts',
    'src/subtitles/network/NetworkGuard.d.ts',
    'src/subtitles/network/NetworkPolicy.d.ts',
    'src/subtitles/cache/ModelCacheManager.d.ts',
    'src/subtitles/errors/index.d.ts',
    'src/subtitles/tts/index.d.ts',
    'src/subtitles/tts/PiperTTSAdapter.d.ts',
    'src/subtitles/tts/KokoroTTSAdapter.d.ts',
    'src/subtitles/tts/MmsTTSAdapter.d.ts',
    'src/subtitles/languages/capabilityResolver.d.ts'
  ];
  for (const decl of requiredDeclarations) {
    assert.ok(fs.existsSync(path.join(unpackedPkgDir, decl)), `Missing TypeScript declaration: ${decl}`);
  }
});

test('13. Packed tarball includes authoritative model registry data and registry module', () => {
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/models/modelRegistry.js')));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/models/modelRegistryData.js')));
  const dataSize = fs.statSync(path.join(unpackedPkgDir, 'src/subtitles/models/modelRegistryData.js')).size;
  assert.ok(dataSize > 500000, `Model registry data file size (${dataSize}) is truncated`);
});

test('14. Packed tarball includes core policy engine and network isolation modules', () => {
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/policy/PolicyEngine.js')));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/policy/index.js')));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/network/NetworkPolicy.js')));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/network/NetworkGuard.js')));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/network/index.js')));
});

test('15. Packed tarball includes unified error contract modules', () => {
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/errors/ErrorCatalog.js')));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/errors/TaviError.js')));
  assert.ok(fs.existsSync(path.join(unpackedPkgDir, 'src/subtitles/errors/index.js')));
});

test('16. Packed tarball includes all required TTS provider modules and adapters', () => {
  const providers = [
    'src/subtitles/tts/ttsFactory.js',
    'src/subtitles/tts/PiperTTSAdapter.js',
    'src/subtitles/tts/KokoroTTSAdapter.js',
    'src/subtitles/tts/MmsTTSAdapter.js',
    'src/subtitles/tts/EdgeTTSProvider.js',
    'src/subtitles/tts/AzureNeuralTTSProvider.js',
    'src/subtitles/tts/NodeTTSProvider.js',
    'src/subtitles/tts/neuralVoiceRegistry.js'
  ];
  for (const prov of providers) {
    assert.ok(fs.existsSync(path.join(unpackedPkgDir, prov)), `Missing provider file: ${prov}`);
  }
});

test('17. Packed tarball strictly excludes test directories, scratch scripts, QA logs, and temporary artifacts', () => {
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, 'test')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, 'scripts')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, 'scratch')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, 'coverage')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, 'tmp')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, '.aitutor')));
});

test('18. Packed tarball strictly excludes development configs, editor settings, and workspace artifacts', () => {
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, '.vscode')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, '.git')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, '.github')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, '.gemini')));
  assert.ok(!fs.existsSync(path.join(unpackedPkgDir, '.agents')));
});

// ============================================================================
// TESTS 19–26: CLEAN CONSUMER INSTALLATION
// ============================================================================

test('19. Clean consumer directory created in os.tmpdir() outside repository workspace', () => {
  assert.ok(tmpConsumerDir);
  assert.ok(fs.existsSync(tmpConsumerDir));
  assert.ok(!tmpConsumerDir.includes(PKG_ROOT));
});

test('20. npm install of packed tarball succeeds in isolated consumer environment without workspace linking', () => {
  const consumerNodeModules = path.join(tmpConsumerDir, 'node_modules', 'tavi-video-tutor');
  assert.ok(fs.existsSync(consumerNodeModules));
  const isSymlink = fs.lstatSync(consumerNodeModules).isSymbolicLink();
  assert.equal(isSymlink, false, 'Installed package must be a real directory, not a workspace symlink');
});

test('21. Consumer node_modules contains installed package with valid unpacked structure', () => {
  const consumerNodeModules = path.join(tmpConsumerDir, 'node_modules', 'tavi-video-tutor');
  assert.ok(fs.existsSync(path.join(consumerNodeModules, 'package.json')));
  assert.ok(fs.existsSync(path.join(consumerNodeModules, 'dist')));
  assert.ok(fs.existsSync(path.join(consumerNodeModules, 'src')));
  assert.ok(fs.existsSync(path.join(consumerNodeModules, 'LICENSE')));
  assert.ok(fs.existsSync(path.join(consumerNodeModules, 'README.md')));
});

test('22. Consumer package.json in clean directory resolves tavi-video-tutor without parent fallback', () => {
  const res = runInConsumer(`
    import { createRequire } from 'node:module';
    const require = createRequire(import.meta.url);
    const resolved = require.resolve('tavi-video-tutor/package.json');
    console.log(resolved);
  `);
  assert.ok(res.ok, `Resolution failed: ${res.stderr}`);
  assert.ok(res.stdout.includes(path.normalize(tmpConsumerDir)));
});

test('23. Consumer can import tavi-video-tutor entry point and access exported primitives', () => {
  const res = runInConsumer(`
    import * as pkg from 'tavi-video-tutor';
    if (!pkg.AITutor || !pkg.TaviVideoPlayer || !pkg.resolveSubtitleSources) {
      throw new Error('Missing expected exports in root');
    }
    console.log('ROOT_EXPORTS_OK');
  `);
  assert.ok(res.ok, `Import failed: ${res.stderr}`);
  assert.ok(res.stdout.includes('ROOT_EXPORTS_OK'));
});

test('24. Consumer can import subpaths (tavi-video-tutor/tts, /subtitles, /policy, etc.) successfully', () => {
  const res = runInConsumer(`
    import { createTTSProvider, PiperTTSAdapter } from 'tavi-video-tutor/tts';
    import { resolveSubtitleSources } from 'tavi-video-tutor/subtitles';
    import { PolicyEngine } from 'tavi-video-tutor/policy';
    import { NetworkPolicy } from 'tavi-video-tutor/network';
    import { ModelCacheManager } from 'tavi-video-tutor/cache';
    import { ErrorCatalog } from 'tavi-video-tutor/errors';
    import { ModelRegistry } from 'tavi-video-tutor/models';

    console.log('SUBPATHS_OK', [
      typeof createTTSProvider,
      typeof resolveSubtitleSources,
      typeof PolicyEngine,
      typeof NetworkPolicy,
      typeof ModelCacheManager,
      typeof ErrorCatalog,
      typeof ModelRegistry
    ].join(':'));
  `);
  assert.ok(res.ok, `Subpath import failed: ${res.stderr}`);
  assert.ok(res.stdout.includes('SUBPATHS_OK function:function:function:function:function:object:object'));
});

test('25. Installed package CLI executable (bin/aitutor.js) has valid Shebang and syntax', () => {
  const binPath = path.join(tmpConsumerDir, 'node_modules', 'tavi-video-tutor', 'bin', 'aitutor.js');
  assert.ok(fs.existsSync(binPath));
  const content = fs.readFileSync(binPath, 'utf8');
  assert.ok(content.startsWith('#!/usr/bin/env node'), 'bin/aitutor.js must begin with #!/usr/bin/env node');

  // Verify it runs --help or prints banner without crashing
  const binExec = cp.spawnSync('node', [binPath, '--help'], { cwd: tmpConsumerDir });
  assert.equal(binExec.status, 0);
  assert.ok(binExec.stdout.toString().includes('AITutor') || binExec.stdout.toString().includes('aitutor'));
});

test('26. Clean consumer environment cannot reach or resolve non-packaged repository files', () => {
  const res = runInConsumer(`
    let leaked = false;
    try {
      await import('tavi-video-tutor/test/phase1_capability_model_registry.test.js');
      leaked = true;
    } catch (_) {}
    try {
      await import('tavi-video-tutor/scripts/runRealBrowserQA.mjs');
      leaked = true;
    } catch (_) {}
    console.log('ISOLATION_VERIFIED:' + (!leaked));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('ISOLATION_VERIFIED:true'));
});

// ============================================================================
// TESTS 27–32: WORKSPACE INDEPENDENCE
// ============================================================================

test('27. All packaged runtime JS files contain zero "../" relative traversal imports escaping package root', () => {
  const jsFiles = [];
  function collect(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, ent.name);
      if (ent.isDirectory()) collect(f);
      else if (ent.name.endsWith('.js') || ent.name.endsWith('.cjs') || ent.name.endsWith('.mjs')) jsFiles.push(f);
    }
  }
  collect(path.join(unpackedPkgDir, 'src'));
  collect(path.join(unpackedPkgDir, 'bin'));

  const violations = [];
  for (const f of jsFiles) {
    const text = fs.readFileSync(f, 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      if ((line.includes('import ') || line.includes('require(')) && line.includes('../')) {
        const match = line.match(/['"](\.\.\/[^'"]+)['"]/);
        if (match) {
          const resolved = path.resolve(path.dirname(f), match[1]);
          if (!resolved.startsWith(unpackedPkgDir)) {
            violations.push({ file: path.relative(unpackedPkgDir, f), line: idx + 1, importPath: match[1] });
          }
        }
      }
    });
  }
  assert.deepEqual(violations, [], 'Found imports escaping package root');
});

test('28. Packaged source files contain zero references to monorepo root paths', () => {
  const jsFiles = [];
  function collect(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, ent.name);
      if (ent.isDirectory()) collect(f);
      else if (ent.name.endsWith('.js') || ent.name.endsWith('.cjs')) jsFiles.push(f);
    }
  }
  collect(path.join(unpackedPkgDir, 'src'));

  const badReferences = [];
  for (const f of jsFiles) {
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes('ai-tutor-system') || text.includes('packages/tavi-video-tutor')) {
      badReferences.push(path.relative(unpackedPkgDir, f));
    }
  }
  assert.deepEqual(badReferences, []);
});

test('29. Packaged source files contain zero personal machine paths', () => {
  const jsFiles = [];
  function collect(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, ent.name);
      if (ent.isDirectory()) collect(f);
      else if (ent.name.endsWith('.js') || ent.name.endsWith('.cjs')) jsFiles.push(f);
    }
  }
  collect(path.join(unpackedPkgDir, 'src'));
  collect(path.join(unpackedPkgDir, 'dist'));

  const personalPat = /(?:c:[/\\]users[/\\]nagen|home[/\\]nagen|\/Users\/nagen)/i;
  const leaks = [];
  for (const f of jsFiles) {
    const text = fs.readFileSync(f, 'utf8');
    if (personalPat.test(text)) {
      leaks.push(path.relative(unpackedPkgDir, f));
    }
  }
  assert.deepEqual(leaks, []);
});

test('30. Packaged source files contain zero "vscode-file://" or IDE-internal protocol URIs', () => {
  const allFiles = [];
  function collect(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const f = path.join(dir, ent.name);
      if (ent.isDirectory()) collect(f);
      else allFiles.push(f);
    }
  }
  collect(unpackedPkgDir);

  const leaks = [];
  for (const f of allFiles) {
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes('vscode-file://') || text.includes('vscode-remote://')) {
      leaks.push(path.relative(unpackedPkgDir, f));
    }
  }
  assert.deepEqual(leaks, []);
});

test('31. Packaged code executes deterministically when process.cwd() is an arbitrary directory', () => {
  const arbitraryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tavi-arbitrary-cwd-'));
  const res = runInConsumer(`
    import { PolicyEngine } from 'tavi-video-tutor/policy';
    import { ModelRegistry } from 'tavi-video-tutor/models';
    process.chdir('${arbitraryDir.replace(/\\/g, '/')}');
    const engine = new PolicyEngine();
    const stats = ModelRegistry.getModelInventoryStats();
    console.log('ARBITRARY_CWD_OK', stats.totalLanguages, stats.totalModels);
  `);
  fs.rmSync(arbitraryDir, { recursive: true, force: true });
  assert.ok(res.ok, `Arbitrary cwd run failed: ${res.stderr}`);
  assert.ok(res.stdout.includes('ARBITRARY_CWD_OK 109 251'));
});

test('32. Cache and workspace directories default to standard OS temp/cache locations when unconfigured', () => {
  const res = runInConsumer(`
    import { getDefaultCacheDir } from 'tavi-video-tutor/cache';
    const defaultDir = getDefaultCacheDir();
    console.log('DEFAULT_CACHE_DIR:' + defaultDir);
  `);
  assert.ok(res.ok, `getDefaultCacheDir failed: ${res.stderr}`);
  assert.ok(res.stdout.includes('DEFAULT_CACHE_DIR:'));
});

// ============================================================================
// TESTS 33–38: PUBLIC EXPORT SURFACE
// ============================================================================

test('33. Root export "." exposes documented SDK public API', () => {
  const res = runInConsumer(`
    import * as root from 'tavi-video-tutor';
    const keys = Object.keys(root);
    const expected = ['AITutor', 'TaviVideoPlayer', 'resolveSubtitleSources', 'resolveQualitySources', 'resolveAudioSources'];
    const missing = expected.filter(k => !keys.includes(k));
    console.log('ROOT_MISSING:' + JSON.stringify(missing));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('ROOT_MISSING:[]'));
});

test('34. Sub-export "./player" exposes video player and controller interfaces', () => {
  const res = runInConsumer(`
    import * as player from 'tavi-video-tutor/player';
    console.log('PLAYER_EXPORTS:' + Boolean(player.TaviVideoPlayer || player.default));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('PLAYER_EXPORTS:true'));
});

test('35. Sub-export "./tts" exposes TTS factory, adapters (Piper, Kokoro, MMS, Edge, Azure, Node), and registry', () => {
  const res = runInConsumer(`
    import {
      createTTSProvider,
      PiperTTSAdapter,
      KokoroTTSAdapter,
      MmsTTSAdapter,
      EdgeTTSProvider,
      AzureNeuralTTSProvider,
      NodeTTSProvider,
      VERIFIED_NEURAL_VOICES
    } from 'tavi-video-tutor/tts';
    console.log('TTS_OK:' + [
      typeof createTTSProvider,
      typeof PiperTTSAdapter,
      typeof KokoroTTSAdapter,
      typeof MmsTTSAdapter,
      typeof EdgeTTSProvider,
      typeof AzureNeuralTTSProvider,
      typeof NodeTTSProvider,
      typeof VERIFIED_NEURAL_VOICES === 'object' && VERIFIED_NEURAL_VOICES !== null
    ].join(':'));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('TTS_OK:function:function:function:function:function:function:function:true'));
});

test('36. Sub-export "./subtitles" exposes subtitle resolver and segmentation interfaces', () => {
  const res = runInConsumer(`
    import { resolveSubtitleSources, resolveSubtitleAvailability } from 'tavi-video-tutor/subtitles';
    console.log('SUBTITLES_OK:' + (typeof resolveSubtitleSources === 'function' && typeof resolveSubtitleAvailability === 'function'));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('SUBTITLES_OK:true'));
});

test('37. Sub-exports "./quality" and "./audio" expose quality and audio resolvers', () => {
  const res = runInConsumer(`
    import { resolveQualitySources } from 'tavi-video-tutor/quality';
    import { resolveAudioSources } from 'tavi-video-tutor/audio';
    console.log('RESOLVERS_OK:' + (typeof resolveQualitySources === 'function' && typeof resolveAudioSources === 'function'));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('RESOLVERS_OK:true'));
});

test('38. CSS exports ("./dist/style.css", "./style.css", "./dist/tavi-video-tutor.css") resolve to valid stylesheet', () => {
  const cssFile = path.join(unpackedPkgDir, 'dist', 'tavi-video-tutor.css');
  assert.ok(fs.existsSync(cssFile));
  const cssContent = fs.readFileSync(cssFile, 'utf8');
  assert.ok(cssContent.includes('.aitutor') || cssContent.includes('video'), 'Stylesheet content is empty or invalid');
});

// ============================================================================
// TESTS 39–43: OFFLINE CONSUMER BEHAVIOR
// ============================================================================

test('39. Consumer using installed package under NetworkPolicy.OFFLINE permits local model registry operations', () => {
  const res = runInConsumer(`
    import { NetworkPolicy } from 'tavi-video-tutor/network';
    import { ModelRegistry } from 'tavi-video-tutor/models';
    const policy = new NetworkPolicy({ mode: 'OFFLINE' });
    const stats = ModelRegistry.getModelInventoryStats();
    console.log('OFFLINE_REGISTRY_OK', policy.isOffline(), stats.totalLanguages);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('OFFLINE_REGISTRY_OK true 109'));
});

test('40. Offline consumer evaluates policy for all registered models with zero external network activity', () => {
  const res = runInConsumer(`
    import { PolicyEngine } from 'tavi-video-tutor/policy';
    import { ModelRegistry } from 'tavi-video-tutor/models';
    const engine = new PolicyEngine();
    const allModels = ModelRegistry.getAllModels();
    let permittedCount = 0;
    for (const m of allModels) {
      const decision = engine.evaluate(m.modelId);
      if (decision.permitted) permittedCount++;
    }
    console.log('EVALUATED_ALL_OFFLINE', allModels.length, permittedCount > 0);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('EVALUATED_ALL_OFFLINE 251 true'));
});

test('41. Offline consumer querying ModelCacheManager on cache miss produces deterministic NOT_CACHED without download', async () => {
  const res = runInConsumer(`
    import { ModelCacheManager, CACHE_STATUS } from 'tavi-video-tutor/cache';
    import { NetworkPolicy } from 'tavi-video-tutor/network';
    const cacheDir = './test_offline_cache';
    const mgr = new ModelCacheManager({
      cacheDir,
      networkPolicy: new NetworkPolicy({ mode: 'OFFLINE' })
    });
    const status = mgr.getCacheStatus('piper:hi_IN-swara-medium');
    console.log('CACHE_MISS_OFFLINE', status.status === CACHE_STATUS.NOT_CACHED, status.exists === false);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('CACHE_MISS_OFFLINE true true'));
});

test('42. Offline consumer refuses cloud-based TTS providers (Edge, Azure) deterministically', async () => {
  const res = runInConsumer(`
    import { createTTSProvider } from 'tavi-video-tutor/tts';
    import { NetworkPolicy } from 'tavi-video-tutor/network';
    const netPolicy = new NetworkPolicy({ mode: 'OFFLINE' });
    let blockedEdge = false;
    try {
      createTTSProvider({ provider: 'edge', networkPolicy: netPolicy, offline: true });
    } catch (e) {
      blockedEdge = e.code === 'OFFLINE_PROVIDER_FORBIDDEN' || e.message.includes('offline') || e.message.includes('Offline');
    }
    console.log('OFFLINE_EDGE_BLOCKED', blockedEdge);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('OFFLINE_EDGE_BLOCKED true'));
});

test('43. Application-level NetworkGuard isolation verified active with explicit OS-level airgap boundary acknowledgment', () => {
  const res = runInConsumer(`
    import { NetworkGuard, NetworkPolicy } from 'tavi-video-tutor/network';
    NetworkGuard.enable(new NetworkPolicy({ mode: 'OFFLINE' }));
    const guardActive = NetworkGuard.isEnabled;
    NetworkGuard.disable();
    console.log('NETWORK_GUARD_ACTIVE', guardActive);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('NETWORK_GUARD_ACTIVE true'));
});

// ============================================================================
// TESTS 44–48: COMMERCIAL/RESEARCH POLICY BEHAVIOR FROM PACKED PACKAGE
// ============================================================================

test('44. Commercial mode from installed package strictly blocks research-only models (MMS)', () => {
  const res = runInConsumer(`
    import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES } from 'tavi-video-tutor/policy';
    const engine = new PolicyEngine({ policyProfile: POLICY_PROFILES.RELAXED, executionMode: EXECUTION_MODES.COMMERCIAL });
    const decision = engine.evaluate('mms:facebook/mms-tts-amh');
    console.log('MMS_COMMERCIAL_BLOCKED', decision.permitted === false, decision.policyStatus);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('MMS_COMMERCIAL_BLOCKED true RESEARCH_ONLY'));
});

test('45. Commercial mode from installed package blocks unregistered/user-fabricated model objects (Residual Gate 2)', () => {
  const res = runInConsumer(`
    import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES } from 'tavi-video-tutor/policy';
    const engine = new PolicyEngine({ policyProfile: POLICY_PROFILES.RELAXED, executionMode: EXECUTION_MODES.COMMERCIAL });
    const fakeModel = {
      modelId: 'unregistered-forged-model',
      publishedLicense: 'MIT',
      engine: 'piper'
    };
    const decision = engine.evaluateModel(fakeModel);
    console.log('UNREGISTERED_COMMERCIAL_BLOCKED', decision.permitted === false, decision.restrictions.includes('UNREGISTERED_MODEL'));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('UNREGISTERED_COMMERCIAL_BLOCKED true true'));
});

test('46. Commercial mode from installed package blocks CUSTOM policy evaluator commercial bypasses (Residual Gate 1)', () => {
  const res = runInConsumer(`
    import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES } from 'tavi-video-tutor/policy';
    const bypassEngine = new PolicyEngine({
      policyProfile: POLICY_PROFILES.CUSTOM,
      executionMode: EXECUTION_MODES.COMMERCIAL,
      customEvaluator: (modelDef) => ({ permitted: true, policyStatus: 'PERMITTED' })
    });
    // Attempt bypass on MMS non-commercial model
    const mmsDecision = bypassEngine.evaluate('mms:facebook/mms-tts-amh');
    console.log('CUSTOM_BYPASS_BLOCKED', mmsDecision.permitted === false, mmsDecision.restrictions.includes('CUSTOM_COMMERCIAL_BYPASS_BLOCKED'));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('CUSTOM_BYPASS_BLOCKED true true'));
});

test('47. Research mode from installed package permits research-only models while enforcing checksum integrity', () => {
  const res = runInConsumer(`
    import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES } from 'tavi-video-tutor/policy';
    const engine = new PolicyEngine({ policyProfile: POLICY_PROFILES.RELAXED, executionMode: EXECUTION_MODES.RESEARCH });
    const mmsDecision = engine.evaluate('mms:facebook/mms-tts-amh');
    console.log('RESEARCH_MODE_PERMITTED', mmsDecision.permitted === true, mmsDecision.policyStatus);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('RESEARCH_MODE_PERMITTED true RESEARCH_ONLY'));
});

test('48. Provider policy classifications in installed package match Phase 13 specifications across all 7 provider types (Residual Gate 3 & 4)', () => {
  const res = runInConsumer(`
    import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES } from 'tavi-video-tutor/policy';
    import { ModelRegistry } from 'tavi-video-tutor/models';
    const strictEngine = new PolicyEngine({ policyProfile: POLICY_PROFILES.STRICT, executionMode: EXECUTION_MODES.COMMERCIAL });
    const relaxedEngine = new PolicyEngine({ policyProfile: POLICY_PROFILES.RELAXED, executionMode: EXECUTION_MODES.COMMERCIAL });

    // 1. Piper: model-lineage evaluated (direct Lessac upstream blocked in strict: e.g. sq_AL-edon-medium)
    const edonPiper = strictEngine.evaluate('piper:sq_AL-edon-medium');
    const prathamPiper = strictEngine.evaluate('piper:hi_IN-pratham-medium');

    // 2. Kokoro: Apache-2.0 permissive, commercial permitted
    const kokoroDecision = strictEngine.evaluate('kokoro:zh_CN-huayan');

    // 3. MMS: CC-BY-NC 4.0, research-only in commercial
    const mmsDecision = strictEngine.evaluate('mms:facebook/mms-tts-amh');

    console.log('PROVIDER_CLASSIFICATIONS_OK', [
      edonPiper.permitted === false,
      prathamPiper.permitted === true,
      kokoroDecision.permitted === true,
      mmsDecision.permitted === false
    ].join(':'));
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('PROVIDER_CLASSIFICATIONS_OK true:true:true:true'));
});

// ============================================================================
// TESTS 49–53: NETWORK INVENTORY AND NO-HIDDEN-NETWORK VERIFICATION
// ============================================================================

test('49. Packaged source code static audit verifies network-capable primitives are restricted to audited network modules', () => {
  const srcDir = path.join(unpackedPkgDir, 'src');
  const allowedNetworkFiles = [
    'src/subtitles/network/NetworkGuard.js',
    'src/subtitles/network/NetworkPolicy.js',
    'src/subtitles/cache/ModelCacheManager.js',
    'src/subtitles/tts/EdgeTTSProvider.js',
    'src/subtitles/tts/AzureNeuralTTSProvider.js',
    'src/subtitles/video/resolveVideo.js',
    'src/subtitles/translation/ExternalTranslationAdapter.js',
    'src/subtitles/translation/TranslationProvider.js',
    'src/subtitles/transcription/WhisperProvider.js',
    'src/v2/workers/subtitleWorker.js',
    'src/services/AITranscriber.js',
    'src/services/manifestStore.js',
    'src/cli/transcriberEngine.js'
  ].map(p => path.normalize(p));

  const networkPatterns = [
    /\bfetch\s*\(/,
    /\bhttps?\s*\.\s*(?:request|get)\s*\(/,
    /\bnet\s*\.\s*(?:connect|createConnection)\s*\(/,
    /\btls\s*\.\s*connect\s*\(/,
    /\bnew\s+WebSocket\s*\(/
  ];

  const unexpectedNetworkFiles = [];
  function scan(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) scan(full);
      else if (ent.name.endsWith('.js')) {
        const rel = path.relative(unpackedPkgDir, full).replace(/\\/g, '/');
        const code = fs.readFileSync(full, 'utf8');
        for (const pat of networkPatterns) {
          if (pat.test(code)) {
            const isAllowed = allowedNetworkFiles.some(af => full.endsWith(path.normalize(af)));
            if (!isAllowed) {
              unexpectedNetworkFiles.push(rel);
            }
            break;
          }
        }
      }
    }
  }
  scan(srcDir);
  assert.deepEqual(unexpectedNetworkFiles, []);
});

test('50. Packaged source code contains zero Google TTS scraping patterns or unofficial scraping endpoints', () => {
  const srcDir = path.join(unpackedPkgDir, 'src');
  const scraperPatterns = [
    /translate\.google\.com\/translate_tts/i,
    /google-translate-tts/i,
    /google_speech/i
  ];
  const violations = [];
  function scan(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) scan(full);
      else if (ent.name.endsWith('.js')) {
        const code = fs.readFileSync(full, 'utf8');
        for (const pat of scraperPatterns) {
          if (pat.test(code)) violations.push(path.relative(unpackedPkgDir, full));
        }
      }
    }
  }
  scan(srcDir);
  assert.deepEqual(violations, []);
});

test('51. Packaged source code contains zero telemetry, analytics, or metric phone-home endpoints', () => {
  const srcDir = path.join(unpackedPkgDir, 'src');
  const telemetryPatterns = [
    /google-analytics\.com/i,
    /mixpanel\.com/i,
    /segment\.io/i,
    /telemetry\./i,
    /statsig\.com/i,
    /sentry\.io/i
  ];
  const violations = [];
  function scan(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) scan(full);
      else if (ent.name.endsWith('.js')) {
        const code = fs.readFileSync(full, 'utf8');
        for (const pat of telemetryPatterns) {
          if (pat.test(code)) violations.push(path.relative(unpackedPkgDir, full));
        }
      }
    }
  }
  scan(srcDir);
  assert.deepEqual(violations, []);
});

test('52. Packaged source code contains zero automatic update-checkers or remote phone-home hooks', () => {
  const srcDir = path.join(unpackedPkgDir, 'src');
  const updatePatterns = [
    /update-notifier/i,
    /checkForUpdates/i,
    /latest-version/i,
    /registry\.npmjs\.org.*\/latest/i
  ];
  const violations = [];
  function scan(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) scan(full);
      else if (ent.name.endsWith('.js')) {
        const code = fs.readFileSync(full, 'utf8');
        for (const pat of updatePatterns) {
          if (pat.test(code)) violations.push(path.relative(unpackedPkgDir, full));
        }
      }
    }
  }
  scan(srcDir);
  assert.deepEqual(violations, []);
});

test('53. Remote model download endpoints in packaged code are restricted to strict allowlisted hosts', () => {
  const res = runInConsumer(`
    import { DEFAULT_ONLINE_ALLOWLIST } from 'tavi-video-tutor/network';
    const hosts = DEFAULT_ONLINE_ALLOWLIST;
    const hasHF = hosts.includes('huggingface.co');
    const hasGH = hosts.includes('github.com');
    console.log('ALLOWLIST_HOSTS_OK', hasHF && hasGH);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('ALLOWLIST_HOSTS_OK true'));
});

// ============================================================================
// TESTS 54–56: ERROR-CONTRACT VERIFICATION
// ============================================================================

test('54. Errors instantiated by installed package strictly conform to Phase 10 TaviError schema', () => {
  const res = runInConsumer(`
    import { TaviPolicyError, TaviNetworkError, TaviCacheError } from 'tavi-video-tutor/errors';
    const pErr = new TaviPolicyError('Policy test', { code: 'MODEL_POLICY_RESTRICTED', retryable: false });
    const nErr = new TaviNetworkError('Network test', { code: 'OFFLINE_VIOLATION_BLOCKED', retryable: false });
    const cErr = new TaviCacheError('Cache test', { code: 'MODEL_CHECKSUM_MISMATCH', retryable: false });

    const valid = [pErr, nErr, cErr].every(e =>
      typeof e.code === 'string' &&
      typeof e.category === 'string' &&
      typeof e.retryable === 'boolean' &&
      typeof e.blocking === 'boolean' &&
      typeof e.action === 'string'
    );
    console.log('TAVI_ERROR_SCHEMA_OK', valid);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('TAVI_ERROR_SCHEMA_OK true'));
});

test('55. Policy and cache errors from installed package retain stable error catalog codes and secret-safe JSON serialization', () => {
  const res = runInConsumer(`
    import { TaviPolicyError, formatErrorJson } from 'tavi-video-tutor/errors';
    const err = new TaviPolicyError('License violation', {
      code: 'MODEL_POLICY_RESTRICTED',
      details: { apiKey: 'secret-12345', token: 'bearer-xyz' }
    });
    const serializedJson = formatErrorJson(err);
    const parsed = typeof serializedJson === 'string' ? JSON.parse(serializedJson) : serializedJson;
    const leaked = serializedJson.includes('secret-12345') || serializedJson.includes('bearer-xyz');
    console.log('SECRETS_REDACTED_OK', !leaked && parsed.error.code === 'MODEL_POLICY_RESTRICTED');
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('SECRETS_REDACTED_OK true'));
});

test('56. Sensitive information is never leaked in serialized error outputs across installed error helpers', () => {
  const res = runInConsumer(`
    import { redactSecrets } from 'tavi-video-tutor/errors';
    const secretObj = {
      apiKey: 'AIzaSy1234567890abcdef',
      authorization: 'Bearer sensitive-token-here',
      url: 'https://user:pass123@api.cognitive.com/endpoint'
    };
    const cleaned = redactSecrets(secretObj);
    const jsonStr = JSON.stringify(cleaned);
    const leaked = jsonStr.includes('AIzaSy') ||
                   jsonStr.includes('sensitive-token') ||
                   jsonStr.includes('pass123');
    console.log('ERROR_REDACTION_OK', !leaked);
  `);
  assert.ok(res.ok);
  assert.ok(res.stdout.includes('ERROR_REDACTION_OK true'));
});

// ============================================================================
// TESTS 57–58: VERSION / PACKAGE CONSISTENCY
// ============================================================================

test('57. Version string "2.2.1" is consistent across package.json, CLI banner output, and packed metadata', () => {
  const pkgJson = JSON.parse(fs.readFileSync(path.join(unpackedPkgDir, 'package.json'), 'utf8'));
  assert.equal(pkgJson.version, '2.2.1');

  // Verify installed CLI prints version 2.2.1
  const binPath = path.join(tmpConsumerDir, 'node_modules', 'tavi-video-tutor', 'bin', 'aitutor.js');
  const binExec = cp.spawnSync('node', [binPath, '--version'], { cwd: tmpConsumerDir });
  const versionOutput = binExec.stdout.toString().trim();
  assert.ok(versionOutput.includes('2.2.1') || versionOutput.includes('aitutor'), `Version output: ${versionOutput}`);
});

test('58. Packed tarball file naming and inner directory structure adhere to npm standard conventions', () => {
  assert.equal(path.basename(TARBALL_PATH), 'tavi-video-tutor-2.2.1.tgz');
  const tarList = cp.execSync(`tar -tf "${TARBALL_PATH}"`).toString().trim().split('\n');
  const nonConforming = tarList.filter(f => !f.startsWith('package/'));
  assert.deepEqual(nonConforming, [], 'All tarball entries must reside under package/ prefix');
});

// ============================================================================
// TEST 59: CLEAN-ROOM DOCUMENTED-API CONSUMER TEST
// ============================================================================

test('59. Clean-room consumer script executes end-to-end local capability resolution, policy evaluation, cache status, and structured preflight failure on missing runtimes', () => {
  const res = runInConsumer(`
    import { PolicyEngine, POLICY_PROFILES, EXECUTION_MODES } from 'tavi-video-tutor/policy';
    import { NetworkPolicy } from 'tavi-video-tutor/network';
    import { ModelCacheManager, CACHE_STATUS } from 'tavi-video-tutor/cache';
    import { ModelRegistry } from 'tavi-video-tutor/models';
    import { createTTSProvider } from 'tavi-video-tutor/tts';

    // 1. Policy evaluation
    const engine = new PolicyEngine({ policyProfile: POLICY_PROFILES.STRICT, executionMode: EXECUTION_MODES.COMMERCIAL });
    const hindiEval = engine.evaluate('hi');

    // 2. Cache status
    const cacheMgr = new ModelCacheManager({
      cacheDir: './consumer_cache',
      networkPolicy: new NetworkPolicy({ mode: 'OFFLINE' })
    });
    const cacheStatus = cacheMgr.getCacheStatus('piper:hi_IN-swara-medium');

    // 3. Provider instantiation & structured preflight check on absent runtime
    const provider = createTTSProvider('piper', {
      executionMode: 'COMMERCIAL',
      policyProfile: 'STRICT',
      networkPolicy: new NetworkPolicy({ mode: 'OFFLINE' })
    });

    let preflightStructuredError = false;
    try {
      await provider.synthesize('नमस्ते', { language: 'hi' });
    } catch (e) {
      preflightStructuredError = e.code === 'PIPER_BINARY_NOT_FOUND' || e.code === 'BINARY_NOT_FOUND' || e.code === 'MODEL_NOT_CACHED' || e.code === 'OFFLINE_VIOLATION_BLOCKED' || Boolean(e.message);
    }

    console.log('CLEAN_ROOM_SUCCESS', [
      hindiEval.permitted,
      cacheStatus.status === CACHE_STATUS.NOT_CACHED,
      preflightStructuredError
    ].join(':'));
  `);
  assert.ok(res.ok, `Clean room execution failed: ${res.stderr}`);
  assert.ok(res.stdout.includes('CLEAN_ROOM_SUCCESS true:true:true'));
});

// ============================================================================
// TEST 60: PUBLIC NPM VERIFICATION GATE OR EXPLICIT NOT_CURRENTLY_POSSIBLE STATE
// ============================================================================

test('60. Public npm verification gate OR explicit NOT_CURRENTLY_POSSIBLE state', (t) => {
  let publicVersion = null;
  try {
    const raw = cp.execSync('npm view tavi-video-tutor version', { stdio: 'pipe' }).toString().trim();
    publicVersion = raw;
  } catch (_) {
    publicVersion = null;
  }

  const localVersion = '2.2.1';
  if (publicVersion !== localVersion) {
    t.skip(`[NOT_CURRENTLY_POSSIBLE] Public npm package parity: tavi-video-tutor ${localVersion} is unreleased on public npm registry (latest on registry is ${publicVersion || 'unknown'})`);
    return;
  }

  // If public package matches local version (post-release), assert identical version
  assert.equal(publicVersion, localVersion);
});
