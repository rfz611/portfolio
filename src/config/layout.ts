/**
 * Planta da cobertura em metros (docs/planta.png).
 * Eixos: x cresce para a direita (garagem), z cresce para "baixo" na planta,
 * y é a altura. A parede de vidro com a cidade fica em z = -4.5.
 */
export const ROOM = { x0: -6, x1: 6, z0: -4.5, z1: 4.5, h: 3.4 } as const;
export const GARAGE = { x0: 6, x1: 13, z0: -4.5, z1: 4.5 } as const;

/**
 * Sala rebaixada ("conversation pit" dos anos 80): um buraco de cantos
 * arredondados com o sofá embutido em U encostado nas paredes de dentro.
 * O lado aberto do U fica a oeste, de frente para a TV, com dois degraus.
 */
export const PIT = { x0: -2.0, x1: 3.0, z0: -1.6, z1: 2.8, r: 0.9, depth: 0.45 } as const;
/** Profundidade do assento do sofá embutido (da parede do rebaixo para dentro). */
export const PIT_SEAT = 0.82;
/** Onde o sofá começa a oeste (fim do arredondado do canto). */
export const PIT_SOFA_X0 = PIT.x0 + PIT.r;
/** Degraus de entrada no lado aberto. */
export const PIT_STEPS = { z0: -0.62, z1: 1.82 } as const;

/** Passagem aberta na parede de vidro entre a sala e a garagem. */
export const PASSAGE = { z0: 1.48, z1: 3.08, h: 2.4 } as const;

/** Área do bar: piso de mármore, rebaixo de teto com neon azul e balcão. */
export const BAR = { x0: 1.85, x1: 4.75, z0: -4.5, z1: -2.05 } as const;

type P3 = readonly [number, number, number];

/** Onde cada móvel fica (centro, no chão). */
export const SPOT = {
  /** Centro do aparador de mogno (cantinho dos discos). */
  shelf: [-5.75, 0, 0.4],
  /** TV em cima do aparador. */
  tvRack: [-5.76, 0.62, 1.25],
  lampA: [-5.68, 0, -1.48],
  lampB: [-5.68, 0, 2.28],
  desk: [-3.35, 0, -3.05],
  bar: [3.3, 0, -2.75],
  backBar: [3.3, 0, -4.22],
  table: [0.45, -PIT.depth, 0.6],
  armchair: [-3.05, 0, 3.25],
  arcLamp: [3.75, 0, 3.45],
  palm: [5.55, 0, 0.85],
  monstera: [5.3, 0, -1.55],
  neon: [-0.35, 2.45, -4.42],
  car: [9.3, 0, 0.5],
} as const satisfies Record<string, P3>;

/** Centro da tela da TV no mundo (usado pelo plano de câmera "tv"). */
export const TV_SCREEN_WORLD = [
  SPOT.tvRack[0] + 0.262,
  SPOT.tvRack[1] + 0.285,
  SPOT.tvRack[2] + 0.085,
] as const;

/**
 * Notebook na escrivaninha: a tela fica virada para o lado da janela (onde
 * a pessoa senta). Usado pelo modelo e pelo plano de câmera "pc".
 */
export const LAPTOP = {
  /** Centro da base do notebook, em coordenadas do mundo. */
  base: [SPOT.desk[0] + 0.12, 0.775, SPOT.desk[2] - 0.08],
  /** Inclinação da tampa para trás, além da vertical (radianos). */
  tilt: 0.26,
  w: 0.304,
  d: 0.214,
  lid: 0.2,
} as const;

/** Outdoor com o nome, na fachada de um prédio em frente à janela. */
export const BILLBOARD = { x: 42, y: 6, z: -112, w: 34, h: 12.5, yaw: -0.36 } as const;
