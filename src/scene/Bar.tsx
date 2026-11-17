import { useMemo } from 'react';
import * as THREE from 'three';
import { playIce } from '../audio/player';
import { BAR, ROOM, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { Interactive } from '../objects/Interactive';
import { lib } from '../textures/library';
import { mulberry32 } from '../textures/random';
import { box, crease, cyl, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';

const HALF_PI = Math.PI / 2;
const BAR_W = BAR.x1 - BAR.x0;
const BAR_CX = (BAR.x0 + BAR.x1) / 2;
/** Fundo do rebaixo de teto sobre o bar. */
const SOFFIT_Y = 3.0;
const SOFFIT_Z1 = -2.3;

/** Três formatos de garrafa (raio, altura). Rótulos lisos, sem marca. */
const BOTTLES: [number, number][][] = [
  [
    [0.001, 0],
    [0.04, 0],
    [0.04, 0.19],
    [0.03, 0.23],
    [0.013, 0.26],
    [0.013, 0.33],
  ],
  [
    [0.001, 0],
    [0.048, 0],
    [0.05, 0.13],
    [0.035, 0.17],
    [0.014, 0.2],
    [0.014, 0.27],
  ],
  [
    [0.001, 0],
    [0.034, 0],
    [0.034, 0.24],
    [0.016, 0.29],
    [0.012, 0.3],
    [0.012, 0.37],
  ],
];

/** Plano deitado com UV em metros. */
function floorPlane(w: number, d: number) {
  const g = new THREE.PlaneGeometry(w, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  return g.rotateX(-HALF_PI);
}

/** Garrafas espalhadas numa prateleira (largura em x, a partir do centro). */
function bottles(seed: number, y: number, z: number, width: number, count: number) {
  const r = mulberry32(seed);
  const glass: THREE.BufferGeometry[][] = [[], [], []];
  const labels: THREE.BufferGeometry[] = [];
  const caps: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const kind = Math.floor(r() * 3);
    const shape = BOTTLES[kind];
    const x = -width / 2 + ((i + 0.5) / count) * width + (r() - 0.5) * 0.05;
    const zz = z + (r() - 0.5) * 0.08;
    const top = shape[shape.length - 1][1];
    glass[Math.floor(r() * 3)].push(lathe(shape, { seg: 10 }, [x, y, zz]));
    const radius = shape[1][0];
    labels.push(
      cyl(radius + 0.001, radius + 0.001, 0.07, [x, y + 0.09, zz], { seg: 10, open: true }),
    );
    caps.push(cyl(0.014, 0.014, 0.02, [x, y + top + 0.008, zz], { seg: 8 }));
  }
  return { glass, labels, caps };
}

/**
 * Cristaleira atrás do balcão, encostada no vidro: armário embaixo,
 * espelho ao fundo, prateleiras de vidro com fita azul e as garrafas.
 * Sobe até o rebaixo do teto, então vira parte da parede.
 */
function BackBar() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const w = 2.6;
    const zBack = -0.22;
    const levels = [
      { y: 0.99, n: 7 },
      { y: 1.6, n: 6 },
      { y: 2.2, n: 6 },
    ];
    const sets = levels.map((l, i) => bottles(40 + i, l.y, -0.05, w - 0.5, l.n));
    return {
      cabinet: merge([
        box([w, 0.95, 0.5], [0, 0.475, 0]),
        box([0.14, SOFFIT_Y - 0.95, 0.5], [-w / 2 + 0.07, 0.95 + (SOFFIT_Y - 0.95) / 2, 0], {
          swap: true,
        }),
        box([0.14, SOFFIT_Y - 0.95, 0.5], [w / 2 - 0.07, 0.95 + (SOFFIT_Y - 0.95) / 2, 0], {
          swap: true,
        }),
        box([0.08, SOFFIT_Y - 0.95, 0.3], [0, 0.95 + (SOFFIT_Y - 0.95) / 2, -0.1], { swap: true }),
      ]),
      doors: merge(
        [-0.95, -0.32, 0.32, 0.95].map((x) =>
          box([0.56, 0.72, 0.02], [x, 0.47, 0.255], { swap: true }),
        ),
      ),
      pulls: merge(
        [-0.68, -0.6, 0.6, 0.68].map((x) => cyl(0.006, 0.006, 0.14, [x, 0.52, 0.275], { seg: 6 })),
      ),
      top: box([w + 0.06, 0.04, 0.54], [0, 0.97, 0.01]),
      mirror: new THREE.PlaneGeometry(w - 0.28, SOFFIT_Y - 0.99).translate(
        0,
        0.99 + (SOFFIT_Y - 0.99) / 2,
        zBack,
      ),
      shelves: merge([1.58, 2.18].map((y) => box([w - 0.28, 0.015, 0.36], [0, y, -0.03]))),
      leds: merge([1.565, 2.165, 2.96].map((y) => box([w - 0.3, 0.01, 0.01], [0, y, 0.14]))),
      bottles: sets.map((s) => s.glass.map((g) => (g.length ? merge(g) : null))),
      labels: merge(sets.flatMap((s) => s.labels)),
      caps: merge(sets.flatMap((s) => s.caps)),
    };
  }, []);
  const glassMats = [mat.bottleGreen, mat.bottleAmber, mat.bottleClear];
  return (
    <group name="bar_bottles">
      <mesh geometry={geo.cabinet} material={mat.mahogany} />
      <mesh geometry={geo.doors} material={mat.mahoganyDark} />
      <mesh geometry={geo.pulls} material={mat.brass} />
      <mesh geometry={geo.top} material={mat.marble} />
      <mesh geometry={geo.mirror} material={mat.mirror} />
      <mesh geometry={geo.shelves} material={mat.clearGlass} renderOrder={5} />
      <mesh geometry={geo.leds} material={mat.neonBlue} />
      <mesh geometry={geo.labels} material={mat.labelCream} />
      <mesh geometry={geo.caps} material={mat.brass} />
      {geo.bottles.map((level, i) =>
        level.map((g, k) =>
          g ? (
            <mesh key={`${i}-${k}`} geometry={g} material={glassMats[k]} renderOrder={6} />
          ) : null,
        ),
      )}
    </group>
  );
}

/** Balcão de mogno (2,40 × 1,10 × 0,70 m): almofadas, apoio de pés de latão e neon azul. */
function Counter() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const w = 2.4;
    return {
      body: merge([
        box([w, 1.02, 0.06], [0, 0.51, 0.27], { swap: true }),
        box([0.08, 1.02, 0.6], [-w / 2 + 0.04, 0.51, 0], { swap: true }),
        box([0.08, 1.02, 0.6], [w / 2 - 0.04, 0.51, 0], { swap: true }),
        box([w - 0.16, 0.03, 0.5], [0, 0.85, -0.02]),
      ]),
      panels: merge(
        [-0.8, 0, 0.8].map((x) => box([0.66, 0.66, 0.012], [x, 0.56, 0.303], { swap: true })),
      ),
      kick: box([w - 0.04, 0.1, 0.04], [0, 0.05, 0.25]),
      top: crease(box([w + 0.14, 0.05, 0.78], [0, 1.045, 0.05], { uv: 1 }), 30),
      brass: merge([
        box([w + 0.14, 0.012, 0.012], [0, 1.03, 0.446]),
        cyl(0.02, 0.02, w - 0.1, [0, 0.2, 0.42], { seg: 10, rot: [0, 0, HALF_PI] }),
        ...[-0.95, 0, 0.95].map((x) =>
          cyl(0.01, 0.01, 0.13, [x, 0.2, 0.355], { seg: 6, rot: [HALF_PI, 0, 0] }),
        ),
      ]),
      neon: merge([
        box([w - 0.1, 0.018, 0.018], [0, 0.11, 0.29]),
        box([w, 0.012, 0.012], [0, 1.008, 0.4]),
      ]),
    };
  }, []);
  return (
    <group name="bar">
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.panels} material={mat.mahoganyDark} />
      <mesh geometry={geo.kick} material={mat.blackPlastic} />
      <mesh geometry={geo.top} material={mat.marble} />
      <mesh geometry={geo.brass} material={mat.brass} />
      <mesh geometry={geo.neon} material={mat.neonBlue} name="neon" />
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

/** Rebaixo de teto sobre o bar com sanca de neon azul e luzes embutidas. */
function Soffit() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const d = SOFFIT_Z1 - ROOM.z0;
    const zc = (ROOM.z0 + SOFFIT_Z1) / 2;
    const spots = [2.4, 3.3, 4.2].map((x) =>
      new THREE.CircleGeometry(0.05, 12)
        .rotateX(HALF_PI)
        .translate(x, SOFFIT_Y - 0.002, SOFFIT_Z1 + 0.0 - 0.5),
    );
    return {
      body: box([BAR_W, ROOM.h - SOFFIT_Y, d], [BAR_CX, (ROOM.h + SOFFIT_Y) / 2, zc]),
      cove: merge([
        box([BAR_W, 0.015, 0.015], [BAR_CX, SOFFIT_Y + 0.01, SOFFIT_Z1 + 0.012]),
        box([0.015, 0.015, d], [BAR.x0 - 0.012, SOFFIT_Y + 0.01, zc]),
      ]),
      spots: merge(spots),
    };
  }, []);
  return (
    <>
      <mesh geometry={geo.body} material={mat.mahoganyDark} />
      <mesh geometry={geo.cove} material={mat.neonBlue} />
      <mesh geometry={geo.spots} material={mat.amberBulb} />
    </>
  );
}

/**
 * Bar azul: piso de mármore delimitado, rebaixo de teto com neon azul,
 * cristaleira contra o vidro, balcão com banquetas e o martini.
 * Passar o mouse faz o gelo tilintar baixinho.
 */
export function Bar() {
  const { mat } = lib();
  const [bx, , bz] = SPOT.bar;
  const [kx, , kz] = SPOT.backBar;
  const floor = useMemo(() => {
    const d = BAR.z1 - (ROOM.z0 + 0.05);
    return {
      marble: floorPlane(BAR_W, d).translate(BAR_CX, 0.004, (BAR.z1 + ROOM.z0 + 0.05) / 2),
      edge: merge([
        box([BAR_W, 0.008, 0.03], [BAR_CX, 0.004, BAR.z1]),
        box([0.03, 0.008, d], [BAR.x0, 0.004, (BAR.z1 + ROOM.z0) / 2]),
        box([0.03, 0.008, d], [BAR.x1, 0.004, (BAR.z1 + ROOM.z0) / 2]),
      ]),
    };
  }, []);
  return (
    <group name="bar-area">
      <mesh geometry={floor.marble} material={mat.marbleFloor} />
      <mesh geometry={floor.edge} material={mat.brass} />
      <Soffit />
      <group position={[kx, 0, kz]}>
        <BackBar />
      </group>
      <group
        position={[bx, 0, bz]}
        onPointerOver={(event) => {
          event.stopPropagation();
          playIce();
        }}
      >
        <Interactive id="bar" label="objects.bar">
          <OptionalModel file="bar.glb">
            <Counter />
          </OptionalModel>
          <group position={[0.55, 1.07, 0.12]}>
            <Martini />
          </group>
        </Interactive>
        {[-0.75, 0, 0.75].map((x, i) => (
          <group key={x} position={[x, 0, 0.72 + (i === 1 ? 0.06 : 0)]} rotation={[0, i * 0.4, 0]}>
            <Stool />
          </group>
        ))}
        <mesh position={[0, 0.006, -0.05]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[2.9, 1.2]} />
        </mesh>
      </group>
      {/* neon azul do bar e luz quente das embutidas sobre o balcão */}
      <pointLight
        position={[BAR_CX, 2.6, SOFFIT_Z1 - 0.2]}
        color={palette.neonBlue}
        intensity={14}
        distance={5}
        decay={1.8}
      />
      <pointLight
        position={[bx, 0.25, bz + 0.6]}
        color={palette.neonBlue}
        intensity={10}
        distance={3.5}
        decay={1.8}
      />
      <pointLight
        position={[bx, 2.4, bz - 0.2]}
        color="#ffc98a"
        intensity={6}
        distance={3.5}
        decay={1.6}
      />
    </group>
  );
}
