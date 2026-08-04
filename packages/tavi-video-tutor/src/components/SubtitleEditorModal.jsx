import React, { useState, useEffect } from 'react';
import { parseWebVTT } from './SubtitleEngine.jsx';

const formatSeconds = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    const h = parseFloat(parts[0]);
    const m = parseFloat(parts[1]);
    const s = parseFloat(parts[2]);
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const m = parseFloat(parts[0]);
    const s = parseFloat(parts[1]);
    return m * 60 + s;
  }
  return parseFloat(timeStr) || 0;
};

export const SubtitleEditorModal = ({
  isOpen,
  onClose,
  subtitles = {},
  onUpdateSubtitles,
  currentTime = 0,
  onSeekTo
}) => {
  const availableLangs = Object.keys(subtitles);
  const [selectedLang, setSelectedLang] = useState(availableLangs[0] || 'en');
  const [cues, setCues] = useState([]);

  useEffect(() => {
    if (availableLangs.length > 0 && !subtitles[selectedLang]) {
      setSelectedLang(availableLangs[0]);
    }
  }, [subtitles]);

  useEffect(() => {
    const rawVtt = subtitles[selectedLang] || '';
    const parsed = parseWebVTT(rawVtt);
    setCues(parsed.map(c => ({
      id: c.id || Math.random().toString(36).substr(2, 9),
      start: c.start,
      end: c.end,
      startStr: formatSeconds(c.start),
      endStr: formatSeconds(c.end),
      text: c.text
    })));
  }, [selectedLang, subtitles]);

  if (!isOpen) return null;

  const handleSaveVtt = (updatedCues) => {
    let vtt = 'WEBVTT\n\n';
    updatedCues.forEach((cue, index) => {
      const startStr = formatSeconds(cue.start);
      const endStr = formatSeconds(cue.end);
      vtt += `${index + 1}\n${startStr} --> ${endStr}\n${cue.text.trim()}\n\n`;
    });
    onUpdateSubtitles?.(selectedLang, vtt);
  };

  const handleCueTextChange = (id, newText) => {
    const updated = cues.map(c => c.id === id ? { ...c, text: newText } : c);
    setCues(updated);
    handleSaveVtt(updated);
  };

  const handleTimestampChange = (id, field, valueStr) => {
    const sec = parseTimeToSeconds(valueStr);
    const updated = cues.map(c => {
      if (c.id === id) {
        return {
          ...c,
          [field]: sec,
          [`${field}Str`]: valueStr
        };
      }
      return c;
    });
    setCues(updated);
    handleSaveVtt(updated);
  };

  const handleDeleteCue = (id) => {
    const updated = cues.filter(c => c.id !== id);
    setCues(updated);
    handleSaveVtt(updated);
  };

  const handleAddCueAtCurrentTime = () => {
    const start = currentTime;
    const end = currentTime + 3.0;
    const newCue = {
      id: Math.random().toString(36).substr(2, 9),
      start,
      end,
      startStr: formatSeconds(start),
      endStr: formatSeconds(end),
      text: 'New subtitle cue text'
    };
    const updated = [...cues, newCue].sort((a, b) => a.start - b.start);
    setCues(updated);
    handleSaveVtt(updated);
  };

  const handleDeleteTrack = () => {
    if (confirm(`Delete all subtitles for language "${selectedLang.toUpperCase()}"?`)) {
      onUpdateSubtitles?.(selectedLang, null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '85vh',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>✏️ Subtitle Cue Editor & Sync Manager</span>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '13px', color: '#94a3b8' }}>Language Track:</label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 12px',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {availableLangs.map(code => (
                <option key={code} value={code} style={{ backgroundColor: '#0f172a' }}>
                  {code.toUpperCase()} ({subtitles[code] ? `${parseWebVTT(subtitles[code]).length} cues` : 'Empty'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleAddCueAtCurrentTime}
              style={{
                backgroundColor: '#6366f1',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              + Add Cue @ {formatSeconds(currentTime)}
            </button>
            <button
              onClick={handleDeleteTrack}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#f87171',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              🗑️ Delete Track
            </button>
          </div>
        </div>

        {/* Cues List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {cues.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '14px' }}>
              No subtitle cues found for this language. Click "+ Add Cue" to create one!
            </div>
          ) : (
            cues.map((cue, idx) => (
              <div
                key={cue.id}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: 'bold' }}>#{idx + 1}</span>
                    <button
                      onClick={() => onSeekTo?.(cue.start)}
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#818cf8',
                        fontSize: '11px',
                        padding: '2px 8px',
                        cursor: 'pointer'
                      }}
                    >
                      ▶ Seek
                    </button>
                    <input
                      type="text"
                      value={cue.startStr}
                      onChange={(e) => handleTimestampChange(cue.id, 'start', e.target.value)}
                      style={{
                        width: '100px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: '#38bdf8',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>➔</span>
                    <input
                      type="text"
                      value={cue.endStr}
                      onChange={(e) => handleTimestampChange(cue.id, 'end', e.target.value)}
                      style={{
                        width: '100px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        color: '#38bdf8',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteCue(cue.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                    title="Delete cue"
                  >
                    🗑️
                  </button>
                </div>

                <input
                  type="text"
                  value={cue.text}
                  onChange={(e) => handleCueTextChange(cue.id, e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    color: '#f8fafc',
                    padding: '8px 12px',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              padding: '8px 18px',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Close & Done
          </button>
        </div>
      </div>
    </div>
  );
};
