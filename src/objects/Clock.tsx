import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cyl, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { paintDoily, paintOvalClockDial } from '../textures/clock';
import { Interactive } from './Interactive';

/** Medidas do relógio (m): oval de 0,20 × 0,11, com 0,05 de fundo. */
const W = 0.2;
const H = 0.11;
const D = 0.045;
const LIFT = 0.016; // altura dos pezinhos

/** Contorno de "pílula" (retângulo com as pontas redondas). */
function stadium(w: number, h: number) {
  const r = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -r);
  s.lineTo(w / 2 - r, -r);
  s.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-w / 2 + r, r);
  s.absarc(-w / 2 + r, 0, r, Math.PI / 2, (Math.PI * 3) / 2, false);
  return s;
}

/**
 * Despertador oval de metal dourado (como os de mesa dos anos 70/80):
 * mostrador vermelho com números brancos e ponteiros que marcam a hora
 * real de quem visita, e à direita a janela da data de virar, com um
 * rendado branco em volta e arabescos dourados. Pezinhos e botões dourados.
 */
export function Clock() {
  const geo = useMemo(() => {
    // aro dourado: o contorno com o miolo vazado, para o mostrador ficar afundado
    const ring = stadium(W, H);
    ring.holes.push(stadium(W * 0.9, H * 0.82));
    const shell = new THREE.ExtrudeGeometry(ring, {
      depth: D,
      bevelEnabled: true,
      bevelSize: 0.006,
      bevelThickness: 0.006,
      bevelSegments: 4,
      curveSegments: 20,
    });
    shell.translate(0, 0, -D / 2);
    const back = new THREE.ExtrudeGeometry(stadium(W * 0.95, H * 0.9), {
      depth: 0.004,
      bevelEnabled: false,
      curveSegments: 20,
    });
    back.translate(0, 0, -D / 2);
    const face = new THREE.ShapeGeometry(stadium(W * 0.9, H * 0.82), 20);
    const p = face.attributes.position as THREE.BufferAttribute;
    const uv = face.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      uv.setXY(i, p.getX(i) / (W * 0.9) + 0.5, p.getY(i) / (H * 0.82) + 0.5);
    }
    return {
      shell,
      back,
      face: face.translate(0, 0, D / 2 - 0.007),
      glass: new THREE.ShapeGeometry(stadium(W * 0.9, H * 0.82), 20).translate(0, 0, D / 2 + 0.003),
      feet: merge([
        cyl(0.004, 0.009, LIFT, [-W * 0.3, -H / 2 - LIFT / 2 + 0.003, 0], { seg: 12 }),
        cyl(0.004, 0.009, LIFT, [W * 0.3, -H / 2 - LIFT / 2 + 0.003, 0], { seg: 12 }),
      ]),
      knobs: merge([
        cyl(0.005, 0.005, 0.008, [-W * 0.18, H / 2 + 0.008, -0.005], { seg: 10 }),
        cyl(0.005, 0.005, 0.008, [W * 0.18, H / 2 + 0.008, -0.005], { seg: 10 }),
      ]),
      doily: new THREE.PlaneGeometry(0.3, 0.3).rotateX(-Math.PI / 2).translate(0, 0.001, 0),
    };
  }, []);

  // mostrador desenhado de novo a cada minuto (hora e data reais de quem visita)
  const dial = useMemo(() => {
    const canvas = makeCanvas(512, 256, (c, w, h) => paintOvalClockDial(c, w, h, new Date()));
    return { canvas, texture: tex(canvas, { clamp: true }) };
  }, []);
  const minute = useRef(-1);
  useFrame(() => {
    const now = new Date();
    if (now.getMinutes() === minute.current) return;
    minute.current = now.getMinutes();
    const ctx = dial.canvas.getContext('2d');
    if (!ctx) return;
    paintOvalClockDial(ctx, dial.canvas.width, dial.canvas.height, now);
    dial.texture.needsUpdate = true;
  });

  const mats = useMemo(
    () => ({
      brass: new THREE.MeshStandardMaterial({
        color: '#f0cf82',
        metalness: 0.75,
        roughness: 0.28,
        envMapIntensity: 2.2,
      }),
      dial: new THREE.MeshStandardMaterial({
        map: dial.texture,
        roughness: 0.4,
        envMapIntensity: 0.6,
        emissive: '#ffffff',
        emissiveMap: dial.texture,
        emissiveIntensity: 0.12,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.08,
        roughness: 0.02,
        metalness: 0.4,
        envMapIntensity: 2,
        depthWrite: false,
      }),
      doily: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(256, 256, paintDoily), { clamp: true }),
        transparent: true,
        alphaTest: 0.4,
        roughness: 0.9,
      }),
    }),
    [dial],
  );

  return (
    <Interactive id="clock" label="objects.clock">
      <group name="clock" rotation={[0, -0.12, 0]}>
        {/* toalhinha de renda branca embaixo, como na foto */}
        <mesh geometry={geo.doily} material={mats.doily} scale={[1, 1, 0.7]} />
        <group position={[0, LIFT + H / 2, 0]}>
          <mesh geometry={geo.shell} material={mats.brass} />
          <mesh geometry={geo.back} material={mats.brass} />
          <mesh geometry={geo.face} material={mats.dial} />
          <mesh geometry={geo.feet} material={mats.brass} />
          <mesh geometry={geo.knobs} material={mats.brass} />
          <mesh geometry={geo.glass} material={mats.glass} renderOrder={3} />
        </group>
      </group>
    </Interactive>
  );
}
