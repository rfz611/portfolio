/**
 * Mostrador do despertador oval (como o da foto do Pinterest): fundo
 * vermelho, a hora em cartões brancos de virar à esquerda e, à direita, a
 * data num aro dourado cercado por um arabesco rendado branco e dourado.
 */

type Ctx = CanvasRenderingContext2D;

/** Cartão branco de virar com dois números e a linha do meio. */
function flipCard(ctx: Ctx, x: number, y: number, w: number, h: number, text: string) {
  ctx.fillStyle = 'rgba(40,0,4,0.55)';
  ctx.fillRect(x + 3, y + 4, w, h);
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.49, '#ece8e0');
  g.addColorStop(0.51, '#d8d3ca');
  g.addColorStop(1, '#f4f1ea');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.fillStyle = '#141414';
  ctx.font = `bold ${h * 0.82}px "Manrope Variable", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + h * 0.04);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(x, y + h / 2 - 1, w, 2);
  // pinos laterais do cartão
  ctx.fillStyle = '#b08a3a';
  ctx.fillRect(x - 4, y + h / 2 - 4, 4, 8);
  ctx.fillRect(x + w, y + h / 2 - 4, 4, 8);
}

/** Folhinha do arabesco: gota com contorno dourado. */
function leaf(ctx: Ctx, x: number, y: number, angle: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(size * 0.6, -size * 0.5, size, 0);
  ctx.quadraticCurveTo(size * 0.6, size * 0.5, 0, 0);
  ctx.fillStyle = '#f6efdf';
  ctx.fill();
  ctx.strokeStyle = '#c9a050';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();
}

/** Arabesco rendado em volta da data: volutas e folhas, simétrico em cima e embaixo. */
function filigree(ctx: Ctx, cx: number, cy: number, r: number, h: number) {
  ctx.lineCap = 'round';
  for (const sy of [-1, 1]) {
    for (const sx of [-1, 1]) {
      // voluta grande saindo do aro para cima/baixo e para os lados
      for (let k = 0; k < 3; k++) {
        const a0 = sy * (0.55 + k * 0.42) * (sx > 0 ? 1 : -1) + (sx > 0 ? 0 : Math.PI);
        const x0 = cx + Math.cos(a0) * r;
        const y0 = cy + Math.sin(a0) * r;
        const x1 = cx + Math.cos(a0) * (r + h * 0.16);
        const y1 = cy + Math.sin(a0) * (r + h * 0.16);
        ctx.strokeStyle = '#f6efdf';
        ctx.lineWidth = 3.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x1 + sx * h * 0.05, y0, x1, y1);
        ctx.stroke();
        // espiral na ponta
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(x1 + sx * h * 0.025, y1, h * 0.028, 0, Math.PI * 1.6);
        ctx.stroke();
        leaf(ctx, (x0 + x1) / 2, (y0 + y1) / 2, a0 + sy * 0.9, h * 0.07);
        leaf(ctx, (x0 + x1) / 2, (y0 + y1) / 2, a0 - sy * 0.9 + Math.PI, h * 0.055);
      }
    }
  }
  // ramo vertical em cima e embaixo do aro (como na foto)
  for (const sy of [-1, 1]) {
    ctx.strokeStyle = '#f6efdf';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * r);
    ctx.bezierCurveTo(
      cx - h * 0.06,
      cy + sy * (r + h * 0.06),
      cx + h * 0.08,
      cy + sy * (r + h * 0.1),
      cx,
      cy + sy * (r + h * 0.16),
    );
    ctx.stroke();
    for (let k = 0; k < 4; k++) {
      leaf(
        ctx,
        cx,
        cy + sy * (r + h * 0.03 + k * h * 0.035),
        (k % 2 ? 0.4 : Math.PI - 0.4) * sy,
        h * 0.05,
      );
    }
  }
  // pontinhos de renda em volta do aro
  ctx.fillStyle = '#f6efdf';
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7), 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function paintOvalClockDial(ctx: Ctx, w: number, h: number, now: Date) {
  const g = ctx.createRadialGradient(w * 0.36, h * 0.42, 0, w * 0.45, h * 0.5, w * 0.62);
  g.addColorStop(0, '#d8262f');
  g.addColorStop(0.6, '#a8131d');
  g.addColorStop(1, '#5a060c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // hora em cartões de virar: HH : MM
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ch = h * 0.5;
  const cw = w * 0.2;
  const top = (h - ch) / 2;
  flipCard(ctx, w * 0.07, top, cw, ch, hours);
  flipCard(ctx, w * 0.33, top, cw, ch, minutes);
  ctx.fillStyle = '#f6efdf';
  for (const dy of [-0.09, 0.09]) {
    ctx.beginPath();
    ctx.arc(w * 0.3, h * (0.5 + dy), h * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }
  // filete dourado em volta do mostrador
  ctx.strokeStyle = 'rgba(232,196,110,0.7)';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  // data: aro dourado, cartões brancos e o arabesco rendado em volta
  const dx = w * 0.78;
  const dy = h * 0.5;
  const r = h * 0.25;
  filigree(ctx, dx, dy, r, h);
  const ring = ctx.createLinearGradient(dx - r, dy - r, dx + r, dy + r);
  ring.addColorStop(0, '#f3d991');
  ring.addColorStop(0.5, '#b88a34');
  ring.addColorStop(1, '#f0d48a');
  ctx.fillStyle = ring;
  ctx.beginPath();
  ctx.arc(dx, dy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1412';
  ctx.beginPath();
  ctx.arc(dx, dy, r * 0.84, 0, Math.PI * 2);
  ctx.fill();
  flipCard(
    ctx,
    dx - r * 0.62,
    dy - r * 0.55,
    r * 1.24,
    r * 1.1,
    String(now.getDate()).padStart(2, '0'),
  );
}
