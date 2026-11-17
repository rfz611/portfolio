/**
 * Mostrador do despertador oval: vermelho, com o relógio de ponteiros à
 * esquerda e a janela da data de virar à direita, cercada por um rendado
 * branco (como um bordado) e arabescos dourados.
 */
export function paintOvalClockDial(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  day: number,
) {
  const g = ctx.createRadialGradient(w * 0.36, h * 0.45, 0, w * 0.45, h * 0.5, w * 0.6);
  g.addColorStop(0, '#d0222c');
  g.addColorStop(0.6, '#a5121c');
  g.addColorStop(1, '#5e070d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // relógio de ponteiros (centro em 36% da largura)
  const cx = w * 0.36;
  const cy = h * 0.5;
  const r = h * 0.4;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2;
    const long = k % 5 === 0;
    ctx.strokeStyle = long ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = long ? 2.5 : 1.2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(a) * r, cy - Math.cos(a) * r);
    ctx.lineTo(cx + Math.sin(a) * (r - (long ? 9 : 5)), cy - Math.cos(a) * (r - (long ? 9 : 5)));
    ctx.stroke();
  }
  ctx.font = `bold ${h * 0.13}px "Manrope Variable", sans-serif`;
  for (let n = 1; n <= 12; n++) {
    const a = (n / 12) * Math.PI * 2;
    const x = cx + Math.sin(a) * r * 0.76;
    const y = cy - Math.cos(a) * r * 0.76;
    ctx.fillStyle = 'rgba(60,0,5,0.6)';
    ctx.fillText(String(n), x + 1.5, y + 1.5);
    ctx.fillStyle = '#fbf6ee';
    ctx.fillText(String(n), x, y);
  }

  // arabescos dourados em volta da data
  const dx = w * 0.76;
  const dy = h * 0.5;
  ctx.strokeStyle = 'rgba(232,196,110,0.85)';
  ctx.lineWidth = 2;
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * Math.PI * 2;
    const x = dx + Math.cos(a) * h * 0.36;
    const y = dy + Math.sin(a) * h * 0.36;
    ctx.beginPath();
    ctx.arc(x, y, h * 0.05, a, a + 3.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      dx + Math.cos(a + 0.3) * h * 0.46,
      dy + Math.sin(a + 0.3) * h * 0.46,
      dx + Math.cos(a + 0.5) * h * 0.4,
      dy + Math.sin(a + 0.5) * h * 0.4,
    );
    ctx.stroke();
  }

  // rendado branco: anel de recortes com furinhos, como um bordado
  const lace = h * 0.29;
  ctx.fillStyle = '#f7f3ea';
  ctx.beginPath();
  const bumps = 22;
  for (let k = 0; k <= bumps * 4; k++) {
    const a = (k / (bumps * 4)) * Math.PI * 2;
    const rr = lace + Math.abs(Math.sin((a * bumps) / 2)) * h * 0.035;
    const x = dx + Math.cos(a) * rr;
    const y = dy + Math.sin(a) * rr;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a5121c';
  for (let k = 0; k < bumps; k++) {
    const a = ((k + 0.5) / bumps) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(dx + Math.cos(a) * lace * 0.9, dy + Math.sin(a) * lace * 0.9, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // moldura dourada da janela
  ctx.fillStyle = '#c99a3e';
  ctx.beginPath();
  ctx.arc(dx, dy, lace * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1412';
  ctx.beginPath();
  ctx.arc(dx, dy, lace * 0.7, 0, Math.PI * 2);
  ctx.fill();
  // cartões da data de virar
  const cw = lace * 1.0;
  const ch = lace * 0.95;
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(dx - cw / 2, dy - ch / 2, cw, ch);
  ctx.fillStyle = '#151515';
  ctx.font = `bold ${ch * 0.82}px "Manrope Variable", sans-serif`;
  ctx.fillText(String(day).padStart(2, '0'), dx, dy + ch * 0.04);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(dx - cw / 2, dy - 1, cw, 2);
}
