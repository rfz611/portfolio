import { grain, type Ctx } from './canvas';

/** Texturas dos objetos da mesa de centro: cartas, verso das cartas e o emblema do perfume. */

const DISPLAY = '"Bodoni Moda", Didot, serif';

/** Onde ficam os naipes de cada carta (x, y de 0 a 1), como num baralho de verdade. */
const PIPS: Record<string, [number, number][]> = {
  '7': [
    [0.3, 0.22],
    [0.7, 0.22],
    [0.5, 0.36],
    [0.3, 0.5],
    [0.7, 0.5],
    [0.3, 0.78],
    [0.7, 0.78],
  ],
  '10': [
    [0.3, 0.2],
    [0.7, 0.2],
    [0.5, 0.31],
    [0.3, 0.42],
    [0.7, 0.42],
    [0.3, 0.58],
    [0.7, 0.58],
    [0.5, 0.69],
    [0.3, 0.8],
    [0.7, 0.8],
  ],
};

/**
 * Frente da carta: índice nos dois cantos e o desenho do meio. Ás com um
 * naipe grande ornamentado; números com os naipes no lugar certo; figuras
 * (K, Q, J) com moldura dourada e coroa, sem personagem.
 */
export function paintCardFace(
  ctx: Ctx,
  w: number,
  h: number,
  suit: string,
  rank: string,
  red: boolean,
) {
  const ink = red ? '#a3121f' : '#151313';
  ctx.fillStyle = '#f1e9d6';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(3, 3, w - 6, h - 6);
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const corner = (flip: boolean) => {
    ctx.save();
    if (flip) {
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
    }
    ctx.font = `600 ${w * 0.17}px ${DISPLAY}`;
    ctx.fillText(rank, w * 0.12, h * 0.08);
    ctx.font = `${w * 0.13}px serif`;
    ctx.fillText(suit, w * 0.12, h * 0.17);
    ctx.restore();
  };
  corner(false);
  corner(true);

  if (rank === 'A') {
    ctx.strokeStyle = '#b8893a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `${w * 0.5}px serif`;
    ctx.fillText(suit, w / 2, h / 2 + h * 0.01);
  } else if (PIPS[rank]) {
    ctx.font = `${w * 0.2}px serif`;
    for (const [x, y] of PIPS[rank]) {
      ctx.save();
      ctx.translate(x * w, y * h);
      if (y > 0.55) ctx.rotate(Math.PI);
      ctx.fillText(suit, 0, 0);
      ctx.restore();
    }
  } else {
    // figura: moldura dourada, coroa estilizada e a letra grande
    ctx.strokeStyle = '#b8893a';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.2, h * 0.16, w * 0.6, h * 0.68);
    ctx.fillStyle = '#b8893a';
    ctx.beginPath();
    const cy = h * 0.32;
    ctx.moveTo(w * 0.32, cy + h * 0.06);
    ctx.lineTo(w * 0.32, cy - h * 0.02);
    ctx.lineTo(w * 0.41, cy + h * 0.025);
    ctx.lineTo(w * 0.5, cy - h * 0.05);
    ctx.lineTo(w * 0.59, cy + h * 0.025);
    ctx.lineTo(w * 0.68, cy - h * 0.02);
    ctx.lineTo(w * 0.68, cy + h * 0.06);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `italic 600 ${w * 0.34}px ${DISPLAY}`;
    ctx.fillText(rank, w / 2, h * 0.56);
    ctx.font = `${w * 0.16}px serif`;
    ctx.fillText(suit, w / 2, h * 0.74);
  }
  grain(ctx, w, h, { seed: 3, fine: 0.03 });
}

/** Verso da carta: vinho com treliça dourada e moldura. */
export function paintCardBack(ctx: Ctx, w: number, h: number) {
  ctx.fillStyle = '#f1e9d6';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#5c0f16';
  ctx.fillRect(w * 0.07, h * 0.05, w * 0.86, h * 0.9);
  ctx.strokeStyle = 'rgba(200,160,90,0.75)';
  ctx.lineWidth = 1;
  const step = w * 0.09;
  for (let i = -h; i < w + h; i += step) {
    ctx.beginPath();
    ctx.moveTo(i, h * 0.05);
    ctx.lineTo(i + h, h * 0.95);
    ctx.moveTo(i + h, h * 0.05);
    ctx.lineTo(i, h * 0.95);
    ctx.stroke();
  }
  ctx.fillStyle = '#5c0f16';
  ctx.fillRect(w * 0.3, h * 0.38, w * 0.4, h * 0.24);
  ctx.strokeStyle = '#c8a265';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.07, h * 0.05, w * 0.86, h * 0.9);
  ctx.strokeRect(w * 0.3, h * 0.38, w * 0.4, h * 0.24);
  ctx.fillStyle = '#c8a265';
  ctx.font = `italic 600 ${w * 0.2}px ${DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('R', w / 2, h / 2);
  grain(ctx, w, h, { seed: 5, fine: 0.04 });
}
