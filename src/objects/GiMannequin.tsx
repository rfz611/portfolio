import { useMemo } from 'react';
import * as THREE from 'three';
import { box, cyl, lathe, merge } from '../scene/geo';
import { useScene } from '../store/useScene';
import { makeCanvas } from '../textures/canvas';
import { paintGiWeave } from '../textures/gi';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';

/** Achatamento do tronco: mais largo nos ombros (x) que fundo (z). */
const SX = 1.22;
const SZ = 0.74;

/** Raio do manequim em cada altura (quadril, cintura, peito, ombro, pescoço). */
const TORSO: [number, number][] = [
  [0.15, 0.9],
  [0.16, 0.98],
  [0.13, 1.1],
  [0.16, 1.28],
  [0.15, 1.42],
  [0.11, 1.5],
  [0.055, 1.56],
  [0.05, 1.64],
];

function torsoR(y: number) {
  for (let k = 1; k < TORSO.length; k++) {
    const [r0, y0] = TORSO[k - 1];
    const [r1, y1] = TORSO[k];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return TORSO[TORSO.length - 1][0];
}

/** Abertura da frente (meio ângulo, a partir da frente): estreita na nuca, larga na barra. */
const gap = (t: number) => 0.32 + (1 - t) * 0.42;

/** Ponto do casaco: ângulo a partir da frente (+z) e altura. */
function jacketPoint(phi: number, y: number, out = 0.028) {
  const r = torsoR(y) + out + 0.006 * Math.sin(phi * 9 + y * 14);
  return new THREE.Vector3(Math.sin(phi) * r * SX, y, Math.cos(phi) * r * SZ);
}

const HEM = 0.86;
const NECK = 1.53;

/**
 * Casaco do kimono vestido no manequim: superfície com volume que acompanha
 * o tronco (com dobras leves), aberta na frente em V (estreita na nuca,
 * larga na barra).
 */
function jacketGeometry() {
  const rows = 22;
  const cols = 40;
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let j = 0; j <= rows; j++) {
    const t = j / rows;
    const y = HEM + (NECK - HEM) * t;
    const g = gap(t);
    for (let i = 0; i <= cols; i++) {
      const phi = g + ((Math.PI * 2 - 2 * g) * i) / cols;
      const p = jacketPoint(phi, y);
      pos.push(p.x, p.y, p.z);
      uv.push(i / cols, t);
    }
  }
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + cols + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Gola grossa: sobe pela frente esquerda, contorna a nuca e desce pela direita. */
function lapelGeometry() {
  const pts: THREE.Vector3[] = [];
  const steps = 12;
  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    pts.push(jacketPoint(-gap(t) + 0.02, HEM + (NECK - HEM) * t, 0.04));
  }
  for (let k = 1; k < 10; k++) {
    const phi = -gap(1) - ((Math.PI * 2 - 2 * gap(1)) * k) / 10;
    pts.push(jacketPoint(phi, NECK + 0.015, 0.035));
  }
  for (let k = steps; k >= 0; k--) {
    const t = k / steps;
    pts.push(jacketPoint(gap(t) - 0.02, HEM + (NECK - HEM) * t, 0.04));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, 120, 0.022, 8, false);
}

/** Manga: tubo que sai do ombro e cai, um pouco para fora e para a frente. */
function sleeveGeometry(side: number) {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 0.19, 1.47, 0.0),
    new THREE.Vector3(side * 0.26, 1.36, 0.01),
    new THREE.Vector3(side * 0.29, 1.15, 0.035),
    new THREE.Vector3(side * 0.3, 0.97, 0.06),
  ]);
  const g = new THREE.TubeGeometry(curve, 24, 0.064, 12, false);
  g.scale(1, 1, 0.85);
  return g;
}

/**
 * Kimono de jiu-jitsu vestido num manequim de alfaiate, aberto na frente,
 * com volume e curvas: o casaco acompanha o tronco, a gola grossa em
 * relevo contorna a nuca, as mangas caem dos ombros e a faixa preta dá a
 * volta na cintura com o nó e as duas pontas. Clicar abre a ficha.
 */
export function GiMannequin() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const waist = 1.03;
    const wr = torsoR(waist) + 0.04;
    const belt = new THREE.TorusGeometry(wr, 0.02, 6, 40)
      .rotateX(Math.PI / 2)
      .scale(SX, 0.55, SZ)
      .translate(0, waist, 0);
    const front = wr * SZ + 0.01;
    return {
      form: lathe(
        TORSO.map(([r, y]) => [r, y] as [number, number]),
        { seg: 28 },
      ).scale(SX, 1, SZ),
      stand: merge([
        cyl(0.2, 0.22, 0.03, [0, 0.015, 0], { seg: 24 }),
        cyl(0.016, 0.016, 0.88, [0, 0.47, 0], { seg: 10 }),
      ]),
      jacket: jacketGeometry(),
      lapel: lapelGeometry(),
      sleeves: merge([sleeveGeometry(1), sleeveGeometry(-1)]),
      belt: merge([
        belt,
        box([0.07, 0.05, 0.03], [0, waist, front]),
        box([0.04, 0.2, 0.012], [-0.03, waist - 0.11, front + 0.01], { rot: [0.05, 0, -0.18] }),
        box([0.04, 0.18, 0.012], [0.035, waist - 0.1, front + 0.012], { rot: [0.05, 0, 0.22] }),
      ]),
    };
  }, []);
  const mats = useMemo(() => {
    const map = new THREE.CanvasTexture(makeCanvas(128, 128, paintGiWeave));
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(6, 4);
    return {
      cloth: new THREE.MeshStandardMaterial({
        map,
        color: '#fff0dc',
        roughness: 0.9,
        side: THREE.DoubleSide,
        emissive: '#3a3026',
        emissiveIntensity: 0.4,
      }),
      form: new THREE.MeshStandardMaterial({ color: '#2a1214', roughness: 0.85 }),
      belt: new THREE.MeshStandardMaterial({ color: '#121113', roughness: 0.7 }),
    };
  }, []);
  return (
    <group name="gi-mannequin">
      <mesh geometry={geo.stand} material={mat.walnut} />
      <mesh geometry={geo.form} material={mats.form} />
      <Interactive
        id="kimono"
        label="objects.kimono"
        onClick={() => useScene.getState().setDossier('gi')}
      >
        <mesh geometry={geo.jacket} material={mats.cloth} />
        <mesh geometry={geo.lapel} material={mats.cloth} />
        <mesh geometry={geo.sleeves} material={mats.cloth} />
        <mesh geometry={geo.belt} material={mats.belt} />
      </Interactive>
    </group>
  );
}
