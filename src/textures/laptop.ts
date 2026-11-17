/** Texturas do notebook do escritório. */

type Key = [label: string, units: number];

const letters = (keys: string) => [...keys].map((k): Key => [k, 1]);

/** Fileiras do teclado do MacBook (larguras em unidades de tecla; cada fileira soma 14,5). */
const ROWS: { height: number; keys: Key[] }[] = [
  {
    height: 0.55,
    keys: [
      ['esc', 1.45],
      ...Array.from({ length: 12 }, (_, i): Key => [`F${i + 1}`, 1]),
      ['', 1.05],
    ],
  },
  { height: 1, keys: [['`', 1], ...letters('1234567890-='), ['delete', 1.5]] },
  { height: 1, keys: [['tab', 1.5], ...letters('QWERTYUIOP[]\\')] },
  { height: 1, keys: [['caps lock', 1.8], ...letters("ASDFGHJKL;'"), ['return', 1.7]] },
  { height: 1, keys: [['shift', 2.25], ...letters('ZXCVBNM,./'), ['shift', 2.25]] },
  {
    height: 1,
    keys: [
      ['fn', 1],
      ['control', 1],
      ['option', 1],
      ['command', 1.25],
      ['', 5],
      ['command', 1.25],
      ['option', 1],
      ['arrows', 3],
    ],
  },
];

const RIGHT_ALIGNED = new Set(['delete', 'return']);

function keyCap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  unit: number,
  alignRight = false,
) {
  const r = Math.min(w, h) * 0.14;
  // sombra no poço da tecla
  ctx.fillStyle = '#030304';
  ctx.beginPath();
  ctx.roundRect(x - 1, y - 1, w + 2, h + 3, r);
  ctx.fill();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#2a2a2f');
  g.addColorStop(0.15, '#1b1b1f');
  g.addColorStop(1, '#121215');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.stroke();
  if (!label) return;
  ctx.fillStyle = '#c9c9cf';
  const long = label.length > 1 && !label.startsWith('F');
  ctx.font = `${long || label.startsWith('F') ? unit * 0.2 : unit * 0.32}px "Manrope Variable", sans-serif`;
  if (long) {
    ctx.textBaseline = 'bottom';
    ctx.textAlign = alignRight ? 'right' : 'left';
    ctx.fillText(label, alignRight ? x + w - unit * 0.1 : x + unit * 0.1, y + h - unit * 0.08);
  } else {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
  }
}

/**
 * Teclado do MacBook: teclas pretas com as legendas claras, poço escuro em
 * volta, fileira de funções baixa com o Touch ID e as setas em T invertido.
 */
export function paintLaptopKeys(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#09090b';
  ctx.fillRect(0, 0, w, h);
  const gap = w * 0.006;
  const unit = (w - gap) / 14.5;
  const totalUnits = ROWS.reduce((sum, row) => sum + row.height, 0);
  const rowUnit = (h - gap) / totalUnits;
  let y = gap;
  for (const row of ROWS) {
    const rh = row.height * rowUnit;
    let x = gap;
    row.keys.forEach(([label, units], index) => {
      const kw = units * unit;
      const last = index === row.keys.length - 1;
      if (label === 'arrows') {
        const aw = kw / 3;
        const half = (rh - gap) / 2;
        keyCap(ctx, x, y + half + gap, aw - gap, half, '◀', unit * 0.7);
        keyCap(ctx, x + aw, y, aw - gap, half, '▲', unit * 0.7);
        keyCap(ctx, x + aw, y + half + gap, aw - gap, half, '▼', unit * 0.7);
        keyCap(ctx, x + aw * 2, y + half + gap, aw - gap, half, '▶', unit * 0.7);
      } else if (row.height < 1 && last) {
        // Touch ID: tecla lisa com um anel fino
        keyCap(ctx, x, y, kw - gap, rh - gap, '', unit);
        ctx.strokeStyle = 'rgba(200,200,210,0.25)';
        ctx.beginPath();
        ctx.arc(x + (kw - gap) / 2, y + (rh - gap) / 2, (rh - gap) * 0.3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const alignRight = RIGHT_ALIGNED.has(label) || (label === 'shift' && last);
        keyCap(ctx, x, y, kw - gap, rh - gap, label, unit, alignRight);
      }
      x += kw;
    });
    y += rh;
  }
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
