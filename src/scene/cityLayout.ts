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

/** Quadra de 64 m com ruas de 16 m (uma quadra a cada 80 m). */
export const PITCH = 80;
export const BLOCK = 64;

/**
 * Coberturas com gente, cada uma dentro de uma quadra: à esquerda, um
 * prédio antigo e baixo, de tijolo, com um bar sob pérgola; à direita, mais
 * longe e mais alto, o hotel moderno com a festa no terraço.
 */
export const ROOFTOPS: Rooftop[] = [
  { kind: 'bar', at: [CENTER_X - 62, -142], size: [26, 30], top: -48, yaw: 0 },
  { kind: 'party', at: [CENTER_X + 72, -226], size: [36, 34], top: -40, yaw: 0 },
];

/**
 * Folks Pub Sertanejo, no chão: esquina da rua da esquerda (x = -36,5) com a
 * rua que cruza a vista em z = -352, de frente para a janela. Centro do pátio
 * (x, z), tamanho do lote (largura em x, fundo em z, antes da escala), escala
 * (maior que o real, para aparecer da janela) e giro.
 */
export const FOLKS = { at: [CENTER_X - 64.5, -380], size: [28, 30], scale: 1.5, yaw: 0 } as const;
