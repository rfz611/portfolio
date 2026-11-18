import * as THREE from 'three';
import { crease } from '../../scene/geo';

/**
 * Carroceria do sedã esportivo no formato do Lancer Evolution da referência
 * (4,45 × 1,42 × 1,77 m), feita "por seções": ao longo do comprimento
 * (x, frente para -x) há estações, e cada uma tem o perfil da lateral com
 * 13 pontos (soleira arredondada, porta, vinco do ombro, vidro curvo,
 * teto). Ligando as estações sai a lataria low poly, como num jogo de PS2.
 *
 * Caixas de roda redondas (as estações em volta do eixo sobem a soleira
 * em arco) e para-lamas alargados. O lado do motorista é +z.
 * Capô e porta do motorista saem como peças separadas, para abrir.
 */

export const FRONT_X = -2.25;
export const REAR_X = 2.2;
export const AXLE = { front: -1.33, rear: 1.3 } as const;
export const WHEEL = { r: 0.33, w: 0.25, z: 0.79 } as const;
const ARCH_R = 0.38;
/** Dobradiça do capô (junto do para-brisa) e da porta do motorista (na frente da porta). */
export const HOOD_HINGE = new THREE.Vector3(-0.64, 0.88, 0);
export const DOOR_HINGE = new THREE.Vector3(-0.56, 0.5, 0.87);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Interpola uma tabela [x, valor] (suave entre os pontos). */
function table(points: [number, number][], x: number) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, v0] = points[i];
    const [x1, v1] = points[i + 1];
    if (x <= x1) return lerp(v0, v1, smooth((x - x0) / (x1 - x0)));
  }
  return points[points.length - 1][1];
}

/** Linha de cintura (topo do ombro): sobe da frente para trás, em cunha. */
const BELT: [number, number][] = [
  [-2.25, 0.56],
  [-2.17, 0.66],
  [-2.02, 0.74],
  [-1.33, 0.815],
  [-0.64, 0.875],
  [-0.2, 0.89],
  [0.4, 0.905],
  [1.0, 0.93],
  [1.62, 0.965],
  [2.06, 0.97],
  [2.2, 0.9],
];
/** Teto (com para-brisa e vidro traseiro inclinados). */
const ROOF: [number, number][] = [
  [-0.64, 0.92],
  [0.12, 1.37],
  [0.55, 1.405],
  [1.0, 1.37],
  [1.62, 1.0],
];
/** Meia largura do teto (a cabine afina para cima). */
const ROOF_W: [number, number][] = [
  [-0.64, 0.72],
  [0.12, 0.6],
  [0.6, 0.6],
  [1.0, 0.59],
  [1.62, 0.7],
];

function halfWidth(x: number) {
  let hw = 0.865;
  if (x < -2.02) hw = lerp(0.86, 0.76, smooth((-2.02 - x) / 0.23));
  if (x > 2.02) hw = lerp(0.86, 0.8, smooth((x - 2.02) / 0.18));
  // para-lamas alargados em volta das rodas
  for (const ax of [AXLE.front, AXLE.rear]) {
    const d = Math.abs(x - ax) / 0.62;
    if (d < 1) hw += 0.028 * smooth(1 - d);
  }
  return hw;
}

function sill(x: number) {
  let y0 = 0.21;
  if (x < -1.95) y0 = lerp(0.21, 0.16, smooth((-1.95 - x) / 0.3));
  if (x > 1.9) y0 = lerp(0.21, 0.25, smooth((x - 1.9) / 0.3));
  // arco da caixa de roda
  for (const ax of [AXLE.front, AXLE.rear]) {
    const dx = x - ax;
    if (Math.abs(dx) < ARCH_R) y0 = Math.max(y0, WHEEL.r + Math.sqrt(ARCH_R ** 2 - dx * dx));
  }
  return y0;
}

const CABIN: [number, number] = [-0.64, 1.62];
const inCabin = (x: number) => x > CABIN[0] - 1e-6 && x < CABIN[1] + 1e-6;

/** Perfil (meia seção) de uma estação: 13 pontos, de baixo no meio até o meio do teto. */
function profile(x: number): [number, number][] {
  const hw = halfWidth(x);
  const y0 = sill(x);
  const yb = table(BELT, x);
  const cabin = inCabin(x);
  const crown = x < 0 ? 0.05 : 0.035;
  const gy = cabin ? yb + 0.02 : yb + 0.012;
  const gw = cabin ? hw - 0.1 : hw * 0.88;
  const ry = cabin ? table(ROOF, x) : yb + crown;
  // fora da cabine, a beirada do teto vira a do capô/tampa aos poucos (sem degrau)
  let rw = cabin ? table(ROOF_W, x) : hw * 0.55;
  if (!cabin) {
    const end = x < CABIN[0] ? CABIN[0] : CABIN[1];
    const d = Math.abs(x - end);
    if (d < 0.45) rw = lerp(table(ROOF_W, end), hw * 0.55, smooth(d / 0.45));
  }
  // a lateral de baixo some na caixa de roda: os pontos não podem cruzar
  const top = Math.max(yb - 0.1, y0 + 0.012);
  const p2 = Math.min(y0 + 0.04, top);
  const p3 = Math.min(y0 + 0.13, top);
  const p4 = lerp(p3, top, 0.5);
  return [
    [0, y0],
    // na caixa de roda a beirada fica quase reta (sem aba aparecendo)
    [hw * (y0 > 0.26 ? 0.97 : 0.86), y0],
    [hw * 0.975, p2],
    [hw, p3],
    [hw * 1.004, p4],
    [hw, top],
    [hw * 0.985, Math.max(yb - 0.035, top + 0.005)],
    [hw * 0.952, yb],
    [gw, gy],
    [lerp(gw, rw, 0.5) + (cabin ? 0.018 : 0.012), lerp(gy, ry, 0.5) + (cabin ? 0 : 0.004)],
    [rw, ry],
    [rw * 0.5, ry + (cabin ? 0.018 : 0.008)],
    [0, ry + (cabin ? 0.024 : 0.01)],
  ];
}

/** Estações ao longo do carro (mais densas nas curvas e em volta das rodas). */
function stations() {
  const xs = new Set<number>([
    FRONT_X,
    -2.22,
    -2.17,
    -2.1,
    -2.02,
    -1.9,
    -0.8,
    -0.64,
    -0.56,
    -0.45,
    -0.2,
    0.12,
    0.37,
    0.45,
    0.75,
    1.0,
    1.62,
    1.8,
    1.95,
    2.06,
    2.14,
    REAR_X,
  ]);
  for (const ax of [AXLE.front, AXLE.rear]) {
    for (let k = 0; k <= 8; k++) xs.add(+(ax - ARCH_R + (k / 8) * 2 * ARCH_R).toFixed(4));
    xs.add(+(ax - ARCH_R - 0.04).toFixed(4));
    xs.add(+(ax + ARCH_R + 0.04).toFixed(4));
  }
  return [...xs].sort((a, b) => a - b);
}

type Part = 'body' | 'glass' | 'trim' | 'hood' | 'door' | 'doorGlass' | 'doorTrim';

const between = (x0: number, x1: number, lo: number, hi: number) =>
  x0 >= lo - 1e-6 && x1 <= hi + 1e-6;

const HOOD: [number, number] = [-2.02, -0.64];
const DOOR: [number, number] = [-0.56, 0.37];

/** Em que peça fica cada quadradinho (faixa j do perfil entre as estações x0 e x1). */
function partOf(x0: number, x1: number, j: number, side: number): Part | null {
  if (j === 0) return null; // o fundo do carro é uma chapa à parte
  const driver = side > 0;
  if (j >= 10) {
    if (between(x0, x1, -0.64, 0.12) || between(x0, x1, 1.0, 1.62)) return 'glass';
    if (between(x0, x1, ...HOOD)) return 'hood';
    return 'body';
  }
  if (j === 8 || j === 9) {
    if (between(x0, x1, -0.64, -0.45)) return 'trim'; // coluna A
    if (between(x0, x1, 0.37, 0.45)) return 'trim'; // coluna B
    if (between(x0, x1, -0.45, 0.37)) return driver ? 'doorGlass' : 'glass';
    if (between(x0, x1, 0.45, 1.0)) return 'glass';
    if (between(x0, x1, ...HOOD)) return 'hood';
    return 'body';
  }
  if (j === 7 && between(x0, x1, ...HOOD)) return 'hood';
  // friso preto embaixo das janelas, do para-brisa à coluna de trás
  if (j === 7 && between(x0, x1, -0.64, 1.0)) {
    return driver && between(x0, x1, ...DOOR) ? 'doorTrim' : 'trim';
  }
  if (driver && j >= 2 && j <= 7 && between(x0, x1, ...DOOR)) return 'door';
  return 'body';
}

export interface CarBodyGeometry {
  body: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  /** Capô, com a origem na dobradiça (HOOD_HINGE). */
  hood: THREE.BufferGeometry;
  /** Porta do motorista e o vidro dela, com a origem na dobradiça (DOOR_HINGE). */
  door: THREE.BufferGeometry;
  doorGlass: THREE.BufferGeometry;
  doorTrim: THREE.BufferGeometry;
  /** Altura da superfície de cima (capô, teto, tampa) num ponto (x, z). */
  surfaceY: (x: number, z: number) => number;
  /** Perfil da lateral numa estação (para encaixar peças na lataria). */
  profile: (x: number) => [number, number][];
}

export function buildCarBody(): CarBodyGeometry {
  const xs = stations();
  const rings = xs.map(profile);
  const n = rings[0].length;
  const parts: Record<Part, { pos: number[]; uv: number[] }> = {
    body: { pos: [], uv: [] },
    glass: { pos: [], uv: [] },
    trim: { pos: [], uv: [] },
    hood: { pos: [], uv: [] },
    door: { pos: [], uv: [] },
    doorGlass: { pos: [], uv: [] },
    doorTrim: { pos: [], uv: [] },
  };
  const len = REAR_X - FRONT_X;
  const vert = (i: number, j: number, side: number) => ({
    p: [xs[i], rings[i][j][1], rings[i][j][0] * side],
    t: [(xs[i] - FRONT_X) / len, j / (n - 1)],
  });
  type V = ReturnType<typeof vert>;
  const tri = (part: Part, a: V, b: V, c: V) => {
    parts[part].pos.push(...a.p, ...b.p, ...c.p);
    parts[part].uv.push(...a.t, ...b.t, ...c.t);
  };

  for (const side of [1, -1]) {
    for (let i = 0; i < xs.length - 1; i++) {
      for (let j = 0; j < n - 1; j++) {
        const part = partOf(xs[i], xs[i + 1], j, side);
        if (!part) continue;
        const a = vert(i, j, side);
        const b = vert(i + 1, j, side);
        const c = vert(i + 1, j + 1, side);
        const d = vert(i, j + 1, side);
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
    for (const i of [0, xs.length - 1]) {
      const r = rings[i];
      const mid: V = { p: [xs[i], (r[0][1] + r[n - 1][1]) / 2, 0], t: [i ? 1 : 0, 0.5] };
      for (let j = 0; j < n - 1; j++) {
        const a = vert(i, j, side);
        const b = vert(i, j + 1, side);
        if (side > 0 === (i === 0)) tri('body', mid, a, b);
        else tri('body', mid, b, a);
      }
    }
  }

  const make = ({ pos, uv }: { pos: number[]; uv: number[] }, origin?: THREE.Vector3) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (origin) g.translate(-origin.x, -origin.y, -origin.z);
    return crease(g, 30);
  };

  // altura de cima num ponto: interpola o perfil da própria estação
  const surfaceY = (x: number, z: number) => {
    const r = profile(x);
    const az = Math.abs(z);
    for (let j = n - 1; j > 7; j--) {
      const [z0, y0] = r[j];
      const [z1, y1] = r[j - 1];
      if (az >= z0 && az <= z1) return lerp(y0, y1, (az - z0) / Math.max(1e-6, z1 - z0));
    }
    return r[7][1];
  };

  return {
    body: make(parts.body),
    glass: make(parts.glass),
    trim: make(parts.trim),
    hood: make(parts.hood, HOOD_HINGE),
    door: make(parts.door, DOOR_HINGE),
    doorGlass: make(parts.doorGlass, DOOR_HINGE),
    doorTrim: make(parts.doorTrim, DOOR_HINGE),
    surfaceY,
    profile,
  };
}
