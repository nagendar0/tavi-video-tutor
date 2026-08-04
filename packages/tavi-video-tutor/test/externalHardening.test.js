import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import { loadConfig } from '../src/subtitles/config/loadConfig.js';
import { getFFmpegBinaryPath } from '../src/subtitles/audio/extractAudio.js';
import { normalizeSubtitlePath } from '../src/subtitles/cache/manifest.js';
import { runInit } from '../src/cli/cli.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseTestDir = path.resolve(__dirname, '../.aitutor/test_hardening');

function getFreshTestDir(name) {
  const dir = path.join(baseTestDir, name);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ============================================================
// BUG 1 — CONFIG LOAD HARDENING TESTS
// ============================================================

test('Bug 1a. Missing config throws CONFIG_NOT_FOUND', async () => {
  const testDir = getFreshTestDir('missing_config');
  await assert.rejects(
    loadConfig(testDir),
    (err) => {
      assert.strictEqual(err.code, 'CONFIG_NOT_FOUND');
      return true;
    }
  );
  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Bug 1b. Valid .json configuration loads properly', async () => {
  const testDir = getFreshTestDir('json_valid');
  const configPath = path.join(testDir, 'aitutor.config.json');
  fs.writeFileSync(configPath, JSON.stringify({
    videos: [{ src: './public/test.mp4', id: 'json_test', languages: ['en'] }]
  }));

  const config = await loadConfig(testDir);
  assert.strictEqual(config.videos.length, 1);
  assert.strictEqual(config.videos[0].id, 'json_test');

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Bug 1c. Valid .mjs configuration loads properly', async () => {
  const testDir = getFreshTestDir('mjs_valid');
  const configPath = path.join(testDir, 'aitutor.config.mjs');
  fs.writeFileSync(configPath, `export default {
    videos: [{ src: './public/test.mp4', id: 'mjs_test', languages: ['en'] }]
  };`);

  const config = await loadConfig(testDir);
  assert.strictEqual(config.videos.length, 1);
  assert.strictEqual(config.videos[0].id, 'mjs_test');

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Bug 1d. Syntax error in .json throws CONFIG_PARSE_ERROR', async () => {
  const testDir = getFreshTestDir('json_syntax_err');
  const configPath = path.join(testDir, 'aitutor.config.json');
  fs.writeFileSync(configPath, `{ "videos": [ invalid_json ] }`);

  await assert.rejects(
    loadConfig(testDir),
    (err) => {
      assert.strictEqual(err.code, 'CONFIG_PARSE_ERROR');
      return true;
    }
  );

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Bug 1e. Syntax error in .mjs throws CONFIG_IMPORT_ERROR', async () => {
  const testDir = getFreshTestDir('mjs_syntax_err');
  const configPath = path.join(testDir, 'aitutor.config.mjs');
  fs.writeFileSync(configPath, `export default { videos: [ const invalid = ; ] };`);

  await assert.rejects(
    loadConfig(testDir),
    (err) => {
      assert.strictEqual(err.code, 'CONFIG_IMPORT_ERROR');
      return true;
    }
  );

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Bug 1f. Missing videos array throws CONFIG_INVALID_VIDEOS', async () => {
  const testDir = getFreshTestDir('missing_videos');
  const configPath = path.join(testDir, 'aitutor.config.json');
  fs.writeFileSync(configPath, JSON.stringify({ subtitles: { languages: ['en'] } }));

  await assert.rejects(
    loadConfig(testDir),
    (err) => {
      assert.strictEqual(err.code, 'CONFIG_INVALID_VIDEOS');
      return true;
    }
  );

  fs.rmSync(testDir, { recursive: true, force: true });
});

// ============================================================
// BUG 2 — CROSS-PLATFORM PATH & FFMPEG RESOLUTION
// ============================================================

test('Bug 2a. fileURLToPath handles spaces, Unicode, parentheses, and # in paths', () => {
  const specialPath = 'C:/My Documents/Course (2026) #1/äöü/extractAudio.js';
  const url = pathToFileURL(specialPath).href;
  const resolved = fileURLToPath(url);

  assert.strictEqual(path.normalize(resolved), path.normalize(specialPath));
});

test('Bug 2b. getFFmpegBinaryPath returns platform-appropriate binary name', () => {
  const binPath = getFFmpegBinaryPath();
  assert.ok(typeof binPath === 'string');
  assert.ok(binPath.length > 0);

  if (process.platform !== 'win32' && !binPath.startsWith('ffmpeg')) {
    assert.ok(!binPath.endsWith('.exe'), 'Executable on non-Windows platform should not end with .exe');
  }
});

// ============================================================
// BUG 3 — ZERO NATIVE DEPENDENCIES CHECK
// ============================================================

test('Bug 3. package.json contains zero optionalDependencies or sharp dependencies', () => {
  const pkgPath = path.resolve(__dirname, '../package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  assert.strictEqual(pkg.optionalDependencies, undefined, 'optionalDependencies should be removed');
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasSharp = Object.keys(allDeps).some(k => k.includes('sharp'));
  assert.strictEqual(hasSharp, false, 'sharp should not be in dependencies');
});

// ============================================================
// BUG 4 — SUBTITLE PATH NORMALIZATION & SECURITY
// ============================================================

test('Bug 4a. normalizeSubtitlePath resolves leading slashes and relative paths cleanly', () => {
  const basePublicDir = path.resolve('/app/public/aitutor');

  const path1 = normalizeSubtitlePath('/aitutor/subtitles/v1/en.vtt', basePublicDir);
  const path2 = normalizeSubtitlePath('aitutor/subtitles/v1/en.vtt', basePublicDir);
  const path3 = normalizeSubtitlePath('\\aitutor\\subtitles\\v1\\en.vtt', basePublicDir);
  const path4 = normalizeSubtitlePath('subtitles/v1/en.vtt', basePublicDir);

  assert.strictEqual(path.normalize(path1), path.resolve(basePublicDir, 'subtitles/v1/en.vtt'));
  assert.strictEqual(path.normalize(path2), path.resolve(basePublicDir, 'subtitles/v1/en.vtt'));
  assert.strictEqual(path.normalize(path3), path.resolve(basePublicDir, 'subtitles/v1/en.vtt'));
  assert.strictEqual(path.normalize(path4), path.resolve(basePublicDir, 'subtitles/v1/en.vtt'));
});

test('Bug 4b. normalizeSubtitlePath blocks directory traversal attempts (Security Violation)', () => {
  const basePublicDir = path.resolve('/app/public/aitutor');

  assert.throws(
    () => normalizeSubtitlePath('../../etc/passwd', basePublicDir),
    (err) => err.message.includes('Security Violation')
  );

  assert.throws(
    () => normalizeSubtitlePath('..\\..\\secret.txt', basePublicDir),
    (err) => err.message.includes('Security Violation')
  );
});

// ============================================================
// DEVELOPER EXPERIENCE — npx aitutor init
// ============================================================

test('Init 1. runInit creates starter aitutor.config.mjs and public directory', async () => {
  const testDir = getFreshTestDir('init_create');

  const res = await runInit({}, testDir);
  assert.strictEqual(res.created, true);
  assert.ok(fs.existsSync(path.join(testDir, 'aitutor.config.mjs')));
  assert.ok(fs.existsSync(path.join(testDir, 'public')));

  // Verify created config is valid
  const loaded = await loadConfig(testDir);
  assert.strictEqual(loaded.videos.length, 1);
  assert.strictEqual(loaded.videos[0].id, 'lesson_1');

  fs.rmSync(testDir, { recursive: true, force: true });
});

test('Init 2. runInit prevents overwriting existing config without --force', async () => {
  const testDir = getFreshTestDir('init_no_overwrite');
  fs.writeFileSync(path.join(testDir, 'aitutor.config.mjs'), '// Existing Config');

  const res1 = await runInit({ force: false }, testDir);
  assert.strictEqual(res1.created, false);

  const res2 = await runInit({ force: true }, testDir);
  assert.strictEqual(res2.created, true);

  fs.rmSync(testDir, { recursive: true, force: true });
});
