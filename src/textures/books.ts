import type { Film } from '../content/films';

type Ctx = CanvasRenderingContext2D;

/**
 * Capa de livro de capa dura (desenho próprio, estilo retrô): tecido
 * colorido, filete dourado, título em letra de cartaz, ano e diretor.
 * Pintada pequena para os pixels aparecerem (com NearestFilter).
 */
export function paintBookCover(ctx: Ctx, w: number, h: number, film: Film) {
  ctx.fillStyle = film.color;
  ctx.fillRect(0, 0, w, h);
  // trama do tecido da capa
  for (let y = 0; y < h; y += 2) {
    ctx.fillStyle = y % 4 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, w, 1);
  }
  ctx.strokeStyle = '#c9a050';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = '#e8c878';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = w * 0.16;
  ctx.font = `700 ${size}px "Bodoni Moda", Georgia, serif`;
  while (ctx.measureText(film.title).width > w * 0.8 && size > 8) {
    size -= 1;
    ctx.font = `700 ${size}px "Bodoni Moda", Georgia, serif`;
  }
  ctx.fillText(film.title, w / 2, h * 0.42);
  ctx.fillRect(w * 0.35, h * 0.52, w * 0.3, 1.5);
  ctx.font = `${w * 0.09}px "VT323", monospace`;
  ctx.fillText(String(film.year), w / 2, h * 0.6);
  ctx.font = `italic ${w * 0.07}px "Bodoni Moda", Georgia, serif`;
  ctx.fillStyle = 'rgba(232,200,120,0.8)';
  ctx.fillText(film.director, w / 2, h * 0.82);
}

/** Lombada: o título deitado, em dourado. */
export function paintBookSpine(ctx: Ctx, w: number, h: number, film: Film) {
  ctx.fillStyle = film.color;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, w, 2);
  ctx.fillRect(0, h - 2, w, 2);
  ctx.fillStyle = '#e8c878';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${h * 0.55}px "Bodoni Moda", Georgia, serif`;
  ctx.fillText(`${film.title}  ·  ${film.year}`, w / 2, h / 2 + 1);
}
