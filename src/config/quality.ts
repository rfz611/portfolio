import type { Quality } from '../store/useScene';

/**
 * Três níveis de qualidade. O site começa no médio e sobe ou desce sozinho
 * conforme os quadros por segundo; no celular fica no baixo (só desce).
 */
export interface QualityTier {
  /** Resolução máxima em relação aos pixels da tela. */
  dpr: [number, number];
  /** Pós-processamento (bloom, vinheta, granulado). */
  post: boolean;
  /** Sombreamento de contato (N8AO) e profundidade de campo. */
  heavy: boolean;
  /** Reflexo de verdade no piso da garagem. */
  reflections: boolean;
  /** Suavização das bordas no pós-processamento. */
  msaa: number;
  rain: number;
}

export const QUALITY: Record<Quality, QualityTier> = {
  high: { dpr: [1, 1.75], post: true, heavy: true, reflections: true, msaa: 4, rain: 2200 },
  medium: { dpr: [1, 1.35], post: true, heavy: false, reflections: false, msaa: 2, rain: 1400 },
  low: { dpr: [1, 1], post: false, heavy: false, reflections: false, msaa: 0, rain: 500 },
};

/**
 * Celular ou tela estreita. Ali o site fica no nível baixo e não sobe
 * sozinho: trocar de nível liga o pós-processamento e recompila os shaders
 * da cena inteira, um engasgo de vários segundos num celular.
 */
export function isHandheld(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 760;
}
