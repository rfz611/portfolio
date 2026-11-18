import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { playIce } from '../audio/player';
import { ROOM, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { BarService } from '../objects/BarService';
import { Interactive } from '../objects/Interactive';
import { useScene } from '../store/useScene';
import { hdr, lib } from '../textures/library';
import { makeCanvas, tex } from '../textures/canvas';
import { LABELS, paintLabel } from '../textures/labels';
import { mulberry32 } from '../textures/random';
import { box, crease, cyl, flat, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';
import { sweep } from './sweep';

const HALF_PI = Math.PI / 2;
/** Centro do arco do balcão (na frente da cristaleira) e raio da linha do meio. */
const ARC = { x: SPOT.backBar[0], z: SPOT.backBar[2] + 0.25, r: 1.45 } as const;
/** Raio da área do bar (piso de mármore e rebaixo do teto). */
const ZONE_R = ARC.r + 0.62;
const SOFFIT_Y = 3.0;

/** Ponto no arco: a = 0 na ponta leste, a = π/2 na frente (sul), a = π na ponta oeste. */
const onArc = (a: number, r: number = ARC.r): [number, number] => [
  ARC.x + Math.cos(a) * r,
  ARC.z + Math.sin(a) * r,
];

function arcPath(r: number = ARC.r, steps = 40): [number, number][] {
  const out: [number, number][] = [];
  for (let k = 0; k <= steps; k++) out.push(onArc((k / steps) * Math.PI, r));
  return out;
}

/** Contorno da área do bar: da janela, em meia-lua, até a janela de novo (coordenadas da forma: x, -z). */
function zoneShape(r: number) {
  const s = new THREE.Shape();
  s.moveTo(ARC.x + r, -(ROOM.z0 + 0.04));
  s.lineTo(ARC.x + r, -ARC.z);
  s.absarc(ARC.x, -ARC.z, r, 0, -Math.PI, true);
  s.lineTo(ARC.x - r, -(ROOM.z0 + 0.04));
  s.closePath();
  return s;
}

/**
 * Garrafas com formatos de verdade (sem marca), todas de corpo redondo:
 * cada tipo tem silhueta, cor de vidro, tampa e rótulo próprios.
 * Vidros: 0 âmbar, 1 verde-escuro, 2 incolor, 3 vinho, 4 fosco, 5 azul, 6 vermelho, 7 cerâmica.
 */
type BottleKind =
  | 'whisky'
  | 'bourbon'
  | 'tequila'
  | 'wine'
  | 'cognac'
  | 'gin'
  | 'blueGin'
  | 'vodka'
  | 'rum'
  | 'champagne'
  | 'amaro'
  | 'vermouth'
  | 'aperitivo'
  | 'herbal'
  | 'jack'
  | 'johnnie'
  | 'sake'
  | 'cider';

const GLASS_OF: Record<BottleKind, number> = {
  whisky: 0,
  bourbon: 0,
  tequila: 2,
  wine: 3,
  cognac: 0,
  gin: 2,
  blueGin: 5,
  vodka: 4,
  rum: 0,
  champagne: 1,
  amaro: 1,
  vermouth: 1,
  aperitivo: 2,
  herbal: 1,
  jack: 2,
  johnnie: 0,
  sake: 7,
  cider: 1,
};

/** Marca (índice em LABELS) de cada formato de garrafa. */
const BRAND: Record<BottleKind, number> = {
  cognac: 0,
  jack: 1,
  aperitivo: 2,
  gin: 3,
  rum: 4,
  vermouth: 5,
  vodka: 6,
  bourbon: 7,
  johnnie: 8,
  whisky: 9,
  blueGin: 10,
  tequila: 11,
  champagne: 12,
  sake: 13,
  wine: 14,
  cider: 15,
  amaro: 16,
  herbal: 17,
};

/** Perfis (raio, altura) das garrafas: ombros, gargalos e alturas bem diferentes. */
const PROFILE: Record<Exclude<BottleKind, 'cognac' | 'jack' | 'johnnie'>, [number, number][]> = {
  // ombro largo e gargalo curto
  whisky: [
    [0.001, 0],
    [0.04, 0],
    [0.042, 0.17],
    [0.036, 0.2],
    [0.016, 0.22],
    [0.016, 0.28],
  ],
  // baixinha e larga, com lacre de cera
  bourbon: [
    [0.001, 0],
    [0.046, 0],
    [0.047, 0.13],
    [0.03, 0.16],
    [0.015, 0.175],
    [0.015, 0.22],
  ],
  // gorda e curta, rolha alta
  tequila: [
    [0.001, 0],
    [0.05, 0],
    [0.051, 0.11],
    [0.036, 0.14],
    [0.02, 0.15],
    [0.02, 0.17],
  ],
  wine: [
    [0.001, 0],
    [0.037, 0],
    [0.037, 0.2],
    [0.03, 0.235],
    [0.014, 0.255],
    [0.014, 0.33],
  ],
  gin: [
    [0.001, 0],
    [0.042, 0],
    [0.044, 0.18],
    [0.036, 0.215],
    [0.017, 0.24],
    [0.017, 0.29],
  ],
  blueGin: [
    [0.001, 0],
    [0.041, 0],
    [0.043, 0.2],
    [0.03, 0.235],
    [0.017, 0.25],
    [0.017, 0.3],
  ],
  vodka: [
    [0.001, 0],
    [0.034, 0],
    [0.036, 0.25],
    [0.024, 0.285],
    [0.013, 0.3],
    [0.013, 0.34],
  ],
  rum: [
    [0.001, 0],
    [0.045, 0],
    [0.048, 0.12],
    [0.032, 0.16],
    [0.016, 0.18],
    [0.016, 0.22],
  ],
  champagne: [
    [0.001, 0.02],
    [0.044, 0],
    [0.044, 0.17],
    [0.032, 0.23],
    [0.016, 0.27],
    [0.016, 0.31],
  ],
  amaro: [
    [0.001, 0],
    [0.032, 0],
    [0.032, 0.21],
    [0.02, 0.25],
    [0.012, 0.27],
    [0.012, 0.32],
  ],
  // fina e alta, gargalo comprido
  vermouth: [
    [0.001, 0],
    [0.033, 0],
    [0.034, 0.19],
    [0.02, 0.24],
    [0.012, 0.27],
    [0.012, 0.35],
  ],
  // fina, de vidro vermelho, gargalo curto
  aperitivo: [
    [0.001, 0],
    [0.034, 0],
    [0.035, 0.2],
    [0.022, 0.23],
    [0.015, 0.25],
    [0.015, 0.29],
  ],
  // garrafinha de cerâmica branca de saquê (tokkuri)
  sake: [
    [0.001, 0],
    [0.038, 0],
    [0.05, 0.06],
    [0.046, 0.12],
    [0.022, 0.17],
    [0.014, 0.2],
    [0.019, 0.215],
  ],
  // sidra: verde, mais baixa, ombro arredondado
  cider: [
    [0.001, 0],
    [0.038, 0],
    [0.039, 0.15],
    [0.028, 0.2],
    [0.014, 0.23],
    [0.014, 0.27],
  ],
  // verde com ombro marcado
  herbal: [
    [0.001, 0],
    [0.042, 0],
    [0.045, 0.15],
    [0.03, 0.17],
    [0.016, 0.19],
    [0.016, 0.24],
  ],
};

interface BottleSet {
  /** Bebida dentro das garrafas transparentes: 0 whisky escuro, 1 Campari vermelho. */
  liquids: THREE.BufferGeometry[][];
  glass: THREE.BufferGeometry[][];
  labels: THREE.BufferGeometry[][];
  caps: THREE.BufferGeometry[];
  wax: THREE.BufferGeometry[];
  corks: THREE.BufferGeometry[];
}

const emptySet = (): BottleSet => ({
  liquids: [[], []],
  glass: [[], [], [], [], [], [], [], []],
  labels: LABELS.map(() => []),
  caps: [],
  wax: [],
  corks: [],
});

/** Monta uma garrafa no lugar (x, y, z) e reparte as peças por material. */
function addBottle(set: BottleSet, kind: BottleKind, x: number, y: number, z: number) {
  const g = GLASS_OF[kind];
  if (kind === 'jack' || kind === 'johnnie') {
    const jack = kind === 'jack';
    const bw = jack ? 0.072 : 0.078;
    const bh = jack ? 0.19 : 0.2;
    const body = new RoundedBoxGeometry(bw, bh, bw, 2, 0.01).toNonIndexed();
    body.clearGroups();
    set.glass[g].push(body.translate(x, y + bh / 2, z));
    if (jack) {
      const inner = new RoundedBoxGeometry(
        bw * 0.86,
        bh * 0.78,
        bw * 0.86,
        2,
        0.006,
      ).toNonIndexed();
      inner.clearGroups();
      set.liquids[0].push(inner.translate(x, y + 0.006 + (bh * 0.78) / 2, z));
    }
    set.glass[g].push(
      lathe(
        [
          [0.024, 0],
          [0.017, 0.02],
          [0.015, jack ? 0.065 : 0.05],
        ],
        { seg: 12 },
        [x, y + bh, z],
      ),
    );
    const label = new THREE.PlaneGeometry(bw * 0.86, bh * (jack ? 0.42 : 0.3));
    set.labels[BRAND[kind]].push(label.translate(x, y + bh * 0.47, z + bw / 2 + 0.0012));
    set.caps.push(
      cyl(0.017, 0.017, 0.028, [x, y + bh + (jack ? 0.065 : 0.05) + 0.012, z], { seg: 10 }),
    );
    return;
  }
  if (kind === 'cognac') {
    // corpo de cantil: redondo e achatado na frente
    const body = lathe(
      [
        [0.001, 0],
        [0.03, 0],
        [0.06, 0.04],
        [0.065, 0.09],
        [0.05, 0.15],
        [0.018, 0.18],
        [0.016, 0.23],
      ],
      { seg: 16 },
    ).scale(1, 1, 0.55);
    set.glass[g].push(body.translate(x, y, z));
    set.labels[BRAND[kind]].push(
      new THREE.PlaneGeometry(0.06, 0.035).translate(x, y + 0.07, z + 0.0365 + 0.0012),
    );
    set.caps.push(cyl(0.02, 0.02, 0.03, [x, y + 0.245, z], { seg: 10 }));
    return;
  }
  const profile = PROFILE[kind];
  const top = profile[profile.length - 1][1];
  const radius = Math.max(profile[1][0], profile[2][0]);
  set.glass[g].push(lathe(profile, { seg: 14 }, [x, y, z]));
  if (kind === 'aperitivo') {
    const bodyR = profile[2][0] * 0.86;
    const fill = profile[2][1] * 0.85;
    set.liquids[1].push(cyl(bodyR, bodyR, fill, [x, y + 0.006 + fill / 2, z], { seg: 14 }));
  }
  set.labels[BRAND[kind]].push(
    new THREE.CylinderGeometry(
      radius + 0.0015,
      radius + 0.0015,
      top * 0.24,
      14,
      1,
      true,
      -1.2,
      2.4,
    ).translate(x, y + top * 0.33, z),
  );
  if (kind === 'bourbon') {
    // lacre de cera vermelha escorrendo
    set.wax.push(cyl(0.019, 0.019, 0.04, [x, y + top - 0.01, z], { seg: 10 }));
    set.wax.push(cyl(0.024, 0.02, 0.015, [x, y + top - 0.035, z], { seg: 10 }));
  } else if (kind === 'tequila') {
    set.corks.push(new THREE.SphereGeometry(0.03, 10, 8).translate(x, y + top + 0.02, z));
  } else if (kind === 'champagne') {
    set.caps.push(cyl(0.018, 0.016, 0.07, [x, y + top - 0.02, z], { seg: 10 }));
  } else {
    set.caps.push(cyl(0.015, 0.015, 0.024, [x, y + top + 0.011, z], { seg: 8 }));
  }
}

/** Grupinho de garrafas num nicho, lado a lado, uma mais à frente e outra mais atrás. */
function bottleGroup(set: BottleSet, kinds: BottleKind[], cx: number, y: number, seed: number) {
  const r = mulberry32(seed);
  const span = 0.11 * (kinds.length - 1);
  kinds.forEach((kind, i) => {
    const x = cx - span / 2 + i * 0.11 + (r() - 0.5) * 0.01;
    const z = (i % 2 ? -0.05 : 0.03) + (r() - 0.5) * 0.015;
    addBottle(set, kind, x, y, z);
  });
}

/** Mini luminária de mesa toda cromada (cogumelo), acesa por baixo. */
function MiniLamp() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      chrome: merge([
        cyl(0.055, 0.06, 0.012, [0, 0.006, 0], { seg: 20 }),
        cyl(0.007, 0.007, 0.2, [0, 0.11, 0], { seg: 8 }),
        lathe(
          [
            [0.09, 0.2],
            [0.085, 0.225],
            [0.06, 0.255],
            [0.001, 0.27],
          ],
          { seg: 24 },
        ),
      ]),
      glow: new THREE.CircleGeometry(0.084, 24).rotateX(HALF_PI).translate(0, 0.2, 0),
    }),
    [],
  );
  const glow = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr('#ffd9a8', 1.15), toneMapped: false }),
    [],
  );
  return (
    <group name="mini-lamp">
      <mesh geometry={geo.chrome} material={mat.chrome} />
      <mesh geometry={geo.glow} material={glow} />
    </group>
  );
}

/** Copos emborcados secando sobre um pano, prontos para servir. */
function GlassRow() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const glasses: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 4; i++) {
      glasses.push(
        lathe(
          [
            [0.043, 0.002],
            [0.04, 0.09],
            [0.001, 0.09],
          ],
          { seg: 14 },
          [-0.12 + i * 0.085, 0.004, (i % 2) * 0.03],
        ),
      );
    }
    return {
      glasses: merge(glasses),
      towel: new THREE.PlaneGeometry(0.4, 0.14).rotateX(-HALF_PI).translate(0, 0.003, 0.015),
    };
  }, []);
  const towel = useMemo(() => new THREE.MeshLambertMaterial({ color: '#e9e2d2' }), []);
  const glass = useMemo(() => {
    const m = mat.clearGlass.clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [mat]);
  return (
    <group name="glass-row">
      <mesh geometry={geo.towel} material={towel} />
      <mesh geometry={geo.glasses} material={glass} renderOrder={6} />
    </group>
  );
}

/** Folha comprida e pontuda, um pouco curvada para fora. */
function blade(height: number, width: number, lean: number, yaw: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.quadraticCurveTo(-width * 0.6, height * 0.6, 0, height);
  shape.quadraticCurveTo(width * 0.6, height * 0.6, width / 2, 0);
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape, 6);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / height;
    p.setZ(i, lean * t * t);
  }
  g.computeVertexNormals();
  return g.rotateY(yaw);
}

/** Folha verde-escura com as faixas claras da espada-de-são-jorge. */
function paintBlade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1f3a1c';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 6) {
    ctx.fillStyle = y % 12 ? 'rgba(150,180,110,0.25)' : 'rgba(10,25,10,0.35)';
    ctx.fillRect(0, y, w, 3);
  }
  ctx.fillStyle = 'rgba(200,190,90,0.6)';
  ctx.fillRect(0, 0, w * 0.08, h);
  ctx.fillRect(w * 0.92, 0, w * 0.08, h);
}

/** Vaso de cerâmica preta brilhante com uma espada-de-são-jorge. */
function SmallPlant() {
  const geo = useMemo(() => {
    const blades: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 9; k++) {
      const yaw = (k / 9) * Math.PI * 2 + (k % 2) * 0.3;
      blades.push(
        blade(0.2 + (k % 3) * 0.05, 0.04, 0.025 + (k % 2) * 0.02, yaw).translate(0, 0.1, 0),
      );
    }
    return {
      pot: lathe(
        [
          [0.001, 0],
          [0.045, 0],
          [0.06, 0.05],
          [0.058, 0.1],
          [0.05, 0.102],
          [0.05, 0.09],
        ],
        { seg: 20 },
      ),
      soil: new THREE.CircleGeometry(0.05, 16).rotateX(-HALF_PI).translate(0, 0.092, 0),
      blades: merge(blades),
    };
  }, []);
  const mats = useMemo(
    () => ({
      pot: new THREE.MeshStandardMaterial({
        color: '#141416',
        roughness: 0.18,
        envMapIntensity: 1.3,
      }),
      soil: new THREE.MeshStandardMaterial({ color: '#2a1c12', roughness: 1 }),
      leaf: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(32, 128, paintBlade)),
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
    }),
    [],
  );
  return (
    <group name="small-plant">
      <mesh geometry={geo.pot} material={mats.pot} />
      <mesh geometry={geo.soil} material={mats.soil} />
      <mesh geometry={geo.blades} material={mats.leaf} />
    </group>
  );
}

/** Luminária-cogumelo vermelha pequena de enfeite (sem luz própria; o nicho já é iluminado). */
function DecoMushroom() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      base: cyl(0.045, 0.05, 0.012, [0, 0.006, 0], { seg: 18 }),
      stem: cyl(0.009, 0.011, 0.11, [0, 0.066, 0], { seg: 10 }),
      shade: new THREE.SphereGeometry(0.075, 22, 10, 0, Math.PI * 2, 0, HALF_PI)
        .scale(1, 0.6, 1)
        .translate(0, 0.12, 0),
      under: new THREE.CircleGeometry(0.07, 18).rotateX(HALF_PI).translate(0, 0.119, 0),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      shade: new THREE.MeshStandardMaterial({
        color: '#c4271b',
        emissive: '#ff4a1c',
        emissiveIntensity: 0.5,
        roughness: 0.2,
      }),
      under: new THREE.MeshBasicMaterial({ color: hdr('#ffb27a', 0.9), toneMapped: false }),
    }),
    [],
  );
  return (
    <group name="deco-mushroom">
      <mesh geometry={geo.base} material={mat.chrome} />
      <mesh geometry={geo.stem} material={mat.chrome} />
      <mesh geometry={geo.shade} material={mats.shade} />
      <mesh geometry={geo.under} material={mats.under} />
    </group>
  );
}

/**
 * Enfeites dos nichos que não são garrafas: livros empilhados, discos
 * encostados no fundo, uma escultura cromada, vasos de cerâmica e dois
 * copos baixos ao lado do decanter.
 */
function NicheDecor({ cells }: { cells: { x: number; y: number }[] }) {
  const { mat } = lib();
  const [books, records, sculpture, vases, glasses] = cells;
  const geo = useMemo(
    () => ({
      books: [
        box([0.2, 0.035, 0.14], [0, 0.0175, 0]),
        box([0.18, 0.03, 0.13], [0.01, 0.05, 0.005], { rot: [0, 0.12, 0] }),
        box([0.16, 0.028, 0.12], [-0.005, 0.079, 0], { rot: [0, -0.08, 0] }),
      ],
      sleeves: [0, 1, 2].map((k) =>
        box([0.31, 0.31, 0.004], [k * 0.02, 0.155, -0.15 + k * 0.012], { rot: [-0.12, 0, 0] }),
      ),
      sphere: new THREE.SphereGeometry(0.05, 20, 14).translate(0, 0.11, 0),
      plinth: box([0.07, 0.06, 0.07], [0, 0.03, 0]),
      vaseTall: lathe(
        [
          [0.001, 0],
          [0.035, 0],
          [0.05, 0.08],
          [0.03, 0.2],
          [0.022, 0.24],
          [0.026, 0.25],
        ],
        { seg: 18 },
      ),
      vaseRound: lathe(
        [
          [0.001, 0],
          [0.04, 0],
          [0.065, 0.06],
          [0.05, 0.12],
          [0.03, 0.135],
          [0.032, 0.14],
        ],
        { seg: 18 },
      ),
      rocks: lathe(
        [
          [0.001, 0],
          [0.038, 0],
          [0.041, 0.085],
          [0.036, 0.085],
          [0.034, 0.018],
          [0.001, 0.018],
        ],
        { seg: 12 },
      ),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      books: ['#5a1414', '#1e2a3a', '#c9b98e'].map(
        (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
      ),
      sleeves: ['#141414', '#d8cfbd', '#7a1a14'].map(
        (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.5 }),
      ),
      cream: new THREE.MeshStandardMaterial({ color: '#e7dfcf', roughness: 0.35 }),
      black: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.25 }),
      glass: (() => {
        const m = mat.clearGlass.clone();
        m.opacity = 0.4;
        return m;
      })(),
    }),
    [mat],
  );
  return (
    <>
      <group position={[books.x - 0.08, books.y, 0.02]}>
        {geo.books.map((g, i) => (
          <mesh key={i} geometry={g} material={mats.books[i]} />
        ))}
        <group position={[0.15, 0.093, 0]}>
          <DecoMushroom />
        </group>
      </group>
      <group position={[records.x - 0.08, records.y, 0.02]}>
        {geo.sleeves.map((g, i) => (
          <mesh key={i} geometry={g} material={mats.sleeves[i]} />
        ))}
      </group>
      <group position={[sculpture.x + 0.17, sculpture.y, 0.06]}>
        <mesh geometry={geo.plinth} material={mats.black} />
        <mesh geometry={geo.sphere} material={mat.chrome} />
      </group>
      <group position={[vases.x - 0.09, vases.y, 0]}>
        <mesh geometry={geo.vaseTall} material={mats.cream} />
        <mesh geometry={geo.vaseRound} material={mats.black} position={[0.15, 0, 0.03]} />
      </group>
      <group position={[glasses.x + 0.12, glasses.y, 0.05]}>
        <mesh geometry={geo.rocks} material={mats.glass} renderOrder={6} />
        <mesh
          geometry={geo.rocks}
          material={mats.glass}
          position={[0.09, 0, -0.03]}
          renderOrder={6}
        />
      </group>
    </>
  );
}

/**
 * Estante do bar encostada no vidro, como na foto de referência: armário
 * de mogno embaixo e, em cima, nichos de madeira com luz quente por trás
 * de cada prateleira. Cada nicho tem uma composição: grupinhos de garrafas
 * de formatos diferentes, a mini luminária cromada com copos, o decanter,
 * a plantinha, livros com a luminária-cogumelo, discos encostados com uma
 * escultura cromada e vasos de cerâmica.
 */
function BackBar() {
  const { mat } = lib();
  const w = 2.6;
  const inner = w - 0.28;
  const rows = [0.99, 1.635, 2.28];
  const top = 2.93;
  const cols = [-0.87, -0.29, 0.29, 0.87];
  const base = (r: number) => (r === 0 ? rows[0] : rows[r] + 0.015);
  const cell = (c: number, r: number) => ({ x: cols[c], y: base(r) });
  const geo = useMemo(() => {
    const set = emptySet();
    bottleGroup(set, ['vermouth', 'blueGin', 'aperitivo', 'herbal'], cols[0], base(0), 11);
    bottleGroup(set, ['jack', 'cognac', 'johnnie'], cols[0], base(1), 17);
    bottleGroup(set, ['wine', 'champagne', 'sake', 'cider'], cols[2], base(1), 23);
    bottleGroup(set, ['rum', 'bourbon', 'tequila'], cols[0], base(2), 29);
    bottleGroup(set, ['gin', 'vodka', 'amaro', 'whisky'], cols[3], base(2), 31);
    const mergeOr = (list: THREE.BufferGeometry[]) =>
      list.length
        ? merge(
            list.map((g) => {
              const flatGeo = g.index ? g.toNonIndexed() : g;
              flatGeo.clearGroups();
              return flatGeo;
            }),
          )
        : null;
    const tall = SOFFIT_Y - 0.95;
    const doors = [-0.95, -0.32, 0.32, 0.95];
    const shelves = [...rows.slice(1), top].map((y) => box([inner, 0.03, 0.42], [0, y, -0.01]));
    const dividers = [-0.58, 0, 0.58].map((x) =>
      box([0.03, top - rows[0], 0.42], [x, rows[0] + (top - rows[0]) / 2, -0.01], { swap: true }),
    );
    // fita de luz quente embaixo de cada prateleira (ilumina o nicho de baixo)
    const leds = [...rows.slice(1), top].flatMap((y) =>
      cols.map((x) => box([0.5, 0.008, 0.012], [x, y - 0.02, 0.16])),
    );
    return {
      cabinet: merge([
        box([w, 0.95, 0.5], [0, 0.475, 0]),
        box([0.14, tall, 0.5], [-w / 2 + 0.07, 0.95 + tall / 2, 0], { swap: true }),
        box([0.14, tall, 0.5], [w / 2 - 0.07, 0.95 + tall / 2, 0], { swap: true }),
      ]),
      frame: merge([...shelves, ...dividers]),
      back: new THREE.PlaneGeometry(inner, top - rows[0]).translate(
        0,
        rows[0] + (top - rows[0]) / 2,
        -0.215,
      ),
      leds: merge(leds),
      doors: merge(doors.map((x) => box([0.56, 0.72, 0.02], [x, 0.47, 0.255], { swap: true }))),
      pulls: merge(
        [-0.68, -0.6, 0.6, 0.68].map((x) => cyl(0.006, 0.006, 0.14, [x, 0.52, 0.275], { seg: 6 })),
      ),
      counterTop: box([w + 0.06, 0.04, 0.54], [0, 0.97, 0.01]),
      glass: [0, 1, 2, 3, 4, 5, 6, 7].map((k) => mergeOr(set.glass[k])),
      liquids: [0, 1].map((k) => mergeOr(set.liquids[k])),
      labels: LABELS.map((_, k) => mergeOr(set.labels[k])),
      caps: mergeOr(set.caps)!,
      wax: mergeOr(set.wax),
      corks: mergeOr(set.corks),
      decanter: lathe(
        [
          [0.001, 0],
          [0.07, 0],
          [0.075, 0.08],
          [0.05, 0.16],
          [0.022, 0.19],
          [0.022, 0.21],
        ],
        { seg: 16 },
        [cols[2] - 0.1, rows[0], 0.0],
      ),
      // tampa do decanter encaixada no gargalo
      stopper: new THREE.SphereGeometry(0.03, 10, 8).translate(cols[2] - 0.1, rows[0] + 0.232, 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ledMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr('#ffc27a', 1.5), toneMapped: false }),
    [],
  );
  const wax = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#9a0f16', roughness: 0.35 }),
    [],
  );
  const glassMats = useMemo(() => {
    const tinted = (color: string, opacity: number, roughness = 0.08) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness,
        transparent: true,
        opacity,
        envMapIntensity: 1.8,
      });
    return [
      mat.bottleAmber,
      mat.bottleGreen,
      mat.bottleClear,
      tinted('#3a0d10', 0.85),
      tinted('#e6eaee', 0.7, 0.45),
      tinted('#2a5fb8', 0.75),
      tinted('#b3121e', 0.88),
      // cerâmica branca do saquê
      new THREE.MeshStandardMaterial({ color: '#f1ede4', roughness: 0.25, envMapIntensity: 1.2 }),
    ];
  }, [mat]);
  const liquidMats = useMemo(
    () =>
      ['#5a2a0c', '#b3101a'].map(
        (color) =>
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.15,
            transparent: true,
            opacity: 0.9,
            envMapIntensity: 1,
          }),
      ),
    [],
  );
  const labelMats = useMemo(
    () =>
      LABELS.map(
        (style) =>
          new THREE.MeshStandardMaterial({
            map: tex(
              makeCanvas(256, 64, (c, cw, ch) => paintLabel(c, cw, ch, style)),
              { clamp: true },
            ),
            roughness: 0.6,
            envMapIntensity: 0.3,
          }),
      ),
    [],
  );
  return (
    <group name="bar_bottles">
      <mesh geometry={geo.cabinet} material={mat.mahogany} />
      <mesh geometry={geo.frame} material={mat.mahogany} />
      <mesh geometry={geo.back} material={mat.walnut} />
      <mesh geometry={geo.leds} material={ledMat} />
      <mesh geometry={geo.doors} material={mat.mahoganyDark} />
      <mesh geometry={geo.pulls} material={mat.brass} />
      <mesh geometry={geo.counterTop} material={mat.marble} />
      <mesh geometry={geo.caps} material={mat.brass} />
      {geo.wax && <mesh geometry={geo.wax} material={wax} />}
      {geo.corks && <mesh geometry={geo.corks} material={mat.walnut} />}
      {geo.labels.map((g, k) => (g ? <mesh key={k} geometry={g} material={labelMats[k]} /> : null))}
      {geo.liquids.map((g, k) =>
        g ? <mesh key={`l${k}`} geometry={g} material={liquidMats[k]} renderOrder={5} /> : null,
      )}
      {geo.glass.map((g, k) =>
        g ? <mesh key={k} geometry={g} material={glassMats[k]} renderOrder={6} /> : null,
      )}
      <mesh geometry={geo.decanter} material={mat.bottleAmber} renderOrder={6} />
      <mesh geometry={geo.stopper} material={mat.clearGlass} />
      {/* nicho de baixo, 2ª coluna: mini luminária cromada e copos secando */}
      <group position={[cols[1] - 0.15, rows[0], 0.02]}>
        <MiniLamp />
      </group>
      <group position={[cols[1] + 0.1, rows[0], 0.02]} scale={0.55}>
        <GlassRow />
      </group>
      <group position={[cols[3], rows[0], 0]}>
        <SmallPlant />
      </group>
      <NicheDecor cells={[cell(3, 1), cell(1, 1), cell(1, 1), cell(1, 2), cell(2, 0)]} />
      {/* luz quente dos nichos, fraca, para as garrafas e enfeites aparecerem */}
      <pointLight position={[0, 2.0, 0.6]} color="#ffbf80" intensity={3} distance={2.6} decay={2} />
    </group>
  );
}

/**
 * Balcão em arco: sai de uma ponta da cristaleira, faz a curva para a
 * sala e volta na outra ponta. Frente de mogno com frisos de latão,
 * tampo de mármore, apoio de pés e neon azul por baixo da borda.
 * O perfil (d, h) é puxado ao longo do arco: d < 0 é o lado do cliente.
 */
/** back = só o painel de trás (fica fora do contorno amarelo do mouse). */
function Counter({ back = false }: { back?: boolean }) {
  const { mat } = lib();
  const geo = useMemo(() => {
    const path = arcPath();
    // o apoio de pés acompanha só a frente do balcão, sem passar das pontas
    const railPts: THREE.Vector3[] = [];
    for (let k = 0; k <= 30; k++) {
      const [x, z] = onArc(0.22 + (k / 30) * (Math.PI - 0.44), ARC.r + 0.42);
      railPts.push(new THREE.Vector3(x, 0.2, z));
    }
    const rail = new THREE.CatmullRomCurve3(railPts);
    // tampas das duas pontas (antes ficavam ocas)
    const caps = [0, Math.PI].map((a) => {
      const [x, z] = onArc(a, ARC.r - 0.03);
      return box([0.72, 1.07, 0.04], [x, 0.535, z], { rot: [0, -a, 0] });
    });
    const posts = [0.35, 0.8, 1.25, 1.7, 2.15, 2.6].map((a) => {
      const [x, z] = onArc(a, ARC.r + 0.36);
      return cyl(0.01, 0.01, 0.13, [x, 0.2, z], { seg: 6, rot: [0, -a, HALF_PI] });
    });
    return {
      front: sweep(
        path,
        [
          [-0.3, 0.1],
          [-0.3, 1.0],
        ],
        { uScale: 0.9 },
      ),
      bands: merge([
        sweep(path, [
          [-0.312, 0.86],
          [-0.312, 0.89],
        ]),
        sweep(path, [
          [-0.312, 0.2],
          [-0.312, 0.23],
        ]),
      ]),
      kick: sweep(path, [
        [-0.26, 0],
        [-0.26, 0.1],
      ]),
      top: sweep(
        path,
        [
          [-0.39, 1.02],
          [-0.39, 1.07],
          [0.33, 1.07],
          [0.33, 1.02],
        ],
        { uScale: 1 },
      ),
      back: sweep(path, [
        [0.29, 1.02],
        [0.29, 0],
      ]),
      neon: merge([
        sweep(path, [
          [-0.37, 1.012],
          [-0.33, 1.0],
        ]),
        sweep(path, [
          [-0.29, 0.115],
          [-0.26, 0.112],
        ]),
      ]),
      rail: merge([new THREE.TubeGeometry(rail, 60, 0.02, 8, false), ...posts]),
      caps: merge(caps),
    };
  }, []);
  const two = useMemo(() => {
    const ds = <T extends THREE.Material>(m: T) => {
      const c = m.clone() as T;
      c.side = THREE.DoubleSide;
      return c;
    };
    return {
      mahogany: ds(mat.mahogany),
      brass: ds(mat.brass),
      kick: ds(mat.blackPlastic),
      marble: ds(mat.marble),
      back: ds(mat.mahoganyDark),
      neon: ds(mat.neonBlue),
    };
  }, [mat]);
  const hovered = useScene((s) => s.hovered?.id === 'bar');
  useEffect(() => {
    two.neon.color.copy(hdr(palette.neonBlue, hovered ? 8 : 4.5));
  }, [hovered, two]);
  if (back) return <mesh geometry={geo.back} material={two.back} name="bar-back" />;
  return (
    <group name="bar">
      <mesh geometry={geo.front} material={two.mahogany} />
      <mesh geometry={geo.bands} material={two.brass} />
      <mesh geometry={geo.kick} material={two.kick} />
      <mesh geometry={geo.top} material={two.marble} />
      <mesh geometry={geo.neon} material={two.neon} name="neon" />
      <mesh geometry={geo.rail} material={mat.brass} />
      <mesh geometry={geo.caps} material={mat.mahogany} />
    </group>
  );
}

/** Banqueta: pé de latão, aro para os pés e assento de couro vinho. */
function Stool() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const ring = new THREE.TorusGeometry(0.17, 0.011, 6, 20).rotateX(HALF_PI).translate(0, 0.3, 0);
    return {
      metal: merge([
        cyl(0.2, 0.22, 0.03, [0, 0.015, 0], { seg: 20 }),
        cyl(0.025, 0.025, 0.72, [0, 0.38, 0], { seg: 10 }),
        ring,
      ]),
      seat: crease(
        lathe(
          [
            [0.001, 0.74],
            [0.2, 0.74],
            [0.215, 0.78],
            [0.205, 0.82],
            [0.001, 0.835],
          ],
          { seg: 20, uRepeat: 2 },
        ),
        40,
      ),
    };
  }, []);
  return (
    <group name="stool">
      <mesh geometry={geo.metal} material={mat.brass} />
      <mesh geometry={geo.seat} material={mat.leatherWineSeat} />
      <mesh position={[0, 0.004, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[0.6, 0.6]} />
      </mesh>
    </group>
  );
}

/** Taça de martini com azeitona. */
function Martini() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      glass: lathe(
        [
          [0.036, 0],
          [0.034, 0.004],
          [0.004, 0.008],
          [0.0035, 0.095],
          [0.062, 0.155],
        ],
        { seg: 16 },
      ),
      drink: lathe(
        [
          [0.002, 0.098],
          [0.05, 0.146],
          [0.001, 0.146],
        ],
        { seg: 16 },
      ),
      olive: new THREE.SphereGeometry(0.011, 8, 6).translate(0.012, 0.138, 0),
      pick: cyl(0.001, 0.001, 0.11, [0.02, 0.15, 0], { seg: 4, rot: [0, 0, -0.9] }),
    }),
    [],
  );
  const glass = useMemo(() => {
    const m = mat.clearGlass.clone();
    m.opacity = 0.34;
    return m;
  }, [mat]);
  return (
    <group name="martini">
      <mesh geometry={geo.drink} material={mat.bottleClear} />
      <mesh geometry={geo.olive} material={mat.olive} />
      <mesh geometry={geo.pick} material={mat.steel} />
      <mesh geometry={geo.glass} material={glass} renderOrder={6} />
    </group>
  );
}

/**
 * Outros drinks e enfeites do balcão: balde de latão com champanhe,
 * coqueteleira, taça baixa com um drink vermelho e uma tigela de limões.
 */
function BarTop() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      bucket: lathe(
        [
          [0.001, 0],
          [0.08, 0],
          [0.1, 0.2],
          [0.108, 0.21],
          [0.1, 0.21],
          [0.09, 0.02],
        ],
        { seg: 18 },
      ),
      champagne: lathe(
        [
          [0.001, 0.05],
          [0.042, 0.05],
          [0.042, 0.24],
          [0.016, 0.31],
          [0.014, 0.37],
        ],
        { seg: 12 },
      ),
      foil: cyl(0.016, 0.016, 0.06, [0, 0.35, 0], { seg: 10 }),
      shaker: crease(
        lathe(
          [
            [0.001, 0],
            [0.042, 0],
            [0.046, 0.16],
            [0.03, 0.2],
            [0.02, 0.23],
            [0.001, 0.24],
          ],
          { seg: 16 },
        ),
        40,
      ),
      coupe: lathe(
        [
          [0.034, 0],
          [0.004, 0.006],
          [0.004, 0.09],
          [0.05, 0.11],
          [0.058, 0.135],
        ],
        { seg: 16 },
      ),
      cocktail: lathe(
        [
          [0.002, 0.096],
          [0.05, 0.113],
          [0.054, 0.126],
          [0.001, 0.126],
        ],
        { seg: 16 },
      ),
      bowl: lathe(
        [
          [0.001, 0],
          [0.05, 0],
          [0.1, 0.06],
          [0.105, 0.065],
        ],
        { seg: 18 },
      ),
      lemons: merge(
        [
          [0.03, 0.05, 0.0],
          [-0.035, 0.05, 0.02],
          [0.0, 0.055, -0.04],
        ].map(([x, y, z]) =>
          new THREE.SphereGeometry(0.032, 10, 8).scale(1, 0.85, 1.2).translate(x, y, z),
        ),
      ),
    }),
    [],
  );
  const lemon = useMemo(() => new THREE.MeshLambertMaterial({ color: '#c9a52a' }), []);
  const red = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8a0d18',
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
      }),
    [],
  );
  const glass = useMemo(() => {
    const m = mat.clearGlass.clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [mat]);
  const at = (a: number, d = 0): [number, number, number] => {
    const [x, z] = onArc(a, ARC.r + d);
    return [x, 1.07, z];
  };
  return (
    <group name="bar-top">
      <group position={at(0.42, -0.08)}>
        <mesh geometry={geo.bucket} material={mat.brass} />
        <mesh geometry={geo.champagne} material={mat.bottleGreen} rotation={[0.22, 0, 0.1]} />
        <mesh geometry={geo.foil} material={mat.brass} rotation={[0.22, 0, 0.1]} />
      </group>
      <mesh geometry={geo.shaker} material={mat.chrome} position={at(2.7, -0.05)} />
      <group position={at(2.35, -0.12)}>
        <mesh geometry={geo.cocktail} material={red} />
        <mesh geometry={geo.coupe} material={glass} renderOrder={6} />
      </group>
      <group position={at(1.2, 0.08)}>
        <mesh geometry={geo.bowl} material={mat.brass} />
        <mesh geometry={geo.lemons} material={lemon} />
      </group>
    </group>
  );
}

/** Piso de mármore em meia-lua e rebaixo de teto acompanhando a curva do balcão. */
function BarZone() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const outline = zoneShape(ZONE_R);
    const soffit = new THREE.ExtrudeGeometry(zoneShape(ZONE_R - 0.1), {
      depth: ROOM.h - SOFFIT_Y,
      bevelEnabled: false,
      curveSegments: 24,
    });
    soffit.rotateX(-HALF_PI);
    soffit.translate(0, SOFFIT_Y, 0);
    const spots = [0.5, 1.15, 1.99, 2.64].map((a) => {
      const [x, z] = onArc(a, ARC.r - 0.1);
      return new THREE.CircleGeometry(0.05, 12).rotateX(HALF_PI).translate(x, SOFFIT_Y - 0.002, z);
    });
    return {
      floor: flat(outline, 0.004, 1),
      edge: sweep(arcPath(ZONE_R, 48), [
        [-0.015, 0.009],
        [0.015, 0.009],
      ]),
      soffit,
      cove: sweep(arcPath(ZONE_R - 0.09, 48), [
        [-0.012, SOFFIT_Y - 0.004],
        [0.004, SOFFIT_Y - 0.004],
      ]),
      spots: merge(spots),
    };
  }, []);
  return (
    <>
      <mesh geometry={geo.floor} material={mat.marbleFloor} />
      <mesh geometry={geo.edge} material={mat.brass} />
      <mesh geometry={geo.soffit} material={mat.mahoganyDark} />
      <mesh geometry={geo.cove} material={mat.neonBlue} />
    </>
  );
}

/**
 * Bar azul: piso de mármore em meia-lua, rebaixo de teto com neon azul,
 * cristaleira contra o vidro e o balcão em arco ligando as duas pontas.
 * Passar o mouse faz o gelo tilintar; clicar leva a câmera até o balcão.
 */
export function Bar() {
  const home = useScene((s) => s.view === 'home');
  const setView = useScene((s) => s.setView);
  const [bx, , bz] = SPOT.bar;
  const [kx, , kz] = SPOT.backBar;
  const stools = [0.62, 1.12, 1.57, 2.02, 2.52];
  const [martiniX, martiniZ] = onArc(1.95, ARC.r - 0.05);
  return (
    <group name="bar-area">
      <BarZone />
      <group position={[kx, 0, kz]}>
        <BackBar />
      </group>
      <group
        onPointerOver={(event) => {
          event.stopPropagation();
          playIce();
        }}
      >
        <Interactive
          id="bar"
          label="objects.bar"
          enabled={home}
          outline={false}
          onClick={() => setView('bar')}
        >
          <OptionalModel file="bar.glb">
            <Counter />
          </OptionalModel>
          <group position={[martiniX, 1.07, martiniZ]}>
            <Martini />
          </group>
          <BarTop />
        </Interactive>
      </group>
      <Counter back />
      <group position={[bx, 0, bz]}>
        <BarService />
      </group>
      {stools.map((a) => {
        const [x, z] = onArc(a, ARC.r + 0.72);
        return (
          <group key={a} position={[x, 0, z]} rotation={[0, a * 1.7, 0]}>
            <Stool />
          </group>
        );
      })}
      {/* neon azul do bar e luz quente das embutidas sobre o balcão */}
      <pointLight
        position={[ARC.x, 2.6, ARC.z + ARC.r]}
        color={palette.neonBlue}
        intensity={12}
        distance={5}
        decay={1.8}
      />
      <pointLight
        position={[ARC.x, 0.25, ARC.z + ARC.r + 0.6]}
        color={palette.neonBlue}
        intensity={8}
        distance={3.5}
        decay={1.8}
      />
      <pointLight
        position={[ARC.x, 2.6, ARC.z + 1.2]}
        color="#ffc98a"
        intensity={16}
        distance={4.5}
        decay={1.6}
      />
    </group>
  );
}
