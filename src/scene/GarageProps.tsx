import { useMemo } from 'react';
import * as THREE from 'three';
import { GARAGE, ROOM, SPOT } from '../config/layout';
import { makeCanvas, tex } from '../textures/canvas';
import {
  paintGaragePoster,
  paintGymFloor,
  paintPegboard,
  paintPunchBag,
  paintToolChest,
} from '../textures/garage';
import { lib } from '../textures/library';
import { box, cyl, lathe, merge } from './geo';

const E = GARAGE.x1; // parede do fundo (leste)
const N = GARAGE.z0; // vidro da cidade (norte)
const H = ROOM.h;
const [carX, , carZ] = SPOT.car;
const HALF_PI = Math.PI / 2;

/** Haltere deitado no suporte: pegada e duas cabeças sextavadas. */
function dumbbell(x: number, y: number, z: number, r: number) {
  return {
    grip: cyl(0.016, 0.016, 0.16 + r, [x, y, z], { seg: 8, rot: [0, 0, HALF_PI] }),
    heads: merge([
      cyl(r, r, 0.07 + r * 0.5, [x - 0.08 - r / 2, y, z], { seg: 6, rot: [0, 0, HALF_PI] }),
      cyl(r, r, 0.07 + r * 0.5, [x + 0.08 + r / 2, y, z], { seg: 6, rot: [0, 0, HALF_PI] }),
    ]),
  };
}

/**
 * O que enche a garagem em volta do carro: no canto da cidade, uma
 * academia (saco de pancada, halteres, banco e anilhas no piso de
 * borracha); na parede do fundo, o pôster da garagem, o carrinho de
 * ferramentas vermelho, a bancada com o painel de ferramentas; e no chão,
 * as faixas amarelas da vaga.
 */
export function GarageProps() {
  const { mat } = lib();
  const geo = useMemo(() => {
    // ---- academia, no canto nordeste (x 11,2 a 13, z -4,5 a -1,6)
    const bells = [0, 1, 2, 3, 4].flatMap((i) => {
      const z = -3.65 + i * 0.36;
      const r = 0.045 + i * 0.008;
      return [dumbbell(E - 0.42, 0.42, z, r), dumbbell(E - 0.3, 0.78, z, r * 0.85)];
    });
    return {
      gymFloor: new THREE.PlaneGeometry(1.9, 2.9)
        .rotateX(-HALF_PI)
        .translate(E - 0.95, 0.008, N + 1.5),
      rack: merge([
        // suporte de dois andares encostado na parede
        box([0.05, 0.85, 0.05], [E - 0.45, 0.425, -3.95]),
        box([0.05, 0.85, 0.05], [E - 0.45, 0.425, -2.1]),
        box([0.05, 0.85, 0.05], [E - 0.18, 0.425, -3.95]),
        box([0.05, 0.85, 0.05], [E - 0.18, 0.425, -2.1]),
        box([0.06, 0.03, 1.9], [E - 0.47, 0.37, -3.02], { rot: [0.0, 0, -0.25] }),
        box([0.06, 0.03, 1.9], [E - 0.33, 0.72, -3.02], { rot: [0.0, 0, -0.25] }),
        box([0.32, 0.03, 0.05], [E - 0.31, 0.06, -3.95]),
        box([0.32, 0.03, 0.05], [E - 0.31, 0.06, -2.1]),
      ]),
      bellGrips: merge(bells.map((b) => b.grip)),
      bellHeads: merge(bells.map((b) => b.heads)),
      // banco reto no meio do tapete
      benchPad: box([1.1, 0.08, 0.3], [E - 1.25, 0.46, -2.45], { uv: 0.5 }),
      benchFrame: merge([
        box([1.0, 0.04, 0.08], [E - 1.25, 0.4, -2.45]),
        box([0.05, 0.4, 0.05], [E - 1.7, 0.2, -2.45]),
        box([0.05, 0.4, 0.05], [E - 0.8, 0.2, -2.45]),
        box([0.05, 0.03, 0.42], [E - 1.7, 0.02, -2.45]),
        box([0.05, 0.03, 0.42], [E - 0.8, 0.02, -2.45]),
      ]),
      // anilhas empilhadas no chão e a barra encostada na parede
      plates: merge([
        cyl(0.23, 0.23, 0.045, [E - 1.0, 0.025, -4.05], { seg: 24 }),
        cyl(0.2, 0.2, 0.04, [E - 1.0, 0.068, -4.05], { seg: 24 }),
        cyl(0.17, 0.17, 0.035, [E - 1.0, 0.105, -4.05], { seg: 24 }),
        cyl(0.14, 0.14, 0.03, [E - 1.0, 0.138, -4.05], { seg: 24 }),
      ]),
      plateHub: cyl(0.03, 0.03, 0.17, [E - 1.0, 0.09, -4.05], { seg: 10 }),
      bar: merge([
        cyl(0.014, 0.014, 2.0, [E - 0.12, 1.0, -1.85], { seg: 8, rot: [0, 0, 0.12] }),
        cyl(0.025, 0.025, 0.06, [E - 0.0, 0.08, -1.85], { seg: 10, rot: [0, 0, 0.12] }),
      ]),
      // saco de pancada pendurado no teto, com as correntes
      bag: lathe(
        [
          [0.0, 0.0],
          [0.12, 0.01],
          [0.175, 0.06],
          [0.185, 0.18],
          [0.185, 0.9],
          [0.17, 0.98],
          [0.1, 1.02],
          [0.0, 1.03],
        ],
        { seg: 16 },
        [E - 1.3, 0.78, -3.55],
      ),
      chains: merge([
        cyl(0.006, 0.006, 0.42, [E - 1.3 + 0.07, 2.0, -3.55], { seg: 5, rot: [0, 0, 0.32] }),
        cyl(0.006, 0.006, 0.42, [E - 1.3 - 0.07, 2.0, -3.55], { seg: 5, rot: [0, 0, -0.32] }),
        cyl(0.006, 0.006, 0.42, [E - 1.3, 2.0, -3.55 + 0.07], { seg: 5, rot: [-0.32, 0, 0] }),
        cyl(0.008, 0.008, 1.15, [E - 1.3, 2.78, -3.55], { seg: 5 }),
        cyl(0.07, 0.07, 0.02, [E - 1.3, H - 0.01, -3.55], { seg: 12 }),
        new THREE.TorusGeometry(0.03, 0.008, 6, 12).translate(E - 1.3, 2.2, -3.55),
      ]),

      // ---- parede do fundo: carrinho de ferramentas, bancada e pôster
      chest: box([0.55, 0.92, 1.0], [E - 0.3, 0.5, 1.15]),
      chestTop: box([0.5, 0.42, 0.96], [E - 0.28, 1.17, 1.15]),
      chestWheels: merge(
        [0.75, 1.55].flatMap((z) =>
          [E - 0.48, E - 0.12].map((x) =>
            cyl(0.04, 0.04, 0.03, [x, 0.04, z], { seg: 10, rot: [HALF_PI, 0, 0] }),
          ),
        ),
      ),
      benchTop: box([0.62, 0.06, 1.5], [E - 0.33, 0.92, 2.6]),
      benchLegs: merge([
        box([0.05, 0.9, 0.05], [E - 0.6, 0.45, 1.9]),
        box([0.05, 0.9, 0.05], [E - 0.6, 0.45, 3.3]),
        box([0.05, 0.9, 0.05], [E - 0.06, 0.45, 1.9]),
        box([0.05, 0.9, 0.05], [E - 0.06, 0.45, 3.3]),
        box([0.56, 0.03, 1.4], [E - 0.33, 0.25, 2.6]),
      ]),
      // morsa e uma caixa de ferramentas em cima da bancada
      benchTools: merge([
        box([0.12, 0.1, 0.14], [E - 0.55, 1.0, 2.05]),
        box([0.05, 0.06, 0.2], [E - 0.55, 1.08, 2.05]),
        box([0.3, 0.16, 0.18], [E - 0.32, 1.03, 3.0]),
      ]),
      pegboard: new THREE.PlaneGeometry(1.5, 0.95).rotateY(-HALF_PI).translate(E - 0.02, 1.6, 2.6),
      poster: new THREE.PlaneGeometry(0.9, 1.25).rotateY(-HALF_PI).translate(E - 0.02, 1.75, -0.45),
      posterFrame: box([0.025, 1.31, 0.96], [E - 0.025, 1.75, -0.45]),

      // ---- faixas amarelas da vaga em volta do elevador
      lines: merge([
        box([5.6, 0.004, 0.08], [carX, 0.004, carZ + 1.55]),
        box([5.6, 0.004, 0.08], [carX, 0.004, carZ - 1.55]),
        box([0.08, 0.004, 3.18], [carX + 2.8, 0.004, carZ]),
      ]),
    };
  }, []);

  const mats = useMemo(() => {
    const chestTex = tex(makeCanvas(256, 512, paintToolChest), { clamp: true });
    return {
      gymFloor: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(256, 256, paintGymFloor), { repeat: [3.8, 5.8] }),
        roughness: 0.95,
      }),
      // carrinho: frente com as gavetas, laterais e tampo em vermelho liso
      chest: [
        new THREE.MeshStandardMaterial({ map: chestTex, roughness: 0.35, metalness: 0.3 }),
        new THREE.MeshStandardMaterial({ color: '#7e1414', roughness: 0.35, metalness: 0.3 }),
      ],
      bag: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(512, 512, paintPunchBag), { clamp: true }),
        roughness: 0.55,
      }),
      peg: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(768, 512, paintPegboard), { clamp: true }),
        roughness: 0.8,
      }),
      poster: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(512, 712, paintGaragePoster), { clamp: true }),
        roughness: 0.6,
      }),
      wood: new THREE.MeshStandardMaterial({ color: '#5b3b22', roughness: 0.75 }),
      iron: new THREE.MeshStandardMaterial({ color: '#202124', roughness: 0.45, metalness: 0.7 }),
      line: new THREE.MeshStandardMaterial({ color: '#c79a1c', roughness: 0.7 }),
      pad: new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.5 }),
    };
  }, []);

  // faces da caixa na ordem +x, -x, +y, -y, +z, -z: as gavetas vão na -x,
  // virada para o carro
  const chestMaterials = useMemo(
    () => [
      mats.chest[1],
      mats.chest[0],
      mats.chest[1],
      mats.chest[1],
      mats.chest[1],
      mats.chest[1],
    ],
    [mats],
  );

  return (
    <group name="garage-props">
      <mesh geometry={geo.gymFloor} material={mats.gymFloor} />
      <mesh geometry={geo.rack} material={mat.darkMetal} />
      <mesh geometry={geo.bellGrips} material={mat.chrome} />
      <mesh geometry={geo.bellHeads} material={mats.iron} />
      <mesh geometry={geo.benchPad} material={mats.pad} />
      <mesh geometry={geo.benchFrame} material={mat.darkMetal} />
      <mesh geometry={geo.plates} material={mats.iron} />
      <mesh geometry={geo.plateHub} material={mat.chrome} />
      <mesh geometry={geo.bar} material={mat.chrome} />
      <mesh geometry={geo.bag} material={mats.bag} />
      <mesh geometry={geo.chains} material={mat.chrome} />

      <mesh geometry={geo.chest} material={chestMaterials} />
      <mesh geometry={geo.chestTop} material={chestMaterials} />
      <mesh geometry={geo.chestWheels} material={mat.rubber} />
      <mesh geometry={geo.benchTop} material={mats.wood} />
      <mesh geometry={geo.benchLegs} material={mat.darkMetal} />
      <mesh geometry={geo.benchTools} material={mats.chest[1]} />
      <mesh geometry={geo.pegboard} material={mats.peg} />
      <mesh geometry={geo.poster} material={mats.poster} />
      <mesh geometry={geo.posterFrame} material={mat.darkMetal} />
      <mesh geometry={geo.lines} material={mats.line} />

      {/* luzes quentes: a bancada e o canto da academia aparecem no escuro */}
      <pointLight
        position={[E - 0.9, 2.5, 2.4]}
        color="#ffcf9e"
        intensity={4}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[E - 1.4, 2.6, -3.0]}
        color="#ffcf9e"
        intensity={5}
        distance={4.5}
        decay={2}
      />
      <pointLight
        position={[E - 1.2, 2.3, -0.45]}
        color="#ffd9b8"
        intensity={2.5}
        distance={3}
        decay={2}
      />
    </group>
  );
}
