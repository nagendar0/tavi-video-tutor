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
      console.log('--> Auto-installing @huggingface/transformers for AITutor CLI generator runtime...');
      try {
        execSync('npm install --no-save @huggingface/transformers@^4.2.0', {
          stdio: 'inherit',
          cwd: process.cwd()
        });
        rawModule = await import('@huggingface/transformers');
      } catch (installErr) {
        throw new Error(
          `AITutor CLI Speech-to-Text requires '@huggingface/transformers'. ` +
          `Failed to auto-install: ${installErr.message}. ` +
          `Please install it manually with: npm install @huggingface/transformers`
        );
      }
    }
  }

  cachedTransformers = { pipeline: rawModule.pipeline, env: rawModule.env };
  return cachedTransformers;
}

export default getTransformers;

