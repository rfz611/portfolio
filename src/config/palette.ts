/**
 * Paleta única do site (seção "Direção de arte" da especificação).
 * Para mudar a cor das cortinas ou dos neons, basta trocar aqui.
 */
export const palette = {
  night: '#0B1030',
  ink: '#070A1C',
  mahogany: '#4A1A0E',
  leatherWine: '#5C0F16',
  leatherBrown: '#3B1F14',
  brass: '#B8893A',
  curtain: '#3A1450',
  amber: '#FFB35C',
  neonRed: '#D0142C',
  neonBlue: '#2D4BFF',
  text: '#EFE6DA',
} as const;

export type PaletteKey = keyof typeof palette;
