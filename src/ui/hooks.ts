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
      if (event.key === 'Escape') useScene.getState().setView('home');
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

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  !!window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
