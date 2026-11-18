import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GARAGE, ROOM } from '../config/layout';
import { makeCanvas, retile, tex } from '../textures/canvas';
import { paintAd, paintNoirWindows, type AdKind } from '../textures/city';
import { hdr, lib } from '../textures/library';
import { mulberry32 } from '../textures/random';
import { box, merge } from './geo';

const GROUND_Y = -95;
const CENTER_X = (ROOM.x0 + GARAGE.x1) / 2;
/** Uma repetição da fachada a cada 15 m: janelas pequenas e muitas, como de longe. */
const FACADE_UV = 15;
/** Quadra de 64 m com ruas de 16 m. */
const PITCH = 80;
const BLOCK = 64;
/** Distância entre carros na mesma avenida (o padrão que se repete). */
const CAR_GAP = 40;

/** Brilho do prédio (mais longe = mais apagado) e laje escura no telhado. */
function tint(g: THREE.BufferGeometry, brightness: number) {
  const count = g.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const roof = i >= 8 && i < 16;
    const b = roof ? 0.12 : brightness;
    colors.set([b, b, b * 1.04], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

interface Ad {
  kind: AdKind;
  /** Centro do painel, em metros. */
  at: [number, number, number];
  size: [number, number];
  yaw: number;
}

/**
 * Anúncios espalhados pela cidade (inventados): o maior de frente para a
 * janela, os outros de lado, em prédios diferentes e alturas diferentes.
 */
const ADS: Ad[] = [
  { kind: 'ristorante', at: [CENTER_X + 14, -18, -205], size: [40, 13], yaw: -0.06 },
  { kind: 'casino', at: [CENTER_X - 118, -42, -150], size: [22, 8.5], yaw: 0.62 },
  { kind: 'lounge', at: [CENTER_X + 150, -30, -128], size: [22, 7.5], yaw: -0.7 },
  { kind: 'cinema', at: [CENTER_X - 70, -6, -395], size: [26, 9], yaw: 0.25 },
  { kind: 'hotel', at: [CENTER_X + 92, -46, -262], size: [5, 26], yaw: -0.35 },
];

/** Torres marcantes ao fundo: topo iluminado em degraus e antena com luz vermelha. */
const LANDMARKS: [number, number, number, number][] = [
  // x, z, largura, topo
  [CENTER_X - 210, -480, 34, 150],
  [CENTER_X + 40, -620, 30, 175],
  [CENTER_X + 260, -430, 32, 120],
  [CENTER_X - 380, -700, 28, 110],
  [CENTER_X + 430, -760, 30, 140],
  [CENTER_X - 30, -880, 26, 95],
  [CENTER_X + 170, -300, 26, 70],
];

/** O lote está na frente de um anúncio ou de uma torre marcante? */
function reserved(x: number, z: number) {
  for (const ad of ADS) {
    if (Math.abs(x - ad.at[0]) < 22 && Math.abs(z - ad.at[2]) < 22) return true;
  }
  for (const [lx, lz, w] of LANDMARKS) {
    if (Math.abs(x - lx) < w && Math.abs(z - lz) < w) return true;
  }
  return false;
}

function buildCity() {
  const r = mulberry32(1979);
  const groups: THREE.BufferGeometry[][] = [[], [], []];
  const litTops: THREE.BufferGeometry[] = [];
  const beacons: THREE.BufferGeometry[] = [];
  const spires: THREE.BufferGeometry[] = [];

  /** Prédio com recuos: base, um ou dois andares menores e às vezes uma antena. */
  const tower = (
    x: number,
    z: number,
    w: number,
    d: number,
    top: number,
    b: number,
    lit = false,
  ) => {
    const group = groups[Math.floor(r() * 3)];
    const tiers = top > 0 ? 3 : top > -40 ? 2 : 1;
    let bottom = GROUND_Y;
    let cw = w;
    let cd = d;
    for (let t = 0; t < tiers; t++) {
      const last = t === tiers - 1;
      const height = last ? top - bottom : (top - bottom) * (t === 0 ? 0.72 : 0.6);
      const g = box([cw, height, cd], [x, bottom + height / 2, z], { uv: FACADE_UV });
      if (lit && last) litTops.push(g);
      else group.push(tint(g, b));
      bottom += height;
      cw *= 0.72;
      cd *= 0.72;
    }
    if (lit || (top > 10 && r() > 0.4)) {
      spires.push(new THREE.CylinderGeometry(0.3, 0.9, 22, 6).translate(x, top + 11, z));
      beacons.push(new THREE.SphereGeometry(1, 6, 4).translate(x, top + 23, z));
    }
  };

  // quadras em grade ao norte e dos lados: perto, prédios mais baixos na
  // frente da janela (a vista vai longe); mais longe, mais altos e apagados
  for (let gx = -8; gx <= 8; gx++) {
    for (let gz = 0; gz < 13; gz++) {
      const bx = CENTER_X + gx * PITCH;
      const bz = -40 - gz * PITCH - BLOCK / 2;
      const lots = 1 + Math.floor(r() * 3);
      const lotW = BLOCK / lots;
      for (let k = 0; k < lots; k++) {
        const x = bx - BLOCK / 2 + lotW * (k + 0.5);
        const z = bz + (r() - 0.5) * 10;
        if (reserved(x, z)) continue;
        const dist = Math.hypot(x - CENTER_X, z);
        const ahead = Math.abs(Math.atan2(x - CENTER_X, -z)) < 0.45;
        let top = -70 + r() * 55 + Math.min(60, dist * 0.06) * r();
        if (ahead && dist < 260) top = Math.min(top, -28);
        if (!ahead && dist < 200 && r() < 0.25) top = 5 + r() * 35; // vizinhos altos dos lados
        const w = lotW - 4 - r() * 6;
        const d = BLOCK - 6 - r() * 14;
        const brightness = Math.max(0.35, 1.05 - dist / 1300);
        tower(x, z, w, d, top, brightness);
      }
    }
  }
  for (const [x, z, w, top] of LANDMARKS) {
    tower(x, z, w, w * 0.9, top, 0.85, true);
  }

  // avenidas de luz de sódio e faróis de carro, no chão entre as quadras
  const streets: THREE.BufferGeometry[] = [];
  const cars: THREE.BufferGeometry[] = [];
  const tails: THREE.BufferGeometry[] = [];
  const length = 13 * PITCH + 200;
  for (let gx = -8; gx <= 9; gx++) {
    const x = CENTER_X + gx * PITCH - PITCH / 2;
    streets.push(box([1.4, 0.2, length], [x, GROUND_Y + 0.2, -length / 2 + 40]));
    const phase = r() * CAR_GAP;
    for (let z = -20 - phase; z > -length; z -= CAR_GAP) {
      cars.push(box([0.9, 0.3, 2.2], [x + 3, GROUND_Y + 0.4, z]));
      tails.push(box([0.9, 0.3, 2.2], [x - 3, GROUND_Y + 0.4, z - CAR_GAP / 2]));
    }
  }
  for (let gz = 0; gz <= 13; gz++) {
    const z = -40 - gz * PITCH + PITCH / 2 - PITCH;
    streets.push(box([17 * PITCH, 0.2, 1.4], [CENTER_X, GROUND_Y + 0.2, z]));
  }

  return {
    blocks: groups.map((g) => merge(g)),
    litTops: merge(litTops),
    spires: merge(spires),
    beacons: merge(beacons),
    streets: merge(streets),
    cars: merge(cars),
    tails: merge(tails),
  };
}

/** Holofotes que varrem o céu bem devagar, ao fundo (como nos desenhos noir antigos). */
const SEARCHLIGHTS: [number, number, number][] = [
  [CENTER_X - 320, -820, 0.0],
  [CENTER_X + 380, -700, 2.1],
];

function AdBoard({ ad }: { ad: Ad }) {
  const { mat } = lib();
  const [w, h] = ad.size;
  const face = useMemo(() => {
    const vertical = h > w;
    const map = tex(
      makeCanvas(vertical ? 160 : 1024, vertical ? 832 : Math.round((1024 * h) / w), (c, cw, ch) =>
        paintAd(c, cw, ch, ad.kind),
      ),
      { clamp: true, aniso: 8 },
    );
    return new THREE.MeshBasicMaterial({ map, color: hdr('#ffffff', 1.05), toneMapped: false });
  }, [ad.kind, w, h]);
  const geo = useMemo(
    () => ({
      frame: merge([
        box([w + 1, 0.8, 0.8], [0, h / 2 + 0.4, -0.4]),
        box([w + 1, 0.8, 0.8], [0, -h / 2 - 0.4, -0.4]),
        box([0.8, h + 1.6, 0.8], [-w / 2 - 0.5, 0, -0.4]),
        box([0.8, h + 1.6, 0.8], [w / 2 + 0.5, 0, -0.4]),
      ]),
      // prédio onde o anúncio está pendurado
      building: box([w + 14, h + 120, 26], [0, -(h + 120) / 2 + h / 2 + 8, -14], {
        uv: FACADE_UV,
      }),
    }),
    [w, h],
  );
  const facade = mat.cityB;
  return (
    <group position={ad.at} rotation={[0, ad.yaw, 0]}>
      <mesh geometry={geo.building} material={facade} />
      <mesh geometry={geo.frame} material={mat.darkMetal} />
      <mesh position={[0, 0, 0.05]} material={face}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}

/**
 * A cidade lá fora, no clima dos desenhos noir antigos: silhuetas escuras
 * de prédios art déco com poucas janelas amarelas, céu preto com o
 * horizonte vermelho, neblina avermelhada, holofotes varrendo o céu,
 * carros andando nas avenidas e letreiros de neon inventados.
 */
export function City() {
  const { mat, tex: t } = lib();
  const scene = useThree((s) => s.scene);
  const geo = useMemo(buildCity, []);

  // neblina só a partir de 140 m: não mexe na sala, apaga a cidade ao longe
  useEffect(() => {
    scene.fog = new THREE.Fog('#3a1216', 200, 1100);
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  const mats = useMemo(() => {
    const windows = (seed: number, lit: number) =>
      new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(256, 256, (c, w, h) => paintNoirWindows(c, w, h, seed, lit)),
          {
            aniso: 8,
          },
        ),
        vertexColors: true,
      });
    return {
      blocks: [windows(211, 0.2), windows(223, 0.28), windows(227, 0.12)],
      // topo das torres marcantes iluminado por refletores (como os arranha-céus antigos)
      litTop: new THREE.MeshBasicMaterial({
        map: tex(makeCanvas(256, 256, (c, w, h) => paintNoirWindows(c, w, h, 229, 0.5))),
        color: hdr('#ffdcb0', 1.9),
        toneMapped: false,
      }),
      spire: new THREE.MeshBasicMaterial({ color: '#2a2630' }),
      street: new THREE.MeshBasicMaterial({ color: hdr('#ffa64a', 1.1), toneMapped: false }),
      car: new THREE.MeshBasicMaterial({ color: hdr('#fff3dc', 1.3), toneMapped: false }),
      tail: new THREE.MeshBasicMaterial({ color: hdr('#ff2a1a', 1.3), toneMapped: false }),
      ground: new THREE.MeshBasicMaterial({ color: '#060405' }),
      beam: new THREE.MeshBasicMaterial({
        color: '#ffe2c0',
        transparent: true,
        opacity: 0.07,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
      sky: (() => {
        const m = mat.sky.clone();
        m.fog = false;
        return m;
      })(),
      facade: new THREE.MeshBasicMaterial({ map: retile(t.facade, 3, 10), color: '#4a4a55' }),
    };
  }, [mat, t]);

  const beacon = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const base = useRef(hdr('#ff2418', 3));
  const carsRef = useRef<THREE.Mesh>(null);
  const tailsRef = useRef<THREE.Mesh>(null);
  const beams = useRef<(THREE.Group | null)[]>([]);
  const beamGeo = useMemo(
    () => new THREE.CylinderGeometry(22, 1.2, 620, 18, 1, true).translate(0, 310, 0),
    [],
  );
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const pulse = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(time * 2.1), 3);
    beacon.color.copy(base.current).multiplyScalar(pulse);
    // faróis vêm na direção do prédio; lanternas vão embora
    const drive = (time * 11) % CAR_GAP;
    if (carsRef.current) carsRef.current.position.z = drive;
    if (tailsRef.current) tailsRef.current.position.z = -drive;
    beams.current.forEach((beam, i) => {
      if (!beam) return;
      beam.rotation.y = SEARCHLIGHTS[i][2] + Math.sin(time * 0.12 + i * 2) * 0.7;
    });
  });

  return (
    <group name="city">
      <mesh material={mats.sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[860, 24, 16]} />
      </mesh>
      <mesh
        position={[CENTER_X, GROUND_Y, -600]}
        rotation={[-Math.PI / 2, 0, 0]}
        material={mats.ground}
      >
        <planeGeometry args={[3000, 3000]} />
      </mesh>
      <mesh geometry={geo.streets} material={mats.street} />
      <mesh ref={carsRef} geometry={geo.cars} material={mats.car} />
      <mesh ref={tailsRef} geometry={geo.tails} material={mats.tail} />
      {SEARCHLIGHTS.map(([x, z], i) => (
        <group
          key={i}
          position={[x, GROUND_Y, z]}
          ref={(g) => {
            beams.current[i] = g;
          }}
        >
          <mesh geometry={beamGeo} material={mats.beam} rotation={[0, 0, 0.42]} />
        </group>
      ))}
      {geo.blocks.map((g, i) => (
        <mesh key={i} geometry={g} material={mats.blocks[i]} />
      ))}
      <mesh geometry={geo.litTops} material={mats.litTop} />
      <mesh geometry={geo.spires} material={mats.spire} />
      <mesh geometry={geo.beacons} material={beacon} />
      {ADS.map((ad) => (
        <AdBoard key={ad.kind} ad={ad} />
      ))}
      {/* o prédio abaixo da cobertura */}
      <mesh position={[CENTER_X, -33.1, ROOM.z1 + 0.02]} material={mats.facade}>
        <planeGeometry args={[GARAGE.x1 - ROOM.x0 + 0.2, 64]} />
      </mesh>
    </group>
  );
}
