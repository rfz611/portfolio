import { palette } from '../config/palette';
import { fade, grain, mix, rgba, shade, type Ctx } from './canvas';
import { mulberry32 } from './random';

/** Texturas pintadas da sala: plantas, revistas, mármore do bar, neon, cidade. */

const DISPLAY = '"Bodoni Moda", Didot, serif';
const BODY = '"Manrope Variable", Manrope, system-ui, sans-serif';
const CRT = '"VT323", ui-monospace, monospace';

/** Folha de palmeira: nervura central e folíolos, com fundo transparente. */
export function paintPalmFrond(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const r = mulberry32(3);
  const count = 26;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const y = h * (0.94 - t * 0.9);
    const length = w * (0.5 - Math.abs(t - 0.35) * 0.42) * (0.9 + r() * 0.2);
    for (const side of [-1, 1]) {
      const tipX = cx + side * length;
      const tipY = y - h * (0.05 + t * 0.03) + r() * 6;
      const g = ctx.createLinearGradient(cx, y, tipX, tipY);
      g.addColorStop(0, '#16381f');
      g.addColorStop(0.6, mix('#2f6a33', '#3d7f3a', r()));
      g.addColorStop(1, '#5f9a4a');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.quadraticCurveTo(cx + side * length * 0.5, y - h * 0.045, tipX, tipY);
      ctx.quadraticCurveTo(cx + side * length * 0.45, y + h * 0.012, cx, y + h * 0.018);
      ctx.fill();
    }
  }
  ctx.strokeStyle = '#3d6b2e';
  ctx.lineWidth = w * 0.022;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, h);
  ctx.lineTo(cx, h * 0.03);
  ctx.stroke();
}

/** Folha de costela-de-adão: formato de coração com rasgos e furos. */
export function paintMonstera(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const g = ctx.createRadialGradient(cx, h * 0.6, 0, cx, h * 0.5, w * 0.6);
  g.addColorStop(0, '#2f6a35');
  g.addColorStop(1, '#123a1f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.97);
  ctx.bezierCurveTo(w * 0.02, h * 0.8, -w * 0.05, h * 0.25, w * 0.3, h * 0.05);
  ctx.bezierCurveTo(w * 0.42, h * 0.0, cx, h * 0.08, cx, h * 0.14);
  ctx.bezierCurveTo(cx, h * 0.08, w * 0.58, h * 0.0, w * 0.7, h * 0.05);
  ctx.bezierCurveTo(w * 1.05, h * 0.25, w * 0.98, h * 0.8, cx, h * 0.97);
  ctx.fill();

  // rasgos da borda até perto da nervura e furos ovais
  ctx.globalCompositeOperation = 'destination-out';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const y = h * (0.2 + i * 0.115);
      ctx.beginPath();
      ctx.moveTo(cx + side * w * 0.62, y - h * 0.035);
      ctx.quadraticCurveTo(cx + side * w * 0.3, y + h * 0.03, cx + side * w * 0.16, y + h * 0.05);
      ctx.quadraticCurveTo(cx + side * w * 0.32, y + h * 0.055, cx + side * w * 0.62, y + h * 0.02);
      ctx.fill();
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.ellipse(cx + side * w * 0.1, y + h * 0.1, w * 0.035, h * 0.016, side * 0.5, 0, 6.283);
        ctx.fill();
      }
    }
  }
  ctx.globalCompositeOperation = 'source-atop';
  ctx.strokeStyle = 'rgba(150,200,120,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, h * 0.97);
  ctx.lineTo(cx, h * 0.14);
  for (let i = 0; i < 7; i++) {
    const y = h * (0.26 + i * 0.1);
    ctx.moveTo(cx, y + h * 0.06);
    ctx.lineTo(cx - w * 0.4, y - h * 0.03);
    ctx.moveTo(cx, y + h * 0.06);
    ctx.lineTo(cx + w * 0.4, y - h * 0.03);
  }
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

export interface MagazineOpts {
  title: string;
  headline: string;
  sub: string;
  color: string;
  issue: number;
}

/** Capa de revista inventada: o destaque de capa é o nome do certificado. */
export function paintMagazine(ctx: Ctx, w: number, h: number, o: MagazineOpts) {
  const r = mulberry32(o.issue * 13);
  fade(ctx, 0, 0, w, h, shade(o.color, 1.25), shade(o.color, 0.45));
  // ilustração abstrata de capa
  ctx.save();
  ctx.translate(w * 0.5, h * 0.47);
  for (let i = 0; i < 7; i++) {
    ctx.rotate(0.42 + r() * 0.3);
    ctx.strokeStyle = rgba(i % 2 ? palette.brass : palette.text, 0.22 + r() * 0.25);
    ctx.lineWidth = 2 + r() * 5;
    ctx.beginPath();
    ctx.arc(0, 0, w * (0.1 + i * 0.045), 0, 3.4 + r() * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = rgba(palette.amber, 0.9);
  ctx.beginPath();
  ctx.arc(w * (0.3 + r() * 0.4), h * 0.46, w * 0.07, 0, 6.283);
  ctx.fill();

  ctx.fillStyle = palette.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let size = w * 0.26;
  ctx.font = `italic 600 ${size}px ${DISPLAY}`;
  while (ctx.measureText(o.title).width > w * 0.88 && size > 12) {
    size -= 2;
    ctx.font = `italic 600 ${size}px ${DISPLAY}`;
  }
  ctx.fillText(o.title, w / 2, h * 0.2);
  ctx.fillStyle = rgba(palette.text, 0.8);
  ctx.fillRect(w * 0.08, h * 0.225, w * 0.84, 2);
  ctx.font = `${w * 0.075}px ${CRT}`;
  ctx.fillText(`Nº ${String(o.issue).padStart(2, '0')} · EDIÇÃO ESPECIAL`, w / 2, h * 0.27);

  ctx.textAlign = 'left';
  ctx.fillStyle = palette.text;
  let hs = w * 0.115;
  ctx.font = `800 ${hs}px ${BODY}`;
  const words = o.headline.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > w * 0.84) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  lines.push(line);
  if (lines.length > 3) hs *= 0.8;
  ctx.font = `800 ${hs}px ${BODY}`;
  lines.forEach((l, i) => ctx.fillText(l, w * 0.08, h * 0.74 + (i - lines.length + 1) * hs * 1.1));
  ctx.fillStyle = palette.amber;
  ctx.font = `${w * 0.09}px ${CRT}`;
  ctx.fillText(o.sub, w * 0.08, h * 0.83);

  // código de barras de enfeite
  ctx.fillStyle = palette.text;
  ctx.fillRect(w * 0.66, h * 0.88, w * 0.26, h * 0.075);
  ctx.fillStyle = '#111';
  for (let x = w * 0.675; x < w * 0.905;) {
    const bar = 1 + Math.floor(r() * 3);
    ctx.fillRect(x, h * 0.888, bar, h * 0.058);
    x += bar + 1 + Math.floor(r() * 2);
  }
  grain(ctx, w, h, { seed: o.issue, fine: 0.04, low: 0.03 });
}

/** Letreiro com o nome: tubo branco-quente e halo âmbar suave (nada de vermelho). */
export function paintNeon(ctx: Ctx, w: number, h: number, line1: string, line2: string) {
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const draw = (text: string, font: string, y: number, width: number) => {
    ctx.font = font;
    for (const [blur, alpha] of [
      [46, 0.55],
      [22, 0.8],
      [8, 1],
    ]) {
      ctx.shadowColor = palette.amber;
      ctx.shadowBlur = blur * 0.7;
      ctx.strokeStyle = rgba(palette.amber, alpha * 0.55);
      ctx.lineWidth = width;
      ctx.strokeText(text, w / 2, y);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#fff3df';
    ctx.lineWidth = width * 0.42;
    ctx.strokeText(text, w / 2, y);
  };
  draw(line1, `italic 600 ${h * 0.56}px ${DISPLAY}`, h * 0.4, h * 0.03);
  const spaced = line2.split('').join('  ');
  draw(spaced, `600 ${h * 0.13}px ${BODY}`, h * 0.83, h * 0.012);
}

/** Mármore escuro do tampo do bar, com veios dourados. */
export function paintMarble(ctx: Ctx, w: number, h: number, seed: number) {
  ctx.fillStyle = '#0b0d0d';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed, fine: 0.03, low: 0.09, cells: 4 });
  const r = mulberry32(seed);
  for (let i = 0; i < 16; i++) {
    let x = r() * w;
    let y = r() * h;
    let a = r() * 6.283;
    ctx.strokeStyle =
      r() > 0.4 ? rgba(palette.brass, 0.12 + r() * 0.25) : `rgba(230,230,220,${0.06 + r() * 0.14})`;
    ctx.lineWidth = 0.6 + r() * 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 26; s++) {
      a += (r() - 0.5) * 0.7;
      x += Math.cos(a) * 14;
      y += Math.sin(a) * 14;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

/** Teclado bege visto de cima. */
export function paintKeyboard(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#c9c0a8';
  ctx.fillRect(0, 0, w, h);
  const rows = 5;
  const cols = 16;
  const kw = (w * 0.94) / cols;
  const kh = (h * 0.84) / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const grey = i > 13 || j === 0 || (j === rows - 1 && (i < 3 || i > 10));
      ctx.fillStyle = grey ? '#9d9684' : '#e6dfcb';
      ctx.fillRect(w * 0.03 + i * kw + 1, h * 0.08 + j * kh + 1, kw - 2, kh - 2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(w * 0.03 + i * kw + 1, h * 0.08 + (j + 1) * kh - 3, kw - 2, 2);
    }
  }
  ctx.fillStyle = '#e6dfcb';
  ctx.fillRect(w * 0.03 + 4 * kw, h * 0.08 + 4 * kh + 1, kw * 6, kh - 2);
  grain(ctx, w, h, { seed: 2, fine: 0.03 });
}

/** Fachada do prédio abaixo da cobertura: placas escuras e janelas. */
export function paintFacade(ctx: Ctx, w: number, h: number, seed: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#07080d';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed, fine: 0.03, low: 0.05 });
  const cols = 8;
  const rows = 2;
  const cw = w / cols;
  const ch = h / rows;
  for (let j = 0; j < rows; j++) {
    ctx.fillStyle = '#020204';
    ctx.fillRect(0, j * ch, w, 6);
    for (let i = 0; i < cols; i++) {
      const lit = r() > 0.72;
      ctx.fillStyle = lit
        ? rgba(r() > 0.3 ? palette.amber : '#9fb6ff', 0.35 + r() * 0.5)
        : '#0a0c16';
      ctx.fillRect(i * cw + cw * 0.12, j * ch + ch * 0.22, cw * 0.76, ch * 0.5);
    }
  }
}

/**
 * Fachada de prédio vista de longe: lajes marcando os andares, pilares,
 * caixilhos, janelas apagadas (azul-escuro), acesas (âmbar ou branco),
 * algumas com cortina meio fechada e outras com o brilho azul de TV.
 */
export function paintWindows(ctx: Ctx, w: number, h: number, seed: number, lit: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#05060c';
  ctx.fillRect(0, 0, w, h);
  const cols = 8;
  const rows = 16;
  const cw = w / cols;
  const ch = h / rows;
  for (let j = 0; j < rows; j++) {
    // laje do andar
    ctx.fillStyle = '#0d0f18';
    ctx.fillRect(0, j * ch, w, ch * 0.16);
    for (let i = 0; i < cols; i++) {
      const x = i * cw + cw * 0.1;
      const y = j * ch + ch * 0.22;
      const ww = cw * 0.8;
      const wh = ch * 0.66;
      const on = r() < lit;
      if (on) {
        const pick = r();
        const base = pick < 0.6 ? '#ffc477' : pick < 0.85 ? '#f2f0e6' : '#7fa8ff';
        const g = ctx.createLinearGradient(0, y, 0, y + wh);
        g.addColorStop(0, rgba(base, 0.55 + r() * 0.4));
        g.addColorStop(1, rgba(base, 0.25 + r() * 0.3));
        ctx.fillStyle = g;
        ctx.fillRect(x, y, ww, wh);
        if (r() > 0.6) {
          // cortina meio fechada
          ctx.fillStyle = 'rgba(30,18,10,0.6)';
          ctx.fillRect(x, y, ww * (0.3 + r() * 0.4), wh);
        }
      } else {
        ctx.fillStyle = r() > 0.5 ? '#0a0e1d' : '#0d1226';
        ctx.fillRect(x, y, ww, wh);
        // reflexo frio do céu no vidro apagado
        ctx.fillStyle = 'rgba(90,110,170,0.08)';
        ctx.fillRect(x, y, ww, wh * 0.35);
      }
      // caixilho no meio da janela
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x + ww / 2 - 1, y, 2, wh);
    }
  }
  // pilares verticais a cada duas janelas
  ctx.fillStyle = 'rgba(14,16,26,0.9)';
  for (let i = 0; i <= cols; i += 2) ctx.fillRect(i * cw - 2, 0, 4, h);
}

/**
 * Parque no meio da cidade (inspirado no Central Park): gramado escuro com
 * copas de árvore, caminhos curvos iluminados por postes, um lago que
 * reflete as luzes e a avenida acesa contornando tudo.
 */
export function paintPark(ctx: Ctx, w: number, h: number) {
  const r = mulberry32(1857);
  ctx.fillStyle = '#0c1710';
  ctx.fillRect(0, 0, w, h);
  // copas de árvores
  for (let i = 0; i < 2200; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 2 + r() * 6;
    ctx.fillStyle = r() > 0.5 ? 'rgba(30,52,30,0.9)' : 'rgba(16,32,18,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  // lago
  ctx.fillStyle = '#0a1426';
  ctx.beginPath();
  ctx.ellipse(w * 0.52, h * 0.58, w * 0.22, h * 0.09, 0.2, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rgba('#ffc477', 0.25 + r() * 0.4);
    ctx.fillRect(w * (0.36 + r() * 0.32), h * (0.53 + r() * 0.1), 1 + r() * 4, 1);
  }
  // caminhos com postes de luz
  const path = (pts: [number, number][]) => {
    ctx.strokeStyle = 'rgba(70,60,45,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x * w, y * h) : ctx.lineTo(x * w, y * h)));
    ctx.stroke();
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k];
      const [x1, y1] = pts[k + 1];
      for (let t = 0; t < 1; t += 0.12) {
        const px = (x0 + (x1 - x0) * t) * w;
        const py = (y0 + (y1 - y0) * t) * h;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 9);
        glow.addColorStop(0, 'rgba(255,205,140,0.55)');
        glow.addColorStop(1, 'rgba(255,205,140,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(px - 9, py - 9, 18, 18);
        ctx.fillStyle = 'rgba(255,225,170,1)';
        ctx.fillRect(px - 2, py - 2, 4, 4);
      }
    }
  };
  path([
    [0.1, 0.05],
    [0.3, 0.2],
    [0.25, 0.4],
    [0.4, 0.5],
    [0.3, 0.7],
    [0.45, 0.9],
    [0.6, 0.98],
  ]);
  path([
    [0.9, 0.08],
    [0.7, 0.25],
    [0.78, 0.45],
    [0.7, 0.68],
    [0.85, 0.85],
  ]);
  path([
    [0.1, 0.3],
    [0.5, 0.33],
    [0.9, 0.3],
  ]);
  path([
    [0.1, 0.8],
    [0.5, 0.78],
    [0.9, 0.82],
  ]);
  // avenida em volta
  ctx.strokeStyle = 'rgba(255,190,110,0.95)';
  ctx.lineWidth = 6;
  ctx.setLineDash([3, 4]);
  ctx.strokeRect(2, 2, w - 4, h - 4);
  ctx.setLineDash([]);
}

/**
 * Cidade vista do alto: quarteirões com telhados escuros e algumas luzes,
 * avenidas largas e acesas (com brilho em volta, para aparecer de longe)
 * e ruas menores mais fracas. Feita para ser vista a 100–600 m.
 */
export function paintGroundLights(ctx: Ctx, w: number, h: number, seed: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#05070f';
  ctx.fillRect(0, 0, w, h);
  const block = w / 8;
  // telhados dos quarteirões, cada um num tom
  for (let j = 0; j < 8; j++) {
    for (let i = 0; i < 8; i++) {
      const tone = 10 + Math.floor(r() * 16);
      ctx.fillStyle = `rgb(${tone},${tone + 2},${tone + 10})`;
      ctx.fillRect(i * block + 10, j * block + 10, block - 20, block - 20);
      // luzes de cobertura e janelas vistas de cima
      for (let k = 0; k < 10; k++) {
        const pick = r();
        ctx.fillStyle =
          pick < 0.6
            ? 'rgba(255,196,120,0.8)'
            : pick < 0.85
              ? 'rgba(220,230,255,0.7)'
              : 'rgba(110,140,255,0.7)';
        const s = 2 + r() * 4;
        ctx.fillRect(
          i * block + 14 + r() * (block - 32),
          j * block + 14 + r() * (block - 32),
          s,
          s,
        );
      }
    }
  }
  // ruas: brilho largo + linha de postes
  const street = (x0: number, y0: number, x1: number, y1: number, major: boolean) => {
    ctx.strokeStyle = major ? 'rgba(255,170,80,0.28)' : 'rgba(255,170,80,0.14)';
    ctx.lineWidth = major ? 16 : 8;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.strokeStyle = major ? 'rgba(255,214,150,0.95)' : 'rgba(255,200,130,0.6)';
    ctx.lineWidth = major ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  for (let k = 0; k <= 8; k++) {
    const major = k % 2 === 0;
    street(k * block, 0, k * block, h, major);
    street(0, k * block, w, k * block, major);
  }
  // faróis de carro nas avenidas (pontinhos brancos e vermelhos)
  for (let i = 0; i < 160; i++) {
    const along = r() * w;
    const line = Math.floor(r() * 5) * 2 * block;
    const red = r() > 0.5;
    ctx.fillStyle = red ? 'rgba(255,60,50,0.9)' : 'rgba(255,255,240,0.95)';
    if (r() > 0.5) ctx.fillRect(along, line - 3 + (red ? 4 : 0), 4, 2);
    else ctx.fillRect(line - 3 + (red ? 4 : 0), along, 2, 4);
  }
}
