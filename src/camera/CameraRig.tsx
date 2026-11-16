import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useScene } from '../store/useScene';
import { prefersReducedMotion } from '../ui/hooks';
import { resolveShot } from './shots';

const MAX_PARALLAX = (3 * Math.PI) / 180;

/**
 * Leva a câmera de um plano ao outro com uma curva suave (power3.inOut)
 * e, no plano inicial, mexe a vista de leve conforme o mouse (até 3 graus).
 */
export function CameraRig() {
  const view = useScene((s) => s.view);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  const rig = useRef({
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    fov: 40,
    started: false,
    view,
  });
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    const r = rig.current;
    const pose = resolveShot(view, width / Math.max(1, height));
    const viewChanged = r.view !== view;
    r.view = view;
    const reduced = prefersReducedMotion();
    const duration = !r.started ? 0 : viewChanged ? (reduced ? 0.25 : pose.duration) : 0.35;
    r.started = true;
    const ease = reduced ? 'power1.out' : 'power3.inOut';
    const [px, py, pz] = pose.position;
    const [tx, ty, tz] = pose.target;
    gsap.to(r.position, { x: px, y: py, z: pz, duration, ease, overwrite: true });
    gsap.to(r.target, { x: tx, y: ty, z: tz, duration, ease, overwrite: true });
    gsap.to(r, { fov: pose.fov, duration, ease, overwrite: 'auto' });
  }, [view, width, height]);

  useFrame((_, delta) => {
    const r = rig.current;
    const p = pointer.current;
    const k = 1 - Math.exp(-delta * 3);
    const active = r.view === 'home' && !prefersReducedMotion() ? 1 : 0;
    p.sx += (p.x * active - p.sx) * k;
    p.sy += (p.y * active - p.sy) * k;

    camera.position.copy(r.position);
    camera.lookAt(r.target);
    camera.rotateY(-p.sx * MAX_PARALLAX);
    camera.rotateX(-p.sy * MAX_PARALLAX * 0.6);
    if (Math.abs(camera.fov - r.fov) > 0.01) {
      camera.fov = r.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
