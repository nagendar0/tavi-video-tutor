import { useState, useMemo, useEffect } from 'react';
import { AITutor } from 'tavi-video-tutor';
import 'tavi-video-tutor/dist/style.css';
import { AITUTOR_LANGUAGES } from '../../../packages/tavi-video-tutor/src/subtitles/languages/registry.js';

const NEURAL_13 = ['en', 'hi', 'te', 'es', 'ta', 'ja', 'fr', 'de', 'zh', 'ar', 'pt', 'it', 'ru'];
const FIVE_LANGS = ['en', 'hi', 'te', 'es', 'fr'];
const SIX_LANGS = ['en', 'hi', 'te', 'es', 'fr', 'de'];

const SILENT_AUDIO = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

export default function QAApp() {
  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const initialScenario = urlParams.get('scenario') || '13lang';

  const [scenario, setScenario] = useState(initialScenario);
  const [audioEvents, setAudioEvents] = useState([]);
  const [currentAudio, setCurrentAudio] = useState('en');

  // Build dubs mapping for scenarios
  const scenarioConfig = useMemo(() => {
    let languages = [];
    if (scenario === '5lang') languages = FIVE_LANGS;
    else if (scenario === '6lang') languages = SIX_LANGS;
    else if (scenario === '13lang') languages = NEURAL_13;
    else if (scenario === '109lang') languages = AITUTOR_LANGUAGES.map(l => l.code);
    else languages = NEURAL_13;

    const dubs = {};
    for (const code of languages) {
      if (code !== 'en') {
        dubs[code] = SILENT_AUDIO;
      }
    }

    return {
      languages,
      dubs,
      totalCount: languages.length
    };
  }, [scenario]);

  const handleAudioLanguageChange = (evt) => {
    console.log('[QAApp] onAudioLanguageChange:', evt);
    setCurrentAudio(evt.language);
    setAudioEvents(prev => [...prev, evt]);
  };

  useEffect(() => {
    // Expose QA state to window for Puppeteer assertion access
    window.__QA_STATE__ = {
      scenario,
      currentAudio,
      audioEvents,
      totalLanguages: scenarioConfig.totalCount
    };
  }, [scenario, currentAudio, audioEvents, scenarioConfig]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <h1 style={{ margin: '0 0 12px 0', fontSize: '22px' }}>Real Browser Visual QA - Language Selector</h1>
        
        {/* Scenario Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#9ca3af' }}>Select Scenario:</span>
          <button 
            id="btn-5lang"
            onClick={() => setScenario('5lang')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: scenario === '5lang' ? '#4f46e5' : '#1f2937',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            1. 5 Languages (No Search)
          </button>
          <button 
            id="btn-6lang"
            onClick={() => setScenario('6lang')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: scenario === '6lang' ? '#4f46e5' : '#1f2937',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            2. 6 Languages (Search Active)
          </button>
          <button 
            id="btn-13lang"
            onClick={() => setScenario('13lang')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: scenario === '13lang' ? '#4f46e5' : '#1f2937',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            3. 13 Languages (Neural TTS)
          </button>
          <button 
            id="btn-109lang"
            onClick={() => setScenario('109lang')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: scenario === '109lang' ? '#4f46e5' : '#1f2937',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            4. 109 Languages (Full Registry)
          </button>
        </div>

        <div style={{ marginTop: '12px', fontSize: '13px', color: '#9ca3af', display: 'flex', gap: '20px' }}>
          <span>Current Scenario: <strong id="current-scenario" style={{ color: '#818cf8' }}>{scenario}</strong></span>
          <span>Available Languages: <strong id="total-langs-count" style={{ color: '#818cf8' }}>{scenarioConfig.totalCount}</strong></span>
          <span>Active Audio: <strong id="active-audio-lang" style={{ color: '#10b981' }}>{currentAudio}</strong></span>
        </div>
      </header>

      {/* Video Player Container */}
      <div 
        id="player-container"
        style={{ 
          width: '100%', 
          maxWidth: '900px', 
          height: '520px', 
          backgroundColor: '#000', 
          borderRadius: '12px', 
          overflow: 'hidden', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          position: 'relative'
        }}
      >
        <AITutor
          src="/demo-video.mp4"
          sourceLanguage="en"
          audioLanguages={scenarioConfig.languages}
          audioDubs={scenarioConfig.dubs}
          onAudioLanguageChange={handleAudioLanguageChange}
        />
      </div>

      {/* Event Logs for Test Assertion Verification */}
      <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#111827', borderRadius: '8px', fontSize: '12px' }}>
        <span style={{ fontWeight: 600, color: '#9ca3af' }}>Audio Event Log:</span>
        <div id="audio-event-log" style={{ marginTop: '6px', maxHeight: '100px', overflowY: 'auto' }}>
          {audioEvents.map((ev, i) => (
            <div key={i} style={{ color: '#34d399', fontFamily: 'monospace' }}>
              #{i + 1}: Language switched to &quot;{ev.language}&quot; (from &quot;{ev.previousLanguage}&quot;, source: {ev.source})
            </div>
          ))}
          {audioEvents.length === 0 && <span style={{ color: '#6b7280' }}>No audio change events yet.</span>}
        </div>
      </div>
    </div>
  );
}
