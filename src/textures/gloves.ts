/**
 * Texturas das luvas de boxe brancas da foto do Raphael: couro branco com
 * costuras, "MAXIMUM / BOXING" preto nas costas da mão e a etiqueta preta
 * com o nome na tira de velcro (marca colocada a pedido dele).
 *
 * Mapa do corpo da luva (esfera deitada ao longo do comprimento):
 * u dá a volta na luva (0,75 = costas da mão, em cima), v vai da ponta (0)
 * ao pulso (1). No canvas, a ponta fica embaixo.
 */

type Ctx = CanvasRenderingContext2D;

function leatherBase(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#f1eee8';
  ctx.fillRect(0, 0, w, h);
  // granulado leve do couro sintético
  for (let i = 0; i < 2600; i++) {
    const x = (i * 97.13) % w;
    const y = (i * 53.71 + (i % 7) * 13) % h;
    ctx.fillStyle = i % 2 ? 'rgba(150,140,125,0.06)' : 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, 2, 2);
  }
}

export function paintGloveBody(ctx: Ctx, w: number, h: number) {
  leatherBase(ctx, w, h);
  // costuras laterais (u = 0,5 e u = 0/1) e a que separa a palma
  ctx.strokeStyle = 'rgba(120,110,95,0.45)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  for (const u of [0.02, 0.5, 0.98, 0.25]) {
    ctx.beginPath();
    ctx.moveTo(u * w, 0);
    ctx.lineTo(u * w, h);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // nome nas costas da mão: lido com os dedos para longe (texto virado no canvas)
  ctx.save();
  ctx.translate(w * 0.75, h * 0.42);
  ctx.rotate(Math.PI);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#121212';
  ctx.font = `900 ${h * 0.13}px "Bodoni Moda", Georgia, serif`;
  ctx.fillText('MAXIMUM', 0, 0);
  ctx.font = `700 ${h * 0.045}px "Manrope Variable", sans-serif`;
  ctx.fillText('B O X I N G', 0, h * 0.1);
  // assinatura fininha embaixo
  ctx.font = `italic ${h * 0.04}px "Bodoni Moda", Georgia, serif`;
  ctx.fillStyle = 'rgba(20,20,20,0.7)';
  ctx.fillText('Classic Series', w * 0.06, h * 0.2);
  ctx.restore();
  // BOXING STYLE na lateral, ao longo do comprimento
  ctx.save();
  ctx.translate(w * 0.5, h * 0.45);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#161616';
  ctx.font = `700 ${h * 0.04}px "Manrope Variable", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('BOXING STYLE', 0, 0);
  ctx.restore();
}

/** Punho e tira de velcro: branco, com a etiqueta preta MAXIMUM em cima (u = 0,5). */
export function paintGloveCuff(ctx: Ctx, w: number, h: number) {
  leatherBase(ctx, w, h);
  // bordas da tira de velcro
  ctx.fillStyle = 'rgba(120,110,95,0.25)';
  ctx.fillRect(0, h * 0.18, w, 3);
  ctx.fillRect(0, h * 0.82, w, 3);
  // etiqueta preta
  const lw = w * 0.2;
  const lh = h * 0.5;
  ctx.fillStyle = '#111';
  ctx.fillRect(w * 0.5 - lw / 2, h * 0.5 - lh / 2, lw, lh);
  ctx.strokeStyle = '#e8e4dc';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.5 - lw / 2 + 4, h * 0.5 - lh / 2 + 4, lw - 8, lh - 8);
  ctx.fillStyle = '#f1eee8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${lh * 0.32}px "Bodoni Moda", Georgia, serif`;
  ctx.fillText('MAXIMUM', w * 0.5, h * 0.47);
  ctx.font = `700 ${lh * 0.12}px "Manrope Variable", sans-serif`;
  ctx.fillText('BOXING', w * 0.5, h * 0.62);
}

/**
 * Etiqueta das costas da mão, em fundo transparente: MAXIMUM / BOXING em
 * preto. Virada no canvas: lida com os dedos para longe de quem olha.
 */
export function paintGloveLabel(ctx: Ctx, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#121212';
  ctx.font = `900 ${h * 0.3}px "Bodoni Moda", Georgia, serif`;
  ctx.fillText('MAXIMUM', 0, -h * 0.08, w * 0.94);
  ctx.font = `700 ${h * 0.11}px "Manrope Variable", sans-serif`;
  ctx.fillText('B O X I N G', 0, h * 0.24);
  ctx.restore();
}
