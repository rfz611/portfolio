import { useMemo } from 'react';
import * as THREE from 'three';
import { PIT, PIT_SEAT, PIT_SOFA_X0, PIT_STEPS, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { CarKeys } from '../objects/CarKeys';
import { Magazines } from '../objects/Magazines';
import { makeCanvas, tex } from '../textures/canvas';
import { hdr, lib } from '../textures/library';
import { paintCard } from '../textures/rugs';
import { box, crease, cyl, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';
import { arcPoints, sweep } from './sweep';

const deg = (d: number) => (d * Math.PI) / 180;
const HALF_PI = Math.PI / 2;

/** Mesmo material, mas visível dos dois lados (peças feitas por revolução ou varredura). */
function useTwoSided<T extends THREE.Material>(material: T): T {
  return useMemo(() => {
    const copy = material.clone() as T;
    copy.side = THREE.DoubleSide;
    return copy;
  }, [material]);
}

/**
 * Caminho do sofá embutido: encostado nas paredes de dentro do rebaixo,
 * em U, de oeste (norte) dando a volta pelo leste até oeste (sul).
 * O lado aberto fica de frente para a TV.
 */
function pitPath(): [number, number][] {
  const { x1, z0, z1, r } = PIT;
  const start = PIT_SOFA_X0;
  const path: [number, number][] = [[start, z0]];
  for (let x = start + 0.5; x < x1 - r - 0.01; x += 0.5) path.push([x, z0]);
  path.push([x1 - r, z0]);
  path.push(...arcPoints(x1 - r, z0 + r, r, -HALF_PI, 0, 8));
  for (let z = z0 + r + 0.5; z < z1 - r - 0.01; z += 0.5) path.push([x1, z]);
  path.push([x1, z1 - r]);
  path.push(...arcPoints(x1 - r, z1 - r, r, 0, HALF_PI, 8));
  for (let x = x1 - r - 0.5; x > start + 0.01; x -= 0.5) path.push([x, z1]);
  path.push([start, z1]);
  return path;
}

/** Perfis (distância da parede, altura acima do fundo do rebaixo). */
const PROFILE = {
  top: [
    [-0.08, PIT.depth - 0.02],
    [-0.08, 0.7],
    [-0.02, 0.78],
    [0.1, 0.8],
    [0.2, 0.75],
  ],
  back: [
    [0.2, 0.75],
    [0.25, 0.6],
    [0.27, 0.47],
  ],
  seat: [
    [0.27, 0.47],
    [0.33, 0.45],
    [PIT_SEAT - 0.08, 0.47],
    [PIT_SEAT - 0.01, 0.43],
    [PIT_SEAT, 0.36],
  ],
  skirt: [
    [PIT_SEAT, 0.36],
    [PIT_SEAT, 0.07],
  ],
  plinth: [
    [PIT_SEAT - 0.04, 0.07],
    [PIT_SEAT - 0.04, 0],
  ],
} as const;

/**
 * Sofá embutido de couro vinho, em U, seguindo o contorno do rebaixo:
 * o encosto capitonê fica contra a parede do degrau e o rolo de cima
 * aparece do nível da sala, como nas salas rebaixadas dos anos 80.
 */
function PitSofa() {
  const { mat } = lib();
  const plain = useTwoSided(mat.leatherWine);
  const tufted = useTwoSided(mat.leatherWineTuft);
  const seat = useTwoSided(mat.leatherWineSeat);
  const geo = useMemo(() => {
    const path = pitPath();
    const arm = crease(
      merge([
        box([0.2, 0.56, PIT_SEAT + 0.04], [0, 0.28, 0]),
        cyl(0.1, 0.1, PIT_SEAT + 0.04, [0, 0.56, 0], { seg: 12, rot: [HALF_PI, 0, 0] }),
      ]),
      50,
    );
    return {
      top: sweep(path, PROFILE.top, { uScale: 1.6 }),
      back: sweep(path, PROFILE.back, { uScale: 1.15 }),
      seat: sweep(path, PROFILE.seat, { uScale: 0.95 }),
      skirt: sweep(path, PROFILE.skirt, { uScale: 1.6, vRepeat: 0.3 }),
      plinth: sweep(path, PROFILE.plinth, { uScale: 1.6, vRepeat: 0.1 }),
      arm,
      pillow: new THREE.SphereGeometry(1, 12, 8),
    };
  }, []);

  // braços nas pontas do U e almofadas largadas meio tortas
  const armZ = [PIT.z0 + (PIT_SEAT + 0.04) / 2, PIT.z1 - (PIT_SEAT + 0.04) / 2];
  const pillows: [number, number, number, number][] = [
    [PIT.x1 - 0.28, 0.62, 0.2, -1.1],
    [PIT.x1 - 0.3, 0.62, 1.15, -1.9],
    [-0.55, 0.6, PIT.z0 + 0.3, 0.35],
    [1.4, 0.58, PIT.z1 - 0.32, 2.9],
  ];
  return (
    <group name="sofa_curved" position={[0, -PIT.depth, 0]}>
      <mesh geometry={geo.top} material={plain} />
      <mesh geometry={geo.back} material={tufted} />
      <mesh geometry={geo.seat} material={seat} />
      <mesh geometry={geo.skirt} material={plain} />
      <mesh geometry={geo.plinth} material={mat.mahoganyDark} />
      {armZ.map((z) => (
        <mesh
          key={z}
          geometry={geo.arm}
          material={mat.leatherWine}
          position={[PIT_SOFA_X0 - 0.1, 0, z]}
        />
      ))}
      {pillows.map(([x, y, z, yaw]) => (
        <mesh
          key={`${x}${z}`}
          geometry={geo.pillow}
          material={mat.fabricGold}
          position={[x, y, z]}
          rotation={[0.35, yaw, 0.25, 'YXZ']}
          scale={[0.21, 0.2, 0.08]}
        />
      ))}
    </group>
  );
}

/** Dois degraus de carpete no lado aberto do rebaixo, com fio de luz. */
function PitSteps() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const width = PIT_STEPS.z1 - PIT_STEPS.z0;
    const z = (PIT_STEPS.z0 + PIT_STEPS.z1) / 2;
    const step = PIT.depth / 3;
    return {
      steps: merge([
        box([0.6, step * 2, width], [PIT.x0 + 0.3, -PIT.depth + step, z], { uv: 2 }),
        box([0.3, step, width], [PIT.x0 + 0.75, -PIT.depth + step / 2, z], { uv: 2 }),
      ]),
      lights: merge([
        box([0.01, 0.012, width], [PIT.x0 + 0.605, -PIT.depth + step * 2 - 0.03, z]),
        box([0.01, 0.012, width], [PIT.x0 + 0.905, -PIT.depth + step - 0.03, z]),
      ]),
    };
  }, []);
  return (
    <>
      <mesh geometry={geo.steps} material={mat.carpet} />
      <mesh geometry={geo.lights} material={mat.amberStrip} />
    </>
  );
}

/** Poltrona chesterfield de couro marrom (fica fora do rebaixo, perto da TV). */
function Armchair() {
  const { mat } = lib();
  const plain = useTwoSided(mat.leatherBrown);
  const tufted = useTwoSided(mat.leatherBrownTuft);
  const geo = useMemo(() => {
    const a = { start: deg(55), length: deg(250), seg: 22 };
    const ends = [a.start, a.start + a.length];
    return {
      outer: lathe(
        [
          [0.43, 0.04],
          [0.45, 0.5],
          [0.44, 0.78],
          [0.4, 0.86],
        ],
        { ...a, uRepeat: 3, vRepeat: 1.3 },
      ),
      inner: lathe(
        [
          [0.4, 0.86],
          [0.33, 0.86],
          [0.29, 0.79],
          [0.3, 0.42],
        ],
        { ...a, uRepeat: 5, vRepeat: 1.2 },
      ),
      solid: merge([
        cyl(0.42, 0.44, 0.25, [0, 0.125, 0], { seg: 22 }),
        cyl(0.37, 0.38, 0.17, [0, 0.335, 0], { seg: 22 }),
        ...ends.map((phi) =>
          cyl(0.078, 0.078, 0.84, [Math.sin(phi) * 0.37, 0.44, Math.cos(phi) * 0.37], {
            seg: 12,
          }),
        ),
      ]),
      feet: merge(
        [45, 135, 225, 315].map((d) =>
          cyl(0.03, 0.02, 0.04, [Math.sin(deg(d)) * 0.36, 0.02, Math.cos(deg(d)) * 0.36], {
            seg: 8,
          }),
        ),
      ),
    };
  }, []);
  return (
    <group name="armchair">
      <mesh geometry={geo.outer} material={plain} />
      <mesh geometry={geo.inner} material={tufted} />
      <mesh geometry={geo.solid} material={mat.leatherBrown} />
      <mesh geometry={geo.feet} material={mat.brass} />
    </group>
  );
}

/** Mesa redonda de mogno envernizado (1,10 m de diâmetro × 0,42 m). */
function CoffeeTable() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      top: cyl(0.55, 0.55, 0.05, [0, 0.395, 0], { seg: 32, uv: 1 }),
      rim: cyl(0.556, 0.556, 0.024, [0, 0.395, 0], { seg: 32, open: true }),
      base: cyl(0.36, 0.4, 0.34, [0, 0.2, 0], { seg: 24, swap: true }),
      ring: cyl(0.425, 0.425, 0.03, [0, 0.015, 0], { seg: 24 }),
    }),
    [],
  );
  return (
    <group name="coffee_table">
      <mesh geometry={geo.top} material={mat.varnish} name="top" />
      <mesh geometry={geo.rim} material={mat.brass} />
      <mesh geometry={geo.base} material={mat.mahogany} />
      <mesh geometry={geo.ring} material={mat.brass} />
    </group>
  );
}

const TOP = 0.42;

/**
 * O que ficou largado na mesa: copo de uísque pela metade com marca de
 * copo no verniz, cinzeiro com charuto e cinza, isqueiro e cartas
 * espalhadas (o lugar das cartas colecionáveis, detalhe pessoal).
 */
function TableClutter() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      glass: lathe(
        [
          [0.001, 0.003],
          [0.036, 0.003],
          [0.04, 0.09],
        ],
        { seg: 16 },
      ),
      whisky: cyl(0.0375, 0.0345, 0.028, [0, 0.018, 0], { seg: 16 }),
      ice: merge([
        box([0.022, 0.022, 0.022], [0.008, 0.038, 0.004], { rot: [0.4, 0.5, 0.2] }),
        box([0.02, 0.02, 0.02], [-0.01, 0.042, -0.006], { rot: [0.2, 1.1, 0.6] }),
      ]),
      ring: new THREE.RingGeometry(0.034, 0.041, 20).rotateX(-HALF_PI),
      ashtray: crease(
        lathe(
          [
            [0.001, 0.008],
            [0.05, 0.008],
            [0.064, 0.03],
            [0.072, 0.03],
            [0.068, 0],
            [0.001, 0],
          ],
          { seg: 16 },
        ),
        30,
      ),
      ash: new THREE.CircleGeometry(0.035, 10).rotateX(-HALF_PI).translate(0.008, 0.0095, 0),
      cigar: cyl(0.008, 0.008, 0.11, [0.02, 0.036, 0.01], { seg: 8, rot: [0.14, 0.4, HALF_PI] }),
      ember: cyl(0.0082, 0.0082, 0.012, [-0.036, 0.036, 0.034], {
        seg: 8,
        rot: [0.14, 0.4, HALF_PI],
      }),
      lighter: box([0.038, 0.058, 0.014], [0, 0.007, 0], { rot: [HALF_PI, 0, 0] }),
      card: new THREE.PlaneGeometry(0.063, 0.088).rotateX(-HALF_PI),
    }),
    [],
  );
  const glass = useTwoSided(mat.clearGlass);
  const cards = useMemo(
    () =>
      (
        [
          ['♠', 'A', false],
          ['♥', 'K', true],
          ['♣', '7', false],
        ] as const
      ).map(([suit, rank, red]) => {
        const map = tex(
          makeCanvas(96, 134, (c, w, h) => paintCard(c, w, h, suit, rank, red)),
          { clamp: true },
        );
        return new THREE.MeshStandardMaterial({ map, roughness: 0.5, envMapIntensity: 0.4 });
      }),
    [],
  );
  const cardSpots: [number, number, number][] = [
    [0.2, -0.32, 0.4],
    [0.27, -0.28, -0.3],
    [0.31, -0.37, 1.2],
  ];
  return (
    <group position={[0, TOP, 0]}>
      <group position={[0.24, 0.001, -0.17]} name="glass">
        <mesh geometry={geo.whisky} material={mat.whisky} />
        <mesh geometry={geo.ice} material={mat.ice} name="ice" />
        <mesh geometry={geo.glass} material={glass} renderOrder={6} />
      </group>
      {/* marca de copo antiga no verniz */}
      <mesh geometry={geo.ring} material={mat.stain} position={[0.31, 0.0015, -0.04]} />
      <group position={[-0.06, 0.001, -0.33]} rotation={[0, 0.7, 0]} name="ashtray">
        <mesh geometry={geo.ashtray} material={mat.marble} />
        <mesh geometry={geo.ash} material={mat.ash} />
        <mesh geometry={geo.cigar} material={mat.cigar} />
        <mesh geometry={geo.ember} material={mat.ledRed} />
      </group>
      <mesh
        geometry={geo.lighter}
        material={mat.brass}
        position={[0.08, 0.001, -0.42]}
        rotation={[0, 1.1, 0]}
      />
      {cardSpots.map(([x, z, yaw], i) => (
        <mesh
          key={i}
          geometry={geo.card}
          material={cards[i]}
          position={[x, 0.002 + i * 0.0008, z]}
          rotation={[0, yaw, 0]}
        />
      ))}
    </group>
  );
}

/**
 * Luminária de chão de arco cromada: base de mármore, haste que sobe e
 * faz uma curva por cima do sofá, com a cúpula em domo acesa.
 */
function ArcLamp() {
  const { mat } = lib();
  const [bx, , bz] = SPOT.arcLamp;
  const [tx, , tz] = SPOT.table;
  // direção da base até a mesa e alcance do arco
  const yaw = Math.atan2(tx - bx, tz - bz);
  const reach = 2.0;
  const geo = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, 2.1, 0),
      new THREE.Vector3(0, 2.45, reach * 0.75),
      new THREE.Vector3(0, 2.05, reach),
    );
    return {
      base: box([0.32, 0.16, 0.32], [0, 0.08, 0]),
      stem: new THREE.TubeGeometry(curve, 40, 0.012, 8, false),
      dome: new THREE.SphereGeometry(0.2, 20, 10, 0, Math.PI * 2, 0, HALF_PI).translate(
        0,
        -0.06,
        0,
      ),
      cap: cyl(0.02, 0.02, 0.06, [0, 0, 0], { seg: 8 }),
      bulb: new THREE.CircleGeometry(0.15, 16).rotateX(HALF_PI).translate(0, -0.055, 0),
    };
  }, []);
  const glow = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr(palette.amber, 3.4), toneMapped: false }),
    [],
  );
  return (
    <group position={[bx, 0, bz]} rotation={[0, yaw, 0]} name="arc-lamp">
      <mesh geometry={geo.base} material={mat.marble} />
      <mesh geometry={geo.stem} material={mat.chrome} />
      <group position={[0, 2.05, reach]}>
        <mesh geometry={geo.dome} material={mat.chrome} />
        <mesh geometry={geo.cap} material={mat.chrome} />
        <mesh geometry={geo.bulb} material={glow} />
        <sprite position={[0, -0.12, 0]} scale={[1.1, 1.1, 1]} material={mat.spriteAmber} />
        <spotLight
          position={[0, -0.05, 0]}
          color="#ffc58a"
          intensity={60}
          angle={0.85}
          penumbra={0.8}
          distance={6}
          decay={1.5}
        />
      </group>
      <mesh position={[0, 0.004, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[0.7, 0.7]} />
      </mesh>
    </group>
  );
}

/** Sala rebaixada: sofá embutido, degraus, tapete persa, mesa de centro e a luminária de arco. */
export function Lounge() {
  const { mat } = lib();
  const [tx, ty, tz] = SPOT.table;
  const [ax, ay, az] = SPOT.armchair;
  const armYaw = Math.atan2(PIT.x0 - ax + 0.4, 0.6 - az);
  return (
    <group name="lounge">
      <OptionalModel file="sofa_curved.glb">
        <PitSofa />
      </OptionalModel>
      <PitSteps />
      <mesh
        position={[tx - 0.05, ty + 0.004, tz]}
        rotation={[-HALF_PI, 0, 0.04]}
        material={mat.rugPit}
      >
        <planeGeometry args={[2.9, 2.1]} />
      </mesh>
      <group position={[tx, ty, tz]}>
        <OptionalModel file="coffee_table.glb">
          <CoffeeTable />
        </OptionalModel>
        <Magazines />
        <CarKeys />
        <TableClutter />
        <mesh position={[0, 0.006, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[1.6, 1.6]} />
        </mesh>
      </group>
      <group position={[ax, ay, az]} rotation={[0, armYaw, 0]}>
        <OptionalModel file="armchair.glb">
          <Armchair />
        </OptionalModel>
        <mesh position={[0, 0.005, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[1.5, 1.5]} />
        </mesh>
      </group>
      <ArcLamp />
    </group>
  );
}
