import { useMemo } from 'react';
import * as THREE from 'three';
import { box, cyl, merge } from '../scene/geo';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';

/**
 * Chaves do carro na mesa (seção Contato). Sem logo nem emblema.
 * O caminho chaves → carro → rádio chega na Fase 5; por enquanto elas só
 * acendem e mostram o rótulo.
 */
export function CarKeys() {
  const { mat } = lib();
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
    <Interactive id="keys" label="objects.keys">
      <group position={[0.15, 0.421, 0.33]} rotation={[0, 2.3, 0]} name="car_keys">
        <mesh geometry={geo.metal} material={mat.steel} />
        <mesh geometry={geo.fob} material={mat.blackPlastic} />
        <mesh geometry={geo.button} material={mat.darkMetal} />
      </group>
    </Interactive>
  );
}
