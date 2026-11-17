import * as THREE from 'three';
import { palette } from '../config/palette';
import { makeCanvas, tex } from './canvas';
import {
  paintDeckFront,
  paintKraft,
  paintScreenOff,
  paintShade,
  paintSpines,
  paintStrobe,
  paintTvPanel,
  paintVinyl,
  paintVinylSheen,
} from './props';
import {
  paintFacade,
  paintGroundLights,
  paintKeyboard,
  paintMarble,
  paintMonstera,
  paintNeon,
  paintPalmFrond,
  paintWindows,
} from './room';
import { paintMarbleTiles, paintPaper, paintRug } from './rugs';
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
const canvas = makeCanvas;

const painters = {
  // superfícies: UV em metros, repeat = 1 / (metros por repetição)
  carpet: () =>
    tex(
      canvas(512, 512, (c, w, h) => paintCarpet(c, w, h, 11)),
      { repeat: [0.5, 0.5] },
    ),
  wall: () =>
    tex(
      canvas(512, 1024, (c, w, h) => paintWallPanel(c, w, h, 21)),
      { aniso: 8 },
    ),
  ceiling: () =>
    tex(
      canvas(512, 512, (c, w, h) => paintCeiling(c, w, h, 31)),
      { repeat: [0.5, 0.5] },
    ),
  wood: () =>
    tex(
      canvas(1024, 512, (c, w, h) => paintWood(c, w, h, { base: palette.mahogany, seed: 41 })),
      { repeat: [0.5, 1], aniso: 8 },
    ),
  woodDark: () =>
    tex(canvas(512, 512, (c, w, h) => paintWood(c, w, h, { base: '#2a0e08', seed: 43 }))),
  woodLight: () =>
    tex(
      canvas(512, 512, (c, w, h) =>
        paintWood(c, w, h, { base: '#6b3418', seed: 47, contrast: 0.8 }),
      ),
    ),
  leatherWine: () =>
    tex(
      canvas(512, 512, (c, w, h) => paintLeather(c, w, h, { base: palette.leatherWine, seed: 51 })),
      { repeat: [1.6, 1.6] },
    ),
  leatherWineTuft: () =>
    tex(
      canvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: palette.leatherWine, seed: 53, tufted: [3, 2] }),
      ),
    ),
  leatherWineSeat: () =>
    tex(
      canvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: palette.leatherWine, seed: 55, seams: true }),
      ),
    ),
  leatherBrown: () =>
    tex(
      canvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: palette.leatherBrown, seed: 57 }),
      ),
      { repeat: [1.6, 1.6] },
    ),
  leatherBrownTuft: () =>
    tex(
      canvas(512, 512, (c, w, h) =>
        paintLeather(c, w, h, { base: '#4a2718', seed: 59, tufted: [3, 2] }),
      ),
    ),
  curtain: () => tex(canvas(512, 512, (c, w, h) => paintFolds(c, w, h, palette.curtain, 7, 61))),
  brass: () =>
    tex(
      canvas(256, 256, (c, w, h) => paintBrushed(c, w, h, palette.brass, 71)),
      { repeat: [2, 2] },
    ),
  steel: () =>
    tex(
      canvas(256, 256, (c, w, h) => paintBrushed(c, w, h, '#8d9095', 73)),
      { repeat: [2, 2] },
    ),
  grille: () => tex(canvas(256, 512, paintGrille), { clamp: true }),
  concrete: () =>
    tex(
      canvas(512, 512, (c, w, h) => paintConcrete(c, w, h, 81)),
      { repeat: [0.4, 0.4] },
    ),
  garageWall: () => tex(canvas(512, 512, (c, w, h) => paintGarageWall(c, w, h, 83))),
  glow: () =>
    tex(
      canvas(128, 128, (c, w, h) => paintGlow(c, w, h, 2.2)),
      { clamp: true },
    ),
  glowSoft: () =>
    tex(
      canvas(128, 128, (c, w, h) => paintGlow(c, w, h, 1.3)),
      { clamp: true },
    ),
  blob: () => tex(canvas(128, 128, paintBlob), { clamp: true }),
  sky: () => tex(canvas(8, 512, paintSky), { clamp: true }),
  env: () => {
    const t = tex(canvas(1024, 512, paintEnv), { clamp: true });
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  },
  // objetos
  vinylBlack: () =>
    tex(
      canvas(512, 512, (c, w, h) => paintVinyl(c, w, h, '#0c0c0e')),
      { clamp: true },
    ),
  vinylRed: () =>
    tex(
      canvas(512, 512, (c, w, h) => paintVinyl(c, w, h, '#b0101f')),
      { clamp: true },
    ),
  vinylSheen: () => tex(canvas(256, 256, paintVinylSheen), { clamp: true }),
  kraft: () => tex(canvas(128, 128, paintKraft)),
  shade: () => tex(canvas(256, 128, paintShade)),
  screenOff: () => tex(canvas(256, 192, paintScreenOff), { clamp: true }),
  tvPanel: () => tex(canvas(128, 512, paintTvPanel), { clamp: true }),
  spines: () =>
    tex(
      canvas(256, 256, (c, w, h) => paintSpines(c, w, h, 91)),
      { clamp: true },
    ),
  deckFront: () => tex(canvas(512, 128, paintDeckFront), { clamp: true }),
  strobe: () => tex(canvas(64, 16, paintStrobe), { repeat: [14, 1] }),
  // sala e cidade
  palmFrond: () => tex(canvas(256, 512, paintPalmFrond), { clamp: true }),
  monstera: () => tex(canvas(256, 256, paintMonstera), { clamp: true }),
  marble: () => tex(canvas(512, 512, (c, w, h) => paintMarble(c, w, h, 101))),
  keyboard: () => tex(canvas(256, 96, paintKeyboard), { clamp: true }),
  fabricGold: () =>
    tex(
      canvas(256, 256, (c, w, h) => paintCarpet(c, w, h, 103, '#8a6420')),
      { repeat: [3, 3] },
    ),
  facade: () => tex(canvas(512, 256, (c, w, h) => paintFacade(c, w, h, 105))),
  windowsA: () =>
    tex(
      canvas(128, 256, (c, w, h) => paintWindows(c, w, h, 111, 0.24)),
      { repeat: [1, 0.5] },
    ),
  windowsB: () =>
    tex(
      canvas(128, 256, (c, w, h) => paintWindows(c, w, h, 113, 0.42)),
      { repeat: [1, 0.5] },
    ),
  windowsC: () =>
    tex(
      canvas(128, 256, (c, w, h) => paintWindows(c, w, h, 115, 0.1)),
      { repeat: [1, 0.5] },
    ),
  groundLights: () =>
    tex(
      canvas(1024, 1024, (c, w, h) => paintGroundLights(c, w, h, 117)),
      { aniso: 8 },
    ),
  neonName: () =>
    tex(
      canvas(1024, 384, (c, w, h) => paintNeon(c, w, h, 'Raphael', 'SCHARF PASSOS')),
      { clamp: true },
    ),
  rugPit: () =>
    tex(
      canvas(1024, 768, (c, w, h) =>
        paintRug(c, w, h, 121, {
          field: '#6e1414',
          border: '#1b2340',
          accent: '#c8a265',
          ink: '#2b0a08',
        }),
      ),
      { clamp: true, aniso: 8 },
    ),
  rugDesk: () =>
    tex(
      canvas(1024, 768, (c, w, h) =>
        paintRug(c, w, h, 127, {
          field: '#1d2a4a',
          border: '#6a1a12',
          accent: '#b89a62',
          ink: '#0d1224',
        }),
      ),
      { clamp: true, aniso: 8 },
    ),
  leatherGreen: () =>
    tex(
      canvas(256, 256, (c, w, h) =>
        paintLeather(c, w, h, { base: '#1d3527', seed: 131, seams: true }),
      ),
      { clamp: true },
    ),
  marbleTiles: () =>
    tex(
      canvas(512, 512, (c, w, h) => paintMarbleTiles(c, w, h, 137)),
      { repeat: [1 / 0.8, 1 / 0.8] },
    ),
  paper: () =>
    tex(
      canvas(128, 168, (c, w, h) => paintPaper(c, w, h, 139)),
      { clamp: true },
    ),
} satisfies Record<string, () => THREE.Texture>;

export type TexKey = keyof typeof painters;
export type Textures = Record<TexKey, THREE.CanvasTexture>;

/** Cor acima de 1: só essas superfícies passam do limite do bloom. */
export const hdr = (hex: string, gain: number) => new THREE.Color(hex).multiplyScalar(gain);

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
  const sprite = (hex: string, opacity: number) =>
    new THREE.SpriteMaterial({
      map: t.glow,
      color: hex,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

  return {
    carpet: matte({ map: t.carpet }),
    carpetRiser: matte({ map: t.carpet, color: '#8f8fa8', side: THREE.DoubleSide }),
    ceiling: matte({ map: t.ceiling }),
    mahogany: std({ map: t.wood, roughness: 0.34, metalness: 0, envMapIntensity: 0.9 }),
    mahoganyDark: std({ map: t.woodDark, roughness: 0.5, envMapIntensity: 0.5 }),
    walnut: std({ map: t.woodLight, roughness: 0.42, envMapIntensity: 0.6 }),
    varnish: std({ map: t.wood, roughness: 0.24, envMapIntensity: 1.1 }),
    leatherWine: std({
      map: t.leatherWine,
      color: '#ffa0a8',
      roughness: 0.48,
      envMapIntensity: 0.7,
    }),
    leatherWineTuft: std({
      map: t.leatherWineTuft,
      color: '#ffa0a8',
      roughness: 0.44,
      envMapIntensity: 0.7,
    }),
    leatherWineSeat: std({
      map: t.leatherWineSeat,
      color: '#ffa0a8',
      roughness: 0.5,
      envMapIntensity: 0.6,
    }),
    leatherBrown: std({ map: t.leatherBrown, roughness: 0.5, envMapIntensity: 0.6 }),
    leatherBrownTuft: std({ map: t.leatherBrownTuft, roughness: 0.46, envMapIntensity: 0.7 }),
    curtain: matte({ map: t.curtain, side: THREE.DoubleSide }),
    brass: std({ map: t.brass, roughness: 0.28, metalness: 1, envMapIntensity: 1.6 }),
    steel: std({ map: t.steel, roughness: 0.3, metalness: 1, envMapIntensity: 1.3 }),
    darkMetal: std({ color: '#17181c', roughness: 0.38, metalness: 0.7, envMapIntensity: 1 }),
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
      roughness: 0.08,
      metalness: 0.4,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 1.5,
    }),
    concrete: std({ map: t.concrete, roughness: 0.22, metalness: 0.3, envMapIntensity: 1.1 }),
    garageWall: matte({ map: t.garageWall }),
    fascia: std({ color: '#0c0b10', roughness: 0.7, metalness: 0.2 }),

    // objetos
    vinylBlack: std({ map: t.vinylBlack, roughness: 0.36, metalness: 0, envMapIntensity: 0.45 }),
    vinylRed: std({ map: t.vinylRed, roughness: 0.36, metalness: 0, envMapIntensity: 0.35 }),
    vinylEdge: std({ color: '#0a0a0c', roughness: 0.4 }),
    vinylSheen: additive(t.vinylSheen, '#ffe6c8', 0.3),
    kraft: matte({ map: t.kraft }),
    grille: matte({ map: t.grille }),
    spines: matte({ map: t.spines }),
    deckFront: std({ map: t.deckFront, roughness: 0.45, envMapIntensity: 0.5 }),
    tvPanel: std({ map: t.tvPanel, roughness: 0.5, envMapIntensity: 0.4 }),
    tvScreen: std({ map: t.screenOff, roughness: 0.12, metalness: 0.2, envMapIntensity: 1.6 }),
    platter: std({ map: t.strobe, roughness: 0.3, metalness: 1, envMapIntensity: 1.3 }),
    lampShade: new THREE.MeshBasicMaterial({
      map: t.shade,
      color: hdr(palette.amber, 1.35),
      side: THREE.DoubleSide,
      toneMapped: false,
    }),

    // sala
    marble: std({ map: t.marble, roughness: 0.14, metalness: 0.2, envMapIntensity: 1.4 }),
    palm: matte({ map: t.palmFrond, alphaTest: 0.4, side: THREE.DoubleSide }),
    monstera: matte({ map: t.monstera, alphaTest: 0.4, side: THREE.DoubleSide }),
    stem: matte({ color: '#274a22' }),
    soil: matte({ color: '#120c08' }),
    keyboard: matte({ map: t.keyboard }),
    beige: std({ color: '#b9b09a', roughness: 0.6, envMapIntensity: 0.3 }),
    beigeDark: std({ color: '#8f8774', roughness: 0.6, envMapIntensity: 0.3 }),
    fabricGold: matte({ map: t.fabricGold }),
    paper: matte({ color: '#d8d0c0' }),
    bottleGreen: std({
      color: '#0e3a24',
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82,
      envMapIntensity: 1.8,
    }),
    bottleAmber: std({
      color: '#6a3208',
      roughness: 0.08,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8,
      envMapIntensity: 1.8,
    }),
    bottleClear: std({
      color: '#a9bfd6',
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.42,
      envMapIntensity: 2,
    }),
    clearGlass: std({
      color: '#cfe0f0',
      roughness: 0.04,
      metalness: 0.1,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
      envMapIntensity: 2.2,
    }),
    whisky: std({
      color: '#a85a12',
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
      envMapIntensity: 1.2,
    }),
    ice: std({
      color: '#e8f4ff',
      roughness: 0.1,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 2,
    }),
    olive: matte({ color: '#5a6a1e' }),
    cigar: matte({ color: '#3a2414' }),
    labelCream: matte({ color: '#d9cfb8' }),
    labelBlack: matte({ color: '#0c0c0c' }),
    facade: matte({ map: t.facade }),
    cityA: new THREE.MeshBasicMaterial({ map: t.windowsA, vertexColors: true }),
    cityB: new THREE.MeshBasicMaterial({ map: t.windowsB, vertexColors: true }),
    cityC: new THREE.MeshBasicMaterial({ map: t.windowsC, vertexColors: true }),
    cityGround: new THREE.MeshBasicMaterial({ map: t.groundLights, vertexColors: true }),
    sky: new THREE.MeshBasicMaterial({ map: t.sky, side: THREE.BackSide, depthWrite: false }),
    neonSign: new THREE.MeshBasicMaterial({
      map: t.neonName,
      color: hdr('#ffffff', 2.6),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
    }),

    // tapetes, escritório e bar
    rugPit: matte({ map: t.rugPit }),
    rugDesk: matte({ map: t.rugDesk }),
    leatherGreen: std({ map: t.leatherGreen, roughness: 0.5, envMapIntensity: 0.4 }),
    marbleFloor: std({ map: t.marbleTiles, roughness: 0.2, metalness: 0.1, envMapIntensity: 1 }),
    paperSheet: matte({ map: t.paper }),
    aluminum: std({ color: '#b9bcc2', roughness: 0.32, metalness: 0.85, envMapIntensity: 1.1 }),
    mirror: std({ color: '#5d6a86', roughness: 0.06, metalness: 1, envMapIntensity: 1.5 }),
    bankerShade: new THREE.MeshStandardMaterial({
      color: '#0f4a2a',
      emissive: '#2a8a4a',
      emissiveIntensity: 0.6,
      roughness: 0.15,
      envMapIntensity: 1.2,
    }),
    chrome: std({ color: '#d7dbe2', roughness: 0.12, metalness: 1, envMapIntensity: 1.6 }),
    ceramic: std({ color: '#e8e2d6', roughness: 0.35, envMapIntensity: 0.6 }),
    ash: matte({ color: '#5a5650' }),
    cigarEmber: matte({ color: '#6b2a10' }),
    stain: new THREE.MeshBasicMaterial({
      color: '#000000',
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    }),

    // fontes de luz: cor acima de 1 para o bloom pegar só nelas
    amberStrip: light(hdr(palette.amber, 1.5)),
    amberBulb: light(hdr(palette.amber, 3)),
    amberDim: light(hdr(palette.amber, 0.25)),
    neonRed: light(hdr(palette.neonRed, 4)),
    neonBlue: light(hdr(palette.neonBlue, 4.5)),
    ledRed: light(hdr('#ff2a1a', 3)),
    white: light(hdr('#cfe0ff', 1.6)),

    // brilhos e sombras "assados"
    glowAmber: additive(t.glow, palette.amber, 0.55),
    glowAmberSoft: additive(t.glowSoft, palette.amber, 0.3),
    glowBlue: additive(t.glow, palette.neonBlue, 0.6),
    glowRed: additive(t.glow, palette.neonRed, 0.6),
    spriteAmber: sprite(palette.amber, 0.5),
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
  const loaded = Promise.allSettled(fonts.map((f) => document.fonts.load(f))).then(() => undefined);
  await Promise.race([loaded, timeout]);
}

export function buildLibrary(onProgress: (progress: number) => void): Promise<Library> {
  if (library) return Promise.resolve(library);
  if (building) return building;
  building = (async () => {
    await waitFonts();
    const keys = Object.keys(painters) as TexKey[];
    const total = keys.length + 1;
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
    library = built;
    return built;
  })();
  return building;
}
