import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useScene, type ViewId } from '../store/useScene';
import { prefersReducedMotion } from '../ui/hooks';
import { cut } from '../ui/cut';
import { homeShot, resolveShot } from './shots';

const MAX_PARALLAX = (5 * Math.PI) / 180;
/** Faixa da borda da tela (em fração da metade) onde o mouse parado gira a câmera. */
const EDGE = 0.78;
/** Velocidade do giro com o mouse encostado na borda (rad/s). */
const EDGE_SPEED = 1.5;
const UP = new THREE.Vector3(0, 1, 0);
/** Até onde o olhar sobe e desce (inclinação em relação ao horizonte, em radianos). */
const ELEVATION = { min: -1.1, max: 0.75 };
/** Planos em que dá para arrastar e olhar em volta. */
const LOOK_VIEWS = new Set<ViewId>(['home', 'janela']);
const canLook = () => LOOK_VIEWS.has(useScene.getState().view);

/**
 * Troca de plano com um corte de cinema: a tela escurece, a câmera muda de
 * lugar e a imagem reabre com uma aproximação leve.
 * Nos lugares da sala e na janela dá para olhar em volta: arrastando com o
 * mouse ou o dedo, ou com as setas ← → ↑ ↓ (para os lados sem limite; para
 * cima e para baixo até ELEVATION). O mouse parado também mexe a vista de
 * leve (até 3 graus) nos lugares da sala.
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
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0, over: false });
  const look = useRef({ yaw: 0, pitch: 0, sYaw: 0, sPitch: 0, drag: false, lastX: 0, lastY: 0 });
  const tmp = useRef({
    dir: new THREE.Vector3(),
    right: new THREE.Vector3(),
    at: new THREE.Vector3(),
  });

  // olhar para um ponto pedido pela cena (ex.: a gaveta aberta) e voltar depois
  useEffect(
    () =>
      useScene.subscribe((state, prev) => {
        if (state.glance === prev.glance) return;
        const l = look.current;
        const r = rig.current;
        if (!state.glance) {
          l.yaw = 0;
          l.pitch = 0;
          return;
        }
        const d0 = tmp.current.dir.copy(r.target).sub(r.position);
        const d1 = new THREE.Vector3(...state.glance).sub(r.position);
        const elev = (d: THREE.Vector3) => Math.atan2(d.y, Math.hypot(d.x, d.z));
        l.yaw = Math.atan2(d1.x, d1.z) - Math.atan2(d0.x, d0.z);
        l.yaw = Math.atan2(Math.sin(l.yaw), Math.cos(l.yaw));
        l.pitch = elev(d1) - elev(d0);
      }),
    [],
  );

  // olhar em volta arrastando (nos lugares da sala e na janela)
  useEffect(() => {
    const l = look.current;
    /** Limita a inclinação somando a do plano: o limite vale para o olhar final. */
    const clampPitch = (pitch: number) => {
      const r = rig.current;
      const d = tmp.current.dir.copy(r.target).sub(r.position);
      const base = Math.atan2(d.y, Math.hypot(d.x, d.z));
      return Math.min(ELEVATION.max - base, Math.max(ELEVATION.min - base, pitch));
    };
    const down = (event: PointerEvent) => {
      l.drag = true;
      l.lastX = event.clientX;
      l.lastY = event.clientY;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') {
        pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
        // só gira pela borda com o mouse em cima da cena (não nos botões)
        pointer.current.over = event.target === dom;
      }
      if (!l.drag || !canLook()) return;
      const scale = (rig.current.fov / 60) * 0.0055;
      l.yaw += (event.clientX - l.lastX) * scale;
      l.pitch = clampPitch(l.pitch + (event.clientY - l.lastY) * scale * 0.8);
      l.lastX = event.clientX;
      l.lastY = event.clientY;
    };
    const up = () => {
      l.drag = false;
    };
    const leave = () => {
      pointer.current.over = false;
    };
    const key = (event: KeyboardEvent) => {
      if (!canLook()) return;
      const step = 0.22;
      if (event.key === 'ArrowLeft') l.yaw += step;
      else if (event.key === 'ArrowRight') l.yaw -= step;
      else if (event.key === 'ArrowUp') l.pitch = clampPitch(l.pitch + step / 2);
      else if (event.key === 'ArrowDown') l.pitch = clampPitch(l.pitch - step / 2);
      else return;
      event.preventDefault();
    };
    dom.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('keydown', key);
    document.documentElement.addEventListener('mouseleave', leave);
    window.addEventListener('blur', leave);
    return () => {
      document.documentElement.removeEventListener('mouseleave', leave);
      window.removeEventListener('blur', leave);
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
    // só em desenvolvimento: câmera livre para inspecionar a cena (window.__cam)
    const free = import.meta.env.DEV ? window.__cam : undefined;
    if (free) {
      camera.position.set(...free.position);
      camera.lookAt(...free.target);
      if (free.fov && camera.fov !== free.fov) {
        camera.fov = free.fov;
        camera.updateProjectionMatrix();
      }
      return;
    }
    const r = rig.current;
    const p = pointer.current;
    const l = look.current;
    const t = tmp.current;
    const k = 1 - Math.exp(-delta * 3);
    const looking = LOOK_VIEWS.has(r.view);
    const active = looking && !prefersReducedMotion() && !l.drag ? 1 : 0;
    // mouse encostado na borda esquerda ou direita: a câmera vai girando para lá
    const edge = Math.abs(p.x) - EDGE;
    if (looking && p.over && !l.drag && edge > 0) {
      l.yaw -= Math.sign(p.x) * Math.min(1, edge / (1 - EDGE)) * EDGE_SPEED * delta;
    }
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
