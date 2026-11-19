import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { contactLinks } from '../../content/contact';
import { box, crease, cyl } from '../../scene/geo';
import { useScene } from '../../store/useScene';
import { makeCanvas, tex } from '../../textures/canvas';
import { Interactive } from '../Interactive';
import { join, type CarMats } from './materials';

const HALF_PI = Math.PI / 2;
type P = [number, number, number];

function rbox(size: P, pos: P, radius = 0.03, rot?: P) {
  const g = new RoundedBoxGeometry(size[0], size[1], size[2], 3, radius);
  if (rot) g.rotateX(rot[0]).rotateY(rot[1]).rotateZ(rot[2]);
  return g.translate(...pos);
}

/** Painel moldado: perfil lateral (x, y) estendido de um lado ao outro do carro. */
function dashboard() {
  const s = new THREE.Shape();
  s.moveTo(-0.64, 0.9);
  s.quadraticCurveTo(-0.42, 0.97, -0.24, 0.95);
  s.quadraticCurveTo(-0.17, 0.94, -0.16, 0.86);
  s.lineTo(-0.17, 0.78);
  s.quadraticCurveTo(-0.24, 0.66, -0.22, 0.6);
  s.lineTo(-0.5, 0.56);
  s.lineTo(-0.64, 0.58);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -0.75);
  return crease(g, 40);
}

/** Banco de concha com abas laterais e o encosto de cabeça inteiriço. */
function bucketSeat(z: number) {
  const back = (size: P, pos: P, radius = 0.03) => {
    const g = rbox(size, pos, radius);
    // o encosto deita para trás (gira em volta da base dele)
    g.translate(-0.66, -0.5, -z).rotateZ(-0.22).translate(0.66, 0.5, z);
    return g;
  };
  return {
    fabric: join([
      rbox([0.48, 0.1, 0.4], [0.42, 0.45, z], 0.04),
      back([0.1, 0.66, 0.4], [0.66, 0.83, z], 0.04),
    ]),
    bolsters: join([
      rbox([0.46, 0.1, 0.08], [0.42, 0.5, z + 0.23], 0.035),
      rbox([0.46, 0.1, 0.08], [0.42, 0.5, z - 0.23], 0.035),
      back([0.14, 0.56, 0.08], [0.64, 0.8, z + 0.24], 0.035),
      back([0.14, 0.56, 0.08], [0.64, 0.8, z - 0.24], 0.035),
      back([0.12, 0.2, 0.3], [0.67, 1.22, z], 0.04),
      box([0.4, 0.06, 0.36], [0.44, 0.37, z]),
    ]),
    // furos do cinto de quatro pontos no encosto
    slots: join([
      back([0.13, 0.05, 0.06], [0.67, 1.09, z + 0.08], 0.01),
      back([0.13, 0.05, 0.06], [0.67, 1.09, z - 0.08], 0.01),
    ]),
  };
}

/** Visor vermelho do rádio no console: mostra a frequência sintonizada. */
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
    <mesh position={[-0.159, 0.8, 0]} rotation={[0, HALF_PI, 0]}>
      <planeGeometry args={[0.18, 0.05]} />
      <meshBasicMaterial map={map} toneMapped={false} />
    </mesh>
  );
}

/**
 * Cabine: painel moldado com o quadro de instrumentos, console do meio com
 * o rádio, câmbio e freio de mão, volante de três raios, bancos de concha,
 * banco de trás, forros das portas, pedais e o porta-luvas (currículo).
 */
export function Interior({ m }: { m: CarMats }) {
  const { t } = useTranslation();
  const inCar = useScene((s) => s.view === 'interior');
  const cvOpen = useScene((s) => s.cvOpen);
  const lid = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const driver = bucketSeat(0.38);
    const passenger = bucketSeat(-0.38);
    return {
      floor: box([1.85, 0.02, 1.5], [0.28, 0.27, 0]),
      dash: dashboard(),
      binnacle: join([
        rbox([0.14, 0.05, 0.42], [-0.24, 1.03, 0.38], 0.02),
        box([0.02, 0.14, 0.42], [-0.3, 0.965, 0.38]),
      ]),
      console: join([
        rbox([0.1, 0.34, 0.26], [-0.21, 0.72, 0], 0.02),
        rbox([0.64, 0.14, 0.22], [0.12, 0.36, 0], 0.03),
        rbox([0.2, 0.05, 0.2], [0.36, 0.45, 0], 0.02),
      ]),
      knobs: join(
        [-0.07, 0, 0.07].map((z) =>
          cyl(0.018, 0.018, 0.02, [-0.155, 0.66, z], { seg: 12, rot: [0, 0, HALF_PI] }),
        ),
      ),
      shifter: join([
        cyl(0.045, 0.03, 0.06, [0.05, 0.46, 0], { seg: 10 }),
        cyl(0.01, 0.01, 0.14, [0.05, 0.54, 0], { seg: 6 }),
        new THREE.SphereGeometry(0.028, 10, 8).translate(0.05, 0.62, 0),
        rbox([0.2, 0.03, 0.04], [0.37, 0.47, 0.06], 0.012, [0, 0, 0.25]),
      ]),
      column: cyl(0.03, 0.04, 0.24, [-0.09, 0.81, 0.38], { seg: 10, rot: [0, 0, 1.15] }),
      // volante de três raios: aro grosso de couro, raios em Y e o miolo
      wheelRim: new THREE.TorusGeometry(0.18, 0.022, 10, 32).rotateY(HALF_PI),
      wheelSpokes: join([
        rbox([0.022, 0.04, 0.14], [0, -0.01, 0.1], 0.012, [0.12, 0, 0]),
        rbox([0.022, 0.04, 0.14], [0, -0.01, -0.1], 0.012, [-0.12, 0, 0]),
        rbox([0.022, 0.12, 0.05], [0, -0.1, 0], 0.012),
      ]),
      wheelHub: rbox([0.045, 0.1, 0.12], [0.006, -0.015, 0], 0.025),
      // saídas de ar: duas no meio, em cima do rádio, e uma em cada ponta
      vents: join([
        new THREE.PlaneGeometry(0.1, 0.05).rotateY(HALF_PI).translate(-0.158, 0.875, 0.07),
        new THREE.PlaneGeometry(0.1, 0.05).rotateY(HALF_PI).translate(-0.158, 0.875, -0.07),
        new THREE.PlaneGeometry(0.11, 0.055).rotateY(HALF_PI).translate(-0.158, 0.875, 0.66),
        new THREE.PlaneGeometry(0.11, 0.055).rotateY(HALF_PI).translate(-0.158, 0.875, -0.66),
      ]),
      buttons: new THREE.PlaneGeometry(0.2, 0.04).rotateY(HALF_PI).translate(-0.158, 0.72, 0),
      // porta-copos no túnel, atrás do câmbio
      cups: join([
        cyl(0.036, 0.036, 0.012, [0.19, 0.432, 0.055], { seg: 18 }),
        cyl(0.036, 0.036, 0.012, [0.19, 0.432, -0.055], { seg: 18 }),
      ]),
      cupRims: join([
        new THREE.TorusGeometry(0.038, 0.005, 6, 18).rotateX(HALF_PI).translate(0.19, 0.44, 0.055),
        new THREE.TorusGeometry(0.038, 0.005, 6, 18).rotateX(HALF_PI).translate(0.19, 0.44, -0.055),
      ]),
      // retrovisor interno e os para-sóis, no alto do para-brisa
      mirror: join([
        cyl(0.008, 0.008, 0.08, [0.1, 1.33, 0], { seg: 6 }),
        rbox([0.03, 0.06, 0.24], [0.08, 1.27, 0], 0.012),
      ]),
      mirrorGlass: new THREE.PlaneGeometry(0.22, 0.045).rotateY(HALF_PI).translate(0.096, 1.27, 0),
      visors: join([
        rbox([0.2, 0.014, 0.34], [0.03, 1.33, 0.38], 0.006, [0, 0, -0.25]),
        rbox([0.2, 0.014, 0.34], [0.03, 1.33, -0.38], 0.006, [0, 0, -0.25]),
      ]),
      // limpadores deitados na base do para-brisa (por fora)
      wipers: join([
        box([0.012, 0.012, 0.5], [-0.6, 0.93, 0.12], { rot: [0, 0.12, 0] }),
        box([0.012, 0.012, 0.46], [-0.6, 0.93, -0.36], { rot: [0, 0.12, 0] }),
      ]),
      handle: box([0.012, 0.018, 0.1], [0.018, 0.1, 0]),
      seats: join([driver.fabric, passenger.fabric]),
      bolsters: join([
        driver.bolsters,
        passenger.bolsters,
        rbox([0.48, 0.14, 1.28], [1.06, 0.44, 0], 0.05),
        rbox([0.12, 0.5, 1.28], [1.28, 0.72, 0], 0.05, [0, 0, -0.25]),
        // encostos de cabeça do banco de trás
        rbox([0.09, 0.15, 0.26], [1.36, 1.03, 0.36], 0.035, [0, 0, -0.25]),
        rbox([0.09, 0.15, 0.26], [1.36, 1.03, -0.36], 0.035, [0, 0, -0.25]),
      ]),
      // atrás do banco de trás: parede do porta-malas e o tampão sob o vidro
      // traseiro (senão, pelos vidros, dá para ver o chão da garagem por dentro)
      trunk: join([
        box([0.03, 0.7, 1.34], [1.43, 0.62, 0]),
        box([0.8, 0.025, 1.36], [1.79, 0.955, 0]),
        box([0.62, 0.02, 1.4], [0.94, 0.27, 0]),
      ]),
      speakers: join([
        cyl(0.07, 0.07, 0.012, [1.66, 0.972, 0.42], { seg: 16 }),
        cyl(0.07, 0.07, 0.012, [1.66, 0.972, -0.42], { seg: 16 }),
      ]),
      slots: join([driver.slots, passenger.slots]),
      pedals: join(
        [0.3, 0.4, 0.5].map((z) => box([0.02, 0.08, 0.06], [-0.44, 0.38, z], { rot: [0, 0, 0.5] })),
      ),
      // forros das portas que não abrem (passageiro e as de trás); o do
      // motorista vai na própria porta (car/Car.tsx)
      cards: join([
        // (o topo fica abaixo da base dos vidros: senão vira uma faixa preta na janela)
        new THREE.PlaneGeometry(0.92, 0.3).translate(-0.1, 0.62, -0.78),
        new THREE.PlaneGeometry(0.52, 0.3).rotateY(Math.PI).translate(0.68, 0.62, 0.8),
        new THREE.PlaneGeometry(0.52, 0.3).translate(0.68, 0.62, -0.8),
      ]),
      lid: rbox([0.03, 0.14, 0.36], [0, 0.07, 0], 0.01),
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
      {/* luz de cortesia: deixa ver a cabine por dentro e pelos vidros */}
      <pointLight
        position={[0.7, 1.24, 0]}
        color="#ffd2ac"
        intensity={0.55}
        distance={2.4}
        decay={2}
      />
      <mesh geometry={geo.floor} material={m.carpet} />
      <mesh geometry={geo.dash} material={m.dash} />
      <mesh geometry={geo.binnacle} material={m.dash} />
      <mesh position={[-0.205, 0.965, 0.38]} rotation={[0, HALF_PI, 0]} material={m.gauges}>
        <planeGeometry args={[0.36, 0.135]} />
      </mesh>
      <mesh geometry={geo.vents} material={m.vent} />
      <mesh geometry={geo.buttons} material={m.buttons} />
      <mesh geometry={geo.cups} material={m.matte} />
      <mesh geometry={geo.cupRims} material={m.alu} />
      <mesh geometry={geo.mirror} material={m.dash} />
      <mesh geometry={geo.mirrorGlass} material={m.mirrorGlass} />
      <mesh geometry={geo.visors} material={m.dash} />
      <mesh geometry={geo.wipers} material={m.matte} />
      <mesh geometry={geo.console} material={m.dash} />
      <mesh geometry={geo.knobs} material={m.alu} />
      <mesh geometry={geo.shifter} material={m.leather} />
      <mesh geometry={geo.column} material={m.dash} />
      <group position={[0.03, 0.84, 0.38]} rotation={[0, 0, 0.42]}>
        <mesh geometry={geo.wheelRim} material={m.leather} />
        <mesh geometry={geo.wheelSpokes} material={m.alu} />
        <mesh geometry={geo.wheelHub} material={m.leather} />
      </group>
      <mesh geometry={geo.seats} material={m.seat} />
      <mesh geometry={geo.bolsters} material={m.leather} />
      <mesh geometry={geo.trunk} material={m.carpet} />
      <mesh geometry={geo.speakers} material={m.vent} />
      <mesh geometry={geo.slots} material={m.matte} />
      <mesh geometry={geo.pedals} material={m.alu} />
      <mesh geometry={geo.cards} material={m.doorCard} />
      <RadioFace />
      {/* porta-luvas, do lado do passageiro: abre e mostra o currículo */}
      <Interactive
        id="glovebox"
        label="objects.glovebox"
        enabled={inCar}
        onClick={() => useScene.getState().setCvOpen(true)}
      >
        {inCar && !cvOpen && (
          <Html position={[-0.17, 0.7, -0.4]} zIndexRange={[5, 0]}>
            <div className="deck-tag car-tag">
              <span className="car-tag__dot" aria-hidden="true" />
              {t('car.tagGlovebox')}
            </div>
          </Html>
        )}
        <group ref={lid} position={[-0.19, 0.64, -0.4]}>
          <mesh geometry={geo.lid} material={m.dash} />
          <mesh geometry={geo.handle} material={m.alu} />
        </group>
      </Interactive>
    </group>
  );
}
