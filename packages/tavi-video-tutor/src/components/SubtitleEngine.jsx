import React from 'react';

// WebVTT timestamp parser: converts "00:01:23.450" into 83.45 seconds
export const parseWebVTT = (rawText) => {
  if (typeof rawText !== 'string' || !rawText.trim()) return [];

  // Normalize line endings, including a byte-order mark found in some exports.
  const lines = rawText.replace(/^\uFEFF/, '').replace(/\r/g, '').split('\n');
  const cues = [];
  let currentCue = null;
  let isMetadataBlock = false;

  const parseTime = (timeStr) => {
    // Supports WebVTT and SRT timestamps, but rejects malformed values.
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

    // NOTE, STYLE, and REGION blocks continue until a blank line.
    if (/^(NOTE|STYLE|REGION)(?:[ \t].*)?$/i.test(line)) {
      commitCue();
      isMetadataBlock = true;
      continue;
    }
    if (isMetadataBlock) continue;

    // Capture just the two timestamps, ignoring valid cue settings after the end time.
    const timingMatch = line.match(/^(\S+)\s+-->\s+(\S+)(?:\s+.*)?$/);
    if (timingMatch) {
      commitCue();
      const start = parseTime(timingMatch[1]);
      const end = parseTime(timingMatch[2]);

      // Invalid and zero/negative-duration cues cannot be rendered reliably.
      if (start === null || end === null || end <= start) continue;

      currentCue = { id: '', start, end, text: '' };
      continue;
    }

    if (currentCue) {
      // Strip simple WebVTT tags (e.g. <b>, <i>, <c.color>) before canvas rendering.
      const cleanedLine = line.replace(/<[^>]+>/g, '').trim();
      if (cleanedLine) currentCue.text += (currentCue.text ? ' ' : '') + cleanedLine;
    }
  }

  commitCue();
  return cues
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .map((cue, index) => ({ ...cue, id: String(index) }));
};

// Render active captions based on the currentTime clock
export const SubtitleRenderer = ({
  primaryCues = [],
  secondaryCues = [],
  currentTime,
  isDualEnabled = false,
  primaryLang = 'en',
  secondaryLang = 'hi'
}) => {
  const activePrimary = primaryCues.find(
    cue => currentTime >= cue.start && currentTime <= cue.end
  );

  const activeSecondary = isDualEnabled
    ? secondaryCues.find(cue => currentTime >= cue.start && currentTime <= cue.end)
    : null;

  if (!activePrimary && !activeSecondary) return null;

  // Render language specific direction layouts (e.g. right-to-left for Arabic)
  const isRTL = (lang) => ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ks'].includes(lang);

  return (
    <div className="tavi-subtitles-container">
      {activePrimary && (
        <div 
          className="subtitle-line primary" 
          dir={isRTL(primaryLang) ? 'rtl' : 'ltr'}
        >
          {activePrimary.text}
        </div>
      )}
      {activeSecondary && (
        <div 
          className="subtitle-line secondary" 
          dir={isRTL(secondaryLang) ? 'rtl' : 'ltr'}
        >
          {activeSecondary.text}
        </div>
      )}
    </div>
  );
};

export default SubtitleRenderer;
