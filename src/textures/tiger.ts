import { grain, type Ctx } from './canvas';
import { mulberry32 } from './random';

/**
 * Homenagem a "Tigre numa tempestade tropical (Surpreendido!)", de Henri
 * Rousseau (1891, domínio público), pintada à mão no código: selva densa
 * de folhas em camadas, chuva em riscos, um relâmpago no céu e o tigre
 * agachado entre as folhas.
 */
export function paintTigerStorm(ctx: Ctx, w: number, h: number) {
  const r = mulberry32(1891);
  // céu de tempestade
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  sky.addColorStop(0, '#2e3329');
  sky.addColorStop(1, '#6d7a5c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // relâmpago
  ctx.strokeStyle = 'rgba(240,235,200,0.9)';
  ctx.lineWidth = w * 0.004;
  ctx.beginPath();
  let lx = w * 0.72;
  let ly = 0;
  ctx.moveTo(lx, ly);
  while (ly < h * 0.35) {
    lx += (r() - 0.5) * w * 0.05;
    ly += h * 0.04;
    ctx.lineTo(lx, ly);
  }
  ctx.stroke();

  // folhas: lâminas longas em leque, em várias camadas de verde
  const blade = (
    x: number,
    y: number,
    length: number,
    angle: number,
    width: number,
    color: string,
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(length * 0.5, -width, length, 0);
    ctx.quadraticCurveTo(length * 0.5, width, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(length, 0);
    ctx.stroke();
    ctx.restore();
  };
  const greens = ['#2c4a22', '#3d6630', '#557a36', '#6f8f3e', '#1e3518', '#8aa04a'];
  const layer = (count: number, yMin: number, yMax: number, size: number, shade: number) => {
    for (let i = 0; i < count; i++) {
      const x = r() * w;
      const y = h * (yMin + r() * (yMax - yMin));
      const tufts = 4 + Math.floor(r() * 5);
      for (let k = 0; k < tufts; k++) {
        const color = greens[Math.min(greens.length - 1, Math.floor(r() * 3) + shade)];
        blade(
          x,
          y,
          w * size * (0.6 + r() * 0.6),
          -Math.PI / 2 + (r() - 0.5) * 2.4,
          w * size * 0.12,
          color,
        );
      }
    }
  };
  layer(30, 0.3, 0.55, 0.12, 0);
  layer(26, 0.45, 0.7, 0.14, 1);

  // tigre agachado, de lado, olhando para fora do quadro
  const tx = w * 0.45;
  const ty = h * 0.7;
  const s = w * 0.2;
  ctx.fillStyle = '#c8701e';
  ctx.beginPath();
  ctx.ellipse(tx, ty, s * 0.9, s * 0.36, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(tx - s * 0.95, ty - s * 0.18, s * 0.34, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#efe0c0';
  ctx.beginPath();
  ctx.ellipse(tx - s * 1.08, ty - s * 0.08, s * 0.16, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  // orelhas, olho e listras
  ctx.fillStyle = '#c8701e';
  for (const ox of [-0.82, -1.08]) {
    ctx.beginPath();
    ctx.arc(tx + s * ox, ty - s * 0.44, s * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#1a1208';
  ctx.beginPath();
  ctx.arc(tx - s * 1.02, ty - s * 0.26, s * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#1a1208';
  ctx.lineWidth = s * 0.05;
  ctx.lineCap = 'round';
  for (let i = 0; i < 11; i++) {
    const sx = tx - s * 0.7 + i * s * 0.15;
    ctx.beginPath();
    ctx.moveTo(sx, ty - s * 0.33);
    ctx.quadraticCurveTo(sx + s * 0.05, ty - s * 0.1, sx - s * 0.02, ty + s * 0.05);
    ctx.stroke();
  }
  // rabo
  ctx.strokeStyle = '#c8701e';
  ctx.lineWidth = s * 0.08;
  ctx.beginPath();
  ctx.moveTo(tx + s * 0.85, ty - s * 0.05);
  ctx.quadraticCurveTo(tx + s * 1.3, ty - s * 0.5, tx + s * 1.05, ty - s * 0.75);
  ctx.stroke();

  // folhas da frente cobrindo parte do tigre
  layer(22, 0.78, 1.0, 0.16, 2);

  // chuva em riscos diagonais
  ctx.strokeStyle = 'rgba(220,225,210,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 420; i++) {
    const x = r() * w;
    const y = r() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - w * 0.012, y + h * 0.04);
    ctx.stroke();
  }
  // verniz antigo
  ctx.fillStyle = 'rgba(110,80,20,0.14)';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, { seed: 91, fine: 0.07, low: 0.04 });
}
