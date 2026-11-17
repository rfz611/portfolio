import { useMemo } from 'react';
import { crease, cyl, lathe, merge } from '../scene/geo';
import { lib } from '../textures/library';

/** Perfil do pé de latão (raio, altura), em gomos como nos abajures dos anos 80. */
const BASE: [number, number][] = [
  [0.001, 0],
  [0.088, 0],
  [0.092, 0.014],
  [0.062, 0.03],
  [0.034, 0.05],
  [0.05, 0.085],
  [0.074, 0.14],
  [0.078, 0.19],
  [0.058, 0.25],
  [0.03, 0.29],
  [0.021, 0.34],
  [0.027, 0.352],
  [0.013, 0.362],
  [0.013, 0.47],
];

/**
 * Abajur (0,35 × 0,70 × 0,35 m) sobre uma mesinha redonda de apoio.
 * A cúpula é uma fonte de luz: brilha sozinha e alimenta o bloom.
 */
export function Lamp({ position }: { position: readonly [number, number, number] }) {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      table: crease(
        merge([
          cyl(0.25, 0.25, 0.03, [0, 0.5, 0], { seg: 24, uv: 0.5 }),
          cyl(0.035, 0.05, 0.45, [0, 0.26, 0], { seg: 12, uv: 0.5 }),
          cyl(0.15, 0.18, 0.035, [0, 0.0175, 0], { seg: 20, uv: 0.5 }),
        ]),
      ),
      rim: cyl(0.254, 0.254, 0.012, [0, 0.5, 0], { seg: 24, open: true }),
      base: crease(lathe(BASE, { seg: 20 }), 38),
      shade: lathe(
        [
          [0.175, 0.42],
          [0.112, 0.7],
        ],
        { seg: 24, uRepeat: 3 },
      ),
      bulb: cyl(0.03, 0.03, 0.08, [0, 0.53, 0], { seg: 8 }),
    }),
    [],
  );

  return (
    <group position={position}>
      <mesh geometry={geo.table} material={mat.mahogany} />
      <mesh geometry={geo.rim} material={mat.brass} />
      <group position={[0, 0.515, 0]}>
        <mesh geometry={geo.base} material={mat.brass} />
        <mesh geometry={geo.shade} material={mat.lampShade} />
        <mesh geometry={geo.bulb} material={mat.amberBulb} />
        <sprite position={[0, 0.56, 0]} scale={[0.7, 0.7, 1]} material={mat.spriteAmber} />
      </group>
      {/* poça de luz sobre o tampo e sombra de contato no carpete */}
      <mesh position={[0, 0.517, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat.glowAmber}>
        <planeGeometry args={[0.6, 0.6]} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[0.75, 0.75]} />
      </mesh>
    </group>
  );
}
