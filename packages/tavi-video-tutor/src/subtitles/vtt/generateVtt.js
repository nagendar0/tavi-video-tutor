export const secondsToVttTimestamp = (seconds) => {
  const totalSec = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const secs = Math.floor(totalSec % 60);
  const millis = Math.round((totalSec - Math.floor(totalSec)) * 1000);

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(millis % 1000).padStart(3, '0');

  return `${hh}:${mm}:${ss}.${mmm}`;
};

export const sanitizeCueText = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};

export const generateWebVTT = (segments) => {
  let vtt = 'WEBVTT\n\n';

  if (!Array.isArray(segments) || segments.length === 0) {
    return vtt;
  }

  const sorted = [...segments].sort((a, b) => (a.start || 0) - (b.start || 0));

  sorted.forEach((seg, index) => {
    const startTs = secondsToVttTimestamp(seg.start);
    const endTs = secondsToVttTimestamp(seg.end || (seg.start + 2.5));
    const cleanText = sanitizeCueText(seg.text);

    if (cleanText) {
      vtt += `${index + 1}\n${startTs} --> ${endTs}\n${cleanText}\n\n`;
    }
  });

  return vtt;
};
