import { useMemo } from 'react';
import * as THREE from 'three';
import { box, crease, cyl, merge } from '../scene/geo';
import { sweep } from '../scene/sweep';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';

const HALF_PI = Math.PI / 2;

/**
 * Detalhes pessoais do Raphael (espaços reservados da especificação).
 * Cada um mostra um rótulo curto ao passar o mouse; trocar o modelo ou
 * o texto depois não mexe no resto.
 */

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Corpo da luva de boxe: um ovo achatado moldado vértice a vértice, com a
 * frente cheia (o punho fechado), a dobra dos dedos por baixo e a parte
 * de trás afinando até o pulso. A luva aponta para +z.
 */
function gloveBody() {
  const g = new THREE.SphereGeometry(1, 28, 20);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    const z = p.getZ(i);
    // afina para trás (pulso) e incha na frente (punho)
    const taper = 1 - 0.32 * smooth(0, -1, z);
    x *= taper;
    y *= taper;
    // rolo dos dedos por cima, na frente
    if (y > 0) y += 0.18 * smooth(0.2, 0.75, z) * (1 - Math.abs(x) * 0.6);
    // dobra dos dedos fechados por baixo
    if (y < 0) y += 0.16 * Math.exp(-((z - 0.55) ** 2) / 0.02);
    p.setXYZ(i, x * 0.064, y * 0.056, z * 0.105);
  }
  g.computeVertexNormals();
  return g;
}

/** Polegar colado na lateral do punho, apontando para a frente. */
function gloveThumb(side: number) {
  const g = new THREE.CapsuleGeometry(0.021, 0.06, 6, 12);
  g.rotateX(Math.PI / 2);
  g.rotateY(side * 0.35);
  g.rotateZ(side * 0.4);
  g.translate(side * 0.056, -0.008, 0.035);
  return g;
}

/**
 * Luvas de boxe largadas no assento do sofá, perto da ponta: uma de
 * barriga para baixo, a outra tombada de lado, com uma atadura enrolada e
 * outra desenrolada, como quem acabou de voltar do treino.
 */
export function LooseGloves() {
  const geo = useMemo(() => {
    const cuff = new THREE.CylinderGeometry(0.047, 0.052, 0.12, 20, 1, true)
      .rotateX(Math.PI / 2)
      .translate(0, -0.004, -0.13);
    const strap = new THREE.CylinderGeometry(0.055, 0.055, 0.055, 20, 1, false)
      .rotateX(Math.PI / 2)
      .translate(0, -0.004, -0.115);
    const patch = box([0.04, 0.012, 0.05], [0, 0.052, -0.115]);
    const liner = new THREE.CircleGeometry(0.046, 20).rotateY(Math.PI).translate(0, -0.004, -0.19);
    // atadura desenrolada: uma fita larga e fina fazendo curvas no assento
    const strip = sweep(
      [
        [0.0, 0.0],
        [0.07, 0.03],
        [0.14, 0.0],
        [0.2, -0.05],
        [0.27, -0.03],
        [0.33, 0.03],
      ],
      [
        [-0.022, 0.003],
        [0.022, 0.003],
      ],
    );
    return {
      left: merge([gloveBody(), gloveThumb(1), cuff]),
      right: merge([gloveBody(), gloveThumb(-1), cuff.clone()]),
      strap: merge([strap, patch]),
      liner,
      roll: cyl(0.03, 0.03, 0.05, [0, 0.03, 0], { seg: 16, rot: [0, 0, HALF_PI] }),
      strip,
    };
  }, []);
  const leather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#8e1119',
        roughness: 0.28,
        metalness: 0.05,
        envMapIntensity: 1.1,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const white = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#ece6da', roughness: 0.5, side: THREE.DoubleSide }),
    [],
  );
  const dark = useMemo(() => new THREE.MeshLambertMaterial({ color: '#1a0c0c' }), []);
  const wrap = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#d9d2c2', side: THREE.DoubleSide }),
    [],
  );
  return (
    <Interactive id="gloves" label="objects.gloves">
      <group name="boxing-gloves">
        {/* de barriga para baixo */}
        <group position={[0, 0.056, 0]} rotation={[0.04, 0.6, 0]}>
          <mesh geometry={geo.left} material={leather} />
          <mesh geometry={geo.strap} material={white} />
          <mesh geometry={geo.liner} material={dark} />
        </group>
        {/* tombada de lado, encostada na outra */}
        <group position={[0.17, 0.062, 0.07]} rotation={[0, -0.5, 1.35]}>
          <mesh geometry={geo.right} material={leather} />
          <mesh geometry={geo.strap} material={white} />
          <mesh geometry={geo.liner} material={dark} />
        </group>
        <mesh
          geometry={geo.roll}
          material={wrap}
          position={[-0.16, 0, 0.1]}
          rotation={[0, 0.7, 0]}
        />
        <mesh
          geometry={geo.strip}
          material={wrap}
          position={[-0.13, 0, 0.12]}
          rotation={[0, 0.3, 0]}
        />
      </group>
    </Interactive>
  );
}

/**
 * Kimono de jiu-jitsu dobrado no assento da poltrona, com a faixa preta
 * por cima e a ponta caindo pelo braço.
 */
export function ArmchairKimono() {
  const geo = useMemo(
    () => ({
      gi: crease(
        merge([
          box([0.4, 0.045, 0.32], [0, 0.0225, 0]),
          box([0.38, 0.042, 0.31], [0.006, 0.066, 0.004], { rot: [0, 0.04, 0] }),
          box([0.36, 0.04, 0.29], [-0.004, 0.107, -0.003], { rot: [0, -0.03, 0] }),
        ]),
        40,
      ),
      collar: box([0.05, 0.014, 0.29], [-0.13, 0.133, -0.003], { rot: [0, -0.03, 0] }),
      belt: merge([
        box([0.3, 0.008, 0.045], [0.08, 0.131, 0.05]),
        box([0.14, 0.008, 0.045], [0.29, 0.2, 0.05], { rot: [0, 0, 0.45] }),
        box([0.045, 0.3, 0.008], [0.43, 0.06, 0.05], { rot: [0, 0, 0.05] }),
      ]),
    }),
    [],
  );
  const cloth = useMemo(() => new THREE.MeshLambertMaterial({ color: '#e6e1d6' }), []);
  const black = useMemo(() => new THREE.MeshLambertMaterial({ color: '#0e0d0e' }), []);
  return (
    <Interactive id="kimono" label="objects.kimono">
      <group name="kimono">
        <mesh geometry={geo.gi} material={cloth} />
        <mesh geometry={geo.collar} material={cloth} />
        <mesh geometry={geo.belt} material={black} />
      </group>
    </Interactive>
  );
}

/** Cabideiro de latão com a jaqueta de couro pendurada (perto da entrada). */
export function CoatStand({ position }: { position: [number, number, number] }) {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      stand: merge([
        cyl(0.2, 0.22, 0.03, [0, 0.015, 0], { seg: 18 }),
        cyl(0.018, 0.018, 1.8, [0, 0.92, 0], { seg: 8 }),
        cyl(0.03, 0.03, 0.04, [0, 1.83, 0], { seg: 8 }),
        ...[0, 1, 2, 3].map((k) =>
          cyl(
            0.008,
            0.008,
            0.16,
            [Math.sin((k * Math.PI) / 2) * 0.06, 1.72, Math.cos((k * Math.PI) / 2) * 0.06],
            {
              seg: 5,
              rot: [Math.cos((k * Math.PI) / 2) * 0.9, 0, -Math.sin((k * Math.PI) / 2) * 0.9],
            },
          ),
        ),
      ]),
      jacket: crease(
        merge([
          box([0.44, 0.62, 0.16], [0, 1.37, 0.12], { rot: [0.08, 0, 0] }),
          box([0.12, 0.56, 0.12], [-0.25, 1.35, 0.12], { rot: [0.05, 0, 0.1] }),
          box([0.12, 0.56, 0.12], [0.25, 1.35, 0.12], { rot: [0.05, 0, -0.1] }),
          box([0.3, 0.06, 0.12], [0, 1.69, 0.1]),
        ]),
        35,
      ),
      collar: box([0.32, 0.08, 0.05], [0, 1.66, 0.19], { rot: [-0.4, 0, 0] }),
    }),
    [],
  );
  const leather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#1c1210', roughness: 0.42, envMapIntensity: 0.9 }),
    [],
  );
  return (
    <Interactive id="jacket" label="objects.jacket">
      <group position={position} name="coat-stand">
        <mesh geometry={geo.stand} material={mat.brass} />
        <mesh geometry={geo.jacket} material={leather} />
        <mesh geometry={geo.collar} material={leather} />
        <mesh position={[0, 0.004, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[0.6, 0.6]} />
        </mesh>
      </group>
    </Interactive>
  );
}
