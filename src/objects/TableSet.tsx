import { useEffect, useMemo } from 'react';
import { playClick } from '../audio/player';
import { useScene } from '../store/useScene';
import { Interactive } from './Interactive';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, crease, cyl, lathe, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { hdr, lib } from '../textures/library';
import {
  paintBurgundyGoldDial,
  paintCroco,
  paintEngravedGold,
  paintRedAshtray,
  paintRedSteelDial,
} from '../textures/tableSet';

const HALF_PI = Math.PI / 2;
type P2 = [number, number];

/** Peças repetidas ao longo de um caminho no plano (x, z), viradas na direção dele. */
function alongPath(
  points: P2[],
  count: number,
  make: (pos: THREE.Vector3, yaw: number, i: number) => THREE.BufferGeometry[],
) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)));
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const pos = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    parts.push(...make(pos, Math.atan2(tan.x, tan.z), i));
  }
  return merge(parts);
}

function rounded(w: number, h: number, d: number, r: number, y = 0) {
  const g = new RoundedBoxGeometry(w, h, d, 3, r).toNonIndexed();
  g.clearGroups();
  return g.translate(0, y, 0);
}

/**
 * Relógio de aço com mostrador vermelho: caixa quadrada de cantos
 * arredondados (formato de TV), coroa às 3 e pulseira integrada de elos
 * escovados com o elo do meio polido. Deitado aberto, pulseira esticada.
 */
export function SteelWatch() {
  const geo = useMemo(() => {
    const half = 0.0215;
    const strap = (sign: number): P2[] => [
      [0, sign * half],
      [sign * 0.004, sign * (half + 0.03)],
      [sign * -0.002, sign * (half + 0.062)],
    ];
    const links = (sign: number, polished: boolean) =>
      alongPath(strap(sign), 9, (p, yaw) =>
        polished
          ? [box([0.008, 0.0042, 0.0062], [p.x, 0.0035, p.z], { rot: [0, yaw, 0] })]
          : [
              box([0.0075, 0.0038, 0.0066], [p.x, 0.0033, p.z], { rot: [0, yaw, 0] }).translate(
                Math.cos(yaw) * 0.0082,
                0,
                -Math.sin(yaw) * 0.0082,
              ),
              box([0.0075, 0.0038, 0.0066], [p.x, 0.0033, p.z], { rot: [0, yaw, 0] }).translate(
                -Math.cos(yaw) * 0.0082,
                0,
                Math.sin(yaw) * 0.0082,
              ),
            ],
      );
    return {
      case: rounded(0.04, 0.011, 0.043, 0.007, 0.0065),
      bezel: rounded(0.036, 0.0016, 0.038, 0.0008, 0.0125),
      dial: new THREE.PlaneGeometry(0.031, 0.033).rotateX(-HALF_PI).translate(0, 0.0134, 0),
      crown: cyl(0.0024, 0.0024, 0.004, [0.0215, 0.0065, 0], { seg: 10, rot: [0, 0, HALF_PI] }),
      brushed: merge([links(1, false), links(-1, false)]),
      polished: merge([links(1, true), links(-1, true)]),
    };
  }, []);
  const mats = useMemo(
    () => ({
      brushed: new THREE.MeshStandardMaterial({
        color: '#c6cbd2',
        metalness: 1,
        roughness: 0.32,
        envMapIntensity: 1.8,
      }),
      polished: new THREE.MeshStandardMaterial({
        color: '#e8ebef',
        metalness: 0.8,
        roughness: 0.18,
        envMapIntensity: 1.8,
      }),
      dial: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(256, 272, paintRedSteelDial), { clamp: true }),
        roughness: 0.25,
        metalness: 0.2,
        envMapIntensity: 0.8,
      }),
    }),
    [],
  );
  return (
    <group name="steel-watch">
      <mesh geometry={geo.case} material={mats.brushed} />
      <mesh geometry={geo.bezel} material={mats.polished} />
      <mesh geometry={geo.dial} material={mats.dial} />
      <mesh geometry={geo.crown} material={mats.polished} />
      <mesh geometry={geo.brushed} material={mats.brushed} />
      <mesh geometry={geo.polished} material={mats.polished} />
    </group>
  );
}

/**
 * Relógio dourado antigo: caixa retangular abaulada de ouro gravado com as
 * alças marcadas nos cantos, mostrador bordô de números dourados e
 * pulseira de couro de crocodilo marrom com fivela dourada.
 */
export function GoldWatch() {
  const geo = useMemo(() => {
    const half = 0.021;
    const strap = (sign: number, length: number): P2[] => [
      [0, sign * half],
      [sign * 0.003, sign * (half + length * 0.5)],
      [sign * -0.003, sign * (half + length)],
    ];
    const piece = (sign: number, length: number) =>
      alongPath(strap(sign, length), 10, (p, yaw) => [
        box([0.017, 0.003, length / 9 + 0.0012], [p.x, 0.0018, p.z], { rot: [0, yaw, 0] }),
      ]);
    // ponta que se curva e deita por cima da pulseira de aço (sobe um pouco no fim)
    const overlap = (() => {
      const curve = new THREE.CatmullRomCurve3(
        [
          [0, 0.0018, half],
          [-0.006, 0.0022, half + 0.022],
          [-0.03, 0.0045, half + 0.04],
          [-0.062, 0.0082, half + 0.05],
          [-0.088, 0.0086, half + 0.052],
        ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
      );
      const parts: THREE.BufferGeometry[] = [];
      const n = 12;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const p = curve.getPointAt(t);
        const tan = curve.getTangentAt(t);
        const yaw = Math.atan2(tan.x, tan.z);
        const pitch = -Math.asin(tan.y);
        parts.push(
          box([0.017, 0.003, curve.getLength() / (n - 1) + 0.0012], [p.x, p.y, p.z], {
            rot: [pitch, yaw, 0],
          }),
        );
      }
      return merge(parts);
    })();
    const lugs: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        lugs.push(box([0.006, 0.007, 0.008], [sx * 0.0115, 0.0055, sz * 0.022]));
      }
    }
    return {
      case: rounded(0.03, 0.01, 0.04, 0.006, 0.006),
      lugs: crease(merge(lugs), 30),
      dial: new THREE.PlaneGeometry(0.022, 0.031).rotateX(-HALF_PI).translate(0, 0.0112, 0),
      crown: cyl(0.0022, 0.0022, 0.004, [0.016, 0.006, 0], { seg: 10, rot: [0, 0, HALF_PI] }),
      strap: merge([overlap, piece(-1, 0.075)]),
      buckle: box([0.019, 0.003, 0.004], [-0.002, 0.0035, -(0.021 + 0.074)]),
    };
  }, []);
  const mats = useMemo(() => {
    const engraved = tex(makeCanvas(96, 128, paintEngravedGold));
    return {
      gold: new THREE.MeshStandardMaterial({
        map: engraved,
        color: '#ffe2a0',
        metalness: 1,
        roughness: 0.24,
        envMapIntensity: 2,
      }),
      dial: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(176, 248, paintBurgundyGoldDial), { clamp: true }),
        roughness: 0.3,
        metalness: 0.15,
        envMapIntensity: 0.7,
      }),
      croco: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(64, 128, paintCroco), { repeat: [1, 1] }),
        roughness: 0.38,
        envMapIntensity: 0.9,
      }),
    };
  }, []);
  return (
    <group name="gold-watch">
      <mesh geometry={geo.case} material={mats.gold} />
      <mesh geometry={geo.lugs} material={mats.gold} />
      <mesh geometry={geo.dial} material={mats.dial} />
      <mesh geometry={geo.crown} material={mats.gold} />
      <mesh geometry={geo.strap} material={mats.croco} />
      <mesh geometry={geo.buckle} material={mats.gold} />
    </group>
  );
}

/**
 * Cinzeiro de cerâmica vermelha, raso e redondo, com a faixa branca em
 * "telhado" pintada por dentro (sem nome de marca) e um cigarro apoiado.
 */
export function RedAshtray() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const R = 0.082;
    const g = crease(
      lathe(
        [
          [0.001, 0.01],
          [0.048, 0.01],
          [0.058, 0.02],
          [0.064, 0.03],
          [0.069, 0.036],
          [0.076, 0.037],
          [0.081, 0.032],
          [0.082, 0.022],
          [0.078, 0.006],
          [0.07, 0],
          [0.001, 0],
        ],
        { seg: 36 },
      ),
      38,
    );
    // projeção vista de cima: a pintura do telhado cai certinho por dentro
    const p = g.attributes.position as THREE.BufferAttribute;
    const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      uv[i * 2] = p.getX(i) / (2 * R) + 0.5;
      uv[i * 2 + 1] = 0.5 - p.getZ(i) / (2 * R);
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const rot: [number, number, number] = [0, 0.35, HALF_PI - 0.12];
    return {
      dish: g,
      paper: cyl(0.0042, 0.0042, 0.062, [0.052, 0.036, 0.018], { seg: 10, rot }),
      filter: cyl(0.0043, 0.0043, 0.024, [0.094, 0.04, 0.003], { seg: 10, rot }),
      tip: cyl(0.0041, 0.0041, 0.006, [0.022, 0.032, 0.029], { seg: 10, rot }),
    };
  }, []);
  const mats = useMemo(
    () => ({
      ceramic: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(256, 256, paintRedAshtray), { clamp: true }),
        roughness: 0.16,
        metalness: 0,
        envMapIntensity: 1.3,
      }),
      paper: new THREE.MeshStandardMaterial({ color: '#f1ede4', roughness: 0.7 }),
      filter: new THREE.MeshStandardMaterial({ color: '#c98a3c', roughness: 0.75 }),
    }),
    [],
  );
  return (
    <group name="red-ashtray">
      <mesh geometry={geo.dish} material={mats.ceramic} />
      <mesh geometry={geo.paper} material={mats.paper} />
      <mesh geometry={geo.filter} material={mats.filter} />
      <mesh geometry={geo.tip} material={mat.ash} />
    </group>
  );
}

/** Contorno ondulado do porta-joias (como uma poça de metal), em metros. */
function trayOutline(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    const wobble = 1 + 0.07 * Math.sin(3 * a + 1) + 0.045 * Math.sin(5 * a + 0.4);
    pts.push(new THREE.Vector3(Math.cos(a) * 0.18 * wobble, 0, Math.sin(a) * 0.125 * wobble));
  }
  return new THREE.CatmullRomCurve3(pts, true, 'centripetal').getPoints(80);
}

/**
 * Porta-joias cromado de borda ondulada, fundo espelhado e borda redonda
 * e grossa, com a carteira, os dois relógios e a corrente de ouro.
 */
export function JewelryTray() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const outline = trayOutline();
    const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, -p.z)));
    const base = new THREE.ExtrudeGeometry(shape, { depth: 0.004, bevelEnabled: false });
    base.rotateX(-HALF_PI);
    const rimCurve = new THREE.CatmullRomCurve3(
      outline.map((p) => new THREE.Vector3(p.x, 0.0065, p.z)),
      true,
    );
    const chainPath = new THREE.CatmullRomCurve3(
      [
        [-0.06, 0.0052, 0.085],
        [-0.02, 0.0052, 0.07],
        [0.0, 0.0052, 0.092],
        [0.04, 0.0052, 0.078],
        [0.07, 0.0052, 0.095],
        [0.11, 0.0052, 0.07],
        [0.13, 0.0052, 0.035],
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    );
    return {
      base,
      rim: new THREE.TubeGeometry(rimCurve, 120, 0.0075, 10, true),
      wallet: rounded(0.105, 0.016, 0.085, 0.005, 0.012),
      card: box([0.054, 0.0012, 0.085], [0.016, 0.012, 0]),
      chain: new THREE.TubeGeometry(chainPath, 80, 0.003, 6, false),
    };
  }, []);
  const mats = useMemo(
    () => ({
      mirror: new THREE.MeshStandardMaterial({
        color: '#dfe4ea',
        metalness: 0.9,
        roughness: 0.2,
        envMapIntensity: 1.5,
      }),
      leather: new THREE.MeshStandardMaterial({
        color: '#1a1412',
        roughness: 0.48,
        envMapIntensity: 0.8,
      }),
      card: new THREE.MeshStandardMaterial({ color: '#c9a44e', metalness: 0.6, roughness: 0.35 }),
    }),
    [],
  );
  return (
    <group name="jewelry-tray">
      <mesh geometry={geo.base} material={mats.mirror} />
      <mesh geometry={geo.rim} material={mats.mirror} />
      <group position={[-0.105, 0, -0.005]} rotation={[0, 0.32, 0]}>
        <mesh geometry={geo.card} material={mats.card} />
        <mesh geometry={geo.wallet} material={mats.leather} />
      </group>
      <group position={[0.05, 0.004, 0.032]} rotation={[0, HALF_PI + 0.12, 0]}>
        <SteelWatch />
      </group>
      <group position={[0.055, 0.004, -0.05]} rotation={[0, HALF_PI - 0.14, 0]}>
        <GoldWatch />
      </group>
      <mesh geometry={geo.chain} material={mat.brass} />
    </group>
  );
}

/**
 * Luminária-cogumelo pequena de vidro vermelho na ponta da mesa: acende
 * por baixo e faz uma poça de luz quente só sobre as coisas da mesa.
 */
export function MushroomLamp() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      base: crease(
        lathe(
          [
            [0.001, 0],
            [0.062, 0],
            [0.06, 0.012],
            [0.016, 0.02],
          ],
          { seg: 24 },
        ),
        35,
      ),
      stem: cyl(0.012, 0.014, 0.15, [0, 0.095, 0], { seg: 14 }),
      shade: new THREE.SphereGeometry(0.105, 28, 12, 0, Math.PI * 2, 0, HALF_PI)
        .scale(1, 0.62, 1)
        .translate(0, 0.165, 0),
      under: new THREE.CircleGeometry(0.1, 24).rotateX(HALF_PI).translate(0, 0.164, 0),
    }),
    [],
  );
  const mats = useMemo(
    () => ({
      shade: new THREE.MeshStandardMaterial({
        color: '#b51d10',
        emissive: '#ff3a10',
        emissiveIntensity: 0.42,
        roughness: 0.22,
        envMapIntensity: 1.2,
      }),
      under: new THREE.MeshBasicMaterial({ color: hdr('#ffa060', 0.7), toneMapped: false }),
    }),
    [],
  );
  const on = useScene((s) => s.tableLamp);
  useEffect(() => {
    mats.shade.emissiveIntensity = on ? 0.42 : 0;
    mats.under.color.copy(on ? hdr('#ffa060', 0.7) : new THREE.Color('#3a2a22'));
  }, [on, mats]);
  return (
    <Interactive
      id="table-lamp"
      label={on ? 'objects.lampOff' : 'objects.lampOn'}
      onClick={() => {
        playClick();
        useScene.getState().toggleTableLamp();
      }}
    >
      <group name="mushroom-lamp">
        <mesh geometry={geo.base} material={mat.chrome} />
        <mesh geometry={geo.stem} material={mat.chrome} />
        <mesh geometry={geo.shade} material={mats.shade} />
        <mesh geometry={geo.under} material={mats.under} />
        {/* a luz fica sempre na cena (só a força muda), para não recompilar os materiais */}
        <pointLight
          position={[0, 0.13, 0]}
          color="#ff9a5c"
          intensity={on ? 1.15 : 0}
          distance={1.4}
          decay={2}
        />
      </group>
    </Interactive>
  );
}
