import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

/** Aparece em qualquer plano que não seja o inicial. Esc faz o mesmo. */
export function BackButton() {
  const { t } = useTranslation();
  const view = useScene((s) => s.view);
  const setView = useScene((s) => s.setView);
  if (view === 'home') return null;
  return (
    <button type="button" className="back" onClick={() => setView('home')}>
      {'< '}
      {t('ui.back')} [ESC]
    </button>
  );
}
