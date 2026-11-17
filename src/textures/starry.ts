import { grain, type Ctx } from './canvas';
import { mulberry32 } from './random';

/**
 * Homenagem a "A Noite Estrelada" (Van Gogh, 1889, domínio público),
 * pintada à mão no código: céu em pinceladas curtas que seguem
 * redemoinhos, estrelas com halo, lua crescente, o cipreste escuro na
 * frente e o vilarejo com a torre da igreja embaixo.
 */
export function paintStarryNight(ctx: Ctx, w: number, h: number) {
  const r = mulberry32(1889);
  ctx.fillStyle = '#1b2f6b';
  ctx.fillRect(0, 0, w, h);

  // centros de redemoinho (x, y, raio, sentido)
  const swirls: [number, number, number, number][] = [
    [0.42, 0.3, 0.17, 1],
    [0.62, 0.36, 0.12, -1],
    [0.25, 0.2, 0.1, 1],
  ];
  const flow = (x: number, y: number): [number, number] => {
    // vento da esquerda para a direita, ondulando, desviado pelos redemoinhos
    let vx = 1;
    let vy = Math.sin(x * 9 + y * 4) * 0.35;
    for (const [sx, sy, sr, dir] of swirls) {
      const dx = x - sx;
      const dy = y - sy;
      const d = Math.hypot(dx, dy);
      const k = Math.exp(-((d - sr) ** 2) / (sr * sr * 0.35)) * 2.2;
      vx += (-dy / (d || 1)) * dir * k;
      vy += (dx / (d || 1)) * dir * k;
    }
    const len = Math.hypot(vx, vy) || 1;
    return [vx / len, vy / len];
  };

  const sky = ['#2b4a9a', '#3f63b8', '#6f93d6', '#1e3576', '#9fb9e8', '#3a5aa8'];
  ctx.lineCap = 'round';
  for (let i = 0; i < 4200; i++) {
    const x0 = r();
    const y0 = r() * 0.72;
    let x = x0;
    let y = y0;
    ctx.strokeStyle = sky[Math.floor(r() * sky.length)];
    ctx.globalAlpha = 0.55 + r() * 0.4;
    ctx.lineWidth = w * (0.004 + r() * 0.004);
    ctx.beginPath();
    ctx.moveTo(x * w, y * h);
    for (let s = 0; s < 4; s++) {
      const [vx, vy] = flow(x, y);
      x += vx * 0.012;
      y += vy * 0.012 * (w / h);
      ctx.lineTo(x * w, y * h);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // estrelas com halos em anéis
  const stars: [number, number, number][] = [
    [0.08, 0.13, 0.04],
    [0.3, 0.12, 0.035],
    [0.5, 0.08, 0.03],
    [0.72, 0.2, 0.04],
    [0.58, 0.55, 0.03],
    [0.2, 0.45, 0.035],
    [0.8, 0.45, 0.03],
  ];
  for (const [sx, sy, sr] of stars) {
    for (let ring = 3; ring >= 1; ring--) {
      ctx.strokeStyle = ring === 1 ? '#f4e7a2' : ring === 2 ? '#c9d58a' : '#8fb0d8';
      ctx.lineWidth = w * 0.006;
      ctx.beginPath();
      ctx.arc(sx * w, sy * h, sr * w * (0.5 + ring * 0.45), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff6c4';
    ctx.beginPath();
    ctx.arc(sx * w, sy * h, sr * w * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // lua crescente no canto
  const mx = 0.88 * w;
  const my = 0.13 * h;
  for (let ring = 4; ring >= 1; ring--) {
    ctx.strokeStyle = ring % 2 ? '#f0c64a' : '#e8d98a';
    ctx.lineWidth = w * 0.008;
    ctx.beginPath();
    ctx.arc(mx, my, w * 0.025 * (1 + ring * 0.5), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#f7d35a';
  ctx.beginPath();
  ctx.arc(mx, my, w * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d99a2e';
  ctx.beginPath();
  ctx.arc(mx + w * 0.018, my - w * 0.008, w * 0.036, 0, Math.PI * 2);
  ctx.fill();

  // morros ao fundo
  ctx.fillStyle = '#1f3a6a';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.7);
  for (let x = 0; x <= w; x += w / 20) {
    ctx.lineTo(x, h * (0.66 + Math.sin((x / w) * 7) * 0.03 - (x / w) * 0.06));
  }
  ctx.lineTo(w, h);
  ctx.lineTo(0, h);
  ctx.fill();

  // vilarejo: casinhas com janelas acesas e a torre da igreja
  for (let i = 0; i < 26; i++) {
    const bx = w * (0.3 + r() * 0.62);
    const by = h * (0.78 + r() * 0.12);
    const bw = w * (0.025 + r() * 0.025);
    const bh = h * (0.025 + r() * 0.03);
    ctx.fillStyle = r() > 0.5 ? '#14254a' : '#2a3d63';
    ctx.fillRect(bx, by - bh, bw, bh);
    ctx.fillStyle = '#3a2a2a';
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.1, by - bh);
    ctx.lineTo(bx + bw / 2, by - bh - bh * 0.6);
    ctx.lineTo(bx + bw * 1.1, by - bh);
    ctx.fill();
    if (r() > 0.4) {
      ctx.fillStyle = '#f2cf5b';
      ctx.fillRect(bx + bw * 0.3, by - bh * 0.6, bw * 0.25, bh * 0.3);
    }
  }
  ctx.fillStyle = '#16264a';
  ctx.fillRect(w * 0.55, h * 0.66, w * 0.025, h * 0.16);
  ctx.beginPath();
  ctx.moveTo(w * 0.545, h * 0.66);
  ctx.lineTo(w * 0.5625, h * 0.55);
  ctx.lineTo(w * 0.58, h * 0.66);
  ctx.fill();

  // cipreste em labaredas escuras, na frente à esquerda
  ctx.fillStyle = '#1b2414';
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    const cx = w * (0.17 + Math.sin(t * 9) * 0.015);
    const cy = h * (1 - t * 0.85);
    const cw = w * (0.08 * (1 - t) + 0.012);
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw, h * 0.06, Math.sin(t * 7) * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#3a4a22';
  ctx.lineWidth = w * 0.004;
  for (let i = 0; i < 40; i++) {
    const y = h * (0.2 + r() * 0.8);
    const x = w * (0.17 + (r() - 0.5) * 0.08 * (y / h));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.01, y - h * 0.04, x - w * 0.005, y - h * 0.08);
    ctx.stroke();
  }

  grain(ctx, w, h, { seed: 31, fine: 0.06, low: 0.03 });
}
