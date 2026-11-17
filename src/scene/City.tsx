import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GARAGE, ROOM } from '../config/layout';
import { retile } from '../textures/canvas';
import { hdr, lib } from '../textures/library';
import { mulberry32 } from '../textures/random';
import { box, merge } from './geo';

const GROUND_Y = -95;
const CENTER_X = (ROOM.x0 + GARAGE.x1) / 2;

/** Pinta o prédio inteiro com um brilho (mais longe = mais apagado) e escurece a laje. */
function tint(g: THREE.BufferGeometry, brightness: number) {
  const count = g.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const roof = i >= 8 && i < 16;
    colors[i * 3] = roof ? 0.012 : brightness * 0.95;
    colors[i * 3 + 1] = roof ? 0.014 : brightness * 0.97;
    colors[i * 3 + 2] = roof ? 0.03 : brightness * 1.1;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

function buildCity() {
  const r = mulberry32(77);
  const groups: THREE.BufferGeometry[][] = [[], [], []];
  const beacons: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 92; i++) {
    // a maioria dos prédios fica ao norte, atrás da parede de vidro
    const north = r() < 0.72;
    const angle = north ? -Math.PI * (0.1 + r() * 0.8) : r() * Math.PI * 2;
    const distance = 36 + Math.pow(r(), 1.6) * 250;
    const x = CENTER_X + Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    if (Math.abs(x - CENTER_X) < 20 && Math.abs(z) < 16) continue;
    const w = 11 + r() * 22;
    const d = 11 + r() * 22;
    const tall = distance > 75 && r() < 0.16;
    const top = tall ? 8 + r() * 55 : -72 + r() * 62;
    const h = top - GROUND_Y;
    const brightness = Math.max(0.22, Math.min(1, 1.2 - distance / 270));
    groups[i % 3].push(tint(box([w, h, d], [x, top - h / 2, z], { uv: 8 }), brightness));
    if (tall) {
      const lamp = new THREE.SphereGeometry(0.7, 6, 4);
      lamp.translate(x, top + 1.2, z);
      beacons.push(lamp);
    }
  }

  const ground = new THREE.PlaneGeometry(1500, 1500, 30, 30);
  ground.rotateX(-Math.PI / 2);
  ground.translate(CENTER_X, GROUND_Y, 0);
  const pos = ground.attributes.position as THREE.BufferAttribute;
  const uv = ground.attributes.uv as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const dist = Math.hypot(pos.getX(i) - CENTER_X, pos.getZ(i));
    const b = Math.max(0, Math.min(1, 1.12 - dist / 560));
    colors.set([b, b, b], i * 3);
    uv.setXY(i, uv.getX(i) * 9, uv.getY(i) * 9);
  }
  ground.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return { blocks: groups.map((g) => merge(g)), beacons: merge(beacons), ground };
}

/**
 * A cidade lá fora: céu, um tapete de luzes até o horizonte e prédios de
 * janelas acesas. Tudo feito no código, com poucas chamadas de desenho.
 */
export function City() {
  const { mat, tex } = lib();
  const geo = useMemo(buildCity, []);
  const beacon = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), []);
  const base = useRef(hdr('#ff2418', 3));
  const facade = useMemo(
    () => new THREE.MeshBasicMaterial({ map: retile(tex.facade, 3, 10), color: '#4a4a55' }),
    [tex],
  );

  // luzes de topo de prédio piscando devagar
  useFrame(({ clock }) => {
    const pulse = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.1), 3);
    beacon.color.copy(base.current).multiplyScalar(pulse);
  });

  const blocks = [mat.cityA, mat.cityB, mat.cityC];
  return (
    <group name="city">
      <mesh material={mat.sky} renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[760, 24, 16]} />
      </mesh>
      <mesh geometry={geo.ground} material={mat.cityGround} />
      {geo.blocks.map((g, i) => (
        <mesh key={i} geometry={g} material={blocks[i]} />
      ))}
      <mesh geometry={geo.beacons} material={beacon} />
      {/* o prédio abaixo da cobertura */}
      <mesh position={[CENTER_X, -33.1, ROOM.z1 + 0.02]} material={facade}>
        <planeGeometry args={[GARAGE.x1 - ROOM.x0 + 0.2, 64]} />
      </mesh>
    </group>
  );
}
