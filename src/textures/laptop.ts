/** Texturas do notebook do escritório. */

/** Teclas do notebook: grade escura com teclas um pouco mais claras. */
export function paintLaptopKeys(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#0c0c0e';
  ctx.fillRect(0, 0, w, h);
  const rows = 6;
  const cols = 14;
  const kw = w / cols;
  const kh = h / rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      if (j === rows - 1 && i > 3 && i < 10) continue;
      ctx.fillStyle = j === 0 ? '#1d1d21' : '#26262b';
      ctx.fillRect(i * kw + 1.5, j * kh + 1.5, kw - 3, kh - 3);
    }
  }
  ctx.fillStyle = '#26262b';
  ctx.fillRect(4 * kw + 1.5, (rows - 1) * kh + 1.5, kw * 6 - 3, kh - 3);
}

/** Tela do notebook ligada: fundo escuro com um brilho e o nome em VT323. */
export function paintLaptopScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.5, w * 0.7);
  g.addColorStop(0, '#2a1a3c');
  g.addColorStop(1, '#07060e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,179,92,0.9)';
  ctx.font = `${h * 0.12}px "VT323", monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('RAPHAEL', w / 2, h * 0.48);
  ctx.fillStyle = 'rgba(239,230,218,0.6)';
  ctx.font = `${h * 0.07}px "VT323", monospace`;
  ctx.fillText('sobre_mim.txt  ·  formação  ·  experiência', w / 2, h * 0.62);
}
