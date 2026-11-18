/**
 * Kimono dobrado: trama grossa de algodão branco (trançado de judô/jiu-jitsu)
 * com as costuras duplas e as camadas das dobras marcadas.
 */
export function paintFoldedGi(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#efebe2';
  ctx.fillRect(0, 0, w, h);
  // trama trançada em "favo"
  for (let y = 0; y < h; y += 4) {
    for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) {
      ctx.fillStyle = 'rgba(120,108,90,0.14)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  // camadas das dobras (linhas horizontais com sombra)
  for (let k = 1; k < 5; k++) {
    const y = (h * k) / 5;
    const g = ctx.createLinearGradient(0, y - 6, 0, y + 6);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(70,60,45,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y - 6, w, 12);
  }
  // costuras duplas
  ctx.strokeStyle = 'rgba(90,80,65,0.4)';
  ctx.setLineDash([3, 3]);
  for (const y of [h * 0.08, h * 0.11, h * 0.89, h * 0.92]) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

/** Trama lisa de algodão grosso do kimono vestido (sem marcas de dobra). */
export function paintGiWeave(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f2ece1';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) {
    for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) {
      ctx.fillStyle = 'rgba(120,108,90,0.13)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
}
