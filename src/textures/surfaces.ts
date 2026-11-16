import { palette } from '../config/palette';
import { fade, grain, makeCanvas, mix, mulberry32, rgba, shade, type Ctx } from './canvas';

/** Pinta em pé (veio vertical) algo que foi desenhado deitado. */
function rotated(ctx: Ctx, w: number, h: number, draw: (c: Ctx, w: number, h: number) => void) {
  const tmp = makeCanvas(h, w, draw);
  ctx.save();
  ctx.translate(w, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

export interface WoodOpts {
  base: string;
  seed: number;
  contrast?: number;
  vertical?: boolean;
}

/** Mogno envernizado: faixas de tom, veios ondulados, "catedrais" e poros. */
export function paintWood(ctx: Ctx, w: number, h: number, o: WoodOpts) {
  if (o.vertical) {
    rotated(ctx, w, h, (c, cw, ch) => paintWood(c, cw, ch, { ...o, vertical: false }));
    return;
  }
  const r = mulberry32(o.seed);
  const c = o.contrast ?? 1;
  ctx.fillStyle = o.base;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 16; i++) {
    const y = r() * h;
    const t = (0.04 + r() * 0.16) * h;
    const col = r() > 0.5 ? '0,0,0' : '255,160,100';
    const a = (0.05 + r() * 0.1) * c;
    for (const yy of [y - h, y, y + h]) {
      const g = ctx.createLinearGradient(0, yy - t, 0, yy + t);
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(0.5, `rgba(${col},${a})`);
      g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, yy - t, w, 2 * t);
    }
  }

  const k1 = 1 + Math.floor(r() * 2);
  const k2 = 2 + Math.floor(r() * 3);
  const p1 = r() * 6.283;
  const p2 = r() * 6.283;
  const flow = (x: number) =>
    Math.sin((x / w) * 6.283 * k1 + p1) * h * 0.014 +
    Math.sin((x / w) * 6.283 * k2 + p2) * h * 0.006;

  const veins = Math.round((h / 512) * 360);
  for (let i = 0; i < veins; i++) {
    const y = r() * h;
    const dark = r() > 0.34;
    ctx.strokeStyle = dark
      ? `rgba(18,3,1,${(0.06 + r() * 0.24) * c})`
      : `rgba(255,150,88,${(0.03 + r() * 0.09) * c})`;
    ctx.lineWidth = 0.5 + r() * 1.9;
    const amp = 0.5 + r() * 1.3;
    ctx.beginPath();
    for (let s = 0; s <= 24; s++) {
      const x = (s / 24) * w;
      const yy = y + flow(x) * amp;
      if (s === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 4; i++) {
    const cx = r() * w;
    const cy = r() * h;
    const rings = 5 + Math.floor(r() * 5);
    for (let j = 0; j < rings; j++) {
      ctx.strokeStyle = `rgba(18,3,1,${0.11 * c})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy + flow(cx),
        (50 + j * 36) * (w / 512),
        (3 + j * 3.4) * (h / 512),
        0,
        0,
        6.283,
      );
      ctx.stroke();
    }
  }

  const pores = (w * h) / 240;
  for (let i = 0; i < pores; i++) {
    ctx.fillStyle = `rgba(14,3,1,${0.14 + r() * 0.26})`;
    ctx.fillRect(r() * w, r() * h, 2 + r() * 6, 0.9);
  }
  grain(ctx, w, h, { seed: o.seed + 1, fine: 0.035, low: 0.05 });
}

/** Moldura rebaixada com almofada: detalhe pintado, como num jogo de PS2. */
function raisedPanel(ctx: Ctx, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, w, h);
  const inset = 7;
  ctx.fillStyle = 'rgba(255,170,110,0.06)';
  ctx.fillRect(x + inset, y + inset, w - inset * 2, h - inset * 2);
  // luz vinda de cima: sombra sob a moldura, brilho na base
  fade(ctx, x + inset, y + inset, w - inset * 2, 26, 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)');
  ctx.fillStyle = 'rgba(255,190,130,0.16)';
  ctx.fillRect(x + inset, y + h - inset - 2, w - inset * 2, 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + inset, y + inset, 2, h - inset * 2);
  ctx.fillStyle = 'rgba(255,190,130,0.1)';
  ctx.fillRect(x + w - inset - 2, y + inset, 2, h - inset * 2);
}

/**
 * Parede de mogno de 1,2 m × 3,4 m: rodapé, almofadas, friso de latão,
 * painel alto e uma faixa de ripas no topo. A sombra perto do teto e do
 * chão já vem pintada ("luz assada").
 */
export function paintWallPanel(ctx: Ctx, w: number, h: number, seed: number) {
  paintWood(ctx, w, h, { base: palette.mahogany, seed, vertical: true, contrast: 0.9 });
  const py = (m: number) => h * (1 - m / 3.4);
  const mx = w * 0.07;

  // montantes laterais
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fillRect(0, 0, 3, h);
  ctx.fillStyle = 'rgba(255,180,120,0.1)';
  ctx.fillRect(3, 0, 2, h);

  raisedPanel(ctx, mx, py(0.94), w - mx * 2, py(0.2) - py(0.94));
  raisedPanel(ctx, mx, py(2.66), w - mx * 2, py(1.16) - py(2.66));

  // friso de latão
  const brassY = py(1.06);
  const g = ctx.createLinearGradient(0, brassY, 0, brassY + 9);
  g.addColorStop(0, shade(palette.brass, 1.35));
  g.addColorStop(0.5, palette.brass);
  g.addColorStop(1, shade(palette.brass, 0.45));
  ctx.fillStyle = g;
  ctx.fillRect(0, brassY, w, 9);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, brassY + 9, w, 4);

  // ripas horizontais no topo
  const slatTop = py(3.4);
  const slatBottom = py(2.78);
  const slatH = (slatBottom - slatTop) / 8;
  for (let i = 0; i < 8; i++) {
    const y = slatTop + i * slatH;
    ctx.fillStyle = 'rgba(0,0,0,0.62)';
    ctx.fillRect(0, y, w, slatH * 0.3);
    ctx.fillStyle = 'rgba(255,170,110,0.13)';
    ctx.fillRect(0, y + slatH * 0.3, w, 2);
    fade(ctx, 0, y + slatH * 0.5, w, slatH * 0.5, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.3)');
  }
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, slatBottom, w, 5);

  // rodapé
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, py(0.13), w, py(0) - py(0.13));
  ctx.fillStyle = 'rgba(255,180,120,0.12)';
  ctx.fillRect(0, py(0.13), w, 2);

  // luz assada: mais escuro junto ao teto e ao chão
  fade(ctx, 0, 0, w, h * 0.42, 'rgba(3,2,8,0.74)', 'rgba(3,2,8,0)');
  fade(ctx, 0, h * 0.86, w, h * 0.14, 'rgba(3,2,8,0)', 'rgba(3,2,8,0.5)');
}

/** Teto escuro de ripas de madeira quase invisíveis. */
export function paintCeiling(ctx: Ctx, w: number, h: number, seed: number) {
  paintWood(ctx, w, h, { base: '#160a08', seed, contrast: 0.6 });
  const slats = 8;
  for (let i = 0; i < slats; i++) {
    const y = (i / slats) * h;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, y, w, 5);
    ctx.fillStyle = 'rgba(255,170,110,0.07)';
    ctx.fillRect(0, y + 5, w, 2);
  }
}

/** Carpete felpudo azul: fibra fina mais manchas largas de pisada. */
export function paintCarpet(ctx: Ctx, w: number, h: number, seed: number, base = '#131d63') {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(seed);
  for (let i = 0; i < 2600; i++) {
    const light = r() > 0.5;
    ctx.strokeStyle = light
      ? `rgba(120,140,255,${0.04 + r() * 0.06})`
      : `rgba(0,0,20,${0.06 + r() * 0.1})`;
    ctx.lineWidth = 1;
    const x = r() * w;
    const y = r() * h;
    const a = r() * 6.283;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5);
    ctx.stroke();
  }
  grain(ctx, w, h, { seed: seed + 3, fine: 0.11, low: 0.07, cells: 5 });
}

export interface LeatherOpts {
  base: string;
  seed: number;
  /** Capitonê: número de losangos na largura e na altura. */
  tufted?: [number, number];
  /** Costura e sombra nas bordas (almofada de assento). */
  seams?: boolean;
}

/** Couro: manchas, poros, vincos e, se pedido, capitonê com botões. */
export function paintLeather(ctx: Ctx, w: number, h: number, o: LeatherOpts) {
  const r = mulberry32(o.seed);
  ctx.fillStyle = o.base;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 14 + r() * 70;
    const light = r() > 0.55;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, light ? 'rgba(255,200,170,0.07)' : 'rgba(0,0,0,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * w;
    const y = r() * h;
    ctx.strokeStyle = `rgba(0,0,0,${0.08 + r() * 0.14})`;
    ctx.lineWidth = 0.6 + r();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + (r() - 0.5) * 60,
      y + (r() - 0.5) * 60,
      x + (r() - 0.5) * 90,
      y + (r() - 0.5) * 90,
    );
    ctx.stroke();
  }
  grain(ctx, w, h, { seed: o.seed + 5, fine: 0.06, low: 0.05, cells: 7 });

  if (o.tufted) {
    const [cols, rows] = o.tufted;
    const cw = w / cols;
    const ch = h / rows;
    const nodes: [number, number][] = [];
    for (let j = -1; j <= rows; j++) {
      for (let i = -1; i <= cols; i++) {
        nodes.push([i * cw, j * ch], [(i + 0.5) * cw, (j + 0.5) * ch]);
      }
    }
    // gomos claros entre os botões
    for (const [x, y] of nodes) {
      const g = ctx.createRadialGradient(x + cw / 2, y, 0, x + cw / 2, y, cw * 0.42);
      g.addColorStop(0, 'rgba(255,205,180,0.13)');
      g.addColorStop(1, 'rgba(255,205,180,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y - ch / 2, cw, ch);
    }
    // dobras em diagonal
    ctx.lineCap = 'round';
    for (const [x, y] of nodes) {
      for (const [dx, dy] of [
        [cw / 2, ch / 2],
        [-cw / 2, ch / 2],
      ]) {
        ctx.strokeStyle = 'rgba(0,0,0,0.42)';
        ctx.lineWidth = Math.max(2, cw * 0.035);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,170,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 1);
        ctx.lineTo(x + dx + 2, y + dy - 1);
        ctx.stroke();
      }
    }
    // poço de sombra e botão
    for (const [x, y] of nodes) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, cw * 0.34);
      g.addColorStop(0, 'rgba(0,0,0,0.72)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - cw / 2, y - ch / 2, cw, ch);
      ctx.fillStyle = shade(o.base, 0.75);
      ctx.beginPath();
      ctx.arc(x, y, cw * 0.055, 0, 6.283);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,200,0.35)';
      ctx.beginPath();
      ctx.arc(x - cw * 0.015, y - cw * 0.02, cw * 0.02, 0, 6.283);
      ctx.fill();
    }
  }

  if (o.seams) {
    const m = w * 0.045;
    fade(ctx, 0, 0, w * 0.14, h, 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0)', false);
    fade(ctx, w * 0.86, 0, w * 0.14, h, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.6)', false);
    fade(ctx, 0, 0, w, h * 0.12, 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0)');
    fade(ctx, 0, h * 0.86, w, h * 0.14, 'rgba(0,0,0,0)', 'rgba(0,0,0,0.45)');
    ctx.strokeStyle = rgba(shade(o.base, 2.4), 0.55);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
    ctx.setLineDash([]);
  }
}

/** Tecido com dobras verticais (cortinas). */
export function paintFolds(
  ctx: Ctx,
  w: number,
  h: number,
  base: string,
  folds: number,
  seed: number,
) {
  for (let x = 0; x < w; x++) {
    const a = (x / w) * 6.283 * folds;
    const light = 0.5 + 0.5 * Math.sin(a) * (0.75 + 0.25 * Math.sin(a * 0.37 + 1.3));
    ctx.fillStyle = mix(shade(base, 0.28), shade(base, 1.55), light * light);
    ctx.fillRect(x, 0, 1, h);
  }
  grain(ctx, w, h, { seed, fine: 0.05, low: 0.03 });
  fade(ctx, 0, 0, w, h * 0.3, 'rgba(0,0,6,0.7)', 'rgba(0,0,6,0)');
  fade(ctx, 0, h * 0.9, w, h * 0.1, 'rgba(0,0,6,0)', 'rgba(0,0,6,0.45)');
}

/** Metal escovado (latão, alumínio). */
export function paintBrushed(ctx: Ctx, w: number, h: number, base: string, seed: number) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(seed);
  for (let i = 0; i < h * 3; i++) {
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${r() * 0.1})` : `rgba(0,0,0,${r() * 0.14})`;
    ctx.fillRect(0, r() * h, w, 1);
  }
  grain(ctx, w, h, { seed: seed + 1, fine: 0.03, low: 0.04 });
}

/** Tela de alto-falante: trama escura com o cone aparecendo por trás. */
export function paintGrille(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#0c0a09';
  ctx.fillRect(0, 0, w, h);
  for (const [cy, rad] of [
    [h * 0.3, w * 0.17],
    [h * 0.67, w * 0.33],
  ]) {
    const g = ctx.createRadialGradient(w / 2, cy, 0, w / 2, cy, rad);
    g.addColorStop(0, 'rgba(70,58,50,0.9)');
    g.addColorStop(0.25, 'rgba(34,28,24,0.9)');
    g.addColorStop(0.85, 'rgba(46,38,32,0.85)');
    g.addColorStop(1, 'rgba(10,8,7,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w / 2, cy, rad * 0.86, 0, 6.283);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
  for (let x = 0; x < w; x += 4) ctx.fillRect(x, 0, 2, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);
}

/** Piso da garagem: epóxi escuro com juntas. */
export function paintConcrete(ctx: Ctx, w: number, h: number, seed: number, base = '#0d0e15') {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed, fine: 0.035, low: 0.06, cells: 5 });
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, w, 3);
  ctx.fillRect(0, 0, 3, h);
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, 3, w, 1);
}

/** Parede da garagem: placas escuras com frisos e sombra assada. */
export function paintGarageWall(ctx: Ctx, w: number, h: number, seed: number) {
  ctx.fillStyle = '#101018';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed, fine: 0.03, low: 0.07, cells: 4 });
  for (let i = 1; i < 4; i++) {
    const y = (i / 4) * h;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, y, w, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, y + 4, w, 1);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, 4, h);
  fade(ctx, 0, 0, w, h * 0.35, 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0)');
}

/** Mancha de luz redonda, usada em brilhos somados à cena. */
export function paintGlow(ctx: Ctx, w: number, h: number, power = 2) {
  const image = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (x / (w - 1)) * 2 - 1;
      const dy = (y / (h - 1)) * 2 - 1;
      const v = Math.pow(Math.max(0, 1 - Math.hypot(dx, dy)), power) * 255;
      const i = (y * w + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

/** Sombra de contato redonda (preta com transparência). */
export function paintBlob(ctx: Ctx, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Céu noturno: quase preto no alto, névoa arroxeada no horizonte. */
export function paintSky(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#020309');
  g.addColorStop(0.36, '#050716');
  g.addColorStop(0.47, '#0f0f2c');
  g.addColorStop(0.5, '#2a1a3c');
  g.addColorStop(0.53, '#120d24');
  g.addColorStop(1, '#03040b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Mapa de ambiente pintado à mão (o que o verniz, o latão e o vidro
 * refletem): escuro, com o âmbar dos abajures, o azul do bar, o vermelho
 * da garagem e as luzes da cidade no horizonte.
 */
export function paintEnv(ctx: Ctx, w: number, h: number) {
  paintSky(ctx, w, h);
  const r = mulberry32(42);
  for (let i = 0; i < 520; i++) {
    const x = r() * w;
    const y = h * (0.5 + r() * r() * 0.13);
    ctx.fillStyle =
      r() > 0.3 ? `rgba(255,190,110,${0.3 + r() * 0.6})` : `rgba(200,220,255,${0.3 + r() * 0.5})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const blob = (u: number, v: number, rad: number, color: string, alpha: number) => {
    for (const ox of [-w, 0, w]) {
      const g = ctx.createRadialGradient(u * w + ox, v * h, 0, u * w + ox, v * h, rad * w);
      g.addColorStop(0, rgba(color, alpha));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  };
  blob(0.02, 0.44, 0.09, palette.amber, 1);
  blob(0.95, 0.46, 0.07, palette.amber, 0.9);
  blob(0.25, 0.4, 0.1, palette.neonBlue, 0.55);
  blob(0.5, 0.52, 0.12, palette.neonRed, 0.6);
  blob(0.75, 0.3, 0.16, '#ffffff', 0.1);
}
