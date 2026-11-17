import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { QUALITY } from '../config/quality';
import { useScene } from '../store/useScene';
import { mulberry32 } from '../textures/random';

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
    gl_FragColor = vec4(0.62, 0.72, 1.0, 0.03 + vAlpha * 0.12);
  }
`;

/** Chuva caindo lá fora (o vidro fica limpo, para a cidade aparecer). */
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
      // começa a uns metros do vidro, para não tapar a vista da cidade
      const z = -9 - Math.pow(r(), 1.5) * 60;
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

  useFrame(({ clock }) => {
    fall.material.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <group name="rain">
      <lineSegments geometry={fall.geometry} material={fall.material} frustumCulled={false} />
    </group>
  );
}
