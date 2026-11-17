import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, crease, cyl, lathe, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintLeather } from '../textures/surfaces';

const HALF_PI = Math.PI / 2;
const soft = (g: THREE.BufferGeometry) => crease(g, 50);

/** Pé torneado de mogno. */
const turnedFoot = (x: number, z: number) =>
  lathe(
    [
      [0.001, 0],
      [0.022, 0],
      [0.028, 0.025],
      [0.02, 0.05],
      [0.03, 0.08],
      [0.001, 0.08],
    ],
    { seg: 10 },
    [x, 0, z],
  );

/** Couro preto brilhante (liso e capitonê), pintado na hora. */
function useBlackLeather() {
  return useMemo(() => {
    const make = (tufted: boolean) =>
      new THREE.MeshStandardMaterial({
        map: tex(
          makeCanvas(512, 512, (c, w, h) =>
            paintLeather(c, w, h, {
              base: '#1a1a1d',
              seed: tufted ? 301 : 303,
              tufted: tufted ? [3, 2] : undefined,
            }),
          ),
          { repeat: tufted ? [1, 1] : [1.6, 1.6] },
        ),
        roughness: 0.3,
        envMapIntensity: 1.1,
      });
    return { plain: make(false), tufted: make(true) };
  }, []);
}

/**
 * Poltrona club de couro preto (0,90 × 0,88 × 0,90 m), de frente para +z:
 * base estofada, almofada de assento, braços rolados, encosto capitonê
 * com rolo em cima e pés torneados.
 */
export function ClubChair() {
  const { mat } = lib();
  const black = useBlackLeather();
  const geo = useMemo(
    () => ({
      body: soft(
        merge([
          box([0.84, 0.34, 0.84], [0, 0.25, 0]),
          box([0.15, 0.26, 0.84], [-0.355, 0.55, 0]),
          box([0.15, 0.26, 0.84], [0.355, 0.55, 0]),
          cyl(0.095, 0.095, 0.86, [-0.37, 0.68, 0.0], { seg: 14, rot: [HALF_PI, 0, 0] }),
          cyl(0.095, 0.095, 0.86, [0.37, 0.68, 0.0], { seg: 14, rot: [HALF_PI, 0, 0] }),
          cyl(0.1, 0.1, 0.86, [0, 0.92, -0.37], { seg: 14, rot: [0, 0, HALF_PI] }),
        ]),
      ),
      back: soft(box([0.62, 0.5, 0.16], [0, 0.68, -0.32], { rot: [-0.12, 0, 0] })),
      seat: soft(box([0.56, 0.13, 0.62], [0, 0.485, 0.06])),
      feet: merge([
        turnedFoot(-0.36, 0.36),
        turnedFoot(0.36, 0.36),
        turnedFoot(-0.36, -0.36),
        turnedFoot(0.36, -0.36),
      ]),
      trim: box([0.86, 0.012, 0.012], [0, 0.095, 0.422]),
    }),
    [],
  );
  return (
    <group name="armchair">
      <group position={[0, 0.0, 0]}>
        <mesh geometry={geo.body} material={black.plain} />
        <mesh geometry={geo.back} material={black.tufted} />
        <mesh geometry={geo.seat} material={black.plain} />
        <mesh geometry={geo.trim} material={mat.brass} />
      </group>
      <mesh geometry={geo.feet} material={mat.mahogany} />
    </group>
  );
}

/**
 * Cadeira de diretor, de frente para +z: assento arredondado, encosto em
 * concha (curvo, abraçando as costas) com capitonê e rolo no topo, braços
 * redondos e base giratória cromada de cinco patas.
 */
export function ExecutiveChair() {
  const { mat } = lib();
  const black = useBlackLeather();
  const geo = useMemo(() => {
    const legs: THREE.BufferGeometry[] = [];
    const wheels: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      legs.push(
        box([0.045, 0.03, 0.3], [Math.sin(a) * 0.15, 0.07, Math.cos(a) * 0.15], {
          rot: [0, a, 0],
        }),
      );
      wheels.push(
        cyl(0.026, 0.026, 0.028, [Math.sin(a) * 0.29, 0.026, Math.cos(a) * 0.29], {
          seg: 10,
          rot: [0, a, HALF_PI],
        }),
      );
    }
    // concha do encosto: arco de ~150° atrás do assento
    const arc = { start: Math.PI * 0.58, length: Math.PI * 0.84, seg: 22 };
    return {
      metal: merge([
        ...legs,
        cyl(0.028, 0.028, 0.3, [0, 0.24, 0], { seg: 12 }),
        cyl(0.12, 0.12, 0.02, [0, 0.4, 0], { seg: 16 }),
        cyl(0.012, 0.012, 0.18, [-0.29, 0.56, 0.05], { seg: 8 }),
        cyl(0.012, 0.012, 0.18, [0.29, 0.56, 0.05], { seg: 8 }),
      ]),
      wheels: merge(wheels),
      seat: new RoundedBoxGeometry(0.54, 0.12, 0.52, 3, 0.05).translate(0, 0.48, 0.04),
      shellOuter: lathe(
        [
          [0.31, 0.46],
          [0.33, 0.7],
          [0.33, 1.0],
          [0.3, 1.18],
        ],
        { ...arc, uRepeat: 2 },
      ),
      shellInner: lathe(
        [
          [0.26, 0.54],
          [0.27, 0.75],
          [0.27, 1.0],
          [0.25, 1.14],
        ],
        { ...arc, uRepeat: 2.4, vRepeat: 1.2 },
      ),
      rim: lathe(
        [
          [0.25, 1.14],
          [0.27, 1.21],
          [0.3, 1.18],
        ],
        { ...arc, uRepeat: 2 },
      ),
      arms: merge([
        new THREE.CapsuleGeometry(0.04, 0.32, 6, 12).rotateX(HALF_PI).translate(-0.29, 0.67, 0.02),
        new THREE.CapsuleGeometry(0.04, 0.32, 6, 12).rotateX(HALF_PI).translate(0.29, 0.67, 0.02),
      ]),
    };
  }, []);
  const twoSided = useMemo(() => {
    const plain = black.plain.clone();
    plain.side = THREE.DoubleSide;
    const tufted = black.tufted.clone();
    tufted.side = THREE.DoubleSide;
    return { plain, tufted };
  }, [black]);
  return (
    <group name="chair">
      <mesh geometry={geo.metal} material={mat.chrome} />
      <mesh geometry={geo.wheels} material={mat.rubber} />
      <mesh geometry={geo.seat} material={black.plain} />
      <mesh geometry={geo.shellOuter} material={twoSided.plain} />
      <mesh geometry={geo.shellInner} material={twoSided.tufted} />
      <mesh geometry={geo.rim} material={twoSided.plain} />
      <mesh geometry={geo.arms} material={black.plain} />
    </group>
  );
}
