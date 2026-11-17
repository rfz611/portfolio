import { useMemo } from 'react';
import * as THREE from 'three';
import { PIT, PIT_SEAT, PIT_SOFA_X0, PIT_STEPS, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { CarKeys } from '../objects/CarKeys';
import { ClubChair } from '../objects/Chairs';
import { ArmchairKimono, LooseGloves } from '../objects/PersonalItems';
import { Magazines } from '../objects/Magazines';
import { makeCanvas, tex } from '../textures/canvas';
import { hdr, lib } from '../textures/library';
import { GhostPerfume } from '../objects/GhostPerfume';
import { paintCardBack, paintCardFace } from '../textures/tableProps';
import { box, crease, cyl, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';
import { arcPoints, sweep } from './sweep';

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

const TOP = 0.42;

/** Contorno orgânico da mesa (como as mesas de vidro dos anos 80), em metros. */
const TABLE_OUTLINE: [number, number][] = [
  [-0.74, 0.04],
  [-0.62, 0.34],
  [-0.24, 0.43],
  [0.12, 0.3],
  [0.48, 0.41],
  [0.76, 0.16],
  [0.71, -0.24],
  [0.32, -0.42],
  [-0.22, -0.4],
  [-0.62, -0.3],
];

function tableShape(scale: number) {
  const curve = new THREE.CatmullRomCurve3(
    TABLE_OUTLINE.map(([x, z]) => new THREE.Vector3(x * scale, -z * scale, 0)),
    true,
    'centripetal',
  );
  return new THREE.Shape(curve.getPoints(72).map((p) => new THREE.Vector2(p.x, p.y)));
}

/** Peça extrudada deitada no chão, de y0 até y0 + altura. */
function slab(scale: number, y0: number, height: number) {
  const g = new THREE.ExtrudeGeometry(tableShape(scale), {
    depth: height,
    bevelEnabled: false,
    curveSegments: 4,
  });
  g.rotateX(-HALF_PI);
  g.translate(0, y0, 0);
  return g;
}

/**
 * Mesa de centro de formato orgânico (cerca de 1,50 × 0,85 m): tampo de
 * vidro fumê com borda de latão sobre uma base esculpida de mogno.
 */
function CoffeeTable() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      rim: slab(1.0, TOP - 0.03, 0.012),
      glass: slab(0.985, TOP - 0.018, 0.018),
      base: slab(0.55, 0.03, TOP - 0.06),
      plinth: slab(0.6, 0, 0.03),
    }),
    [],
  );
  const glass = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#4a3426',
        roughness: 0.05,
        metalness: 0.2,
        transparent: true,
        opacity: 0.45,
        envMapIntensity: 1.4,
      }),
    [],
  );
  return (
    <group name="coffee_table">
      <mesh geometry={geo.rim} material={mat.brass} />
      <mesh geometry={geo.glass} material={glass} name="top" renderOrder={4} />
      <mesh geometry={geo.base} material={mat.mahogany} />
      <mesh geometry={geo.plinth} material={mat.brass} />
    </group>
  );
}

/**
 * O que ficou largado na mesa, como quem acabou de chegar: cinzeiro
 * cromado com charuto, isqueiro, relógio de pulso cromado (sem caixa),
 * uma corrente de ouro solta, o perfume de metal com a bala e as cartas
 * (lugar das cartas colecionáveis). Tudo apoiado no tampo.
 */
function TableClutter() {
  const { mat } = lib();
  const geo = useMemo(() => {
    // corrente de ouro largada em curvas no tampo
    const chainPath = new THREE.CatmullRomCurve3(
      [
        [0.0, 0.003, 0.0],
        [0.05, 0.003, 0.03],
        [0.09, 0.003, 0.0],
        [0.07, 0.003, -0.05],
        [0.02, 0.003, -0.04],
        [0.0, 0.003, -0.08],
        [0.04, 0.003, -0.12],
        [0.11, 0.003, -0.1],
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    // pulseira de elos: pequenos blocos em volta de um oval deitado
    const links: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 26; k++) {
      const a = (k / 26) * Math.PI * 2;
      links.push(
        box([0.012, 0.004, 0.018], [0.045 + Math.cos(a) * 0.04, 0.004, Math.sin(a) * 0.03], {
          rot: [0, -a, 0],
        }),
      );
    }
    return {
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
          { seg: 20 },
        ),
        30,
      ),
      ash: new THREE.CircleGeometry(0.035, 10).rotateX(-HALF_PI).translate(0.008, 0.0095, 0),
      cigar: cyl(0.008, 0.008, 0.11, [0.02, 0.036, 0.01], { seg: 8, rot: [0.14, 0.4, HALF_PI] }),
      ember: cyl(0.0082, 0.0082, 0.012, [-0.036, 0.036, 0.034], {
        seg: 8,
        rot: [0.14, 0.4, HALF_PI],
      }),
      lighter: crease(box([0.038, 0.058, 0.014], [0, 0.007, 0], { rot: [HALF_PI, 0, 0] }), 30),
      card: new THREE.PlaneGeometry(0.063, 0.088).rotateX(-HALF_PI),
      watchCase: cyl(0.021, 0.021, 0.012, [0, 0.009, 0], { seg: 24 }),
      watchBezel: new THREE.TorusGeometry(0.019, 0.0028, 6, 24)
        .rotateX(HALF_PI)
        .translate(0, 0.015, 0),
      watchFace: new THREE.CircleGeometry(0.0165, 24).rotateX(-HALF_PI).translate(0, 0.0152, 0),
      watchLinks: merge(links),
      chain: new THREE.TubeGeometry(chainPath, 60, 0.0026, 5, false),
    };
  }, []);
  const cards = useMemo(() => {
    const face = (suit: string, rank: string, red: boolean) =>
      new THREE.MeshStandardMaterial({
        map: tex(
          makeCanvas(128, 180, (c, w, h) => paintCardFace(c, w, h, suit, rank, red)),
          { clamp: true },
        ),
        roughness: 0.5,
        envMapIntensity: 0.4,
      });
    return [
      face('♠', 'A', false),
      face('♥', 'K', true),
      face('♣', '7', false),
      new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(128, 180, paintCardBack), { clamp: true }),
        roughness: 0.5,
        envMapIntensity: 0.4,
      }),
    ];
  }, []);
  const dial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0f1a33', roughness: 0.15, metalness: 0.2 }),
    [],
  );
  const cardSpots: [number, number, number][] = [
    [0.5, 0.05, 0.4],
    [0.56, 0.13, -0.3],
    [0.46, 0.17, 1.2],
    [0.62, -0.02, 2.1],
  ];
  return (
    <group position={[0, TOP, 0]}>
      <group position={[0.38, 0.001, -0.22]} rotation={[0, 0.7, 0]} name="ashtray">
        <mesh geometry={geo.ashtray} material={mat.chrome} />
        <mesh geometry={geo.ash} material={mat.ash} />
        <mesh geometry={geo.cigar} material={mat.cigar} />
        <mesh geometry={geo.ember} material={mat.cigarEmber} />
      </group>
      <mesh
        geometry={geo.lighter}
        material={mat.chrome}
        position={[0.2, 0.001, -0.33]}
        rotation={[0, 1.1, 0]}
      />
      <group position={[0.04, 0.001, 0.12]} rotation={[0, -0.6, 0]} name="watch">
        <mesh geometry={geo.watchLinks} material={mat.chrome} />
        <mesh geometry={geo.watchCase} material={mat.chrome} />
        <mesh geometry={geo.watchBezel} material={mat.chrome} />
        <mesh geometry={geo.watchFace} material={dial} />
      </group>
      <mesh geometry={geo.chain} material={mat.brass} position={[-0.56, 0.001, 0.14]} />
      <group position={[0.25, 0.001, 0.2]} rotation={[0, 0.4, 0]} name="perfume-table">
        <GhostPerfume />
      </group>
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
 * Luminária de chão de arco cromada, atrás do canto do sofá (longe do
 * bar e da passagem): a haste faz a curva por cima do encosto e a cúpula
 * acesa ilumina a sala de um jeito suave, sem holofote na mesa.
 */
function ArcLamp() {
  const { mat } = lib();
  const [bx, , bz] = SPOT.arcLamp;
  // a haste se curva por cima do canto do sofá, para dentro da sala
  const aimX = 2.25;
  const aimZ = 1.85;
  const yaw = Math.atan2(aimX - bx, aimZ - bz);
  const reach = 1.95;
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
        <pointLight
          position={[0, -0.25, 0]}
          color="#ffc58a"
          intensity={34}
          distance={9}
          decay={1.6}
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
      {/* luvas largadas no assento do lado sul, perto da ponta do sofá */}
      <group position={[-0.5, -PIT.depth + 0.47, PIT.z1 - 0.55]} rotation={[0, 0.3, 0]}>
        <LooseGloves />
      </group>
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
          <planeGeometry args={[1.9, 1.3]} />
        </mesh>
      </group>
      <group position={[ax, ay, az]} rotation={[0, armYaw, 0]}>
        <OptionalModel file="armchair.glb">
          <ClubChair />
        </OptionalModel>
        <group position={[0.0, 0.555, 0.08]} rotation={[0, 0.2, 0]}>
          <ArmchairKimono />
        </group>
        <mesh position={[0, 0.005, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[1.5, 1.5]} />
        </mesh>
      </group>
      <ArcLamp />
    </group>
  );
}
