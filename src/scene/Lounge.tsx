import { useMemo } from 'react';
import * as THREE from 'three';
import { SPOT } from '../config/layout';
import { CarKeys } from '../objects/CarKeys';
import { Magazines } from '../objects/Magazines';
import { lib } from '../textures/library';
import { box, crease, cyl, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';

const deg = (d: number) => (d * Math.PI) / 180;
const HALF_PI = Math.PI / 2;

/** Mesmo material, mas visível dos dois lados (peças feitas por revolução). */
function useTwoSided<T extends THREE.Material>(material: T): T {
  return useMemo(() => {
    const copy = material.clone() as T;
    copy.side = THREE.DoubleSide;
    return copy;
  }, [material]);
}

/**
 * Sofá curvo de couro vinho (3,20 × 0,80 × 1,80 m): um perfil de assento
 * e encosto girado num arco de 90 graus em volta da mesa. O capitonê do
 * encosto e as costuras das almofadas são pintados na textura.
 */
function Sofa() {
  const { mat } = lib();
  const plain = useTwoSided(mat.leatherWine);
  const tufted = useTwoSided(mat.leatherWineTuft);
  const seat = useTwoSided(mat.leatherWineSeat);
  const arc = { start: deg(45), length: deg(90), seg: 26 };

  const geo = useMemo(() => {
    const a = { start: deg(45), length: deg(90), seg: 26 };
    return {
      body: lathe(
        [
          [2.37, 0],
          [2.37, 0.42],
          [2.35, 0.74],
          [2.28, 0.81],
          [2.16, 0.8],
        ],
        { ...a, uRepeat: 3.6, vRepeat: 1 },
      ),
      back: lathe(
        [
          [2.16, 0.8],
          [2.1, 0.75],
          [2.03, 0.45],
        ],
        { ...a, uRepeat: 7, vRepeat: 1 },
      ),
      seat: lathe(
        [
          [2.03, 0.45],
          [1.97, 0.43],
          [1.54, 0.45],
          [1.475, 0.41],
          [1.455, 0.33],
        ],
        { ...a, uRepeat: 4, vRepeat: 1 },
      ),
      skirt: lathe(
        [
          [1.455, 0.33],
          [1.46, 0.09],
        ],
        { ...a, uRepeat: 2.6, vRepeat: 0.3 },
      ),
      plinth: lathe(
        [
          [1.5, 0.09],
          [1.5, 0],
        ],
        { ...a, uRepeat: 3, vRepeat: 0.1 },
      ),
      arm: crease(
        merge([
          box([0.22, 0.6, 0.96], [0, 0.3, 0]),
          cyl(0.11, 0.11, 0.96, [0, 0.6, 0], { seg: 14, rot: [HALF_PI, 0, 0] }),
        ]),
        50,
      ),
      pillow: new THREE.SphereGeometry(1, 12, 8),
    };
  }, []);

  const ends = [arc.start, arc.start + arc.length];
  const pillows = [deg(66), deg(110)];
  return (
    <group name="sofa_curved">
      <mesh geometry={geo.body} material={plain} />
      <mesh geometry={geo.back} material={tufted} />
      <mesh geometry={geo.seat} material={seat} />
      <mesh geometry={geo.skirt} material={plain} />
      <mesh geometry={geo.plinth} material={mat.mahoganyDark} />
      {ends.map((phi) => (
        <mesh
          key={phi}
          geometry={geo.arm}
          material={mat.leatherWine}
          position={[Math.sin(phi) * 1.915, 0, Math.cos(phi) * 1.915]}
          rotation={[0, phi, 0]}
        />
      ))}
      {pillows.map((phi) => (
        <mesh
          key={phi}
          geometry={geo.pillow}
          material={mat.fabricGold}
          position={[Math.sin(phi) * 1.93, 0.62, Math.cos(phi) * 1.93]}
          rotation={[0.28, phi + Math.PI, 0.3, 'YXZ']}
          scale={[0.21, 0.21, 0.085]}
        />
      ))}
    </group>
  );
}

/** Poltrona de couro marrom com encosto em barril e capitonê. */
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
          cyl(0.078, 0.078, 0.84, [Math.sin(phi) * 0.37, 0.44, Math.cos(phi) * 0.37], { seg: 12 }),
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

/** Copo de uísque com gelo e cinzeiro com um charuto. */
function GlassAndAshtray() {
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
      whisky: cyl(0.0375, 0.0345, 0.03, [0, 0.02, 0], { seg: 16 }),
      ice: merge([
        box([0.022, 0.022, 0.022], [0.008, 0.042, 0.004], { rot: [0.4, 0.5, 0.2] }),
        box([0.02, 0.02, 0.02], [-0.01, 0.046, -0.006], { rot: [0.2, 1.1, 0.6] }),
      ]),
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
      cigar: cyl(0.008, 0.008, 0.11, [0.02, 0.036, 0.01], { seg: 8, rot: [0.14, 0.4, HALF_PI] }),
      ember: cyl(0.0082, 0.0082, 0.012, [-0.036, 0.036, 0.034], {
        seg: 8,
        rot: [0.14, 0.4, HALF_PI],
      }),
    }),
    [],
  );
  const glass = useTwoSided(mat.clearGlass);
  return (
    <>
      <group position={[0.27, 0.42, -0.2]} name="glass">
        <mesh geometry={geo.whisky} material={mat.whisky} />
        <mesh geometry={geo.ice} material={mat.ice} name="ice" />
        <mesh geometry={geo.glass} material={glass} renderOrder={6} />
      </group>
      <group position={[-0.1, 0.42, -0.3]} name="ashtray">
        <mesh geometry={geo.ashtray} material={mat.marble} />
        <mesh geometry={geo.cigar} material={mat.cigar} />
        <mesh geometry={geo.ember} material={mat.paper} />
      </group>
    </>
  );
}

/**
 * Sala rebaixada: sofá curvo de frente para o cantinho dos discos, mesa
 * redonda com revistas, chaves e copo, e a poltrona.
 */
export function Lounge() {
  const { mat } = lib();
  const [tx, ty, tz] = SPOT.table;
  const [ax, ay, az] = SPOT.armchair;
  return (
    <group name="lounge">
      <group position={[tx, ty, tz]}>
        <OptionalModel file="sofa_curved.glb">
          <Sofa />
        </OptionalModel>
        <OptionalModel file="coffee_table.glb">
          <CoffeeTable />
        </OptionalModel>
        <Magazines />
        <CarKeys />
        <GlassAndAshtray />
        {/* sombras de contato */}
        <mesh position={[0, 0.005, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[1.7, 1.7]} />
        </mesh>
        <mesh
          position={[1.95, 0.005, 0]}
          rotation={[-HALF_PI, 0, 0]}
          material={mat.shadow}
          scale={[1, 2.6, 1]}
        >
          <planeGeometry args={[1.7, 1.7]} />
        </mesh>
      </group>
      <group position={[ax, ay, az]} rotation={[0, 2.3, 0]}>
        <OptionalModel file="armchair.glb">
          <Armchair />
        </OptionalModel>
        <mesh position={[0, 0.005, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[1.5, 1.5]} />
        </mesh>
      </group>
    </group>
  );
}
