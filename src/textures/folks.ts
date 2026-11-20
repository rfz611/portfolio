import { grain, type Ctx } from './canvas';
import { mulberry32 } from './random';

const DISPLAY = '"Bodoni Moda", Didot, serif';
const BODY = '"Manrope Variable", Manrope, system-ui, sans-serif';

/**
 * Muro de pedra do Folks: pedras irregulares arredondadas, argamassa escura
 * e a luz quente vindo de baixo e de trás do letreiro (já pintada, a cena da
 * rua não tem luz). glow = onde fica o centro da luz (0 a 1).
 */
export function paintStoneWall(ctx: Ctx, w: number, h: number, seed: number, glow = 0.35) {
  ctx.fillStyle = '#1a1512';
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(seed);
  const size = w / 11;
  for (let y = -size / 2; y < h + size; y += size * 0.62) {
    for (let x = -size / 2 + (r() - 0.5) * size; x < w + size; x += size * (0.7 + r() * 0.5)) {
      const rx = size * (0.32 + r() * 0.2);
      const ry = size * (0.22 + r() * 0.12);
      const shade = 70 + r() * 70;
      const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.4, 1, x, y, rx);
      g.addColorStop(0, `rgb(${shade + 40},${shade + 26},${shade + 8})`);
      g.addColorStop(1, `rgb(${shade * 0.55},${shade * 0.45},${shade * 0.35})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, (r() - 0.5) * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // luz quente: um halo atrás do letreiro e a luz que sobe do chão
  const halo = ctx.createRadialGradient(w / 2, h * glow, 0, w / 2, h * glow, w * 0.6);
  halo.addColorStop(0, 'rgba(255,170,80,0.55)');
  halo.addColorStop(1, 'rgba(255,170,80,0)');
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(40,30,25,1)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, w, h);
  const floor = ctx.createLinearGradient(0, h, 0, h * 0.55);
  floor.addColorStop(0, 'rgba(255,190,110,0.45)');
  floor.addColorStop(1, 'rgba(255,190,110,0)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';
  grain(ctx, w, h, { seed: seed + 1, fine: 0.05, low: 0.04 });
}

/** Letreiro oval FOLKS · PUB SERTANEJO, aceso por trás (fundo transparente). */
export function paintFolksSign(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.4;
  const ry = h * 0.36;
  // halo da luz de trás, na pedra
  const halo = ctx.createRadialGradient(cx, cy, rx * 0.6, cx, cy, w * 0.5);
  halo.addColorStop(0, 'rgba(255,200,120,0.9)');
  halo.addColorStop(1, 'rgba(255,160,70,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // placa marrom com o aro claro
  ctx.fillStyle = '#3a2416';
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f3e3c4';
  ctx.lineWidth = h * 0.035;
  ctx.stroke();
  ctx.lineWidth = h * 0.012;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx * 0.9, ry * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
  // nome
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f6ead2';
  ctx.font = `900 ${h * 0.26}px ${DISPLAY}`;
  ctx.fillText('FOLKS', cx, cy - h * 0.04, rx * 1.6);
  ctx.font = `700 ${h * 0.07}px ${BODY}`;
  ctx.fillText('P U B   S E R T A N E J O', cx, cy + h * 0.17);
}

/** Letras FKS douradas com luz por trás, para o painel de pedra do pátio. */
export function paintFks(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${h * 0.62}px ${DISPLAY}`;
  ctx.shadowColor = 'rgba(255,190,90,0.95)';
  ctx.shadowBlur = h * 0.12;
  ctx.fillStyle = '#2a1a0a';
  ctx.fillText('FKS', w / 2, h / 2, w * 0.9);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#e8b24a';
  ctx.lineWidth = h * 0.02;
  ctx.strokeText('FKS', w / 2, h / 2, w * 0.9);
}

/** Piso de bloquete do pátio, com as poças de luz quente e a da fonte (azul). */
export function paintPavers(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#2b2420';
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(611);
  const bw = w / 26;
  const bh = bw / 2;
  for (let y = 0; y < h; y += bh) {
    const row = Math.round(y / bh);
    for (let x = row % 2 ? -bw / 2 : 0; x < w; x += bw) {
      const v = 55 + r() * 30;
      ctx.fillStyle = `rgb(${v + 18},${v + 6},${v - 4})`;
      ctx.fillRect(x + 1, y + 1, bw - 2, bh - 2);
    }
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgb(70,60,55)';
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'screen';
  const pool = (x: number, y: number, rad: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  pool(w * 0.55, h * 0.12, w * 0.45, 'rgba(255,170,90,0.5)'); // fachada
  pool(w * 0.6, h * 0.66, w * 0.28, 'rgba(70,200,255,0.55)'); // fonte
  pool(w * 0.18, h * 0.42, w * 0.2, 'rgba(255,190,110,0.35)'); // painel FKS
  ctx.globalCompositeOperation = 'source-over';
}

/** Fachada de dentro, vista pela porta: luz âmbar, lustre e gente em silhueta. */
export function paintPubInside(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a140a');
  g.addColorStop(0.5, '#7a3c16');
  g.addColorStop(1, '#2a140a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // lustre de velas
  const lg = ctx.createRadialGradient(w / 2, h * 0.28, 0, w / 2, h * 0.28, w * 0.25);
  lg.addColorStop(0, 'rgba(255,230,170,1)');
  lg.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#ffe7b8';
  for (let i = 0; i < 7; i++) ctx.fillRect(w * (0.36 + i * 0.045), h * 0.27, w * 0.018, h * 0.05);
  // silhuetas no balcão
  const r = mulberry32(612);
  ctx.fillStyle = '#0d0705';
  for (let i = 0; i < 9; i++) {
    const x = w * (0.06 + i * 0.11 + (r() - 0.5) * 0.04);
    const s = h * (0.2 + r() * 0.06);
    ctx.beginPath();
    ctx.arc(x, h - s * 1.55, s * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x - s * 0.3, h - s * 1.35, s * 0.6, s * 1.4);
  }
}

/** Janelinhas da faixa sobre a porta, em grade, acesas por dentro. */
export function paintWindowStrip(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#120a06';
  ctx.fillRect(0, 0, w, h);
  const cols = 12;
  const rows = 2;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = (i / cols) * w + 3;
      const y = (j / rows) * h + 3;
      const g = ctx.createLinearGradient(x, y, x, y + h / rows);
      g.addColorStop(0, '#ffd69a');
      g.addColorStop(1, '#c8762e');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w / cols - 6, h / rows - 6);
    }
  }
}
