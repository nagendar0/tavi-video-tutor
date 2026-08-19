import AITutor from './components/AITutor.jsx';
import TaviVideoPlayer from './components/TaviVideoPlayer.jsx';
import { SubtitleEditorModal } from './components/SubtitleEditorModal.jsx';
import { resolveSubtitleSources, resolveSubtitleVisibility, resolveSubtitleAvailability, emitSubtitleDXWarning, clearWarnedSubtitleCache } from './subtitles/resolver/subtitleResolver.js';
import { resolveQualitySources, resolveQualityAvailability, emitQualityDXWarning, clearWarnedQualityCache } from './subtitles/resolver/qualityResolver.js';
import { resolveAudioSources, resolveAudioAvailability, emitAudioDXWarning, clearWarnedAudioCache } from './subtitles/resolver/audioResolver.js';

export {
  AITutor,
  TaviVideoPlayer,
  SubtitleEditorModal,
  resolveSubtitleSources,
  resolveSubtitleVisibility,
  resolveSubtitleAvailability,
  emitSubtitleDXWarning,
  clearWarnedSubtitleCache,
  resolveQualitySources,
  resolveQualityAvailability,
  emitQualityDXWarning,
  clearWarnedQualityCache,
  resolveAudioSources,
  resolveAudioAvailability,
  emitAudioDXWarning,
  clearWarnedAudioCache
};
export default AITutor;
