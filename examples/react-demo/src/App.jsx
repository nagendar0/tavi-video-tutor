import React, { useState, useMemo, useEffect } from 'react';
import { AITutor } from 'tavi-video-tutor';
import 'tavi-video-tutor/dist/style.css';
import { transcribeVideoAudio, batchTranslateSubtitles } from '../../../packages/tavi-video-tutor/src/services/AITranscriber.js';

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

const LANGUAGES = Object.keys(LANGUAGE_NAMES).map(code => ({
  code,
  name: LANGUAGE_NAMES[code] || code.toUpperCase()
})).sort((a, b) => a.name.localeCompare(b.name));


function SearchableLanguageDropdown({ selectedValue, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLanguage = useMemo(() => {
    return LANGUAGES.find(lang => lang.code === selectedValue) || { code: selectedValue, name: selectedValue.toUpperCase() };
  }, [selectedValue]);

  const filteredLanguages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return LANGUAGES;
    return LANGUAGES.filter(lang => 
      lang.name.toLowerCase().includes(query) || 
      lang.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div style={{ position: 'relative', width: '280px' }}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      {isOpen && (
        <div 
          onClick={() => {
            setIsOpen(false);
            setSearchQuery('');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998,
            backgroundColor: 'transparent'
          }}
        />
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '10px 16px',
          fontSize: '14px',
          color: '#fff',
          cursor: 'pointer',
          outline: 'none',
          textAlign: 'left',
          transition: 'all 0.2s ease',
          zIndex: 997,
        }}
      >
        <span>{selectedLanguage.name} ({selectedLanguage.code.toUpperCase()})</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: '#9ca3af'
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          padding: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '320px',
          overflow: 'hidden'
        }}>
          <input
            type="text"
            placeholder="Search language..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#fff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <div 
            className="custom-scrollbar"
            style={{
              overflowY: 'auto',
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              paddingRight: '4px'
            }}
          >
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map(lang => {
                const isSelected = lang.code === selectedValue;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onChange(lang.code);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    type="button"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: isSelected ? '#a5b4fc' : '#d1d5db',
                      backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      outline: 'none'
                    }}
                  >
                    {lang.name} ({lang.code.toUpperCase()})
                  </button>
                );
              })
            ) : (
              <div style={{
                padding: '12px 8px',
                fontSize: '13px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


const PRESETS = [
  {
    name: 'Recorded Demo Video (demo-video.mp4)',
    src: '/demo-video.mp4',
    qualities: [
      { label: 'Original', src: '/demo-video.mp4' }
    ]
  },
  {
    name: 'Local Test Video (sample.mp4)',
    src: '/sample.mp4',
    qualities: []
  },
  {
    name: 'Adaptive HLS Stream (Mux)',
    src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    qualities: [] // Dynamic from HLS Manifest
  },
  {
    name: 'Sintel (Fantasy)',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    qualities: []
  },
  {
    name: 'Big Buck Bunny (HD)',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    qualities: []
  },
  {
    name: 'Tears of Steel (Sci-Fi)',
    src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    qualities: []
  }
];

function App() {
  const [activePresetIndex, setActivePresetIndex] = useState(1);
  const [customUrl, setCustomUrl] = useState('');
  const [videoSrc, setVideoSrc] = useState(PRESETS[1].src);
  const [videoQualities, setVideoQualities] = useState(PRESETS[1].qualities);
  const [selectedLang, setSelectedLang] = useState('en');
  const [generatedVtt, setGeneratedVtt] = useState(null);
  const [customSubtitles, setCustomSubtitles] = useState({});
  const [autoGenProgress, setAutoGenProgress] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setGeneratedVtt(null);
    setAutoGenProgress('');
  }, [videoSrc]);

  const activeSubtitles = useMemo(() => {
    return customSubtitles;
  }, [customSubtitles]);

  const handleAutoGenerateAllSubtitles = async () => {
    setIsGenerating(true);
    setAutoGenProgress('Initializing AI Speech-to-Text Transcriber...');
    try {
      const baseVtt = await transcribeVideoAudio(videoSrc, (p) => {
        setAutoGenProgress(p.message || 'Transcribing audio...');
      });

      setCustomSubtitles(prev => ({ ...prev, en: baseVtt }));
      setSelectedLang('en');

      const targetLangs = LANGUAGES;
      await batchTranslateSubtitles(baseVtt, targetLangs, (p, langCode, vtt) => {
        setAutoGenProgress(p.message);
        if (langCode && vtt) {
          setCustomSubtitles(prev => ({
            ...prev,
            [langCode]: vtt
          }));
        }
      });

      // Clear progress message after completion so it hides automatically
      setAutoGenProgress('');
      setGeneratedVtt(baseVtt);
    } catch (err) {
      setAutoGenProgress('Error: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Mock audio voice dub (Google Assistant test ambient sound)
  const sampleAudioDubs = {
    hi: 'https://actions.google.com/sounds/v1/ambiences/morning_birds.ogg'
  };

  const handleSelectPreset = (index) => {
    setActivePresetIndex(index);
    setVideoSrc(PRESETS[index].src);
    setVideoQualities(PRESETS[index].qualities);
    setCustomUrl('');
  };

  const handleLoadCustomUrl = (e) => {
    e.preventDefault();
    const url = customUrl.trim();
    if (url) {
      setActivePresetIndex(-1);
      setVideoSrc(url);
      
      // A single MP4 has one encoded rendition. Alternative choices are only
      // shown when a real HLS manifest or distinct rendition URLs are supplied.
      setVideoQualities([]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#090d16',
      backgroundImage: 'radial-gradient(at top, rgba(99, 102, 241, 0.15) 0px, transparent 50%), radial-gradient(at bottom, rgba(15, 23, 42, 0.4) 0px, transparent 100%)',
      padding: '40px 20px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#f3f4f6'
    }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          margin: '0 0 10px 0',
          fontSize: '32px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.025em'
        }}>
          AI Tutor Video Workspace
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#9ca3af', fontWeight: '400' }}>
          Zero-Dependency Canvas & WebCodecs Player Demo
        </p>
      </header>

      <div style={{
        width: '100%',
        maxWidth: '900px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* URL Input and Presets Container */}
        <section style={{
          background: 'rgba(17, 24, 39, 0.45)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 16px 0', color: '#a5b4fc' }}>
            Testing Controller
          </h2>
          
          {/* Custom URL form */}
          <form onSubmit={handleLoadCustomUrl} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="url"
              placeholder="Paste any MP4 / WebM video link here..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              style={{
                flexGrow: 1,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '14px',
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
            >
              Load Link
            </button>
          </form>

          {/* Presets Selectors */}
          <div>
            <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
              Quick Presets
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {PRESETS.map((preset, idx) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(idx)}
                  style={{
                    backgroundColor: activePresetIndex === idx ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid',
                    borderColor: activePresetIndex === idx ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: activePresetIndex === idx ? '#a5b4fc' : '#d1d5db',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    if (activePresetIndex !== idx) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (activePresetIndex !== idx) {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    }
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subtitle Selector in Testing Controller Card */}
          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <span style={{ fontSize: '13px', color: '#9ca3af', display: 'block', marginBottom: '8px' }}>
              Select Subtitle Language (Testing Controller)
            </span>
            <SearchableLanguageDropdown 
              selectedValue={selectedLang} 
              onChange={setSelectedLang} 
            />
          </div>
        </section>

        {/* Video Player Display */}
        <main style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <AITutor
            src={videoSrc}
            subLanguage={selectedLang}
            defaultSubLanguage={selectedLang}
            subtitles={activeSubtitles}
            audioDubs={sampleAudioDubs}
            qualities={videoQualities}
            onSubLanguageChange={setSelectedLang}
            onSubtitleGenerated={(vtt) => {
              console.log("✨ AI Subtitles Generated (VTT format):\n", vtt);
              setGeneratedVtt(vtt);
            }}
            onTracksChange={(tracks) => {
              console.log("✨ Automated config.file.tracks Array Updated (100+ languages):", tracks);
            }}
            onUpdateSubtitles={(lang, newVtt) => {
              if (newVtt === null) {
                setCustomSubtitles(prev => {
                  const copy = { ...prev };
                  delete copy[lang];
                  return copy;
                });
              } else {
                setCustomSubtitles(prev => ({
                  ...prev,
                  [lang]: newVtt
                }));
              }
            }}
          />
        </main>

        {generatedVtt && (
          <div style={{
            background: 'rgba(129, 140, 248, 0.1)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(129, 140, 248, 0.2)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontWeight: '600', color: '#a5b4fc', display: 'block', fontSize: '14px', marginBottom: '4px' }}>
                ✨ AI Subtitles Generated Successfully!
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                The VTT file was saved in the user's IndexedDB browser cache. It is now logged in the developer console.
              </span>
            </div>
            <button
              onClick={() => {
                const blob = new Blob([generatedVtt], { type: 'text/vtt' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'subtitles.vtt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                backgroundColor: '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
              }}
            >
              Download .vtt File
            </button>
          </div>
        )}
        
        {/* Instructions footer */}
        <footer style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '12px' }}>
          💡 Tip: Focus the player to use keyboard shortcuts (Space to Play/Pause, M to Mute, C for Subtitles, F for Fullscreen)
        </footer>
      </div>
    </div>
  );
}

export default App;
