import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

/** Botão PT/EN sempre visível; a escolha fica salva no navegador. */
export function LangToggle() {
  const { t } = useTranslation();
  const lang = useScene((s) => s.lang);
  const setLang = useScene((s) => s.setLang);
  return (
    <button
      type="button"
      className="tool tool--lang"
      aria-label={t('ui.lang')}
      onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
    >
      <span className={lang === 'pt' ? 'is-on' : undefined}>PT</span>
      <span aria-hidden="true">/</span>
      <span className={lang === 'en' ? 'is-on' : undefined}>EN</span>
    </button>
  );
}
