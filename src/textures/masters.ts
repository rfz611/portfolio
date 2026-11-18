import { grain, type Ctx } from './canvas';
import { mulberry32 } from './random';

/**
 * Duas pinturas famosas roubadas (pedido do Raphael, pela ligação com a
 * máfia), pintadas à mão no canvas em versão de homenagem, com pinceladas
 * soltas e o claro-escuro forte dos originais. Obras em domínio público.
 */

type Rand = () => number;

/** Muitas pinceladas curtas numa área, sorteando cor e direção. */
function strokes(
  ctx: Ctx,
  r: Rand,
  count: number,
  area: { x: number; y: number; w: number; h: number },
  colors: string[],
  o: { len?: number; width?: number; angle?: number; spread?: number; alpha?: number } = {},
) {
  const len = o.len ?? 14;
  const width = o.width ?? 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = area.x + r() * area.w;
    const y = area.y + r() * area.h;
    const a = (o.angle ?? 0) + (r() - 0.5) * (o.spread ?? 1.2);
    const l = len * (0.5 + r());
    ctx.strokeStyle = colors[Math.floor(r() * colors.length)];
    ctx.globalAlpha = (o.alpha ?? 0.5) * (0.5 + r() * 0.5);
    ctx.lineWidth = width * (0.6 + r() * 0.8);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 4,
      y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 4,
      x + Math.cos(a) * l,
      y + Math.sin(a) * l,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, rot = 0) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fill();
}

/** Brilho suave (claro-escuro): uma mancha de luz que some para as bordas. */
function glow(ctx: Ctx, x: number, y: number, radius: number, color: string, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}

/**
 * Rembrandt, A Tempestade no Mar da Galileia (1633): céu rasgado com luz
 * à esquerda e escuridão à direita, o barco de pesca empinado na onda, a
 * vela clara inclinada, os pescadores e a espuma batendo na proa.
 */
export function paintStormGalilee(ctx: Ctx, w: number, h: number) {
  const r = mulberry32(1633);
  // céu: luz quente no alto à esquerda, escuro pesado à direita
  const sky = ctx.createLinearGradient(0, 0, w, h * 0.7);
  sky.addColorStop(0, '#b9a37a');
  sky.addColorStop(0.35, '#6d5b40');
  sky.addColorStop(0.7, '#241c14');
  sky.addColorStop(1, '#0c0a08');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.22, h * 0.18, w * 0.42, '#efe2bd', 0.75);
  // nuvens revoltas
  strokes(
    ctx,
    r,
    900,
    { x: 0, y: 0, w: w * 0.7, h: h * 0.5 },
    ['#d9c8a0', '#a8916a', '#7a6646', '#efe3c4'],
    {
      len: 26,
      width: 6,
      angle: -0.4,
      spread: 2.4,
      alpha: 0.35,
    },
  );
  // um respiro de céu azul acinzentado
  glow(ctx, w * 0.12, h * 0.08, w * 0.12, '#8fa3a8', 0.5);
  strokes(
    ctx,
    r,
    500,
    { x: w * 0.5, y: 0, w: w * 0.5, h: h * 0.6 },
    ['#1a140e', '#2a2218', '#0e0b08'],
    {
      len: 30,
      width: 8,
      angle: 0.3,
      spread: 1.5,
      alpha: 0.5,
    },
  );

  // mar escuro esverdeado
  const sea = ctx.createLinearGradient(0, h * 0.55, 0, h);
  sea.addColorStop(0, '#46503d');
  sea.addColorStop(1, '#1e241b');
  ctx.fillStyle = sea;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.bezierCurveTo(w * 0.3, h * 0.5, w * 0.6, h * 0.72, w, h * 0.66);
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.closePath();
  ctx.fill();
  strokes(
    ctx,
    r,
    700,
    { x: 0, y: h * 0.58, w, h: h * 0.42 },
    ['#3c4636', '#1c2219', '#55604a', '#121510'],
    {
      len: 22,
      width: 5,
      angle: -0.3,
      spread: 1.6,
      alpha: 0.45,
    },
  );

  // onda grande quebrando na proa, à esquerda, com espuma
  ctx.fillStyle = '#4c5a4a';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.75);
  ctx.bezierCurveTo(w * 0.1, h * 0.5, w * 0.25, h * 0.42, w * 0.34, h * 0.5);
  ctx.bezierCurveTo(w * 0.3, h * 0.6, w * 0.2, h * 0.7, w * 0.05, h * 0.85);
  ctx.closePath();
  ctx.fill();
  strokes(
    ctx,
    r,
    420,
    { x: 0, y: h * 0.42, w: w * 0.36, h: h * 0.3 },
    ['#e9e4d2', '#c9c8b4', '#f7f3e6', '#8d9a88'],
    {
      len: 16,
      width: 4,
      angle: -1.2,
      spread: 2.8,
      alpha: 0.6,
    },
  );

  // barco empinado: casco escuro na diagonal, da direita embaixo para a esquerda em cima
  ctx.save();
  ctx.translate(w * 0.5, h * 0.66);
  ctx.rotate(-0.42);
  ctx.fillStyle = '#2a1a0e';
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, -h * 0.02);
  ctx.quadraticCurveTo(-w * 0.1, h * 0.1, w * 0.3, h * 0.06);
  ctx.lineTo(w * 0.32, -h * 0.03);
  ctx.quadraticCurveTo(0, -h * 0.01, -w * 0.34, -h * 0.02);
  ctx.closePath();
  ctx.fill();
  // borda do casco iluminada
  ctx.strokeStyle = '#a07a3e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, -h * 0.02);
  ctx.quadraticCurveTo(0, -h * 0.01, w * 0.32, -h * 0.03);
  ctx.stroke();
  strokes(
    ctx,
    r,
    160,
    { x: -w * 0.3, y: -h * 0.01, w: w * 0.6, h: h * 0.07 },
    ['#6b4a26', '#3c2814', '#8c6434'],
    {
      len: 12,
      width: 3,
      angle: 0,
      spread: 0.3,
      alpha: 0.5,
    },
  );
  // pescadores: cabeças e corpos iluminados aqui e ali
  for (let i = 0; i < 9; i++) {
    const x = -w * 0.22 + i * w * 0.05 + (r() - 0.5) * 6;
    const y = -h * 0.045 - r() * h * 0.03;
    blob(ctx, x, y, w * 0.014, h * 0.03, i % 3 === 0 ? '#8a3a22' : '#3a2a1c');
    blob(ctx, x, y - h * 0.035, w * 0.01, w * 0.01, i % 2 ? '#d8b088' : '#7a5a40');
  }
  // mastro inclinado e a vela clara
  ctx.strokeStyle = '#1a120a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(w * 0.02, -h * 0.02);
  ctx.lineTo(-w * 0.04, -h * 0.5);
  ctx.stroke();
  const sail = ctx.createLinearGradient(-w * 0.2, -h * 0.5, w * 0.1, -h * 0.1);
  sail.addColorStop(0, '#efe3c2');
  sail.addColorStop(0.6, '#b9a27a');
  sail.addColorStop(1, '#6a5638');
  ctx.fillStyle = sail;
  ctx.beginPath();
  ctx.moveTo(-w * 0.04, -h * 0.48);
  ctx.quadraticCurveTo(w * 0.16, -h * 0.34, w * 0.14, -h * 0.08);
  ctx.lineTo(w * 0.01, -h * 0.06);
  ctx.closePath();
  ctx.fill();
  // cordas
  ctx.strokeStyle = 'rgba(30,20,12,0.8)';
  ctx.lineWidth = 1.2;
  for (const [x2, y2] of [
    [-w * 0.3, -h * 0.03],
    [w * 0.25, -h * 0.04],
    [w * 0.18, -h * 0.2],
  ]) {
    ctx.beginPath();
    ctx.moveTo(-w * 0.04, -h * 0.48);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();

  // escurece as bordas como verniz velho
  const vignette = ctx.createRadialGradient(w * 0.4, h * 0.45, w * 0.2, w * 0.5, h * 0.5, w * 0.85);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(8,5,2,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 33, fine: 0.07, low: 0.05 });
}

/**
 * Caravaggio, Natividade com São Francisco e São Lourenço (1600): fundo
 * quase preto, o anjo descendo em diagonal com a faixa branca, Maria
 * sentada de manto azul olhando o Menino deitado na palha, os santos em
 * volta e a luz forte vinda do alto à esquerda.
 */
export function paintNativity(ctx: Ctx, w: number, h: number) {
  const r = mulberry32(1600);
  ctx.fillStyle = '#0b0805';
  ctx.fillRect(0, 0, w, h);
  strokes(ctx, r, 600, { x: 0, y: 0, w, h }, ['#1a120b', '#0f0a06', '#24180e'], {
    len: 30,
    width: 8,
    angle: 0.8,
    spread: 1,
    alpha: 0.5,
  });
  // luz vinda do alto à esquerda
  glow(ctx, w * 0.38, h * 0.48, w * 0.55, '#6a4a28', 0.55);

  // anjo descendo na diagonal (canto de cima), asas abertas e túnica clara
  ctx.save();
  ctx.translate(w * 0.5, h * 0.17);
  ctx.rotate(-0.35);
  blob(ctx, -w * 0.16, -h * 0.02, w * 0.17, h * 0.05, '#3a2a1a', -0.3);
  blob(ctx, w * 0.17, -h * 0.03, w * 0.15, h * 0.045, '#2e2216', 0.4);
  strokes(
    ctx,
    r,
    120,
    { x: -w * 0.3, y: -h * 0.06, w: w * 0.6, h: h * 0.07 },
    ['#5a4632', '#7a6448', '#2a1e12'],
    {
      len: 18,
      width: 4,
      angle: 0.2,
      spread: 0.6,
      alpha: 0.6,
    },
  );
  blob(ctx, 0, h * 0.02, w * 0.12, h * 0.06, '#e6dccb', 0.2);
  strokes(
    ctx,
    r,
    90,
    { x: -w * 0.1, y: -h * 0.02, w: w * 0.2, h: h * 0.08 },
    ['#fff8ea', '#c9bca2', '#a89a80'],
    {
      len: 14,
      width: 3,
      angle: 1.2,
      spread: 0.6,
      alpha: 0.6,
    },
  );
  blob(ctx, w * 0.1, -h * 0.03, w * 0.03, w * 0.035, '#d6a87e');
  // a faixa branca do anjo
  ctx.strokeStyle = '#f2ecdc';
  ctx.lineWidth = h * 0.018;
  ctx.beginPath();
  ctx.moveTo(-w * 0.2, h * 0.07);
  ctx.bezierCurveTo(-w * 0.05, h * 0.03, w * 0.1, h * 0.1, w * 0.3, h * 0.05);
  ctx.stroke();
  ctx.restore();

  // Maria sentada no centro: manto azul escuro, vestido vermelho, rosto iluminado
  blob(ctx, w * 0.5, h * 0.62, w * 0.17, h * 0.2, '#1d2a44', 0.1);
  strokes(
    ctx,
    r,
    160,
    { x: w * 0.36, y: h * 0.45, w: w * 0.28, h: h * 0.36 },
    ['#2b3d62', '#16213a', '#3e5584'],
    {
      len: 20,
      width: 5,
      angle: 1.4,
      spread: 0.6,
      alpha: 0.6,
    },
  );
  blob(ctx, w * 0.52, h * 0.5, w * 0.09, h * 0.07, '#8a2a20', 0.2);
  blob(ctx, w * 0.5, h * 0.4, w * 0.045, w * 0.05, '#d9b08c', 0.3);
  blob(ctx, w * 0.49, h * 0.37, w * 0.05, w * 0.03, '#3a2616', 0.2);
  glow(ctx, w * 0.5, h * 0.41, w * 0.08, '#ffe2bc', 0.5);

  // o Menino deitado na palha branca, embaixo no centro
  blob(ctx, w * 0.46, h * 0.84, w * 0.2, h * 0.04, '#b89a58', 0);
  strokes(
    ctx,
    r,
    140,
    { x: w * 0.26, y: h * 0.8, w: w * 0.4, h: h * 0.07 },
    ['#d8bd78', '#9c7c3a', '#efdca2'],
    {
      len: 10,
      width: 2,
      angle: 0,
      spread: 2,
      alpha: 0.7,
    },
  );
  blob(ctx, w * 0.45, h * 0.82, w * 0.09, h * 0.025, '#efe4d0', -0.05);
  blob(ctx, w * 0.37, h * 0.81, w * 0.025, w * 0.025, '#e8c4a0');
  glow(ctx, w * 0.44, h * 0.82, w * 0.14, '#fff0d8', 0.45);

  // São Francisco à esquerda (hábito marrom), São Lourenço atrás (dalmática escura)
  blob(ctx, w * 0.18, h * 0.6, w * 0.11, h * 0.24, '#3e2a18', 0.05);
  strokes(
    ctx,
    r,
    120,
    { x: w * 0.08, y: h * 0.38, w: w * 0.2, h: h * 0.45 },
    ['#5a3e22', '#2c1e10', '#6e5030'],
    {
      len: 18,
      width: 4,
      angle: 1.5,
      spread: 0.4,
      alpha: 0.6,
    },
  );
  blob(ctx, w * 0.2, h * 0.36, w * 0.04, w * 0.045, '#c89a74');
  blob(ctx, w * 0.3, h * 0.33, w * 0.04, w * 0.045, '#a87a58');
  blob(ctx, w * 0.32, h * 0.47, w * 0.07, h * 0.12, '#2a1a12', 0.1);
  // homem de costas à direita, em verde e amarelo (o pastor)
  blob(ctx, w * 0.8, h * 0.66, w * 0.12, h * 0.2, '#4a5a2a', -0.1);
  strokes(
    ctx,
    r,
    110,
    { x: w * 0.68, y: h * 0.48, w: w * 0.24, h: h * 0.36 },
    ['#6a7a36', '#c8a240', '#33401c'],
    {
      len: 18,
      width: 4,
      angle: 1.6,
      spread: 0.5,
      alpha: 0.6,
    },
  );
  blob(ctx, w * 0.82, h * 0.44, w * 0.045, w * 0.05, '#3a2414');
  blob(ctx, w * 0.72, h * 0.36, w * 0.04, w * 0.045, '#b88a64');

  const vignette = ctx.createRadialGradient(
    w * 0.45,
    h * 0.55,
    w * 0.18,
    w * 0.5,
    h * 0.5,
    w * 0.8,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(4,3,2,0.8)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 16, fine: 0.07, low: 0.05 });
}
