import { useMemo } from 'react';
import * as THREE from 'three';
import { MarchingCubes } from 'three/examples/jsm/objects/MarchingCubes.js';
import { box, crease, cyl, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintGloveCuff, paintGloveLabel } from '../textures/gloves';
import { Interactive } from './Interactive';

const HALF_PI = Math.PI / 2;

/**
 * Detalhes pessoais do Raphael (espaços reservados da especificação).
 * Cada um mostra um rótulo curto ao passar o mouse; trocar o modelo ou
 * o texto depois não mexe no resto.
 */

/** Meia aresta do cubo onde a luva é "modelada" (m). */
const GLOVE_HALF = 0.15;

/**
 * Corpo da luva de boxe com formato de mão fechada, modelado como massa:
 * bolhas que se fundem (metaballs) no punho, nas costas da mão, nos nós
 * dos dedos, na frente fechada, nos dedos dobrados por baixo e no polegar
 * colado na lateral. Pulso em -z, dedos em +z, costas da mão em +y;
 * side = 1 ou -1 põe o polegar de um lado ou do outro (luva esquerda/direita).
 */
function gloveBody(side: number) {
  const mc = new MarchingCubes(44, new THREE.MeshBasicMaterial(), false, false, 40000);
  mc.reset();
  const k = 1 / (2 * GLOVE_HALF);
  // raio da superfície de cada bolha sozinha (m): força = (r/cubo)² x (isolamento + 12)
  // queda curta (subtract alto): cada bolha mantém a forma e só se funde na borda
  const S = 48;
  const ball = (x: number, y: number, z: number, r: number) =>
    mc.addBall(0.5 + x * k, 0.5 + y * k, 0.5 + z * k, (r * k) ** 2 * (mc.isolation + S), S);
  ball(0, -0.002, -0.07, 0.046); // pulso (entra no punho)
  ball(0, -0.002, -0.1, 0.044);
  ball(0, 0.012, -0.028, 0.044); // costas da mão
  ball(0.02, 0.022, 0.016, 0.042); // nós dos dedos (o alto da luva)
  ball(-0.02, 0.022, 0.016, 0.042);
  ball(0, 0.004, 0.052, 0.047); // frente fechada
  ball(0, -0.032, 0.05, 0.036); // dedos dobrados por baixo
  ball(0, -0.022, -0.01, 0.036); // palma
  // polegar: três bolhas ao longo da lateral, de trás para a frente e para baixo
  ball(side * 0.043, -0.012, -0.022, 0.022);
  ball(side * 0.054, -0.02, 0.008, 0.021);
  ball(side * 0.05, -0.03, 0.036, 0.019);
  mc.update();
  const n = mc.count;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(mc.positionArray.slice(0, n * 3), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(mc.normalArray.slice(0, n * 3), 3));
  g.scale(GLOVE_HALF, GLOVE_HALF, GLOVE_HALF);
  mc.geometry.dispose();
  return g;
}

/** Altura das costas da mão no meio da luva (para assentar a etiqueta do nome). */
function backTop(g: THREE.BufferGeometry, z: number) {
  const p = g.attributes.position as THREE.BufferAttribute;
  let top = 0;
  for (let i = 0; i < p.count; i++) {
    if (Math.abs(p.getX(i)) < 0.008 && Math.abs(p.getZ(i) - z) < 0.008)
      top = Math.max(top, p.getY(i));
  }
  return top;
}

/** Etiqueta MAXIMUM / BOXING curvada por cima das costas da mão. */
function gloveLabel(top: number, z: number) {
  const g = new THREE.PlaneGeometry(0.07, 0.05, 12, 6).rotateX(-Math.PI / 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const dz = p.getZ(i);
    // acompanha a curva da luva nos dois sentidos
    p.setY(i, top + 0.0015 - 9 * x * x - 4 * dz * dz);
    p.setZ(i, z + dz);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Só decoração (sem rótulo nem contorno no mouse).
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
    const left = gloveBody(1);
    const right = gloveBody(-1);
    const labelZ = 0.0;
    return {
      left,
      right,
      label: gloveLabel(backTop(left, labelZ), labelZ),
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
      plain: leather(),
      label: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(512, 384, paintGloveLabel), { clamp: true, aniso: 8 }),
        transparent: true,
        roughness: 0.4,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
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
      <mesh geometry={side === 1 ? geo.left : geo.right} material={mats.plain} />
      <mesh geometry={geo.label} material={mats.label} />
      <mesh geometry={geo.cuff} material={mats.cuff} />
      <mesh geometry={geo.strap} material={mats.strap} />
      <mesh geometry={geo.edges} material={mats.cuff} />
      <mesh geometry={geo.liner} material={mats.liner} />
    </>
  );
  return (
    <>
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
    </>
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
