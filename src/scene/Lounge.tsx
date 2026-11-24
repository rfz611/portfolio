import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PIT, PIT_SEAT, PIT_SOFA_X0, PIT_STEPS, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { CarKeys } from '../objects/CarKeys';
import { LoungeChair, Ottoman, TrayTable } from '../objects/LoungeChair';
import { FilmBooks } from '../objects/ReadingProps';
import { SPOTS } from '../camera/spots';
import { Interactive } from '../objects/Interactive';
import { useScene } from '../store/useScene';
import { LooseGloves } from '../objects/PersonalItems';
import { Magazines } from '../objects/Magazines';
import { JewelryTray, MushroomLamp, RedAshtray } from '../objects/TableSet';
import { makeCanvas, tex } from '../textures/canvas';
import { hdr, lib } from '../textures/library';
import { GhostPerfume } from '../objects/GhostPerfume';
import { paintCardBack, paintCardFace } from '../textures/tableProps';
import { box, crease, cyl, merge } from './geo';
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

/** Tampa das pontas do U: fecha o perfil do sofá (senão dá pra ver o oco por dentro). */
function sofaEndCaps() {
  const pts = [
    ...PROFILE.top,
    ...PROFILE.back.slice(1),
    ...PROFILE.seat.slice(1),
    ...PROFILE.skirt.slice(1),
    [PIT_SEAT, 0],
    [-0.08, 0],
  ] as [number, number][];
  const shape = new THREE.Shape(pts.map(([d, h]) => new THREE.Vector2(d, h)));
  const end = (z: number, dir: 1 | -1) => {
    const g = new THREE.ShapeGeometry(shape);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const d = p.getX(i);
      p.setXYZ(i, PIT_SOFA_X0, p.getY(i), z + d * dir);
    }
    g.computeVertexNormals();
    return g;
  };
  return merge([end(PIT.z0, 1), end(PIT.z1, -1)]);
}

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
      caps: sofaEndCaps(),
      pillow: pillowGeometry(0.44, 0.42, 0.15),
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
      <mesh geometry={geo.caps} material={plain} />
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
          rotation={[0.3, yaw, 0.12, 'YXZ']}
        />
      ))}
    </group>
  );
}

/**
 * Almofada quadrada de veludo: cheia no meio, fina na costura das bordas e
 * com os quatro cantos levemente puxados para fora, como almofada de verdade.
 */
function pillowGeometry(w: number, h: number, t: number) {
  let g: THREE.BufferGeometry = new THREE.BoxGeometry(1, 1, 1, 14, 14, 4);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) * 2;
    const y = p.getY(i) * 2;
    const z = p.getZ(i);
    const puff = Math.sqrt(Math.max(0, (1 - x * x) * (1 - y * y)));
    p.setXYZ(
      i,
      (x / 2) * w * (1 + 0.05 * Math.pow(y, 4)),
      (y / 2) * h * (1 + 0.05 * Math.pow(x, 4)),
      z * t * (0.12 + 0.88 * puff),
    );
    uv[i * 2] = x / 2 + 0.5;
    uv[i * 2 + 1] = y / 2 + 0.5;
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
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
 * O que ficou largado na mesa, como quem acabou de chegar: a luminária-
 * cogumelo acesa na ponta, o porta-joias cromado (carteira, os dois
 * relógios e a corrente de ouro), o cinzeiro vermelho, o perfume de metal
 * com a bala dourada e as cartas. Tudo apoiado no tampo.
 */
function TableClutter() {
  const geo = useMemo(
    () => ({ card: new THREE.PlaneGeometry(0.063, 0.088).rotateX(-HALF_PI) }),
    [],
  );
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
  const cardSpots: [number, number, number][] = [
    [0.6, 0.0, 0.4],
    [0.64, 0.09, -0.3],
    [0.58, 0.12, 1.2],
    [0.67, -0.06, 2.1],
  ];
  return (
    <group position={[0, TOP, 0]}>
      <group position={[-0.6, 0.001, -0.1]} name="table-lamp">
        <MushroomLamp />
      </group>
      <group position={[0.31, 0.001, 0.19]} rotation={[0, 0.18, 0]}>
        <JewelryTray />
      </group>
      <group position={[0.42, 0.001, -0.21]} rotation={[0, 0.5, 0]}>
        <RedAshtray />
      </group>
      <group
        position={[-0.44, 0.027, 0.16]}
        rotation={[-Math.PI / 2, 0, 0.35]}
        scale={1.5}
        name="perfume-table"
      >
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
 * Luminária de chão de arco cromada: base de mármore, haste que sobe e se
 * curva, e a cúpula acesa no fim. Agora fica no canto da poltrona, com a
 * cúpula por cima de quem senta: uma luz de leitura, só naquele canto.
 */
function ArcLamp({
  base,
  aim,
  height,
}: {
  base: [number, number];
  aim: [number, number];
  height: number;
}) {
  const { mat } = lib();
  const [bx, bz] = base;
  const yaw = Math.atan2(aim[0] - bx, aim[1] - bz);
  const reach = Math.hypot(aim[0] - bx, aim[1] - bz);
  const geo = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.1, 0),
      new THREE.Vector3(0, height + 0.1, 0),
      new THREE.Vector3(0, height + 0.42, reach * 0.7),
      new THREE.Vector3(0, height, reach),
    );
    return {
      base: box([0.3, 0.12, 0.3], [0, 0.06, 0]),
      stem: new THREE.TubeGeometry(curve, 40, 0.011, 8, false),
      dome: new THREE.SphereGeometry(0.17, 20, 10, 0, Math.PI * 2, 0, HALF_PI).translate(
        0,
        -0.05,
        0,
      ),
      cap: cyl(0.02, 0.02, 0.06, [0, 0, 0], { seg: 8 }),
      bulb: new THREE.CircleGeometry(0.13, 16).rotateX(HALF_PI).translate(0, -0.045, 0),
    };
  }, [height, reach]);
  const glow = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr(palette.amber, 1.2), toneMapped: false }),
    [],
  );
  return (
    <group position={[bx, 0, bz]} rotation={[0, yaw, 0]} name="arc-lamp">
      <mesh geometry={geo.base} material={mat.marble} />
      <mesh geometry={geo.stem} material={mat.chrome} />
      <group position={[0, height, reach]}>
        <mesh geometry={geo.dome} material={mat.chrome} />
        <mesh geometry={geo.cap} material={mat.chrome} />
        <mesh geometry={geo.bulb} material={glow} />
        <pointLight
          position={[0, -0.22, 0]}
          color="#ffc58a"
          intensity={9}
          distance={4}
          decay={1.8}
        />
      </group>
      <mesh position={[0, 0.004, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[0.6, 0.6]} />
      </mesh>
    </group>
  );
}

/** Ponto de vista sentado na poltrona lounge. */
const READING_SPOT = SPOTS.findIndex((s) => s.id === 'poltrona');

/** Sala rebaixada: sofá embutido, degraus, tapete persa, mesa de centro e a luminária de arco. */
export function Lounge() {
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const spot = useScene((s) => s.spot);
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
        {/* luvas do Sketchfab, se o arquivo estiver em public/models */}
        <OptionalModel file="gloves.glb" fit={0.34}>
          <LooseGloves />
        </OptionalModel>
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
      {/* canto de leitura: poltrona lounge virada para o rebaixo, o banquinho com
          os livros dos filmes na mesinha de canto e a luminária de arco por cima */}
      <group position={[ax, ay, az]} rotation={[0, armYaw, 0]} name="reading-corner">
        {/* clicar na poltrona: senta nela, olhando a mesinha */}
        <Interactive
          id="lounge"
          label="objects.lounge"
          enabled={home && spot !== READING_SPOT}
          onClick={() => useScene.getState().setSpot(READING_SPOT)}
        >
          <OptionalModel file="armchair.glb">
            <LoungeChair />
          </OptionalModel>
        </Interactive>
        <group position={[0, 0, 0.88]} rotation={[0, Math.PI, 0]}>
          <Ottoman />
        </group>
        <group position={[-0.66, 0, 0.12]}>
          <TrayTable />
          {/* os 3 livros dos filmes empilhados, lombadas viradas para a poltrona */}
          <group position={[-0.03, 0.505, 0.02]}>
            <FilmBooks />
          </group>
        </group>
        <ArcLamp base={[0.12, -0.78]} aim={[0.02, 0.22]} height={1.72} />
        <mesh position={[0, 0.005, 0.3]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[1.8, 2.0]} />
        </mesh>
      </group>
    </group>
  );
}
