import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useScene } from './store/useScene';
import { BackButton } from './ui/BackButton';
import { BarMenu } from './ui/BarMenu';
import { CvSheet } from './ui/CvSheet';
import { MagazineCaption } from './ui/MagazineCaption';
import { Controls } from './ui/Controls';
import { hasWebGL, useEscapeToHome, useHashSync, useVolumeKeys } from './ui/hooks';
import { HoverLabel } from './ui/HoverLabel';
import { Loader } from './ui/Loader';
import { SpotNav } from './ui/SpotNav';
import { TextPage } from './ui/TextPage';

// A cena 3D é carregada à parte: os controles e o menu aparecem antes dela.
const Experience = lazy(() => import('./scene/Experience'));

/** Dica curta em VT323 de como mexer em cada plano. */
const HINTS: Partial<Record<string, string>> = {
  home: 'ui.hint',
  discos: 'records.hint',
  tv: 'projects.hint',
  mesa: 'certificates.hint',
};

export default function App() {
  const { t, i18n } = useTranslation();
  const touch = useMemo(
    () =>
      typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true,
    [],
  );
  const mode = useScene((s) => s.mode);
  const view = useScene((s) => s.view);
  const ready = useScene((s) => s.ready);
  const magazineOpen = useScene((s) => s.magazine !== null);
  const webgl = useMemo(hasWebGL, []);
  const is3d = mode === '3d' && webgl;

  useHashSync();
  useEscapeToHome();
  useVolumeKeys();

  useEffect(() => {
    document.body.classList.toggle('is-3d', is3d);
  }, [is3d]);

  return (
    <>
      <a className="skip-link" href="#conteudo">
        {t('ui.skip')}
      </a>
      <main id="conteudo" tabIndex={-1}>
        {is3d ? (
          <>
            <h1 className="visually-hidden">
              {t('home.name')} · {t('home.role')}
            </h1>
            <Suspense fallback={null}>
              <Experience />
            </Suspense>
          </>
        ) : (
          <TextPage webgl={webgl} />
        )}
      </main>
      {is3d && (
        <>
          <div id="cut" className="cut" aria-hidden="true" />
          <Loader />
          <BackButton />
          <HoverLabel />
          {ready && <SpotNav />}
          {ready && <BarMenu />}
          {ready && <MagazineCaption />}
          {ready && <CvSheet />}
          {ready && HINTS[view] && !magazineOpen && (
            <p className={`hint hint--top${view === 'home' ? ' hint--soft' : ''}`}>
              {t(touch && i18n.exists(`${HINTS[view]}Touch`) ? `${HINTS[view]}Touch` : HINTS[view])}
            </p>
          )}
        </>
      )}
      <Controls webgl={webgl} />
    </>
  );
}
