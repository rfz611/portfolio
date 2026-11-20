import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';
import { ROOM, GARAGE } from '../config/layout';
import { Interactive } from '../objects/Interactive';
import { useScene } from '../store/useScene';
import { makeCanvas, retile, tex } from '../textures/canvas';
import { paintAd, paintNoirWindows, paintRoad, type AdKind, type AdWords } from '../textures/city';
import { hdr, lib } from '../textures/library';
import { mulberry32 } from '../textures/random';
import { BLOCK, CENTER_X, FACADE_UV, FOLKS, GROUND_Y, PITCH, ROOFTOPS } from './cityLayout';
import { Folks } from './Folks';
import { box, merge } from './geo';
import { Rooftops } from './Rooftops';

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
  /** Anúncio de um projeto: clicando, a TV abre neste canal. */
  channel?: number;
  /** Pendurado num prédio que já existe (sem prédio próprio atrás). */
  bare?: boolean;
}

/**
 * Anúncios espalhados pela cidade (inventados): o maior de frente para a
 * janela, os outros de lado, em prédios diferentes e alturas diferentes.
 */
const ADS: Ad[] = [
  { kind: 'unicar', at: [CENTER_X + 4, -18, -216], size: [40, 13], yaw: 0, channel: 0 },
  { kind: 'frotas', at: [CENTER_X + 2, -36, -158], size: [30, 10], yaw: 0, channel: 1 },
  { kind: 'lounge', at: [CENTER_X - 76, -22, -282], size: [26, 8.5], yaw: 0.12 },
  { kind: 'cinema', at: [CENTER_X - 92, -6, -362], size: [32, 11], yaw: 0.18 },
  // letreiro vertical na quina do hotel da festa (cobertura da direita)
  { kind: 'hotel', at: [CENTER_X + 86, -56, -208.6], size: [5, 26], yaw: 0, bare: true },
  { kind: 'casino', at: [CENTER_X - 160, -22, -282], size: [26, 10], yaw: 0.5 },
  { kind: 'ristorante', at: [CENTER_X + 240, -26, -202], size: [28, 9], yaw: -0.6 },
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
  for (const roof of ROOFTOPS) {
    const [rw, rd] = roof.size;
    if (Math.abs(x - roof.at[0]) < rw / 2 + 12 && Math.abs(z - roof.at[1]) < rd / 2 + 12) {
      return true;
    }
  }
  return false;
}

/** Da janela até o Folks (letreiro e fonte): os prédios nessa linha ficam baixos. */
const WINDOW_EYE: [number, number, number] = [-1, 1.6, -1.7];
const FOLKS_SIGHTS: [number, number, number][] = [
  [1.5, 7, -7],
  [3, 1, 5],
  [-9, 1, 9],
].map(([x, y, z]) => [
  FOLKS.at[0] + x * FOLKS.scale,
  GROUND_Y + y * FOLKS.scale,
  FOLKS.at[1] + z * FOLKS.scale,
]);

/**
 * Altura máxima de um prédio (base w x d em x, z) para não tampar o Folks
 * visto da janela; null = não está no caminho.
 */
function sightCap(x: number, z: number, w: number, d: number) {
  const m = 5;
  let cap: number | null = null;
  for (const target of FOLKS_SIGHTS) {
    for (let i = 1; i < 200; i++) {
      const t = i / 200;
      const px = WINDOW_EYE[0] + (target[0] - WINDOW_EYE[0]) * t;
      const pz = WINDOW_EYE[2] + (target[2] - WINDOW_EYE[2]) * t;
      if (Math.abs(px - x) > w / 2 + m || Math.abs(pz - z) > d / 2 + m) continue;
      const py = WINDOW_EYE[1] + (target[1] - WINDOW_EYE[1]) * t;
      cap = cap === null ? py - 4 : Math.min(cap, py - 4);
    }
  }
  return cap;
}

function buildCity() {
  const r = mulberry32(1979);
  const groups: THREE.BufferGeometry[][] = [[], [], []];
  const litTops: THREE.BufferGeometry[] = [];
  const beacons: THREE.BufferGeometry[] = [];
  const spires: THREE.BufferGeometry[] = [];
  const roofs: THREE.BufferGeometry[] = [];

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
      if (last && !lit) {
        roofs.push(box([cw + 0.8, 0.9, cd + 0.8], [x, top + 0.2, z]));
        const ox = (r() - 0.5) * cw * 0.4;
        const oz = (r() - 0.5) * cd * 0.4;
        roofs.push(box([cw * 0.22, 3.2, cd * 0.18], [x + ox, top + 1.6, z + oz]));
        if (r() > 0.45) {
          const tx = x - ox * 0.8;
          const tz = z - oz * 0.8;
          roofs.push(new THREE.CylinderGeometry(1.8, 1.8, 3, 8).translate(tx, top + 4.5, tz));
          roofs.push(new THREE.ConeGeometry(2, 0.9, 8).translate(tx, top + 6.45, tz));
          for (const [lx, lz] of [
            [-1.2, -1.2],
            [1.2, -1.2],
            [-1.2, 1.2],
            [1.2, 1.2],
          ]) {
            roofs.push(box([0.25, 3, 0.25], [tx + lx, top + 1.5, tz + lz]));
          }
        }
      }
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
        // no lote do Folks o prédio é sorteado (para a cidade não mudar de
        // lugar) e depois jogado fora: ali fica o bar baixo com o pátio
        const folks =
          Math.abs(x - FOLKS.at[0]) < (FOLKS.size[0] * FOLKS.scale) / 2 + 8 &&
          Math.abs(z - FOLKS.at[1]) < (FOLKS.size[1] * FOLKS.scale) / 2 + 8;
        const lists = [...groups, litTops, roofs, spires, beacons];
        const before = lists.map((l) => l.length);
        tower(x, z, w, d, top, brightness);
        // prédio na frente do Folks: sorteado igual (a cidade não muda) e
        // trocado por um bloco mais baixo, abaixo da linha de visão
        const cap = folks ? null : sightCap(x, z, w, d);
        if (folks || (cap !== null && top > cap)) {
          lists.forEach((l, i) => (l.length = before[i]));
        }
        if (!folks && cap !== null && top > cap) {
          const h = Math.max(12, cap - GROUND_Y);
          groups[0].push(
            tint(box([w, h, d], [x, GROUND_Y + h / 2, z], { uv: FACADE_UV }), brightness),
          );
          roofs.push(box([w + 0.8, 0.9, d + 0.8], [x, GROUND_Y + h + 0.2, z]));
        }
      }
    }
  }
  for (const [x, z, w, top] of LANDMARKS) {
    tower(x, z, w, w * 0.9, top, 0.85, true);
  }

  // ruas entre as quadras (16 m: asfalto e calçadas), postes de luz de
  // sódio nas calçadas e carros andando nas faixas, sobre o asfalto
  const ROAD = PITCH - BLOCK;
  const TILE = 25;
  const length = 13 * PITCH + 200;
  const roadsNS: THREE.BufferGeometry[] = [];
  const roadsEW: THREE.BufferGeometry[] = [];
  const lamps: THREE.BufferGeometry[] = [];
  // carros: carroceria escura com faróis (vindo) ou lanternas (indo)
  const comingBody: THREE.BufferGeometry[] = [];
  const comingLights: THREE.BufferGeometry[] = [];
  const comingBeams: THREE.BufferGeometry[] = [];
  const goingBody: THREE.BufferGeometry[] = [];
  const goingLights: THREE.BufferGeometry[] = [];
  const car = (body: THREE.BufferGeometry[], x: number, z: number) => {
    body.push(box([1.8, 0.7, 4.3], [x, GROUND_Y + 0.5, z]));
    body.push(box([1.6, 0.55, 2.1], [x, GROUND_Y + 1.12, z + 0.2]));
  };
  const zStart = 40;
  const lamp = (x: number, z: number) =>
    lamps.push(new THREE.OctahedronGeometry(0.45).translate(x, GROUND_Y + 6, z));
  for (let gx = -8; gx <= 9; gx++) {
    const x = CENTER_X + gx * PITCH - PITCH / 2;
    roadsNS.push(
      new THREE.PlaneGeometry(ROAD, length)
        .rotateX(-Math.PI / 2)
        .translate(x, GROUND_Y + 0.05, zStart - length / 2),
    );
    // postes alinhados com as poças de luz da textura (v = 0 fica em zStart)
    for (let k = 0; k * TILE < length; k++) {
      const z0 = zStart - k * TILE;
      lamp(x - ROAD / 2 + 1.2, z0 - TILE * 0.75);
      lamp(x + ROAD / 2 - 1.2, z0 - TILE * 0.25);
    }
    const phase = r() * CAR_GAP;
    for (let z = -20 - phase; z > -length; z -= CAR_GAP) {
      // farol (vem para cá) na faixa da direita, lanterna (vai embora) na outra
      // vindo para cá (+z): faróis na frente e o facho no asfalto à frente
      const cx = x + 2.6;
      car(comingBody, cx, z);
      for (const s of [-0.6, 0.6]) {
        comingLights.push(box([0.35, 0.22, 0.12], [cx + s, GROUND_Y + 0.6, z + 2.18]));
      }
      comingBeams.push(
        new THREE.PlaneGeometry(2.6, 9)
          .rotateX(-Math.PI / 2)
          .translate(cx, GROUND_Y + 0.08, z + 6.6),
      );
      // indo embora (-z): lanternas vermelhas atrás, viradas para a janela
      const gx = x - 2.6;
      const gz = z - CAR_GAP / 2;
      car(goingBody, gx, gz);
      for (const s of [-0.65, 0.65]) {
        goingLights.push(box([0.4, 0.2, 0.12], [gx + s, GROUND_Y + 0.65, gz + 2.18]));
      }
    }
  }
  const widthEW = 17 * PITCH;
  for (let gz = 0; gz <= 13; gz++) {
    const z = -40 - gz * PITCH + ROAD / 2;
    roadsEW.push(
      new THREE.PlaneGeometry(ROAD, widthEW)
        .rotateX(-Math.PI / 2)
        .rotateY(Math.PI / 2)
        .translate(CENTER_X, GROUND_Y + 0.04, z),
    );
    for (let k = 0; k * TILE < widthEW; k++) {
      // aqui v = 0 fica em x = CENTER_X + widthEW / 2 e a textura corre para -x
      const x0 = CENTER_X + widthEW / 2 - k * TILE;
      lamp(x0 - TILE * 0.75, z + ROAD / 2 - 1.2);
      lamp(x0 - TILE * 0.25, z - ROAD / 2 + 1.2);
    }
  }

  return {
    blocks: groups.map((g) => merge(g)),
    litTops: merge(litTops),
    spires: merge(spires),
    roofs: merge(roofs),
    beacons: merge(beacons),
    roadsNS: merge(roadsNS),
    roadsEW: merge(roadsEW),
    roadLength: length,
    roadWidthEW: widthEW,
    lamps: merge(lamps),
    comingBody: merge(comingBody),
    comingLights: merge(comingLights),
    comingBeams: merge(comingBeams),
    goingBody: merge(goingBody),
    goingLights: merge(goingLights),
  };
}

/** Holofotes que varrem o céu bem devagar, ao fundo (como nos desenhos noir antigos). */
const SEARCHLIGHTS: [number, number, number][] = [
  [CENTER_X - 320, -820, 0.0],
  [CENTER_X + 380, -700, 2.1],
];

function AdBoard({ ad }: { ad: Ad }) {
  const { mat } = lib();
  const { t } = useTranslation();
  // pela janela (de pé na frente do vidro), os anúncios dos projetos levam à TV
  const looking = useScene((s) => s.view === 'janela');
  const words: AdWords = useMemo(
    () => ({
      tag: ad.kind === 'unicar' || ad.kind === 'frotas' ? t(`city.${ad.kind}Tag`) : undefined,
      cta: ad.channel !== undefined ? `${t('city.channel')} 0${ad.channel + 1}` : undefined,
      tonight: t('city.tonight'),
    }),
    [t, ad.kind, ad.channel],
  );
  const [w, h] = ad.size;
  const face = useMemo(() => {
    const vertical = h > w;
    const map = tex(
      makeCanvas(vertical ? 160 : 1024, vertical ? 832 : Math.round((1024 * h) / w), (c, cw, ch) =>
        paintAd(c, cw, ch, ad.kind, words),
      ),
      { clamp: true, aniso: 8 },
    );
    return new THREE.MeshBasicMaterial({ map, color: hdr('#ffffff', 1.05), toneMapped: false });
  }, [ad.kind, w, h, words]);
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
  // o prédio do anúncio tem janelas como os outros (não é um bloco preto)
  const facade = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(256, 256, (c, cw, ch) =>
            paintNoirWindows(c, cw, ch, 300 + ad.kind.length * 7, 0.22),
          ),
          { aniso: 8 },
        ),
        color: '#8e8890',
      }),
    [ad.kind],
  );
  return (
    <group position={ad.at} rotation={[0, ad.yaw, 0]}>
      {!ad.bare && <mesh geometry={geo.building} material={facade} />}
      <mesh geometry={geo.frame} material={mat.darkMetal} />
      {ad.channel !== undefined ? (
        <Interactive
          id={`ad-${ad.kind}`}
          label={`objects.ad.${ad.kind}`}
          enabled={looking}
          outline={false}
          onClick={() => {
            const state = useScene.getState();
            state.setTvChannel(ad.channel ?? 0);
            state.setView('tv');
          }}
        >
          <mesh position={[0, 0, 0.05]} material={face}>
            <planeGeometry args={[w, h]} />
          </mesh>
        </Interactive>
      ) : (
        <mesh position={[0, 0, 0.05]} material={face}>
          <planeGeometry args={[w, h]} />
        </mesh>
      )}
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
      road: (repeat: number) =>
        new THREE.MeshBasicMaterial({
          map: tex(makeCanvas(64, 200, paintRoad), { aniso: 8, repeat: [1, repeat] }),
          color: hdr('#ffffff', 1.5),
          // o chão e as ruas ficam a centímetros um do outro, a 95 m de
          // distância: sem gravar profundidade e desenhados em ordem, não piscam
          depthWrite: false,
        }),
      lamp: new THREE.MeshBasicMaterial({ color: hdr('#ffb062', 2.2), toneMapped: false }),
      roof: new THREE.MeshBasicMaterial({ color: '#171418' }),
      car: new THREE.MeshBasicMaterial({ color: hdr('#fff3dc', 2.4), toneMapped: false }),
      carBody: new THREE.MeshBasicMaterial({ color: '#16131a' }),
      carBeam: new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(32, 64, (c, w, h) => {
            const g = c.createLinearGradient(0, h, 0, 0);
            g.addColorStop(0, 'rgba(255,240,210,0.55)');
            g.addColorStop(1, 'rgba(255,240,210,0)');
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(w * 0.3, h);
            c.lineTo(w * 0.7, h);
            c.lineTo(w, 0);
            c.lineTo(0, 0);
            c.fill();
          }),
          { clamp: true },
        ),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
      tail: new THREE.MeshBasicMaterial({ color: hdr('#ff2a1a', 2.2), toneMapped: false }),
      ground: new THREE.MeshBasicMaterial({ color: '#0b090c', depthWrite: false }),
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

  const roadNS = useMemo(() => mats.road(geo.roadLength / 25), [mats, geo]);
  const roadEW = useMemo(() => mats.road(geo.roadWidthEW / 25), [mats, geo]);
  const beacon = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const base = useRef(hdr('#ff2418', 3));
  const carsRef = useRef<THREE.Group>(null);
  const tailsRef = useRef<THREE.Group>(null);
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
        renderOrder={-6}
      >
        <planeGeometry args={[3000, 3000]} />
      </mesh>
      {/* chão, depois as ruas leste-oeste e por cima as norte-sul (cruzamentos) */}
      <mesh geometry={geo.roadsEW} material={roadEW} renderOrder={-5} />
      <mesh geometry={geo.roadsNS} material={roadNS} renderOrder={-4} />
      <mesh geometry={geo.lamps} material={mats.lamp} />
      <group ref={carsRef}>
        <mesh geometry={geo.comingBody} material={mats.carBody} />
        <mesh geometry={geo.comingLights} material={mats.car} />
        <mesh geometry={geo.comingBeams} material={mats.carBeam} />
      </group>
      <group ref={tailsRef}>
        <mesh geometry={geo.goingBody} material={mats.carBody} />
        <mesh geometry={geo.goingLights} material={mats.tail} />
      </group>
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
      <mesh geometry={geo.roofs} material={mats.roof} />
      <mesh geometry={geo.beacons} material={beacon} />
      {ADS.map((ad) => (
        <AdBoard key={ad.kind} ad={ad} />
      ))}
      <Rooftops />
      <Folks />
      {/* o prédio abaixo da cobertura */}
      <mesh position={[CENTER_X, -33.1, ROOM.z1 + 0.02]} material={mats.facade}>
        <planeGeometry args={[GARAGE.x1 - ROOM.x0 + 0.2, 64]} />
      </mesh>
    </group>
  );
}
