import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createRequire } from 'module';

if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

let cachedTransformers = null;

export function getGlobalModelCacheDir() {
  if (process.env.AITUTOR_CACHE_DIR) {
    return process.env.AITUTOR_CACHE_DIR;
  }
  const home = os.homedir();
  return path.join(home, '.cache', 'aitutor', 'models');
}

export function clearTransformersCache() {
  cachedTransformers = null;
}

function resolveViaRequireOrPath(packageName, cwd = process.cwd()) {
  try {
    let req;
    try {
      req = createRequire(path.join(cwd, 'package.json'));
    } catch (_) {
      req = createRequire(path.join(cwd, 'index.js'));
    }
    return req.resolve(packageName);
  } catch (_) {}

  // Direct node_modules check
  const candidateDir = path.join(cwd, 'node_modules', ...packageName.split('/'));
  const pkgJsonPath = path.join(candidateDir, 'package.json');
  if (fs.existsSync(pkgJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      const entry = pkg.main || (pkg.exports && (pkg.exports['.']?.import || pkg.exports['.']?.require || pkg.exports['.'])) || 'index.js';
      const fullEntry = path.resolve(candidateDir, typeof entry === 'string' ? entry : 'index.js');
      if (fs.existsSync(fullEntry)) {
        return fullEntry;
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Robust Transformers loader for Node.js / CLI environments.
 * Attempts to load @huggingface/transformers or @xenova/transformers dynamically,
 * handling runtime-installed packages via filesystem resolution and cache-busted URLs.
 */
export async function getTransformers(options = {}) {
  if (cachedTransformers && !options.forceReload) {
    return cachedTransformers;
  }

  let rawModule = null;

  // Strategy 1: Standard dynamic import
  try {
    rawModule = await import('@huggingface/transformers');
  } catch (_) {}

  // Strategy 2: Dynamic import of xenova
  if (!rawModule) {
    try {
      rawModule = await import('@xenova/transformers');
    } catch (_) {}
  }

  // Strategy 3: Filesystem resolution from consumer cwd (bypasses Node ESM negative cache)
  if (!rawModule) {
    const cwd = options.cwd || process.cwd();
    const hfPath = resolveViaRequireOrPath('@huggingface/transformers', cwd);
    if (hfPath) {
      try {
        const fileUrl = pathToFileURL(hfPath).href + '?t=' + Date.now();
        rawModule = await import(fileUrl);
      } catch (_) {}
    }
  }

  if (!rawModule) {
    const cwd = options.cwd || process.cwd();
    const xenovaPath = resolveViaRequireOrPath('@xenova/transformers', cwd);
    if (xenovaPath) {
      try {
        const fileUrl = pathToFileURL(xenovaPath).href + '?t=' + Date.now();
        rawModule = await import(fileUrl);
      } catch (_) {}
    }
  }

  if (!rawModule || typeof rawModule.pipeline !== 'function') {
    throw new Error(
      `AITutor CLI Speech-to-Text requires '@huggingface/transformers'. ` +
      `Please install it with: npm install @huggingface/transformers ` +
      `or run "npx aitutor setup" to configure your environment automatically.`
    );
  }

  // Ensure persistent global model cache directory is configured
  if (rawModule.env) {
    const globalCacheDir = getGlobalModelCacheDir();
    try {
      if (!fs.existsSync(globalCacheDir)) {
        fs.mkdirSync(globalCacheDir, { recursive: true });
      }
      rawModule.env.cacheDir = globalCacheDir;
    } catch (_) {
      const fallbackDir = path.join(process.cwd(), '.aitutor', 'models');
      try {
        fs.mkdirSync(fallbackDir, { recursive: true });
        rawModule.env.cacheDir = fallbackDir;
      } catch (_) {}
    }
  }

  cachedTransformers = { pipeline: rawModule.pipeline, env: rawModule.env, rawModule };
  return cachedTransformers;
}

export default getTransformers;


