import { SPOT } from '../config/layout';
import type { ViewId } from '../store/useScene';

type V3 = [number, number, number];

/**
 * Um plano de câmera é descrito pelo que precisa caber na tela:
 * - target: para onde a câmera olha;
 * - dir: de que lado ela fica (vetor do alvo até a câmera);
 * - frame: largura e altura (em metros) que devem aparecer inteiras;
 * - fov: abertura vertical da lente, em graus.
 * A distância é calculada a partir disso, então o mesmo plano funciona
 * em tela larga e em celular em pé.
 */
export interface Shot {
  target: V3;
  dir: V3;
  frame: [number, number];
  fov: number;
  /** Ajustes só para tela em pé (celular). */
  portrait?: Partial<Omit<Shot, 'portrait'>>;
  /** Duração da transição até este plano, em segundos. */
  duration?: number;
}

const [shelfX, , shelfZ] = SPOT.shelf;
const [tvX, , tvZ] = SPOT.tvRack;
const [deskX, , deskZ] = SPOT.desk;
const [tableX, tableY, tableZ] = SPOT.table;
const [carX, , carZ] = SPOT.car;

export const SHOTS: Record<ViewId, Shot> = {
  // Diagonal alta: a cobertura inteira em corte, com a garagem à direita.
  home: {
    target: [1.75, 0.55, -0.35],
    dir: [-0.15, 0.5, 1],
    frame: [20.4, 7.6],
    fov: 36,
    duration: 1.6,
    portrait: { target: [-2.3, 0.3, 0.2], dir: [0.34, 0.66, 1], frame: [7.6, 9.6], fov: 46 },
  },
  // Frontal no cantinho, toca-discos no terço superior.
  discos: {
    target: [shelfX + 0.25, 0.74, shelfZ],
    dir: [1, 0.05, 0],
    frame: [2.75, 1.72],
    fov: 40,
    portrait: { target: [shelfX + 0.25, 0.62, shelfZ], frame: [1.72, 2.3], fov: 48 },
  },
  // Frontal, tela ocupando cerca de 60% da largura.
  tv: {
    target: [tvX + 0.27, 0.745, tvZ - 0.085],
    dir: [1, 0.02, 0],
    frame: [0.8, 0.47],
    fov: 34,
    portrait: { frame: [0.62, 0.9] },
  },
  // Frontal, monitor ocupando a tela inteira.
  pc: {
    target: [deskX - 0.12, 0.99, deskZ + 0.05],
    dir: [0, 0.03, 1],
    frame: [0.5, 0.36],
    fov: 34,
    portrait: { frame: [0.44, 0.7] },
  },
  // De cima, levemente inclinada, revistas no centro.
  mesa: {
    target: [tableX, tableY + 0.44, tableZ],
    dir: [-0.08, 1, 0.42],
    frame: [1.3, 0.95],
    fov: 40,
    portrait: { frame: [1.15, 1.5] },
  },
  // Olhando a cidade e o neon com o nome.
  janela: {
    target: [0, 1.95, -4.5],
    dir: [0, -0.06, 1],
    frame: [5.4, 2.9],
    fov: 44,
    portrait: { frame: [2.6, 3.6], target: [0, 1.9, -4.5] },
  },
  // Diagonal frontal, capô em destaque.
  carro: {
    target: [carX, 0.55, carZ],
    dir: [-0.85, 0.32, 0.6],
    frame: [5.4, 2.5],
    fov: 40,
    duration: 1.6,
    portrait: { frame: [3.4, 4.2] },
  },
  // De cima do capô aberto.
  motor: {
    target: [carX - 1.25, 0.8, carZ + 0.9],
    dir: [-0.5, 1, 0.45],
    frame: [1.9, 1.3],
    fov: 40,
    duration: 1.6,
    portrait: { frame: [1.5, 2.0] },
  },
  // Banco do motorista olhando o painel e o rádio.
  interior: {
    target: [carX - 0.45, 0.82, carZ + 0.35],
    dir: [0.8, 0.12, -0.6],
    frame: [1.1, 0.62],
    fov: 50,
    duration: 1.6,
    portrait: { frame: [0.7, 1.0] },
  },
};

export interface CameraPose {
  position: V3;
  target: V3;
  fov: number;
  duration: number;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Calcula onde a câmera fica para que o "frame" do plano caiba na tela. */
export function resolveShot(view: ViewId, aspect: number): CameraPose {
  const base = SHOTS[view];
  const shot = aspect < 1 && base.portrait ? { ...base, ...base.portrait } : base;
  const [fw, fh] = shot.frame;
  const halfV = Math.tan(rad(shot.fov) / 2);
  const halfH = halfV * aspect;
  const distance = Math.max(fh / 2 / halfV, fw / 2 / halfH);
  const [dx, dy, dz] = shot.dir;
  const length = Math.hypot(dx, dy, dz) || 1;
  const [tx, ty, tz] = shot.target;
  return {
    position: [
      tx + (dx / length) * distance,
      ty + (dy / length) * distance,
      tz + (dz / length) * distance,
    ],
    target: [tx, ty, tz],
    fov: shot.fov,
    duration: base.duration ?? 1.4,
  };
}
