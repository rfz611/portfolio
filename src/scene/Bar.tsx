import { useMemo } from 'react';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';
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
 * Garrafas com formatos de verdade (sem marca): cada tipo tem corpo,
 * cor de vidro, tampa e jeito de rótulo próprios.
 * Vidros: 0 âmbar, 1 verde-escuro, 2 incolor, 3 vermelho, 4 fosco.
 */
type BottleKind =
  | 'whisky'
  | 'wine'
  | 'cognac'
  | 'gin'
  | 'vodka'
  | 'rum'
  | 'tequila'
  | 'champagne'
  | 'amaro'
  | 'bourbon';

const KINDS: BottleKind[] = [
  'whisky',
  'wine',
  'cognac',
  'gin',
  'vodka',
  'rum',
  'tequila',
  'champagne',
  'amaro',
  'bourbon',
];

const GLASS_OF: Record<BottleKind, number> = {
  whisky: 0,
  wine: 1,
  cognac: 0,
  gin: 2,
  vodka: 4,
  rum: 0,
  tequila: 2,
  champagne: 1,
  amaro: 3,
  bourbon: 0,
};

/** Perfis (raio, altura) das garrafas redondas. */
const ROUND: Partial<Record<BottleKind, [number, number][]>> = {
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
};

interface BottleSet {
  glass: THREE.BufferGeometry[][];
  labels: THREE.BufferGeometry[][];
  caps: THREE.BufferGeometry[];
  wax: THREE.BufferGeometry[];
  corks: THREE.BufferGeometry[];
}

/** Monta uma garrafa no lugar (x, y, z) e reparte as peças por material. */
function addBottle(
  set: BottleSet,
  kind: BottleKind,
  x: number,
  y: number,
  z: number,
  label: number,
) {
  const g = GLASS_OF[kind];
  const flatLabel = (w: number, h: number, ly: number, depth: number) =>
    set.labels[label].push(new THREE.PlaneGeometry(w, h).translate(x, y + ly, z + depth + 0.0012));
  if (kind === 'whisky' || kind === 'bourbon' || kind === 'tequila') {
    // corpo quadrado de cantos arredondados + gargalo redondo
    const square = {
      whisky: { w: 0.075, h: 0.2, neck: 0.07 },
      bourbon: { w: 0.07, h: 0.17, neck: 0.08 },
      tequila: { w: 0.085, h: 0.13, neck: 0.03 },
    }[kind];
    set.glass[g].push(
      new RoundedBoxGeometry(square.w, square.h, square.w, 2, 0.012).translate(
        x,
        y + square.h / 2,
        z,
      ),
    );
    set.glass[g].push(
      lathe(
        [
          [0.022, 0],
          [0.016, 0.02],
          [0.014, square.neck],
        ],
        { seg: 10 },
        [x, y + square.h, z],
      ),
    );
    flatLabel(square.w * 0.8, square.h * 0.42, square.h * 0.45, square.w / 2);
    const top = y + square.h + square.neck;
    if (kind === 'bourbon') {
      // lacre de cera vermelha escorrendo
      set.wax.push(cyl(0.019, 0.019, 0.04, [x, top - 0.01, z], { seg: 10 }));
      set.wax.push(cyl(0.024, 0.02, 0.015, [x, top - 0.035, z], { seg: 10 }));
    } else if (kind === 'tequila') {
      set.corks.push(new THREE.SphereGeometry(0.03, 10, 8).translate(x, top + 0.02, z));
    } else {
      set.caps.push(cyl(0.016, 0.016, 0.025, [x, top + 0.012, z], { seg: 8 }));
    }
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
    flatLabel(0.06, 0.035, 0.07, 0.0365);
    set.caps.push(cyl(0.02, 0.02, 0.03, [x, y + 0.245, z], { seg: 10 }));
    return;
  }
  const profile = ROUND[kind]!;
  const top = profile[profile.length - 1][1];
  const radius = Math.max(profile[1][0], profile[2][0]);
  set.glass[g].push(lathe(profile, { seg: 12 }, [x, y, z]));
  set.labels[label].push(
    new THREE.CylinderGeometry(radius + 0.0015, radius + 0.0015, 0.08, 14, 1, true)
      .rotateY(Math.PI)
      .translate(x, y + top * 0.32, z),
  );
  if (kind === 'champagne') {
    set.caps.push(cyl(0.018, 0.016, 0.07, [x, y + top - 0.02, z], { seg: 10 }));
  } else {
    set.caps.push(cyl(0.015, 0.015, 0.022, [x, y + top + 0.01, z], { seg: 8 }));
  }
}

/** Garrafas lado a lado numa prateleira, com tipos e rótulos variados. */
function bottleRow(seed: number, y: number, width: number, count: number): BottleSet {
  const r = mulberry32(seed);
  const set: BottleSet = {
    glass: [[], [], [], [], []],
    labels: LABELS.map(() => []),
    caps: [],
    wax: [],
    corks: [],
  };
  for (let i = 0; i < count; i++) {
    const kind = KINDS[Math.floor(r() * KINDS.length)];
    const x = -width / 2 + ((i + 0.5) / count) * width + (r() - 0.5) * 0.012;
    const z = -0.05 + (i % 2) * 0.07 + (r() - 0.5) * 0.02;
    addBottle(set, kind, x, y, z, Math.floor(r() * LABELS.length));
  }
  return set;
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

/** Vasinho cromado com uma plantinha. */
function SmallPlant() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const leaves: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 7; k++) {
      const g = new THREE.PlaneGeometry(0.09, 0.16).translate(0, 0.08, 0);
      g.rotateX(-0.5 - (k % 2) * 0.25);
      g.rotateY((k / 7) * Math.PI * 2);
      g.translate(0, 0.1, 0);
      leaves.push(g);
    }
    return {
      pot: cyl(0.055, 0.045, 0.1, [0, 0.05, 0], { seg: 16 }),
      leaves: merge(leaves),
    };
  }, []);
  return (
    <group name="small-plant">
      <mesh geometry={geo.pot} material={mat.chrome} />
      <mesh geometry={geo.leaves} material={mat.monstera} />
    </group>
  );
}

/**
 * Cristaleira atrás do balcão, encostada no vidro: armário embaixo,
 * espelho ao fundo e três prateleiras de vidro cheias de garrafas com
 * rótulos, mais a mini luminária cromada, a plantinha e um decanter.
 */
function BackBar() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const w = 2.6;
    const tall = SOFFIT_Y - 0.95;
    const rows = [
      bottleRow(40, 0.99, 1.45, 12),
      bottleRow(41, 1.6, w - 0.4, 19),
      bottleRow(42, 2.2, w - 0.4, 19),
    ];
    const doors = [-0.95, -0.32, 0.32, 0.95];
    // peças de tipos diferentes (caixa arredondada, revolução, plano) viram o mesmo formato antes de unir
    const mergeOr = (list: THREE.BufferGeometry[]) =>
      list.length
        ? merge(
            list.map((g) => {
              const flat = g.index ? g.toNonIndexed() : g;
              flat.clearGroups();
              return flat;
            }),
          )
        : null;
    return {
      cabinet: merge([
        box([w, 0.95, 0.5], [0, 0.475, 0]),
        box([0.14, tall, 0.5], [-w / 2 + 0.07, 0.95 + tall / 2, 0], { swap: true }),
        box([0.14, tall, 0.5], [w / 2 - 0.07, 0.95 + tall / 2, 0], { swap: true }),
        box([0.08, tall, 0.26], [0, 0.95 + tall / 2, -0.08], { swap: true }),
      ]),
      doors: merge(doors.map((x) => box([0.56, 0.72, 0.02], [x, 0.47, 0.255], { swap: true }))),
      pulls: merge(
        [-0.68, -0.6, 0.6, 0.68].map((x) => cyl(0.006, 0.006, 0.14, [x, 0.52, 0.275], { seg: 6 })),
      ),
      top: box([w + 0.06, 0.04, 0.54], [0, 0.97, 0.01]),
      mirror: new THREE.PlaneGeometry(w - 0.28, SOFFIT_Y - 0.99).translate(
        0,
        0.99 + (SOFFIT_Y - 0.99) / 2,
        -0.22,
      ),
      shelves: merge([1.58, 2.18].map((y) => box([w - 0.28, 0.015, 0.36], [0, y, -0.03]))),
      leds: merge([1.565, 2.165, 2.96].map((y) => box([w - 0.3, 0.01, 0.01], [0, y, 0.14]))),
      glass: [0, 1, 2, 3, 4].map((k) => mergeOr(rows.flatMap((row) => row.glass[k]))),
      labels: LABELS.map((_, k) => mergeOr(rows.flatMap((row) => row.labels[k]))),
      caps: mergeOr(rows.flatMap((row) => row.caps))!,
      wax: mergeOr(rows.flatMap((row) => row.wax)),
      corks: mergeOr(rows.flatMap((row) => row.corks)),
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
        [0.45, 0.99, 0.05],
      ),
      stopper: new THREE.SphereGeometry(0.03, 10, 8).translate(0.45, 1.23, 0.05),
    };
  }, []);
  const shelfLed = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr('#2d4bff', 1.2), toneMapped: false }),
    [],
  );
  const wax = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#9a0f16', roughness: 0.35 }),
    [],
  );
  const glassMats = useMemo(
    () => [
      mat.bottleGreen,
      mat.bottleAmber,
      mat.bottleClear,
      new THREE.MeshStandardMaterial({
        color: '#3a0d10',
        roughness: 0.08,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 1.8,
      }),
      new THREE.MeshStandardMaterial({
        color: '#e6eaee',
        roughness: 0.45,
        transparent: true,
        opacity: 0.7,
        envMapIntensity: 1.2,
      }),
    ],
    [mat],
  );
  const labelMats = useMemo(
    () =>
      LABELS.map(
        (style) =>
          new THREE.MeshStandardMaterial({
            map: tex(
              makeCanvas(256, 64, (c, w, h) => paintLabel(c, w, h, style)),
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
      <mesh geometry={geo.doors} material={mat.mahoganyDark} />
      <mesh geometry={geo.pulls} material={mat.brass} />
      <mesh geometry={geo.top} material={mat.marble} />
      <mesh geometry={geo.mirror} material={mat.mirror} />
      <mesh geometry={geo.shelves} material={mat.clearGlass} renderOrder={5} />
      <mesh geometry={geo.leds} material={shelfLed} />
      <mesh geometry={geo.caps} material={mat.brass} />
      {geo.wax && <mesh geometry={geo.wax} material={wax} />}
      {geo.corks && <mesh geometry={geo.corks} material={mat.walnut} />}
      {geo.labels.map((g, k) => (g ? <mesh key={k} geometry={g} material={labelMats[k]} /> : null))}
      {geo.glass.map((g, k) =>
        g ? <mesh key={k} geometry={g} material={glassMats[k]} renderOrder={6} /> : null,
      )}
      <mesh geometry={geo.decanter} material={mat.bottleAmber} renderOrder={6} />
      <mesh geometry={geo.stopper} material={mat.clearGlass} />
      <group position={[-0.98, 0.99, 0.08]}>
        <MiniLamp />
      </group>
      <group position={[1.0, 0.99, 0.06]}>
        <SmallPlant />
      </group>
      <group position={[0.68, 0.99, 0.1]}>
        <GlassRow />
      </group>
    </group>
  );
}

/**
 * Balcão em arco: sai de uma ponta da cristaleira, faz a curva para a
 * sala e volta na outra ponta. Frente de mogno com frisos de latão,
 * tampo de mármore, apoio de pés e neon azul por baixo da borda.
 * O perfil (d, h) é puxado ao longo do arco: d < 0 é o lado do cliente.
 */
function Counter() {
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
  return (
    <group name="bar">
      <mesh geometry={geo.front} material={two.mahogany} />
      <mesh geometry={geo.bands} material={two.brass} />
      <mesh geometry={geo.kick} material={two.kick} />
      <mesh geometry={geo.top} material={two.marble} />
      <mesh geometry={geo.back} material={two.back} />
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
        <Interactive id="bar" label="objects.bar" enabled={home} onClick={() => setView('bar')}>
          <OptionalModel file="bar.glb">
            <Counter />
          </OptionalModel>
          <group position={[martiniX, 1.07, martiniZ]}>
            <Martini />
          </group>
          <BarTop />
        </Interactive>
      </group>
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
