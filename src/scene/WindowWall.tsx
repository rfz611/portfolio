import { useMemo } from 'react';
import * as THREE from 'three';
import { ROOM, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { Interactive } from '../objects/Interactive';
import { useScene } from '../store/useScene';
import { lib } from '../textures/library';
import { cyl, merge } from './geo';

const FOLDS = 7;

/** Cortina franzida: um plano ondulado, com as dobras pintadas na textura. */
function curtainGeometry(width: number, height: number) {
  const g = new THREE.PlaneGeometry(width, height, 42, 1);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / width + 0.5;
    p.setZ(i, Math.sin(u * Math.PI * 2 * FOLDS) * 0.05);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * O que fica na parede de vidro: as duas cortinas roxas, o letreiro de
 * neon com o nome e a área de clique da janela (seção Início).
 */
export function WindowWall() {
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const setView = useScene((s) => s.setView);
  const [nx, ny, nz] = SPOT.neon;

  const geo = useMemo(
    () => ({
      curtain: curtainGeometry(1.3, 3.08),
      rods: merge(
        [-5.25, 5.2].map((x) =>
          cyl(0.016, 0.016, 1.55, [x, 3.16, ROOM.z0 + 0.17], { seg: 8, rot: [0, 0, Math.PI / 2] }),
        ),
      ),
      hangers: merge(
        [-0.8, 0.8].map((x) => cyl(0.004, 0.004, 0.62, [nx + x, ny + 0.66, nz], { seg: 5 })),
      ),
    }),
    [nx, ny, nz],
  );

  return (
    <group name="window-wall">
      {[-5.25, 5.2].map((x) => (
        <mesh
          key={x}
          geometry={geo.curtain}
          material={mat.curtain}
          position={[x, 1.6, ROOM.z0 + 0.17]}
        />
      ))}
      <mesh geometry={geo.rods} material={mat.brass} />

      <Interactive
        id="window"
        label="objects.window"
        enabled={home}
        onClick={() => setView('janela')}
        hit={
          <mesh position={[0, 1.65, ROOM.z0 + 0.09]}>
            <planeGeometry args={[4.2, 2.9]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        }
      >
        <mesh position={[nx, ny, nz]} material={mat.neonSign} renderOrder={5} name="neon">
          <planeGeometry args={[2.1, 0.7875]} />
        </mesh>
      </Interactive>
      <mesh geometry={geo.hangers} material={mat.bronze} />
      <pointLight
        position={[nx, ny - 0.1, nz + 0.7]}
        color={palette.neonRed}
        intensity={7}
        distance={4.5}
        decay={1.8}
      />
    </group>
  );
}
