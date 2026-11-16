import * as THREE from 'three';
import { palette } from '../config/palette';
import { makeCanvas, tex } from './canvas';
import {
  paintBlob,
  paintBrushed,
  paintCarpet,
  paintCeiling,
  paintConcrete,
  paintEnv,
  paintFolds,
  paintGarageWall,
  paintGlow,
  paintGrille,
  paintLeather,
  paintSky,
  paintWallPanel,
  paintWood,
} from './surfaces';

/**
 * Biblioteca de texturas e materiais da cena.
 * Tudo é pintado em canvas na hora de abrir o site (nada é baixado), um
 * passo por vez, e é esse progresso que a tela de carregamento mostra.
 */
const painters = {
  // UV em metros: repeat = 1 / (metros por repetição)
  carpet: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) => paintCarpet(c, w, h, 11)),
      { repeat: [0.5, 0.5] },
    ),
  wall: () =>
    tex(
      makeCanvas(512, 1024, (c, w, h) => paintWallPanel(c, w, h, 21)),
      { aniso: 8 },
    ),
  ceiling: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) => paintCeiling(c, w, h, 31)),
      { repeat: [0.5, 0.5] },
    ),
  wood: () =>
    tex(
      makeCanvas(1024, 512, (c, w, h) => paintWood(c, w, h, { base: palette.mahogany, seed: 41 })),
      {
        repeat: [0.5, 1],
        aniso: 8,
      },
    ),
  woodDark: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) => paintWood(c, w, h, { base: '#2a0e08', seed: 43 })),
      {
        repeat: [1, 1],
      },
    ),
  woodLight: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) =>
        paintWood(c, w, h, { base: '#6b3418', seed: 47, contrast: 0.8 }),
      ),
      {
        repeat: [1, 1],
      },
    ),
  leatherWine: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: palette.leatherWine, seed: 51 }),
      ),
      {
        repeat: [1.6, 1.6],
      },
    ),
  leatherWineTuft: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: palette.leatherWine, seed: 53, tufted: [3, 2] }),
      ),
    ),
  leatherWineSeat: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: palette.leatherWine, seed: 55, seams: true }),
      ),
    ),
  leatherBrown: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: palette.leatherBrown, seed: 57 }),
      ),
      {
        repeat: [1.6, 1.6],
      },
    ),
  leatherBrownTuft: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: '#4a2718', seed: 59, tufted: [3, 2] }),
      ),
    ),
  curtain: () =>
    tex(makeCanvas(512, 512, (c, w, h) => paintFolds(c, w, h, palette.curtain, 7, 61))),
  brass: () =>
    tex(
      makeCanvas(256, 256, (c, w, h) => paintBrushed(c, w, h, palette.brass, 71)),
      { repeat: [2, 2] },
    ),
  steel: () =>
    tex(
      makeCanvas(256, 256, (c, w, h) => paintBrushed(c, w, h, '#8d9095', 73)),
      { repeat: [2, 2] },
    ),
  grille: () => tex(makeCanvas(256, 512, paintGrille), { clamp: true }),
  concrete: () =>
    tex(
      makeCanvas(512, 512, (c, w, h) => paintConcrete(c, w, h, 81)),
      { repeat: [0.4, 0.4] },
    ),
  garageWall: () => tex(makeCanvas(512, 512, (c, w, h) => paintGarageWall(c, w, h, 83))),
  glow: () =>
    tex(
      makeCanvas(128, 128, (c, w, h) => paintGlow(c, w, h, 2.2)),
      { clamp: true },
    ),
  glowSoft: () =>
    tex(
      makeCanvas(128, 128, (c, w, h) => paintGlow(c, w, h, 1.3)),
      { clamp: true },
    ),
  blob: () => tex(makeCanvas(128, 128, paintBlob), { clamp: true }),
  sky: () => tex(makeCanvas(8, 512, paintSky), { clamp: true }),
  env: () => {
    const t = tex(makeCanvas(1024, 512, paintEnv), { clamp: true });
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  },
} satisfies Record<string, () => THREE.Texture>;

export type TexKey = keyof typeof painters;
export type Textures = Record<TexKey, THREE.CanvasTexture>;

const hdr = (hex: string, gain: number) => new THREE.Color(hex).multiplyScalar(gain);

function makeMaterials(t: Textures) {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
  const matte = (p: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(p);
  const light = (color: THREE.Color, p: THREE.MeshBasicMaterialParameters = {}) =>
    new THREE.MeshBasicMaterial({ color, toneMapped: false, ...p });
  const additive = (map: THREE.Texture, hex: string, opacity = 1) =>
    new THREE.MeshBasicMaterial({
      map,
      color: hex,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    });

  return {
    carpet: matte({ map: t.carpet }),
    carpetRiser: matte({ map: t.carpet, color: '#8f8fa8', side: THREE.DoubleSide }),
    ceiling: matte({ map: t.ceiling }),
    mahogany: std({ map: t.wood, roughness: 0.34, metalness: 0, envMapIntensity: 0.9 }),
    mahoganyDark: std({ map: t.woodDark, roughness: 0.5, envMapIntensity: 0.5 }),
    walnut: std({ map: t.woodLight, roughness: 0.42, envMapIntensity: 0.6 }),
    varnish: std({ map: t.wood, roughness: 0.12, envMapIntensity: 1.5 }),
    leatherWine: std({ map: t.leatherWine, roughness: 0.48, envMapIntensity: 0.7 }),
    leatherWineTuft: std({ map: t.leatherWineTuft, roughness: 0.44, envMapIntensity: 0.7 }),
    leatherWineSeat: std({ map: t.leatherWineSeat, roughness: 0.5, envMapIntensity: 0.6 }),
    leatherBrown: std({ map: t.leatherBrown, roughness: 0.5, envMapIntensity: 0.6 }),
    leatherBrownTuft: std({ map: t.leatherBrownTuft, roughness: 0.46, envMapIntensity: 0.7 }),
    curtain: matte({ map: t.curtain, side: THREE.DoubleSide }),
    brass: std({ map: t.brass, roughness: 0.28, metalness: 1, envMapIntensity: 1.6 }),
    steel: std({ map: t.steel, roughness: 0.3, metalness: 1, envMapIntensity: 1.3 }),
    bronze: std({ color: '#191310', roughness: 0.45, metalness: 0.8, envMapIntensity: 0.8 }),
    blackPlastic: std({ color: '#0d0d0f', roughness: 0.42, envMapIntensity: 0.6 }),
    rubber: std({ color: '#0a0a0b', roughness: 0.9, envMapIntensity: 0.2 }),
    glass: std({
      color: '#182454',
      roughness: 0.22,
      metalness: 0.6,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.6,
    }),
    smokedGlass: std({
      color: '#2a1c14',
      roughness: 0.05,
      metalness: 0.4,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.5,
    }),
    concrete: std({ map: t.concrete, roughness: 0.22, metalness: 0.3, envMapIntensity: 1.1 }),
    garageWall: matte({ map: t.garageWall }),
    fascia: std({ color: '#0c0b10', roughness: 0.7, metalness: 0.2 }),
    // fontes de luz: cor acima de 1 para o bloom pegar só nelas
    amberStrip: light(hdr(palette.amber, 1.5)),
    amberBulb: light(hdr(palette.amber, 3)),
    neonRed: light(hdr(palette.neonRed, 4)),
    neonBlue: light(hdr(palette.neonBlue, 4.5)),
    white: light(hdr('#cfe0ff', 1.6)),
    // brilhos e sombras "assados"
    glowAmber: additive(t.glow, palette.amber, 0.55),
    glowAmberSoft: additive(t.glowSoft, palette.amber, 0.3),
    glowBlue: additive(t.glow, palette.neonBlue, 0.6),
    glowRed: additive(t.glow, palette.neonRed, 0.6),
    shadow: new THREE.MeshBasicMaterial({
      map: t.blob,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
  };
}

export type Materials = ReturnType<typeof makeMaterials>;

export interface Library {
  tex: Textures;
  mat: Materials;
}

let library: Library | null = null;
let building: Promise<Library> | null = null;

/** Devolve a biblioteca pronta. Só pode ser chamada depois de buildLibrary. */
export function lib(): Library {
  if (!library) throw new Error('biblioteca de texturas ainda não foi gerada');
  return library;
}

export const isLibraryReady = () => library !== null;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

async function waitFonts() {
  if (!document.fonts) return;
  const fonts = ['italic 600 48px "Bodoni Moda"', '600 24px "Manrope Variable"', '32px "VT323"'];
  const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, 2500));
  await Promise.race([
    Promise.allSettled(fonts.map((f) => document.fonts.load(f))).then(() => undefined),
    timeout,
  ]);
}

/** Outras partes do site (capas, letreiros) entram na fila de carregamento por aqui. */
export type ExtraStep = (library: Library) => void;
const extraSteps: ExtraStep[] = [];
export const addLibraryStep = (step: ExtraStep) => extraSteps.push(step);

export function buildLibrary(onProgress: (progress: number) => void): Promise<Library> {
  if (library) return Promise.resolve(library);
  if (building) return building;
  building = (async () => {
    await waitFonts();
    const keys = Object.keys(painters) as TexKey[];
    const total = keys.length + 1 + extraSteps.length;
    let done = 0;
    const tick = async () => {
      done += 1;
      onProgress(done / total);
      await nextFrame();
    };
    const textures = {} as Textures;
    for (const key of keys) {
      textures[key] = painters[key]();
      await tick();
    }
    const built: Library = { tex: textures, mat: makeMaterials(textures) };
    await tick();
    for (const step of extraSteps) {
      step(built);
      await tick();
    }
    library = built;
    return built;
  })();
  return building;
}
