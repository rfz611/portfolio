import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { GARAGE, SPOT } from '../config/layout';
import { Car } from '../objects/car/Car';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { paintUnderglow } from '../textures/car';
import { lib } from '../textures/library';
import { box, cyl, merge } from './geo';

// a luz retangular das calhas precisa das tabelas de iluminação do three
RectAreaLightUniformsLib.init();

const [carX, , carZ] = SPOT.car;
/** Altura das rampas do elevador (o carro fica em cima delas). */
const LIFT = 0.08;

/** Fachos dos faróis: acesos, entram na sala pelo vidro. */
function HeadlightBeams() {
  const on = useScene((s) => s.headlights);
  const lights = useRef<(THREE.SpotLight | null)[]>([]);
  const targets = useMemo(() => [new THREE.Object3D(), new THREE.Object3D()], []);
  useEffect(() => {
    lights.current.forEach((light, i) => {
      if (!light) return;
      targets[i].position.set(carX - 9, 0.3, carZ + (i ? -0.9 : 0.9));
      light.target = targets[i];
      targets[i].updateMatrixWorld();
    });
  }, [targets]);
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 6);
    for (const light of lights.current) {
      if (light) light.intensity += ((on ? 60 : 0) - light.intensity) * k;
    }
  });
  return (
    <>
      {[0.56, -0.56].map((z, i) => (
        <spotLight
          key={z}
          ref={(l) => {
            lights.current[i] = l;
          }}
          position={[carX - 2.25, LIFT + 0.6, carZ + z]}
          color="#fff1dc"
          intensity={0}
          distance={16}
          angle={0.42}
          penumbra={0.65}
          decay={1.6}
        />
      ))}
      {targets.map((t, i) => (
        <primitive key={i} object={t} />
      ))}
    </>
  );
}

/**
 * Sky garage: o carro em cima de um elevador baixo de duas rampas, com o
 * brilho vermelho por baixo, um neon vermelho na parede do fundo e uma
 * pilha de pneus no canto.
 */
export function Garage() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      lift: merge([
        box([4.6, LIFT, 0.42], [carX, LIFT / 2, carZ + 0.78]),
        box([4.6, LIFT, 0.42], [carX, LIFT / 2, carZ - 0.78]),
        box([0.5, 0.03, 0.42], [carX - 2.55, 0.015, carZ + 0.78], { rot: [0, 0, 0.14] }),
        box([0.5, 0.03, 0.42], [carX - 2.55, 0.015, carZ - 0.78], { rot: [0, 0, 0.14] }),
        box([0.14, 2.2, 0.14], [carX + 1.6, 1.1, carZ + 1.25]),
        box([0.14, 2.2, 0.14], [carX + 1.6, 1.1, carZ - 1.25]),
      ]),
      neon: merge([
        cyl(0.025, 0.025, 6.4, [GARAGE.x1 - 0.05, 2.6, 0], { seg: 8, rot: [Math.PI / 2, 0, 0] }),
        cyl(0.025, 0.025, 5.8, [(GARAGE.x0 + GARAGE.x1) / 2 + 0.3, 2.6, 4.45], {
          seg: 8,
          rot: [0, 0, Math.PI / 2],
        }),
      ]),
      // duas calhas de luz fria no teto, sobre o carro
      tubes: merge([
        box([3.2, 0.05, 0.12], [carX, 3.36, carZ + 0.7]),
        box([3.2, 0.05, 0.12], [carX, 3.36, carZ - 0.7]),
      ]),
      housings: merge([
        box([3.3, 0.06, 0.22], [carX, 3.38, carZ + 0.7]),
        box([3.3, 0.06, 0.22], [carX, 3.38, carZ - 0.7]),
      ]),
      tires: merge(
        [0, 1, 2].map((k) =>
          cyl(0.33, 0.33, 0.23, [GARAGE.x1 - 0.55, 0.12 + k * 0.235, GARAGE.z1 - 0.6], {
            seg: 18,
          }),
        ),
      ),
    }),
    [],
  );
  const tube = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#e8eeff').multiplyScalar(2.2),
        toneMapped: false,
      }),
    [],
  );
  const glow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(makeCanvas(256, 128, paintUnderglow), { clamp: true }),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  return (
    <group name="garage">
      <mesh geometry={geo.lift} material={mat.darkMetal} />
      <mesh geometry={geo.neon} material={mat.neonRed} />
      <mesh geometry={geo.tires} material={mat.rubber} />
      <mesh geometry={geo.housings} material={mat.darkMetal} />
      <mesh geometry={geo.tubes} material={tube} />
      {/* luz lateral fraca, para a lateral do carro não sumir no escuro */}
      <pointLight
        position={[carX, 1.1, carZ + 3.2]}
        color="#ffd2b0"
        intensity={5}
        distance={5}
        decay={2}
      />
      {/* luz das calhas: desenha o brilho na lataria e no capô */}
      <rectAreaLight
        position={[carX, 3.3, carZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        width={3.2}
        height={1.6}
        intensity={16}
        color="#dfe6ff"
      />
      <pointLight
        position={[carX - 1.2, 2.6, carZ + 2.2]}
        color="#ffd9b8"
        intensity={6}
        distance={6}
        decay={2}
      />
      <mesh
        position={[carX, 0.006, carZ]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={glow}
        renderOrder={1}
      >
        <planeGeometry args={[5.2, 2.6]} />
      </mesh>
      <group position={[carX, LIFT, carZ]}>
        <Car />
      </group>
      <HeadlightBeams />
    </group>
  );
}
