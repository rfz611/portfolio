import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { GARAGE, ROOM } from '../config/layout';
import { QUALITY } from '../config/quality';
import { useScene } from '../store/useScene';
import { mulberry32 } from '../textures/random';

const TOTAL = GARAGE.x1 - ROOM.x0;
const MID_X = (ROOM.x0 + GARAGE.x1) / 2;

const fallVertex = /* glsl */ `
  attribute float aEnd;
  attribute float aSpeed;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y = mod(position.y - uTime * aSpeed, 46.0) - 20.0;
    p.y += aEnd * 0.85;
    p.x += aEnd * 0.07;
    vAlpha = aEnd;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fallFragment = /* glsl */ `
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(0.62, 0.72, 1.0, 0.05 + vAlpha * 0.2);
  }
`;

const glassVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Gotas escorrendo no vidro: colunas com uma gota que desce deixando rastro,
// mais gotinhas paradas.
const glassFragment = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    float columns = 420.0;
    float col = floor(vUv.x * columns);
    float fx = fract(vUv.x * columns);
    float pick = hash(col * 12.9898);
    float running = step(0.82, pick);
    float speed = 0.05 + hash(col * 3.7) * 0.16;
    float y = fract(vUv.y + uTime * speed + hash(col * 7.1));
    float head = smoothstep(0.008, 0.0, y);
    float trail = smoothstep(0.07, 0.0, y) * 0.22;
    float thin = smoothstep(0.32, 0.0, abs(fx - 0.5));
    float drops = running * (head + trail) * thin;

    vec2 grid = vUv * vec2(330.0, 60.0);
    vec2 id = floor(grid);
    vec2 f = fract(grid) - 0.5;
    float bead = step(0.82, hash(id.x * 17.0 + id.y * 59.0)) * smoothstep(0.32, 0.05, length(f));

    float alpha = drops * 0.3 + bead * 0.09;
    gl_FragColor = vec4(vec3(0.62, 0.74, 1.0) * 1.2, alpha);
  }
`;

/** Chuva caindo lá fora e escorrendo no vidro. */
export function Rain() {
  const quality = useScene((s) => s.quality);
  const count = QUALITY[quality].rain;

  const fall = useMemo(() => {
    const r = mulberry32(5);
    const positions = new Float32Array(count * 6);
    const ends = new Float32Array(count * 2);
    const speeds = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = -24 + r() * 62;
      const y = r() * 46;
      const z = -5.2 - Math.pow(r(), 1.5) * 60;
      const speed = 15 + r() * 9;
      positions.set([x, y, z, x, y, z], i * 6);
      ends.set([0, 1], i * 2);
      speeds.set([speed, speed], i * 2);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aEnd', new THREE.BufferAttribute(ends, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: fallVertex,
      fragmentShader: fallFragment,
      uniforms: { uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return { geometry, material };
  }, [count]);

  const glass = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glassVertex,
        fragmentShader: glassFragment,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );

  useFrame(({ clock }) => {
    fall.material.uniforms.uTime.value = clock.elapsedTime;
    glass.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group name="rain">
      <lineSegments geometry={fall.geometry} material={fall.material} frustumCulled={false} />
      <mesh position={[MID_X, ROOM.h / 2, ROOM.z0 - 0.04]} material={glass} renderOrder={1}>
        <planeGeometry args={[TOTAL, ROOM.h]} />
      </mesh>
    </group>
  );
}
