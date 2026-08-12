import AITutor from './components/AITutor.jsx';
import TaviVideoPlayer from './components/TaviVideoPlayer.jsx';
import { SubtitleEditorModal } from './components/SubtitleEditorModal.jsx';
import { resolveSubtitleSources, resolveSubtitleVisibility, resolveSubtitleAvailability } from './subtitles/resolver/subtitleResolver.js';
import { resolveQualitySources } from './subtitles/resolver/qualityResolver.js';
import { resolveAudioSources, resolveAudioAvailability } from './subtitles/resolver/audioResolver.js';

export {
  AITutor,
  TaviVideoPlayer,
  SubtitleEditorModal,
  resolveSubtitleSources,
  resolveSubtitleVisibility,
  resolveSubtitleAvailability,
  resolveQualitySources,
  resolveAudioSources,
  resolveAudioAvailability
};

export default AITutor;
