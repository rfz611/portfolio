import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HASH_TO_VIEW, NAV_ITEMS } from '../store/routes';
import { useScene } from '../store/useScene';

/**
 * Menu de texto com todas as seções. São links de verdade (#projetos...),
 * então funcionam com teclado, leitor de tela e no modo sem 3D.
 */
export function TextMenu() {
  const { t } = useTranslation();
  const view = useScene((s) => s.view);
  const mode = useScene((s) => s.mode);
  const [open, setOpen] = useState(false);

  return (
    <nav className={`menu${open ? ' is-open' : ''}`} aria-label={t('nav.label')}>
      <button
        type="button"
        className="menu__toggle"
        aria-expanded={open}
        aria-controls="menu-list"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t('nav.close') : t('nav.menu')}
      </button>
      <ul id="menu-list" className="menu__list">
        {NAV_ITEMS.map((item) => {
          const active = mode === '3d' && HASH_TO_VIEW[item.hash] === view;
          return (
            <li key={item.hash}>
              <a
                href={`#${item.hash}`}
                className={active ? 'is-active' : undefined}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {t(item.labelKey)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
