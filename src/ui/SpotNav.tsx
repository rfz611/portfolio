import { useTranslation } from 'react-i18next';
import { SPOTS } from '../camera/spots';
import { useScene } from '../store/useScene';

/** Seletor de lugar no plano inicial: ◀ SOFÁ ▶ (também funciona com Tab e Enter). */
export function SpotNav() {
  const { t } = useTranslation();
  const view = useScene((s) => s.view);
  const spot = useScene((s) => s.spot);
  const setSpot = useScene((s) => s.setSpot);
  if (view !== 'home') return null;
  const go = (step: number) => setSpot((spot + step + SPOTS.length) % SPOTS.length);
  return (
    <div className="spot-nav" role="group" aria-label={t('nav3d.place')}>
      <button type="button" className="ctl" aria-label={t('nav3d.prev')} onClick={() => go(-1)}>
        {'<'}
      </button>
      <span className="spot-nav__name" aria-live="polite">
        {t(SPOTS[spot].label)}
      </span>
      <button type="button" className="ctl" aria-label={t('nav3d.next')} onClick={() => go(1)}>
        {'>'}
      </button>
    </div>
  );
}
