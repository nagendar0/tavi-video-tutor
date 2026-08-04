# Original User Request

## Initial Request — 2026-07-16T05:29:42Z

Translate the existing video subtitles into over 100 specified languages, integrate them into the AI Video Tutor player with a searchable dropdown menu, and optimize subtitle rendering to ensure zero latency.

Working directory: c:\Users\nagen\ai-tutor-system
Integrity mode: development

## Target Languages:
Afrikaans (af) — Afrikaans
Albanian (sq) — Shqip
Amharic (am) — አማርኛ
Arabic (ar) — العربية
Armenian (hy) — Հայերեն
Assamese (as) — অসমীয়া
Azerbaijani (az) — Azərbaycan
Basque (eu) — Euskara
Belarusian (be) — Беларуская
Bengali (bn) — বাংলা
Bhojpuri (bho) — भोजपुरी
Bislama (bi) — Bislama
Bulgarian (bg) — Български
Burmese (my) — မြန်မာဘာသာ
Cantonese (yue) — 廣東話
Catalan (ca) — Català
Cebuano (ceb) — Cebuano
Chamorro (ch) — Chamorro
Chinese (Mandarin) (zh) — 中文
Croatian (hr) — Hrvatski
Czech (cs) — Čeština
Danish (da) — Dansk
Dogri (doi) — डोगरी
Dutch (nl) — Nederlands
English (en) — English
Estonian (et) — Eesti
Fijian (fj) — Na Vosa Vakaviti
Filipino (Tagalog) (tl) — Tagalog
Finnish (fi) — Suomi
French (fr) — Français
Galician (gl) — Galego
Georgian (ka) — ქართული
German (de) — Deutsch
Greek (el) — Ελληνικά
Greenlandic (kl) — Kalaallisut
Gujarati (gu) — ગુજરાતી
Hausa (ha) — Hausa
Hawaiian (haw) — Ōlelo Hawaiʻi
Hebrew (he) — עبریות (hebrew text may differ slightly)
Hindi (hi) — हिन्दी
Hungarian (hu) — Magyar
Icelandic (is) — Íslenska
Igbo (ig) — Igbo
Indonesian (id) — Bahasa Indonesia
Irish (ga) — Gaeilge
Italian (it) — Italiano
Japanese (ja) — 日本語
Javanese (jv) — Basa Jawa
Kannada (kn) — ಕನ್ನಡ
Kashmiri (ks) — کٲشُر
Kazakh (kk) — Қазақ тілі
Khmer (km) — ភាសាខ្មែរ
Kinyarwanda (rw) — Kinyarwanda
Konkani (kok) — कोंकणी
Korean (ko) — 한국어
Kurdish (ku) — Kurdî
Kyrgyz (ky) — Кыргызча
Lao (lo) — ພາສາລາວ
Latvian (lv) — Latviešu
Lithuanian (lt) — Lietuvių
Luxembourgish (lb) — Lëtzebuergesch
Macedonian (mk) — Македонски
Maithili (mai) — मैथिली
Malagasy (mg) — Malagasy
Malay (ms) — Bahasa Melayu
Malayalam (ml) — മലയാളം
Maltese (mt) — Malti
Manipuri (mni) — මනිපුරි
Māori (mi) — Māori
Marathi (mr) — मराठी
Mongolian (mn) — Монгол
Nepali (ne) — नेपाली
Norwegian (no) — Norsk
Odia (or) — ଓଡ଼ିଆ
Oromo (om) — Oromoo
Pashto (ps) — پښتو
Persian (fa) — فارسی
Polish (pl) — Polski
Portuguese (pt) — Português
Punjabi (pa) — पੰਜਾਬੀ
Romanian (ro) — Română
Russian (ru) — Русский
Samoan (sm) — Gagana Sāmoa
Sanskrit (sa) — संस्कृतम्
Santali (sat) — ᱥᱟᱱᱛᱟᱲᱤ
Serbian (sr) — Српски
Sindhi (sd) — سنڌي
Sinhala (si) — සිංහල
Slovak (sk) — Slovenčina
Slovenian (sl) — Slovenščina
Somali (so) — Soomaali
Spanish (es) — Español
Sundanese (su) — Basa Sunda
Swahili (sw) — Kiswahili
Swedish (sv) — Svenska
Tajik (tg) — Тоҷикӣ
Tamil (ta) — தமிழ்
Telugu (te) — తెలుగు
Thai (th) — ไทย
Tongan (to) — Faka Tonga
Turkish (tr) — Türkçe
Turkmen (tk) — Türkmençe
Ukrainian (uk) — Українська
Urdu (ur) — اردو
Uzbek (uz) — Oʻzbekcha
Vietnamese (vi) — Tiếng Việt
Welsh (cy) — Cymraeg
Xhosa (xh) — isiXhosa
Zulu (zu) — isiZulu

## Requirements

### R1. Multilingual WebVTT Subtitle Generation
- Translate the 3 English demo subtitle cues into the 100+ specified languages using an automated script or API.
- Store these subtitles in a dedicated data file (e.g., `subtitles.js` or directly within `App.jsx`) imported by the React demo application.
- Format all translated subtitles as valid WebVTT structures.

### R2. Searchable Language Dropdown Selector
- Replace or enhance the quick preset buttons with a clean, searchable dropdown menu for language selection in the Testing Controller UI.
- The dropdown must list all 100+ languages with their names and codes (e.g., "Afrikaans (af)").
- Selecting a language should immediately update the player's primary or secondary subtitle track.

### R3. Performance Optimization & Perfect Synchronization
- Optimize subtitle rendering inside the canvas player to ensure subtitles match the exact video timestamps.
- Ensure the render loop updates subtitle layers efficiently, preventing frame drops or synchronization delays.

## Acceptance Criteria

### Completeness & Correctness
- [ ] 100+ subtitle tracks are generated and accessible in the React demo application.
- [ ] Every generated track is a valid WebVTT string containing the translated text for all 3 original cues.
- [ ] Timestamps for all translated tracks match the original English subtitles exactly.

### User Interface
- [ ] A searchable dropdown menu exists in the Testing Controller UI.
- [ ] Typing in the dropdown filters the list of 100+ languages dynamically.
- [ ] Selecting a language from the dropdown updates the subtitle track immediately.

### Verification Plan
- Run `npm run build` inside `examples/react-demo` to ensure there are no compilation or bundling issues.
- Check that the subtitle object contains keys for all 100+ language codes.
