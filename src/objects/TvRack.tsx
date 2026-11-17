import { useMemo } from 'react';
import { box, cyl, merge } from '../scene/geo';
import { lib } from '../textures/library';

/** Rack baixo de mogno (0,90 × 0,45 × 0,45 m) com um aparelho de vídeo e fitas. */
export function TvRack() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      body: merge([
        box([0.94, 0.035, 0.47], [0, 0.4325, 0.005]),
        box([0.9, 0.03, 0.45], [0, 0.075, 0]),
        box([0.84, 0.02, 0.43], [0, 0.26, -0.005]),
        box([0.03, 0.34, 0.45], [-0.435, 0.245, 0], { swap: true }),
        box([0.03, 0.34, 0.45], [0.435, 0.245, 0], { swap: true }),
      ]),
      back: box([0.84, 0.34, 0.012], [0, 0.245, -0.215]),
      legs: merge(
        [-0.4, 0.4].flatMap((x) =>
          [-0.18, 0.18].map((z) => cyl(0.02, 0.013, 0.06, [x, 0.03, z], { seg: 10 })),
        ),
      ),
      deck: box([0.42, 0.085, 0.3], [-0.17, 0.1335, 0.03]),
      tapes: box([0.3, 0.13, 0.2], [0.22, 0.155, 0.02]),
    }),
    [],
  );

  return (
    <group name="tv_rack">
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.back} material={mat.mahoganyDark} />
      <mesh geometry={geo.legs} material={mat.brass} />
      <mesh geometry={geo.deck} material={mat.blackPlastic} />
      <mesh position={[-0.17, 0.1335, 0.1805]} material={mat.deckFront}>
        <planeGeometry args={[0.42, 0.085]} />
      </mesh>
      <mesh geometry={geo.tapes} material={mat.blackPlastic} />
      <mesh position={[0.22, 0.155, 0.1205]} material={mat.spines}>
        <planeGeometry args={[0.3, 0.13]} />
      </mesh>
      <mesh position={[0, 0.004, 0.05]} rotation={[-Math.PI / 2, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[1.4, 0.95]} />
      </mesh>
    </group>
  );
}
