import * as THREE from 'three';
import type { AdKind } from '../textures/city';
import { mulberry32 } from '../textures/random';
import { BLOCK, CENTER_X, FACADE_UV, FOLKS, GROUND_Y, PITCH, ROOFTOPS } from './cityLayout';
import { box, merge } from './geo';
import { runSliced } from './slices';

/*
 * Geração da cidade vista pela janela: prédios, ruas, postes e carros,
 * juntados em poucas geometrias. Fica fora de City.tsx para poder ser
 * preparada (em fatias) antes de a cidade ser montada.
 */

/** Distância entre carros na mesma avenida (o padrão que se repete). */
export const CAR_GAP = 40;

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

export interface Ad {
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
export const ADS: Ad[] = [
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

function* buildCity() {
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
      yield;
    }
  }
  for (const [x, z, w, top] of LANDMARKS) {
    tower(x, z, w, w * 0.9, top, 0.85, true);
  }
  yield;

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
    yield;
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
    yield;
  }

  // juntar milhares de caixas também pesa: uma lista por vez
  const merged = function* (parts: THREE.BufferGeometry[]) {
    yield;
    return merge(parts);
  };
  const blocks: THREE.BufferGeometry[] = [];
  for (const g of groups) blocks.push(yield* merged(g));
  return {
    blocks,
    litTops: yield* merged(litTops),
    spires: yield* merged(spires),
    roofs: yield* merged(roofs),
    beacons: yield* merged(beacons),
    roadsNS: yield* merged(roadsNS),
    roadsEW: yield* merged(roadsEW),
    roadLength: length,
    roadWidthEW: widthEW,
    lamps: yield* merged(lamps),
    comingBody: yield* merged(comingBody),
    comingLights: yield* merged(comingLights),
    comingBeams: yield* merged(comingBeams),
    goingBody: yield* merged(goingBody),
    goingLights: yield* merged(goingLights),
  };
}

type CityGeometry = ReturnType<typeof buildCity> extends Generator<unknown, infer T> ? T : never;

let cityGeometry: CityGeometry | null = null;
let cityBuilding: Promise<void> | null = null;

/**
 * Gera a cidade (milhares de prédios) em fatias de poucos milissegundos,
 * devolvendo a vez ao navegador entre elas. Chamada antes de montar a
 * cidade; se ninguém chamou, a cidade é gerada de uma vez ao montar.
 */
export function prepareCity(): Promise<void> {
  cityBuilding ??= runSliced(buildCity()).then((geo) => {
    cityGeometry = geo;
  });
  return cityBuilding;
}

/** A cidade pronta (gerada agora, de uma vez, se prepareCity não rodou antes). */
export function cityGeometryNow(): CityGeometry {
  if (!cityGeometry) {
    const gen = buildCity();
    let step = gen.next();
    while (!step.done) step = gen.next();
    cityGeometry = step.value;
  }
  return cityGeometry;
}
