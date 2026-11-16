import type { Quality } from '../store/useScene';

/**
 * Três níveis de qualidade. O site começa no médio (baixo no celular) e
 * sobe ou desce sozinho conforme os quadros por segundo.
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
