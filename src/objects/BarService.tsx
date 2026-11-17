import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { playIce } from '../audio/player';
import { box, crease, cyl, lathe, merge } from '../scene/geo';
import { useScene } from '../store/useScene';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';

const HALF_PI = Math.PI / 2;
const POUR = 0.07;

/**
 * O que acontece no balcão quando a câmera chega no bar: o gelo cai no
 * copo, a dose de uísque sobe e o gelo tilinta. Ao lado fica o frasco de
 * perfume, espaço reservado para os detalhes pessoais do Raphael.
 */
export function BarService() {
  const { mat } = lib();
  const atBar = useScene((s) => s.view === 'bar');
  const drink = useRef<THREE.Mesh>(null!);
  const ice = useRef<THREE.Group>(null!);

  const geo = useMemo(
    () => ({
      glass: lathe(
        [
          [0.001, 0.004],
          [0.04, 0.004],
          [0.043, 0.095],
        ],
        { seg: 16 },
      ),
      base: cyl(0.04, 0.04, 0.008, [0, 0.004, 0], { seg: 16 }),
      // a dose cresce a partir do fundo do copo (escala em y)
      drink: cyl(0.039, 0.0395, 1, [0, 0.5, 0], { seg: 16 }),
      cube: box([0.024, 0.024, 0.024]),
      bottle: crease(
        merge([box([0.07, 0.09, 0.04], [0, 0.045, 0]), box([0.05, 0.012, 0.03], [0, 0.096, 0])]),
        30,
      ),
      cap: crease(cyl(0.016, 0.016, 0.035, [0, 0.12, 0], { seg: 8 }), 30),
    }),
    [],
  );
  const glass = useMemo(() => {
    const m = mat.clearGlass.clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [mat]);
  const perfume = useMemo(() => {
    const m = mat.bottleAmber.clone();
    m.opacity = 0.7;
    return m;
  }, [mat]);

  useEffect(() => {
    const d = drink.current;
    const cubes = ice.current.children;
    if (!atBar) {
      d.scale.y = 0.0001;
      cubes.forEach((c) => (c.position.y = 0.35));
      return;
    }
    const timeline = gsap.timeline({ delay: 1.1 });
    cubes.forEach((cube, i) => {
      timeline.to(
        cube.position,
        {
          y: 0.022 + i * 0.016,
          duration: 0.32,
          ease: 'bounce.out',
          onStart: i === 0 ? playIce : undefined,
        },
        i * 0.14,
      );
    });
    timeline.to(d.scale, { y: POUR, duration: 1.3, ease: 'power1.inOut' }, 0.45);
    timeline.call(playIce, [], 1.6);
    return () => {
      timeline.kill();
    };
  }, [atBar]);

  return (
    <>
      <group position={[-0.25, 1.07, 0.16]} name="served-glass">
        <mesh ref={drink} geometry={geo.drink} material={mat.whisky} scale={[1, 0.0001, 1]} />
        <group ref={ice}>
          {[
            [0.008, 0.4],
            [-0.01, 1.1],
          ].map(([x, yaw], i) => (
            <mesh
              key={i}
              geometry={geo.cube}
              material={mat.ice}
              position={[x, 0.35, i * 0.01 - 0.005]}
              rotation={[0.3, yaw, 0.2]}
            />
          ))}
        </group>
        <mesh geometry={geo.base} material={glass} />
        <mesh geometry={geo.glass} material={glass} renderOrder={6} />
      </group>
      <Interactive id="perfume" label="objects.perfume" enabled={atBar}>
        <group position={[0.95, 1.07, 0.05]} rotation={[0, -0.4, 0]} name="perfume">
          <mesh geometry={geo.bottle} material={perfume} renderOrder={6} />
          <mesh geometry={geo.cap} material={mat.brass} />
          <mesh position={[0, 0.002, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
            <planeGeometry args={[0.14, 0.12]} />
          </mesh>
        </group>
      </Interactive>
    </>
  );
}
