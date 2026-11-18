import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { contactLinks } from '../../content/contact';
import { skillGroups } from '../../content/skills';
import { box, crease, cyl, merge } from '../../scene/geo';
import { useScene } from '../../store/useScene';
import { makeCanvas, tex } from '../../textures/canvas';
import {
  paintGauges,
  paintGrille,
  paintHeadlight,
  paintRadiator,
  paintRim,
  paintTaillight,
  paintTireSide,
  paintValveCover,
} from '../../textures/car';
import { lib } from '../../textures/library';
import { Interactive } from '../Interactive';
import { buildCarBody, DOOR_HINGE, HOOD_HINGE, WHEEL } from './carBody';

const HALF_PI = Math.PI / 2;

/** Une peças com e sem índice (as vincadas com crease() vêm sem índice). */
const join = (parts: THREE.BufferGeometry[]) =>
  merge(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
/** Cor da lataria: vinho metálico, com verniz. Trocar aqui muda o carro inteiro. */
export const CAR_COLOR = '#76121f';

function useCarMaterials() {
  return useMemo(() => {
    const t = (
      w: number,
      h: number,
      paint: (c: CanvasRenderingContext2D, w: number, h: number) => void,
    ) => tex(makeCanvas(w, h, paint), { clamp: true, aniso: 8 });
    return {
      paint: new THREE.MeshPhysicalMaterial({
        color: CAR_COLOR,
        metalness: 0.55,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.5,
      }),
      // o lado de dentro da lataria (visto de dentro do carro e do cofre do motor)
      inner: new THREE.MeshStandardMaterial({
        color: '#0b0a0c',
        roughness: 0.8,
        side: THREE.BackSide,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#07090d',
        roughness: 0.04,
        metalness: 0.5,
        transparent: true,
        opacity: 0.78,
        side: THREE.DoubleSide,
        envMapIntensity: 2,
      }),
      trim: new THREE.MeshStandardMaterial({
        color: '#0a090b',
        roughness: 0.88,
        envMapIntensity: 0.15,
      }),
      rim: new THREE.MeshStandardMaterial({
        map: t(256, 256, paintRim),
        transparent: true,
        alphaTest: 0.4,
        metalness: 0.35,
        roughness: 0.3,
        envMapIntensity: 1.8,
      }),
      tireSide: new THREE.MeshStandardMaterial({ map: t(128, 128, paintTireSide), roughness: 0.9 }),
      rubber: new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.92 }),
      grille: new THREE.MeshStandardMaterial({ map: t(256, 64, paintGrille), roughness: 0.6 }),
      headlight: new THREE.MeshStandardMaterial({
        map: t(256, 96, paintHeadlight),
        emissive: '#ffffff',
        emissiveMap: t(256, 96, paintHeadlight),
        emissiveIntensity: 0.05,
        roughness: 0.1,
        metalness: 0.4,
        side: THREE.DoubleSide,
      }),
      taillight: new THREE.MeshStandardMaterial({
        map: t(256, 64, paintTaillight),
        emissive: '#ffffff',
        emissiveMap: t(256, 64, paintTaillight),
        emissiveIntensity: 0.35,
        roughness: 0.15,
        side: THREE.DoubleSide,
      }),
      seat: new THREE.MeshStandardMaterial({
        color: '#141214',
        roughness: 0.55,
        envMapIntensity: 0.6,
      }),
      gauges: new THREE.MeshBasicMaterial({ map: t(256, 96, paintGauges), toneMapped: false }),
      radiator: new THREE.MeshStandardMaterial({
        map: t(128, 128, paintRadiator),
        roughness: 0.5,
        metalness: 0.6,
      }),
      valve: new THREE.MeshStandardMaterial({ map: t(256, 128, paintValveCover), roughness: 0.55 }),
      engine: new THREE.MeshStandardMaterial({
        color: '#2b2d31',
        roughness: 0.45,
        metalness: 0.7,
        envMapIntensity: 1.2,
      }),
      battery: new THREE.MeshStandardMaterial({ color: '#16171a', roughness: 0.5 }),
    };
  }, []);
}

type CarMats = ReturnType<typeof useCarMaterials>;

/** Visor vermelho do rádio no painel: mostra a frequência sintonizada. */
function RadioFace() {
  const freq = useScene((s) => s.radioFreq);
  const canvas = useMemo(() => makeCanvas(256, 64, () => {}), []);
  const map = useMemo(() => tex(canvas, { clamp: true }), [canvas]);
  useEffect(() => {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0303';
    ctx.fillRect(0, 0, 256, 64);
    const station = contactLinks.find((l) => Math.abs(Number(l.frequency) - freq) < 0.25);
    ctx.fillStyle = '#ff3b2a';
    ctx.font = '40px "VT323", monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(`FM ${freq.toFixed(1)}`, 14, 34);
    ctx.textAlign = 'right';
    ctx.font = '26px "VT323", monospace';
    ctx.fillText(station ? station.id.toUpperCase() : '~~~', 244, 34);
    map.needsUpdate = true;
  }, [freq, canvas, map]);
  return (
    <mesh position={[-0.318, 0.8, 0]} rotation={[0, HALF_PI, 0]}>
      <planeGeometry args={[0.2, 0.05]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}

/** Cabine: bancos, painel com os mostradores, volante, câmbio, rádio e porta-luvas. */
function Interior({ m }: { m: CarMats }) {
  const inCar = useScene((s) => s.view === 'interior');
  const cvOpen = useScene((s) => s.cvOpen);
  const lid = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const seat = (z: number) => [
      crease(box([0.5, 0.13, 0.46], [0.28, 0.42, z]), 40),
      crease(box([0.12, 0.62, 0.46], [0.56, 0.74, z], { rot: [0, 0, 0.22] }), 40),
      box([0.1, 0.16, 0.26], [0.66, 1.1, z], { rot: [0, 0, 0.22] }),
    ];
    return {
      seats: join([
        ...seat(0.38),
        ...seat(-0.38),
        box([0.46, 0.14, 1.32], [1.02, 0.44, 0]),
        box([0.12, 0.46, 1.32], [1.22, 0.72, 0], { rot: [0, 0, 0.25] }),
      ]),
      floor: box([1.8, 0.02, 1.6], [0.2, 0.3, 0]),
      dash: join([
        box([0.36, 0.2, 1.6], [-0.5, 0.82, 0]),
        box([0.28, 0.06, 1.6], [-0.38, 0.93, 0], { rot: [0, 0, -0.35] }),
        // console do meio com o rádio
        box([0.16, 0.36, 0.26], [-0.36, 0.64, 0]),
        box([0.62, 0.12, 0.2], [-0.02, 0.48, 0]),
        // coluna da direção e alavanca de câmbio
        cyl(0.025, 0.035, 0.32, [-0.3, 0.88, 0.38], { seg: 8, rot: [0, 0, 1.2] }),
        cyl(0.012, 0.012, 0.16, [0.02, 0.6, 0], { seg: 6 }),
        new THREE.SphereGeometry(0.03, 8, 6).translate(0.02, 0.69, 0),
      ]),
      wheel: new THREE.TorusGeometry(0.17, 0.018, 6, 20).rotateY(HALF_PI),
      // três raios: dois para os lados e um para baixo
      spokes: join([
        box([0.02, 0.035, 0.3], [0, -0.01, 0]),
        box([0.02, 0.15, 0.04], [0, -0.09, 0]),
        cyl(0.045, 0.045, 0.03, [0, -0.01, 0], { seg: 12, rot: [0, 0, HALF_PI] }),
      ]),
      lid: box([0.03, 0.13, 0.36], [0, 0.065, 0]),
    };
  }, []);
  useFrame((_, delta) => {
    const g = lid.current;
    if (!g) return;
    const target = cvOpen && inCar ? -1.0 : 0;
    g.rotation.z += (target - g.rotation.z) * (1 - Math.exp(-delta * 8));
  });
  return (
    <group name="car-interior">
      {/* luz de cortesia fraca, para ver os bancos e o painel por dentro */}
      <pointLight
        position={[0.15, 1.2, 0]}
        color="#ffcfa8"
        intensity={0.55}
        distance={1.8}
        decay={2}
      />
      <mesh geometry={geo.floor} material={m.trim} />
      <mesh geometry={geo.seats} material={m.seat} />
      <mesh geometry={geo.dash} material={m.trim} />
      <mesh position={[-0.315, 0.92, 0.38]} rotation={[0, HALF_PI, 0]} material={m.gauges}>
        <planeGeometry args={[0.32, 0.12]} />
      </mesh>
      <group position={[-0.17, 0.95, 0.38]} rotation={[0, 0, -0.38]}>
        <mesh geometry={geo.wheel} material={m.trim} />
        <mesh geometry={geo.spokes} material={m.trim} />
      </group>
      <RadioFace />
      {/* porta-luvas, do lado do passageiro: abre e mostra o currículo */}
      <Interactive
        id="glovebox"
        label="objects.glovebox"
        enabled={inCar}
        onClick={() => useScene.getState().setCvOpen(true)}
      >
        <group ref={lid} position={[-0.315, 0.68, -0.42]}>
          <mesh geometry={geo.lid} material={m.trim} />
        </group>
      </Interactive>
    </group>
  );
}

/** Peças do motor: cada uma é um grupo de skills (passar o mouse acende, clicar mostra). */
function Engine({ m }: { m: CarMats }) {
  const atEngine = useScene((s) => s.view === 'motor');
  const setSkill = useScene((s) => s.setSkill);
  const geo = useMemo(
    () => ({
      bay: box([1.5, 0.02, 1.36], [-1.32, 0.36, 0]),
      block: join([
        crease(box([0.5, 0.26, 0.42], [-1.28, 0.5, 0.04]), 40),
        box([0.46, 0.06, 0.12], [-1.28, 0.66, 0.2]),
      ]),
      valve: crease(box([0.46, 0.07, 0.2], [-1.28, 0.665, -0.06]), 40),
      intake: join([
        crease(box([0.42, 0.08, 0.14], [-1.28, 0.72, 0.18]), 40),
        ...[0, 1, 2, 3].map((k) =>
          cyl(0.025, 0.025, 0.14, [-1.44 + k * 0.105, 0.66, 0.26], { seg: 8, rot: [0.6, 0, 0] }),
        ),
        cyl(0.06, 0.06, 0.34, [-1.0, 0.7, -0.08], { seg: 12, rot: [HALF_PI, 0, 0.5] }),
        cyl(0.12, 0.12, 0.12, [-0.92, 0.66, -0.36], { seg: 16 }),
      ]),
      radiator: box([0.05, 0.36, 1.0], [-1.9, 0.54, 0]),
      battery: join([
        crease(box([0.24, 0.19, 0.17], [-0.86, 0.52, 0.5]), 40),
        cyl(0.018, 0.018, 0.03, [-0.92, 0.63, 0.46], { seg: 8 }),
        cyl(0.018, 0.018, 0.03, [-0.8, 0.63, 0.46], { seg: 8 }),
      ]),
      fuses: join([
        crease(box([0.18, 0.1, 0.13], [-0.86, 0.48, -0.55]), 40),
        box([0.19, 0.02, 0.14], [-0.86, 0.54, -0.55]),
      ]),
    }),
    [],
  );
  const groups = Object.fromEntries(skillGroups.map((g) => [g.part, g]));
  const part = (
    key: 'block' | 'intake' | 'radiator' | 'battery' | 'fuses',
    node: React.ReactNode,
  ) => (
    <Interactive
      key={key}
      id={`engine-${key}`}
      label={groups[key].partKey}
      enabled={atEngine}
      onClick={() => setSkill(groups[key].id)}
    >
      {node}
    </Interactive>
  );
  return (
    <group name="engine">
      <mesh geometry={geo.bay} material={m.trim} />
      {part(
        'block',
        <group>
          <mesh geometry={geo.block} material={m.engine} />
          <mesh geometry={geo.valve} material={m.valve} />
        </group>,
      )}
      {part('intake', <mesh geometry={geo.intake} material={m.engine} />)}
      {part('radiator', <mesh geometry={geo.radiator} material={m.radiator} />)}
      {part('battery', <mesh geometry={geo.battery} material={m.battery} />)}
      {part('fuses', <mesh geometry={geo.fuses} material={m.battery} />)}
    </group>
  );
}

/** Uma roda: pneu, lateral, roda de liga e o forro escuro da caixa de roda. */
function Wheel({ x, side, m }: { x: number; side: 1 | -1; m: CarMats }) {
  const geo = useMemo(
    () => ({
      tire: cyl(WHEEL.r, WHEEL.r, WHEEL.w, [0, 0, 0], { seg: 22, rot: [HALF_PI, 0, 0] }),
      face: new THREE.CircleGeometry(WHEEL.r * 0.99, 22),
      rim: new THREE.CircleGeometry(WHEEL.r * 0.7, 22),
    }),
    [],
  );
  const out = (WHEEL.w / 2 + 0.002) * side;
  const faceRot: [number, number, number] = [0, side > 0 ? 0 : Math.PI, 0];
  return (
    <group position={[x, WHEEL.r, WHEEL.z * side]}>
      <mesh geometry={geo.tire} material={m.rubber} />
      <mesh geometry={geo.face} material={m.tireSide} position={[0, 0, out]} rotation={faceRot} />
      <mesh
        geometry={geo.rim}
        material={m.rim}
        position={[0, 0, out + 0.004 * side]}
        rotation={faceRot}
      />
    </group>
  );
}

/**
 * Sedã esportivo japonês dos anos 2000 (4,40 m), sem marca nem emblema,
 * vinho metálico com verniz: aerofólio, rodas de cinco raios, faróis
 * duplos e vidros escuros. Clicando no carro, a câmera vai até ele; aí:
 * capô (skills), porta (entra no carro: rádio com os contatos e
 * porta-luvas com o currículo) e faróis (ligam e desligam).
 */
export function Car() {
  const { mat } = lib();
  const m = useCarMaterials();
  const view = useScene((s) => s.view);
  const headlights = useScene((s) => s.headlights);
  const setView = useScene((s) => s.setView);
  const hood = useRef<THREE.Group>(null);
  const door = useRef<THREE.Group>(null);
  const atCar = view === 'carro';

  const geo = useMemo(() => {
    const body = buildCarBody();
    const lens = (w: number, h: number) => new THREE.PlaneGeometry(w, h);
    return {
      ...body,
      // faróis na frente do para-choque, logo acima da grade
      headL: lens(0.34, 0.11).rotateY(-HALF_PI).translate(-2.206, 0.48, 0.52),
      headR: lens(0.34, 0.11).scale(-1, 1, 1).rotateY(-HALF_PI).translate(-2.206, 0.48, -0.52),
      tails: join([
        lens(0.36, 0.1).rotateY(HALF_PI).translate(2.196, 0.76, 0.54),
        lens(0.36, 0.1).scale(-1, 1, 1).rotateY(HALF_PI).translate(2.196, 0.76, -0.54),
      ]),
      grille: lens(0.62, 0.11).rotateY(-HALF_PI).translate(-2.204, 0.35, 0),
      wing: join([
        box([0.07, 0.2, 0.04], [1.98, 1.04, 0.56]),
        box([0.07, 0.2, 0.04], [1.98, 1.04, -0.56]),
        crease(box([0.32, 0.035, 1.64], [2.0, 1.15, 0], { rot: [0, 0, 0.08] }), 40),
        box([0.36, 0.12, 0.02], [2.0, 1.13, 0.83]),
        box([0.36, 0.12, 0.02], [2.0, 1.13, -0.83]),
      ]),
      mirrors: join([
        crease(box([0.13, 0.09, 0.15], [-0.48, 0.99, 0.99]), 40),
        crease(box([0.13, 0.09, 0.15], [-0.48, 0.99, -0.99]), 40),
        box([0.05, 0.03, 0.12], [-0.5, 0.95, 0.9]),
        box([0.05, 0.03, 0.12], [-0.5, 0.95, -0.9]),
      ]),
      liners: join(
        [-WHEEL.x, WHEEL.x].flatMap((x) => [
          box([0.78, 0.46, 0.14], [x, 0.56, 0.6]),
          box([0.78, 0.46, 0.14], [x, 0.56, -0.6]),
        ]),
      ),
      exhaust: cyl(0.045, 0.045, 0.2, [2.18, 0.3, -0.45], { seg: 12, rot: [0, 0, HALF_PI] }),
      handle: box([0.12, 0.025, 0.02], [0.85, 0.28, 0.012]),
    };
  }, []);

  // capô e porta abrem conforme o plano da câmera
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 5);
    if (hood.current) {
      const target = view === 'motor' ? -1.0 : 0;
      hood.current.rotation.z += (target - hood.current.rotation.z) * k;
    }
    if (door.current) {
      const target = view === 'interior' ? -1.05 : 0;
      door.current.rotation.y += (target - door.current.rotation.y) * k;
    }
    const glow = headlights ? 2.4 : 0.05;
    m.headlight.emissiveIntensity += (glow - m.headlight.emissiveIntensity) * k;
    m.taillight.emissiveIntensity +=
      ((headlights ? 1.2 : 0.35) - m.taillight.emissiveIntensity) * k;
  });

  return (
    <Interactive
      id="car"
      label="objects.car"
      enabled={view === 'home'}
      onClick={() => setView('carro')}
    >
      <group name="car">
        <mesh geometry={geo.body} material={m.paint} />
        <mesh geometry={geo.body} material={m.inner} />
        <mesh geometry={geo.glass} material={m.glass} renderOrder={2} />
        <mesh geometry={geo.grille} material={m.grille} />
        <mesh geometry={geo.tails} material={m.taillight} />
        <mesh geometry={geo.wing} material={m.paint} />
        <mesh geometry={geo.mirrors} material={m.paint} />
        <mesh geometry={geo.liners} material={m.trim} />
        <mesh geometry={geo.exhaust} material={mat.chrome} />
        {[-WHEEL.x, WHEEL.x].flatMap((x) =>
          ([1, -1] as const).map((side) => <Wheel key={`${x}${side}`} x={x} side={side} m={m} />),
        )}
        <Interactive
          id="headlights"
          label="objects.headlights"
          enabled={atCar}
          onClick={() => useScene.getState().toggleHeadlights()}
        >
          <group>
            <mesh geometry={geo.headL} material={m.headlight} />
            <mesh geometry={geo.headR} material={m.headlight} />
          </group>
        </Interactive>
        <Interactive
          id="hood"
          label="objects.hood"
          enabled={atCar}
          onClick={() => setView('motor')}
        >
          <group ref={hood} position={HOOD_HINGE.toArray()}>
            <mesh geometry={geo.hood} material={m.paint} />
            <mesh geometry={geo.hood} material={m.inner} />
          </group>
        </Interactive>
        <Interactive
          id="door"
          label="objects.door"
          enabled={atCar}
          onClick={() => setView('interior')}
        >
          <group ref={door} position={DOOR_HINGE.toArray()}>
            <mesh geometry={geo.door} material={m.paint} />
            <mesh geometry={geo.door} material={m.inner} />
            <mesh geometry={geo.doorGlass} material={m.glass} renderOrder={2} />
            <mesh geometry={geo.handle} material={mat.chrome} />
          </group>
        </Interactive>
        <Engine m={m} />
        <Interior m={m} />
      </group>
    </Interactive>
  );
}
