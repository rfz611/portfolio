import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { cyl, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { paintOvalClockDial } from '../textures/clock';
import { Interactive } from './Interactive';

/** Medidas do relógio (m): oval de 0,20 × 0,11, com 0,05 de fundo. */
const W = 0.2;
const H = 0.11;
const D = 0.045;
const LIFT = 0.016; // altura dos pezinhos
/** Centro do mostrador de ponteiros, em relação ao centro da frente. */
const DIAL_X = -W / 2 + W * 0.36;

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

/** Ponteiro: barrinha com a base no eixo, apontando para cima. */
function hand(length: number, width: number, tail = 0.006) {
  return new THREE.BoxGeometry(width, length + tail, 0.0012).translate(0, (length - tail) / 2, 0);
}

/**
 * Despertador oval de metal dourado (como os de mesa dos anos 70/80):
 * mostrador vermelho com números brancos e ponteiros que marcam a hora
 * real de quem visita, e à direita a janela da data de virar, com um
 * rendado branco em volta e arabescos dourados. Pezinhos e botões dourados.
 */
export function Clock() {
  const day = new Date().getDate();
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
      hour: hand(0.024, 0.0035),
      minute: hand(0.034, 0.0026),
      second: hand(0.037, 0.0009, 0.01),
      pin: cyl(0.0028, 0.0028, 0.003, [0, 0, 0], { seg: 12, rot: [Math.PI / 2, 0, 0] }),
    };
  }, []);

  const mats = useMemo(
    () => ({
      brass: new THREE.MeshStandardMaterial({
        color: '#e2bf72',
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 1.9,
      }),
      dial: new THREE.MeshStandardMaterial({
        map: tex(
          makeCanvas(512, 256, (c, w, h) => paintOvalClockDial(c, w, h, day)),
          { clamp: true },
        ),
        roughness: 0.4,
        envMapIntensity: 0.6,
        emissive: '#ffffff',
        emissiveIntensity: 0.02,
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
      hand: new THREE.MeshStandardMaterial({ color: '#f4f1ea', metalness: 0.5, roughness: 0.3 }),
      second: new THREE.MeshStandardMaterial({ color: '#d8c38a', metalness: 0.8, roughness: 0.3 }),
    }),
    [day],
  );

  const hourHand = useRef<THREE.Mesh>(null);
  const minuteHand = useRef<THREE.Mesh>(null);
  const secondHand = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const now = new Date();
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    if (hourHand.current) hourHand.current.rotation.z = -(h / 12) * Math.PI * 2;
    if (minuteHand.current) minuteHand.current.rotation.z = -(m / 60) * Math.PI * 2;
    if (secondHand.current) secondHand.current.rotation.z = -(Math.floor(s) / 60) * Math.PI * 2;
  });

  const front = D / 2 - 0.006;
  return (
    <Interactive id="clock" label="objects.clock">
      <group name="clock" rotation={[0, -0.12, 0]}>
        <group position={[0, LIFT + H / 2, 0]}>
          <mesh geometry={geo.shell} material={mats.brass} />
          <mesh geometry={geo.back} material={mats.brass} />
          <mesh geometry={geo.face} material={mats.dial} />
          <mesh geometry={geo.feet} material={mats.brass} />
          <mesh geometry={geo.knobs} material={mats.brass} />
          <group position={[DIAL_X, 0, front]}>
            <mesh ref={hourHand} geometry={geo.hour} material={mats.hand} />
            <mesh ref={minuteHand} geometry={geo.minute} material={mats.hand} position-z={0.0013} />
            <mesh
              ref={secondHand}
              geometry={geo.second}
              material={mats.second}
              position-z={0.0026}
            />
            <mesh geometry={geo.pin} material={mats.brass} position-z={0.0028} />
          </group>
          <mesh geometry={geo.glass} material={mats.glass} renderOrder={3} />
        </group>
      </group>
    </Interactive>
  );
}
