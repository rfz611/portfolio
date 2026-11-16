import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

/**
 * Tela de carregamento com progresso real: a porcentagem vem da geração
 * das texturas e da montagem da cena. O menu fica visível por cima dela.
 */
export function Loader() {
  const { t } = useTranslation();
  const progress = useScene((s) => s.loadProgress);
  const ready = useScene((s) => s.ready);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setGone(true), 900);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (gone) return null;
  const percent = Math.round((ready ? 1 : progress) * 100);
  return (
    <div className={`loader${ready ? ' is-done' : ''}`} role="status" aria-live="polite">
      <p className="loader__title">{t('loader.title')}</p>
      <div className="loader__bar" aria-hidden="true">
        <span style={{ transform: `scaleX(${percent / 100})` }} />
      </div>
      <p className="loader__percent">{String(percent).padStart(3, '0')}%</p>
    </div>
  );
}
