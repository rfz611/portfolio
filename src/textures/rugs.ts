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

/**
 * Tapete persa (como nos interiores de Max Payne 2): campo com treliça de
 * flores, medalhão central em camadas com pendentes, cantoneiras, borda
 * larga com ramagem entre faixas finas, desgaste e franja.
 */
export function paintRug(ctx: Ctx, w: number, h: number, seed: number, c: RugColors) {
  const r = mulberry32(seed);
  const cx = w / 2;
  const cy = h / 2;
  const u = Math.min(w, h);

  const flower = (x: number, y: number, size: number, petal: string, heart: string) => {
    ctx.fillStyle = petal;
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(
        x + Math.cos(a) * size * 0.55,
        y + Math.sin(a) * size * 0.55,
        size * 0.42,
        size * 0.22,
        a,
        0,
        6.283,
      );
      ctx.fill();
    }
    ctx.fillStyle = heart;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.28, 0, 6.283);
    ctx.fill();
  };
  const leaf = (x: number, y: number, size: number, angle: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.quadraticCurveTo(0, -size * 0.45, size, 0);
    ctx.quadraticCurveTo(0, size * 0.45, -size, 0);
    ctx.fill();
    ctx.restore();
  };

  // campo
  ctx.fillStyle = c.field;
  ctx.fillRect(0, 0, w, h);
  // treliça de losangos com uma flor em cada nó (padrão "herati" simplificado)
  const cell = u * 0.075;
  ctx.strokeStyle = rgba(c.ink, 0.45);
  ctx.lineWidth = u * 0.0035;
  for (let y = -cell; y < h + cell; y += cell) {
    for (let x = -cell; x < w + cell; x += cell) {
      const ox = (Math.round(y / cell) % 2) * (cell / 2);
      ctx.beginPath();
      ctx.moveTo(x + ox, y - cell / 2);
      ctx.lineTo(x + ox + cell / 2, y);
      ctx.lineTo(x + ox, y + cell / 2);
      ctx.lineTo(x + ox - cell / 2, y);
      ctx.closePath();
      ctx.stroke();
      flower(x + ox, y, cell * 0.16, rgba(c.accent, 0.7), c.border);
      leaf(x + ox + cell * 0.25, y, cell * 0.12, 0, rgba(c.ink, 0.55));
      leaf(x + ox - cell * 0.25, y, cell * 0.12, 0, rgba(c.ink, 0.55));
    }
  }

  // medalhão central: estrela de 16 pontas em camadas, com pendentes
  const star = (size: number, color: string, sharp: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let k = 0; k < 32; k++) {
      const a = (k / 32) * Math.PI * 2;
      const rad = (k % 2 === 0 ? 1 : sharp) * size;
      ctx.lineTo(cx + Math.cos(a) * rad * 0.62 * w, cy + Math.sin(a) * rad * 0.62 * h);
    }
    ctx.closePath();
    ctx.fill();
  };
  for (const dir of [-1, 1]) {
    ctx.fillStyle = c.ink;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.05, cy + dir * h * 0.2);
    ctx.lineTo(cx, cy + dir * h * 0.33);
    ctx.lineTo(cx + w * 0.05, cy + dir * h * 0.2);
    ctx.fill();
    flower(cx, cy + dir * h * 0.3, u * 0.025, c.accent, c.border);
  }
  star(0.36, c.ink, 0.86);
  star(0.33, c.accent, 0.86);
  star(0.3, c.border, 0.88);
  star(0.22, c.field, 0.84);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    flower(cx + Math.cos(a) * w * 0.095, cy + Math.sin(a) * h * 0.095, u * 0.022, c.accent, c.ink);
    leaf(cx + Math.cos(a) * w * 0.06, cy + Math.sin(a) * h * 0.06, u * 0.02, a, c.ink);
  }
  star(0.06, c.accent, 0.7);
  flower(cx, cy, u * 0.03, c.border, c.accent);

  // cantoneiras: um quarto de medalhão em cada canto do campo
  const inner = u * 0.17;
  for (const [x, y] of [
    [inner, inner],
    [w - inner, inner],
    [inner, h - inner],
    [w - inner, h - inner],
  ]) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(inner, inner, w - inner * 2, h - inner * 2);
    ctx.clip();
    for (const [rad, color] of [
      [0.2, c.ink],
      [0.17, c.border],
      [0.12, c.accent],
      [0.08, c.field],
    ] as const) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, u * rad, 0, 6.283);
      ctx.fill();
    }
    ctx.restore();
  }

  // bordas: faixa externa, faixa larga com ramagem, faixas finas
  const band = (inset: number, size: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(inset, inset, w - inset * 2, size);
    ctx.fillRect(inset, h - inset - size, w - inset * 2, size);
    ctx.fillRect(inset, inset, size, h - inset * 2);
    ctx.fillRect(w - inset - size, inset, size, h - inset * 2);
  };
  band(u * 0.025, u * 0.03, c.ink);
  band(u * 0.055, u * 0.008, c.accent);
  band(u * 0.063, u * 0.085, c.border);
  band(u * 0.148, u * 0.008, c.accent);
  band(u * 0.156, u * 0.012, c.ink);
  // ramagem na faixa larga: um caule ondulado com flores e folhas
  const mid = u * 0.1055;
  const vine = (x0: number, y0: number, x1: number, y1: number) => {
    const length = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.floor(length / (u * 0.05));
    const nx = -(y1 - y0) / length;
    const ny = (x1 - x0) / length;
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = u * 0.004;
    ctx.beginPath();
    for (let i = 0; i <= steps * 4; i++) {
      const t = i / (steps * 4);
      const wave = Math.sin(t * steps * Math.PI) * u * 0.022;
      ctx.lineTo(x0 + (x1 - x0) * t + nx * wave, y0 + (y1 - y0) * t + ny * wave);
    }
    ctx.stroke();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const side = i % 2 ? 1 : -1;
      const x = x0 + (x1 - x0) * t + nx * side * u * 0.024;
      const y = y0 + (y1 - y0) * t + ny * side * u * 0.024;
      flower(x, y, u * 0.016, i % 3 ? c.accent : c.field, c.ink);
      leaf(
        x - nx * side * u * 0.02,
        y - ny * side * u * 0.02,
        u * 0.012,
        Math.atan2(ny, nx),
        c.field,
      );
    }
  };
  vine(mid, mid, w - mid, mid);
  vine(w - mid, h - mid, mid, h - mid);
  vine(mid, h - mid, mid, mid);
  vine(w - mid, mid, w - mid, h - mid);
  for (const [x, y] of [
    [mid, mid],
    [w - mid, mid],
    [mid, h - mid],
    [w - mid, h - mid],
  ]) {
    flower(x, y, u * 0.03, c.accent, c.ink);
  }

  // desgaste: manchas claras de pisada e fibras
  for (let i = 0; i < 22; i++) {
    const x = w * (0.2 + r() * 0.6);
    const y = h * (0.2 + r() * 0.6);
    const rad = u * (0.05 + r() * 0.14);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, 'rgba(235,215,185,0.09)');
    g.addColorStop(1, 'rgba(235,215,185,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  grain(ctx, w, h, { seed: seed + 1, fine: 0.14, low: 0.07, cells: 6 });
  // franja nas pontas
  ctx.fillStyle = '#d9cdb4';
  for (let x = 0; x < w; x += 3) {
    ctx.fillRect(x, 0, 1.6, h * 0.018 + r() * 2);
    ctx.fillRect(x, h - h * 0.018 - r() * 2, 1.6, h * 0.02);
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
