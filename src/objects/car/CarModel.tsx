import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FRONT_X, REAR_X } from './carBody';
import { CAR_MODEL_URL, HAS_CAR_MODEL as HAS_MODEL } from './modelInfo';

/**
 * Carro a partir do modelo "Mitsubishi Lancer Evolution VIII Low Poly", de
 * 1313feodal (Sketchfab, licença Free Standard). O arquivo fica fora do Git
 * (public/models/car.glb): sem ele, entra o carro feito no código.
 */

type RGB = [number, number, number];
const hex = (c: RGB) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

/** Que parte do carro cada cor da faixa de cores do modelo pinta. */
const COLOR_PART: Record<string, Part> = {
  '#003f3f': 'paint',
  '#1f5f7f': 'glass',
  '#f7f7f7': 'headlight',
  '#9f0000': 'taillight',
  '#d85d00': 'signal',
  '#ff8619': 'signal',
  '#bfebff': 'mirror',
};
type Part = 'paint' | 'glass' | 'trim' | 'headlight' | 'taillight' | 'signal' | 'mirror';

/** Borda da frente do capô do modelo (logo atrás do para-choque), em x. */
const HOOD_FRONT = -2.03;

export interface ModelCarGeometry {
  paint: THREE.BufferGeometry;
  trim: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  headlight: THREE.BufferGeometry;
  taillight: THREE.BufferGeometry;
  signal: THREE.BufferGeometry;
  mirror: THREE.BufferGeometry;
  /** Capô e porta do motorista recortados da lataria, já com a origem na dobradiça. */
  hood: THREE.BufferGeometry;
  /** Saída de ar do capô (abre junto). */
  hoodTrim: THREE.BufferGeometry;
  door: THREE.BufferGeometry;
  doorGlass: THREE.BufferGeometry;
  hoodHinge: THREE.Vector3;
  doorHinge: THREE.Vector3;
  wheels: { geo: THREE.BufferGeometry; map: THREE.Texture | null }[];
  /** Medidas úteis do modelo já no lugar (m). */
  box: THREE.Box3;
  /** Altura de cima da lataria (capô, teto) num ponto (x, z), sem o rebaixamento. */
  surfaceY: (x: number, z: number) => number;
}

/** Faixa de cores do modelo: devolve a cor num ponto u (a textura tem 1 px de altura). */
function palette(image: CanvasImageSource & { width: number; height: number }) {
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, 1).data;
  return (u: number): RGB => {
    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor(u * canvas.width)));
    return [data[x * 4], data[x * 4 + 1], data[x * 4 + 2]];
  };
}

/** Separa uma malha (com índice) em triângulos soltos, cada um com o seu destino. */
function split(
  geo: THREE.BufferGeometry,
  classify: (tri: { c: THREE.Vector3; n: THREE.Vector3; u: number }) => string,
) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nor = g.attributes.normal as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const out: Record<string, { p: number[]; n: number[] }> = {};
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    c.set(0, 0, 0);
    n.set(0, 0, 0);
    let u = 0;
    for (let k = 0; k < 3; k++) {
      c.x += pos.getX(i + k) / 3;
      c.y += pos.getY(i + k) / 3;
      c.z += pos.getZ(i + k) / 3;
      n.x += nor.getX(i + k);
      n.y += nor.getY(i + k);
      n.z += nor.getZ(i + k);
      u += uv.getX(i + k) / 3;
    }
    n.normalize();
    const key = classify({ c, n, u });
    const bucket = (out[key] ||= { p: [], n: [] });
    for (let k = 0; k < 3; k++) {
      bucket.p.push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
      bucket.n.push(nor.getX(i + k), nor.getY(i + k), nor.getZ(i + k));
    }
  }
  const make = (key: string) => {
    const b = out[key] ?? { p: [], n: [] };
    const r = new THREE.BufferGeometry();
    r.setAttribute('position', new THREE.Float32BufferAttribute(b.p, 3));
    r.setAttribute('normal', new THREE.Float32BufferAttribute(b.n, 3));
    return r;
  };
  return make;
}

/**
 * Carrega o modelo, assa as transformações nas malhas e deita o carro no
 * nosso sistema (comprimento em x, frente para -x, rodas no chão, mesmo
 * comprimento do carro do código). Depois separa cada parte pela cor e
 * recorta o capô e a porta do motorista pela posição.
 */
export function useModelCar(): ModelCarGeometry {
  const { scene } = useGLTF(CAR_MODEL_URL);
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const parts: { geo: THREE.BufferGeometry; map: THREE.Texture | null }[] = [];
    scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const geo = (o.geometry as THREE.BufferGeometry).clone().applyMatrix4(o.matrixWorld);
      parts.push({ geo, map: (o.material as THREE.MeshStandardMaterial).map });
    });
    parts.sort((a, b) => b.geo.attributes.position.count - a.geo.attributes.position.count);
    const colorAt = palette(parts[0].map!.image as HTMLCanvasElement);

    // 1. comprimento em x, rodas no chão, centro no lugar do carro do código
    const all = mergeGeometries(
      parts.map((p) => p.geo.clone().deleteAttribute('uv')),
      false,
    )!;
    all.computeBoundingBox();
    const size = all.boundingBox!.getSize(new THREE.Vector3());
    const turn = new THREE.Matrix4();
    if (size.z > size.x) turn.makeRotationY(Math.PI / 2);
    // a frente é onde ficam os faróis brancos: tem de ficar para -x
    const body = parts[0].geo;
    const pos = body.attributes.position as THREE.BufferAttribute;
    const uv = body.attributes.uv as THREE.BufferAttribute;
    const lamp = new THREE.Vector3();
    let lamps = 0;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      if (hex(colorAt(uv.getX(i))) !== '#f7f7f7') continue;
      lamp.add(v.fromBufferAttribute(pos, i).applyMatrix4(turn));
      lamps++;
    }
    const allTurned = all.clone().applyMatrix4(turn);
    allTurned.computeBoundingBox();
    const tb = allTurned.boundingBox!;
    if (lamps && lamp.x / lamps > (tb.min.x + tb.max.x) / 2) {
      turn.premultiply(new THREE.Matrix4().makeRotationY(Math.PI));
    }
    all.applyMatrix4(turn);
    all.computeBoundingBox();
    const box = all.boundingBox!;
    const s = (REAR_X - FRONT_X) / (box.max.x - box.min.x);
    const center = box.getCenter(new THREE.Vector3());
    const place = new THREE.Matrix4()
      .makeTranslation((FRONT_X + REAR_X) / 2, 0, 0)
      .multiply(new THREE.Matrix4().makeScale(s, s, s))
      .multiply(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z))
      .multiply(turn);
    for (const p of parts) p.geo.applyMatrix4(place);
    const placed = mergeGeometries(
      parts.map((p) => p.geo.clone().deleteAttribute('uv')),
      false,
    )!;
    placed.computeBoundingBox();
    const finalBox = placed.boundingBox!.clone();

    // 2. onde ficam o para-brisa e a coluna do meio (para recortar capô e porta)
    let glassFront = Infinity;
    let glassRear = -Infinity;
    let hoodTop = -Infinity;
    const bp = body.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < bp.count; i++) {
      if (hex(colorAt(uv.getX(i))) !== '#1f5f7f') continue;
      glassFront = Math.min(glassFront, bp.getX(i));
      glassRear = Math.max(glassRear, bp.getX(i));
    }
    const pillarB = glassFront + (glassRear - glassFront) * 0.48;
    const width = finalBox.max.z;

    let doorFront = Infinity;
    const take = split(body, ({ c, n, u }) => {
      const part = COLOR_PART[hex(colorAt(u))] ?? 'trim';
      // capô: só a tampa de cima (com a saída de ar preta), da borda logo atrás
      // do para-choque até a base do para-brisa; os para-lamas ficam de fora
      // (mais largos que ±0,62 m na frente e ±0,70 m atrás), e o para-choque e
      // o lábio também (mais baixos e mais à frente)
      const t = (c.x - HOOD_FRONT) / (glassFront - HOOD_FRONT);
      if (
        part !== 'glass' &&
        n.y > 0.3 &&
        c.y > 0.72 &&
        c.x > HOOD_FRONT &&
        c.x < glassFront - 0.03 &&
        Math.abs(c.z) < 0.62 + 0.08 * Math.max(0, Math.min(1, t))
      ) {
        hoodTop = Math.max(hoodTop, c.y);
        return part === 'paint' ? 'hood' : 'hoodTrim';
      }
      // porta do motorista (lado +z), entre o para-brisa e a coluna do meio
      if (
        (part === 'paint' || part === 'glass') &&
        c.z > width * 0.45 &&
        n.z > 0.35 &&
        c.x > glassFront - 0.12 &&
        c.x < pillarB &&
        c.y > 0.3
      ) {
        doorFront = Math.min(doorFront, c.x);
        return part === 'glass' ? 'doorGlass' : 'door';
      }
      return part;
    });

    const hoodHinge = new THREE.Vector3(glassFront - 0.03, hoodTop, 0);
    // altura de cima da lataria num ponto (x, z): raio de cima para baixo no capô e na carroceria
    const top = new THREE.Mesh(mergeGeometries([take('hood'), take('paint')], false)!);
    const ray = new THREE.Raycaster();
    const surfaceY = (x: number, z: number) => {
      ray.set(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0));
      const hit = ray.intersectObject(top, false)[0];
      return hit ? hit.point.y : 0;
    };
    const doorHinge = new THREE.Vector3(doorFront, 0.5, width * 0.95);
    const at = (g: THREE.BufferGeometry, o: THREE.Vector3) => g.translate(-o.x, -o.y, -o.z);
    return {
      paint: take('paint'),
      trim: take('trim'),
      glass: take('glass'),
      headlight: take('headlight'),
      taillight: take('taillight'),
      signal: take('signal'),
      mirror: take('mirror'),
      hood: at(take('hood'), hoodHinge),
      hoodTrim: at(take('hoodTrim'), hoodHinge),
      door: at(take('door'), doorHinge),
      doorGlass: at(take('doorGlass'), doorHinge),
      hoodHinge,
      doorHinge,
      wheels: parts.slice(1),
      box: finalBox,
      surfaceY,
    };
  }, [scene]);
}

if (HAS_MODEL) useGLTF.preload(CAR_MODEL_URL);
