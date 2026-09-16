# Changelog

All notable changes to the `tavi-video-tutor` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.1] - 2026-09-15

### Security & Hardening
- **Complete SSRF Protection with IP Pinning**:
  - Implemented DNS resolution with IP pinning (`net.isIP`, custom HTTP/HTTPS agent lookups) in `resolveVideo.js` to prevent Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding attacks.
  - Added strict validation for literal IPs (IPv4 decimal, octal, hex representations, IPv6, IPv4-mapped IPv6) and restricted hostnames.
  - Enforced protocol restrictions (HTTP and HTTPS only; `file:`, `gopher:`, `ftp:` rejected).
  - Enforced connection timeouts (30s), maximum redirect hops (5), and response body streaming size guards (2 GB limit).
  - Ensured `processVideo` routes remote media through the secure downloader rather than passing unvalidated remote URLs to FFmpeg.

### Audio & Video Validation
- **Zero-Trust Audio Dub Validation**:
  - Added FFmpeg `volumedetect` filter analysis in `validateGeneratedAudio`: rejects near-silent or empty audio files where `max_volume < -50 dB` or `mean_volume < -60 dB` with `SILENT_AUDIO`.
  - Rejects dummy headers and corrupt media containers.
  - Validates expected timeline duration within tolerance.
  - Removed all silent PCM buffers, single-sine, formant dual-sine harmonic voice simulations, and dummy speech mock fallbacks from production execution paths. Explicit test fallback requires explicit test flags and is disabled in production.
- **Video Quality Ladder Hardening**:
  - Enforced that all generated renditions produce browser-native H.264 video and AAC audio (when source contains audio).
  - Enforced duration consistency between renditions and source media.
  - Implemented cache revalidation in `processVideoQuality.js`: cached rendition files on disk are verified against planned dimensions, codecs, and durations before being accepted as cache hits.

### Subtitle Verification & Storage
- **Target-Language Subtitle Verification**:
  - Enhanced `TranslationValidator.validateVttContent` to verify valid WEBVTT headers, valid timestamp arrows, non-empty cues, and expected non-Latin script presence for target languages (Telugu, Hindi, Arabic, Japanese, Chinese, Tamil, etc.).
  - Added duplicate detection: detects and rejects untranslated VTT files that are identical copies of source English cues.
  - Enhanced `ManifestStore.isLanguageCached` to revalidate VTT content on disk, preventing corrupt or untranslated files from masquerading as valid cache hits.
- **Deterministic Manifest Resolution**:
  - Enhanced `loadConfig.js` (`deriveIdFromSrc`) to incorporate parent directory context hash, preventing ID collisions between files with identical basenames (e.g., `courseA/lesson.mp4` vs `courseB/lesson.mp4`).
  - Added `clearManifestCache()` and path normalization in `src/services/manifestStore.js`.

### Browser Performance & Memory Management
- **Object URL Lifecycle Management**:
  - Moved `URL.createObjectURL` out of `useMemo` render phase into a managed `useEffect` in `TaviVideoPlayer.jsx`.
  - Added tracking with immediate revocation of superseded URLs and guaranteed cleanup on component unmount.
- **IndexedDB Connection Lifecycle**:
  - Implemented singleton connection management and `closeDB()` in `IndexedDBCache.js`, eliminating open connection leaks and `versionchange` blocking.

### Packaging & Developer Experience
- **Package Exports & Demo Decoupling**:
  - Configured `examples/react-demo` to consume the built distribution artifacts (`dist/tavi-video-tutor.js`, `dist/tavi-video-tutor.css`) instead of source code aliases.
  - Removed unused internal imports from demo application.
  - Added `--help` and `--version` support to `aitutor` CLI binary.
  - Added standalone package tarball consumer smoke test (`scripts/smokeTestTarball.js`).
  - Added CI workflow (`.github/workflows/ci.yml`) covering multi-version Node.js matrix, unit tests, real-media integration tests, and tarball smoke tests.
