import { grain, type Ctx } from './canvas';
import { mulberry32 } from './random';

const DISPLAY = '"Bodoni Moda", Didot, serif';
const BODY = '"Manrope Variable", Manrope, system-ui, sans-serif';

/** Frente do carrinho de ferramentas: gavetas vermelhas com puxadores de alumínio. */
export function paintToolChest(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#7e1414';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 301, fine: 0.03, low: 0.05 });
  // gavetas: rasas em cima, fundas embaixo
  const rows = [0.09, 0.09, 0.09, 0.12, 0.12, 0.18, 0.22];
  let y = h * 0.04;
  for (const r of rows) {
    const dh = r * h * 0.96;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(w * 0.04, y + dh - 3, w * 0.92, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(w * 0.04, y, w * 0.92, 2);
    // puxador comprido
    const g = ctx.createLinearGradient(0, y + 6, 0, y + 14);
    g.addColorStop(0, '#e9edf2');
    g.addColorStop(1, '#7d838b');
    ctx.fillStyle = g;
    ctx.fillRect(w * 0.12, y + 6, w * 0.76, 7);
    y += dh;
  }
  // borda escura
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, w - 6, h - 6);
}

/** Painel perfurado com as ferramentas penduradas (silhuetas simples). */
export function paintPegboard(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#2a2622';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 302, fine: 0.04, low: 0.06 });
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  for (let y = 10; y < h; y += 18) {
    for (let x = 10; x < w; x += 18) {
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const steel = (x0: number, y0: number, x1: number, y1: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#d9dde2');
    g.addColorStop(1, '#80868e');
    return g;
  };
  // chaves combinadas, da menor para a maior
  for (let i = 0; i < 7; i++) {
    const x = w * 0.06 + i * w * 0.055;
    const len = h * (0.22 + i * 0.025);
    ctx.fillStyle = steel(x, 0, x + 8, 0);
    ctx.fillRect(x - 3, h * 0.12, 7, len);
    ctx.beginPath();
    ctx.arc(x, h * 0.12, 9 + i, 0, Math.PI * 2);
    ctx.arc(x, h * 0.12 + len, 8 + i, 0, Math.PI * 2);
    ctx.fill();
  }
  // martelo
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(w * 0.52, h * 0.16, 10, h * 0.42);
  ctx.fillStyle = steel(w * 0.47, 0, w * 0.6, 0);
  ctx.fillRect(w * 0.47, h * 0.12, w * 0.1, 22);
  // chaves de fenda com cabo vermelho e amarelo
  const handles = ['#b8241c', '#d9a21b', '#b8241c', '#d9a21b'];
  handles.forEach((color, i) => {
    const x = w * 0.66 + i * w * 0.045;
    ctx.fillStyle = color;
    ctx.fillRect(x - 6, h * 0.12, 13, h * 0.12);
    ctx.fillStyle = steel(x, 0, x + 4, 0);
    ctx.fillRect(x - 2, h * 0.24, 5, h * 0.18);
  });
  // alicate e arco de serra embaixo
  ctx.strokeStyle = steel(0, h * 0.6, 0, h * 0.9);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h * 0.62);
  ctx.lineTo(w * 0.16, h * 0.9);
  ctx.moveTo(w * 0.2, h * 0.62);
  ctx.lineTo(w * 0.14, h * 0.9);
  ctx.stroke();
  ctx.strokeStyle = '#2b5fa8';
  ctx.lineWidth = 8;
  ctx.strokeRect(w * 0.3, h * 0.66, w * 0.34, h * 0.14);
  ctx.strokeStyle = steel(0, 0, w, 0);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.3, h * 0.8);
  ctx.lineTo(w * 0.64, h * 0.8);
  ctx.stroke();
  // rolo de fita e trena
  ctx.fillStyle = '#d9a21b';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.74, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1714';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.74, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d1d1f';
  ctx.fillRect(w * 0.87, h * 0.66, 34, 34);
}

/** Pôster da garagem, com o nome: SCHARF GARAGE, Curitiba. */
export function paintGaragePoster(ctx: Ctx, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#1b0d0b');
  g.addColorStop(0.55, '#5a1410');
  g.addColorStop(1, '#d9661c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // sol de fim de tarde com as faixas
  ctx.save();
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.64, w * 0.3, 0, Math.PI * 2);
  ctx.clip();
  const s = ctx.createLinearGradient(0, h * 0.34, 0, h * 0.94);
  s.addColorStop(0, '#ffd27a');
  s.addColorStop(1, '#e8481c');
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#5a1410';
  for (let i = 0; i < 6; i++) ctx.fillRect(0, h * (0.66 + i * 0.045), w, 3 + i * 1.6);
  ctx.restore();
  // estrada em perspectiva
  ctx.fillStyle = '#120807';
  ctx.beginPath();
  ctx.moveTo(w * 0.47, h * 0.8);
  ctx.lineTo(w * 0.53, h * 0.8);
  ctx.lineTo(w * 0.95, h);
  ctx.lineTo(w * 0.05, h);
  ctx.fill();
  ctx.fillStyle = '#ffd27a';
  ctx.fillRect(w * 0.495, h * 0.84, w * 0.01, h * 0.03);
  ctx.fillRect(w * 0.49, h * 0.9, w * 0.02, h * 0.05);
  // título
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3df';
  ctx.font = `italic 600 ${h * 0.13}px ${DISPLAY}`;
  ctx.fillText('Scharf', w / 2, h * 0.2);
  ctx.font = `700 ${h * 0.045}px ${BODY}`;
  ctx.fillStyle = '#ffb35c';
  ctx.fillText('G  A  R  A  G  E', w / 2, h * 0.28);
  ctx.font = `500 ${h * 0.026}px ${BODY}`;
  ctx.fillStyle = 'rgba(255,243,223,0.75)';
  ctx.fillText('CURITIBA · PR · NIGHT RUN', w / 2, h * 0.335);
  grain(ctx, w, h, { seed: 303, fine: 0.06, low: 0.05 });
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
}

/** Piso de borracha da academia: placas de 50 cm com pontinhos coloridos. */
export function paintGymFloor(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#131315';
  ctx.fillRect(0, 0, w, h);
  const r = mulberry32(304);
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = r() > 0.7 ? 'rgba(200,60,40,0.5)' : 'rgba(120,120,130,0.35)';
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, w, 3);
  ctx.fillRect(0, 0, 3, h);
}

/** Saco de pancada: couro vermelho com as faixas pretas e o nome na vertical. */
export function paintPunchBag(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#7a1212';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 305, fine: 0.06, low: 0.1 });
  // costuras verticais
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo((i / 4) * w, 0);
    ctx.lineTo((i / 4) * w, h);
    ctx.stroke();
  }
  // faixas pretas em cima e embaixo
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, h * 0.06, w, h * 0.07);
  ctx.fillRect(0, h * 0.87, w, h * 0.07);
  // nome, de pé, nas duas faces
  ctx.fillStyle = '#f2ead8';
  ctx.font = `800 ${w * 0.085}px ${BODY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const cx of [w * 0.125, w * 0.625]) {
    ctx.save();
    ctx.translate(cx, h * 0.5);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('SCHARF', 0, 0);
    ctx.restore();
  }
}
