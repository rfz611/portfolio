import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, crease, cyl, lathe, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { paintFoldedGi } from '../textures/gi';
import { hdr, lib } from '../textures/library';
import { paintLeather } from '../textures/surfaces';
import { Interactive } from './Interactive';

const HALF_PI = Math.PI / 2;

/**
 * Placa curva (casca de compensado ou almofada): largura em x, altura em y,
 * espessura em z; as laterais se curvam para a frente (+z), abraçando quem senta.
 */
function curvedPlate(w: number, h: number, t: number, wrap: number, segX = 16) {
  const g = new THREE.BoxGeometry(w, h, t, segX, 4, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / (w / 2);
    p.setZ(i, p.getZ(i) + wrap * u * u);
  }
  g.computeVertexNormals();
  return g;
}

/** Placa deitada (assento): a curva das laterais vira para cima. */
const flatPlate = (w: number, d: number, t: number, wrap: number) =>
  curvedPlate(w, d, t, wrap).rotateX(-HALF_PI);

function useLeather() {
  return useMemo(() => {
    const make = (tufted: boolean) =>
      new THREE.MeshStandardMaterial({
        map: tex(
          makeCanvas(512, 512, (c, w, h) =>
            paintLeather(c, w, h, {
              base: '#17171a',
              seed: tufted ? 311 : 313,
              tufted: tufted ? [3, 2] : undefined,
            }),
          ),
          { repeat: [1, 1] },
        ),
        roughness: 0.28,
        envMapIntensity: 1.2,
      });
    return { plain: make(false), tufted: make(true) };
  }, []);
}

/** Base giratória de alumínio preto com bordas polidas: n pernas em estrela. */
function starBase(legs: number, reach: number, column: number) {
  const parts: THREE.BufferGeometry[] = [cyl(0.032, 0.04, column, [0, column / 2 + 0.03, 0])];
  for (let k = 0; k < legs; k++) {
    const a = (k / legs) * Math.PI * 2 + Math.PI / legs;
    const leg = box([0.05, 0.03, reach], [0, 0.05, reach / 2], { rot: [0.06, 0, 0] });
    leg.rotateY(a);
    parts.push(leg);
    parts.push(
      cyl(0.018, 0.02, 0.02, [Math.sin(a) * reach, 0.01, Math.cos(a) * reach], { seg: 10 }),
    );
  }
  return crease(merge(parts), 30);
}

/**
 * Poltrona lounge de couro preto com casca de compensado de jacarandá
 * (0,84 × 0,84 × 0,84 m), de frente para +z: assento, encosto e apoio de
 * cabeça em cascas curvas com almofadas capitonê, braços de couro e base
 * giratória de cinco pernas.
 */
export function LoungeChair() {
  const { mat } = lib();
  const leather = useLeather();
  const geo = useMemo(
    () => ({
      base: starBase(5, 0.36, 0.2),
      seatShell: flatPlate(0.66, 0.56, 0.024, 0.07),
      seatCushion: flatPlate(0.6, 0.53, 0.1, 0.05).translate(0, 0.062, 0.01),
      backShell: curvedPlate(0.66, 0.5, 0.024, 0.08),
      backCushion: curvedPlate(0.58, 0.46, 0.1, 0.06).translate(0, 0, 0.062),
      headShell: curvedPlate(0.6, 0.3, 0.024, 0.07),
      headCushion: curvedPlate(0.54, 0.27, 0.095, 0.05).translate(0, 0, 0.06),
      armPad: (() => {
        const g = new RoundedBoxGeometry(0.085, 0.05, 0.44, 3, 0.022).toNonIndexed();
        g.clearGroups();
        return g;
      })(),
      armPost: box([0.03, 0.2, 0.05], [0, -0.1, 0]),
      spine: merge([
        box([0.05, 0.03, 0.34], [0.12, 0.31, -0.12], { rot: [0.5, 0, 0] }),
        box([0.05, 0.03, 0.34], [-0.12, 0.31, -0.12], { rot: [0.5, 0, 0] }),
      ]),
    }),
    [],
  );
  const wood = mat.mahogany;
  return (
    <group name="lounge-chair">
      <mesh geometry={geo.base} material={mat.darkMetal} />
      <mesh geometry={geo.spine} material={mat.darkMetal} />
      <group position={[0, 0.36, 0.06]} rotation={[-0.12, 0, 0]}>
        <mesh geometry={geo.seatShell} material={wood} />
        <mesh geometry={geo.seatCushion} material={leather.tufted} />
      </group>
      <group position={[0, 0.68, -0.25]} rotation={[-0.36, 0, 0]}>
        <mesh geometry={geo.backShell} material={wood} />
        <mesh geometry={geo.backCushion} material={leather.tufted} />
      </group>
      <group position={[0, 1.02, -0.4]} rotation={[-0.52, 0, 0]}>
        <mesh geometry={geo.headShell} material={wood} />
        <mesh geometry={geo.headCushion} material={leather.tufted} />
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.36, 0.6, 0.0]} rotation={[0.08, side * -0.06, 0]}>
          <mesh geometry={geo.armPad} material={leather.plain} />
          <mesh geometry={geo.armPost} material={mat.darkMetal} position={[0, 0, -0.12]} />
        </group>
      ))}
    </group>
  );
}

/** Banquinho para os pés que acompanha a poltrona (base de quatro pernas). */
export function Ottoman() {
  const { mat } = lib();
  const leather = useLeather();
  const geo = useMemo(
    () => ({
      base: starBase(4, 0.27, 0.15),
      shell: flatPlate(0.6, 0.5, 0.024, 0.06),
      cushion: flatPlate(0.56, 0.47, 0.09, 0.04).translate(0, 0.057, 0),
    }),
    [],
  );
  return (
    <group name="ottoman">
      <mesh geometry={geo.base} material={mat.darkMetal} />
      <group position={[0, 0.32, 0]} rotation={[-0.06, 0, 0]}>
        <mesh geometry={geo.shell} material={mat.mahogany} />
        <mesh geometry={geo.cushion} material={leather.tufted} />
      </group>
    </group>
  );
}

/**
 * Kimono de jiu-jitsu dobrado em cima do banquinho, aberto: a gola em V
 * mostra a camada de dentro e a faixa preta dando a volta e
 * amarrada em cima, com as duas pontas caindo.
 */
export function FoldedGi() {
  const geo = useMemo(() => {
    const block = new RoundedBoxGeometry(0.36, 0.075, 0.27, 3, 0.02).toNonIndexed();
    block.clearGroups();
    return {
      block: block.translate(0, 0.0375, 0),
      // gola dobrada por cima, uma faixa mais grossa ao longo da frente
      // gola aberta em V: as duas lapelas grossas saem da nuca (atrás) e se
      // afastam para a frente, mostrando a camada de dentro do kimono
      collar: merge(
        [1, -1].map((side) => {
          const g = new RoundedBoxGeometry(0.05, 0.014, 0.28, 2, 0.006).toNonIndexed();
          g.clearGroups();
          return g.rotateY(side * 0.45).translate(side * 0.062, 0.081, 0.004);
        }),
      ),
      inside: new THREE.ShapeGeometry(
        new THREE.Shape([
          new THREE.Vector2(0, 0.12),
          new THREE.Vector2(-0.1, -0.125),
          new THREE.Vector2(0.1, -0.125),
        ]),
      )
        .rotateX(-HALF_PI)
        .translate(0, 0.0758, 0),
      belt: merge([
        box([0.045, 0.004, 0.276], [0.02, 0.077, 0]),
        box([0.045, 0.079, 0.004], [0.02, 0.0375, 0.137]),
        box([0.045, 0.079, 0.004], [0.02, 0.0375, -0.137]),
      ]),
      knot: crease(box([0.06, 0.022, 0.05], [0.02, 0.088, 0.0], { rot: [0, 0.5, 0] }), 30),
      tails: merge([
        box([0.042, 0.006, 0.17], [-0.04, 0.083, 0.05], { rot: [0.05, 0.55, 0] }),
        box([0.042, 0.006, 0.16], [0.09, 0.083, 0.06], { rot: [0.05, -0.35, 0] }),
      ]),
    };
  }, []);
  const mats = useMemo(() => {
    const map = tex(makeCanvas(256, 256, paintFoldedGi), { clamp: true });
    return {
      cloth: new THREE.MeshStandardMaterial({ map, roughness: 0.92, envMapIntensity: 0.3 }),
      inside: new THREE.MeshStandardMaterial({
        map,
        color: '#b9b2a6',
        roughness: 0.95,
        envMapIntensity: 0.2,
      }),
      belt: new THREE.MeshStandardMaterial({
        color: '#121113',
        roughness: 0.75,
        envMapIntensity: 0.3,
      }),
    };
  }, []);
  return (
    <Interactive id="kimono" label="objects.kimono">
      <group name="folded-gi">
        <mesh geometry={geo.block} material={mats.cloth} />
        <mesh geometry={geo.inside} material={mats.inside} />
        <mesh geometry={geo.collar} material={mats.cloth} />
        <mesh geometry={geo.belt} material={mats.belt} />
        <mesh geometry={geo.knot} material={mats.belt} />
        <mesh geometry={geo.tails} material={mats.belt} />
      </group>
    </Interactive>
  );
}

/**
 * Mesinha de canto redonda: bandeja preta de borda alta sobre três pernas
 * finas cromadas, com um copo de uísque e um vidrinho verde em cima.
 */
export function TrayTable() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const legs: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      const leg = cyl(0.008, 0.008, 0.5, [0, 0.25, 0], { seg: 8 });
      leg.rotateZ(0.08);
      leg.translate(Math.sin(a) * 0.17, 0, Math.cos(a) * 0.17);
      legs.push(leg);
    }
    return {
      legs: merge(legs),
      tray: crease(
        lathe(
          [
            [0.001, 0.49],
            [0.21, 0.49],
            [0.225, 0.5],
            [0.228, 0.53],
            [0.218, 0.532],
            [0.214, 0.505],
            [0.001, 0.505],
          ],
          { seg: 36 },
        ),
        40,
      ),
      glass: lathe(
        [
          [0.001, 0.505],
          [0.036, 0.505],
          [0.037, 0.515],
          [0.04, 0.59],
          [0.037, 0.59],
          [0.034, 0.52],
          [0.001, 0.52],
        ],
        { seg: 20 },
      ),
      drink: cyl(0.033, 0.033, 0.03, [0, 0.536, 0], { seg: 20 }),
      vial: lathe(
        [
          [0.001, 0.505],
          [0.03, 0.505],
          [0.033, 0.55],
          [0.024, 0.6],
          [0.011, 0.615],
          [0.011, 0.64],
          [0.001, 0.64],
        ],
        { seg: 18 },
      ),
    };
  }, []);
  const mats = useMemo(
    () => ({
      black: new THREE.MeshStandardMaterial({
        color: '#0f0f11',
        roughness: 0.18,
        metalness: 0.3,
        envMapIntensity: 1.2,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#e8f0f2',
        transparent: true,
        opacity: 0.32,
        roughness: 0.04,
        envMapIntensity: 2,
        depthWrite: false,
      }),
      drink: new THREE.MeshStandardMaterial({
        color: hdr('#c4721e', 0.9),
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
      }),
      vial: new THREE.MeshStandardMaterial({
        color: '#1f6a42',
        transparent: true,
        opacity: 0.8,
        roughness: 0.08,
        envMapIntensity: 1.8,
      }),
    }),
    [],
  );
  return (
    <group name="tray-table">
      <mesh geometry={geo.legs} material={mat.chrome} />
      <mesh geometry={geo.tray} material={mats.black} />
      <group position={[-0.1, 0, -0.07]}>
        <mesh geometry={geo.drink} material={mats.drink} />
        <mesh geometry={geo.glass} material={mats.glass} renderOrder={3} />
      </group>
      <mesh geometry={geo.vial} material={mats.vial} position={[0.12, 0, -0.1]} />
    </group>
  );
}
