import { grain, rgba, type Ctx } from './canvas';
import { mulberry32 } from './random';
import { paintMarble } from './room';

const DISPLAY = '"Bodoni Moda", Didot, serif';

export interface RugColors {
  field: string;
  border: string;
  accent: string;
  ink: string;
}

/** Tapete persa gasto (como nos interiores de Max Payne 2): bordas, medalhão e motivos. */
export function paintRug(ctx: Ctx, w: number, h: number, seed: number, c: RugColors) {
  const r = mulberry32(seed);
  ctx.fillStyle = c.field;
  ctx.fillRect(0, 0, w, h);
  const band = (inset: number, size: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = size;
    ctx.strokeRect(inset + size / 2, inset + size / 2, w - inset * 2 - size, h - inset * 2 - size);
  };
  band(w * 0.03, w * 0.05, c.border);
  band(w * 0.085, w * 0.012, c.accent);
  band(w * 0.105, w * 0.03, c.ink);
  band(w * 0.14, w * 0.008, c.accent);
  // motivos da borda: losangos em fileira
  ctx.fillStyle = c.accent;
  const diamond = (x: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - w * 0.014);
    ctx.lineTo(x + w * 0.012, y);
    ctx.lineTo(x, y + w * 0.014);
    ctx.lineTo(x - w * 0.012, y);
    ctx.fill();
  };
  for (let t = w * 0.07; t < w * 0.94; t += w * 0.045) {
    diamond(t, w * 0.055);
    diamond(t, h - w * 0.055);
    diamond(w * 0.055, t);
    diamond(w - w * 0.055, t);
  }
  // medalhão central em camadas
  const cx = w / 2;
  const cy = h / 2;
  const layers: [number, string][] = [
    [0.4, c.ink],
    [0.33, c.border],
    [0.25, c.accent],
    [0.17, c.field],
    [0.09, c.border],
  ];
  for (const [size, color] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2;
      const rad = (k % 2 === 0 ? 1 : 0.78) * size;
      ctx.lineTo(cx + Math.cos(a) * rad * w * 0.5, cy + Math.sin(a) * rad * h * 0.5);
    }
    ctx.fill();
  }
  // motivos espalhados no campo
  for (let i = 0; i < 160; i++) {
    const x = w * (0.19 + r() * 0.62);
    const y = h * (0.19 + r() * 0.62);
    if (Math.hypot((x - cx) / w, (y - cy) / h) < 0.22) continue;
    ctx.fillStyle = rgba(r() > 0.5 ? c.accent : c.ink, 0.6);
    const s = w * (0.006 + r() * 0.01);
    ctx.fillRect(x - s, y - s / 3, s * 2, s * 0.66);
    ctx.fillRect(x - s / 3, y - s, s * 0.66, s * 2);
  }
  // desgaste: manchas claras de pisada
  for (let i = 0; i < 18; i++) {
    const x = w * (0.25 + r() * 0.5);
    const y = h * (0.25 + r() * 0.5);
    const rad = w * (0.05 + r() * 0.12);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(230,210,180,0.1)');
    g.addColorStop(1, 'rgba(230,210,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  grain(ctx, w, h, { seed: seed + 1, fine: 0.12, low: 0.08, cells: 5 });
  // franja nas pontas
  ctx.fillStyle = '#d9cdb4';
  for (let x = 0; x < w; x += 3) {
    ctx.fillRect(x, 0, 1.5, h * 0.014);
    ctx.fillRect(x, h - h * 0.014, 1.5, h * 0.014);
  }
}

/** Mármore claro do piso do bar, em placas. */
export function paintMarbleTiles(ctx: Ctx, w: number, h: number, seed: number) {
  paintMarble(ctx, w, h, seed);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(62,56,50,0.9)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, w, 3);
  ctx.fillRect(0, 0, 3, h);
}

/** Folha de papel com linhas de texto ilegíveis. */
export function paintPaper(ctx: Ctx, w: number, h: number, seed: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#ddd4c2';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(40,36,40,0.55)';
  for (let y = h * 0.12; y < h * 0.9; y += h * 0.045) {
    let x = w * 0.1;
    while (x < w * 0.88) {
      const word = w * (0.03 + r() * 0.1);
      ctx.fillRect(x, y, Math.min(word, w * 0.9 - x), h * 0.012);
      x += word + w * 0.02;
    }
  }
  grain(ctx, w, h, { seed: seed + 1, fine: 0.04 });
}

/** Carta de baralho inventada (sem personagens): naipe grande e canto. */
export function paintCard(
  ctx: Ctx,
  w: number,
  h: number,
  suit: string,
  rank: string,
  red: boolean,
) {
  ctx.fillStyle = '#efe6d2';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = red ? '#9e1322' : '#141414';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${w * 0.22}px ${DISPLAY}`;
  ctx.fillText(rank, w * 0.16, h * 0.1);
  ctx.font = `${w * 0.6}px serif`;
  ctx.fillText(suit, w / 2, h / 2);
}
