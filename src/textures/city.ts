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
  ctx.fillStyle = '#1a1c28';
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

export type AdKind = 'whisky' | 'casino' | 'jazz' | 'cigars' | 'cinema';

/** Propagandas inventadas (nenhuma marca real), com cara de cartaz luminoso dos anos 80. */
export function paintAd(ctx: Ctx, w: number, h: number, kind: AdKind) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const frame = (color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = h * 0.03;
    ctx.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08);
  };
  if (kind === 'whisky') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#120a05');
    g.addColorStop(1, '#030202');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // garrafa âmbar à esquerda, com um copo
    const bx = w * 0.16;
    const glow = ctx.createRadialGradient(bx, h * 0.55, 0, bx, h * 0.55, h * 0.6);
    glow.addColorStop(0, 'rgba(255,150,40,0.45)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w * 0.4, h);
    ctx.fillStyle = '#c86a14';
    ctx.beginPath();
    ctx.roundRect(bx - h * 0.12, h * 0.32, h * 0.24, h * 0.55, h * 0.03);
    ctx.fill();
    ctx.fillRect(bx - h * 0.035, h * 0.14, h * 0.07, h * 0.2);
    ctx.fillStyle = '#f1dcb0';
    ctx.fillRect(bx - h * 0.1, h * 0.5, h * 0.2, h * 0.18);
    ctx.fillStyle = '#e8b464';
    ctx.font = `italic 700 ${h * 0.3}px "Bodoni Moda", Georgia, serif`;
    ctx.fillText('Midnight Reserve', w * 0.6, h * 0.42);
    ctx.fillStyle = '#d9c8a4';
    ctx.font = `600 ${h * 0.085}px "Manrope Variable", sans-serif`;
    ctx.fillText('B L E N D E D   ·   A G E D   1 8   Y E A R S', w * 0.6, h * 0.72);
    frame('#8a6428');
  } else if (kind === 'casino') {
    ctx.fillStyle = '#5a0008';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd56a';
    ctx.font = `900 ${h * 0.42}px "Bodoni Moda", Georgia, serif`;
    ctx.fillText('LUCKY 7', w / 2, h * 0.42);
    ctx.font = `700 ${h * 0.14}px "Manrope Variable", sans-serif`;
    ctx.fillStyle = '#fff3d0';
    ctx.fillText('C A S I N O   ·   O P E N   2 4 H', w / 2, h * 0.78);
    // lâmpadas em volta
    ctx.fillStyle = '#fff2c0';
    for (let x = h * 0.06; x < w; x += h * 0.09) {
      ctx.beginPath();
      ctx.arc(x, h * 0.05, h * 0.018, 0, Math.PI * 2);
      ctx.arc(x, h * 0.95, h * 0.018, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'jazz') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#22052e');
    g.addColorStop(1, '#090214');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ff5ad2';
    ctx.lineWidth = h * 0.035;
    ctx.font = `italic 600 ${h * 0.34}px "Bodoni Moda", Georgia, serif`;
    ctx.strokeText('Velvet Room', w / 2, h * 0.42);
    ctx.fillStyle = '#ffd3f2';
    ctx.fillText('Velvet Room', w / 2, h * 0.42);
    ctx.fillStyle = '#7fe0ff';
    ctx.font = `600 ${h * 0.12}px "Manrope Variable", sans-serif`;
    ctx.fillText('L I V E   J A Z Z   ·   T O N I G H T', w / 2, h * 0.76);
  } else if (kind === 'cigars') {
    ctx.fillStyle = '#efe4cc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#8e1414';
    ctx.fillRect(0, h * 0.72, w, h * 0.28);
    ctx.fillStyle = '#1a1210';
    ctx.font = `800 ${h * 0.3}px "Bodoni Moda", Georgia, serif`;
    ctx.fillText('NOVA', w / 2, h * 0.36);
    ctx.font = `600 ${h * 0.1}px "Manrope Variable", sans-serif`;
    ctx.fillText('H A N D   R O L L E D   C I G A R S', w / 2, h * 0.58);
    ctx.fillStyle = '#f6e7c4';
    ctx.font = `italic ${h * 0.11}px "Bodoni Moda", Georgia, serif`;
    ctx.fillText('since 1952', w / 2, h * 0.86);
  } else {
    // letreiro vertical de cinema
    ctx.fillStyle = '#0a0606';
    ctx.fillRect(0, 0, w, h);
    const letters = 'ORPHEUM';
    ctx.fillStyle = '#ff3b2a';
    ctx.font = `900 ${w * 0.62}px "Bodoni Moda", Georgia, serif`;
    letters.split('').forEach((ch, i) => {
      ctx.fillText(ch, w / 2, h * (0.09 + (i * 0.82) / (letters.length - 1)));
    });
    frame('#ffb35c');
  }
}
