import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

let cachedTransformers = null;

/**
 * Robust Transformers loader for Node.js / CLI environments.
 * Attempts to load @huggingface/transformers or @xenova/transformers dynamically,
 * auto-installing on demand if running in CLI environment.
 */
export async function getTransformers() {
  if (cachedTransformers) {
    return cachedTransformers;
  }

  let rawModule = null;
  try {
    rawModule = await import('@huggingface/transformers');
  } catch (err1) {
    try {
      rawModule = await import('@xenova/transformers');
    } catch (err2) {
      throw new Error(
        `AITutor CLI Speech-to-Text requires '@huggingface/transformers'. ` +
        `Please install it with: npm install @huggingface/transformers ` +
        `or run "npx aitutor setup" to configure your environment automatically.`
      );
    }
  }

  cachedTransformers = { pipeline: rawModule.pipeline, env: rawModule.env };
  return cachedTransformers;
}

export default getTransformers;

