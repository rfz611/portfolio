/**
 * Ícones da área de trabalho do notebook, desenhados pixel a pixel
 * (16 × 16). Cada letra é uma cor da paleta; "." é transparente.
 */
export const PIXEL_PALETTE: Record<string, string> = {
  k: '#1a1210',
  w: '#f3ead8',
  g: '#9a8f80',
  a: '#ffb35c',
  r: '#9a2f2f',
  b: '#6a4326',
  y: '#e0b04a',
  n: '#2a2a30',
};

export type PixelIconId = 'about' | 'education' | 'experience' | 'languages';

export const PIXEL_ICONS: Record<PixelIconId, string[]> = {
  // folha de texto com o canto dobrado
  about: [
    '..kkkkkkkkk.....',
    '..kwwwwwwwkk....',
    '..kwwwwwwwkwk...',
    '..kwgggggwkkkk..',
    '..kwwwwwwwwwwk..',
    '..kwggggggggwk..',
    '..kwwwwwwwwwwk..',
    '..kwggggggggwk..',
    '..kwwwwwwwwwwk..',
    '..kwgggggggwwk..',
    '..kwwwwwwwwwwk..',
    '..kwggggggggwk..',
    '..kwwwwwwwwwwk..',
    '..kwwwwwwwwwwk..',
    '..kkkkkkkkkkkk..',
    '................',
  ],
  // capelo de formatura com a borla dourada
  education: [
    '................',
    '.......kk.......',
    '.....kknnkk.....',
    '...kknnnnnnkk...',
    '.kknnnnnnnnnnkk.',
    'kknnnnnnyynnnnkk',
    '.kknnnnnnnnnnkk.',
    '...kknnnnnnkky..',
    '...knnnkknnnk.y.',
    '...knnnnnnnnk.y.',
    '...knnnnnnnnk.yy',
    '...kknnnnnnkk.yy',
    '.....kkkkkk.....',
    '................',
    '................',
    '................',
  ],
  // maleta de couro com o fecho de latão
  experience: [
    '................',
    '................',
    '......kkkk......',
    '.....kbbbbk.....',
    '.....kb..bk.....',
    '.kkkkkkkkkkkkkk.',
    '.kbbbbbbbbbbbbk.',
    '.kbbbbbbbbbbbbk.',
    '.kbbbbbyybbbbbk.',
    '.kkkkkkyykkkkkk.',
    '.kbbbbbbbbbbbbk.',
    '.kbbbbbbbbbbbbk.',
    '.kbbbbbbbbbbbbk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................',
  ],
  // dois balões de conversa
  languages: [
    '................',
    '.kkkkkkkkkk.....',
    '.kaaaaaaaak.....',
    '.kakakakaak.....',
    '.kaaaaaaaak.....',
    '.kkakkkkkkk.....',
    '..kak.kkkkkkkkk.',
    '..kk..krrrrrrrk.',
    '......krwrwrwrk.',
    '......krrrrrrrk.',
    '......kkkkkkrkk.',
    '...........krk..',
    '...........kk...',
    '................',
    '................',
    '................',
  ],
};

/** Quadradinhos de cada ícone, prontos para virar <rect> num SVG. */
export function pixelRects(id: PixelIconId): { x: number; y: number; fill: string }[] {
  const rects: { x: number; y: number; fill: string }[] = [];
  PIXEL_ICONS[id].forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const fill = PIXEL_PALETTE[ch];
      if (fill) rects.push({ x, y, fill });
    });
  });
  return rects;
}

/** Nível de cada idioma em quadradinhos (de 5), conforme a especificação. */
export const LANGUAGE_LEVELS: { key: string; level: number }[] = [
  { key: 'about.langPt', level: 5 },
  { key: 'about.langEn', level: 2 },
  { key: 'about.langEs', level: 2 },
  { key: 'about.langIt', level: 1 },
];
