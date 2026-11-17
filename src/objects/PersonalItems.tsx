import { useMemo } from 'react';
import * as THREE from 'three';
import { box, crease, cyl, merge } from '../scene/geo';
import { sweep } from '../scene/sweep';
import { makeCanvas, tex } from '../textures/canvas';
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
 * Luvas de boxe brancas com detalhes pretos, largadas no assento do sofá, perto da ponta: uma de
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
      left: merge([gloveBody(), gloveThumb(1)]),
      right: merge([gloveBody(), gloveThumb(-1)]),
      cuff,
      strap,
      patch,
      liner,
      roll: cyl(0.03, 0.03, 0.05, [0, 0.03, 0], { seg: 16, rot: [0, 0, HALF_PI] }),
      strip,
    };
  }, []);
  const leather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f1eee8',
        roughness: 0.3,
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
  const dark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#121214',
        roughness: 0.35,
        envMapIntensity: 1,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const wrap = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#1c1c1e', side: THREE.DoubleSide }),
    [],
  );
  return (
    <Interactive id="gloves" label="objects.gloves">
      <group name="boxing-gloves">
        {/* de barriga para baixo */}
        <group position={[0, 0.056, 0]} rotation={[0.04, 0.6, 0]}>
          <mesh geometry={geo.left} material={leather} />
          <mesh geometry={geo.cuff} material={dark} />
          <mesh geometry={geo.strap} material={dark} />
          <mesh geometry={geo.patch} material={white} />
          <mesh geometry={geo.liner} material={dark} />
        </group>
        {/* tombada de lado, encostada na outra */}
        <group position={[0.17, 0.062, 0.07]} rotation={[0, -0.5, 1.35]}>
          <mesh geometry={geo.right} material={leather} />
          <mesh geometry={geo.cuff} material={dark} />
          <mesh geometry={geo.strap} material={dark} />
          <mesh geometry={geo.patch} material={white} />
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

/** Tecido do kimono: trama grossa branca, gola reforçada e costuras. */
function paintGi(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ece8df';
  ctx.fillRect(0, 0, w, h);
  // trama do tecido trançado
  for (let y = 0; y < h; y += 4) {
    for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) {
      ctx.fillStyle = 'rgba(120,110,95,0.12)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  // gola: faixa grossa pelas duas bordas compridas
  for (const x of [0, w - w * 0.12]) {
    ctx.fillStyle = '#e2ddd2';
    ctx.fillRect(x, 0, w * 0.12, h);
    ctx.strokeStyle = 'rgba(90,80,65,0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(x + (w * 0.12 * k) / 4, 0);
      ctx.lineTo(x + (w * 0.12 * k) / 4, h);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  // dobras com sombra suave
  for (let y = 0; y < h; y += h / 7) {
    const g = ctx.createLinearGradient(0, y, 0, y + h / 14);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(60,50,40,0.12)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, h / 14);
  }
}

/**
 * Pano jogado por cima de um braço de poltrona: segue um caminho no
 * plano xy (assento → por cima do braço → caindo do lado de fora) e se
 * estende em z, com ondinhas de dobra.
 */
function drapeGeometry(path: [number, number][], width: number, folds: number) {
  const g = new THREE.PlaneGeometry(1, width, path.length - 1, 8);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const t = Math.round((p.getX(i) + 0.5) * (path.length - 1));
    const z = p.getY(i);
    const [x, y] = path[t];
    const prev = path[Math.max(0, t - 1)];
    const next = path[Math.min(path.length - 1, t + 1)];
    const nx = -(next[1] - prev[1]);
    const ny = next[0] - prev[0];
    const len = Math.hypot(nx, ny) || 1;
    const wave = Math.sin(z * folds) * 0.009 * (t / path.length);
    p.setXYZ(i, x + (nx / len) * wave, y + (ny / len) * wave, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Caminho por cima do braço direito da poltrona (centro do rolo em x 0.37, y 0.68). */
function overArm(seatX: number, fallTo: number, steps = 22): [number, number][] {
  const out: [number, number][] = [];
  const seatSteps = 5;
  for (let k = 0; k < seatSteps; k++) out.push([seatX + (k / seatSteps) * (0.27 - seatX), 0.575]);
  const arcSteps = 9;
  for (let k = 0; k <= arcSteps; k++) {
    const a = Math.PI - (k / arcSteps) * Math.PI;
    out.push([0.37 + Math.cos(a) * 0.115, 0.68 + Math.sin(a) * 0.115 - (k === 0 ? 0.0 : 0)]);
  }
  const rest = steps - out.length;
  for (let k = 1; k <= rest; k++) {
    out.push([0.49 + k * 0.004, 0.68 - (k / rest) * (0.68 - fallTo)]);
  }
  return out;
}

/**
 * Kimono de jiu-jitsu aberto, jogado por cima do braço da poltrona: o
 * corpo cai pelos dois lados, uma manga pendura para fora e a faixa preta
 * escorre junto.
 */
export function ArmchairKimono() {
  const geo = useMemo(
    () => ({
      body: drapeGeometry(overArm(0.0, 0.15), 0.62, 30),
      sleeve: new THREE.CylinderGeometry(0.06, 0.075, 0.5, 12, 1, true)
        .scale(1, 1, 0.55)
        .rotateZ(0.12)
        .translate(0.53, 0.4, 0.22),
      belt: drapeGeometry(overArm(0.12, 0.08), 0.045, 0),
    }),
    [],
  );
  const cloth = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        map: tex(makeCanvas(256, 256, paintGi), { clamp: true }),
        side: THREE.DoubleSide,
      }),
    [],
  );
  const black = useMemo(
    () => new THREE.MeshLambertMaterial({ color: '#0e0d0e', side: THREE.DoubleSide }),
    [],
  );
  return (
    <Interactive id="kimono" label="objects.kimono">
      <group name="kimono">
        <mesh geometry={geo.body} material={cloth} />
        <mesh geometry={geo.sleeve} material={cloth} />
        <mesh geometry={geo.belt} material={black} position={[0.004, 0.006, -0.05]} />
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
