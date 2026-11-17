import { useMemo } from 'react';
import * as THREE from 'three';
import { playIce } from '../audio/player';
import { SPOT } from '../config/layout';
import { Interactive } from '../objects/Interactive';
import { lib } from '../textures/library';
import { box, crease, cyl, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';

const HALF_PI = Math.PI / 2;

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

/** Balcão de mogno (1,80 × 1,10 × 0,60 m) com neon azul por baixo. */
function Counter() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      body: merge([
        box([1.8, 1.02, 0.06], [0, 0.51, 0.27], { swap: true }),
        box([0.06, 1.02, 0.6], [-0.87, 0.51, 0], { swap: true }),
        box([0.06, 1.02, 0.6], [0.87, 0.51, 0], { swap: true }),
        box([1.68, 0.03, 0.5], [0, 0.6, -0.02]),
      ]),
      kick: box([1.7, 0.1, 0.04], [0, 0.05, 0.25]),
      top: box([1.94, 0.05, 0.72], [0, 1.045, 0], { uv: 1 }),
      brass: merge([
        box([1.94, 0.012, 0.012], [0, 1.03, 0.366]),
        ...[-0.6, 0, 0.6].map((x) => box([0.012, 0.9, 0.008], [x, 0.56, 0.304])),
        cyl(0.018, 0.018, 1.72, [0, 0.2, 0.4], { seg: 10, rot: [0, 0, HALF_PI] }),
        ...[-0.75, 0, 0.75].map((x) =>
          cyl(0.01, 0.01, 0.12, [x, 0.2, 0.345], { seg: 6, rot: [HALF_PI, 0, 0] }),
        ),
      ]),
      neon: merge([
        box([1.7, 0.02, 0.02], [0, 0.115, 0.29]),
        box([1.76, 0.014, 0.014], [0, 1.005, 0.33]),
      ]),
    }),
    [],
  );
  return (
    <group name="bar">
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.kick} material={mat.blackPlastic} />
      <mesh geometry={geo.top} material={mat.marble} />
      <mesh geometry={geo.brass} material={mat.brass} />
      <mesh geometry={geo.neon} material={mat.neonBlue} name="neon" />
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

/** Aparador atrás do balcão com as seis garrafas contra a luz da cidade. */
function BackBar() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const glass: THREE.BufferGeometry[][] = [[], [], []];
    const labels: THREE.BufferGeometry[] = [];
    const caps: THREE.BufferGeometry[] = [];
    [-0.62, -0.38, -0.12, 0.13, 0.4, 0.64].forEach((x, i) => {
      const shape = BOTTLES[i % 3];
      const height = shape[shape.length - 1][1];
      glass[i % 3].push(lathe(shape, { seg: 12 }, [x, 0.93, 0]));
      const r = shape[1][0];
      labels.push(cyl(r + 0.001, r + 0.001, 0.07, [x, 0.93 + 0.085, 0], { seg: 12, open: true }));
      caps.push(cyl(0.014, 0.014, 0.02, [x, 0.93 + height + 0.008, 0], { seg: 8 }));
    });
    return {
      body: merge([
        box([1.7, 0.86, 0.3], [0, 0.43, 0], { swap: true }),
        box([1.76, 0.04, 0.34], [0, 0.89, 0]),
      ]),
      glass: glass.map((g) => merge(g)),
      labels: merge(labels),
      caps: merge(caps),
      glow: box([1.6, 0.012, 0.03], [0, 0.916, -0.11]),
    };
  }, []);
  const materials = [mat.bottleGreen, mat.bottleAmber, mat.bottleClear];
  return (
    <group name="bar_bottles">
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.glow} material={mat.neonBlue} />
      <mesh geometry={geo.labels} material={mat.labelCream} />
      <mesh geometry={geo.caps} material={mat.brass} />
      {geo.glass.map((g, i) => (
        <mesh key={i} geometry={g} material={materials[i]} renderOrder={6} />
      ))}
    </group>
  );
}

/**
 * Bar azul com martini: balcão de mogno com neon por baixo, garrafas
 * atrás e a taça em cima. Passar o mouse faz o gelo do copo da mesa
 * tilintar baixinho; não abre seção.
 */
export function Bar() {
  const { mat } = lib();
  const [bx, , bz] = SPOT.bar;
  const [kx, , kz] = SPOT.backBar;
  const glow = useMemo(() => crease(new THREE.PlaneGeometry(3.2, 2.2)), []);
  return (
    <group name="bar-area">
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
          <group position={[0.42, 1.07, 0.04]}>
            <Martini />
          </group>
        </Interactive>
        {/* luz azul "assada" no carpete em frente ao balcão */}
        <mesh
          geometry={glow}
          material={mat.glowBlue}
          position={[0, 0.006, 0.75]}
          rotation={[-HALF_PI, 0, 0]}
        />
        <mesh position={[0, 0.004, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[2.4, 1.1]} />
        </mesh>
      </group>
      <group position={[kx, 0, kz]}>
        <BackBar />
      </group>
    </group>
  );
}
