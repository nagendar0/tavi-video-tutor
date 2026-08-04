import fs from 'fs';
import path from 'path';

// Read generated VTT file to extract 10 representative cues across the video timeline
const vttPath = path.resolve('public/aitutor/subtitles/sample-local/en.vtt');
const vttContent = fs.readFileSync(vttPath, 'utf8');

const parseVttCues = (content) => {
  const blocks = content.split('\n\n');
  const cues = [];
  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 3 && lines[1].includes('-->')) {
      const times = lines[1].split('-->').map(t => t.trim());
      const parseSec = (str) => {
        const [h, m, s] = str.split(':');
        return Number(h) * 3600 + Number(m) * 60 + parseFloat(s);
      };
      cues.push({
        id: lines[0].trim(),
        start: parseSec(times[0]),
        end: parseSec(times[1]),
        startTimeStr: times[0],
        endTimeStr: times[1],
        text: lines.slice(2).join('\n')
      });
    }
  }
  return cues;
};

const allCues = parseVttCues(vttContent);

console.log('=== FRONTEND SUBTITLE QA DATA MATRIX ===');
console.log(`Parsed total VTT cues: ${allCues.length}`);

// Select 10 representative cues across timeline
const indices = [0, 2, 4, 6, 8, 11, 14, 17, 19, 22];
const sampledCues = indices.map(idx => allCues[idx]).filter(Boolean);

console.log('\n--- 10 SAMPLED CUES FOR FRONTEND AUDIO/VISUAL SYNC QA ---');
sampledCues.forEach((c, idx) => {
  const midPoint = (c.start + c.end) / 2;
  console.log(`[Cue ${idx + 1}] ID: ${c.id} | Range: ${c.startTimeStr} --> ${c.endTimeStr} | Test Seek: ${midPoint.toFixed(3)}s`);
  console.log(`         Text: "${c.text.replace(/\n/g, ' ')}"`);
});
