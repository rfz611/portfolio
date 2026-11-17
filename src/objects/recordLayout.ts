import * as THREE from 'three';
import { resolveShot } from '../camera/shots';
import { ROOM, SPOT } from '../config/layout';
import { tracks } from '../content/tracks';

/**
 * Medidas do cantinho dos discos, no espaço local do cantinho:
 * x = ao longo da parede (direita de quem olha de frente), y = altura,
 * z = distância da parede para dentro da sala.
 */
type V3 = [number, number, number];

/** Aparador baixo de mogno ao longo da parede. */
export const CREDENZA = { w: 3.0, h: 0.62, d: 0.5 } as const;

/** Converte um ponto do mundo para o espaço local do cantinho. */
export const toCorner = (world: readonly number[]): V3 => [-world[2], world[1], world[0] - ROOM.x0];

export const CREDENZA_POS: V3 = toCorner(SPOT.shelf);
export const TV_POS: V3 = toCorner(SPOT.tvRack);
export const LAMP_A: V3 = [-SPOT.lampA[2], 0, 0.32];
export const LAMP_B: V3 = [-SPOT.lampB[2], 0, 0.32];
/** Caixas de som em cima do aparador (x ao longo da parede). */
export const SPEAKERS_X = [CREDENZA_POS[0] - 0.24, CREDENZA_POS[0] + 1.17] as const;

/**
 * Prateleiras finas na parede, como numa galeria: Clássicos em cima e
 * Rap embaixo, com as capas encostadas na parede.
 */
export const LEDGES = {
  x0: CREDENZA_POS[0] - 0.1,
  x1: CREDENZA_POS[0] + 1.48,
  classics: 1.78,
  rap: 1.33,
} as const;

/** Toca-discos em cima do aparador. */
export const TURNTABLE_POS: V3 = [CREDENZA_POS[0] + 0.52, CREDENZA.h, 0.27];
/** Centro do prato em relação ao toca-discos, e altura em que o vinil pousa. */
export const PLATTER: V3 = [-0.055, 0.108, 0.005];
export const PLATTER_POS: V3 = [
  TURNTABLE_POS[0] + PLATTER[0],
  TURNTABLE_POS[1] + PLATTER[1],
  TURNTABLE_POS[2] + PLATTER[2],
];

export const SLEEVE_SIZE = 0.32;

export interface Pose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: number;
}

const pose = (x: number, y: number, z: number, rx: number, ry = 0, rz = 0): Pose => ({
  position: new THREE.Vector3(x, y, z),
  quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
  scale: 1,
});

/**
 * Onde cada capa mora: encostada na parede sobre a prateleira (Clássicos
 * em cima, Rap embaixo) e o disco do prato em pé, atrás do toca-discos.
 */
export function shelfPoses(): Record<string, Pose> {
  const out: Record<string, Pose> = {};
  const half = SLEEVE_SIZE / 2;
  const lean = -0.09;
  const place = (ids: string[], y: number) => {
    const span = LEDGES.x1 - LEDGES.x0 - SLEEVE_SIZE - 0.04;
    ids.forEach((id, i) => {
      const t = ids.length > 1 ? i / (ids.length - 1) : 0.5;
      const x = LEDGES.x0 + 0.02 + half + t * span;
      out[id] = pose(x, y + half + 0.012, 0.035 + i * 0.006, lean, 0, (i % 2 ? 1 : -1) * 0.012);
    });
  };
  place(
    tracks.filter((t) => t.side === 'classics').map((t) => t.id),
    LEDGES.classics,
  );
  place(
    tracks.filter((t) => t.side === 'rap').map((t) => t.id),
    LEDGES.rap,
  );
  const platter = tracks.find((t) => t.side === 'platter');
  if (platter) {
    out[platter.id] = pose(
      TURNTABLE_POS[0] + 0.36,
      CREDENZA.h + half + 0.004,
      0.05,
      -0.14,
      0,
      0.02,
    );
  }
  return out;
}

/**
 * Leque: as capas saem das prateleiras e se abrem na frente da câmera do
 * plano "discos", na parte de cima da tela (o toca-discos fica embaixo). O número de fileiras se adapta à tela em pé.
 */
export function fanPoses(aspect: number): Record<string, Pose> {
  const shot = resolveShot('discos', aspect);
  const cam = new THREE.Vector3(...toCorner(shot.position));
  const target = new THREE.Vector3(...toCorner(shot.target));
  const forward = target.clone().sub(cam).normalize();
  const right = forward
    .clone()
    .cross(new THREE.Vector3(0, 1, 0))
    .normalize();
  const up = right.clone().cross(forward).normalize();
  const basis = new THREE.Matrix4().makeBasis(right, up, forward.clone().negate());
  const facing = new THREE.Quaternion().setFromRotationMatrix(basis);

  const distance = 1.05;
  const viewH = 2 * distance * Math.tan((shot.fov * Math.PI) / 360);
  const viewW = viewH * aspect;
  const rows = aspect > 1.25 ? 2 : aspect > 0.75 ? 3 : 4;
  const order = [
    ...tracks.filter((t) => t.side !== 'platter'),
    ...tracks.filter((t) => t.side === 'platter'),
  ];
  const perRow = Math.ceil(order.length / rows);
  const overlap = aspect > 1.25 ? 0.66 : 0.8;
  const wide = aspect > 1.25;
  const size = Math.min(
    (viewW * 0.9) / (1 + (perRow - 1) * overlap),
    (viewH * (wide ? 0.5 : 0.4)) / (rows * 1.06),
  );
  // as capas se abrem na parte de cima (as prateleiras ficam vazias) e o
  // toca-discos continua visível embaixo
  const blockCenter = viewH * (wide ? 0.12 : 0.1);

  const out: Record<string, Pose> = {};
  order.forEach((track, index) => {
    const row = Math.floor(index / perRow);
    const col = index % perRow;
    const count = Math.min(perRow, order.length - row * perRow);
    const mid = (count - 1) / 2;
    const u = (col - mid) * size * overlap;
    const arc = -Math.pow(col - mid, 2) * size * 0.012;
    const v = blockCenter + ((rows - 1) / 2 - row) * size * 1.06 + arc;
    const depth = distance - col * 0.004 - row * 0.02;
    const roll = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      -(col - mid) * 0.035,
    );
    out[track.id] = {
      position: cam
        .clone()
        .addScaledVector(forward, depth)
        .addScaledVector(right, u)
        .addScaledVector(up, v),
      quaternion: facing.clone().multiply(roll),
      scale: size / SLEEVE_SIZE,
    };
  });
  return out;
}

/** Estado compartilhado entre toca-discos e discos (muda todo quadro). */
export const deckMotion = {
  /** Ângulo de giro do prato, em radianos. */
  spin: 0,
  /** Quanto cada vinil já pousou no prato (0 = na capa, 1 = no prato). */
  landed: new Map<string, number>(),
};

/** Onde está cada capa agora (para o vinil saber de onde sair e voltar). */
export const sleeveObjects = new Map<string, THREE.Object3D>();

/** Tela da TV em relação ao gabinete (a Fase 3 põe o conteúdo aqui). */
export const TV_SCREEN = { w: 0.47, h: 0.355, x: -0.085, y: 0.285, z: 0.262 } as const;
