// Lightweight zero-native JavaScript stub for sharp.
// Prevents @xenova/transformers from throwing ESM import errors or requiring C++ native binaries on unsupported host architectures (e.g. Windows ARM64, Linux ARM64).
// AITutor uses @xenova/transformers strictly for audio speech recognition (Whisper) and text translation (NLLB).
function sharpStub() {
  return {};
}

export default sharpStub;
