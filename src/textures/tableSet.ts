/**
 * Texturas das coisas da mesa de centro: os dois relógios de pulso, o
 * cinzeiro vermelho e o couro da pulseira. Sem nome de marca escrito.
 */

type Ctx = CanvasRenderingContext2D;

/** Ponto na borda de um quadrado arredondado (para os marcadores do mostrador). */
function onSquircle(a: number, r: number, power = 4): [number, number] {
  const c = Math.cos(a);
  const s = Math.sin(a);
  const k = r / Math.pow(Math.pow(Math.abs(c), power) + Math.pow(Math.abs(s), power), 1 / power);
  return [c * k, s * k];
}

function baton(ctx: Ctx, angle: number, length: number, width: number, fill: string) {
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(-width / 2, length * 0.12);
  ctx.lineTo(-width / 2, -length);
  ctx.lineTo(0, -length - width * 0.8);
  ctx.lineTo(width / 2, -length);
  ctx.lineTo(width / 2, length * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(-0.6, -length * 0.9, 1.2, length * 0.85);
  ctx.restore();
}

/**
 * Mostrador do relógio prata: vermelho com brilho de sol e listras verticais
 * escovadas, índices quadrados alternando dourado e prata, janela de dia e
 * data às 3 horas e ponteiros de bastão prateados.
 */
export function paintRedSteelDial(ctx: Ctx, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const g = ctx.createRadialGradient(cx * 0.9, cy * 0.7, 0, cx, cy, w * 0.72);
  g.addColorStop(0, '#c4273a');
  g.addColorStop(0.45, '#8c1424');
  g.addColorStop(1, '#3a050c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // listras verticais escovadas
  for (let x = 0; x < w; x += 2) {
    const a = 0.03 + 0.05 * Math.abs(Math.sin(x * 0.37) * Math.sin(x * 0.05));
    ctx.fillStyle = `rgba(255,190,200,${a})`;
    ctx.fillRect(x, 0, 1, h);
  }
  // faixa central mais clara (o reflexo vertical do mostrador)
  const band = ctx.createLinearGradient(cx - w * 0.16, 0, cx + w * 0.16, 0);
  band.addColorStop(0, 'rgba(255,120,140,0)');
  band.addColorStop(0.5, 'rgba(255,120,140,0.16)');
  band.addColorStop(1, 'rgba(255,120,140,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(cx, cy);
  for (let k = 0; k < 12; k++) {
    if (k === 3) continue; // lugar da janela de dia e data
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    const [x, y] = onSquircle(a, w * 0.37);
    const gold = k % 2 === 0;
    const size = k === 0 ? w * 0.05 : w * 0.042;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-size / 2 + 1.5, -size / 2 + 1.5, size, size);
    ctx.fillStyle = gold ? '#e6bf62' : '#e4e7ec';
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.fillStyle = gold ? '#fff0b8' : '#ffffff';
    ctx.fillRect(-size / 2, -size / 2, size, size * 0.3);
    if (k === 0) {
      ctx.fillStyle = gold ? '#e6bf62' : '#e4e7ec';
      ctx.fillRect(-size / 2, size * 0.7, size, size * 0.5);
    }
    ctx.restore();
  }
  // janela de dia e data
  ctx.fillStyle = '#d9dde2';
  ctx.fillRect(w * 0.14, -h * 0.045, w * 0.24, h * 0.09);
  ctx.fillStyle = '#f7f5ee';
  ctx.fillRect(w * 0.15, -h * 0.037, w * 0.13, h * 0.074);
  ctx.fillRect(w * 0.29, -h * 0.037, w * 0.08, h * 0.074);
  ctx.fillStyle = '#1a1a1e';
  ctx.font = `bold ${h * 0.058}px "Manrope Variable", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SEX', w * 0.215, 1);
  ctx.fillStyle = '#b3121f';
  ctx.fillText('22', w * 0.33, 1);
  // escrita pequena, sem marca
  ctx.fillStyle = 'rgba(240,235,230,0.85)';
  ctx.font = `${h * 0.04}px "Manrope Variable", sans-serif`;
  ctx.fillText('AUTOMATIC', 0, -h * 0.2);
  ctx.font = `italic ${h * 0.045}px "Bodoni Moda", serif`;
  ctx.fillText('Special', 0, h * 0.17);
  ctx.font = `${h * 0.032}px "Manrope Variable", sans-serif`;
  ctx.fillText('23 JEWELS', 0, h * 0.22);
  // ponteiros
  baton(ctx, -0.55, h * 0.24, w * 0.05, '#eef0f3');
  baton(ctx, 0.12, h * 0.34, w * 0.035, '#eef0f3');
  ctx.save();
  ctx.rotate(2.2);
  ctx.fillStyle = '#e4e7ec';
  ctx.fillRect(-1, -h * 0.36, 2, h * 0.44);
  ctx.restore();
  ctx.fillStyle = '#d0d4da';
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * Mostrador do relógio dourado: bordô, números arábicos dourados em volta,
 * o 12 maior, pequeno mostrador de segundos embaixo e ponteiros dourados.
 */
export function paintBurgundyGoldDial(ctx: Ctx, w: number, h: number) {
  const g = ctx.createRadialGradient(w * 0.45, h * 0.35, 0, w / 2, h / 2, h * 0.7);
  g.addColorStop(0, '#8a1f2c');
  g.addColorStop(0.6, '#5a0d18');
  g.addColorStop(1, '#2a050a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // trilho fino dos minutos
  ctx.strokeStyle = 'rgba(224,178,90,0.7)';
  ctx.lineWidth = 1.5;
  const rx = w * 0.4;
  const ry = h * 0.42;
  ctx.beginPath();
  ctx.roundRect(w / 2 - rx, h / 2 - ry, rx * 2, ry * 2, w * 0.18);
  ctx.stroke();

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let k = 1; k <= 12; k++) {
    if (k === 6) continue; // lugar dos segundos
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const k4 = 1 / Math.pow(Math.pow(Math.abs(c), 3) + Math.pow(Math.abs(s) * (w / h), 3), 1 / 3);
    const x = c * k4 * w * 0.31;
    const y = s * k4 * w * 0.31;
    const size = k === 12 ? h * 0.13 : h * 0.1;
    ctx.font = `600 ${size}px "Bodoni Moda", serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(String(k), x + 1, y + 1.5);
    ctx.fillStyle = '#e8c06a';
    ctx.fillText(String(k), x, y);
  }
  // pequenos segundos
  ctx.strokeStyle = '#e0b25a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, h * 0.24, w * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, h * 0.24);
  ctx.lineTo(w * 0.04, h * 0.17);
  ctx.stroke();
  // ponteiros dourados em forma de folha
  const leaf = (angle: number, length: number, width: number) => {
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = '#f0c870';
    ctx.beginPath();
    ctx.moveTo(0, length * 0.15);
    ctx.lineTo(width / 2, -length * 0.4);
    ctx.lineTo(0, -length);
    ctx.lineTo(-width / 2, -length * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  leaf(2.15, h * 0.26, w * 0.09);
  leaf(-0.35, h * 0.36, w * 0.07);
  ctx.fillStyle = '#f0c870';
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Ouro gravado da caixa do relógio dourado: arabescos finos sobre o dourado. */
export function paintEngravedGold(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#c9a050';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(90,60,15,0.55)';
  ctx.lineWidth = 1;
  for (let y = 4; y < h; y += 9) {
    for (let x = 4; x < w; x += 12) {
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0.3, 4.2);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = 'rgba(255,235,170,0.35)';
  for (let y = 8; y < h; y += 9) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.3, y - 3, w * 0.6, y + 3, w, y);
    ctx.stroke();
  }
}

/** Couro de crocodilo marrom-escuro: escamas retangulares com brilho nas bordas. */
export function paintCroco(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#2a140c';
  ctx.fillRect(0, 0, w, h);
  let row = 0;
  for (let y = 0; y < h; y += 10) {
    const offset = row % 2 ? 7 : 0;
    for (let x = -offset; x < w; x += 14) {
      const tone = 34 + ((x * 7 + y * 3) % 12);
      ctx.fillStyle = `rgb(${tone + 22},${tone - 6},${tone - 20})`;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, 12, 8, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,220,180,0.12)';
      ctx.fillRect(x + 3, y + 2, 7, 1.5);
    }
    row++;
  }
}

/**
 * Cinzeiro de cerâmica vermelha visto de cima (projeção plana): vermelho
 * brilhante com a faixa branca em "telhado" na metade de baixo e um filete
 * vermelho acompanhando a borda branca. Sem nome de marca.
 */
export function paintRedAshtray(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#b3141f';
  ctx.fillRect(0, 0, w, h);
  const glaze = ctx.createRadialGradient(w * 0.4, h * 0.35, 0, w / 2, h / 2, w * 0.6);
  glaze.addColorStop(0, 'rgba(255,120,110,0.35)');
  glaze.addColorStop(1, 'rgba(60,0,5,0.25)');
  ctx.fillStyle = glaze;
  ctx.fillRect(0, 0, w, h);
  // telhado branco
  ctx.fillStyle = '#f2ece2';
  ctx.beginPath();
  ctx.moveTo(-10, h * 0.62);
  ctx.lineTo(w * 0.5, h * 0.4);
  ctx.lineTo(w + 10, h * 0.62);
  ctx.lineTo(w + 10, h + 10);
  ctx.lineTo(-10, h + 10);
  ctx.closePath();
  ctx.fill();
  // filete vermelho acompanhando o telhado
  ctx.strokeStyle = '#b3141f';
  ctx.lineWidth = w * 0.018;
  ctx.beginPath();
  ctx.moveTo(-10, h * 0.66);
  ctx.lineTo(w * 0.5, h * 0.44);
  ctx.lineTo(w + 10, h * 0.66);
  ctx.stroke();
  // faixa vermelha fina perto da borda de baixo
  ctx.lineWidth = w * 0.012;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.86);
  ctx.lineTo(w, h * 0.86);
  ctx.stroke();
  // um pouco de cinza no fundo
  ctx.fillStyle = 'rgba(90,85,80,0.45)';
  for (let i = 0; i < 40; i++) {
    const a = i * 2.4;
    const r = (i % 7) * w * 0.012;
    ctx.beginPath();
    ctx.arc(w * 0.47 + Math.cos(a) * r, h * 0.47 + Math.sin(a) * r, w * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }
}
