import { palette } from '../config/palette';
import { fade, grain, rgba, shade, type Ctx } from './canvas';
import { mulberry32 } from './random';

/** Quadros e pôster das paredes (tudo inventado, sem personagens). */

const DISPLAY = '"Bodoni Moda", Didot, serif';
const BODY = '"Manrope Variable", Manrope, system-ui, sans-serif';

/** Paisagem a óleo escura, como os quadros clássicos dos escritórios de Max Payne 2. */
export function paintLandscape(ctx: Ctx, w: number, h: number, seed: number) {
  const r = mulberry32(seed);
  fade(ctx, 0, 0, w, h * 0.62, '#2a2a33', '#a7864f');
  // nuvens em pinceladas
  for (let i = 0; i < 70; i++) {
    const x = r() * w;
    const y = r() * h * 0.45;
    const rad = w * (0.03 + r() * 0.08);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, rgba(r() > 0.5 ? '#d8c39a' : '#4a4652', 0.18));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // colinas e campo
  const hill = (base: number, amp: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += w / 24) {
      ctx.lineTo(x, h * base - Math.sin((x / w) * 5 + amp * 9) * h * amp - r() * h * 0.01);
    }
    ctx.lineTo(w, h);
    ctx.fill();
  };
  hill(0.6, 0.05, '#3e4434');
  hill(0.7, 0.04, '#2c3324');
  hill(0.82, 0.03, '#1d2116');
  // árvores escuras
  for (let i = 0; i < 9; i++) {
    const x = w * (0.08 + r() * 0.84);
    const y = h * (0.62 + r() * 0.12);
    const size = w * (0.03 + r() * 0.05);
    ctx.fillStyle = r() > 0.5 ? '#141a10' : '#20281a';
    ctx.beginPath();
    ctx.ellipse(x, y - size, size * 0.7, size * 1.3, 0, 0, 6.283);
    ctx.fill();
  }
  // rio refletindo o céu
  ctx.fillStyle = 'rgba(200,170,110,0.35)';
  ctx.beginPath();
  ctx.moveTo(w * 0.45, h * 0.68);
  ctx.quadraticCurveTo(w * 0.6, h * 0.8, w * 0.38, h);
  ctx.lineTo(w * 0.52, h);
  ctx.quadraticCurveTo(w * 0.7, h * 0.8, w * 0.5, h * 0.68);
  ctx.fill();
  // verniz amarelado e craquelado
  ctx.fillStyle = 'rgba(120,80,20,0.18)';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 60; i++) {
    const x = r() * w;
    const y = r() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 40, y + (r() - 0.5) * 40);
    ctx.stroke();
  }
  grain(ctx, w, h, { seed, fine: 0.08, low: 0.05 });
}

/** Pintura dos anos 80: pôr do sol listrado atrás de prédios, com palmeiras. */
export function paintSunset(ctx: Ctx, w: number, h: number) {
  fade(ctx, 0, 0, w, h * 0.7, '#1a1440', '#c8603a');
  const sx = w * 0.5;
  const sy = h * 0.58;
  const rad = w * 0.24;
  ctx.save();
  ctx.beginPath();
  ctx.arc(sx, sy, rad, 0, 6.283);
  ctx.clip();
  fade(ctx, sx - rad, sy - rad, rad * 2, rad * 2, '#f7c46a', '#d8402e');
  ctx.fillStyle = '#1a1440';
  for (let i = 0; i < 6; i++) {
    const y = sy + rad * (0.1 + i * 0.16);
    ctx.fillRect(sx - rad, y, rad * 2, rad * 0.04 + i * 2);
  }
  ctx.restore();
  // prédios
  const r = mulberry32(5);
  ctx.fillStyle = '#0d0a1e';
  for (let x = 0; x < w;) {
    const bw = w * (0.05 + r() * 0.08);
    const bh = h * (0.12 + r() * 0.28);
    ctx.fillRect(x, h * 0.7 - bh, bw, bh + h * 0.3);
    x += bw + w * 0.005;
  }
  // palmeiras em silhueta
  const palm = (x: number, size: number) => {
    ctx.strokeStyle = '#08061a';
    ctx.lineWidth = size * 0.06;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.quadraticCurveTo(x + size * 0.2, h - size * 0.6, x + size * 0.1, h - size);
    ctx.stroke();
    ctx.fillStyle = '#08061a';
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.5;
      ctx.beginPath();
      ctx.ellipse(
        x + size * 0.1 + Math.cos(a) * size * 0.28,
        h - size + Math.sin(a) * size * 0.14 + size * 0.06,
        size * 0.32,
        size * 0.05,
        a,
        0,
        6.283,
      );
      ctx.fill();
    }
  };
  palm(w * 0.12, h * 0.75);
  palm(w * 0.86, h * 0.62);
  grain(ctx, w, h, { seed: 7, fine: 0.06, low: 0.03 });
}

/** Pôster de um filme inventado (espaço reservado para os filmes favoritos). */
export function paintPoster(ctx: Ctx, w: number, h: number, title: string, tagline: string) {
  fade(ctx, 0, 0, w, h, '#2a0508', '#070308');
  // silhueta de cidade e uma lua
  ctx.fillStyle = rgba(palette.amber, 0.85);
  ctx.beginPath();
  ctx.arc(w * 0.68, h * 0.3, w * 0.14, 0, 6.283);
  ctx.fill();
  const r = mulberry32(11);
  ctx.fillStyle = '#050206';
  for (let x = 0; x < w;) {
    const bw = w * (0.06 + r() * 0.1);
    const bh = h * (0.15 + r() * 0.3);
    ctx.fillRect(x, h * 0.62 - bh, bw, bh);
    x += bw;
  }
  ctx.fillRect(0, h * 0.62, w, h);
  // chuva
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 160; i++) {
    const x = r() * w;
    const y = r() * h * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 3, y + 14);
    ctx.stroke();
  }
  ctx.fillStyle = palette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let size = w * 0.15;
  ctx.font = `italic 600 ${size}px ${DISPLAY}`;
  while (ctx.measureText(title).width > w * 0.86 && size > 12) {
    size -= 2;
    ctx.font = `italic 600 ${size}px ${DISPLAY}`;
  }
  ctx.fillText(title, w / 2, h * 0.76);
  ctx.fillStyle = rgba(palette.text, 0.7);
  ctx.font = `600 ${w * 0.035}px ${BODY}`;
  ctx.fillText(tagline.toUpperCase(), w / 2, h * 0.82);
  // créditos ilegíveis embaixo
  ctx.fillStyle = rgba(palette.text, 0.35);
  for (let line = 0; line < 4; line++) {
    ctx.fillRect(w * 0.12, h * (0.88 + line * 0.022), w * 0.76, h * 0.006);
  }
  grain(ctx, w, h, { seed: 13, fine: 0.07, low: 0.04 });
}

/** Moldura dourada com friso (pintada, para não gastar polígonos). */
export function paintFrame(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = shade(palette.brass, 0.8);
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 21, fine: 0.08 });
}

/** Espaço de pôster de filme favorito, até o Raphael mandar os filmes. */
export function paintPosterSlot(ctx: Ctx, w: number, h: number, index: number, label: string) {
  const tones = [
    ['#2a0508', '#070308'],
    ['#0a1430', '#03050c'],
    ['#2a1a06', '#080502'],
  ][index % 3];
  fade(ctx, 0, 0, w, h, tones[0], tones[1]);
  ctx.strokeStyle = rgba(palette.amber, 0.5);
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.08, h * 0.06, w * 0.84, h * 0.88);
  ctx.fillStyle = rgba(palette.text, 0.85);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `italic 600 ${w * 0.5}px ${DISPLAY}`;
  ctx.fillText(String(index + 1), w / 2, h * 0.4);
  ctx.font = `${w * 0.1}px "VT323", monospace`;
  ctx.fillStyle = palette.amber;
  ctx.fillText(label.toUpperCase(), w / 2, h * 0.68);
  ctx.fillStyle = rgba(palette.text, 0.6);
  ctx.fillText('EM BREVE', w / 2, h * 0.76);
  grain(ctx, w, h, { seed: 40 + index, fine: 0.06, low: 0.03 });
}
