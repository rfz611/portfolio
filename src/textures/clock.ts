/**
 * Mostrador do relógio de mesa: marfim, com os traços dos minutos, os
 * números das horas em serifa e os ponteiros pretos na hora real de quem
 * visita (o canvas é redesenhado a cada minuto).
 */

type Ctx = CanvasRenderingContext2D;

export function paintDeskClockDial(ctx: Ctx, w: number, h: number, now: Date) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  // fundo marfim com a borda um pouco mais escura (envelhecido)
  const g = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
  g.addColorStop(0, '#f1ead8');
  g.addColorStop(0.85, '#e4dac2');
  g.addColorStop(1, '#bfb293');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#1b1712';
  ctx.lineWidth = r * 0.012;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.9, 0, Math.PI * 2);
  ctx.stroke();

  // traços dos minutos (os das horas mais grossos)
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2;
    const hour = k % 5 === 0;
    const r0 = r * (hour ? 0.78 : 0.84);
    ctx.lineWidth = r * (hour ? 0.022 : 0.009);
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
    ctx.lineTo(cx + Math.sin(a) * r * 0.89, cy - Math.cos(a) * r * 0.89);
    ctx.stroke();
  }

  // números das horas
  ctx.fillStyle = '#1b1712';
  ctx.font = `600 ${r * 0.15}px "Bodoni Moda", Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2;
    ctx.fillText(String(n), cx + Math.sin(a) * r * 0.64, cy - Math.cos(a) * r * 0.64 + r * 0.01);
  }

  // ponteiros
  const hand = (angle: number, length: number, width: number, tail = 0.12) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-width / 2, r * tail);
    ctx.lineTo(-width * 0.35, -length * 0.85);
    ctx.lineTo(0, -length);
    ctx.lineTo(width * 0.35, -length * 0.85);
    ctx.lineTo(width / 2, r * tail);
    ctx.closePath();
    ctx.fillStyle = '#14110d';
    ctx.fill();
    ctx.restore();
  };
  const minutes = now.getMinutes();
  const hours = (now.getHours() % 12) + minutes / 60;
  hand((hours / 12) * Math.PI * 2, r * 0.48, r * 0.06);
  hand((minutes / 60) * Math.PI * 2, r * 0.74, r * 0.045);
  // pino do meio, em latão
  ctx.fillStyle = '#b8893a';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.035, 0, Math.PI * 2);
  ctx.fill();
}
