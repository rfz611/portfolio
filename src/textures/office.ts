/**
 * Y riscado a canivete na madeira (fundo transparente): três traços com a
 * madeira crua aparecendo, bordas irregulares e uns riscos finos em volta.
 */
export function paintScratchedY(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  const strokes: [number, number, number, number][] = [
    [0.22, 0.16, 0.5, 0.52],
    [0.8, 0.14, 0.5, 0.52],
    [0.5, 0.52, 0.52, 0.88],
  ];
  ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1] of strokes) {
    // sulco escuro por baixo e a madeira crua clara por cima, com tremidas
    for (const [color, width, jitter] of [
      ['rgba(30,12,4,0.85)', 0.085, 0.012],
      ['rgba(222,182,130,0.95)', 0.05, 0.008],
      ['rgba(255,230,190,0.6)', 0.018, 0.006],
    ] as const) {
      ctx.strokeStyle = color;
      ctx.lineWidth = w * width;
      ctx.beginPath();
      const steps = 8;
      for (let k = 0; k <= steps; k++) {
        const t = k / steps;
        const jx = Math.sin(k * 2.7 + x0 * 10) * jitter * w;
        const jy = Math.cos(k * 1.9 + y0 * 10) * jitter * h;
        const x = (x0 + (x1 - x0) * t) * w + jx;
        const y = (y0 + (y1 - y0) * t) * h + jy;
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  // riscos finos de quem errou a mão
  ctx.strokeStyle = 'rgba(222,182,130,0.55)';
  ctx.lineWidth = 1;
  for (const [x0, y0, x1, y1] of [
    [0.3, 0.2, 0.42, 0.36],
    [0.7, 0.2, 0.62, 0.32],
    [0.52, 0.6, 0.56, 0.78],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0 * w, y0 * h);
    ctx.lineTo(x1 * w, y1 * h);
    ctx.stroke();
  }
}

/**
 * Primeira página de um jornal da noite (inventado): nome do jornal,
 * manchete grande, foto granulada da cidade na chuva e colunas de texto.
 */
export function paintNewspaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#e4dccb';
  ctx.fillRect(0, 0, w, h);
  // papel amarelado com manchas leves
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = `rgba(120,100,70,${0.02 + ((i * 13) % 7) * 0.006})`;
    ctx.fillRect((i * 97) % w, (i * 61) % h, 3, 3);
  }
  ctx.fillStyle = '#141210';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${w * 0.1}px "Bodoni Moda", Georgia, serif`;
  ctx.fillText('O Noturno', w / 2, h * 0.08);
  ctx.fillRect(w * 0.05, h * 0.095, w * 0.9, 2);
  ctx.font = `${w * 0.028}px "Manrope Variable", sans-serif`;
  ctx.fillText('EDIÇÃO DA MADRUGADA  ·  CHUVA FORTE', w / 2, h * 0.118);
  ctx.fillRect(w * 0.05, h * 0.128, w * 0.9, 1);
  ctx.font = `900 ${w * 0.075}px "Bodoni Moda", Georgia, serif`;
  ctx.fillText('CHUVA NÃO DÁ TRÉGUA', w / 2, h * 0.2);
  ctx.fillText('E A CIDADE NÃO DORME', w / 2, h * 0.265);
  // foto granulada: prédios escuros contra o céu
  const px = w * 0.06;
  const py = h * 0.3;
  const pw = w * 0.56;
  const ph = h * 0.3;
  ctx.fillStyle = '#5a5650';
  ctx.fillRect(px, py, pw, ph);
  ctx.fillStyle = '#1a1816';
  for (let k = 0; k < 9; k++) {
    const bw = pw * (0.07 + ((k * 7) % 5) * 0.02);
    const bh = ph * (0.35 + ((k * 11) % 6) * 0.1);
    ctx.fillRect(px + (k * pw) / 9, py + ph - bh, bw, bh);
  }
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(px + ((i * 37) % pw), py + ((i * 53) % ph), 1.5, 1.5);
  }
  // colunas de texto (linhas cinza, como letra miúda vista de longe)
  const line = (x: number, y: number, len: number) => {
    ctx.fillStyle = 'rgba(30,26,22,0.55)';
    ctx.fillRect(x, y, len, h * 0.006);
  };
  for (let r = 0; r < 26; r++)
    line(w * 0.66, h * 0.31 + r * h * 0.0115, w * (0.26 - ((r * 7) % 4) * 0.02));
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 28; r++) {
      line(
        w * (0.06 + c * 0.305),
        h * 0.64 + r * h * 0.0115,
        w * (0.27 - ((r * 5 + c) % 3) * 0.03),
      );
    }
  }
  ctx.fillStyle = '#141210';
  ctx.font = `700 ${w * 0.03}px "Bodoni Moda", Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Luzes acesas até tarde nas coberturas do centro', w * 0.06, h * 0.625);
}
