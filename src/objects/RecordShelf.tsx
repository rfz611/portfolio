import { useMemo } from 'react';
import { box, merge } from '../scene/geo';
import { lib } from '../textures/library';
import { SHELF } from './recordLayout';

/**
 * Estante baixa de mogno (1,50 × 1,00 × 0,45 m) com duas prateleiras:
 * Clássicos em cima e Rap embaixo. As caixas de som ficam sobre o tampo.
 */
export function RecordShelf() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const { w, h, d } = SHELF;
    return {
      body: merge([
        box([w, 0.04, d], [0, 0.1, 0]),
        box([w + 0.04, 0.04, d + 0.02], [0, h - 0.02, 0.01]),
        box([w - 0.06, 0.03, d - 0.03], [0, 0.54, -0.005]),
        box([0.03, h - 0.16, d], [-(w / 2 - 0.015), 0.54, 0], { swap: true }),
        box([0.03, h - 0.16, d], [w / 2 - 0.015, 0.54, 0], { swap: true }),
      ]),
      dark: merge([
        box([w - 0.04, 0.08, d - 0.06], [0, 0.04, -0.01]),
        box([w - 0.06, h - 0.16, 0.012], [0, 0.54, -d / 2 + 0.012]),
      ]),
      trim: merge([
        box([w + 0.04, 0.008, 0.006], [0, h - 0.035, d / 2 + 0.022]),
        box([w, 0.006, 0.005], [0, 0.118, d / 2 + 0.002]),
      ]),
      spineBlock: box([0.15, 0.3, 0.3], [0.645, 0.27, -0.03]),
      speaker: box([0.2, 0.32, 0.18], [0, 0.16, 0]),
    };
  }, []);

  return (
    <group>
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.dark} material={mat.mahoganyDark} />
      <mesh geometry={geo.trim} material={mat.brass} />
      {/* discos guardados de lado, só a lombada aparece */}
      <mesh geometry={geo.spineBlock} material={mat.blackPlastic} />
      <mesh position={[0.645, 0.27, 0.121]} material={mat.spines}>
        <planeGeometry args={[0.15, 0.3]} />
      </mesh>
      {[-0.63, 0.63].map((x) => (
        <group key={x} position={[x, SHELF.h, 0.02]}>
          <mesh geometry={geo.speaker} material={mat.walnut} />
          <mesh position={[0, 0.16, 0.0905]} material={mat.grille}>
            <planeGeometry args={[0.175, 0.295]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.004, 0.05]} rotation={[-Math.PI / 2, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[2.1, 1.0]} />
      </mesh>
    </group>
  );
}
