import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { coverUrl, trackSources, tracks } from '../content/tracks';

/**
 * Os discos na versão em texto: uma caixa de discos de verdade. Cada capa
 * deixa o vinil escapar ao passar o mouse; ao clicar, o disco sai da capa,
 * gira com o rótulo na cor dele e a música toca (uma de cada vez).
 */
export function RecordCrate() {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState<string | null>(null);
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  const toggle = (id: string) => {
    if (playing === id) {
      audio.current?.pause();
      setPlaying(null);
      return;
    }
    audio.current?.pause();
    const el = new Audio();
    const [ogg, mp3] = trackSources(id);
    el.src = el.canPlayType('audio/ogg') ? ogg : mp3;
    el.volume = 0.6;
    el.onended = () => setPlaying(null);
    el.onerror = () => {
      setMissing((m) => ({ ...m, [id]: true }));
      setPlaying((p) => (p === id ? null : p));
    };
    audio.current = el;
    void el.play().catch(() => setPlaying(null));
    setPlaying(id);
  };

  const now = tracks.find((tr) => tr.id === playing);
  return (
    <>
      <p className="crate__now" aria-live="polite">
        <span className={`crate__led${now ? ' is-on' : ''}`} aria-hidden="true" />
        {now ? `${t('records.nowPlaying')}: ${now.title} · ${now.artist}` : t('records.pick')}
      </p>
      <ul className="crate">
        {tracks.map((track) => {
          const on = playing === track.id;
          const off = missing[track.id];
          return (
            <li key={track.id}>
              <button
                type="button"
                className={`crate__record${on ? ' is-playing' : ''}`}
                aria-pressed={on}
                disabled={off}
                onClick={() => toggle(track.id)}
                style={
                  {
                    '--label': track.label,
                    '--vinyl': track.vinyl ?? '#111',
                  } as React.CSSProperties
                }
              >
                <span className="crate__disc" aria-hidden="true">
                  <span className="crate__label" />
                </span>
                <img className="crate__sleeve" src={coverUrl(track.id)} alt="" loading="lazy" />
                <span className="crate__tag">
                  {off ? t('records.soon') : on ? t('records.pause') : t('records.play')}
                </span>
              </button>
              <p className="crate__title">
                <strong>{track.title}</strong>
                <span>{track.artist}</span>
              </p>
            </li>
          );
        })}
      </ul>
    </>
  );
}
