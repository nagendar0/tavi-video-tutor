/**
 * WebVTT Generator Utility for AITutor CLI
 */

export const formatVttTimestamp = (seconds) => {
  const sec = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

export const sanitizeCueText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};

export const generateWebVTT = (cues) => {
  let vtt = 'WEBVTT\n\n';

  if (!Array.isArray(cues) || cues.length === 0) {
    return vtt;
  }

  // Ensure cues are sorted chronologically by start timestamp
  const sortedCues = [...cues].sort((a, b) => (a.start || 0) - (b.start || 0));

  sortedCues.forEach((cue, index) => {
    const startStr = formatVttTimestamp(cue.start);
    const endStr = formatVttTimestamp(cue.end || (cue.start + 2.5));
    const cleanText = sanitizeCueText(cue.text);

    if (cleanText) {
      vtt += `${index + 1}\n${startStr} --> ${endStr}\n${cleanText}\n\n`;
    }
  });

  return vtt;
};
