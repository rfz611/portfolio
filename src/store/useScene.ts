import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_TRACK } from '../content/tracks';

/** Planos de câmera: cada um mostra um objeto da cobertura. */
export const VIEWS = [
  'home',
  'discos',
  'tv',
  'pc',
  'mesa',
  'carro',
  'motor',
  'interior',
  'janela',
] as const;
export type ViewId = (typeof VIEWS)[number];

export type Lang = 'pt' | 'en';
export type Quality = 'high' | 'medium' | 'low';
/** idle = disco parado no prato; changing = disco voando até o prato. */
export type DeckState = 'idle' | 'changing' | 'playing' | 'paused';
export type Availability = 'unknown' | 'ok' | 'missing';

/** O volume nunca passa de 60%, mesmo com o botão no máximo. */
export const MAX_VOLUME = 0.6;
export const DEFAULT_VOLUME = 0.35;

export interface Hover {
  id: string;
  /** Chave de tradução do rótulo (objects.*). */
  label: string;
}

export interface SceneState {
  view: ViewId;
  mode: '3d' | 'text';
  hovered: Hover | null;
  lang: Lang;
  quality: Quality;
  autoQuality: boolean;
  volume: number;
  muted: boolean;
  /** Disco que está no prato. */
  trackId: string;
  deck: DeckState;
  /** Disco escolhido que ainda está a caminho do prato. */
  requestedTrackId: string | null;
  availability: Record<string, Availability>;
  loadProgress: number;
  ready: boolean;

  setView: (view: ViewId) => void;
  setMode: (mode: '3d' | 'text') => void;
  setHovered: (hover: Hover | null) => void;
  setLang: (lang: Lang) => void;
  setQuality: (quality: Quality, manual?: boolean) => void;
  setAutoQuality: (auto: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;
  requestTrack: (id: string) => void;
  setDeck: (deck: DeckState, trackId?: string) => void;
  setAvailability: (id: string, value: Availability) => void;
  setLoadProgress: (progress: number) => void;
  setReady: (ready: boolean) => void;
}

export function detectLang(): Lang {
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'pt';
  return nav.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

function detectQuality(): Quality {
  if (typeof window === 'undefined' || !window.matchMedia) return 'medium';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return coarse || window.innerWidth < 760 ? 'low' : 'medium';
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const useScene = create<SceneState>()(
  persist(
    (set) => ({
      view: 'home',
      mode: '3d',
      hovered: null,
      lang: detectLang(),
      quality: detectQuality(),
      autoQuality: true,
      volume: DEFAULT_VOLUME,
      muted: false,
      trackId: DEFAULT_TRACK,
      deck: 'idle',
      requestedTrackId: null,
      availability: {},
      loadProgress: 0,
      ready: false,

      setView: (view) => set({ view, hovered: null }),
      setMode: (mode) => set({ mode }),
      setHovered: (hovered) => set({ hovered }),
      setLang: (lang) => set({ lang }),
      setQuality: (quality, manual = false) =>
        set((s) => ({ quality, autoQuality: manual ? false : s.autoQuality })),
      setAutoQuality: (autoQuality) => set({ autoQuality }),
      setVolume: (volume) => set({ volume: clamp(volume, 0, MAX_VOLUME) }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      requestTrack: (id) => set({ requestedTrackId: id, deck: 'changing' }),
      setDeck: (deck, trackId) =>
        set((s) => ({
          deck,
          trackId: trackId ?? s.trackId,
          requestedTrackId: deck === 'changing' ? s.requestedTrackId : null,
        })),
      setAvailability: (id, value) =>
        set((s) => ({ availability: { ...s.availability, [id]: value } })),
      setLoadProgress: (loadProgress) => set({ loadProgress: clamp(loadProgress, 0, 1) }),
      setReady: (ready) => set({ ready }),
    }),
    {
      name: 'rfz-portfolio',
      version: 1,
      // Só as preferências ficam salvas no navegador.
      partialize: (s) => ({
        lang: s.lang,
        volume: s.volume,
        muted: s.muted,
        mode: s.mode,
        quality: s.quality,
        autoQuality: s.autoQuality,
      }),
    },
  ),
);
