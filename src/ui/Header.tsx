import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';
import { LangToggle } from './LangToggle';
import { TextMenu } from './TextMenu';
import { VolumeControl } from './VolumeControl';

/** Barra do topo: nome, menu de texto e os botões sempre visíveis. */
export function Header({ webgl }: { webgl: boolean }) {
  const { t } = useTranslation();
  const mode = useScene((s) => s.mode);
  const setMode = useScene((s) => s.setMode);
  const setView = useScene((s) => s.setView);
  const is3d = mode === '3d' && webgl;

  return (
    <header className="hud">
      <div className="brand">
        <h1>
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setView('home');
              window.scrollTo({ top: 0 });
            }}
          >
            {t('home.name')}
          </a>
        </h1>
        <p>
          {t('home.role')} · {t('home.place')}
        </p>
      </div>
      <TextMenu />
      <div className="tools">
        <LangToggle />
        {is3d && <VolumeControl />}
        {webgl && (
          <button
            type="button"
            className="tool"
            onClick={() => {
              setView('home');
              setMode(is3d ? 'text' : '3d');
            }}
          >
            {is3d ? t('ui.textVersion') : t('ui.view3d')}
          </button>
        )}
      </div>
    </header>
  );
}
