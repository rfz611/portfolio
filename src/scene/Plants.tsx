import { useMemo } from 'react';
import * as THREE from 'three';
import { SPOT } from '../config/layout';
import { lib } from '../textures/library';
import { mulberry32 } from '../textures/random';
import { crease, cyl, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';

/** Vaso de latão, largo em cima. */
const POT: [number, number][] = [
  [0.001, 0],
  [0.17, 0],
  [0.2, 0.05],
  [0.23, 0.36],
  [0.25, 0.4],
  [0.235, 0.41],
];

/**
 * Folhas são planos com textura recortada (alpha), dobrados ao meio e
 * inclinados para fora: o jeito clássico de fazer planta no PS2.
 */
function leaf(length: number, width: number, bend: number) {
  const g = new THREE.PlaneGeometry(width, length, 2, 4);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / length + 0.5;
    const fold = Math.abs(p.getX(i)) / (width / 2);
    p.setZ(i, -t * t * bend + fold * width * 0.18);
  }
  g.translate(0, length / 2, 0);
  g.computeVertexNormals();
  return g;
}

function buildPlant(kind: 'palm' | 'monstera') {
  const r = mulberry32(kind === 'palm' ? 31 : 37);
  const leaves: THREE.BufferGeometry[] = [];
  const stems: THREE.BufferGeometry[] = [];
  const count = kind === 'palm' ? 13 : 9;
  for (let i = 0; i < count; i++) {
    const yaw = (i / count) * Math.PI * 2 + r() * 0.4;
    const tilt = kind === 'palm' ? 0.35 + r() * 0.75 : 0.5 + r() * 0.6;
    const height = kind === 'palm' ? 0.9 + r() * 0.45 : 0.45 + r() * 0.35;
    const g =
      kind === 'palm' ? leaf(0.85 + r() * 0.3, 0.5, 0.35) : leaf(0.42 + r() * 0.1, 0.4, 0.12);
    g.rotateX(-tilt);
    g.rotateY(yaw);
    g.translate(0, height, 0);
    leaves.push(g);
    const stem = cyl(0.008, 0.012, height, [0, height / 2, 0], { seg: 5 });
    stem.rotateX(-tilt * 0.35);
    stem.rotateY(yaw);
    stems.push(stem);
  }
  return { leaves: merge(leaves), stems: merge(stems) };
}

function Plant({ kind }: { kind: 'palm' | 'monstera' }) {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      pot: crease(lathe(POT, { seg: 20 }), 30),
      soil: cyl(0.225, 0.225, 0.01, [0, 0.39, 0], { seg: 20 }),
      ...buildPlant(kind),
    }),
    [kind],
  );
  const lift = 0.36;
  return (
    <group name={kind}>
      <mesh geometry={geo.pot} material={mat.brass} />
      <mesh geometry={geo.soil} material={mat.soil} />
      <group position={[0, lift, 0]}>
        <mesh geometry={geo.stems} material={mat.stem} />
        <mesh geometry={geo.leaves} material={kind === 'palm' ? mat.palm : mat.monstera} />
      </group>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[0.9, 0.9]} />
      </mesh>
    </group>
  );
}

/** Palmeira perto da passagem e costela-de-adão no canto do vidro. */
export function Plants() {
  return (
    <>
      <group position={SPOT.palm}>
        <OptionalModel file="palm.glb">
          <Plant kind="palm" />
        </OptionalModel>
      </group>
      <group position={SPOT.monstera}>
        <OptionalModel file="monstera.glb">
          <Plant kind="monstera" />
        </OptionalModel>
      </group>
    </>
  );
}
