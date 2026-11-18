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

export type AdKind = 'ristorante' | 'casino' | 'lounge' | 'hotel' | 'cinema' | 'unicar' | 'frotas';

/** Textos que mudam com o idioma (frase do anúncio, chamada para a TV, "hoje"). */
export interface AdWords {
  tag?: string;
  cta?: string;
  tonight?: string;
}

/** Fonte no maior tamanho (até max) em que o texto cabe na largura. */
function fit(ctx: Ctx, text: string, style: string, max: number, width: number) {
  let size = max;
  ctx.font = `${style} ${size}px "Bodoni Moda", Georgia, serif`;
  while (ctx.measureText(text).width > width && size > 8) {
    size *= 0.94;
    ctx.font = `${style} ${size}px "Bodoni Moda", Georgia, serif`;
  }
  return ctx.font;
}

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
export function paintAd(ctx: Ctx, w: number, h: number, kind: AdKind, words: AdWords = {}) {
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
    neonText(
      ctx,
      `JAZZ  ·  ${(words.tonight ?? 'TONIGHT').toUpperCase()}: SADE`,
      w / 2,
      h * 0.77,
      `700 ${h * 0.1}px "Manrope Variable", sans-serif`,
      '#ff8ac0',
      '#ffe6f0',
    );
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
  } else if (kind === 'unicar' || kind === 'frotas') {
    // anúncios dos projetos do Raphael: o nome em neon, o que faz e o canal da TV
    const unicar = kind === 'unicar';
    decoFrame(ctx, w, h, '#b8893a');
    const name = unicar ? 'UniCar' : 'Automação de Frotas';
    neonText(
      ctx,
      name,
      w / 2,
      h * 0.4,
      fit(ctx, name, unicar ? 'italic 700' : 'italic 600', h * (unicar ? 0.4 : 0.3), w * 0.8),
      unicar ? '#ffb020' : '#ff2a1a',
      unicar ? '#fff2c8' : '#ffd9c8',
    );
    ctx.fillStyle = '#e8d0a0';
    ctx.font = `700 ${h * 0.075}px "Manrope Variable", sans-serif`;
    ctx.fillText((words.tag ?? '').toUpperCase(), w / 2, h * 0.66);
    neonText(
      ctx,
      `▶  ${(words.cta ?? '').toUpperCase()}`,
      w / 2,
      h * 0.8,
      `800 ${h * 0.075}px "Manrope Variable", sans-serif`,
      '#ff2a1a',
      '#ffd0c0',
    );
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
    ctx.font = `800 ${h * 0.075}px "Manrope Variable", sans-serif`;
    ctx.fillText((words.tonight ?? 'TONIGHT').toUpperCase(), w / 2, h * 0.66);
    ctx.font = `800 ${h * 0.085}px "Manrope Variable", sans-serif`;
    ctx.fillText('MAGNOLIA  ·  DONNIE DARKO  ·  ARRIVAL', w / 2, h * 0.77);
  }
}

/** Letreiro de neon do bar da cobertura, sem fundo (só o tubo aceso). */
export function paintRooftopSign(ctx: Ctx, w: number, h: number, kind: 'bar') {
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (kind === 'bar') {
    neonText(
      ctx,
      'Rooftop',
      w / 2,
      h * 0.34,
      `italic 700 ${h * 0.42}px "Bodoni Moda", Georgia, serif`,
      '#ff3a8a',
      '#ffd6ea',
    );
    neonText(
      ctx,
      'B A R',
      w / 2,
      h * 0.78,
      `800 ${h * 0.26}px "Manrope Variable", sans-serif`,
      '#ffb020',
      '#fff2c8',
    );
  }
}

/** Brilho colorido da pista de dança (magenta no meio, roxo e azul nas bordas). */
export function paintPartyGlow(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const spots: [number, number, string][] = [
    [0.5, 0.45, 'rgba(255,60,200,0.9)'],
    [0.25, 0.6, 'rgba(120,70,255,0.7)'],
    [0.75, 0.6, 'rgba(40,190,255,0.6)'],
  ];
  for (const [x, y, color] of spots) {
    const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, w * 0.42);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

/**
 * Um trecho de 25 m de rua vista de cima (16 m de largura): calçadas dos
 * dois lados com meio-fio, asfalto molhado, faixa tracejada no meio e a
 * poça de luz de sódio de um poste em cada calçada (alternados).
 * A textura corre ao longo de v; u atravessa a rua.
 */
export function paintRoad(ctx: Ctx, w: number, h: number) {
  const side = w * 0.125; // 2 m de calçada em 16 m
  ctx.fillStyle = '#1d181b';
  ctx.fillRect(0, 0, w, h);
  // asfalto com granulado e manchas de água
  const r = mulberry32(77);
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.18)';
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  // calçadas
  ctx.fillStyle = '#3a3134';
  ctx.fillRect(0, 0, side, h);
  ctx.fillRect(w - side, 0, side, h);
  ctx.fillStyle = '#3d3436';
  ctx.fillRect(side - 1.5, 0, 1.5, h);
  ctx.fillRect(w - side, 0, 1.5, h);
  // faixa do meio, tracejada
  ctx.fillStyle = 'rgba(214,190,120,0.55)';
  for (let y = h * 0.06; y < h; y += h * 0.25) ctx.fillRect(w / 2 - 1, y, 2, h * 0.12);
  // poças de luz dos postes: uma em cada calçada, alternadas
  const pool = (x: number, y: number) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, w * 0.62);
    g.addColorStop(0, 'rgba(255,165,75,0.85)');
    g.addColorStop(0.45, 'rgba(255,135,55,0.32)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };
  pool(side * 0.6, h * 0.25);
  pool(w - side * 0.6, h * 0.75);
}
