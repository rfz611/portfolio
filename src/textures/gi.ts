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

/**
 * Kimono emoldurado (desenho de frente, aberto): fundo de veludo vinho,
 * mangas abertas, corpo com as duas frentes afastadas mostrando o fundo,
 * gola grossa em V com costuras, trama do tecido e a faixa preta
 * amarrada embaixo, com a plaquinha de latão.
 */
export function paintGiDisplay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // veludo vinho do fundo
  const bg = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h / 2, w * 0.8);
  bg.addColorStop(0, '#4a0f16');
  bg.addColorStop(1, '#1c0508');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const white = '#f1ece2';
  const shadow = 'rgba(80,70,55,0.28)';
  const fill = (points: [number, number][], color: string) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  // sombra do kimono no veludo
  ctx.save();
  ctx.translate(w * 0.012, h * 0.012);
  fill(
    [
      [0.3, 0.13],
      [0.7, 0.13],
      [0.95, 0.5],
      [0.86, 0.58],
      [0.74, 0.36],
      [0.74, 0.8],
      [0.26, 0.8],
      [0.26, 0.36],
      [0.14, 0.58],
      [0.05, 0.5],
    ],
    'rgba(0,0,0,0.45)',
  );
  ctx.restore();
  // mangas abertas para baixo e para fora
  fill(
    [
      [0.3, 0.13],
      [0.27, 0.34],
      [0.15, 0.58],
      [0.05, 0.5],
    ],
    white,
  );
  fill(
    [
      [0.7, 0.13],
      [0.73, 0.34],
      [0.85, 0.58],
      [0.95, 0.5],
    ],
    white,
  );
  // corpo (costas, que aparecem por dentro, um pouco mais escuras)
  fill(
    [
      [0.28, 0.13],
      [0.72, 0.13],
      [0.74, 0.8],
      [0.26, 0.8],
    ],
    '#d9d2c4',
  );
  // as duas frentes, afastadas embaixo (kimono aberto)
  fill(
    [
      [0.28, 0.13],
      [0.46, 0.13],
      [0.43, 0.8],
      [0.26, 0.8],
    ],
    white,
  );
  fill(
    [
      [0.54, 0.13],
      [0.72, 0.13],
      [0.74, 0.8],
      [0.57, 0.8],
    ],
    white,
  );
  // o que aparece no meio: o veludo do fundo, entre as frentes
  fill(
    [
      [0.47, 0.2],
      [0.53, 0.2],
      [0.56, 0.8],
      [0.44, 0.8],
    ],
    '#2a080c',
  );
  // trama do tecido (trançado grosso)
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  for (let y = 0; y < h; y += 3) {
    for (let x = (y / 3) % 2 ? 1.5 : 0; x < w; x += 3) {
      ctx.fillStyle = 'rgba(120,108,90,0.1)';
      ctx.fillRect(x, y, 1.5, 1.5);
    }
  }
  ctx.restore();
  // dobras suaves nas mangas e no corpo
  ctx.strokeStyle = shadow;
  ctx.lineWidth = w * 0.01;
  for (const [x0, y0, x1, y1] of [
    [0.22, 0.3, 0.12, 0.52],
    [0.78, 0.3, 0.88, 0.52],
    [0.33, 0.35, 0.31, 0.75],
    [0.67, 0.35, 0.69, 0.75],
  ]) {
    ctx.beginPath();
    ctx.moveTo(x0 * w, y0 * h);
    ctx.lineTo(x1 * w, y1 * h);
    ctx.stroke();
  }
  // gola grossa: passa atrás do pescoço e desce em V pelas duas frentes
  ctx.strokeStyle = '#e6e0d3';
  ctx.lineWidth = w * 0.06;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(0.41 * w, 0.8 * h);
  ctx.lineTo(0.45 * w, 0.2 * h);
  ctx.quadraticCurveTo(0.5 * w, 0.1 * h, 0.55 * w, 0.2 * h);
  ctx.lineTo(0.59 * w, 0.8 * h);
  ctx.stroke();
  // costuras da gola e da barra
  ctx.strokeStyle = 'rgba(90,80,65,0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  for (const off of [-0.018, 0.018]) {
    ctx.beginPath();
    ctx.moveTo((0.41 + off) * w, 0.8 * h);
    ctx.lineTo((0.45 + off) * w, 0.2 * h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo((0.59 - off) * w, 0.8 * h);
    ctx.lineTo((0.55 - off) * w, 0.2 * h);
    ctx.stroke();
  }
  for (const y of [0.77, 0.79]) {
    ctx.beginPath();
    ctx.moveTo(0.26 * w, y * h);
    ctx.lineTo(0.43 * w, y * h);
    ctx.moveTo(0.57 * w, y * h);
    ctx.lineTo(0.74 * w, y * h);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // faixa preta amarrada embaixo, com o nó e as duas pontas
  ctx.fillStyle = '#111012';
  ctx.fillRect(0.22 * w, 0.84 * h, 0.56 * w, 0.035 * h);
  ctx.fillRect(0.465 * w, 0.825 * h, 0.07 * w, 0.06 * h);
  fill(
    [
      [0.48, 0.88],
      [0.5, 0.88],
      [0.44, 0.97],
      [0.41, 0.96],
    ],
    '#111012',
  );
  fill(
    [
      [0.5, 0.88],
      [0.52, 0.88],
      [0.6, 0.96],
      [0.57, 0.97],
    ],
    '#111012',
  );
  // plaquinha de latão
  ctx.fillStyle = '#b8893a';
  ctx.fillRect(0.38 * w, 0.06 * h - h * 0.025, 0.24 * w, h * 0.04);
  ctx.fillStyle = '#2a1a08';
  ctx.font = `700 ${h * 0.025}px "Manrope Variable", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('J I U - J I T S U', w / 2, 0.06 * h - h * 0.005);
}
