import * as THREE from 'three';
import { crease } from '../../scene/geo';

/**
 * Carroceria do sedã esportivo (4,40 × 1,40 × 1,75 m), feita "por seções":
 * ao longo do comprimento (x, frente para -x) há estações, cada uma com o
 * perfil da lateral (soleira, ombro, base do vidro, teto). Ligando as
 * estações sai a lataria low poly, como num jogo de PS2.
 *
 * O lado do motorista é +z (volante à esquerda, de frente para -x).
 * Capô e porta do motorista saem como peças separadas, para abrir.
 */

/** Estação: x, meia largura, soleira, ombro, [base do vidro, meia largura do teto, altura do teto]. */
type Station = [number, number, number, number, number?, number?, number?];

const STATIONS: Station[] = [
  // para-choque e bico
  [-2.2, 0.76, 0.27, 0.55],
  [-2.14, 0.83, 0.2, 0.63],
  [-2.0, 0.87, 0.19, 0.68],
  // caixa de roda dianteira (eixo em -1,35)
  [-1.74, 0.875, 0.2, 0.71],
  [-1.6, 0.88, 0.5, 0.73],
  [-1.35, 0.88, 0.68, 0.75],
  [-1.1, 0.88, 0.5, 0.77],
  [-0.96, 0.875, 0.2, 0.79],
  // base do para-brisa
  [-0.6, 0.875, 0.19, 0.84, 0.8, 0.7, 0.9],
  // cabine
  [-0.05, 0.875, 0.19, 0.88, 0.8, 0.64, 1.36],
  [0.5, 0.875, 0.19, 0.89, 0.8, 0.66, 1.38],
  [0.98, 0.875, 0.2, 0.9, 0.8, 0.64, 1.35],
  // vidro traseiro descendo sobre a caixa de roda traseira (eixo em 1,35)
  [1.12, 0.88, 0.5, 0.91, 0.8, 0.62, 1.27],
  [1.35, 0.88, 0.68, 0.92, 0.79, 0.6, 1.14],
  [1.58, 0.88, 0.5, 0.93, 0.79, 0.58, 1.01],
  // tampa do porta-malas
  [1.72, 0.875, 0.2, 0.94],
  [2.05, 0.86, 0.22, 0.93],
  [2.19, 0.8, 0.29, 0.85],
];

export const WHEEL = { x: 1.35, z: 0.78, r: 0.33, w: 0.24 } as const;
/** Onde o capô gira (beirada de trás, junto do para-brisa) e onde a porta gira (frente). */
export const HOOD_HINGE = new THREE.Vector3(-0.62, 0.86, 0);
export const DOOR_HINGE = new THREE.Vector3(-0.6, 0.5, 0.875);

/** Perfil (meia seção) de uma estação: 8 pontos, de baixo no meio até o meio do teto. */
function profile(s: Station): [number, number][] {
  const [, hw, y0, yb, gwIn, rwIn, ryIn] = s;
  const cabin = gwIn !== undefined;
  const gw = cabin ? gwIn : hw * 0.84;
  const rw = cabin ? rwIn! : hw * 0.5;
  const ry = cabin ? ryIn! : yb + 0.045;
  const gy = cabin ? yb + 0.02 : yb + 0.025;
  return [
    [0, y0],
    [hw * 0.9, y0],
    [hw, y0 + Math.min(0.16, (yb - y0) * 0.4)],
    [hw, yb - 0.09],
    [hw * 0.965, yb],
    [gw, gy],
    [rw, ry],
    [0, ry + (cabin ? 0.025 : 0.008)],
  ];
}

const CABIN_SIDE: [number, number] = [-0.6, 1.35];
const WINDSHIELD: [number, number] = [-0.6, -0.05];
const REAR_GLASS: [number, number] = [0.98, 1.58];
const HOOD: [number, number] = [-2.0, -0.6];
const DOOR: [number, number] = [-0.6, 0.5];

type Part = 'body' | 'glass' | 'hood' | 'door' | 'doorGlass';

const within = (a: number, b: number, [lo, hi]: [number, number]) =>
  a >= lo - 1e-6 && b <= hi + 1e-6;

/** Em que peça fica cada quadradinho da lataria (faixa b entre as estações a e b). */
function partOf(x0: number, x1: number, band: number, side: number): Part {
  if (band === 6) {
    if (within(x0, x1, WINDSHIELD) || within(x0, x1, REAR_GLASS)) return 'glass';
    if (within(x0, x1, HOOD)) return 'hood';
    return 'body';
  }
  if (band === 5) {
    if (within(x0, x1, CABIN_SIDE)) {
      return side > 0 && within(x0, x1, DOOR) ? 'doorGlass' : 'glass';
    }
    if (within(x0, x1, HOOD)) return 'hood';
    return 'body';
  }
  if (band === 4 && within(x0, x1, HOOD)) return 'hood';
  if (side > 0 && band >= 1 && band <= 4 && within(x0, x1, DOOR)) return 'door';
  return 'body';
}

export interface CarBodyGeometry {
  body: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  /** Capô, já com a origem na dobradiça (HOOD_HINGE). */
  hood: THREE.BufferGeometry;
  /** Porta do motorista e o vidro dela, com a origem na dobradiça (DOOR_HINGE). */
  door: THREE.BufferGeometry;
  doorGlass: THREE.BufferGeometry;
}

export function buildCarBody(): CarBodyGeometry {
  const parts: Record<Part, number[]> = { body: [], glass: [], hood: [], door: [], doorGlass: [] };
  const rings = STATIONS.map(profile);
  const pt = (i: number, j: number, side: number) => {
    const [z, y] = rings[i][j];
    return [STATIONS[i][0], y, z * side];
  };
  const tri = (part: Part, a: number[], b: number[], c: number[]) =>
    parts[part].push(...a, ...b, ...c);

  for (const side of [1, -1]) {
    for (let i = 0; i < STATIONS.length - 1; i++) {
      for (let j = 0; j < 7; j++) {
        const part = partOf(STATIONS[i][0], STATIONS[i + 1][0], j, side);
        const a = pt(i, j, side);
        const b = pt(i + 1, j, side);
        const c = pt(i + 1, j + 1, side);
        const d = pt(i, j + 1, side);
        // a ordem dos vértices vira com o lado, para a face apontar para fora
        if (side > 0) {
          tri(part, a, b, c);
          tri(part, a, c, d);
        } else {
          tri(part, a, d, c);
          tri(part, a, c, b);
        }
      }
    }
    // tampas da frente e de trás (leque a partir do meio)
    for (const i of [0, STATIONS.length - 1]) {
      const mid = [STATIONS[i][0], (rings[i][0][1] + rings[i][7][1]) / 2, 0];
      for (let j = 0; j < 7; j++) {
        const a = pt(i, j, side);
        const b = pt(i, j + 1, side);
        // na frente a tampa olha para -x, atrás para +x
        if (side > 0 === (i === 0)) tri('body', mid, a, b);
        else tri('body', mid, b, a);
      }
    }
  }

  const make = (data: number[], origin?: THREE.Vector3) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(data, 3));
    if (origin) g.translate(-origin.x, -origin.y, -origin.z);
    return crease(g, 28);
  };
  return {
    body: make(parts.body),
    glass: make(parts.glass),
    hood: make(parts.hood, HOOD_HINGE),
    door: make(parts.door, DOOR_HINGE),
    doorGlass: make(parts.doorGlass, DOOR_HINGE),
  };
}
