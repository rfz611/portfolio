import { grain, rgba, type Ctx } from './canvas';

/** Rótulos de garrafa com nomes inventados (nenhuma marca real). */

const DISPLAY = '"Bodoni Moda", Didot, serif';
const BODY = '"Manrope Variable", Manrope, system-ui, sans-serif';

export interface LabelStyle {
  name: string;
  sub: string;
  paper: string;
  ink: string;
  accent: string;
}

export const LABELS: LabelStyle[] = [
  { name: 'Vieux Moulin', sub: 'COGNAC · XO', paper: '#e8dcc0', ink: '#2a1a10', accent: '#b8893a' },
  {
    name: 'Royal Oak',
    sub: 'SINGLE MALT · 18',
    paper: '#121212',
    ink: '#e6d3a3',
    accent: '#c9a24a',
  },
  { name: 'Castello', sub: 'AMARO', paper: '#7a1018', ink: '#f2e6cf', accent: '#d9b360' },
  { name: 'No. 7', sub: 'LONDON DRY GIN', paper: '#f0efe8', ink: '#1d3b5a', accent: '#7aa0c0' },
  { name: 'Gold Reserve', sub: 'RUM · AÑEJO', paper: '#c79a3c', ink: '#24170a', accent: '#5a3a14' },
  { name: 'Ruby', sub: 'VERMOUTH ROSSO', paper: '#3a0a10', ink: '#f0c9a0', accent: '#b8893a' },
  { name: 'Sterling', sub: 'VODKA', paper: '#d7dbe0', ink: '#14181e', accent: '#7c8794' },
  { name: 'Old Harbor', sub: 'BOURBON', paper: '#2b1a0e', ink: '#e8c890', accent: '#a5341f' },
];

/**
 * Rótulo dá a volta na garrafa; o desenho fica no meio da faixa, que é a
 * parte virada para a frente.
 */
export function paintLabel(ctx: Ctx, w: number, h: number, s: LabelStyle) {
  ctx.fillStyle = s.paper;
  ctx.fillRect(0, 0, w, h);
  const x0 = w * 0.3;
  const x1 = w * 0.7;
  ctx.strokeStyle = s.accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, h * 0.1, x1 - x0, h * 0.8);
  ctx.strokeStyle = rgba(s.accent, 0.6);
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 + 4, h * 0.1 + 4, x1 - x0 - 8, h * 0.8 - 8);
  ctx.fillStyle = s.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = h * 0.3;
  ctx.font = `italic 600 ${size}px ${DISPLAY}`;
  while (ctx.measureText(s.name).width > (x1 - x0) * 0.86 && size > 8) {
    size -= 1;
    ctx.font = `italic 600 ${size}px ${DISPLAY}`;
  }
  ctx.fillText(s.name, w / 2, h * 0.43);
  ctx.font = `700 ${h * 0.11}px ${BODY}`;
  ctx.fillStyle = rgba(s.ink, 0.8);
  ctx.fillText(s.sub, w / 2, h * 0.7);
  ctx.fillStyle = s.accent;
  ctx.fillRect(x0 + (x1 - x0) * 0.35, h * 0.58, (x1 - x0) * 0.3, 1.5);
  grain(ctx, w, h, { seed: s.name.length, fine: 0.05, low: 0.03 });
}
