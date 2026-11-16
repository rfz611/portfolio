import * as THREE from 'three';
import { mergeGeometries, toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Ajudantes de modelagem low poly. Todas as peças saem com UV em metros,
 * para a textura ter a mesma densidade em qualquer móvel.
 */
type V3 = readonly [number, number, number];

export interface PartOpts {
  /** Metros cobertos por uma repetição da textura. */
  uv?: number;
  /** Troca u e v (veio da madeira em pé). */
  swap?: boolean;
  rot?: V3;
}

function place(g: THREE.BufferGeometry, pos: V3, o: PartOpts) {
  if (o.rot) {
    g.rotateX(o.rot[0]);
    g.rotateY(o.rot[1]);
    g.rotateZ(o.rot[2]);
  }
  g.translate(pos[0], pos[1], pos[2]);
  return g;
}

function swapUv(g: THREE.BufferGeometry) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i));
}

/** Caixa com UV proporcional ao tamanho de cada face. */
export function box(size: V3, pos: V3 = [0, 0, 0], o: PartOpts = {}): THREE.BufferGeometry {
  const [w, h, d] = size;
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const s = o.uv ?? 1;
  const dims = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * dims[f][0]) / s, (uv.getY(k) * dims[f][1]) / s);
    }
  }
  if (o.swap) swapUv(g);
  return place(g, pos, o);
}

/** Cilindro ou cone truncado (rt = raio de cima, rb = raio de baixo). */
export function cyl(
  rt: number,
  rb: number,
  h: number,
  pos: V3 = [0, 0, 0],
  o: PartOpts & { seg?: number; open?: boolean } = {},
): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 24, 1, o.open ?? false);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const s = o.uv ?? 1;
  const around = (2 * Math.PI * Math.max(rt, rb)) / s;
  // só a lateral recebe UV em metros; as tampas ficam de 0 a 1
  const sideCount = ((o.seg ?? 24) + 1) * 2;
  for (let i = 0; i < sideCount; i++) uv.setXY(i, uv.getX(i) * around, (uv.getY(i) * h) / s);
  if (o.swap) swapUv(g);
  return place(g, pos, o);
}

/**
 * Sólido de revolução: gira um perfil (raio, altura) em torno do eixo y.
 * Serve para abajur, copo, garrafa e também para o sofá curvo (um arco).
 * UV: u acompanha o arco, v acompanha o comprimento do perfil.
 */
export function lathe(
  profile: readonly (readonly [number, number])[],
  o: PartOpts & {
    seg?: number;
    start?: number;
    length?: number;
    uRepeat?: number;
    vRepeat?: number;
  } = {},
  pos: V3 = [0, 0, 0],
): THREE.BufferGeometry {
  const seg = o.seg ?? 24;
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, seg, o.start ?? 0, o.length ?? Math.PI * 2);
  const lengths = [0];
  for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const total = lengths[lengths.length - 1] || 1;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i <= seg; i++) {
    for (let j = 0; j < pts.length; j++) {
      const k = i * pts.length + j;
      uv.setXY(k, (i / seg) * (o.uRepeat ?? 1), (lengths[j] / total) * (o.vRepeat ?? 1));
    }
  }
  return place(g, pos, o);
}

export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  if (!merged) throw new Error('não foi possível unir as geometrias');
  return merged;
}

/** Quinas vivas onde o ângulo passa do limite, suave no resto. */
export function crease(g: THREE.BufferGeometry, degrees = 35): THREE.BufferGeometry {
  return toCreasedNormals(g, (degrees * Math.PI) / 180);
}

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  r?: number;
}

/** Retângulo de cantos arredondados no plano do chão (coordenadas x, -z). */
export function roundedRect({ x0, x1, z0, z1, r = 0 }: Rect): THREE.Shape {
  const s = new THREE.Shape();
  const y0 = -z1;
  const y1 = -z0;
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  if (r > 0) s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  if (r > 0) s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  if (r > 0) s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  if (r > 0) s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Deita uma forma no chão, na altura y. UV em metros. */
export function flat(shape: THREE.Shape, y: number, uv = 1): THREE.BufferGeometry {
  const g = new THREE.ShapeGeometry(shape, 10);
  const a = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < a.count; i++) a.setXY(i, a.getX(i) / uv, a.getY(i) / uv);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

/**
 * Faixa vertical que acompanha um contorno fechado (espelho de degrau).
 * A face olha para o centro do contorno.
 */
export function ribbon(
  shape: THREE.Shape,
  yTop: number,
  yBottom: number,
  uv = 1,
  inset = 0,
): THREE.BufferGeometry {
  const raw = shape.getPoints(10);
  const pts = raw.filter((p, i) => i === 0 || p.distanceTo(raw[i - 1]) > 1e-4);
  if (pts[0].distanceTo(pts[pts.length - 1]) < 1e-4) pts.pop();
  const center = pts
    .reduce((acc, p) => acc.add(p), new THREE.Vector2())
    .multiplyScalar(1 / pts.length);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const index: number[] = [];
  let run = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i].clone();
    const b = pts[(i + 1) % pts.length].clone();
    if (inset) {
      a.lerp(center, inset);
      b.lerp(center, inset);
    }
    const len = a.distanceTo(b);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    let nx = -(b.y - a.y);
    let ny = b.x - a.x;
    if (nx * (center.x - mid.x) + ny * (center.y - mid.y) < 0) {
      nx = -nx;
      ny = -ny;
    }
    const nl = Math.hypot(nx, ny) || 1;
    const k = positions.length / 3;
    // forma (x, y) -> mundo (x, altura, -y)
    positions.push(a.x, yTop, -a.y, b.x, yTop, -b.y, a.x, yBottom, -a.y, b.x, yBottom, -b.y);
    for (let n = 0; n < 4; n++) normals.push(nx / nl, 0, -ny / nl);
    uvs.push(
      run / uv,
      yTop / uv,
      (run + len) / uv,
      yTop / uv,
      run / uv,
      yBottom / uv,
      (run + len) / uv,
      yBottom / uv,
    );
    index.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    run += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(index);
  return g;
}

/** Plano vertical (parede) de frente para +z antes da rotação. */
export function wall(width: number, height: number, pos: V3, rotY: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(width, height);
  g.rotateY(rotY);
  g.translate(pos[0], pos[1], pos[2]);
  return g;
}
