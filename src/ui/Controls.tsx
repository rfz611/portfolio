import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HASH_TO_VIEW, NAV_ITEMS } from '../store/routes';
import { useScene } from '../store/useScene';

/**
 * Controles discretos no canto de baixo, na letra das telas antigas
 * (VT323): idioma, som, versão em texto e o menu com todas as seções.
 * O menu é a forma de navegar por teclado e leitor de tela.
 */
export function Controls({ webgl }: { webgl: boolean }) {
  const { t } = useTranslation();
  const lang = useScene((s) => s.lang);
  const setLang = useScene((s) => s.setLang);
  const muted = useScene((s) => s.muted);
  const toggleMuted = useScene((s) => s.toggleMuted);
  const mode = useScene((s) => s.mode);
  const setMode = useScene((s) => s.setMode);
  const view = useScene((s) => s.view);
  const setView = useScene((s) => s.setView);
  const is3d = mode === '3d' && webgl;
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  // fecha o menu ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <nav className="controls" ref={root} aria-label={t('nav.label')}>
      <button
        type="button"
        className="ctl"
        aria-label={t('ui.lang')}
        onClick={() => setLang(lang === 'pt' ? 'en' : 'pt')}
      >
        <span className={lang === 'pt' ? 'is-on' : undefined}>PT</span>
        <span className="ctl__sep">/</span>
        <span className={lang === 'en' ? 'is-on' : undefined}>EN</span>
      </button>
      {is3d && (
        <button
          type="button"
          className="ctl"
          aria-pressed={muted}
          aria-label={muted ? t('ui.unmute') : t('ui.mute')}
          onClick={toggleMuted}
        >
          {muted ? t('ui.soundOff') : t('ui.soundOn')}
        </button>
      )}
      {webgl && (
        <button
          type="button"
          className="ctl"
          onClick={() => {
            setView('home');
            setMode(is3d ? 'text' : '3d');
          }}
        >
          {is3d ? t('ui.textVersion') : t('ui.view3d')}
        </button>
      )}
      <button
        type="button"
        className="ctl"
        aria-expanded={open}
        aria-controls="menu-list"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? t('nav.close') : t('nav.menu')}
      </button>
      {open && (
        <ul id="menu-list" className="menu-panel">
          {NAV_ITEMS.map((item) => {
            const active = is3d && HASH_TO_VIEW[item.hash] === view;
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
      )}
    </nav>
  );
}
