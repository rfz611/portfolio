import { useMemo } from 'react';
import * as THREE from 'three';
import { box, cyl, merge } from '../scene/geo';
import { useScene } from '../store/useScene';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';

/**
 * Chaves do carro na mesa. Sem logo nem emblema. Clicando, a câmera
 * atravessa o vidro até a garagem, de frente para o carro (dali se abre o
 * capô, a porta e o porta-luvas).
 */
export function CarKeys() {
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const geo = useMemo(() => {
    const ring = new THREE.TorusGeometry(0.014, 0.0014, 5, 16);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, 0.003, 0);
    return {
      metal: merge([
        ring,
        box([0.007, 0.002, 0.05], [0.014, 0.002, 0.036], { rot: [0, 0.35, 0] }),
        cyl(0.011, 0.011, 0.0025, [0.004, 0.002, 0.012], { seg: 10 }),
        box([0.006, 0.002, 0.042], [-0.02, 0.002, 0.03], { rot: [0, -0.5, 0] }),
        cyl(0.009, 0.009, 0.0025, [-0.008, 0.002, 0.01], { seg: 10 }),
      ]),
      fob: box([0.034, 0.012, 0.058], [0.004, 0.006, -0.042], { rot: [0, 0.15, 0] }),
      button: box([0.012, 0.002, 0.012], [0.003, 0.013, -0.05], { rot: [0, 0.15, 0] }),
    };
  }, []);

  return (
    <Interactive
      id="keys"
      label="objects.keys"
      enabled={home}
      onClick={() => useScene.getState().setView('carro')}
      hit={
        // as chaves são pequenas: uma área de clique invisível um pouco maior
        <mesh position={[-0.46, 0.437, -0.32]} rotation={[0, 2.3, 0]}>
          <boxGeometry args={[0.1, 0.03, 0.14]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      }
    >
      <group position={[-0.46, 0.422, -0.31]} rotation={[0, 2.3, 0]} name="car_keys">
        <mesh geometry={geo.metal} material={mat.steel} />
        <mesh geometry={geo.fob} material={mat.blackPlastic} />
        <mesh geometry={geo.button} material={mat.darkMetal} />
      </group>
    </Interactive>
  );
}
