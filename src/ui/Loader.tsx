import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

const BLOCKS = 20;

/**
 * Tela de carregamento no estilo dos jogos de PS2 (Max Payne 2): fundo
 * escuro com granulado, título de capítulo em serifa e, embaixo, a barra
 * de blocos com a porcentagem real em VT323.
 */
export function Loader() {
  const { t } = useTranslation();
  const progress = useScene((s) => s.loadProgress);
  const ready = useScene((s) => s.ready);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setGone(true), 1000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (gone) return null;
  const percent = Math.round((ready ? 1 : progress) * 100);
  const filled = Math.round((percent / 100) * BLOCKS);
  return (
    <div className={`loader${ready ? ' is-done' : ''}`} role="status" aria-live="polite">
      <div className="loader__card">
        <p className="loader__chapter">{t('loader.chapter')}</p>
        <p className="loader__title">{t('loader.title')}</p>
      </div>
      <div className="loader__bottom" aria-label={`${t('loader.loading')} ${percent}%`}>
        <span className="loader__label">{t('loader.loading')}</span>
        <span className="loader__blocks" aria-hidden="true">
          {Array.from({ length: BLOCKS }, (_, i) => (
            <i key={i} className={i < filled ? 'is-on' : undefined} />
          ))}
        </span>
        <span className="loader__percent">{String(percent).padStart(3, '0')}%</span>
      </div>
    </div>
  );
}
