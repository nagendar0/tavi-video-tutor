import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { parseWebVTT, SubtitleRenderer } from './SubtitleEngine.jsx';
import { useAudioDubSync } from './AudioDubSync.jsx';
import { useAudioController } from '../v2/hooks/useAudioController.js';
import { getCachedSubtitle, setCachedSubtitle } from '../services/SubtitleCache.js';
import { SubtitleEditorModal } from './SubtitleEditorModal.jsx';
import { resolveManifestSubtitle } from '../services/manifestStore.js';
import { resolveSubtitleSources, resolveSubtitleVisibility, resolveSubtitleAvailability } from '../subtitles/resolver/subtitleResolver.js';
import { resolveQualitySources, resolveQualityAvailability } from '../subtitles/resolver/qualityResolver.js';
import { resolveAudioAvailability, resolveActiveAudioTrack, normalizeAudioUrl } from '../subtitles/resolver/audioResolver.js';
import { getLanguageByCode } from '../subtitles/languages/registry.js';


const LANGUAGE_NAMES = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  fr: "French",
  de: "German",
  zh: "Chinese",
  ja: "Japanese",
  ru: "Russian",
  pt: "Portuguese",
  it: "Italian",
  ar: "Arabic",
  bn: "Bengali",
  pa: "Punjabi",
  te: "Telugu",
  mr: "Marathi",
  ta: "Tamil",
  ur: "Urdu",
  tr: "Turkish",
  vi: "Vietnamese",
  ko: "Korean",
  pl: "Polish",
  uk: "Ukrainian",
  ro: "Romanian",
  nl: "Dutch",
  el: "Greek",
  hu: "Hungarian",
  sv: "Swedish",
  cs: "Czech",
  ca: "Catalan",
  he: "Hebrew",
  id: "Indonesian",
  ms: "Malay",
  th: "Thai",
  sk: "Slovak",
  da: "Danish",
  fi: "Finnish",
  no: "Norwegian",
  hr: "Croatian",
  sr: "Serbian",
  lt: "Lithuanian",
  lv: "Latvian",
  et: "Estonian",
  sl: "Slovenian",
  bg: "Bulgarian",
  mk: "Macedonian",
  sq: "Albanian",
  ka: "Georgian",
  hy: "Armenian",
  az: "Azerbaijani",
  fa: "Persian",
  am: "Amharic",
  so: "Somali",
  sw: "Swahili",
  zu: "Zulu",
  xh: "Xhosa",
  ig: "Igbo",
  om: "Oromo",
  tl: "Tagalog",
  my: "Burmese",
  km: "Khmer",
  lo: "Lao",
  si: "Sinhala",
  ne: "Nepali",
  mn: "Mongolian",
  kk: "Kazakh",
  ky: "Kyrgyz",
  tg: "Tajik",
  tk: "Turkmen",
  uz: "Uzbek",
  eu: "Basque",
  gl: "Galician",
  ga: "Irish",
  cy: "Welsh",
  is: "Icelandic",
  kl: "Greenlandic",
  mi: "Maori",
  haw: "Hawaiian",
  sm: "Samoan",
  to: "Tongan",
  fj: "Fijian",
  ch: "Chamorro",
  af: "Afrikaans",
  as: "Assamese",
  be: "Belarusian",
  bho: "Bhojpuri",
  bi: "Bislama",
  yue: "Cantonese",
  ceb: "Cebuano",
  doi: "Dogri",
  rw: "Kinyarwanda",
  kok: "Konkani",
  ku: "Kurdish",
  lb: "Luxembourgish",
  mai: "Maithili",
  mg: "Malagasy",
  ml: "Malayalam",
  mt: "Maltese",
  mni: "Manipuri",
  or: "Odia",
  ps: "Pashto",
  sa: "Sanskrit",
  sat: "Santali",
  sd: "Sindhi",
  su: "Sundanese",
  gu: "Gujarati",
  ha: "Hausa",
  jv: "Javanese",
  kn: "Kannada",
  ks: "Kashmiri",
};

const isRTL = (lang) => ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ks'].includes(lang);

const findActiveCue = (cues, time) => {
  if (!cues || cues.length === 0) return null;
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

const wrapText = (ctx, text, maxWidth) => {
  if (!text) return [];
  const isCJK = (char) => /[\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u4E00-\u9FFF\u3400-\u4DBF]/.test(char);
  
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const char = text[i];
    if (isCJK(char)) {
      tokens.push(char);
      i++;
    } else if (char === ' ') {
      tokens.push(' ');
      i++;
    } else {
      let word = '';
      while (i < text.length && !isCJK(text[i]) && text[i] !== ' ') {
        word += text[i];
        i++;
      }
      tokens.push(word);
    }
  }

  const lines = [];
  let currentLine = '';

  for (let j = 0; j < tokens.length; j++) {
    const token = tokens[j];
    if (token === ' ') {
      continue;
    }

    let testLine = currentLine;
    if (currentLine) {
      const lastChar = currentLine[currentLine.length - 1];
      const firstChar = token[0];
      if (isCJK(lastChar) || isCJK(firstChar)) {
        testLine += token;
      } else {
        testLine += ' ' + token;
      }
    } else {
      testLine = token;
    }

    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = token;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // YouTube captions max 2 lines per cue block to prevent obscuring the video screen
  if (lines.length > 2) {
    return lines.slice(0, 2);
  }

  return lines;
};

const DEFAULT_FONT_STACK = 'system-ui, -apple-system, BlinkMacSystemFont, "Nirmala UI", "Segoe UI", Roboto, "Noto Sans Telugu", "Noto Sans Devanagari", "Noto Sans Tamil", "Noto Sans Kannada", "Noto Sans Malayalam", "Noto Sans Arabic", "Noto Sans CJK SC", "Noto Sans JP", "Noto Sans KR", "Helvetica Neue", Arial, sans-serif';

const drawSubtitleLine = (ctx, text, x, y, fontSize, styleOpts = {}) => {
  const {
    textColor = '#ffffff',
    backgroundColor = 'rgba(12, 12, 14, 0.88)',
    borderRadius,
    paddingX,
    paddingY,
    shadowBlur,
    shadowColor = 'rgba(0, 0, 0, 0.75)'
  } = styleOpts;

  const hPadding = paddingX !== undefined ? paddingX : fontSize * 0.45;
  const vPadding = paddingY !== undefined ? paddingY : fontSize * 0.28;
  const metrics = ctx.measureText(text);
  const boxWidth = metrics.width + (hPadding * 2);
  const boxHeight = fontSize * 1.25 + (vPadding * 2);
  const boxX = x - (metrics.width / 2) - hPadding;
  const boxY = y - (fontSize * 1.25 / 2) - vPadding;
  const radius = borderRadius !== undefined ? borderRadius : Math.max(4, fontSize * 0.16);

  ctx.save();

  // 1. High-contrast solid dark pill background
  ctx.fillStyle = backgroundColor;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    ctx.fill();
  } else {
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  }

  // 2. Smooth drop-shadow for separation over bright video
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur !== undefined ? shadowBlur : Math.max(2, fontSize * 0.12);
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = Math.max(1, fontSize * 0.04);

  // Micro-stroke outline for sharp contrast over bright backgrounds (without heavy doubled edges)
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.lineWidth = Math.max(0.5, fontSize * 0.035);
  ctx.strokeText(text, x, y);

  // 3. Crisp white/yellow main text fill
  ctx.fillStyle = textColor;
  ctx.fillText(text, x, y);

  ctx.restore();
};

const drawCanvasSubtitles = (
  ctx,
  canvasWidth,
  canvasHeight,
  activePrimaryText,
  activeSecondaryText,
  primaryLang,
  secondaryLang,
  areControlsVisible,
  subtitleStyle = {}
) => {
  if (!activePrimaryText && !activeSecondaryText) return;

  const canvas = ctx.canvas;
  const displayHeight = (canvas && canvas.clientHeight) ? canvas.clientHeight : (canvasHeight / 2);
  const scale = (canvas && canvas.clientHeight && canvas.height) ? (canvas.height / canvas.clientHeight) : 1;

  // Viewport-proportional font sizing (~3.4% of display height), bounded between 12px and 64px
  const userFontSize = subtitleStyle?.fontSize;
  const cssFontSize = userFontSize 
    ? userFontSize 
    : Math.max(12, Math.min(64, Math.round(displayHeight * 0.034)));
  const baseFontSize = cssFontSize * scale;
  const maxWidth = canvasWidth * 0.76;

  const visibleControlsHeight = areControlsVisible ? (46 * scale) : (8 * scale);
  const defaultBottomMargin = Math.max(canvasHeight * 0.05, visibleControlsHeight + (10 * scale));
  const bottomMargin = subtitleStyle?.bottomOffset !== undefined
    ? Math.max(8 * scale, subtitleStyle.bottomOffset * scale)
    : defaultBottomMargin;

  const gap = baseFontSize * 0.38;
  const fontFamily = subtitleStyle?.fontFamily || DEFAULT_FONT_STACK;
  const fontWeight = subtitleStyle?.fontWeight !== undefined ? subtitleStyle.fontWeight : 600;
  const fontSpec = `${fontWeight} ${baseFontSize}px ${fontFamily}`;
  const lineHeightMultiplier = subtitleStyle?.lineHeight || 1.45;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Extract color & opacity overrides
  const primaryTextColor = subtitleStyle?.color || '#ffffff';
  let primaryBgColor = subtitleStyle?.backgroundColor;
  if (!primaryBgColor && subtitleStyle?.backgroundOpacity !== undefined) {
    primaryBgColor = `rgba(12, 12, 14, ${subtitleStyle.backgroundOpacity})`;
  }

  const primaryStyleOpts = {
    textColor: primaryTextColor,
    backgroundColor: primaryBgColor || 'rgba(12, 12, 14, 0.88)',
    borderRadius: subtitleStyle?.borderRadius !== undefined ? subtitleStyle.borderRadius * scale : undefined,
    paddingX: subtitleStyle?.paddingX !== undefined ? subtitleStyle.paddingX * scale : undefined,
    paddingY: subtitleStyle?.paddingY !== undefined ? subtitleStyle.paddingY * scale : undefined,
    shadowBlur: subtitleStyle?.shadowBlur !== undefined ? subtitleStyle.shadowBlur * scale : undefined,
    shadowColor: subtitleStyle?.shadowColor
  };

  // 1. Process and wrap primary text
  let primaryLines = [];
  let primaryLineHeight = baseFontSize * lineHeightMultiplier;
  if (activePrimaryText) {
    ctx.font = fontSpec;
    ctx.direction = isRTL(primaryLang) ? 'rtl' : 'ltr';
    primaryLines = wrapText(ctx, activePrimaryText, maxWidth);
  }
  const primaryTotalHeight = primaryLines.length * primaryLineHeight;

  // 2. Process and wrap secondary text
  let secondaryLines = [];
  const secondaryFontSize = Math.round(baseFontSize * 0.88);
  let secondaryLineHeight = secondaryFontSize * lineHeightMultiplier;
  const secondaryStyleOpts = {
    ...primaryStyleOpts,
    textColor: '#ffd600'
  };

  if (activeSecondaryText) {
    ctx.font = `${fontWeight} ${secondaryFontSize}px ${fontFamily}`;
    ctx.direction = isRTL(secondaryLang) ? 'rtl' : 'ltr';
    secondaryLines = wrapText(ctx, activeSecondaryText, maxWidth);
  }
  const secondaryTotalHeight = secondaryLines.length * secondaryLineHeight;

  // 3. Draw Primary lines (Bottom)
  if (primaryLines.length > 0) {
    ctx.font = fontSpec;
    ctx.direction = isRTL(primaryLang) ? 'rtl' : 'ltr';
    const primaryStartY = canvasHeight - bottomMargin - primaryTotalHeight + (primaryLineHeight / 2);
    
    primaryLines.forEach((line, index) => {
      const lineY = primaryStartY + (index * primaryLineHeight);
      drawSubtitleLine(ctx, line, canvasWidth / 2, lineY, baseFontSize, primaryStyleOpts);
    });
  }

  // 4. Draw Secondary lines (Stacked above Primary)
  if (secondaryLines.length > 0) {
    ctx.font = `${fontWeight} ${secondaryFontSize}px ${fontFamily}`;
    ctx.direction = isRTL(secondaryLang) ? 'rtl' : 'ltr';
    
    const secondaryBottomBoundary = activePrimaryText 
      ? (canvasHeight - bottomMargin - primaryTotalHeight - gap)
      : (canvasHeight - bottomMargin);

    const secondaryStartY = secondaryBottomBoundary - secondaryTotalHeight + (secondaryLineHeight / 2);

    secondaryLines.forEach((line, index) => {
      const lineY = secondaryStartY + (index * secondaryLineHeight);
      drawSubtitleLine(ctx, line, canvasWidth / 2, lineY, secondaryFontSize, secondaryStyleOpts);
    });
  }

  ctx.restore();
};

// Canvas transcription overlay utility
const drawTranscriptionOverlay = (ctx, canvasWidth, canvasHeight, statusText, progressPercent) => {
  ctx.save();
  
  const pillWidth = 240;
  const pillHeight = 36;
  const padding = 12;
  const x = canvasWidth - pillWidth - padding;
  const y = padding;
  
  // Draw glassmorphic pill background (Slate-900 with high opacity)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, pillWidth, pillHeight, 6);
  } else {
    // Fallback for older browsers
    ctx.rect(x, y, pillWidth, pillHeight);
  }
  ctx.fill();
  ctx.stroke();
  
  // Draw a pulse/loading indicator dot on the left of the pill
  const dotX = x + 16;
  const dotY = y + pillHeight / 2;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#818cf8'; // Indigo-400
  ctx.fill();
  
  // Draw the status text
  ctx.font = '500 11px sans-serif';
  ctx.fillStyle = '#f1f5f9';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let displayTxt = statusText;
  if (displayTxt.length > 28) {
    displayTxt = displayTxt.substring(0, 25) + '...';
  }
  ctx.fillText(displayTxt, x + 28, y + pillHeight / 2);
  
  // Draw progress line at the bottom edge of the pill
  const loaderY = y + pillHeight - 2;
  ctx.beginPath();
  ctx.moveTo(x + 6, loaderY);
  ctx.lineTo(x + pillWidth - 6, loaderY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  if (progressPercent > 0) {
    ctx.beginPath();
    ctx.moveTo(x + 6, loaderY);
    ctx.lineTo(x + 6 + (pillWidth - 12) * (Math.min(100, progressPercent) / 100), loaderY);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  ctx.restore();
};

// Inline SVGs for zero dependencies
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const VolumeHighIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const VolumeMuteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </svg>
);

const GearIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: '#818cf8', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const UploadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', color: '#818cf8', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CCIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M8 10h3M8 14h4M14 10h2M14 14h2" />
  </svg>
);

const FullscreenEnterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const FullscreenExitIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14h4v4m0-4l-5 5m17-5h-4v4m0-4l5 5M4 10h4V6m0 4L3 5m17 5h-4V6m0 4l5-5" />
  </svg>
);

const AutoplayIcon = ({ active }) => (
  <svg width="36" height="20" viewBox="0 0 36 20" fill="none" style={{ cursor: 'pointer', display: 'block' }}>
    <rect width="36" height="20" rx="10" fill={active ? "#818cf8" : "rgba(255, 255, 255, 0.24)"} style={{ transition: 'fill 0.2s' }} />
    <circle cx={active ? 26 : 10} cy="10" r="7" fill="#ffffff" style={{ transition: 'cx 0.2s' }} />
    <polygon points={active ? "25,8 25,12 28,10" : "9,8 9,12 12,10"} fill={active ? "#818cf8" : "#9ca3af"} style={{ transition: 'fill 0.2s' }} />
  </svg>
);

const PlayIconLarge = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIconLarge = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

// Module-level cache and in-flight request deduplication for React StrictMode & cross-instance resilience
const GLOBAL_SUBTITLE_CACHE = new Map();
const GLOBAL_IN_FLIGHT_SUBTITLES = new Map();

export const TaviVideoPlayer = forwardRef(({
  src,
  id,
  subtitles = {},
  audioLanguages,
  manifestSubtitles: manifestSubtitlesProp,
  manifestQualities: manifestQualitiesProp = [],
  manifestAudioLanguages: manifestAudioLanguagesProp = {},
  manifestSourceLanguage: manifestSourceLanguageProp,
  sourceLanguage: sourceLanguageProp,
  demoSubtitles: demoSubtitlesProp,
  resolvedSubtitles: resolvedSubtitlesProp,
  resolvedAudioTracks = {},
  subtitleAvailability: subtitleAvailabilityProp,
  audioAvailability,
  qualityAvailability: qualityAvailabilityProp,
  tracks,
  config,
  audioDubs = {},
  qualities,
  onPlay,
  onPause,
  onEnded,
  onProgress,
  subLanguage,
  defaultSubLanguage = 'en',
  playbackRates = [0.5, 1, 1.25, 1.5, 2],
  subtitleStyle,
  autoTranscribe = false,
  onSubLanguageChange,
  onAudioLanguageChange,
  onQualityChange,
  onSubtitleGenerated,
  onUpdateSubtitles,
  onTracksChange
}, ref) => {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const progressBarRef = useRef(null);
  const offscreenVideoRef = useRef(null);
  const subtitleStyleRef = useRef(subtitleStyle);
  subtitleStyleRef.current = subtitleStyle;
  const pendingSeekTimeRef = useRef(null);
  const pendingPlayStateRef = useRef(null);
  const pendingVolumeRef = useRef(null);
  const pendingMutedRef = useRef(null);
  const pendingPlaybackRateRef = useRef(null);
  const isDraggingRef = useRef(false);
  const clickTimeoutRef = useRef(null);

  // Helper functions for LocalStorage Student Preference Persistence
  const loadSavedPref = (key, fallback) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('aitutor_user_preferences');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed[key] !== undefined) return parsed[key];
        }
      }
    } catch (_) {}
    return fallback;
  };

  const savePref = (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('aitutor_user_preferences');
        const current = raw ? JSON.parse(raw) : {};
        current[key] = value;
        localStorage.setItem('aitutor_user_preferences', JSON.stringify(current));
      }
    } catch (_) {}
  };

  const effectiveSourceLang = sourceLanguageProp || manifestSourceLanguageProp || audioAvailability?.sourceLanguage || 'en';

  // Playback Control States (Restored from LocalStorage when available)
  const [activeSrc, setActiveSrc] = useState(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => loadSavedPref('volume', 1));
  const [isMuted, setIsMuted] = useState(() => loadSavedPref('isMuted', false));
  const [playbackRate, setPlaybackRate] = useState(() => loadSavedPref('playbackRate', 1));
  const [hoverTooltip, setHoverTooltip] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const areControlsVisibleRef = useRef(areControlsVisible);
  useEffect(() => {
    areControlsVisibleRef.current = areControlsVisible;
  }, [areControlsVisible]);

  const [isMouseOverPlayer, setIsMouseOverPlayer] = useState(false);

  // Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState('main');
  const [selectedSubLanguage, setSelectedSubLanguage] = useState(defaultSubLanguage);
  const [selectedAudioLanguage, setSelectedAudioLanguage] = useState(() => {
    const saved = loadSavedPref('selectedAudioLanguage', null);
    if (saved) return saved;
    return 'original';
  });
  const [isDualSubtitles, setIsDualSubtitles] = useState(false);
  const [embeddedTracks, setEmbeddedTracks] = useState([]);
  const originalTrackRef = useRef(null);
  const [isTranscribingAI, setIsTranscribingAI] = useState(false);
  const [aiTranscriptionProgress, setAiTranscriptionProgress] = useState(0);
  const [aiTranscriptionStatusText, setAiTranscriptionStatusText] = useState('');
  const [subtitlesSearchQuery, setSubtitlesSearchQuery] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const lastActiveSubLangRef = useRef(defaultSubLanguage && defaultSubLanguage !== 'none' ? defaultSubLanguage : 'en');

  useEffect(() => {
    if (selectedSubLanguage && selectedSubLanguage !== 'none') {
      lastActiveSubLangRef.current = selectedSubLanguage;
    }
  }, [selectedSubLanguage]);

  // Local state for user-uploaded subtitle files
  const [localSubtitles, setLocalSubtitles] = useState({});
  const [internalManifestSubtitles, setInternalManifestSubtitles] = useState({});
  const [internalManifestQualities, setInternalManifestQualities] = useState([]);
  const fileInputRef = useRef(null);

  // Manifest subtitles auto-loaded from build-time aitutor pipeline
  const playerManifestSeqRef = useRef(0);
  const lastLoadedSrcRef = useRef(null);

  useEffect(() => {
    if (lastLoadedSrcRef.current !== src) {
      lastLoadedSrcRef.current = src;
      setActiveSrc(src);
      setPrimaryCues(prev => (prev.length === 0 ? prev : []));
      setSecondaryCues(prev => (prev.length === 0 ? prev : []));
      originalTrackRef.current = null;
    }

    if (!src) return;

    // If manifestSubtitlesProp was passed by parent component (<AITutor />), skip duplicate fetching
    if (manifestSubtitlesProp !== undefined) return;

    const currentSeq = ++playerManifestSeqRef.current;
    setInternalManifestSubtitles(prev => (Object.keys(prev).length === 0 ? prev : {}));
    setInternalManifestQualities(prev => (prev.length === 0 ? prev : []));

    let isMounted = true;
    const loadManifest = async () => {
      try {
        const matched = await resolveManifestSubtitle(src, id);
        if (!isMounted || playerManifestSeqRef.current !== currentSeq) return;

        if (matched) {
          if (Array.isArray(matched.qualities) && matched.qualities.length > 0) {
            setInternalManifestQualities(prev => {
              if (prev.length === matched.qualities.length && prev.every((q, i) => q === matched.qualities[i])) return prev;
              return matched.qualities;
            });
          }

          if (matched.subtitles && Object.keys(matched.subtitles).length > 0) {
            const map = {};
            Object.entries(matched.subtitles).forEach(([lang, info]) => {
              const subSrc = typeof info === 'string' ? info : (info && info.src);
              if (subSrc) {
                map[lang] = subSrc;
              }
            });
            if (isMounted && playerManifestSeqRef.current === currentSeq && Object.keys(map).length > 0) {
              setInternalManifestSubtitles(prev => {
                const pKeys = Object.keys(prev);
                const mKeys = Object.keys(map);
                if (pKeys.length === mKeys.length && pKeys.every(k => prev[k] === map[k])) return prev;
                return map;
              });
            }
          } else if (matched.subtitle) {
            if (isMounted && playerManifestSeqRef.current === currentSeq) {
              const singleSub = { [matched.language || 'en']: matched.subtitle };
              setInternalManifestSubtitles(prev => {
                const pKeys = Object.keys(prev);
                const mKeys = Object.keys(singleSub);
                if (pKeys.length === mKeys.length && pKeys.every(k => prev[k] === singleSub[k])) return prev;
                return singleSub;
              });
            }
          }
        }
      } catch (_) {}
    };
    loadManifest();
    return () => { isMounted = false; };
  }, [src, id, manifestSubtitlesProp]);

  const effectiveManifestSubtitles = useMemo(() => {
    if (manifestSubtitlesProp !== undefined && manifestSubtitlesProp !== null) {
      return manifestSubtitlesProp;
    }
    return internalManifestSubtitles || {};
  }, [internalManifestSubtitles, manifestSubtitlesProp]);

  const effectiveManifestQualities = useMemo(() => {
    if (manifestQualitiesProp && manifestQualitiesProp.length > 0) {
      return manifestQualitiesProp;
    }
    return internalManifestQualities || [];
  }, [internalManifestQualities, manifestQualitiesProp]);

  // SINGLE SOURCE OF TRUTH: Subtitle Availability & Visibility
  const subtitleAvailability = useMemo(() => {
    if (subtitleAvailabilityProp) return subtitleAvailabilityProp;
    return resolveSubtitleAvailability({
      subtitlesConfig: subtitles,
      demoSubtitles: demoSubtitlesProp,
      generatedSubtitles: effectiveManifestSubtitles,
      uploadedSubtitles: localSubtitles,
      embeddedTracks,
      videoKey: id || src || 'default'
    });
  }, [subtitleAvailabilityProp, subtitles, demoSubtitlesProp, effectiveManifestSubtitles, localSubtitles, embeddedTracks, id, src]);

  const hasAvailableSubtitles = subtitleAvailability.hasAvailableSubtitles;
  const isSubtitleEnabled = subtitleAvailability.enabled;
  const combinedSubtitles = subtitleAvailability.resolvedTracks;
  const subtitlesSourceMetadata = subtitleAvailability.sourceByLanguage;
  const visibleSubLanguages = subtitleAvailability.visibleLanguages;
  const availableSubLangs = subtitleAvailability.availableLanguages;

  // Process tracks prop or config.file.tracks if supplied by developer
  const effectiveTracks = useMemo(() => {
    if (Array.isArray(tracks) && tracks.length > 0) return tracks;
    if (config?.file?.tracks && Array.isArray(config.file.tracks)) return config.file.tracks;
    return null;
  }, [tracks, config]);

  // Automatically build standard config.file.tracks objects for all 100+ languages
  const [generatedTracks, setGeneratedTracks] = useState([]);
  const activeBlobUrlsRef = useRef([]);

  useEffect(() => {
    // Revoke previous URLs
    activeBlobUrlsRef.current.forEach(url => {
      try { URL.revokeObjectURL(url); } catch (_) {}
    });
    activeBlobUrlsRef.current = [];

    const newBlobUrls = [];
    const list = [];

    Object.entries(combinedSubtitles).forEach(([langCode, vttContent], idx) => {
      if (!vttContent) return; // deleted or null
      let srcUrl = vttContent;
      if (typeof vttContent === 'string' && vttContent.startsWith('WEBVTT')) {
        try {
          const blob = new Blob([vttContent], { type: 'text/vtt' });
          srcUrl = URL.createObjectURL(blob);
          newBlobUrls.push(srcUrl);
        } catch (_) {}
      }
      list.push({
        kind: 'subtitles',
        src: srcUrl,
        srcLang: langCode,
        label: LANGUAGE_NAMES[langCode] || langCode.toUpperCase(),
        default: langCode === defaultSubLanguage || (idx === 0 && defaultSubLanguage === 'en')
      });
    });

    activeBlobUrlsRef.current = newBlobUrls;
    setGeneratedTracks(list);

    return () => {
      newBlobUrls.forEach(url => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      });
    };
  }, [combinedSubtitles, defaultSubLanguage]);

  // Trigger onTracksChange whenever tracks array updates
  const lastTracksSignatureRef = useRef('');
  useEffect(() => {
    if (generatedTracks.length > 0) {
      const signature = generatedTracks.map(t => `${t.srcLang}:${t.src}`).join('|');
      if (signature !== lastTracksSignatureRef.current) {
        lastTracksSignatureRef.current = signature;
        onTracksChange?.(generatedTracks);
      }
    }
  }, [generatedTracks, onTracksChange]);

  const sortedAndFilteredLangs = useMemo(() => {
    if (!hasAvailableSubtitles || !isSubtitleEnabled) return [];

    let codesToExpose = [];
    if (subtitles === undefined || subtitles === 'all' || (typeof subtitles === 'object' && subtitles !== null && !Array.isArray(subtitles))) {
      codesToExpose = Object.keys(combinedSubtitles).filter(lang => Boolean(combinedSubtitles[lang]));
    } else if (Array.isArray(subtitles)) {
      const allowedSet = new Set(subtitles);
      codesToExpose = Object.keys(combinedSubtitles).filter(lang => Boolean(combinedSubtitles[lang]) && allowedSet.has(lang));
    } else {
      codesToExpose = Object.keys(combinedSubtitles).filter(lang => Boolean(combinedSubtitles[lang]));
    }

    const allCodes = new Set([
      ...codesToExpose,
      ...Object.keys(localSubtitles).filter(lang => Boolean(localSubtitles[lang]))
    ]);

    const langObjects = Array.from(allCodes).map(code => {
      if (code === 'none') return { code, name: 'Off' };
      if (localSubtitles[code]) return { code, name: `📄 ${code}` };
      const reg = getLanguageByCode(code);
      let displayName = LANGUAGE_NAMES[code] || code.toUpperCase();
      if (reg) {
        if (reg.nativeName && reg.nativeName !== reg.name) {
          displayName = `${reg.nativeName} / ${reg.name}`;
        } else {
          displayName = reg.name;
        }
      }
      return { code, name: displayName };
    });

    const allLangs = langObjects.filter(lang => lang.code !== 'none' && !localSubtitles[lang.code]);
    allLangs.sort((a, b) => a.name.localeCompare(b.name));

    const query = subtitlesSearchQuery.trim().toLowerCase();
    if (!query) return allLangs;
    return allLangs.filter(lang => 
      lang.name.toLowerCase().includes(query) || 
      lang.code.toLowerCase().includes(query)
    );
  }, [combinedSubtitles, hasAvailableSubtitles, isSubtitleEnabled, visibleSubLanguages, subtitles, subtitlesSearchQuery, localSubtitles]);

  // Sync controlled subtitle language prop (subLanguage) when explicitly provided by developer
  useEffect(() => {
    if (subLanguage !== undefined && subLanguage !== null) {
      setSelectedSubLanguage(prev => prev === subLanguage ? prev : subLanguage);
    }
  }, [subLanguage]);

  const [selectedQuality, setSelectedQuality] = useState(() => loadSavedPref('selectedQuality', 'Auto'));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoplay, setIsAutoplay] = useState(false);
  const hlsRef = useRef(null);
  const [hlsQualities, setHlsQualities] = useState([]);

  // Animation frame ref
  const animationFrameRef = useRef(null);

  // YouTube Style Gestures State
  const [leftSkipActive, setLeftSkipActive] = useState(false);
  const [rightSkipActive, setRightSkipActive] = useState(false);
  const [leftSkipText, setLeftSkipText] = useState('10s');
  const [rightSkipText, setRightSkipText] = useState('10s');
  const [centerFlash, setCenterFlash] = useState(null);

  // Gesture timeout refs
  const leftSkipTimeoutRef = useRef(null);
  const rightSkipTimeoutRef = useRef(null);
  const centerFlashTimeoutRef = useRef(null);

  const triggerLeftSkipAnimation = (text) => {
    setLeftSkipText(text);
    setLeftSkipActive(false);
    if (leftSkipTimeoutRef.current) clearTimeout(leftSkipTimeoutRef.current);
    setTimeout(() => {
      setLeftSkipActive(true);
      leftSkipTimeoutRef.current = setTimeout(() => {
        setLeftSkipActive(false);
      }, 800);
    }, 10);
  };

  const triggerRightSkipAnimation = (text) => {
    setRightSkipText(text);
    setRightSkipActive(false);
    if (rightSkipTimeoutRef.current) clearTimeout(rightSkipTimeoutRef.current);
    setTimeout(() => {
      setRightSkipActive(true);
      rightSkipTimeoutRef.current = setTimeout(() => {
        setRightSkipActive(false);
      }, 800);
    }, 10);
  };

  const triggerCenterFlash = (type) => {
    if (centerFlashTimeoutRef.current) clearTimeout(centerFlashTimeoutRef.current);
    setCenterFlash({ type, key: Date.now() });
    centerFlashTimeoutRef.current = setTimeout(() => {
      setCenterFlash(null);
    }, 500);
  };

  // Controls bar auto-hide logic
  const controlsTimeoutRef = useRef(null);

  const triggerControlsVisibility = () => {
    setIsMouseOverPlayer(true);
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!isDragging && !isSettingsOpen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 1000);
    }
  };

  const handleMouseLeavePlayer = () => {
    setIsMouseOverPlayer(false);
    if (!isDragging && !isSettingsOpen) {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 200);
    }
  };

  const isHlsUrl = (url) => {
    return url && (url.includes('.m3u8') || url.includes('/hls/'));
  };

  const loadHlsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }
      const existingScript = document.querySelector('script[src*="hls.js"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.Hls) resolve(window.Hls);
          else reject(new Error('Hls not found'));
        });
        existingScript.addEventListener('error', () => {
          reject(new Error('Hls load failed'));
        });
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
      script.onload = () => {
        if (window.Hls) resolve(window.Hls);
        else reject(new Error('Hls not loaded successfully'));
      };
      script.onerror = () => reject(new Error('Hls script error'));
      document.head.appendChild(script);
    });
  };

  const effectiveQualityAvailability = useMemo(() => {
    if (qualityAvailabilityProp) return qualityAvailabilityProp;
    return resolveQualityAvailability({
      qualitiesConfig: qualities,
      hlsQualities,
      config,
      manifestQualities: effectiveManifestQualities,
      videoKey: id || src || 'default'
    });
  }, [qualityAvailabilityProp, qualities, hlsQualities, config, effectiveManifestQualities, id, src]);

  const displayQualities = effectiveQualityAvailability.resolvedQualities || effectiveQualityAvailability.qualities || [];
  const isQualityEnabled = effectiveQualityAvailability.enabled && displayQualities.length > 0;

  // Synchronize selected quality when displayQualities becomes available
  useEffect(() => {
    if (displayQualities.length > 0) {
      if (selectedQuality === 'Auto' && !hlsRef.current) {
        const saved = loadSavedPref('selectedQuality', null);
        if (saved && displayQualities.some(q => q.label === saved)) {
          const matched = displayQualities.find(q => q.label === saved);
          setSelectedQuality(saved);
          if (matched && matched.src && matched.src !== activeSrc) {
            setActiveSrc(matched.src);
          }
        } else {
          const defaultQ = displayQualities.find(q => q.source) || displayQualities[0];
          if (defaultQ) {
            setSelectedQuality(defaultQ.label);
          }
        }
      }
    }
  }, [displayQualities]);



  // Cues state loaded dynamically (supporting raw strings and URLs)
  const [primaryCues, setPrimaryCues] = useState([]);
  const [secondaryCues, setSecondaryCues] = useState([]);
  const subtitleCacheRef = useRef({});
  const inFlightSubtitlesRef = useRef({});
  const isTranscribingRef = useRef(false);

  // Asynchronous subtitle loader (handles both URL fetching and raw content with in-flight deduplication)
  const loadSubtitles = async (contentOrUrl) => {
    if (!contentOrUrl) return [];

    const isUrl = typeof contentOrUrl === 'string' && (
      contentOrUrl.startsWith('http://') || 
      contentOrUrl.startsWith('https://') || 
      contentOrUrl.startsWith('/') || 
      contentOrUrl.endsWith('.vtt') || 
      contentOrUrl.endsWith('.srt')
    );

    if (isUrl) {
      if (GLOBAL_SUBTITLE_CACHE.has(contentOrUrl)) {
        const cached = GLOBAL_SUBTITLE_CACHE.get(contentOrUrl);
        subtitleCacheRef.current[contentOrUrl] = cached;
        return cached;
      }
      if (subtitleCacheRef.current[contentOrUrl]) {
        return subtitleCacheRef.current[contentOrUrl];
      }

      // Deduplicate in-flight requests (across mounts and under React StrictMode)
      if (GLOBAL_IN_FLIGHT_SUBTITLES.has(contentOrUrl)) {
        return await GLOBAL_IN_FLIGHT_SUBTITLES.get(contentOrUrl);
      }
      if (inFlightSubtitlesRef.current[contentOrUrl]) {
        return await inFlightSubtitlesRef.current[contentOrUrl];
      }

      const fetchPromise = (async () => {
        try {
          const response = await fetch(contentOrUrl);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const text = await response.text();
          const parsed = parseWebVTT(text);
          subtitleCacheRef.current[contentOrUrl] = parsed;
          GLOBAL_SUBTITLE_CACHE.set(contentOrUrl, parsed);
          return parsed;
        } catch (err) {
          console.error('Failed to load subtitle file:', contentOrUrl, err);
          return [];
        } finally {
          delete inFlightSubtitlesRef.current[contentOrUrl];
          GLOBAL_IN_FLIGHT_SUBTITLES.delete(contentOrUrl);
        }
      })();

      inFlightSubtitlesRef.current[contentOrUrl] = fetchPromise;
      GLOBAL_IN_FLIGHT_SUBTITLES.set(contentOrUrl, fetchPromise);
      return await fetchPromise;
    }

    return parseWebVTT(contentOrUrl);
  };

  // Translate cues on the fly (Only used when no build-time VTT track exists)
  const translateCues = async (cues, targetLang) => {
    if (!cues || cues.length === 0) return [];
    const batchSize = 35;
    const translatedCues = [];
    
    for (let i = 0; i < cues.length; i += batchSize) {
      const batch = cues.slice(i, i + batchSize);
      const combinedText = batch.map(c => c.text).join('\n');
      
      try {
        const response = await fetch(`/api/translate?to=${targetLang}&text=${encodeURIComponent(combinedText)}`);
        if (!response.ok) throw new Error('Translation failed');
        const data = await response.json();
        if (!data || typeof data.translation !== 'string' || !data.translation.trim()) {
          throw new Error('Translation response is empty or malformed');
        }
        
        // Split by newline and handle potential length mismatches
        const translatedLines = data.translation.split('\n');
        if (translatedLines.length !== batch.length || translatedLines.some(line => !line.trim())) {
          throw new Error('Translation response does not preserve cue boundaries');
        }
        batch.forEach((cue, index) => {
          translatedCues.push({
            ...cue,
            text: translatedLines[index].trim()
          });
        });
      } catch (err) {
        console.error('Batch translation error:', err);
        throw err;
      }
    }
    return translatedCues;
  };

  const [isTranslating, setIsTranslating] = useState(false);
  const [isLoadingSubtitles, setIsLoadingSubtitles] = useState(false);
  const [subtitleStatusText, setSubtitleStatusText] = useState('Loading subtitles...');
  const fetchPrimarySeqRef = useRef(0);
  const loadedPrimaryLangRef = useRef(null);
  const loadedPrimarySrcRef = useRef(null);

  useEffect(() => {
    let active = true;
    const currentSeq = ++fetchPrimarySeqRef.current;

    const fetchPrimary = async () => {
      if (!selectedSubLanguage || selectedSubLanguage === 'none' || subtitles === false || !isSubtitleEnabled || !hasAvailableSubtitles) {
        if (active && currentSeq === fetchPrimarySeqRef.current) {
          loadedPrimaryLangRef.current = 'none';
          loadedPrimarySrcRef.current = null;
          setPrimaryCues(prev => (prev.length === 0 ? prev : []));
          setIsLoadingSubtitles(false);
        }
        return;
      }

      if (selectedSubLanguage.startsWith && selectedSubLanguage.startsWith('embedded-')) {
        return;
      }

      const rawContent = combinedSubtitles[selectedSubLanguage];
      
      // If already loaded for this exact language and content, do not wipe or reload
      if (
        loadedPrimaryLangRef.current === selectedSubLanguage &&
        loadedPrimarySrcRef.current === rawContent &&
        primaryCuesRef.current.length > 0
      ) {
        return;
      }

      if (rawContent) {
        // Direct static VTT load from manifest or pre-generated subtitles - NO translation
        if (selectedSubLanguage === 'en' || selectedSubLanguage.includes('.')) {
          originalTrackRef.current = { name: selectedSubLanguage, vtt: rawContent };
        }

        // Check cache first for immediate zero-flash cue population
        if (subtitleCacheRef.current[rawContent]) {
          const cachedCues = subtitleCacheRef.current[rawContent];
          if (active && currentSeq === fetchPrimarySeqRef.current) {
            loadedPrimaryLangRef.current = selectedSubLanguage;
            loadedPrimarySrcRef.current = rawContent;
            setPrimaryCues(cachedCues);
            requestAnimationFrame(() => paintSingleFrame());
          }
          return;
        }

        if (active && currentSeq === fetchPrimarySeqRef.current) {
          setIsLoadingSubtitles(true);
          setSubtitleStatusText('Loading subtitles...');
        }
        try {
          const cues = await loadSubtitles(rawContent);
          if (active && currentSeq === fetchPrimarySeqRef.current) {
            loadedPrimaryLangRef.current = selectedSubLanguage;
            loadedPrimarySrcRef.current = rawContent;
            setPrimaryCues(cues);
            requestAnimationFrame(() => paintSingleFrame());
          }
        } catch (err) {
          console.error('Failed to load subtitles:', err);
          if (active && currentSeq === fetchPrimarySeqRef.current) {
            setPrimaryCues(prev => (prev.length === 0 ? prev : []));
          }
        } finally {
          if (active && currentSeq === fetchPrimarySeqRef.current) setIsLoadingSubtitles(false);
        }
      } else if (originalTrackRef.current && originalTrackRef.current.vtt) {
        // Fallback translation only when no VTT file exists on disk
        if (active && currentSeq === fetchPrimarySeqRef.current) {
          setIsTranslating(true);
          setSubtitleStatusText('Loading subtitles...');
        }
        try {
          const baseCues = await loadSubtitles(originalTrackRef.current.vtt);
          const translated = await translateCues(baseCues, selectedSubLanguage);
          if (active && currentSeq === fetchPrimarySeqRef.current) {
            loadedPrimaryLangRef.current = selectedSubLanguage;
            loadedPrimarySrcRef.current = selectedSubLanguage;
            setPrimaryCues(translated);
            requestAnimationFrame(() => paintSingleFrame());
          }
        } catch (err) {
          console.error('Translation failed:', err);
          if (active && currentSeq === fetchPrimarySeqRef.current) setPrimaryCues(prev => (prev.length === 0 ? prev : []));
        } finally {
          if (active && currentSeq === fetchPrimarySeqRef.current) setIsTranslating(false);
        }
      } else {
        if (active && currentSeq === fetchPrimarySeqRef.current) {
          loadedPrimaryLangRef.current = null;
          loadedPrimarySrcRef.current = null;
          setPrimaryCues(prev => (prev.length === 0 ? prev : []));
          setIsLoadingSubtitles(false);
        }
        return;
      }
    };
    fetchPrimary();
    return () => { active = false; };
  }, [combinedSubtitles[selectedSubLanguage], selectedSubLanguage, subtitles, isSubtitleEnabled, hasAvailableSubtitles]);

  const secondarySubLanguage = useMemo(() => {
    if (!isDualSubtitles) return null;
    return availableSubLangs.find((lang) => lang !== selectedSubLanguage) ?? null;
  }, [availableSubLangs, selectedSubLanguage, isDualSubtitles]);

  const loadedSecondaryLangRef = useRef(null);
  const loadedSecondarySrcRef = useRef(null);

  useEffect(() => {
    let active = true;
    const fetchSecondary = async () => {
      if (!secondarySubLanguage || secondarySubLanguage === 'none') {
        if (active) {
          loadedSecondaryLangRef.current = 'none';
          loadedSecondarySrcRef.current = null;
          setSecondaryCues(prev => (prev.length === 0 ? prev : []));
        }
        return;
      }

      if (secondarySubLanguage.startsWith('embedded-')) {
        if (active) {
          loadedSecondaryLangRef.current = secondarySubLanguage;
          setSecondaryCues(prev => (prev.length === 0 ? prev : []));
        }
        return;
      }

      const rawContent = combinedSubtitles[secondarySubLanguage];

      if (
        loadedSecondaryLangRef.current === secondarySubLanguage &&
        loadedSecondarySrcRef.current === rawContent &&
        secondaryCuesRef.current.length > 0
      ) {
        return;
      }
      
      let cues = [];
      if (rawContent) {
        if (subtitleCacheRef.current[rawContent]) {
          const cachedCues = subtitleCacheRef.current[rawContent];
          if (active) {
            loadedSecondaryLangRef.current = secondarySubLanguage;
            loadedSecondarySrcRef.current = rawContent;
            setSecondaryCues(cachedCues);
          }
          return;
        }
        cues = await loadSubtitles(rawContent);
        if (active) {
          loadedSecondaryLangRef.current = secondarySubLanguage;
          loadedSecondarySrcRef.current = rawContent;
          setSecondaryCues(cues);
        }
      } else if (originalTrackRef.current && originalTrackRef.current.vtt) {
        try {
          const baseCues = await loadSubtitles(originalTrackRef.current.vtt);
          const translated = await translateCues(baseCues, secondarySubLanguage);
          if (active) {
            loadedSecondaryLangRef.current = secondarySubLanguage;
            loadedSecondarySrcRef.current = secondarySubLanguage;
            setSecondaryCues(translated);
          }
        } catch (err) {
          console.error('Secondary translation failed:', err);
          if (active) setSecondaryCues(prev => (prev.length === 0 ? prev : []));
        }
      } else {
        if (active) {
          loadedSecondaryLangRef.current = null;
          loadedSecondarySrcRef.current = null;
          setSecondaryCues(prev => (prev.length === 0 ? prev : []));
        }
      }
    };
    fetchSecondary();
    return () => { active = false; };
  }, [combinedSubtitles[secondarySubLanguage], secondarySubLanguage]);

  // Upload file handler
  const handleLocalSubtitleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        const lowerName = file.name.toLowerCase();
        let targetLangKey = file.name;
        
        // Extract language code if present (e.g., uploaded-en.vtt -> en, manual-te.vtt -> te)
        const match = lowerName.match(/(?:^|[-_])([a-z]{2,3})(?:\.vtt|\.srt|[-_.]|$)/);
        if (match && LANGUAGE_NAMES[match[1]]) {
          targetLangKey = match[1];
        } else if (selectedSubLanguage && selectedSubLanguage !== 'none' && LANGUAGE_NAMES[selectedSubLanguage]) {
          targetLangKey = selectedSubLanguage;
        }

        setLocalSubtitles(prev => ({
          ...prev,
          [targetLangKey]: text
        }));
        setSelectedSubLanguage(targetLangKey);
        setIsDualSubtitles(false);
        setActiveMenu('main');
        onSubLanguageChange?.(targetLangKey);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  const hasAvailableSubtitlesRef = useRef(hasAvailableSubtitles);
  hasAvailableSubtitlesRef.current = hasAvailableSubtitles;

  // Refs for zero-latency 60fps canvas draw loop
  const selectedSubLanguageRef = useRef(selectedSubLanguage);
  const isDualSubtitlesRef = useRef(isDualSubtitles);
  const primaryCuesRef = useRef(primaryCues);
  const secondaryCuesRef = useRef(secondaryCues);
  const secondarySubLanguageRef = useRef(secondarySubLanguage);
  const isTranslatingRef = useRef(isTranslating);
  const isTranscribingAIRef = useRef(isTranscribingAI);
  const aiTranscriptionProgressRef = useRef(aiTranscriptionProgress);
  const aiTranscriptionStatusTextRef = useRef(aiTranscriptionStatusText);

  // Sync ref values synchronously to avoid event loop / paint race conditions
  selectedSubLanguageRef.current = selectedSubLanguage;
  isDualSubtitlesRef.current = isDualSubtitles;
  primaryCuesRef.current = primaryCues;
  secondaryCuesRef.current = secondaryCues;
  secondarySubLanguageRef.current = secondarySubLanguage;
  isTranslatingRef.current = isTranslating;
  isTranscribingAIRef.current = isTranscribingAI;
  aiTranscriptionProgressRef.current = aiTranscriptionProgress;
  aiTranscriptionStatusTextRef.current = aiTranscriptionStatusText;

  const speedPresets = useMemo(() => {
    const rates = [...new Set(playbackRates)].sort((a, b) => a - b);
    return rates.length > 0 ? rates : [0.5, 1, 1.25, 1.5, 2];
  }, [playbackRates]);

  const speedMin = useMemo(() => Math.min(0.25, ...speedPresets), [speedPresets]);
  const speedMax = useMemo(() => Math.max(3, ...speedPresets), [speedPresets]);

  // Audio Dubbing Track resolution & sync
  const effectiveAudioAvailability = useMemo(() => {
    if (audioAvailability) return audioAvailability;
    return resolveAudioAvailability({
      audioLanguagesConfig: audioLanguages,
      manifestAudio: manifestAudioLanguagesProp,
      developerAudio: audioDubs,
      sourceLanguage: effectiveSourceLang,
      videoKey: id || src || 'default'
    });
  }, [audioAvailability, audioLanguages, manifestAudioLanguagesProp, audioDubs, effectiveSourceLang, id, src]);

  const isAudioEnabled = audioLanguages !== false &&
    effectiveAudioAvailability.enabled === true &&
    effectiveAudioAvailability.hasAvailableAudio === true &&
    Array.isArray(effectiveAudioAvailability.visibleLanguages) &&
    effectiveAudioAvailability.visibleLanguages.length > 0;

  const activeAudioTrackMap = useMemo(() => {
    if (effectiveAudioAvailability && effectiveAudioAvailability.resolvedTracks && Object.keys(effectiveAudioAvailability.resolvedTracks).length > 0) {
      return effectiveAudioAvailability.resolvedTracks;
    }
    return Object.keys(resolvedAudioTracks).length > 0 ? resolvedAudioTracks : audioDubs;
  }, [effectiveAudioAvailability, resolvedAudioTracks, audioDubs]);

  const authoritativeResolvedTrack = useMemo(() => {
    if (!isAudioEnabled) {
      return {
        mode: 'original',
        language: effectiveSourceLang,
        url: null,
        normalizedUrl: null,
        source: 'original',
        trackId: `original:${effectiveSourceLang}`,
        playable: true,
        label: 'Original'
      };
    }
    return resolveActiveAudioTrack({
      availability: effectiveAudioAvailability,
      selectedLanguage: selectedAudioLanguage,
      sourceLanguage: effectiveSourceLang,
      developerAudio: audioDubs,
      manifestAudio: manifestAudioLanguagesProp,
      videoKey: id || src || 'default'
    });
  }, [isAudioEnabled, effectiveAudioAvailability, selectedAudioLanguage, effectiveSourceLang, audioDubs, manifestAudioLanguagesProp, id, src]);

  const { controller: audioController } = useAudioController({
    videoRef: offscreenVideoRef,
    resolvedTrack: authoritativeResolvedTrack,
    volume,
    isMuted,
    playbackRate,
    sourceLanguage: effectiveSourceLang
  });

  const activeAudioUrl = authoritativeResolvedTrack.mode === 'dub' ? authoritativeResolvedTrack.url : null;

  const getAudioLanguageLabel = (lang) => {
    if (lang === 'original') {
      const langMeta = getLanguageByCode(effectiveSourceLang);
      const langName = langMeta 
        ? (langMeta.nativeName && langMeta.nativeName !== langMeta.name ? `${langMeta.nativeName} / ${langMeta.name}` : langMeta.name)
        : (LANGUAGE_NAMES[effectiveSourceLang] || (effectiveSourceLang || '').toUpperCase());
      return `${langName} (Original)`;
    }
    const track = activeAudioTrackMap[lang];
    if (track && typeof track === 'object' && track.label) {
      if (track.source || lang === effectiveSourceLang) {
        return track.label.includes('(Original)') ? track.label : `${track.label} (Original)`;
      }
      return track.label;
    }
    const langMeta = getLanguageByCode(lang);
    const defaultName = langMeta 
      ? (langMeta.nativeName && langMeta.nativeName !== langMeta.name ? `${langMeta.nativeName} / ${langMeta.name}` : langMeta.name) 
      : (LANGUAGE_NAMES[lang] || (lang || '').toUpperCase());
    return (track?.source || lang === effectiveSourceLang) ? `${defaultName} (Original)` : defaultName;
  };

  const handleAudioLanguageChange = (lang) => {
    const prev = selectedAudioLanguage;
    setSelectedAudioLanguage(lang);
    savePref('selectedAudioLanguage', lang);
    setActiveMenu('main');
    if (onAudioLanguageChange) {
      const isOrig = (lang === 'original' || lang === effectiveSourceLang || activeAudioTrackMap[lang]?.source);
      onAudioLanguageChange({
        language: lang,
        previousLanguage: prev,
        source: isOrig ? 'original' : (activeAudioTrackMap[lang] ? (effectiveAudioAvailability.sourceByLanguage?.[lang] || 'generated') : 'original')
      });
    }
  };


  // Helper to extract active subtitle text (canvas VTT or native TextTrack)
  const getActiveSubtitleText = (video, langRef, cuesRef) => {
    if (!langRef || langRef === 'none') return '';
    
    if (langRef.startsWith('embedded-')) {
      if (!video) return '';
      const idx = parseInt(langRef.split('-')[1], 10);
      const track = video.textTracks?.[idx];
      if (track) {
        if (track.mode !== 'hidden') track.mode = 'hidden';
        const activeCue = track.activeCues?.[0];
        return activeCue ? activeCue.text : '';
      }
      return '';
    }

    const timeToUse = video ? video.currentTime : currentTime;
    const activeCue = findActiveCue(cuesRef, timeToUse);
    return activeCue ? activeCue.text : '';
  };

  // Canvas paint utility for single frames with High-DPI Retina auto-scaling
  const paintSingleFrame = () => {
    const video = offscreenVideoRef.current;
    const canvas = canvasRef.current;
    if (canvas) {
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width || 1280;
      const cssHeight = rect.height || 720;
      const targetWidth = Math.round(cssWidth * dpr);
      const targetHeight = Math.round(cssHeight * dpr);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      const ctx = canvas.getContext('2d');
      // Keep the canvas transparent: the native <video> underneath renders the
      // media. This avoids a black screen when browsers disallow canvas frame
      // extraction for a remote/CORS-protected video.
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw transcription overlay if active
      if (isTranscribingAIRef.current) {
        drawTranscriptionOverlay(
          ctx,
          canvas.width,
          canvas.height,
          aiTranscriptionStatusTextRef.current,
          aiTranscriptionProgressRef.current
        );
      } else if (hasAvailableSubtitlesRef.current && selectedSubLanguageRef.current !== 'none') {
        // Draw canvas subtitles if enabled
        const activePrimaryText = isTranslatingRef.current
          ? 'Translating subtitles...'
          : getActiveSubtitleText(video, selectedSubLanguageRef.current, primaryCuesRef.current);
        const activeSecondaryText = isDualSubtitlesRef.current
          ? (isTranslatingRef.current ? '' : getActiveSubtitleText(video, secondarySubLanguageRef.current, secondaryCuesRef.current))
          : '';

        drawCanvasSubtitles(
          ctx,
          canvas.width,
          canvas.height,
          activePrimaryText,
          activeSecondaryText,
          selectedSubLanguageRef.current,
          secondarySubLanguageRef.current,
          areControlsVisibleRef.current,
          subtitleStyleRef.current
        );
      }
    }
  };

  // Expose play/pause controllers via ref
  useImperativeHandle(ref, () => ({
    play: () => {
      const video = offscreenVideoRef.current;
      if (video) {
        const promise = video.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err) => {
            console.error('TaviVideoPlayer play() failed:', err);
          });
        }
      }
    },
    pause: () => {
      const video = offscreenVideoRef.current;
      if (video) {
        video.pause();
      }
    },
    seekTo: (seconds) => {
      const video = offscreenVideoRef.current;
      if (video) {
        video.currentTime = seconds;
        setCurrentTime(seconds);
      }
    },
    setVolume: (vol) => {
      const video = offscreenVideoRef.current;
      if (video) {
        video.volume = vol;
        setVolume(vol);
      }
    },
    setPlaybackRate: (rate) => {
      const video = offscreenVideoRef.current;
      if (video) {
        video.playbackRate = rate;
        setPlaybackRate(rate);
      }
    }
  }));

  // Toggle play/pause using native video.paused as sole source of truth
  const handlePlayPauseToggle = () => {
    const video = offscreenVideoRef.current;
    if (!video) return;

    if (video.paused) {
      const promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch((err) => {
          console.error('TaviVideoPlayer play() failed:', err);
        });
      }
      triggerCenterFlash('play');
    } else {
      video.pause();
      triggerCenterFlash('pause');
    }
  };

  const handleScreenClick = (e) => {
    focusPlayer();
    
    // Clicking the video screen when settings is open closes the settings menu first
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;

    if (e.detail === 1) {
      // Single click - toggle play/pause immediately without 250ms user activation delay
      handlePlayPauseToggle();
    } else if (e.detail === 2) {
      // Double click - revert 1st click toggle and execute double-click gesture
      handlePlayPauseToggle();
      
      if (clickPercent < 0.3) {
        // Left 30% - skip backward 10s
        triggerManualSkip(-10);
      } else if (clickPercent > 0.7) {
        // Right 30% - skip forward 10s
        triggerManualSkip(10);
      } else {
        // Middle 40% - fullscreen
        handleFullscreenToggle();
      }
    }
  };

  // Manual Skip helper
  const triggerManualSkip = (offset) => {
    const video = offscreenVideoRef.current;
    if (!video || duration === 0) return;

    const timeBeforeSkip = video.currentTime;
    const targetTime = Math.max(0, Math.min(duration, timeBeforeSkip + offset));

    video.currentTime = targetTime;
    setCurrentTime(targetTime);

    if (offset < 0) {
      triggerLeftSkipAnimation(`${Math.abs(offset)}s`);
    } else if (offset > 0) {
      triggerRightSkipAnimation(`${Math.abs(offset)}s`);
    }
  };

  // Scrubber scrubber
  const handleTimelineScrub = (e) => {
    const video = offscreenVideoRef.current;
    if (!progressBarRef.current || !video || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSeconds = percentage * duration;

    video.currentTime = targetSeconds;
    setCurrentTime(targetSeconds);
  };

  const handleTimelineMouseDown = (e) => {
    if (duration === 0) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    handleTimelineScrub(e);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (!isDraggingRef.current || !progressBarRef.current || duration === 0) return;
      const video = offscreenVideoRef.current;
      if (!video) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const targetSeconds = percentage * duration;

      video.currentTime = targetSeconds;
      setCurrentTime(targetSeconds);
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, duration]);

  const preservePlaybackState = () => {
    const video = offscreenVideoRef.current;
    if (video) {
      pendingSeekTimeRef.current = video.currentTime;
      pendingPlayStateRef.current = !video.paused;
      pendingVolumeRef.current = volume;
      pendingMutedRef.current = isMuted;
      pendingPlaybackRateRef.current = video.playbackRate;
    } else {
      pendingSeekTimeRef.current = currentTime;
      pendingPlayStateRef.current = isPlaying;
      pendingVolumeRef.current = volume;
      pendingMutedRef.current = isMuted;
      pendingPlaybackRateRef.current = playbackRate;
    }
  };


  // Quality Changer
  const handleQualityChange = (qualityOption) => {
    preservePlaybackState();
    setSelectedQuality(qualityOption.label);
    savePref('selectedQuality', qualityOption.label);
    onQualityChange?.(qualityOption.label);
    if (hlsRef.current && qualityOption.index !== undefined) {
      hlsRef.current.currentLevel = qualityOption.index;
      setActiveMenu('main');
    } else {
      setActiveSrc(qualityOption.src);
      setActiveMenu('main');
    }
  };

  const handleAutoQuality = () => {
    preservePlaybackState();
    setSelectedQuality('Auto');
    savePref('selectedQuality', 'Auto');
    onQualityChange?.('Auto');
    if (hlsRef.current) {
      hlsRef.current.currentLevel = -1;
      setActiveMenu('main');
    } else {
      const containerW = wrapperRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 1920);
      let target = displayQualities[0];
      if (displayQualities.length > 0) {
        if (containerW <= 640) {
          target = displayQualities.find(q => (q.height <= 360 || q.width <= 640)) || displayQualities[displayQualities.length - 1];
        } else if (containerW <= 854) {
          target = displayQualities.find(q => (q.height <= 480 || q.width <= 854)) || displayQualities[displayQualities.length - 1];
        } else if (containerW <= 1280) {
          target = displayQualities.find(q => (q.height <= 720 || q.width <= 1280)) || displayQualities[0];
        }
      }
      setActiveSrc(target?.src || src);
      setActiveMenu('main');
    }
  };

  const focusPlayer = () => {
    wrapperRef.current?.focus();
  };

  const handleFullscreenToggle = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      wrapper.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  const handleCCToggle = () => {
    if (selectedSubLanguage === 'none') {
      const nextLang = lastActiveSubLangRef.current || 'en';
      setSelectedSubLanguage(nextLang);
      onSubLanguageChange?.(nextLang);
    } else {
      setSelectedSubLanguage('none');
      setIsDualSubtitles(false);
      onSubLanguageChange?.('none');
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Set up the native video element. The canvas is used only for overlays, so
  // video playback remains visible even when canvas frame extraction is blocked.
  useEffect(() => {
    const video = offscreenVideoRef.current;
    if (!video) return undefined;

    video.onloadedmetadata = () => {
      setMediaError('');
      setIsBuffering(false);
      const canvas = canvasRef.current;
      if (canvas && video.videoWidth > 0 && video.videoHeight > 0) {
        let targetHeight = video.videoHeight;
        if (selectedQuality !== 'Auto') {
          const parsed = parseInt(selectedQuality, 10);
          if (!isNaN(parsed)) targetHeight = parsed;
        }
        const aspectRatio = video.videoWidth / video.videoHeight;
        canvas.width = Math.round(targetHeight * aspectRatio);
        canvas.height = targetHeight;
      }
      setDuration(video.duration);

      // Extract and synchronize embedded text tracks
      const syncTracks = () => {
        const tracks = Array.from(video.textTracks || []);
        const mapped = tracks.map((track, index) => {
          if (track.mode === 'disabled') {
            track.mode = 'hidden';
          }
          return {
            id: `embedded-${index}`,
            label: track.label || track.language || `Track ${index + 1}`,
            language: track.language || 'und',
            kind: track.kind || 'subtitles',
            index
          };
        });
        setEmbeddedTracks(prev => {
          if (prev.length === 0 && mapped.length === 0) return prev;
          if (prev.length === mapped.length && prev.every((t, i) => t.id === mapped[i].id)) return prev;
          return mapped;
        });
      };

      syncTracks();
      if (video.textTracks) {
        video.textTracks.onaddtrack = syncTracks;
        video.textTracks.onremovetrack = syncTracks;
      }

      if (pendingSeekTimeRef.current != null) {
        video.currentTime = pendingSeekTimeRef.current;
        setCurrentTime(pendingSeekTimeRef.current);
        pendingSeekTimeRef.current = null;
      }

      if (pendingVolumeRef.current != null) {
        const pVol = pendingVolumeRef.current;
        setVolume(pVol);
        pendingVolumeRef.current = null;
      }

      if (pendingMutedRef.current != null) {
        const pMuted = pendingMutedRef.current;
        setIsMuted(pMuted);
        pendingMutedRef.current = null;
      }

      if (audioController) {
        audioController.enforceMuteInvariant();
      } else {
        video.muted = Boolean(activeAudioUrl) || isMuted;
        video.volume = activeAudioUrl ? 0 : (isMuted ? 0 : volume);
      }


      if (pendingPlaybackRateRef.current != null) {
        video.playbackRate = pendingPlaybackRateRef.current;
        setPlaybackRate(pendingPlaybackRateRef.current);
        pendingPlaybackRateRef.current = null;
      }

      if (pendingPlayStateRef.current != null) {
        if (pendingPlayStateRef.current) {
          const p = video.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } else {
          video.pause();
        }
        pendingPlayStateRef.current = null;
      }

      paintSingleFrame();
    };

    video.ontimeupdate = () => {
      setCurrentTime(video.currentTime);
      onProgress?.({ playedSeconds: video.currentTime });
    };

    video.onwaiting = () => {
      setIsBuffering(true);
    };

    video.oncanplay = () => {
      setIsBuffering(false);
    };

    video.onerror = () => {
      const code = video.error?.code;
      const message = code === 4
        ? 'This video format or source is not supported by this browser.'
        : 'The video could not be loaded. Check the URL, network connection, and CORS settings.';
      setMediaError(message);
      setIsBuffering(false);
      setIsPlaying(false);
    };

    video.onseeking = () => {
      setIsBuffering(true);
    };

    video.onseeked = () => {
      setIsBuffering(false);
    };

    video.onplaying = () => {
      setIsBuffering(false);
    };

    video.onplay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    video.onpause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    video.onended = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    return () => {
      video.pause();
      video.onloadedmetadata = null;
      video.ontimeupdate = null;
      video.onwaiting = null;
      video.oncanplay = null;
      video.onerror = null;
      video.onseeking = null;
      video.onseeked = null;
      video.onplaying = null;
      video.onplay = null;
      video.onpause = null;
      video.onended = null;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  // Sync when parent changes src
  useEffect(() => {
    pendingSeekTimeRef.current = 0;
    pendingPlayStateRef.current = false;
    setActiveSrc(src);
    setSelectedQuality('Auto');
    setCurrentTime(0);
    setMediaError('');
  }, [src]);

  const ytId = useMemo(() => {
    if (!activeSrc) return null;
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = String(activeSrc).match(regExp);
    return match ? match[1] : null;
  }, [activeSrc]);

  const ytIdRef = useRef(null);
  useEffect(() => {
    ytIdRef.current = ytId;
  }, [ytId]);

  // Update source URL (with HLS support)
  useEffect(() => {
    const video = offscreenVideoRef.current;
    if (!video || !activeSrc) return;

    setMediaError('');
    setIsBuffering(true);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
      setHlsQualities([]);
    }

    if (ytId) {
      // Do NOT load YouTube URLs in the HTML5 video element
      video.pause();
      video.removeAttribute('src');
      video.load();
      return;
    }

    if (isHlsUrl(activeSrc)) {
      loadHlsScript().then((HlsClass) => {
        if (HlsClass.isSupported()) {
          const hls = new HlsClass({
            capLevelToPlayerSize: false,
            enableWorker: true
          });
          hlsRef.current = hls;
          hls.loadSource(activeSrc);
          hls.attachMedia(video);
          
          hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
            const parsedQualities = hls.levels.map((level, idx) => {
              const label = level.height ? `${level.height}p` : `Quality ${idx}`;
              return {
                label,
                index: idx,
                src: activeSrc
              };
            });
            parsedQualities.sort((a, b) => {
              const hA = parseInt(a.label, 10) || 0;
              const hB = parseInt(b.label, 10) || 0;
              return hB - hA;
            });
            setHlsQualities(parsedQualities);
          });
          
          hls.on(HlsClass.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case HlsClass.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case HlsClass.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  break;
              }
            }
          });

          video.playbackRate = playbackRate;
          video.muted = Boolean(activeAudioUrl) || isMuted;
          video.volume = activeAudioUrl ? 0 : (isMuted ? 0 : volume);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = activeSrc;
          video.load();
          video.playbackRate = playbackRate;
          video.muted = Boolean(activeAudioUrl) || isMuted;
          video.volume = activeAudioUrl ? 0 : (isMuted ? 0 : volume);
        }
      }).catch((err) => {
        console.error('HLS load error, falling back to native player:', err);
        video.src = activeSrc;
        video.load();
        video.playbackRate = playbackRate;
        video.muted = Boolean(activeAudioUrl) || isMuted;
        video.volume = activeAudioUrl ? 0 : (isMuted ? 0 : volume);
      });
    } else {
      video.pause();
      video.src = activeSrc;
      video.load();
      video.playbackRate = playbackRate;
      video.muted = Boolean(activeAudioUrl) || isMuted;
      video.volume = activeAudioUrl ? 0 : (isMuted ? 0 : volume);
    }
  }, [activeSrc]);

  const transcribingUrlRef = useRef(null);
  const videoIdentityRef = useRef(src);

  // Auto-transcribe video on source change
  useEffect(() => {
    if (!activeSrc || !autoTranscribe) return;

    const isQualitySwitchSameVideo = videoIdentityRef.current === src;
    videoIdentityRef.current = src;

    const hasAnySubtitles = Object.keys(combinedSubtitles).length > 0 || 
                             subtitles === false || 
                             (subtitles && typeof subtitles === 'object' && Object.keys(subtitles).length > 0);

    if (isQualitySwitchSameVideo && hasAnySubtitles) {
      return;
    }

    // Reset transcription state
    setIsTranscribingAI(false);
    setAiTranscriptionProgress(0);
    setAiTranscriptionStatusText('');
    
    // Clear any previous AI subtitles only if 'en' was present
    setLocalSubtitles((prev) => {
      if (!prev || !prev['en']) return prev;
      const nextSubs = { ...prev };
      delete nextSubs['en'];
      return nextSubs;
    });

    let active = true;
    const runAutoTranscription = async () => {
      if (hasAnySubtitles) return;

      // Small delay to allow the video metadata/decoders to settle
      await new Promise(resolve => setTimeout(resolve, 800));
      if (!active) return;

      if (transcribingUrlRef.current === activeSrc) return;
      transcribingUrlRef.current = activeSrc;

      // 1. Check IndexedDB Cache first
      try {
        const cachedVtt = await getCachedSubtitle(activeSrc);
        if (cachedVtt) {
          if (active) {
            setLocalSubtitles((prev) => ({
              ...prev,
              ['en']: cachedVtt
            }));
            setSelectedSubLanguage('en');
            onSubtitleGenerated?.(cachedVtt, activeSrc);
          }
          return;
        }
      } catch (err) {
        console.error('Failed to read subtitle cache:', err);
      }

      // 2. Check if activeSrc is a YouTube URL
      if (ytId) {
        setIsTranscribingAI(true);
        setAiTranscriptionProgress(20);
        setAiTranscriptionStatusText('Fetching YouTube Transcript...');
        try {
          const response = await fetch(`/api/youtube-transcript?v=${ytId}`);
          if (response.ok) {
            const transcript = await response.json();
            let vtt = 'WEBVTT\n\n';
            transcript.forEach((item, index) => {
              const formatVttTime = (ms) => {
                const secondsTotal = ms / 1000;
                const h = Math.floor(secondsTotal / 3600);
                const m = Math.floor((secondsTotal % 3600) / 60);
                const s = Math.floor(secondsTotal % 60);
                const decMs = Math.floor(ms % 1000);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(decMs).padStart(3, '0')}`;
              };
              const startStr = formatVttTime(item.offset);
              const endStr = formatVttTime(item.offset + item.duration);
              vtt += `${index + 1}\n${startStr} --> ${endStr}\n${item.text}\n\n`;
            });

            if (active) {
              await setCachedSubtitle(activeSrc, vtt);
              setLocalSubtitles((prev) => ({
                ...prev,
                ['en']: vtt
              }));
              setSelectedSubLanguage('en');
              onSubtitleGenerated?.(vtt, activeSrc);
            }
            return;
          }
        } catch (ytErr) {
          console.warn('YouTube transcript fetch failed, falling back to audio transcriber:', ytErr);
        }
      }

      // 3. Transcribe audio from scratch using Whisper AI
      setIsTranscribingAI(true);
      setAiTranscriptionProgress(0);
      setAiTranscriptionStatusText('Initializing AI Subtitle Engine...');

      try {
        const { transcribeVideoAudio } = await import('../services/AITranscriber.js');
        const vtt = await transcribeVideoAudio(activeSrc, (progress) => {
          if (!active) return;
          if (progress.status === 'downloading-model') {
            setAiTranscriptionStatusText(progress.message);
            setAiTranscriptionProgress(progress.percent * 0.4);
          } else if (progress.status === 'transcribing') {
            setAiTranscriptionStatusText(progress.message);
            setAiTranscriptionProgress(40 + (progress.percent * 0.6));
          } else {
            setAiTranscriptionStatusText(progress.message);
          }
        });

        if (active) {
          await setCachedSubtitle(activeSrc, vtt);
          
          setLocalSubtitles((prev) => ({
            ...prev,
            ['en']: vtt
          }));
          setSelectedSubLanguage('en');
          
          onSubtitleGenerated?.(vtt, activeSrc);
        }
      } catch (err) {
        console.error('Auto AI transcription failed:', err);
      } finally {
        if (active) {
          setIsTranscribingAI(false);
          setAiTranscriptionProgress(0);
          setAiTranscriptionStatusText('');
        }
      }
    };

    runAutoTranscription();
    
    return () => {
      active = false;
      transcribingUrlRef.current = null;
    };
  }, [activeSrc]);

  // Sync playback rates and volumes (mute native video when dubbed audio track is active)
  useEffect(() => {
    const video = offscreenVideoRef.current;
    if (video) {
      video.playbackRate = playbackRate;
      if (audioController) {
        audioController.enforceMuteInvariant();
      } else if (activeAudioUrl) {
        video.muted = true;
        video.volume = 0;
      } else {
        video.muted = isMuted;
        video.volume = isMuted ? 0 : volume;
      }
    }
  }, [playbackRate, volume, isMuted, activeAudioUrl, audioController, authoritativeResolvedTrack]);


  // Paint single frame when paused and seeking
  useEffect(() => {
    if (!isPlaying) {
      paintSingleFrame();
    }
  }, [currentTime, selectedSubLanguage, isDualSubtitles, primaryCues, secondaryCues, isPlaying, areControlsVisible]);

  // Continuous background canvas rendering loop
  useEffect(() => {
    let active = true;
    
    const draw = () => {
      if (!active) return;
      const video = offscreenVideoRef.current;
      const canvas = canvasRef.current;
      
      if (video && canvas && !video.paused && !video.ended && !video.seeking) {
        paintSingleFrame();
      }
      
      requestAnimationFrame(draw);
    };
    
    requestAnimationFrame(draw);
    
    return () => {
      active = false;
    };
  }, []);

  // Sync controls visibility timer when play state or dragging state updates
  useEffect(() => {
    if (!isPlaying) {
      setAreControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else {
      triggerControlsVisibility();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isDragging) {
      setAreControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else if (isPlaying) {
      triggerControlsVisibility();
    }
  }, [isDragging]);

  useEffect(() => {
    if (isSettingsOpen) {
      setAreControlsVisible(true);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    } else if (isPlaying) {
      triggerControlsVisibility();
    }
  }, [isSettingsOpen]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Handle manual resolution scaling (canvas pixel density) on quality switch
  useEffect(() => {
    const video = offscreenVideoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.videoWidth > 0 && video.videoHeight > 0) {
      let targetHeight = video.videoHeight;
      if (selectedQuality !== 'Auto') {
        const parsed = parseInt(selectedQuality, 10);
        if (!isNaN(parsed)) targetHeight = parsed;
      }
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = Math.round(targetHeight * aspectRatio);
      canvas.height = targetHeight;
      
      if (video.paused) {
        paintSingleFrame();
      }
    }
  }, [selectedQuality]);

  // Player-scoped keyboard shortcuts (only when the player has focus)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleKeyDown = (e) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (!wrapper.contains(document.activeElement)) {
        return;
      }

      const video = offscreenVideoRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPauseToggle();
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((prev) => !prev);
          break;
        case 'c':
          e.preventDefault();
          setSelectedSubLanguage((prev) => {
            const next = prev === 'none' ? (defaultSubLanguage || 'en') : 'none';
            onSubLanguageChange?.(next);
            return next;
          });
          break;
        case 's':
          e.preventDefault();
          setIsSettingsOpen(true);
          setActiveMenu('subtitles');
          break;
        case 'f':
          e.preventDefault();
          if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen();
          }
          break;
        case 'arrowleft':
          e.preventDefault();
          triggerManualSkip(-5);
          break;
        case 'arrowright':
          e.preventDefault();
          triggerManualSkip(5);
          break;
        case 'j':
          e.preventDefault();
          triggerManualSkip(-10);
          break;
        case 'l':
          e.preventDefault();
          triggerManualSkip(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((prev) => Math.min(1, prev + 0.1));
          setIsMuted(false);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((prev) => Math.max(0, prev - 0.1));
          break;
        default:
          break;
      }
    };

    wrapper.addEventListener('keydown', handleKeyDown);
    return () => wrapper.removeEventListener('keydown', handleKeyDown);
  }, [duration, defaultSubLanguage]);

  // Timeline hovering handlers
  const handleTimelineMouseMove = (e) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, hoverX / rect.width));
    const hoverTime = percent * duration;
    setHoverTooltip({ percent, time: hoverTime });
  };

  const handleTimelineMouseLeave = () => {
    setHoverTooltip(null);
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs === Infinity) return '00:00';
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const dualSubtitleLabel = secondarySubLanguage
    ? `Dual (${selectedSubLanguage.toUpperCase()} + ${secondarySubLanguage.toUpperCase()})`
    : 'Dual';

  return (
    <div
      ref={wrapperRef}
      className={`tavi-player-wrapper ${!areControlsVisible ? 'hide-cursor' : ''} ${isFullscreen ? 'fullscreen' : ''}`}
      tabIndex={0}
      onMouseDown={focusPlayer}
      onMouseEnter={() => setIsMouseOverPlayer(true)}
      onMouseMove={triggerControlsVisibility}
      onMouseLeave={handleMouseLeavePlayer}
    >
      {/* Canvas Media Screen */}
      <div className="tavi-media-screen">
        {ytId && (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&fs=0`}
            className="tavi-video-element"
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
          />
        )}
        {!ytId && (
          <video
            ref={offscreenVideoRef}
            className="tavi-native-video"
            playsInline
            preload="metadata"
          />
        )}
        <canvas ref={canvasRef} className="tavi-subtitle-canvas" aria-hidden="true" />
      </div>

      {/* Visually Hidden Screen Reader Subtitle Live Region (Section 508 / WAI-ARIA) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {hasAvailableSubtitles && selectedSubLanguage !== 'none' ? getActiveSubtitleText(offscreenVideoRef.current, selectedSubLanguage, primaryCues) : ''}
      </div>

      {/* Interaction Shield Blocker */}
      <div 
        className="tavi-interaction-blocker" 
        onClick={handleScreenClick} 
        style={{ pointerEvents: ytId ? 'none' : 'auto' }}
      />

      {/* Buffering Overlay */}
      {isBuffering && (
        <div className="tavi-buffering-overlay">
          <div className="tavi-spinner" />
        </div>
      )}

      {mediaError && (
        <div className="tavi-media-error" role="alert">
          <strong>Unable to play this video</strong>
          <span>{mediaError}</span>
        </div>
      )}

      {/* YouTube Style Left/Right Skip Overlay */}
      <div className={`tavi-skip-overlay left ${leftSkipActive ? 'active' : ''}`}>
        <div className="tavi-skip-indicator-box">
          <div className="tavi-arrow-animation left">
            <span className="arrow-one">◀</span>
            <span className="arrow-two">◀</span>
            <span className="arrow-three">◀</span>
          </div>
          <span className="tavi-skip-label">{leftSkipText}</span>
        </div>
      </div>

      <div className={`tavi-skip-overlay right ${rightSkipActive ? 'active' : ''}`}>
        <div className="tavi-skip-indicator-box">
          <div className="tavi-arrow-animation right">
            <span className="arrow-one">▶</span>
            <span className="arrow-two">▶</span>
            <span className="arrow-three">▶</span>
          </div>
          <span className="tavi-skip-label">{rightSkipText}</span>
        </div>
      </div>

      {/* YouTube Style Center Play/Pause Flash Overlay */}
      {centerFlash && (
        <div 
          key={centerFlash.key} 
          className={`tavi-center-action-flash tavi-center-flash-${centerFlash.type}`}
        >
          <div className="tavi-center-flash-icon">
            {centerFlash.type === 'play' ? <PlayIconLarge /> : <PauseIconLarge />}
          </div>
        </div>
      )}

      {/* Subtitles Overlay disabled in DOM - drawn directly in canvas */}

      {/* Controls HUD */}
      <div className={`tavi-controls-bar ${!areControlsVisible ? 'hidden' : ''} ${!isMouseOverPlayer ? 'mouse-outside' : ''}`}>
        {/* Timeline Scrubber */}
        <div 
          className={`timeline-scrubber-wrapper ${isDragging ? 'dragging' : ''}`}
          ref={progressBarRef} 
          onMouseDown={handleTimelineMouseDown}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={handleTimelineMouseLeave}
        >
          <div className="timeline-trail" />
          <div
            className="timeline-progress"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          <div
            className="timeline-thumb"
            style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
          {hoverTooltip && (
            <div 
              className="timeline-tooltip"
              style={{ left: `${hoverTooltip.percent * 100}%` }}
            >
              {formatTime(hoverTooltip.time)}
            </div>
          )}
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button 
              type="button"
              className="control-btn" 
              onClick={handlePlayPauseToggle}
              title={isPlaying ? "Pause (space or k)" : "Play (space or k)"}
            >
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>

            {/* Volume Control Container with Hover Slider */}
            <div className="volume-control-container">
              <button 
                type="button"
                className="control-btn" 
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute (m)" : "Mute (m)"}
                aria-label={isMuted ? "Unmute audio (m)" : "Mute audio (m)"}
              >
                {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  if (val > 0 && isMuted) setIsMuted(false);
                }}
                className="volume-slider"
                aria-label="Volume slider"
                aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>

            <span className="timestamp-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="controls-right">
            {/* Autoplay Toggle Switch */}
            <button 
              type="button"
              className="control-btn autoplay-btn" 
              onClick={() => setIsAutoplay(prev => !prev)}
              title={isAutoplay ? "Autoplay is on" : "Autoplay is off"}
              aria-label={isAutoplay ? "Autoplay is on" : "Autoplay is off"}
              aria-pressed={isAutoplay}
              style={{ padding: '0 6px', display: 'flex', alignItems: 'center' }}
            >
              <AutoplayIcon active={isAutoplay} />
            </button>

            {/* CC Toggle Button */}
            {hasAvailableSubtitles && isSubtitleEnabled && availableSubLangs.length > 0 && (
              <button 
                type="button"
                className={`control-btn cc-btn ${selectedSubLanguage !== 'none' ? 'active' : ''}`}
                onClick={handleCCToggle}
                title={selectedSubLanguage !== 'none' ? "Subtitles/closed captions (c) - Active" : "Subtitles/closed captions (c)"}
                aria-label="Subtitles and closed captions (c)"
                aria-pressed={selectedSubLanguage !== 'none'}
              >
                <CCIcon />
              </button>
            )}

            {/* Settings Gear Button with optional HD Badge */}
            <button 
              type="button"
              className="control-btn settings-btn" 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              title="Settings"
              aria-label="Player settings"
              aria-expanded={isSettingsOpen}
              style={{ position: 'relative' }}
            >
              <GearIcon />
              {(selectedQuality.includes('720') || selectedQuality.includes('1080') || selectedQuality.includes('1440') || selectedQuality.includes('2160') || (selectedQuality === 'Auto' && hlsRef.current && hlsRef.current.currentLevel !== -1)) && (
                <span className="hd-badge">HD</span>
              )}
            </button>


            {/* Fullscreen Button */}
            <button 
              type="button"
              className="control-btn" 
              onClick={handleFullscreenToggle}
              title={isFullscreen ? "Exit full screen (f)" : "Full screen (f)"}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Level Settings Cards */}
      {isSettingsOpen && (
        <div 
          className="tavi-settings-card"
          style={
            activeMenu === 'speed' 
              ? { width: '280px' } 
              : activeMenu === 'subtitles' 
                ? { width: '260px', maxHeight: '340px', display: 'flex', flexDirection: 'column' } 
                : {}
          }
        >
          {activeMenu === 'main' && (
            <div className="settings-list">
              <div className="settings-item" onClick={() => setActiveMenu('speed')}>
                <span>Playback Speed</span>
                <span className="value-label">{playbackRate}x ›</span>
              </div>
              {hasAvailableSubtitles && isSubtitleEnabled && (
                <div className="settings-item" onClick={() => { setActiveMenu('subtitles'); setSubtitlesSearchQuery(''); }}>
                  <span>Subtitles</span>
                  <span className="value-label">
                    {isDualSubtitles ? 'Dual' : (!selectedSubLanguage || selectedSubLanguage === 'none' ? 'Off' : (selectedSubLanguage.startsWith?.('embedded-') ? (embeddedTracks.find(t => t.id === selectedSubLanguage)?.label || 'Embedded') : (LANGUAGE_NAMES[selectedSubLanguage] || (selectedSubLanguage || '').toUpperCase())))} ›
                  </span>
                </div>
              )}
              {isAudioEnabled && (
                <div 
                  className="settings-item" 
                  role="button"
                  tabIndex={0}
                  aria-label={`Audio language: ${getAudioLanguageLabel(selectedAudioLanguage)}`}
                  onClick={() => setActiveMenu('audio')}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveMenu('audio')}
                >
                  <span>Audio Language</span>
                  <span className="value-label">
                    {getAudioLanguageLabel(selectedAudioLanguage)} ›
                  </span>
                </div>
              )}
              {isQualityEnabled && (
                <div className="settings-item" onClick={() => setActiveMenu('quality')}>
                  <span>Quality</span>
                  <span className="value-label">{selectedQuality} ›</span>
                </div>
              )}
            </div>
          )}

          {activeMenu === 'speed' && (
            <div className="settings-submenu" style={{ padding: '6px 0' }}>
              <div 
                className="submenu-header" 
                onClick={() => setActiveMenu('main')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  cursor: 'pointer', 
                  padding: '10px 16px', 
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#ffffff',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'translateY(-1px)' }}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                <span>Playback speed</span>
              </div>
              
              {/* Big Centered Current Speed Display */}
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '18px 0 10px 0', fontFamily: 'system-ui, sans-serif' }}>
                {playbackRate.toFixed(2)}x
              </div>

              {/* Slider Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', gap: '10px', marginBottom: '18px' }}>
                <button
                  type="button"
                  onClick={() => setPlaybackRate(prev => Math.max(0.25, parseFloat((prev - 0.05).toFixed(2))))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    paddingBottom: '2px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  —
                </button>
                <input 
                  type="range"
                  min="0.25"
                  max="3.0"
                  step="0.05"
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                  style={{
                    flexGrow: 1,
                    height: '4px',
                    background: `linear-gradient(to right, #ffffff 0%, #ffffff ${((playbackRate - 0.25) / 2.75) * 100}%, rgba(255, 255, 255, 0.15) ${((playbackRate - 0.25) / 2.75) * 100}%, rgba(255, 255, 255, 0.15) 100%)`,
                    borderRadius: '2px',
                    outline: 'none',
                    WebkitAppearance: 'none',
                    cursor: 'pointer',
                    margin: 0
                  }}
                  className="speed-range-input-custom"
                />
                <button
                  type="button"
                  onClick={() => setPlaybackRate(prev => Math.min(3.0, parseFloat((prev + 0.05).toFixed(2))))}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  +
                </button>
              </div>

              {/* Horizontal Presets Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px 12px 16px', gap: '4px', borderBottom: 'none' }}>
                {/* 1.0 Preset */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                  <button
                    type="button"
                    onClick={() => setPlaybackRate(1.0)}
                    style={{
                      height: '28px',
                      backgroundColor: Math.abs(playbackRate - 1.0) < 0.01 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: Math.abs(playbackRate - 1.0) < 0.01 ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '14px',
                      color: '#ffffff',
                      padding: '0 12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    1.0
                  </button>
                  <span style={{ fontSize: '9px', color: '#9ca3af', fontWeight: '500' }}>Normal</span>
                </div>

                {/* 1.25 Preset */}
                <button
                  type="button"
                  onClick={() => setPlaybackRate(1.25)}
                  style={{
                    height: '28px',
                    backgroundColor: Math.abs(playbackRate - 1.25) < 0.01 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: Math.abs(playbackRate - 1.25) < 0.01 ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    color: '#ffffff',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  1.25
                </button>

                {/* 1.5 Preset */}
                <button
                  type="button"
                  onClick={() => setPlaybackRate(1.5)}
                  style={{
                    height: '28px',
                    backgroundColor: Math.abs(playbackRate - 1.5) < 0.01 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: Math.abs(playbackRate - 1.5) < 0.01 ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    color: '#ffffff',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  1.5
                </button>

                {/* 2.0 Preset */}
                <button
                  type="button"
                  onClick={() => setPlaybackRate(2.0)}
                  style={{
                    height: '28px',
                    backgroundColor: Math.abs(playbackRate - 2.0) < 0.01 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: Math.abs(playbackRate - 2.0) < 0.01 ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    color: '#ffffff',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  2.0
                </button>

                {/* 3.0 Preset */}
                <button
                  type="button"
                  onClick={() => setPlaybackRate(3.0)}
                  style={{
                    height: '28px',
                    backgroundColor: Math.abs(playbackRate - 3.0) < 0.01 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    border: Math.abs(playbackRate - 3.0) < 0.01 ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    color: '#ffffff',
                    padding: '0 12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  3.0
                </button>
              </div>
            </div>
          )}

          {activeMenu === 'subtitles' && (
            <div className="settings-submenu" style={{ flex: 1, maxHeight: '320px', display: 'flex', flexDirection: 'column' }}>
              <div className="submenu-header" onClick={() => setActiveMenu('main')}>
                ‹ Subtitles/CC
              </div>
              
              {/* Search input field */}
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', boxSizing: 'border-box' }}>
                <input
                  type="text"
                  placeholder="Search language..."
                  value={subtitlesSearchQuery}
                  onChange={(e) => setSubtitlesSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: '#fff',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Scrollable list */}
              <div className="custom-scrollbar" style={{ overflowY: 'auto', flex: 1, minHeight: '140px', maxHeight: '200px', paddingBottom: '8px' }}>
                {(!subtitlesSearchQuery || 'off'.includes(subtitlesSearchQuery.toLowerCase())) && (
                  <div
                    className={`submenu-item ${selectedSubLanguage === 'none' && !isDualSubtitles ? 'active' : ''}`}
                    style={{ padding: '6px 16px' }}
                    onClick={() => {
                      setSelectedSubLanguage('none');
                      setIsDualSubtitles(false);
                      setIsSettingsOpen(false);
                      setActiveMenu('main');
                      onSubLanguageChange?.('none');
                      requestAnimationFrame(() => paintSingleFrame());
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {selectedSubLanguage === 'none' && !isDualSubtitles && <CheckIcon />}
                      <span>Off</span>
                    </div>
                  </div>
                )}

                {/* Render Embedded (extracted) tracks */}
                {embeddedTracks.map((track) => {
                  const isSelected = selectedSubLanguage === track.id;
                  if (subtitlesSearchQuery && !track.label.toLowerCase().includes(subtitlesSearchQuery.toLowerCase())) {
                    return null;
                  }
                  return (
                    <div
                      key={track.id}
                      className={`submenu-item ${!isDualSubtitles && isSelected ? 'active' : ''}`}
                      style={{ padding: '6px 16px', color: '#10b981' }}
                      onClick={() => {
                        setSelectedSubLanguage(track.id);
                        setIsDualSubtitles(false);
                        setIsSettingsOpen(false);
                        setActiveMenu('main');
                        onSubLanguageChange?.(track.id);
                        requestAnimationFrame(() => paintSingleFrame());
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!isDualSubtitles && isSelected && <CheckIcon />}
                        <span style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '190px' }}>
                          🎥 {track.label} (Embedded)
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Local user-uploaded subtitle files */}
                {Object.keys(localSubtitles).map((fileName) => (
                  <div
                    key={fileName}
                    className={`submenu-item ${!isDualSubtitles && selectedSubLanguage === fileName ? 'active' : ''}`}
                    style={{ padding: '6px 16px', color: '#818cf8' }}
                    onClick={() => {
                      setSelectedSubLanguage(fileName);
                      setIsDualSubtitles(false);
                      setIsSettingsOpen(false);
                      setActiveMenu('main');
                      onSubLanguageChange?.(fileName);
                      requestAnimationFrame(() => paintSingleFrame());
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {!isDualSubtitles && selectedSubLanguage === fileName && <CheckIcon />}
                      <span style={{ fontSize: '11px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '190px' }}>
                        📄 {fileName}
                      </span>
                    </div>
                  </div>
                ))}

                {availableSubLangs.length >= 2 && (!subtitlesSearchQuery || 'dual'.includes(subtitlesSearchQuery.toLowerCase())) && (
                  <div
                    className={`submenu-item ${isDualSubtitles ? 'active' : ''}`}
                    style={{ padding: '6px 16px' }}
                    onClick={() => {
                      setIsDualSubtitles(true);
                      setIsSettingsOpen(false);
                      setActiveMenu('main');
                      requestAnimationFrame(() => paintSingleFrame());
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {isDualSubtitles && <CheckIcon />}
                      <span>{dualSubtitleLabel}</span>
                    </div>
                  </div>
                )}

                {sortedAndFilteredLangs.map((langObj) => {
                  const lang = langObj.code;
                  return (
                    <div
                      key={lang}
                      className={`submenu-item ${!isDualSubtitles && selectedSubLanguage === lang ? 'active' : ''}`}
                      style={{ padding: '6px 16px' }}
                      onClick={() => {
                        setSelectedSubLanguage(lang);
                        setIsDualSubtitles(false);
                        setIsSettingsOpen(false);
                        setActiveMenu('main');
                        onSubLanguageChange?.(lang);
                        requestAnimationFrame(() => paintSingleFrame());
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {!isDualSubtitles && selectedSubLanguage === lang && <CheckIcon />}
                        <span>{langObj.name}</span>
                      </div>
                    </div>
                  );
                })}

                {sortedAndFilteredLangs.length === 0 && Object.keys(localSubtitles).length === 0 && embeddedTracks.length === 0 && (
                  <div style={{ padding: '16px 12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
                    No subtitle languages found
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMenu === 'audio' && (
            <div className="settings-submenu" role="menu" aria-label="Audio language settings">
              <div
                className="submenu-header"
                role="button"
                tabIndex={0}
                aria-label="Back to settings"
                onClick={() => setActiveMenu('main')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveMenu('main')}
              >
                ‹ Back to Settings
              </div>
              <div
                className={`submenu-item ${(selectedAudioLanguage === 'original' || selectedAudioLanguage === effectiveSourceLang) ? 'active' : ''}`}
                role="menuitemradio"
                aria-checked={selectedAudioLanguage === 'original' || selectedAudioLanguage === effectiveSourceLang}
                tabIndex={0}
                onClick={() => handleAudioLanguageChange('original')}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAudioLanguageChange('original')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {(selectedAudioLanguage === 'original' || selectedAudioLanguage === effectiveSourceLang) && <CheckIcon />}
                  <span>{getAudioLanguageLabel('original')}</span>
                </div>
              </div>
              {Object.keys(activeAudioTrackMap).filter(lang => lang !== effectiveSourceLang && !activeAudioTrackMap[lang]?.source).map((lang) => (
                <div
                  key={lang}
                  className={`submenu-item ${selectedAudioLanguage === lang ? 'active' : ''}`}
                  role="menuitemradio"
                  aria-checked={selectedAudioLanguage === lang}
                  tabIndex={0}
                  onClick={() => handleAudioLanguageChange(lang)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAudioLanguageChange(lang)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {selectedAudioLanguage === lang && <CheckIcon />}
                    <span>{getAudioLanguageLabel(lang)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeMenu === 'quality' && (
            <div className="settings-submenu">
              <div className="submenu-header" onClick={() => setActiveMenu('main')}>
                ‹ Back to Settings
              </div>
              {hlsRef.current && (
                <div
                  className={`submenu-item ${selectedQuality === 'Auto' ? 'active' : ''}`}
                  onClick={handleAutoQuality}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {selectedQuality === 'Auto' && <CheckIcon />}
                    <span>Auto</span>
                  </div>
                </div>
              )}
              {displayQualities.map((q) => {
                const isHD = q.label.includes('1080') || q.label.includes('720') || q.label.includes('1440') || q.label.includes('2160');
                const badgeText = q.label.includes('2160') ? '4K' : 'HD';
                return (
                  <div
                    key={q.label}
                    className={`submenu-item ${selectedQuality === q.label ? 'active' : ''}`}
                    onClick={() => handleQualityChange(q)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {selectedQuality === q.label && <CheckIcon />}
                        <span>
                          {q.label}
                          {isHD && (
                            <sup style={{ fontSize: '8px', marginLeft: '4px', color: '#818cf8', fontWeight: 'bold' }}>
                              {badgeText}
                            </sup>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        accept=".vtt,.srt"
        onChange={handleLocalSubtitleUpload}
        style={{ display: 'none' }}
      />
      <SubtitleEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        subtitles={combinedSubtitles}
        onUpdateSubtitles={(lang, newVtt) => {
          if (newVtt === null) {
            setLocalSubtitles(prev => {
              const copy = { ...prev };
              delete copy[lang];
              return copy;
            });
            onUpdateSubtitles?.(lang, null);
          } else {
            setLocalSubtitles(prev => ({
              ...prev,
              [lang]: newVtt
            }));
            onUpdateSubtitles?.(lang, newVtt);
          }
          requestAnimationFrame(() => paintSingleFrame());
        }}
        currentTime={currentTime}
        onSeekTo={(t) => {
          if (offscreenVideoRef.current) offscreenVideoRef.current.currentTime = t;
          setCurrentTime(t);
        }}
      />
    </div>
  );
});

TaviVideoPlayer.displayName = 'TaviVideoPlayer';
export default TaviVideoPlayer;
