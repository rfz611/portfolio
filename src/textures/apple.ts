import type { Ctx } from './canvas';

/**
 * Maçã branca da tampa do notebook (pedido do Raphael), desenhada à mão:
 * corpo com dois lobos, a mordida do lado direito e a folha em cima.
 */
export function paintApple(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#ffffff';
  const cx = w / 2;
  const cy = h * 0.6;
  const s = w * 0.42;
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.62);
  ctx.bezierCurveTo(
    cx + s * 0.35,
    cy - s * 0.95,
    cx + s * 1.05,
    cy - s * 0.8,
    cx + s * 0.98,
    cy - s * 0.05,
  );
  ctx.bezierCurveTo(
    cx + s * 0.95,
    cy + s * 0.55,
    cx + s * 0.6,
    cy + s * 1.0,
    cx + s * 0.32,
    cy + s * 0.98,
  );
  ctx.bezierCurveTo(
    cx + s * 0.14,
    cy + s * 0.96,
    cx - s * 0.14,
    cy + s * 0.84,
    cx - s * 0.32,
    cy + s * 0.98,
  );
  ctx.bezierCurveTo(
    cx - s * 0.6,
    cy + s * 1.0,
    cx - s * 0.95,
    cy + s * 0.55,
    cx - s * 0.98,
    cy - s * 0.05,
  );
  ctx.bezierCurveTo(cx - s * 1.05, cy - s * 0.8, cx - s * 0.35, cy - s * 0.95, cx, cy - s * 0.62);
  ctx.fill();
  // mordida
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(cx + s * 1.12, cy - s * 0.12, s * 0.36, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // folha
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.12, cy - s * 1.05, s * 0.16, s * 0.34, 0.75, 0, Math.PI * 2);
  ctx.fill();
}
