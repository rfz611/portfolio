import { palette } from '../config/palette';
import { fade, grain, mulberry32, rgb, rgba, shade, type Ctx } from './canvas';

/** Texturas pintadas dos objetos: discos, capas, abajur, TV... */

const DISPLAY = '"Bodoni Moda", Didot, serif';
const BODY = '"Manrope Variable", Manrope, system-ui, sans-serif';
const CRT = '"VT323", ui-monospace, monospace';

const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

/** Quebra um texto em linhas que cabem na largura. */
function wrap(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(attempt).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = attempt;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Escreve um bloco de texto centralizado, diminuindo a letra até caber. */
function textBlock(
  ctx: Ctx,
  text: string,
  font: (size: number) => string,
  cx: number,
  cy: number,
  maxWidth: number,
  maxLines: number,
  size: number,
) {
  let lines: string[] = [];
  let s = size;
  for (; s > 8; s -= 2) {
    ctx.font = font(s);
    lines = wrap(ctx, text, maxWidth);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) break;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lh = s * 1.08;
  lines.forEach((l, i) => ctx.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * lh));
}

/** Disco de vinil visto de cima: sulcos e faixas. O brilho fica à parte. */
export function paintVinyl(ctx: Ctx, w: number, _h: number, color: string) {
  const c = w / 2;
  const r = mulberry32(5);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, w);
  for (let rad = c * 0.36; rad < c * 0.985; rad += 1.3) {
    const light = r() > 0.62;
    ctx.strokeStyle = light
      ? `rgba(255,255,255,${0.03 + r() * 0.07})`
      : `rgba(0,0,0,${0.12 + r() * 0.3})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(c, c, rad, 0, 6.283);
    ctx.stroke();
  }
  // separação entre faixas
  for (const f of [0.5, 0.63, 0.78, 0.9]) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(c, c, c * f, 0, 6.283);
    ctx.stroke();
  }
  ctx.fillStyle = shade(color, 0.6);
  ctx.beginPath();
  ctx.arc(c, c, c * 0.36, 0, 6.283);
  ctx.fill();
}

/** Brilho em "gravata-borboleta" que fica parado enquanto o disco gira. */
export function paintVinylSheen(ctx: Ctx, w: number) {
  const c = w / 2;
  const g = ctx.createConicGradient(0.5, c, c);
  const wedge = (at: number, strength: number) => {
    g.addColorStop(Math.max(0, at - 0.07), 'rgba(255,255,255,0)');
    g.addColorStop(at, `rgba(255,255,255,${strength})`);
    g.addColorStop(Math.min(1, at + 0.07), 'rgba(255,255,255,0)');
  };
  g.addColorStop(0, 'rgba(255,255,255,0)');
  wedge(0.14, 0.5);
  wedge(0.64, 0.42);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, w);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.98, 0, 6.283);
  ctx.arc(c, c, c * 0.37, 0, 6.283, true);
  ctx.fill();
}

export interface LabelOpts {
  color: string;
  artist: string;
  title: string;
}

/** Rótulo do disco: nome da faixa e do artista (o texto gira com o disco). */
export function paintLabel(ctx: Ctx, w: number, _h: number, o: LabelOpts) {
  const c = w / 2;
  ctx.fillStyle = shade(o.color, 0.6);
  ctx.fillRect(0, 0, w, w);
  ctx.fillStyle = o.color;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.97, 0, 6.283);
  ctx.fill();
  const ink = luminance(o.color) > 0.45 ? '#1a1210' : palette.text;
  ctx.strokeStyle = rgba(ink, 0.5);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.88, 0, 6.283);
  ctx.stroke();
  ctx.fillStyle = ink;
  textBlock(
    ctx,
    o.title,
    (s) => `italic 600 ${s}px ${DISPLAY}`,
    c,
    c * 0.52,
    w * 0.62,
    2,
    w * 0.12,
  );
  textBlock(
    ctx,
    o.artist.toUpperCase(),
    (s) => `700 ${s}px ${BODY}`,
    c,
    c * 1.47,
    w * 0.6,
    2,
    w * 0.06,
  );
  ctx.font = `${w * 0.075}px ${CRT}`;
  ctx.fillText('33 RPM', c * 0.42, c);
  ctx.fillText('LADO A', c * 1.58, c);
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(c, c, c * 0.075, 0, 6.283);
  ctx.fill();
}

/** Capa de reserva (quando a imagem da capa não existe): só tipografia. */
export function paintSleeveFallback(ctx: Ctx, w: number, h: number, o: LabelOpts) {
  ctx.fillStyle = shade(o.color, 0.45);
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = rgba(o.color, 0.8);
  ctx.lineWidth = w * 0.012;
  for (const rad of [0.3, 0.36, 0.42]) {
    ctx.beginPath();
    ctx.arc(w * 0.62, h * 0.4, w * rad, 0, 6.283);
    ctx.stroke();
  }
  ctx.fillStyle = palette.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let size = w * 0.13;
  ctx.font = `italic 600 ${size}px ${DISPLAY}`;
  let lines = wrap(ctx, o.title, w * 0.86);
  while (lines.length > 3 && size > 20) {
    size -= 4;
    ctx.font = `italic 600 ${size}px ${DISPLAY}`;
    lines = wrap(ctx, o.title, w * 0.86);
  }
  lines.forEach((l, i) =>
    ctx.fillText(l, w * 0.07, h * 0.72 + (i - lines.length + 1) * size * 1.05),
  );
  ctx.font = `700 ${w * 0.042}px ${BODY}`;
  ctx.fillStyle = rgba(palette.text, 0.8);
  wrap(ctx, o.artist.toUpperCase(), w * 0.86)
    .slice(0, 2)
    .forEach((l, i) => ctx.fillText(l, w * 0.07, h * 0.82 + i * w * 0.055));
  grain(ctx, w, h, { seed: 9, fine: 0.05, low: 0.04 });
}

/** Papelão do verso e das bordas das capas. */
export function paintKraft(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#2a2420';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 3, fine: 0.06, low: 0.06 });
}

/** Faixa "em breve" para discos cujo arquivo ainda não existe. */
export function paintSoon(ctx: Ctx, w: number, h: number, text: string) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(7,10,28,0.62)';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-0.38);
  ctx.fillStyle = palette.amber;
  ctx.fillRect(-w, -h * 0.085, w * 2, h * 0.17);
  ctx.fillStyle = palette.ink;
  ctx.font = `${h * 0.15}px ${CRT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), 0, h * 0.01);
  ctx.restore();
}

/** Cúpula do abajur: tecido plissado, mais claro no meio (a lâmpada). */
export function paintShade(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#8a5a2c');
  g.addColorStop(0.45, '#ffe2b0');
  g.addColorStop(0.7, '#f2b877');
  g.addColorStop(1, '#7a4a22');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 8) {
    ctx.fillStyle = 'rgba(70,30,6,0.24)';
    ctx.fillRect(x, 0, 2, h);
    ctx.fillStyle = 'rgba(255,240,210,0.12)';
    ctx.fillRect(x + 3, 0, 2, h);
  }
  ctx.fillStyle = 'rgba(60,30,8,0.55)';
  ctx.fillRect(0, 0, w, 6);
  ctx.fillRect(0, h - 6, w, 6);
}

/** Vidro da TV desligada: escuro, com um reflexo de janela bem fraco. */
export function paintScreenOff(ctx: Ctx, w: number, h: number) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7);
  g.addColorStop(0, '#1b211e');
  g.addColorStop(1, '#060807');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.transform(1, 0, -0.35, 1, 0, 0);
  fade(ctx, w * 0.3, 0, w * 0.2, h, 'rgba(160,190,255,0)', 'rgba(160,190,255,0.09)', false);
  fade(ctx, w * 0.5, 0, w * 0.06, h, 'rgba(160,190,255,0.09)', 'rgba(160,190,255,0)', false);
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
}

/** Painel de controle da TV: seletor de canal, botões e grade do alto-falante. */
export function paintTvPanel(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#14100d';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 17, fine: 0.04, low: 0.03 });
  const cx = w / 2;
  // marcação em volta do seletor de canais
  const dialY = h * 0.19;
  ctx.fillStyle = rgba(palette.brass, 0.9);
  ctx.font = `${w * 0.13}px ${CRT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 6.283 - 1.571;
    ctx.fillText(
      String(i + 1).padStart(2, '0'),
      cx + Math.cos(a) * w * 0.4,
      dialY + Math.sin(a) * w * 0.4,
    );
  }
  ctx.font = `${w * 0.15}px ${CRT}`;
  ctx.fillText('CH', cx, h * 0.355);
  ctx.fillText('VOL', cx, h * 0.495);
  // grade do alto-falante
  for (let y = h * 0.645; y < h * 0.95; y += 9) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(w * 0.14, y, w * 0.72, 4);
    ctx.fillStyle = 'rgba(255,220,180,0.07)';
    ctx.fillRect(w * 0.14, y + 4, w * 0.72, 1);
  }
  ctx.strokeStyle = rgba(palette.brass, 0.5);
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, w - 6, h - 6);
}

/** Lombadas de discos guardados de lado (enchimento da estante). */
export function paintSpines(ctx: Ctx, w: number, h: number, seed: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#0b0908';
  ctx.fillRect(0, 0, w, h);
  const tones = [
    '#5c0f16',
    '#3a1450',
    '#1d2a55',
    '#b8893a',
    '#2a2420',
    '#e0d6c4',
    '#22452f',
    '#3b1f14',
  ];
  for (let x = 0; x < w;) {
    const t = 2 + Math.floor(r() * 5);
    ctx.fillStyle = shade(tones[Math.floor(r() * tones.length)], 0.6 + r() * 0.5);
    ctx.fillRect(x, r() * 6, t, h);
    x += t + 1;
  }
  fade(ctx, 0, 0, w, h * 0.35, 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0)');
  grain(ctx, w, h, { seed: seed + 1, fine: 0.05 });
}

/** Frente de um aparelho de vídeo no rack: fenda, botões e uma luz. */
export function paintDeckFront(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#0e0e10';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 23, fine: 0.04 });
  ctx.fillStyle = '#030303';
  ctx.fillRect(w * 0.08, h * 0.2, w * 0.5, h * 0.28);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(w * 0.08, h * 0.2, w * 0.5, h * 0.28);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#26262a';
    ctx.fillRect(w * (0.64 + i * 0.062), h * 0.62, w * 0.045, h * 0.16);
  }
  ctx.fillStyle = '#0a1a0c';
  ctx.fillRect(w * 0.64, h * 0.22, w * 0.28, h * 0.24);
  ctx.fillStyle = '#3cff7a';
  ctx.font = `${h * 0.26}px ${CRT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('--:--', w * 0.78, h * 0.35);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, 0, w, 2);
}

/** Pontos estroboscópicos na borda do prato. */
export function paintStrobe(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#9a9da2';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a2b2e';
  for (let x = 0; x < w; x += 8) {
    ctx.fillRect(x, h * 0.2, 4, h * 0.22);
    ctx.fillRect(x + 4, h * 0.58, 4, h * 0.22);
  }
}
