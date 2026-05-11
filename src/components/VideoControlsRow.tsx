import type { Lang } from '../i18n/langConfig';
import { VideoLanguageControls } from './LiteYouTube';

type Provider = 'youtube' | 'rutube';

type Props = {
  availableLanguages?: Lang[];
  currentLanguage?: Lang;
  onSelectLanguage?: (lang: Lang) => void;
  provider: Provider;
  mirrorLabel?: string;
  mirrorTargetLabel?: string;
  onToggleMirror?: () => void;
};

export function VideoControlsRow({
  availableLanguages,
  currentLanguage,
  onSelectLanguage,
  provider,
  mirrorLabel,
  mirrorTargetLabel,
  onToggleMirror,
}: Props) {
  const hasLanguageControls =
    Boolean(onSelectLanguage) && Boolean(availableLanguages && availableLanguages.length > 1);
  const hasMirror = Boolean(mirrorLabel && onToggleMirror);

  if (!hasLanguageControls && !hasMirror) return null;

  const target = mirrorTargetLabel ?? (provider === 'youtube' ? 'RuTube' : 'YouTube');
  const rowClass = [
    'video-controls-row',
    hasLanguageControls ? 'video-controls-row--has-langs' : '',
    hasMirror ? 'video-controls-row--has-mirror' : '',
    !hasLanguageControls && hasMirror ? 'video-controls-row--mirror-only' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={rowClass}>
      <VideoLanguageControls
        availableLanguages={availableLanguages}
        currentLanguage={currentLanguage}
        onSelectLanguage={onSelectLanguage}
      />
      {hasMirror && (
        <button
          type="button"
          className="video-mirror"
          onClick={onToggleMirror}
          aria-label={mirrorLabel}
          title={mirrorLabel}
        >
          <span className="video-mirror-mark" aria-hidden="true">↗</span>
          <span className="video-mirror-full" aria-hidden="true">{mirrorLabel}</span>
          <span className="video-mirror-short" aria-hidden="true">{target}</span>
        </button>
      )}
    </div>
  );
}
