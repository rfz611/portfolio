import { useMemo } from 'react';
import * as THREE from 'three';
import { ROOM } from '../config/layout';
import { box, crease, cyl, merge } from '../scene/geo';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';

const HALF_PI = Math.PI / 2;

/**
 * Detalhes pessoais do Raphael (espaços reservados da especificação).
 * Cada um mostra um rótulo curto ao passar o mouse; trocar o modelo ou
 * o texto depois não mexe no resto.
 */

/** Luvas de boxe penduradas pelo cadarço num gancho de latão. */
export function BoxingGloves() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const glove = (side: number) => {
      const fist = new THREE.SphereGeometry(0.085, 12, 9).scale(1, 1.15, 0.95);
      const thumb = new THREE.SphereGeometry(0.04, 8, 6)
        .scale(1, 1.4, 1)
        .translate(side * 0.07, 0.01, 0.04);
      const cuff = cyl(0.06, 0.065, 0.11, [0, -0.13, 0], { seg: 12 });
      return crease(merge([fist, thumb, cuff]).translate(side * 0.06, -0.28, 0.07), 60);
    };
    return {
      gloves: merge([glove(-1), glove(1)]),
      cuffs: merge([
        cyl(0.066, 0.066, 0.03, [-0.06, -0.39, 0.07], { seg: 12, open: true }),
        cyl(0.066, 0.066, 0.03, [0.06, -0.39, 0.07], { seg: 12, open: true }),
      ]),
      laces: merge([
        cyl(0.003, 0.003, 0.2, [-0.03, -0.09, 0.05], { seg: 4, rot: [0, 0, -0.3] }),
        cyl(0.003, 0.003, 0.2, [0.03, -0.09, 0.05], { seg: 4, rot: [0, 0, 0.3] }),
      ]),
      hook: crease(
        merge([
          box([0.05, 0.09, 0.015], [0, 0, 0.008]),
          cyl(0.008, 0.008, 0.07, [0, 0.0, 0.045], { seg: 6, rot: [HALF_PI, 0, 0] }),
        ]),
        30,
      ),
      wraps: cyl(0.03, 0.03, 0.05, [0.0, -0.46, 0.06], { seg: 10, rot: [0, 0, HALF_PI] }),
    };
  }, []);
  const red = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#7a0d14', roughness: 0.38, envMapIntensity: 0.8 }),
    [],
  );
  const white = useMemo(() => new THREE.MeshLambertMaterial({ color: '#d8d2c4' }), []);
  return (
    <Interactive id="gloves" label="objects.gloves">
      <group
        position={[ROOM.x0 + 0.02, 1.48, -2.25]}
        rotation={[0, HALF_PI, 0]}
        name="boxing-gloves"
      >
        <mesh geometry={geo.hook} material={mat.brass} />
        <mesh geometry={geo.laces} material={white} />
        <mesh geometry={geo.gloves} material={red} />
        <mesh geometry={geo.cuffs} material={white} />
        <mesh geometry={geo.wraps} material={white} />
      </group>
    </Interactive>
  );
}

/** Kimono de jiu-jitsu dobrado, com a faixa preta por cima (fica na poltrona). */
export function FoldedKimono() {
  const geo = useMemo(
    () => ({
      gi: crease(
        merge([
          box([0.4, 0.05, 0.3], [0, 0.025, 0]),
          box([0.38, 0.045, 0.29], [0.005, 0.072, 0.004], { rot: [0, 0.04, 0] }),
          box([0.36, 0.04, 0.27], [-0.004, 0.115, -0.002], { rot: [0, -0.03, 0] }),
        ]),
        40,
      ),
      belt: merge([
        box([0.42, 0.008, 0.045], [0, 0.139, 0.03]),
        box([0.045, 0.008, 0.2], [0.12, 0.139, 0.05], { rot: [0, 0.4, 0] }),
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
