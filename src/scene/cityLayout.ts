import { GARAGE, ROOM } from '../config/layout';

/** Chão da cidade (a cobertura fica uns 95 m acima da rua). */
export const GROUND_Y = -95;
/** Meio da fachada norte do prédio (sala + garagem). */
export const CENTER_X = (ROOM.x0 + GARAGE.x1) / 2;
/** Uma repetição da fachada a cada 15 m: janelas pequenas e muitas, como de longe. */
export const FACADE_UV = 15;

export type RooftopKind = 'bar' | 'party';

/** Prédio baixo com a cobertura ocupada, na frente da janela. */
export interface Rooftop {
  kind: RooftopKind;
  /** Centro do prédio no chão (x, z), em metros. */
  at: [number, number];
  /** Largura (x) e fundo (z) do telhado. */
  size: [number, number];
  /** Altura do telhado (y). */
  top: number;
  yaw: number;
}

/**
 * Coberturas com gente, na frente da janela: um bar com varal de
 * lâmpadas à esquerda e uma festa ao ar livre, com pagode de madeira e
 * luzes coloridas, à direita.
 */
export const ROOFTOPS: Rooftop[] = [
  { kind: 'bar', at: [CENTER_X - 46, -128], size: [44, 30], top: -30, yaw: 0.12 },
  { kind: 'party', at: [CENTER_X + 58, -168], size: [52, 38], top: -38, yaw: -0.1 },
];
