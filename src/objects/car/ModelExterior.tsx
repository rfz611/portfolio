import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
        roof: [0, 0.4, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0].map((x) => [
          x,
          car.surfaceY(x, 0),
          car.surfaceY(x, 0.55),
        ]),
        surfaceY: car.surfaceY,
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
      // aro prata claro, quase branco, e pneu de borracha
      rim: new THREE.MeshStandardMaterial({
        color: '#e4e8ee',
        roughness: 0.26,
        metalness: 0.85,
        side: THREE.DoubleSide,
        envMapIntensity: 1.6,
      }),
      tire: new THREE.MeshStandardMaterial({
        color: '#161618',
        roughness: 0.92,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    };
  }, [m]);

  // rodas: cada uma gira em volta do próprio centro (cambagem)
  // forro da porta: logo para dentro da chapa mais interna da porta (e abaixo do vidro)
  const card = useMemo(() => {
    car.door.computeBoundingBox();
    car.doorGlass.computeBoundingBox();
    const b = car.door.boundingBox!;
    const length = b.max.x - b.min.x;
    // o forro para logo abaixo da base do vidro (senão aparece pela janela
    // como uma faixa preta)
    const sill = car.doorGlass.boundingBox!.isEmpty() ? 0.3 : car.doorGlass.boundingBox!.min.y;
    const top = Math.min(b.max.y, 0.38, sill - 0.05);
    const bottom = Math.max(b.min.y, -0.12);
    return {
      position: [b.min.x + length / 2, (top + bottom) / 2, b.min.z - 0.03] as const,
      size: [length * 0.9, top - bottom] as const,
    };
  }, [car]);

  const wheels = useMemo(
    () =>
      car.wheels.map((w) => {
        const box = new THREE.Box3();
        for (const g of [w.rim, w.tire]) {
          g.computeBoundingBox();
          if (!g.boundingBox!.isEmpty()) box.union(g.boundingBox!);
        }
        const c = box.getCenter(new THREE.Vector3());
        const rim = w.rim.clone().translate(-c.x, -c.y, -c.z);
        const tire = w.tire.clone().translate(-c.x, -c.y, -c.z);
        return { rim, tire, center: c, side: Math.sign(c.z) };
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
            <mesh position={[...card.position]} rotation={[0, Math.PI, 0]} material={m.doorCard}>
              <planeGeometry args={[...card.size]} />
            </mesh>
          </group>
        </Interactive>
      </group>
      {atCar && <CarTags car={car} />}
      {wheels.map((w, i) => (
        <group key={i} position={w.center.toArray()} rotation={[-CAMBER * w.side, 0, 0]}>
          <mesh geometry={w.rim} material={mats.rim} />
          <mesh geometry={w.tire} material={mats.tire} />
        </group>
      ))}
    </group>
  );
}

/**
 * Etiquetas no carro, na vista da garagem: mostram que o capô, a porta e
 * os faróis abrem alguma coisa (quem chega não sabe que dá para clicar).
 */
function CarTags({ car }: { car: ReturnType<typeof useModelCar> }) {
  const { t } = useTranslation();
  const side = car.box.max.z + 0.06;
  const tags: { key: string; at: [number, number, number] }[] = [
    { key: 'car.tagHood', at: [-1.55, car.surfaceY(-1.55, 0) + 0.06, 0.1] },
    { key: 'car.tagDoor', at: [car.doorHinge.x + 0.95, 0.78, side] },
    { key: 'car.tagLights', at: [car.box.min.x + 0.12, 0.62, 0.62] },
  ];
  return (
    <>
      {tags.map((tag) => (
        <Html key={tag.key} position={tag.at} zIndexRange={[5, 0]}>
          <div className="deck-tag car-tag">
            <span className="car-tag__dot" aria-hidden="true" />
            {t(tag.key)}
          </div>
        </Html>
      ))}
    </>
  );
}
