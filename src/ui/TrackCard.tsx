import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { next, togglePlay } from '../audio/player';
import { coverUrl, trackById } from '../content/tracks';
import { MAX_VOLUME, useScene } from '../store/useScene';

/**
 * Cartão pequeno do disco: capa, faixa e artista, com pausar, próximo e
 * volume. Aparece no plano dos discos e sempre que há música no prato.
 */
export function TrackCard() {
  const { t } = useTranslation();
  const view = useScene((s) => s.view);
  const deck = useScene((s) => s.deck);
  const trackId = useScene((s) => s.trackId);
  const requested = useScene((s) => s.requestedTrackId);
  const volume = useScene((s) => s.volume);
  const setVolume = useScene((s) => s.setVolume);
  const ready = useScene((s) => s.ready);
  const track = trackById(requested ?? trackId);
  const [cover, setCover] = useState(true);

  useEffect(() => setCover(true), [track?.id]);

  // setas para cima e para baixo regulam o volume no plano dos discos
  useEffect(() => {
    if (view !== 'discos') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;
      const step = event.key === 'ArrowUp' ? 0.03 : event.key === 'ArrowDown' ? -0.03 : 0;
      if (!step) return;
      event.preventDefault();
      setVolume(useScene.getState().volume + step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, setVolume]);

  if (!ready || !track || (view !== 'discos' && deck === 'idle')) return null;

  const playing = deck === 'playing' || deck === 'changing';
  const status =
    deck === 'playing' || deck === 'changing'
      ? t('records.nowPlaying')
      : deck === 'paused'
        ? t('records.paused')
        : t('records.ready');
  const percent = Math.round((volume / MAX_VOLUME) * 100);

  return (
    <aside className="track" aria-label={t('records.title')}>
      {cover ? (
        <img
          className="track__cover"
          src={coverUrl(track.id)}
          alt=""
          width={64}
          height={64}
          onError={() => setCover(false)}
        />
      ) : (
        <div className="track__cover" style={{ background: track.label }} />
      )}
      <div>
        <p className="track__status">{status}</p>
        <p className="track__title">{track.title}</p>
        <p className="track__artist">{track.artist}</p>
      </div>
      <div className="track__controls">
        <button
          type="button"
          className="tool"
          onClick={togglePlay}
          aria-label={playing ? t('records.pause') : t('records.play')}
          title={playing ? t('records.pause') : t('records.play')}
        >
          {playing ? '❚❚' : '▶'}
        </button>
        <button
          type="button"
          className="tool"
          onClick={next}
          aria-label={t('records.next')}
          title={t('records.next')}
        >
          ▶▶
        </button>
        <label className="track__volume">
          <span>VOL</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={percent}
            aria-label={t('records.volume')}
            onChange={(event) => setVolume((Number(event.target.value) / 100) * MAX_VOLUME)}
          />
          <span>{String(percent).padStart(3, '0')}</span>
        </label>
      </div>
      {deck === 'idle' && <p className="track__note">{t('records.note')}</p>}
    </aside>
  );
}
