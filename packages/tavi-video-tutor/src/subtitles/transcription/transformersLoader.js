import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';

if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}

let cachedTransformers = null;

/**
 * Robust, zero-native-dependency Transformers loader.
 * Prioritizes pre-bundled Vite build artifact (dist/bundled-transformers.js) where sharp is statically aliased to zero-native JS stub and React is completely omitted.
 * Falls back to direct @xenova/transformers import during local dev/testing.
 */
export async function getTransformers() {
  if (cachedTransformers) {
    return cachedTransformers;
  }
  const rawModule = await import('@huggingface/transformers');
  cachedTransformers = { pipeline: rawModule.pipeline, env: rawModule.env };
  return cachedTransformers;
}

export default getTransformers;
