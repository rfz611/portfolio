import { grain, rgba, type Ctx } from './canvas';

/**
 * Rótulos das garrafas do bar com os nomes das marcas (pedido do Raphael),
 * desenhados com letra simples, sem copiar o logotipo de nenhuma delas.
 * Os índices 1, 2 e 3 são as garrafas que o barman usa (whisky, negroni, martini).
 */

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
  {
    name: 'Hennessy',
    sub: 'COGNAC · V.S.O.P',
    paper: '#141210',
    ink: '#e6cf98',
    accent: '#b8893a',
  },
  {
    name: "Jack Daniel's",
    sub: 'OLD No. 7 · TENNESSEE',
    paper: '#0e0e0e',
    ink: '#f2f0ea',
    accent: '#d9d6cf',
  },
  { name: 'Campari', sub: 'BITTER · MILANO', paper: '#f4efe6', ink: '#b3121e', accent: '#b3121e' },
  { name: 'Tanqueray', sub: 'LONDON DRY GIN', paper: '#f0ece0', ink: '#1b4a30', accent: '#b3121e' },
  { name: 'Bacardí', sub: 'RON · AÑEJO', paper: '#f2ecdc', ink: '#9a1a14', accent: '#c9a24a' },
  { name: 'Martini', sub: 'ROSSO · VERMOUTH', paper: '#f6f2ea', ink: '#14181e', accent: '#b3121e' },
  {
    name: 'Grey Goose',
    sub: 'VODKA · FRANCE',
    paper: '#e8edf2',
    ink: '#1d2c44',
    accent: '#7c8ea8',
  },
  {
    name: "Maker's Mark",
    sub: 'KENTUCKY BOURBON',
    paper: '#efe5cc',
    ink: '#1a1410',
    accent: '#9a0f16',
  },
  {
    name: 'Johnnie Walker',
    sub: 'BLACK LABEL · 12',
    paper: '#0f0f0f',
    ink: '#d9b45a',
    accent: '#d9b45a',
  },
  {
    name: 'The Macallan',
    sub: 'SINGLE MALT · 18',
    paper: '#f1e9d6',
    ink: '#3a2414',
    accent: '#9a6a2a',
  },
  {
    name: 'Bombay Sapphire',
    sub: 'LONDON DRY GIN',
    paper: '#cfe0f0',
    ink: '#14305a',
    accent: '#c9a24a',
  },
  {
    name: 'Don Julio',
    sub: 'TEQUILA · BLANCO',
    paper: '#efe8d6',
    ink: '#2a1e12',
    accent: '#b8893a',
  },
  {
    name: 'Moët & Chandon',
    sub: 'CHAMPAGNE · BRUT',
    paper: '#121212',
    ink: '#e6cf98',
    accent: '#c9a24a',
  },
  {
    name: 'Dassai',
    sub: 'SAKE · JUNMAI DAIGINJO',
    paper: '#f6f4ee',
    ink: '#141414',
    accent: '#9a0f16',
  },
  {
    name: 'Sangría',
    sub: 'VINO TINTO · ESPAÑA',
    paper: '#5a0d16',
    ink: '#f2e2c4',
    accent: '#d9b360',
  },
  { name: 'Sidra', sub: 'NATURAL · ASTURIAS', paper: '#e8e2c8', ink: '#2c4a18', accent: '#8a6a2a' },
  {
    name: 'Montenegro',
    sub: 'AMARO · BOLOGNA',
    paper: '#efe6cf',
    ink: '#6a1414',
    accent: '#b8893a',
  },
  {
    name: 'Jägermeister',
    sub: 'KRÄUTERLIKÖR',
    paper: '#e57a1c',
    ink: '#123a1e',
    accent: '#f2e2c4',
  },
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
