import fs from 'fs';
import path from 'path';

// Let's dynamically load subtitles.js
const filePath = 'c:/Users/nagen/ai-tutor-system/examples/react-demo/src/subtitles.js';
const content = fs.readFileSync(filePath, 'utf-8');

// Use a simple VM-like or evaluation approach to extract the subtitles object
// Or since it's ES module, we can write a temporary file with .mjs extension to import it
const tempMjsPath = 'c:/Users/nagen/ai-tutor-system/.agents/reviewer_m1_1/temp_subtitles.mjs';
fs.writeFileSync(tempMjsPath, content);

try {
  const mod = await import('./temp_subtitles.mjs');
  const subtitles = mod.default;
  
  const keys = Object.keys(subtitles);
  console.log(`Total languages found: ${keys.length}`);
  
  let validCount = 0;
  let invalidCount = 0;
  const invalidLangs = [];
  
  for (const lang of keys) {
    const vtt = subtitles[lang];
    // Check if it's a valid WebVTT structure
    // A basic WebVTT file starts with "WEBVTT"
    const lines = vtt.trim().split('\n');
    if (lines[0] === 'WEBVTT') {
      validCount++;
    } else {
      invalidCount++;
      invalidLangs.push(lang);
    }
  }
  
  console.log(`Valid WebVTT count: ${validCount}`);
  console.log(`Invalid WebVTT count: ${invalidCount}`);
  if (invalidLangs.length > 0) {
    console.log(`Invalid languages: ${invalidLangs.join(', ')}`);
  }
} catch (err) {
  console.error('Error during verification:', err);
} finally {
  try {
    fs.unlinkSync(tempMjsPath);
  } catch (_) {}
}
