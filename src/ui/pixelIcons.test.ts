import { describe, expect, it } from 'vitest';
import { PIXEL_ICONS, PIXEL_PALETTE, pixelRects } from './pixelIcons';

describe('ícones da área de trabalho', () => {
  it('todo ícone tem 16 × 16 pixels e só usa cores da paleta', () => {
    for (const rows of Object.values(PIXEL_ICONS)) {
      expect(rows).toHaveLength(16);
      for (const row of rows) {
        expect(row).toHaveLength(16);
        for (const ch of row) expect(ch === '.' || ch in PIXEL_PALETTE).toBe(true);
      }
    }
  });

  it('gera um quadradinho para cada pixel pintado', () => {
    const painted = PIXEL_ICONS.about.join('').replace(/\./g, '').length;
    expect(pixelRects('about')).toHaveLength(painted);
  });
});
