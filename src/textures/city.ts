import { mulberry32 } from './random';

type Ctx = CanvasRenderingContext2D;

/**
 * Fachada neo-noir: concreto quase preto, janelas em escala real (10 por
 * 7 andares em cada repetição de 25 m) e só luz quente. Os andares acendem
 * em grupos (um escritório inteiro aceso, outro apagado), como numa
 * cidade de verdade à noite.
 */
export function paintNoirWindows(ctx: Ctx, w: number, h: number, seed: number, lit: number) {
  const r = mulberry32(seed);
  ctx.fillStyle = '#0f0d11';
  ctx.fillRect(0, 0, w, h);
  const cols = 10;
  const rows = 7;
  const cw = w / cols;
  const ch = h / rows;
  for (let j = 0; j < rows; j++) {
    // cada andar tem o seu "humor": quase todo aceso, salpicado ou apagado
    const mood = r();
    const floorLit = mood < 0.2 ? lit * 2.4 : mood < 0.55 ? lit : lit * 0.25;
    ctx.fillStyle = '#0c0d13';
    ctx.fillRect(0, j * ch, w, ch * 0.2);
    for (let i = 0; i < cols; i++) {
      const x = i * cw + cw * 0.14;
      const y = j * ch + ch * 0.26;
      const ww = cw * 0.72;
      const wh = ch * 0.6;
      if (r() < floorLit) {
        const pick = r();
        const base = pick < 0.7 ? [255, 196, 110] : pick < 0.92 ? [255, 226, 170] : [226, 232, 240];
        const a = 0.55 + r() * 0.45;
        const g = ctx.createLinearGradient(0, y, 0, y + wh);
        g.addColorStop(0, `rgba(${base[0]},${base[1]},${base[2]},${a})`);
        g.addColorStop(1, `rgba(${base[0]},${base[1]},${base[2]},${a * 0.55})`);
        ctx.fillStyle = g;
        ctx.fillRect(x, y, ww, wh);
        if (r() > 0.65) {
          // persiana meio baixada
          ctx.fillStyle = 'rgba(20,12,6,0.65)';
          ctx.fillRect(x, y, ww, wh * (0.25 + r() * 0.4));
        }
      } else {
        ctx.fillStyle = r() > 0.5 ? '#0c0d15' : '#10111b';
        ctx.fillRect(x, y, ww, wh);
      }
    }
  }
  // pilares verticais um pouco mais claros: dão a estrutura do prédio
  ctx.fillStyle = 'rgba(30,30,40,0.6)';
  for (let i = 0; i <= cols; i += 2) ctx.fillRect(i * cw - 1.5, 0, 3, h);
}

export type AdKind = 'ristorante' | 'casino' | 'lounge' | 'hotel' | 'cinema';

/** Letra de neon: tubo claro no meio com o brilho colorido em volta. */
function neonText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  font: string,
  color: string,
  core: string,
) {
  ctx.font = font;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 6;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = core;
  ctx.fillText(text, x, y);
}

/** Moldura art déco: filetes duplos e cantos em degrau, em latão. */
function decoFrame(ctx: Ctx, w: number, h: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = h * 0.018;
  const m = h * 0.06;
  ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  ctx.lineWidth = h * 0.007;
  ctx.strokeRect(m * 1.8, m * 1.8, w - m * 3.6, h - m * 3.6);
  ctx.fillStyle = color;
  for (const [cx, cy] of [
    [m, m],
    [w - m, m],
    [m, h - m],
    [w - m, h - m],
  ]) {
    ctx.fillRect(cx - m * 0.5, cy - m * 0.5, m, m);
  }
}

/**
 * Letreiros luminosos inventados (nenhuma marca real), em estilo art déco
 * de neon, como nos desenhos noir antigos: fundo preto, letra trabalhada
 * e o vermelho puxado para o clima mafioso.
 */
export function paintAd(ctx: Ctx, w: number, h: number, kind: AdKind) {
  ctx.fillStyle = '#060405';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (kind === 'ristorante') {
    decoFrame(ctx, w, h, '#b8893a');
    neonText(
      ctx,
      'Bella Napoli',
      w / 2,
      h * 0.42,
      `italic 700 ${h * 0.36}px "Bodoni Moda", Georgia, serif`,
      '#ff2a1a',
      '#ffd9c8',
    );
    ctx.fillStyle = '#d9b45a';
    ctx.font = `600 ${h * 0.085}px "Manrope Variable", sans-serif`;
    ctx.fillText('R I S T O R A N T E   ·   S I N C E   1 9 4 7', w / 2, h * 0.74);
  } else if (kind === 'casino') {
    decoFrame(ctx, w, h, '#b8893a');
    neonText(
      ctx,
      'LUCKY 7',
      w / 2,
      h * 0.42,
      `900 ${h * 0.38}px "Bodoni Moda", Georgia, serif`,
      '#ffb020',
      '#fff2c8',
    );
    neonText(
      ctx,
      'C A S I N O',
      w / 2,
      h * 0.75,
      `700 ${h * 0.12}px "Manrope Variable", sans-serif`,
      '#ff2a1a',
      '#ffd0c0',
    );
  } else if (kind === 'lounge') {
    decoFrame(ctx, w, h, '#7a2a5a');
    neonText(
      ctx,
      'The Velvet Room',
      w / 2,
      h * 0.45,
      `italic 600 ${h * 0.3}px "Bodoni Moda", Georgia, serif`,
      '#ff3a8a',
      '#ffd6ea',
    );
    ctx.fillStyle = '#c9a0b8';
    ctx.font = `600 ${h * 0.09}px "Manrope Variable", sans-serif`;
    ctx.fillText('J A Z Z   ·   C O C K T A I L S', w / 2, h * 0.76);
  } else if (kind === 'hotel') {
    // letreiro vertical
    const letters = 'HOTEL';
    ctx.strokeStyle = '#b8893a';
    ctx.lineWidth = w * 0.05;
    ctx.strokeRect(w * 0.08, w * 0.08, w * 0.84, h - w * 0.16);
    letters.split('').forEach((ch, i) => {
      neonText(
        ctx,
        ch,
        w / 2,
        h * (0.12 + (i * 0.76) / (letters.length - 1)),
        `900 ${w * 0.6}px "Bodoni Moda", Georgia, serif`,
        '#ff2a1a',
        '#ffd9c8',
      );
    });
  } else {
    // marquise de cinema
    decoFrame(ctx, w, h, '#b8893a');
    ctx.fillStyle = '#fff2c0';
    for (let x = h * 0.12; x < w - h * 0.08; x += h * 0.08) {
      ctx.beginPath();
      ctx.arc(x, h * 0.13, h * 0.02, 0, Math.PI * 2);
      ctx.arc(x, h * 0.87, h * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }
    neonText(
      ctx,
      'ORPHEUM',
      w / 2,
      h * 0.46,
      `900 ${h * 0.34}px "Bodoni Moda", Georgia, serif`,
      '#ff2a1a',
      '#ffd9c8',
    );
    ctx.fillStyle = '#e8d0a0';
    ctx.font = `700 ${h * 0.09}px "Manrope Variable", sans-serif`;
    ctx.fillText('T O N I G H T   ·   D O U B L E   F E A T U R E', w / 2, h * 0.7);
  }
}
