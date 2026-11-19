import { useMemo } from 'react';
import * as THREE from 'three';
import { LAPTOP, SPOT } from '../config/layout';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ExecutiveChair } from '../objects/Chairs';
import { Clock } from '../objects/Clock';
import { Interactive } from '../objects/Interactive';
import { DeskPhone, Mug, Notebook } from '../objects/DeskItems';
import { paintLaptopKeys, paintLaptopScreen } from '../textures/laptop';
import { LaptopContent } from '../objects/LaptopContent';
import { ChairSeat, Drawer, Newspaper, PhotoFrame, Steam } from '../objects/OfficeProps';
import { useSeated } from '../objects/seat';
import { useScene } from '../store/useScene';
import { paintApple } from '../textures/apple';
import { makeCanvas, tex } from '../textures/canvas';
import { hdr, lib } from '../textures/library';
import { box, crease, cyl, lathe, merge } from './geo';
import { OptionalModel } from './OptionalModel';

const HALF_PI = Math.PI / 2;
const TOP = 0.76;

/**
 * Mesa executiva de mogno (2,20 × 0,76 × 1,00 m), de frente para a sala:
 * painel frontal com almofadas, dois gaveteiros do lado de quem senta e
 * tampo com couro verde embutido.
 */
function ExecutiveDesk() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const drawers: THREE.BufferGeometry[] = [];
    const pulls: THREE.BufferGeometry[] = [];
    for (const x of [-0.82, 0.82]) {
      for (const y of [0.16, 0.38, 0.6]) {
        drawers.push(box([0.46, 0.19, 0.02], [x, y, -0.475]));
        pulls.push(cyl(0.006, 0.006, 0.12, [x, y, -0.49], { seg: 6, rot: [0, 0, HALF_PI] }));
      }
    }
    return {
      top: box([2.2, 0.045, 1.0], [0, TOP - 0.0225, 0]),
      body: merge([
        box([0.52, 0.71, 0.94], [-0.82, 0.355, 0], { swap: true }),
        box([0.52, 0.71, 0.94], [0.82, 0.355, 0], { swap: true }),
        box([1.12, 0.56, 0.03], [0, 0.43, 0.44], { swap: true }),
      ]),
      panels: merge([
        box([0.4, 0.5, 0.012], [-0.82, 0.36, 0.475], { swap: true }),
        box([0.4, 0.5, 0.012], [0.82, 0.36, 0.475], { swap: true }),
        box([0.98, 0.42, 0.012], [0, 0.44, 0.461], { swap: true }),
      ]),
      plinth: box([2.16, 0.06, 0.96], [0, 0.03, 0]),
      brass: merge([
        box([2.2, 0.008, 0.008], [0, TOP - 0.05, 0.502]),
        box([2.2, 0.008, 0.008], [0, 0.06, 0.482]),
        ...pulls,
      ]),
      drawers: merge(drawers),
      pad: new THREE.PlaneGeometry(1.75, 0.68).rotateX(-HALF_PI).translate(0, TOP + 0.001, -0.06),
    };
  }, []);
  return (
    <group name="desk">
      <mesh geometry={geo.top} material={mat.varnish} />
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.panels} material={mat.mahoganyDark} />
      <mesh geometry={geo.drawers} material={mat.mahogany} />
      <mesh geometry={geo.plinth} material={mat.mahoganyDark} />
      <mesh geometry={geo.brass} material={mat.brass} />
      <mesh geometry={geo.pad} material={mat.leatherGreen} />
    </group>
  );
}

/** Alumínio grafite escovado com granulado de PS2 (riscos horizontais finos). */
function paintBrushedDark(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#2b2b31';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y++) {
    const v = 36 + ((y * 37) % 11) + ((y * 13) % 5);
    ctx.fillStyle = `rgba(${v},${v},${v + 4},0.35)`;
    ctx.fillRect(0, y, w, 1);
  }
  for (let i = 0; i < 1800; i++) {
    const x = (i * 97.3) % w;
    const y = (i * 61.7) % h;
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)';
    ctx.fillRect(x, y, 2, 2);
  }
}

/**
 * MacBook de alumínio: base fina e tampa fina de cantos arredondados,
 * teclado preto e a maçã acesa na tampa (visível de quem está na sala).
 * A tela é uma peça separada ("screen"): a área de trabalho entra nela
 * pelo código na Fase 3.
 */
function Laptop() {
  const { mat } = lib();
  const { w, d, lid, tilt } = LAPTOP;
  const geo = useMemo(
    () => ({
      base: new RoundedBoxGeometry(w, 0.009, d, 2, 0.004),
      // girado 180°: a fileira de funções fica do lado da tela e as letras não saem espelhadas
      keys: new THREE.PlaneGeometry(w * 0.86, d * 0.4)
        .rotateX(-HALF_PI)
        .rotateY(Math.PI)
        .translate(0, 0.0046, d * 0.07),
      pad: new THREE.PlaneGeometry(w * 0.4, d * 0.28)
        .rotateX(-HALF_PI)
        .translate(0, 0.0052, -d * 0.31),
      lid: new RoundedBoxGeometry(w, lid, 0.0055, 3, 0.0026).translate(0, lid / 2, 0),
    }),
    [w, d, lid],
  );
  const seated = useSeated();
  const keys = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(1024, 352, paintLaptopKeys), { clamp: true }),
        roughness: 0.8,
      }),
    [],
  );
  const screenOn = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(makeCanvas(256, 160, paintLaptopScreen), { clamp: true }),
        color: hdr('#ffffff', 1.15),
        toneMapped: false,
      }),
    [],
  );
  const bezel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.18, metalness: 0.2 }),
    [],
  );
  // trackpad de vidro fosco, mais reflexivo que o teclado
  const trackpad = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#34343a',
        roughness: 0.42,
        metalness: 0.4,
        envMapIntensity: 1.4,
      }),
    [],
  );
  // alumínio escuro escovado, com granulado leve (estilo PS1/PS2)
  const silver = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(256, 256, paintBrushedDark)),
        color: '#ffffff',
        roughness: 0.35,
        metalness: 0.75,
        envMapIntensity: 1.2,
      }),
    [],
  );
  const apple = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(makeCanvas(128, 150, paintApple), { clamp: true }),
        color: hdr('#ffffff', 1.3),
        transparent: true,
        toneMapped: false,
        depthWrite: false,
      }),
    [],
  );
  return (
    <group
      name="laptop"
      position={[LAPTOP.base[0] - SPOT.desk[0], LAPTOP.base[1], LAPTOP.base[2] - SPOT.desk[2]]}
    >
      <mesh geometry={geo.base} material={silver} />
      <mesh geometry={geo.keys} material={keys} />
      <mesh geometry={geo.pad} material={trackpad} />
      <group position={[0, 0.0045, d / 2]} rotation={[tilt, 0, 0]}>
        <mesh geometry={geo.lid} material={silver} />
        <mesh position={[0, lid / 2 + 0.006, 0.0024]} material={apple}>
          <planeGeometry args={[0.042, 0.05]} />
        </mesh>
        {/* moldura preta de vidro em volta da tela, como no MacBook */}
        <mesh position={[0, lid / 2, -0.0023]} rotation={[0, Math.PI, 0]} material={bezel}>
          <planeGeometry args={[w - 0.006, lid - 0.006]} />
        </mesh>
        <mesh
          name="screen"
          position={[0, lid / 2 + 0.004, -0.0028]}
          rotation={[0, Math.PI, 0]}
          material={seated ? screenOn : mat.tvScreen}
        >
          <planeGeometry args={[w * 0.92, lid * 0.88]} />
        </mesh>
        <LaptopContent w={w * 0.92} h={lid * 0.88} y={lid / 2 + 0.004} z={-0.0032} />
        <pointLight
          position={[0, lid * 0.45, -0.06]}
          color="#c9b8ff"
          intensity={seated ? 0.18 : 0}
          distance={0.6}
          decay={2}
        />
      </group>
    </group>
  );
}

/** Luminária de banqueiro: base de latão e cúpula de vidro verde acesa. */
function BankerLamp() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      brass: crease(
        merge([
          lathe(
            [
              [0.001, 0],
              [0.085, 0],
              [0.08, 0.02],
              [0.02, 0.04],
            ],
            { seg: 16 },
          ),
          cyl(0.01, 0.01, 0.3, [0, 0.19, 0], { seg: 8 }),
          box([0.02, 0.02, 0.18], [0, 0.34, 0.05]),
        ]),
        40,
      ),
      shade: new THREE.CylinderGeometry(0.075, 0.075, 0.34, 16, 1, true, 0, Math.PI)
        .rotateZ(HALF_PI)
        .rotateY(HALF_PI)
        .rotateZ(0)
        .translate(0, 0.33, 0.08),
      bulb: cyl(0.02, 0.02, 0.18, [0, 0.31, 0.08], { seg: 8, rot: [0, 0, HALF_PI] }),
    }),
    [],
  );
  const shadeMat = useMemo(() => {
    const m = mat.bankerShade.clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [mat]);
  const bulb = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr('#ffd9a0', 1.25), toneMapped: false }),
    [],
  );
  return (
    <group name="banker-lamp">
      <mesh geometry={geo.brass} material={mat.brass} />
      <mesh geometry={geo.shade} material={shadeMat} />
      <mesh geometry={geo.bulb} material={bulb} />
      <pointLight
        position={[0, 0.24, 0.08]}
        color="#ffcf8f"
        intensity={1.5}
        distance={2.4}
        decay={1.6}
      />
    </group>
  );
}

/**
 * Abajur de chão de latão com cúpula de tecido creme, no tapete atrás da
 * cadeira (lado direito de quem olha o escritório): luz quente e baixa que
 * ilumina o lado da mesa que ficava apagado para quem senta.
 */
function FloorLamp() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      base: crease(
        lathe(
          [
            [0.001, 0],
            [0.16, 0],
            [0.15, 0.025],
            [0.05, 0.045],
            [0.018, 0.06],
          ],
          { seg: 28 },
        ),
        35,
      ),
      pole: cyl(0.012, 0.012, 1.42, [0, 0.76, 0], { seg: 10 }),
      knob: cyl(0.02, 0.02, 0.04, [0, 0.95, 0], { seg: 12 }),
      shade: cyl(0.17, 0.22, 0.28, [0, 1.42, 0], { seg: 32, open: true }),
      bulb: new THREE.SphereGeometry(0.04, 12, 8).translate(0, 1.38, 0),
    }),
    [],
  );
  const shade = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e9d8b4',
        emissive: '#ffb45c',
        emissiveIntensity: 0.55,
        roughness: 0.9,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const bulb = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr('#ffd9a0', 1.2), toneMapped: false }),
    [],
  );
  return (
    <group name="floor-lamp">
      <mesh geometry={geo.base} material={mat.brass} />
      <mesh geometry={geo.pole} material={mat.brass} />
      <mesh geometry={geo.knob} material={mat.brass} />
      <mesh geometry={geo.shade} material={shade} />
      <mesh geometry={geo.bulb} material={bulb} />
      <pointLight position={[0, 1.3, 0]} color="#ffc27a" intensity={7} distance={4.2} decay={1.8} />
    </group>
  );
}

/** Coisas largadas na mesa: telefone, papéis, caderno com caneta, caneca e um porta-retrato. */
function DeskClutter() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      phoneBody: crease(
        merge([
          box([0.2, 0.06, 0.22], [0, 0.03, 0]),
          box([0.16, 0.03, 0.08], [0, 0.07, -0.05], { rot: [0.3, 0, 0] }),
        ]),
        35,
      ),
      handset: crease(
        merge([
          box([0.21, 0.025, 0.045], [0, 0.098, 0.03]),
          box([0.05, 0.035, 0.055], [-0.085, 0.09, 0.03]),
          box([0.05, 0.035, 0.055], [0.085, 0.09, 0.03]),
        ]),
        35,
      ),
      sheet: new THREE.PlaneGeometry(0.21, 0.297).rotateX(-HALF_PI),
      folder: box([0.24, 0.012, 0.32], [0, 0.006, 0]),
      notebook: box([0.15, 0.016, 0.21], [0, 0.008, 0]),
      pen: cyl(0.005, 0.005, 0.14, [0.03, 0.02, 0], { seg: 6, rot: [HALF_PI, 0.2, 0] }),
      mug: lathe(
        [
          [0.001, 0],
          [0.04, 0],
          [0.042, 0.095],
          [0.038, 0.095],
          [0.036, 0.01],
        ],
        { seg: 14 },
      ),
      coffee: new THREE.CircleGeometry(0.037, 14).rotateX(-HALF_PI).translate(0, 0.07, 0),
    }),
    [],
  );
  const folder = useMemo(() => new THREE.MeshLambertMaterial({ color: '#b8925a' }), []);
  return (
    <group position={[0, TOP, 0]}>
      <group position={[0.8, 0.002, 0.16]} rotation={[0, 2.75, 0]}>
        <DeskPhone />
      </group>
      <Interactive
        id="papers"
        label="objects.papers"
        onClick={() => useScene.getState().setCvOpen(true)}
      >
        <group position={[-0.32, 0.002, -0.14]} rotation={[0, 0.3, 0]} name="papers">
          <mesh geometry={geo.folder} material={folder} />
          <mesh geometry={geo.sheet} material={mat.paperSheet} position={[0.02, 0.014, 0.01]} />
          <mesh
            geometry={geo.sheet}
            material={mat.paperSheet}
            position={[-0.05, 0.016, 0.06]}
            rotation={[0, 0.35, 0]}
          />
        </group>
      </Interactive>
      <group position={[0.47, 0.002, -0.28]} rotation={[0, -0.35, 0]}>
        <Notebook />
      </group>
      {/* caneca perto da mão de quem senta, com a alça virada para a pessoa */}
      <group position={[0.66, 0.002, -0.08]} rotation={[0, 1.25, 0]}>
        <Mug />
        <Steam />
      </group>
      <group position={[-0.5, 0.002, 0.28]} rotation={[0, -0.35, 0]}>
        <PhotoFrame />
      </group>
      {/* jornal da noite dobrado na mesa */}
      <group position={[-0.16, 0.002, 0.24]} rotation={[0, 2.75, 0]}>
        <Newspaper />
      </group>
    </group>
  );
}

/** Escritório de frente para a sala, com o vidro e a cidade atrás (seção Sobre mim). */
export function DeskArea() {
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const setView = useScene((s) => s.setView);
  const [x, y, z] = SPOT.desk;
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.003, -0.25]} rotation={[-HALF_PI, 0, 0]} material={mat.rugDesk}>
        <planeGeometry args={[3.2, 2.3]} />
      </mesh>
      <OptionalModel file="desk.glb">
        <ExecutiveDesk />
      </OptionalModel>
      <ChairSeat>
        <ExecutiveChair />
      </ChairSeat>
      <Drawer />
      <Interactive id="pc" label="objects.pc" enabled={home} onClick={() => setView('pc')}>
        <OptionalModel file="retro_pc.glb">
          <Laptop />
        </OptionalModel>
      </Interactive>
      <group position={[-0.78, TOP, -0.05]} rotation={[0, Math.PI, 0]}>
        <BankerLamp />
      </group>
      <DeskClutter />
      <group position={[1.08, 0, -1.08]}>
        <FloorLamp />
      </group>
      {/* relógio de mesa ao lado do notebook, com o mostrador virado para a sala */}
      <group position={[0.5, TOP, 0.3]} rotation={[0, -0.25, 0]}>
        <Clock />
      </group>
      <mesh position={[0, 0.005, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[2.8, 1.5]} />
      </mesh>
    </group>
  );
}
