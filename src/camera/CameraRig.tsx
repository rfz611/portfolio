import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useScene } from '../store/useScene';
import { prefersReducedMotion } from '../ui/hooks';
import { cut } from '../ui/cut';
import { homeShot, resolveShot } from './shots';

const MAX_PARALLAX = (3 * Math.PI) / 180;
const UP = new THREE.Vector3(0, 1, 0);
const PITCH_LIMIT = { min: -0.55, max: 0.45 };

/**
 * Troca de plano com um corte de cinema: a tela escurece, a câmera muda de
 * lugar e a imagem reabre com uma aproximação leve.
 * No plano inicial (sentado no sofá) dá para olhar em volta: arrastando
 * com o mouse ou o dedo, ou com as setas ← → ↑ ↓. O mouse parado também
 * mexe a vista de leve (até 3 graus).
 */
export function CameraRig() {
  const view = useScene((s) => s.view);
  const spot = useScene((s) => s.spot);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const dom = useThree((s) => s.gl.domElement);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);

  const rig = useRef({
    position: new THREE.Vector3(),
    target: new THREE.Vector3(),
    fov: 40,
    started: false,
    view,
    spot,
  });
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });
  const look = useRef({ yaw: 0, pitch: 0, sYaw: 0, sPitch: 0, drag: false, lastX: 0, lastY: 0 });
  const tmp = useRef({
    dir: new THREE.Vector3(),
    right: new THREE.Vector3(),
    at: new THREE.Vector3(),
  });

  // olhar em volta arrastando (só no plano inicial)
  useEffect(() => {
    const l = look.current;
    const down = (event: PointerEvent) => {
      l.drag = true;
      l.lastX = event.clientX;
      l.lastY = event.clientY;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') {
        pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
      }
      if (!l.drag || useScene.getState().view !== 'home') return;
      const scale = (rig.current.fov / 60) * 0.0055;
      l.yaw += (event.clientX - l.lastX) * scale;
      l.pitch += (event.clientY - l.lastY) * scale * 0.8;
      l.pitch = Math.min(PITCH_LIMIT.max, Math.max(PITCH_LIMIT.min, l.pitch));
      l.lastX = event.clientX;
      l.lastY = event.clientY;
    };
    const up = () => {
      l.drag = false;
    };
    const key = (event: KeyboardEvent) => {
      if (useScene.getState().view !== 'home') return;
      const step = 0.22;
      if (event.key === 'ArrowLeft') l.yaw += step;
      else if (event.key === 'ArrowRight') l.yaw -= step;
      else if (event.key === 'ArrowUp') l.pitch = Math.min(PITCH_LIMIT.max, l.pitch + step / 2);
      else if (event.key === 'ArrowDown') l.pitch = Math.max(PITCH_LIMIT.min, l.pitch - step / 2);
      else return;
      event.preventDefault();
    };
    dom.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key);
    return () => {
      dom.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('keydown', key);
    };
  }, [dom]);

  useEffect(() => {
    const r = rig.current;
    const aspect = width / Math.max(1, height);
    const pose =
      view === 'home' ? resolveShot('home', aspect, homeShot(spot)) : resolveShot(view, aspect);
    const viewChanged = r.view !== view || r.spot !== spot;
    r.view = view;
    r.spot = spot;
    // ao trocar de plano, o olhar volta para a frente
    if (viewChanged) {
      look.current.yaw = 0;
      look.current.pitch = 0;
    }
    const [px, py, pz] = pose.position;
    const [tx, ty, tz] = pose.target;
    const place = (push: number) => {
      // começa um pouco mais longe e se aproxima devagar (push = 0 fica parado)
      r.position.set(px + (px - tx) * push, py + (py - ty) * push, pz + (pz - tz) * push);
      r.target.set(tx, ty, tz);
      r.fov = pose.fov;
    };
    if (!r.started || !viewChanged) {
      // primeira vez ou só mudou o tamanho da tela: vai direto
      r.started = true;
      gsap.killTweensOf(r.position);
      place(0);
      return;
    }
    // troca de plano: corte de cinema (escurece, corta, reabre se aproximando)
    const reduced = prefersReducedMotion();
    const timeline = gsap.timeline();
    timeline
      .call(() => cut(1, reduced ? 0.12 : 0.22))
      .to({}, { duration: reduced ? 0.12 : 0.24 })
      .call(() => {
        gsap.killTweensOf(r.position);
        place(reduced ? 0 : 0.08);
        cut(0, reduced ? 0.2 : 0.5);
        if (!reduced) {
          gsap.to(r.position, { x: px, y: py, z: pz, duration: 1.1, ease: 'power2.out' });
        }
      });
    return () => {
      timeline.kill();
    };
  }, [view, spot, width, height]);

  useFrame((_, delta) => {
    const r = rig.current;
    const p = pointer.current;
    const l = look.current;
    const t = tmp.current;
    const k = 1 - Math.exp(-delta * 3);
    const active = r.view === 'home' && !prefersReducedMotion() && !l.drag ? 1 : 0;
    p.sx += (p.x * active - p.sx) * k;
    p.sy += (p.y * active - p.sy) * k;
    const kl = 1 - Math.exp(-delta * 8);
    l.sYaw += (l.yaw - l.sYaw) * kl;
    l.sPitch += (l.pitch - l.sPitch) * kl;

    t.dir.copy(r.target).sub(r.position);
    t.dir.applyAxisAngle(UP, l.sYaw - p.sx * MAX_PARALLAX);
    t.right.crossVectors(t.dir, UP).normalize();
    t.dir.applyAxisAngle(t.right, l.sPitch - p.sy * MAX_PARALLAX * 0.6);
    camera.position.copy(r.position);
    camera.lookAt(t.at.copy(r.position).add(t.dir));
    if (Math.abs(camera.fov - r.fov) > 0.01) {
      camera.fov = r.fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
