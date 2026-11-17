import * as THREE from 'three';
import { mulberry32 } from './random';

export { mulberry32, type Rand } from './random';

/**
 * Ferramentas para pintar texturas em canvas, no espírito do PS2:
 * o detalhe (veio da madeira, costura do couro) é pintado, não modelado.
 */
export type Ctx = CanvasRenderingContext2D;

export function makeCanvas(
  w: number,
  h: number,
  draw: (ctx: Ctx, w: number, h: number) => void,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas 2d indisponível');
  draw(ctx, w, h);
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
  const at = (x: number, y: number) =>
    grid[(((y % period) + period) % period) * period + (((x % period) + period) % period)];
  return (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * sx;
    const bottom = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * sx;
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

/** Soma ruído de luminosidade à pintura inteira. */
export function grain(ctx: Ctx, w: number, h: number, o: GrainOpts) {
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;
  const r = mulberry32(o.seed);
  const fine = (o.fine ?? 0.04) * 255;
  const low = (o.low ?? 0) * 255 * 2;
  const cells = o.cells ?? 6;
  const n1 = valueNoise(o.seed + 7, cells);
  const n2 = valueNoise(o.seed + 13, cells * 4);
  let i = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = (r() - 0.5) * fine;
      if (low > 0) {
        const u = (x / w) * cells;
        const v = (y / h) * cells;
        n += ((n1(u, v) - 0.5) * 0.7 + (n2(u * 4, v * 4) - 0.5) * 0.3) * low;
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
