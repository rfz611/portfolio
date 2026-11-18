import type { Film } from '../content/films';

type Ctx = CanvasRenderingContext2D;

/** Tecido da capa: cor de fundo com uma trama fina. */
function cloth(ctx: Ctx, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = y % 4 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(0, y, w, 1);
  }
}

/** Magnólia vermelha estilizada: pétalas em gota em volta de um miolo. */
function magnolia(ctx: Ctx, cx: number, cy: number, r: number) {
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.45, -r * 0.5, 0, -r);
    ctx.quadraticCurveTo(-r * 0.45, -r * 0.5, 0, 0);
    ctx.fillStyle = k % 2 ? '#a3201c' : '#c8332a';
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#e8c070';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

/** Turbina caindo: círculo prateado com as pás e um rastro, entre estrelas. */
function turbine(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.fillStyle = 'rgba(200,210,230,0.7)';
  for (let i = 0; i < 40; i++) {
    ctx.fillRect((i * 37) % 112, (i * 53) % 90, 1, 1);
  }
  ctx.strokeStyle = 'rgba(200,210,230,0.25)';
  ctx.lineWidth = r * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx - r * 2.2, cy - r * 2.6);
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.fillStyle = '#aab3c2';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a2030';
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#aab3c2';
  ctx.lineWidth = 1;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a + 0.4) * r * 0.78, cy + Math.sin(a + 0.4) * r * 0.78);
    ctx.stroke();
  }
}

/** Círculo de tinta preta feito com pincel, irregular, com respingos. */
function inkRing(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.fillStyle = '#141414';
  for (let k = 0; k < 90; k++) {
    const a = (k / 90) * Math.PI * 2;
    const rr = r * (1 + 0.06 * Math.sin(a * 5) + 0.03 * Math.sin(a * 13));
    const th = r * (0.08 + 0.06 * Math.abs(Math.sin(a * 3 + 1)));
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, th, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let k = 0; k < 7; k++) {
    const a = k * 0.9 + 0.3;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Capa de livro de capa dura, cada filme com o seu desenho (feito aqui,
 * só inspirado no tema): a magnólia vermelha, a turbina caindo entre
 * estrelas, o círculo de tinta na névoa. Pintada pequena, pixels aparentes.
 */
export function paintBookCover(ctx: Ctx, w: number, h: number, film: Film) {
  cloth(ctx, w, h, film.color);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (film.id === 'magnolia') {
    ctx.strokeStyle = '#8a1a18';
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, w - 12, h - 12);
    magnolia(ctx, w / 2, h * 0.4, w * 0.28);
    ctx.fillStyle = film.ink;
    ctx.font = `italic 700 ${w * 0.15}px "Bodoni Moda", Georgia, serif`;
    ctx.fillText('Magnolia', w / 2, h * 0.75);
  } else if (film.id === 'donnie') {
    turbine(ctx, w * 0.58, h * 0.42, w * 0.16);
    ctx.fillStyle = film.ink;
    ctx.font = `700 ${w * 0.12}px "Manrope Variable", sans-serif`;
    ctx.fillText('DONNIE', w / 2, h * 0.74);
    ctx.fillText('DARKO', w / 2, h * 0.84);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    inkRing(ctx, w / 2, h * 0.42, w * 0.24);
    ctx.fillStyle = film.ink;
    ctx.font = `300 ${w * 0.1}px "Manrope Variable", sans-serif`;
    ctx.fillText('A R R I V A L', w / 2, h * 0.82);
  }
  ctx.fillStyle = film.ink;
  ctx.globalAlpha = 0.75;
  ctx.font = `${w * 0.075}px "VT323", monospace`;
  ctx.fillText(`${film.year} · ${film.director}`, w / 2, h * 0.93);
  ctx.globalAlpha = 1;
}

/** Lombada: o título deitado, na cor e na letra de cada livro. */
export function paintBookSpine(ctx: Ctx, w: number, h: number, film: Film) {
  cloth(ctx, w, h, film.color);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, w, 2);
  ctx.fillRect(0, h - 2, w, 2);
  ctx.fillStyle = film.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const font =
    film.id === 'magnolia'
      ? `italic 700 ${h * 0.6}px "Bodoni Moda", Georgia, serif`
      : film.id === 'donnie'
        ? `700 ${h * 0.5}px "Manrope Variable", sans-serif`
        : `300 ${h * 0.5}px "Manrope Variable", sans-serif`;
  ctx.font = font;
  ctx.fillText(`${film.title}  ·  ${film.year}`, w / 2, h / 2 + 1);
}
