import { useMemo } from 'react';
import * as THREE from 'three';
import { box, crease, cyl, lathe, merge } from '../scene/geo';
import { lib } from '../textures/library';

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

/**
 * Poltrona club de couro marrom (0,90 × 0,88 × 0,90 m), de frente para +z:
 * base estofada, almofada de assento, braços rolados, encosto capitonê
 * com rolo em cima e pés torneados.
 */
export function ClubChair() {
  const { mat } = lib();
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
        <mesh geometry={geo.body} material={mat.leatherBrown} />
        <mesh geometry={geo.back} material={mat.leatherBrownTuft} />
        <mesh geometry={geo.seat} material={mat.leatherBrown} />
        <mesh geometry={geo.trim} material={mat.brass} />
      </group>
      <mesh geometry={geo.feet} material={mat.mahogany} />
    </group>
  );
}

/**
 * Cadeira de diretor chesterfield, de frente para +z: encosto alto
 * capitonê com rolo, braços rolados e base giratória de cinco patas.
 */
export function ExecutiveChair() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const legs: THREE.BufferGeometry[] = [];
    const wheels: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      legs.push(
        box([0.05, 0.035, 0.32], [Math.sin(a) * 0.16, 0.075, Math.cos(a) * 0.16], {
          rot: [0, a, 0],
        }),
      );
      wheels.push(
        cyl(0.028, 0.028, 0.03, [Math.sin(a) * 0.3, 0.028, Math.cos(a) * 0.3], {
          seg: 8,
          rot: [0, a, HALF_PI],
        }),
      );
    }
    return {
      metal: merge([...legs, cyl(0.03, 0.03, 0.3, [0, 0.24, 0], { seg: 10 })]),
      wheels: merge(wheels),
      shell: soft(
        merge([
          box([0.66, 0.16, 0.58], [0, 0.46, 0.0]),
          box([0.1, 0.16, 0.56], [-0.33, 0.62, 0.0]),
          box([0.1, 0.16, 0.56], [0.33, 0.62, 0.0]),
          cyl(0.065, 0.065, 0.58, [-0.33, 0.71, 0.0], { seg: 12, rot: [HALF_PI, 0, 0] }),
          cyl(0.065, 0.065, 0.58, [0.33, 0.71, 0.0], { seg: 12, rot: [HALF_PI, 0, 0] }),
          box([0.66, 0.78, 0.12], [0, 0.98, -0.3], { rot: [-0.14, 0, 0] }),
          cyl(0.08, 0.08, 0.68, [0, 1.38, -0.36], { seg: 12, rot: [0, 0, HALF_PI] }),
        ]),
      ),
      back: soft(box([0.5, 0.62, 0.08], [0, 0.97, -0.235], { rot: [-0.14, 0, 0] })),
      seat: soft(box([0.5, 0.1, 0.5], [0, 0.57, 0.03])),
    };
  }, []);
  return (
    <group name="chair">
      <mesh geometry={geo.metal} material={mat.chrome} />
      <mesh geometry={geo.wheels} material={mat.rubber} />
      <mesh geometry={geo.shell} material={mat.leatherBrown} />
      <mesh geometry={geo.back} material={mat.leatherBrownTuft} />
      <mesh geometry={geo.seat} material={mat.leatherBrown} />
    </group>
  );
}
