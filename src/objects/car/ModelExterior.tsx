import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useScene } from '../../store/useScene';
import { Interactive } from '../Interactive';
import { useModelCar } from './CarModel';
import type { CarMats } from './materials';

/** Rodas cambadas (topo para dentro) e carro um pouco mais baixo: o jeito "stance". */
const CAMBER = 0.07;
const DROP = 0.035;

/**
 * Lataria, vidros, luzes e rodas do modelo do Evo VIII, com os materiais
 * do projeto (amarelo metálico com verniz, vidro escuro, faróis que
 * acendem) e as mesmas interações do carro feito no código: capô (skills),
 * porta do motorista (entra no carro) e faróis (ligam e desligam).
 */
export function ModelExterior({ m }: { m: CarMats }) {
  const car = useModelCar();
  const view = useScene((s) => s.view);
  const headlights = useScene((s) => s.headlights);
  const setView = useScene((s) => s.setView);
  const atCar = view === 'carro';
  const hood = useRef<THREE.Group>(null);
  if (import.meta.env.DEV) {
    Object.assign(window, {
      __carModel: {
        hood: car.hoodHinge.toArray(),
        door: car.doorHinge.toArray(),
        box: [car.box.min.toArray(), car.box.max.toArray()],
        tops: [-1.9, -1.6, -1.3, -1.0, -0.8].map((x) => [
          x,
          car.surfaceY(x, 0),
          car.surfaceY(x, 0.5),
        ]),
        roof: [0, 0.4, 0.8].map((x) => [x, car.surfaceY(x, 0)]),
      },
    });
  }
  const door = useRef<THREE.Group>(null);

  const mats = useMemo(() => {
    // o modelo usa as faces dos dois lados (algumas vêm viradas)
    const paint = m.paint.clone();
    paint.map = null;
    paint.side = THREE.DoubleSide;
    const trim = m.trim.clone();
    trim.side = THREE.DoubleSide;
    return {
      paint,
      trim,
      headlight: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: '#e8edf2',
        emissive: '#fff4e0',
        emissiveIntensity: 0.08,
        roughness: 0.08,
        metalness: 0.3,
      }),
      taillight: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: '#7a0608',
        emissive: '#ff1a10',
        emissiveIntensity: 0.9,
        roughness: 0.15,
      }),
      signal: new THREE.MeshStandardMaterial({
        side: THREE.DoubleSide,
        color: '#c25a00',
        emissive: '#ff7a00',
        emissiveIntensity: 0.25,
        roughness: 0.2,
      }),
      mirror: new THREE.MeshStandardMaterial({
        color: '#cfd6de',
        roughness: 0.05,
        metalness: 1,
        side: THREE.DoubleSide,
      }),
      wheels: car.wheels.map(
        (w) =>
          new THREE.MeshStandardMaterial({
            map: w.map,
            roughness: 0.45,
            metalness: 0.35,
            side: THREE.DoubleSide,
            envMapIntensity: 1.4,
          }),
      ),
    };
  }, [m, car]);

  // rodas: cada uma gira em volta do próprio centro (cambagem)
  const wheels = useMemo(
    () =>
      car.wheels.map((w) => {
        const g = w.geo.clone();
        g.computeBoundingBox();
        const c = g.boundingBox!.getCenter(new THREE.Vector3());
        g.translate(-c.x, -c.y, -c.z);
        return { geo: g, center: c, side: Math.sign(c.z) };
      }),
    [car],
  );

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 5);
    if (hood.current) {
      const target = view === 'motor' ? -1.05 : 0;
      hood.current.rotation.z += (target - hood.current.rotation.z) * k;
    }
    if (door.current) {
      const target = view === 'interior' ? -1.05 : 0;
      door.current.rotation.y += (target - door.current.rotation.y) * k;
    }
    const on = headlights;
    mats.headlight.emissiveIntensity += ((on ? 3 : 0.08) - mats.headlight.emissiveIntensity) * k;
    mats.taillight.emissiveIntensity += ((on ? 1.8 : 0.9) - mats.taillight.emissiveIntensity) * k;
  });

  return (
    <group name="car-model">
      <group position={[0, -DROP, 0]}>
        <mesh geometry={car.paint} material={mats.paint} />
        <mesh geometry={car.trim} material={mats.trim} />
        <mesh geometry={car.glass} material={m.glass} renderOrder={2} />
        <mesh geometry={car.taillight} material={mats.taillight} />
        <mesh geometry={car.signal} material={mats.signal} />
        <mesh geometry={car.mirror} material={mats.mirror} />
        <Interactive
          id="headlights"
          label="objects.headlights"
          enabled={atCar}
          onClick={() => useScene.getState().toggleHeadlights()}
        >
          <mesh geometry={car.headlight} material={mats.headlight} />
        </Interactive>
        <Interactive
          id="hood"
          label="objects.hood"
          enabled={atCar}
          onClick={() => setView('motor')}
        >
          <group ref={hood} position={car.hoodHinge.toArray()}>
            <mesh geometry={car.hood} material={mats.paint} />
            <mesh geometry={car.hoodTrim} material={mats.trim} />
          </group>
        </Interactive>
        <Interactive
          id="door"
          label="objects.door"
          enabled={atCar}
          onClick={() => setView('interior')}
        >
          <group ref={door} position={car.doorHinge.toArray()}>
            <mesh geometry={car.door} material={mats.paint} />
            <mesh geometry={car.doorGlass} material={m.glass} renderOrder={2} />
            {/* forro de dentro da porta, com o puxador e os botões do vidro */}
            <mesh position={[0.56, 0.2, -0.07]} rotation={[0, Math.PI, 0]} material={m.doorCard}>
              <planeGeometry args={[0.98, 0.42]} />
            </mesh>
          </group>
        </Interactive>
      </group>
      {wheels.map((w, i) => (
        <mesh
          key={i}
          geometry={w.geo}
          material={mats.wheels[i]}
          position={w.center.toArray()}
          rotation={[-CAMBER * w.side, 0, 0]}
        />
      ))}
    </group>
  );
}
