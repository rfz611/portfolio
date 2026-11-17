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

/** Letreiro de neon com o nome: tubo claro no centro e halo colorido. */
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
      ctx.shadowColor = palette.neonRed;
      ctx.shadowBlur = blur;
      ctx.strokeStyle = rgba(palette.neonRed, alpha);
      ctx.lineWidth = width;
      ctx.strokeText(text, w / 2, y);
    }
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffd9d2';
    ctx.lineWidth = width * 0.36;
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

/** Janelas de um prédio: algumas acesas, a maioria apagada. */
export function paintWindows(ctx: Ctx, w: number, h: number, seed: number, lit: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#04050a';
  ctx.fillRect(0, 0, w, h);
  const cols = 8;
  const rows = 16;
  const cw = w / cols;
  const ch = h / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const on = r() < lit;
      if (on) {
        const pick = r();
        const color = pick < 0.62 ? '#ffc477' : pick < 0.9 ? '#e9f0ff' : '#7fa8ff';
        ctx.fillStyle = rgba(color, 0.45 + r() * 0.55);
      } else {
        ctx.fillStyle = r() > 0.5 ? '#070914' : '#0a0d1a';
      }
      ctx.fillRect(i * cw + 2, j * ch + 3, cw - 4, ch - 6);
    }
  }
}

/** Cidade vista de cima: ruas de pontinhos de luz até o horizonte. */
export function paintGroundLights(ctx: Ctx, w: number, h: number, seed: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#020309';
  ctx.fillRect(0, 0, w, h);
  const dot = (x: number, y: number, size: number, color: string, alpha: number) => {
    ctx.fillStyle = rgba(color, alpha);
    ctx.fillRect(x, y, size, size);
  };
  const blocks = 8;
  const step = w / blocks;
  // avenidas: fileiras de postes âmbar
  for (let b = 0; b < blocks; b++) {
    const major = b % 4 === 0;
    for (let t = 0; t < w; t += major ? 5 : 9) {
      const jitter = r() * 1.5;
      dot(t, b * step + jitter, major ? 2.4 : 1.6, '#ffb35c', major ? 0.95 : 0.6);
      dot(b * step + jitter, t, major ? 2.4 : 1.6, '#ffb35c', major ? 0.95 : 0.6);
      if (major && r() > 0.7) dot(t, b * step + 4, 1.6, r() > 0.5 ? '#ff4433' : '#ffffff', 0.8);
    }
  }
  // janelas e letreiros dentro dos quarteirões
  for (let i = 0; i < 5200; i++) {
    const pick = r();
    const color =
      pick < 0.6 ? '#ffc98a' : pick < 0.86 ? '#dfe8ff' : pick < 0.94 ? '#6f8cff' : '#ff5a6a';
    dot(r() * w, r() * h, 1 + r() * 1.4, color, 0.25 + r() * 0.6);
  }
  // manchas de claridade
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 20 + r() * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, rgba(r() > 0.3 ? '#ffb35c' : '#5f7bff', 0.16));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
