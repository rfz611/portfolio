import * as THREE from 'three';
import { isHandheld } from '../config/quality';
import { mulberry32 } from './random';

export { mulberry32, type Rand } from './random';

/**
 * Ferramentas para pintar texturas em canvas, no espírito do PS2:
 * o detalhe (veio da madeira, costura do couro) é pintado, não modelado.
 */
export type Ctx = CanvasRenderingContext2D;

let paintScale: number | null = null;

/**
 * No celular as texturas grandes (512 px ou mais) saem com metade da
 * resolução: a tela é pequena e desenhada a 1x, então os pixels a mais não
 * apareceriam, e pintar e enviar cada uma à placa de vídeo custa quatro
 * vezes menos.
 */
function scaleFor(w: number, h: number) {
  paintScale ??= isHandheld() ? 0.5 : 1;
  return Math.max(w, h) >= 512 ? paintScale : 1;
}

/**
 * Pinta um canvas de w x h. A pintura sempre trabalha em w x h; quando o
 * canvas sai menor (celular), a escala fica no contexto só durante o desenho.
 */
export function makeCanvas(
  w: number,
  h: number,
  draw: (ctx: Ctx, w: number, h: number) => void,
): HTMLCanvasElement {
  const s = scaleFor(w, h);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * s);
  canvas.height = Math.round(h * s);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2d indisponível');
  if (s !== 1) ctx.scale(s, s);
  draw(ctx, w, h);
  // quem redesenhar depois usa o tamanho real do canvas, sem escala
  if (s !== 1) ctx.setTransform(1, 0, 0, 1, 0, 0);
  return canvas;
}

export interface TexOpts {
  repeat?: [number, number];
  clamp?: boolean;
  aniso?: number;
}

export function tex(canvas: HTMLCanvasElement, o: TexOpts = {}): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = o.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  if (o.repeat) t.repeat.set(o.repeat[0], o.repeat[1]);
  t.anisotropy = o.aniso ?? 4;
  return t;
}

/** Mesma imagem, outra repetição (não gasta memória de vídeo a mais). */
export function retile<T extends THREE.Texture>(t: T, rx: number, ry: number): T {
  const c = t.clone() as T;
  c.repeat.set(rx, ry);
  c.needsUpdate = true;
  return c;
}

export function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

/** Clareia (f > 1) ou escurece (f < 1) uma cor. */
export function shade(hex: string, f: number): string {
  const [r, g, b] = rgb(hex);
  return toHex(r * f, g * f, b * f);
}

export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Ruído suave que se repete nas bordas (bom para texturas que ladrilham). */
export function valueNoise(seed: number, period: number) {
  const r = mulberry32(seed);
  const grid = new Float32Array(period * period);
  for (let i = 0; i < grid.length; i++) grid[i] = r();
  // chamado milhões de vezes ao pintar: lê os quatro cantos uma vez só
  return (x: number, y: number) => {
    const fxi = Math.floor(x);
    const fyi = Math.floor(y);
    const fx = x - fxi;
    const fy = y - fyi;
    let xi = fxi % period;
    if (xi < 0) xi += period;
    let yi = fyi % period;
    if (yi < 0) yi += period;
    const x1 = xi + 1 === period ? 0 : xi + 1;
    const row0 = yi * period;
    const row1 = (yi + 1 === period ? 0 : yi + 1) * period;
    const a = grid[row0 + xi];
    const b = grid[row0 + x1];
    const c = grid[row1 + xi];
    const d = grid[row1 + x1];
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = a + (b - a) * sx;
    const bottom = c + (d - c) * sx;
    return top + (bottom - top) * sy;
  };
}

export interface GrainOpts {
  seed: number;
  /** Granulado fino, pixel a pixel (0 a 1). */
  fine?: number;
  /** Manchas largas e suaves (0 a 1). */
  low?: number;
  cells?: number;
}

/**
 * Soma ruído de luminosidade à pintura inteira. Trabalha nos pixels de
 * verdade do canvas, que podem ser menos que w x h quando a textura é
 * pintada em escala reduzida (celular).
 */
export function grain(ctx: Ctx, _w: number, _h: number, o: GrainOpts) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  const r = mulberry32(o.seed);
  const fine = (o.fine ?? 0.04) * 255;
  const low = (o.low ?? 0) * 255 * 2;
  const cells = o.cells ?? 6;
  // As manchas largas mudam devagar: são calculadas numa grade a cada STEP
  // pixels e interpoladas no meio (bem mais rápido, e o olho não vê diferença).
  const STEP = 4;
  const gw = Math.ceil(w / STEP) + 1;
  const gh = Math.ceil(h / STEP) + 1;
  let lowGrid: Float32Array | null = null;
  if (low > 0) {
    const n1 = valueNoise(o.seed + 7, cells);
    const n2 = valueNoise(o.seed + 13, cells * 4);
    lowGrid = new Float32Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) {
      const v = ((gy * STEP) / h) * cells;
      for (let gx = 0; gx < gw; gx++) {
        const u = ((gx * STEP) / w) * cells;
        lowGrid[gy * gw + gx] = ((n1(u, v) - 0.5) * 0.7 + (n2(u * 4, v * 4) - 0.5) * 0.3) * low;
      }
    }
  }
  const row = new Float32Array(gw);
  let i = 0;
  for (let y = 0; y < h; y++) {
    if (lowGrid) {
      const gy = (y / STEP) | 0;
      const ty = (y - gy * STEP) / STEP;
      const top = gy * gw;
      const bottom = top + gw;
      for (let gx = 0; gx < gw; gx++) {
        row[gx] = lowGrid[top + gx] + (lowGrid[bottom + gx] - lowGrid[top + gx]) * ty;
      }
    }
    for (let x = 0; x < w; x++) {
      let n = (r() - 0.5) * fine;
      if (lowGrid) {
        const gx = (x / STEP) | 0;
        const a = row[gx];
        n += a + (row[gx + 1] - a) * ((x - gx * STEP) / STEP);
      }
      d[i] += n;
      d[i + 1] += n;
      d[i + 2] += n;
      i += 4;
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Gradiente linear rápido (para "assar" sombra na textura). */
export function fade(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  from: string,
  to: string,
  vertical = true,
) {
  const g = vertical
    ? ctx.createLinearGradient(0, y, 0, y + h)
    : ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
}
