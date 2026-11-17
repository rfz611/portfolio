import { LAPTOP, SPOT } from '../config/layout';
import type { ViewId } from '../store/useScene';

type V3 = [number, number, number];

/**
 * Um plano de câmera pode ser descrito de dois jeitos:
 * 1. Pelo que precisa caber na tela (target + dir + frame): a distância é
 *    calculada, então o mesmo plano funciona em tela larga e em celular.
 * 2. Por uma posição fixa dentro da sala (position + target + hfov): usado
 *    nos planos gerais, para a câmera nunca sair pelas paredes.
 */
export interface Shot {
  target: V3;
  dir?: V3;
  frame?: [number, number];
  /** Abertura vertical da lente, em graus (modo 1). */
  fov?: number;
  position?: V3;
  /** Abertura horizontal da lente, em graus (modo 2). */
  hfov?: number;
  /** Ajustes só para tela em pé (celular). */
  portrait?: Partial<Omit<Shot, 'portrait'>>;
  /** Duração da transição até este plano, em segundos. */
  duration?: number;
}

const [shelfX, , shelfZ] = SPOT.shelf;
const [tvX, , tvZ] = SPOT.tvRack;
const [tableX, tableY, tableZ] = SPOT.table;
const [carX, , carZ] = SPOT.car;
const [lx, ly, lz] = LAPTOP.base;
// centro da tela do notebook e a direção para onde ela olha
const lidUp = LAPTOP.lid / 2;
const screenCenter: V3 = [
  lx,
  ly + 0.008 + Math.cos(LAPTOP.tilt) * lidUp,
  lz + LAPTOP.d / 2 + Math.sin(LAPTOP.tilt) * lidUp,
];
const screenNormal: V3 = [0, Math.sin(LAPTOP.tilt), -Math.cos(LAPTOP.tilt)];

/**
 * Opções de plano inicial para o Raphael escolher (endereço ?camera=1 a 4).
 * 1. Canto: alto no canto de baixo, como na planta, vendo o cantinho de
 *    três quartos, a cidade ao fundo e a garagem pelo vidro à direita.
 * 2. Sofá: de trás do rebaixo, de frente para a janela e o neon.
 * 3. Garagem: do lado da passagem, olhando o cantinho e o escritório.
 * 4. Maquete: a cobertura em corte, vista de fora (a versão anterior).
 */
export const HOME_OPTIONS: Shot[] = [
  {
    position: [-5.35, 2.72, 4.05],
    target: [1.3, 0.25, -1.75],
    hfov: 74,
    portrait: { position: [-4.9, 3.1, 4.1], target: [-0.6, -0.5, -0.9], hfov: 64 },
  },
  {
    position: [0.55, 2.35, 4.25],
    target: [0.0, 0.65, -3.2],
    hfov: 76,
    portrait: { position: [0.4, 3.1, 4.25], target: [-0.2, -0.5, -1.4], hfov: 64 },
  },
  {
    position: [5.25, 2.65, 3.15],
    target: [-3.6, 0.45, -1.35],
    hfov: 72,
    portrait: { position: [5.2, 3.15, 3.2], target: [-1.8, -0.55, -0.7], hfov: 64 },
  },
  {
    target: [1.75, 0.55, -0.35],
    dir: [-0.15, 0.5, 1],
    frame: [20.4, 7.6],
    fov: 36,
    portrait: { target: [-1.4, 0, 0.1], dir: [0.3, 1.45, 0.85], frame: [8.6, 9.6], fov: 46 },
  },
];

function homeOption(): number {
  if (typeof window === 'undefined') return 2;
  const n = Number(new URLSearchParams(window.location.search).get('camera'));
  // sem escolha no endereço, fica a opção 3 (cantinho, escritório e neon)
  return Number.isInteger(n) && n >= 1 && n <= HOME_OPTIONS.length ? n - 1 : 2;
}

export const SHOTS: Record<ViewId, Shot> = {
  home: { ...HOME_OPTIONS[homeOption()], duration: 1.6 },
  // Frontal no cantinho, toca-discos no terço superior.
  discos: {
    target: [shelfX + 0.25, 0.72, shelfZ],
    dir: [1, 0.46, 0],
    frame: [2.75, 1.8],
    fov: 40,
    portrait: { target: [shelfX + 0.25, 0.55, shelfZ], frame: [1.72, 2.5], fov: 48 },
  },
  // Frontal, tela ocupando cerca de 60% da largura.
  tv: {
    target: [tvX + 0.27, 0.735, tvZ + 0.18],
    dir: [1, 0.02, 0],
    frame: [0.8, 0.47],
    fov: 34,
    portrait: { frame: [0.62, 0.9] },
  },
  // Frontal, tela do notebook ocupando a tela inteira.
  pc: {
    target: screenCenter,
    dir: screenNormal,
    frame: [0.33, 0.215],
    fov: 34,
    portrait: { frame: [0.3, 0.5] },
  },
  // De cima, levemente inclinada, revistas no centro.
  mesa: {
    target: [tableX - 0.1, tableY + 0.44, tableZ + 0.05],
    dir: [-0.08, 1, 0.42],
    frame: [1.3, 0.95],
    fov: 40,
    portrait: { frame: [1.15, 1.5] },
  },
  // Olhando a cidade e o neon com o nome.
  janela: {
    target: [SPOT.neon[0], 1.95, -4.5],
    dir: [0, -0.06, 1],
    frame: [5.4, 2.9],
    fov: 44,
    portrait: { frame: [2.6, 3.6], target: [SPOT.neon[0], 1.9, -4.5] },
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
const deg = (r: number) => (r * 180) / Math.PI;

/** Resolve um plano: onde a câmera fica e a abertura da lente para esta tela. */
export function resolveShot(view: ViewId, aspect: number, base: Shot = SHOTS[view]): CameraPose {
  const shot = aspect < 1 && base.portrait ? { ...base, ...base.portrait } : base;
  const duration = base.duration ?? 1.4;

  if (shot.position) {
    const hfov = shot.hfov ?? 70;
    const vfov = deg(2 * Math.atan(Math.tan(rad(hfov) / 2) / aspect));
    return {
      position: [...shot.position],
      target: [...shot.target],
      fov: Math.min(80, Math.max(30, vfov)),
      duration,
    };
  }

  const fov = shot.fov ?? 40;
  const [fw, fh] = shot.frame ?? [1, 1];
  const halfV = Math.tan(rad(fov) / 2);
  const halfH = halfV * aspect;
  const distance = Math.max(fh / 2 / halfV, fw / 2 / halfH);
  const [dx, dy, dz] = shot.dir ?? [0, 0, 1];
  const length = Math.hypot(dx, dy, dz) || 1;
  const [tx, ty, tz] = shot.target;
  return {
    position: [
      tx + (dx / length) * distance,
      ty + (dy / length) * distance,
      tz + (dz / length) * distance,
    ],
    target: [tx, ty, tz],
    fov,
    duration,
  };
}
