import { useMemo } from 'react';
import * as THREE from 'three';
import { playIce } from '../audio/player';
import { ROOM, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { BarService } from '../objects/BarService';
import { Interactive } from '../objects/Interactive';
import { useScene } from '../store/useScene';
import { lib } from '../textures/library';
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

/** Garrafas espalhadas numa prateleira (largura em x, a partir do centro). */
function bottles(seed: number, y: number, z: number, width: number, count: number) {
  const r = mulberry32(seed);
  const glass: THREE.BufferGeometry[][] = [[], [], []];
  const labels: THREE.BufferGeometry[] = [];
  const caps: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const shape = BOTTLES[Math.floor(r() * 3)];
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
    const tall = SOFFIT_Y - 0.95;
    const levels = [
      { y: 0.99, n: 7 },
      { y: 1.6, n: 6 },
      { y: 2.2, n: 6 },
    ];
    const sets = levels.map((l, i) => bottles(40 + i, l.y, -0.05, w - 0.5, l.n));
    const doors = [-0.95, -0.32, 0.32, 0.95];
    return {
      cabinet: merge([
        box([w, 0.95, 0.5], [0, 0.475, 0]),
        box([0.14, tall, 0.5], [-w / 2 + 0.07, 0.95 + tall / 2, 0], { swap: true }),
        box([0.14, tall, 0.5], [w / 2 - 0.07, 0.95 + tall / 2, 0], { swap: true }),
        box([0.08, tall, 0.3], [0, 0.95 + tall / 2, -0.1], { swap: true }),
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
    const rail = new THREE.CatmullRomCurve3(
      arcPath(ARC.r + 0.42, 30).map(([x, z]) => new THREE.Vector3(x, 0.2, z)),
    );
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
    };
  }, []);
  return (
    <group name="bar">
      <mesh geometry={geo.front} material={mat.mahogany} />
      <mesh geometry={geo.bands} material={mat.brass} />
      <mesh geometry={geo.kick} material={mat.blackPlastic} />
      <mesh geometry={geo.top} material={mat.marble} />
      <mesh geometry={geo.back} material={mat.mahoganyDark} />
      <mesh geometry={geo.neon} material={mat.neonBlue} name="neon" />
      <mesh geometry={geo.rail} material={mat.brass} />
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
      <mesh geometry={geo.spots} material={mat.amberBulb} />
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
