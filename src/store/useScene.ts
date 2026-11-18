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
  'bar',
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
  /** Texto pronto, quando o rótulo não vem das traduções (nome de faixa). */
  text?: string;
}

export interface SceneState {
  view: ViewId;
  /** Ponto de vista atual no plano inicial (índice em camera/spots.ts). */
  spot: number;
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
  setSpot: (spot: number) => void;
  setMode: (mode: '3d' | 'text') => void;
  setHovered: (hover: Hover | null) => void;
  setLang: (lang: Lang) => void;
  setQuality: (quality: Quality, manual?: boolean) => void;
  setAutoQuality: (auto: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMuted: () => void;
  requestTrack: (id: string) => void;
  /** Drink pedido no bar (o número muda a cada pedido, para repetir o mesmo drink). */
  drink: { kind: 'whisky' | 'martini' | 'negroni'; order: number } | null;
  drinkServed: boolean;
  /** Ponto do mundo para onde a câmera vira o olhar (ex.: dentro da gaveta aberta). */
  glance: [number, number, number] | null;
  /** Peça do motor clicada (grupo de skills em content/skills.ts). */
  skill: 'languages' | 'backend' | 'frontend' | 'databases' | 'tools' | null;
  setSkill: (skill: SceneState['skill']) => void;
  /** Faróis do carro acesos? */
  headlights: boolean;
  /** Frequência sintonizada no rádio do carro (FM, 87,5 a 108). */
  radioFreq: number;
  setRadioFreq: (freq: number) => void;
  toggleHeadlights: () => void;
  /** Ficha de filme aberta no canto da poltrona. */
  dossier: 'magnolia' | 'donnie' | 'arrival' | null;
  setDossier: (dossier: 'magnolia' | 'donnie' | 'arrival' | null) => void;
  /** Folha do currículo aberta (clicando nos papéis da mesa)? */
  cvOpen: boolean;
  setCvOpen: (open: boolean) => void;
  /** Luminária-cogumelo da mesa de centro acesa? */
  tableLamp: boolean;
  toggleTableLamp: () => void;
  /** Revista aberta na frente da câmera (índice em content/certificates.ts). */
  magazine: number | null;
  setMagazine: (magazine: number | null) => void;
  /** Canal da TV (índice em content/projects.ts). */
  tvChannel: number;
  setTvChannel: (channel: number) => void;
  orderDrink: (kind: 'whisky' | 'martini' | 'negroni') => void;
  setDrinkServed: (served: boolean) => void;
  setGlance: (glance: [number, number, number] | null) => void;
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
      spot: 0,
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

      setView: (view) =>
        set({ view, hovered: null, magazine: null, cvOpen: false, dossier: null, skill: null }),
      setSpot: (spot) => set({ spot, view: 'home', hovered: null, dossier: null }),
      setMode: (mode) => set({ mode }),
      setHovered: (hovered) => set({ hovered }),
      setLang: (lang) => set({ lang }),
      setQuality: (quality, manual = false) =>
        set((s) => ({ quality, autoQuality: manual ? false : s.autoQuality })),
      setAutoQuality: (autoQuality) => set({ autoQuality }),
      setVolume: (volume) => set({ volume: clamp(volume, 0, MAX_VOLUME) }),
      toggleMuted: () => set((s) => ({ muted: !s.muted })),
      requestTrack: (id) => set({ requestedTrackId: id, deck: 'changing' }),
      drink: null,
      drinkServed: false,
      glance: null,
      skill: null,
      headlights: false,
      radioFreq: 88.1,
      tvChannel: 0,
      magazine: null,
      tableLamp: true,
      cvOpen: false,
      dossier: null,
      setDossier: (dossier) => set({ dossier }),
      setCvOpen: (cvOpen) => set({ cvOpen }),
      toggleTableLamp: () => set((s) => ({ tableLamp: !s.tableLamp })),
      setMagazine: (magazine) => set({ magazine }),
      setTvChannel: (tvChannel) => set({ tvChannel }),
      orderDrink: (kind) =>
        set((s) => ({ drink: { kind, order: (s.drink?.order ?? 0) + 1 }, drinkServed: false })),
      setDrinkServed: (drinkServed) => set({ drinkServed }),
      setGlance: (glance) => set({ glance }),
      setSkill: (skill) => set({ skill }),
      toggleHeadlights: () => set((s) => ({ headlights: !s.headlights })),
      setRadioFreq: (radioFreq) =>
        set({ radioFreq: Math.round(clamp(radioFreq, 87.5, 108) * 10) / 10 }),
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
