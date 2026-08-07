/**
 * AITutor v2.0 Dedicated Web Worker for Off-Main-Thread WebVTT Parsing & Cue Search
 */

export const parseWebVTTWorker = (rawText) => {
  if (typeof rawText !== 'string' || !rawText.trim()) return [];

  const lines = rawText.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n');
  const cues = [];
  let currentCue = null;
  let isMetadataBlock = false;

  const parseTime = (timeStr) => {
    const match = String(timeStr)
      .trim()
      .replace(',', '.')
      .match(/^(?:(\d{2,}):)?(\d{2}):(\d{2}(?:\.\d{1,3})?)$/);

    if (!match) return null;

    const hours = Number(match[1] || 0);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    if (minutes >= 60 || seconds >= 60) return null;

    return hours * 3600 + minutes * 60 + seconds;
  };

  const commitCue = () => {
    if (!currentCue) return;
    currentCue.text = currentCue.text.trim();
    if (currentCue.text) cues.push(currentCue);
    currentCue = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      commitCue();
      isMetadataBlock = false;
      continue;
    }

    if (/^WEBVTT(?:[ \t].*)?$/i.test(line)) continue;

    if (/^(NOTE|STYLE|REGION)(?:[ \t].*)?$/i.test(line)) {
      commitCue();
      isMetadataBlock = true;
      continue;
    }
    if (isMetadataBlock) continue;

    const timingMatch = line.match(/^(\S+)\s+-->\s+(\S+)(?:\s+.*)?$/);
    if (timingMatch) {
      commitCue();
      const start = parseTime(timingMatch[1]);
      const end = parseTime(timingMatch[2]);

      if (start === null || end === null || end <= start) continue;

      currentCue = { id: '', start, end, text: '' };
      continue;
    }

    if (currentCue) {
      const cleanedLine = line.replace(/<[^>]+>/g, '').trim();
      if (cleanedLine) currentCue.text += (currentCue.text ? ' ' : '') + cleanedLine;
    }
  }

  commitCue();
  return cues
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((cue, index) => ({ ...cue, id: String(index) }));
};

export const findActiveCueBinary = (cues, time) => {
  if (!Array.isArray(cues) || cues.length === 0) return null;
  let low = 0;
  let high = cues.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const cue = cues[mid];
    if (time >= cue.start && time <= cue.end) {
      return cue;
    } else if (time < cue.start) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return null;
};

// Web Worker message listener when running inside worker thread
if (typeof self !== 'undefined' && typeof window === 'undefined') {
  self.onmessage = (e) => {
    const { action, payload, id } = e.data || {};
    if (action === 'parse') {
      const cues = parseWebVTTWorker(payload);
      self.postMessage({ id, cues });
    } else if (action === 'search') {
      const activeCue = findActiveCueBinary(payload.cues, payload.time);
      self.postMessage({ id, activeCue });
    }
  };
}
