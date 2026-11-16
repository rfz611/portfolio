/**
 * Planta da cobertura em metros (docs/planta.png).
 * Eixos: x cresce para a direita (garagem), z cresce para "baixo" na planta,
 * y é a altura. A parede de vidro com a cidade fica em z = -4.5.
 */
export const ROOM = { x0: -6, x1: 6, z0: -4.5, z1: 4.5, h: 3.4 } as const;
export const GARAGE = { x0: 6, x1: 13, z0: -4.5, z1: 4.5 } as const;

/** Sala rebaixada: contorno de fora (borda do degrau) e de dentro (fundo). */
export const PIT = {
  outer: { x0: -2.6, x1: 3.14, z0: -1.9, z1: 3.08, r: 0.75 },
  inner: { x0: -2.22, x1: 2.75, z0: -1.48, z1: 2.67, r: 0.5 },
  step: 0.2,
  depth: 0.4,
} as const;

/** Passagem aberta na parede de vidro entre a sala e a garagem. */
export const PASSAGE = { z0: 1.48, z1: 3.08, h: 2.4 } as const;

type P3 = readonly [number, number, number];

/** Onde cada móvel fica (centro, no chão). */
export const SPOT = {
  shelf: [-5.775, 0, -0.45],
  tvRack: [-5.775, 0, 0.93],
  lampA: [-5.68, 0, -1.62],
  lampB: [-5.68, 0, 1.74],
  desk: [-4.0, 0, -3.22],
  bar: [2.85, 0, -3.3],
  backBar: [2.85, 0, -4.2],
  table: [0.17, -PIT.depth, 0.59],
  armchair: [-1.35, -PIT.depth, 1.95],
  palm: [5.14, 0, 3.77],
  monstera: [5.14, 0, -3.08],
  neon: [0, 2.45, -4.42],
  car: [9.3, 0, 0.5],
} as const satisfies Record<string, P3>;
