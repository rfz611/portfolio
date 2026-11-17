import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

const KINDS = ['whisky', 'martini', 'negroni'] as const;

/** Cardápio do bar em VT323: escolher o drink faz o balcão servir. */
export function BarMenu() {
  const { t } = useTranslation();
  const view = useScene((s) => s.view);
  const drink = useScene((s) => s.drink);
  const served = useScene((s) => s.drinkServed);
  const orderDrink = useScene((s) => s.orderDrink);
  if (view !== 'bar') return null;
  const pouring = drink !== null && !served;
  return (
    <div className="bar-menu" role="group" aria-label={t('bar.title')}>
      <p className="bar-menu__title" aria-live="polite">
        {served ? t('bar.cheers') : pouring ? t('bar.pouring') : t('bar.title')}
      </p>
      <div className="bar-menu__options">
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className="ctl"
            disabled={pouring}
            onClick={() => orderDrink(kind)}
          >
            [ {t(`bar.${kind}`)} ]
          </button>
        ))}
      </div>
    </div>
  );
}
