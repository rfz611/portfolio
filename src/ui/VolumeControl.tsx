import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

/** Botão de mudo sempre visível no canto da tela. */
export function VolumeControl() {
  const { t } = useTranslation();
  const muted = useScene((s) => s.muted);
  const toggleMuted = useScene((s) => s.toggleMuted);
  const label = muted ? t('ui.unmute') : t('ui.mute');
  return (
    <button
      type="button"
      className="tool tool--icon"
      aria-label={label}
      title={label}
      aria-pressed={muted}
      onClick={toggleMuted}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
        {muted ? (
          <path d="M15.5 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        ) : (
          <path
            d="M15 9a4.2 4.2 0 010 6m2.4-8.6a7.6 7.6 0 010 11.2"
            stroke="currentColor"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
        )}
      </svg>
    </button>
  );
}
