import { useMemo } from 'react';
import * as THREE from 'three';
import { box, crease, cyl, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintGloveBody, paintGloveCuff } from '../textures/gloves';
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
 * Corpo da luva de boxe: um ovo deitado ao longo do comprimento (os polos
 * ficam na ponta e no pulso, para o nome nas costas da mão não deformar),
 * moldado vértice a vértice: frente cheia (o punho fechado), rolo dos dedos
 * em cima, dobra dos dedos embaixo e afinando até o pulso. Aponta para +z.
 */
function gloveBody() {
  const g = new THREE.SphereGeometry(1, 44, 30).rotateX(Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let y = p.getY(i);
    const z = p.getZ(i);
    const taper = 1 - 0.3 * smooth(0, -1, z);
    x *= taper;
    y *= taper;
    if (y > 0) y += 0.16 * smooth(0.2, 0.75, z) * (1 - Math.abs(x) * 0.6);
    if (y < 0) y += 0.14 * Math.exp(-((z - 0.55) ** 2) / 0.02);
    // lado do polegar um pouco mais reto, como luva de verdade
    x *= 1 - 0.06 * smooth(0.2, 1, Math.abs(x));
    p.setXYZ(i, x * 0.064, y * 0.057, z * 0.1);
  }
  g.computeVertexNormals();
  return g;
}

/** Polegar colado na lateral do punho, apontando para a frente. */
function gloveThumb(side: number) {
  const g = new THREE.CapsuleGeometry(0.02, 0.065, 8, 14);
  g.rotateX(Math.PI / 2);
  g.rotateY(side * 0.28);
  g.rotateZ(side * 0.45);
  g.translate(side * 0.052, -0.006, 0.03);
  return g;
}

/**
 * Luvas de boxe brancas (como as da foto do Raphael): couro branco,
 * punho longo branco com a tira de velcro, MAXIMUM BOXING em preto nas
 * costas da mão e a etiqueta preta na tira. Largadas no assento do sofá,
 * uma de barriga para baixo e a outra tombada de lado.
 */
export function LooseGloves() {
  const geo = useMemo(() => {
    const cuff = new THREE.CylinderGeometry(0.049, 0.053, 0.13, 28, 1, true)
      .rotateX(Math.PI / 2)
      .translate(0, -0.004, -0.14);
    const strap = new THREE.CylinderGeometry(0.0565, 0.0565, 0.06, 28, 1, true)
      .rotateX(Math.PI / 2)
      .translate(0, -0.004, -0.135);
    const strapEdge = new THREE.TorusGeometry(0.0565, 0.0025, 6, 28).translate(0, -0.004, 0);
    const liner = new THREE.CircleGeometry(0.048, 24).rotateY(Math.PI).translate(0, -0.004, -0.2);
    return {
      body: gloveBody(),
      thumbL: gloveThumb(1),
      thumbR: gloveThumb(-1),
      cuff,
      strap,
      edges: merge([
        strapEdge.clone().translate(0, 0, -0.105),
        strapEdge.clone().translate(0, 0, -0.165),
      ]),
      liner,
    };
  }, []);
  const mats = useMemo(() => {
    const leather = (map?: THREE.Texture) =>
      new THREE.MeshStandardMaterial({
        map,
        color: '#ffe0bc',
        roughness: 0.34,
        metalness: 0.02,
        envMapIntensity: 1,
        // um fundo quente, para o branco não ficar azulado com a luz da cidade
        emissive: '#6e6052',
        emissiveIntensity: 0.55,
      });
    return {
      body: leather(tex(makeCanvas(1024, 512, paintGloveBody), { aniso: 8 })),
      plain: leather(),
      strap: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(512, 128, paintGloveCuff), { aniso: 8 }),
        emissive: '#6e6052',
        emissiveIntensity: 0.5,
        roughness: 0.4,
        side: THREE.DoubleSide,
        envMapIntensity: 0.9,
      }),
      cuff: new THREE.MeshStandardMaterial({
        color: '#f1eee8',
        emissive: '#6e6052',
        emissiveIntensity: 0.5,
        roughness: 0.38,
        side: THREE.DoubleSide,
        envMapIntensity: 0.9,
      }),
      liner: new THREE.MeshStandardMaterial({ color: '#2a2724', roughness: 0.8 }),
    };
  }, []);
  const glove = (side: 1 | -1) => (
    <>
      <mesh geometry={geo.body} material={mats.body} />
      <mesh geometry={side === 1 ? geo.thumbL : geo.thumbR} material={mats.plain} />
      <mesh geometry={geo.cuff} material={mats.cuff} />
      <mesh geometry={geo.strap} material={mats.strap} />
      <mesh geometry={geo.edges} material={mats.cuff} />
      <mesh geometry={geo.liner} material={mats.liner} />
    </>
  );
  return (
    <Interactive id="gloves" label="objects.gloves">
      <group name="boxing-gloves">
        {/* de barriga para baixo, com as costas da mão (e o nome) para cima */}
        <group position={[0, 0.058, 0]} rotation={[0.04, 0.6, 0]}>
          {glove(1)}
        </group>
        {/* tombada de lado, encostada na outra */}
        <group position={[0.19, 0.064, 0.08]} rotation={[0, -0.5, 1.35]}>
          {glove(-1)}
        </group>
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
