import { useEffect, useState } from 'react';
import { hashFromView, viewFromHash } from '../store/routes';
import { useScene } from '../store/useScene';

/** Mantém o endereço (#projetos, #discos...) e o plano de câmera em sincronia. */
export function useHashSync() {
  useEffect(() => {
    const fromHash = () => {
      if (useScene.getState().mode !== '3d') return;
      const view = viewFromHash(window.location.hash);
      if (view !== useScene.getState().view) useScene.getState().setView(view);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);

    const unsubscribe = useScene.subscribe((state, prev) => {
      if (state.view === prev.view || state.mode !== '3d') return;
      const hash = hashFromView(state.view);
      if (hash === window.location.hash) return;
      const url = window.location.pathname + window.location.search + hash;
      window.history.pushState(null, '', url);
    });
    return () => {
      window.removeEventListener('hashchange', fromHash);
      unsubscribe();
    };
  }, []);
}

/** Esc sempre volta para o plano inicial. */
export function useEscapeToHome() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const s = useScene.getState();
      if (s.dossier) s.setDossier(null);
      else if (s.cvOpen) s.setCvOpen(false);
      else if (s.magazine !== null) s.setMagazine(null);
      else s.setView('home');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** No plano dos discos, as setas para cima e para baixo regulam o volume. */
export function useVolumeKeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const s = useScene.getState();
      if (s.view !== 'discos' || event.target instanceof HTMLInputElement) return;
      const step = event.key === 'ArrowUp' ? 0.03 : event.key === 'ArrowDown' ? -0.03 : 0;
      if (!step) return;
      event.preventDefault();
      s.setVolume(s.volume + step);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

let reducedMotion: MediaQueryList | null = null;

/** Lido a cada quadro pela câmera: a consulta é criada uma vez só. */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  reducedMotion ??= window.matchMedia('(prefers-reduced-motion: reduce)');
  return reducedMotion.matches;
};

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    // só um teste: devolve o contexto na hora, o da cena é outro
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
