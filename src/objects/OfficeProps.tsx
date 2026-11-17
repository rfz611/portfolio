import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { box, crease, cyl, merge } from '../scene/geo';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';
import { SEAT_SPOT, useSeated } from './seat';

const HALF_PI = Math.PI / 2;

/**
 * Cadeira do escritório: clicando nela, a pessoa senta. A cadeira desliza
 * de onde estava (afastada, como se alguém tivesse levantado) até a mesa.
 */
export function ChairSeat({ children }: { children: ReactNode }) {
  const home = useScene((s) => s.view === 'home');
  const seated = useSeated();
  const group = useRef<THREE.Group>(null!);
  useEffect(() => {
    const g = group.current;
    const to = seated ? { x: 0.12, z: -0.8, ry: 0 } : { x: 0.72, z: -0.98, ry: -0.5 };
    const tween = gsap.to(g.position, { x: to.x, z: to.z, duration: 0.9, ease: 'power2.inOut' });
    const turn = gsap.to(g.rotation, { y: to.ry, duration: 0.9, ease: 'power2.inOut' });
    return () => {
      tween.kill();
      turn.kill();
    };
  }, [seated]);
  return (
    <group ref={group} position={[0.72, 0, -0.98]} rotation={[0, -0.5, 0]}>
      <Interactive
        id="chair"
        label="objects.chair"
        enabled={home && !seated}
        onClick={() => useScene.getState().setSpot(SEAT_SPOT)}
      >
        {children}
      </Interactive>
    </group>
  );
}

/**
 * Gaveta de cima, do lado direito de quem senta: abre e fecha com um
 * clique quando a pessoa está sentada. Dentro, maços de dinheiro, uma
 * caixa de charutos e uma caneta.
 */
export function Drawer() {
  const { mat } = lib();
  const seated = useSeated();
  const [open, setOpen] = useState(false);
  const group = useRef<THREE.Group>(null!);
  useEffect(() => {
    if (!seated) setOpen(false);
  }, [seated]);
  useEffect(() => {
    const tween = gsap.to(group.current.position, {
      z: open ? -0.33 : 0,
      duration: 0.5,
      ease: 'power2.out',
    });
    return () => {
      tween.kill();
    };
  }, [open]);
  const geo = useMemo(
    () => ({
      face: box([0.46, 0.19, 0.02], [0, 0, -0.475]),
      pull: cyl(0.006, 0.006, 0.12, [0, 0, -0.49], { seg: 6, rot: [0, 0, HALF_PI] }),
      tray: merge([
        box([0.42, 0.012, 0.4], [0, -0.07, -0.27]),
        box([0.012, 0.13, 0.4], [-0.205, -0.01, -0.27]),
        box([0.012, 0.13, 0.4], [0.205, -0.01, -0.27]),
        box([0.42, 0.13, 0.012], [0, -0.01, -0.07]),
      ]),
      cash: merge([
        box([0.16, 0.025, 0.07], [-0.08, -0.05, -0.3], { rot: [0, 0.1, 0] }),
        box([0.16, 0.025, 0.07], [-0.07, -0.025, -0.3], { rot: [0, -0.05, 0] }),
        box([0.16, 0.025, 0.07], [-0.09, -0.05, -0.2], { rot: [0, 0.2, 0] }),
      ]),
      bands: merge([
        box([0.03, 0.027, 0.072], [-0.08, -0.05, -0.3], { rot: [0, 0.1, 0] }),
        box([0.03, 0.027, 0.072], [-0.07, -0.025, -0.3], { rot: [0, -0.05, 0] }),
        box([0.03, 0.027, 0.072], [-0.09, -0.05, -0.2], { rot: [0, 0.2, 0] }),
      ]),
      cigars: crease(box([0.15, 0.045, 0.1], [0.1, -0.04, -0.3]), 30),
      pen: cyl(0.005, 0.005, 0.14, [0.08, -0.06, -0.18], { seg: 6, rot: [HALF_PI, 0.3, 0] }),
    }),
    [],
  );
  const money = useMemo(() => new THREE.MeshLambertMaterial({ color: '#5f7a52' }), []);
  const band = useMemo(() => new THREE.MeshLambertMaterial({ color: '#d8cfb4' }), []);
  return (
    <Interactive
      id="drawer"
      label="objects.drawer"
      enabled={seated}
      onClick={() => setOpen((v) => !v)}
    >
      <group ref={group} position={[0, 0, 0]}>
        <group position={[-0.82, 0.6, 0]}>
          <mesh geometry={geo.face} material={mat.mahogany} />
          <mesh geometry={geo.pull} material={mat.brass} />
          <mesh geometry={geo.tray} material={mat.mahoganyDark} />
          <mesh geometry={geo.cash} material={money} />
          <mesh geometry={geo.bands} material={band} />
          <mesh geometry={geo.cigars} material={mat.mahogany} />
          <mesh geometry={geo.pen} material={mat.brass} />
        </group>
      </group>
    </Interactive>
  );
}

/** Foto de espera até chegar a foto do Raphael (public/textures/foto.jpg). */
function paintPhotoPlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#6b5a44');
  g.addColorStop(1, '#2e241a');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(240,225,200,0.75)';
  ctx.font = '22px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EM BREVE', w / 2, h / 2);
}

/** Porta-retrato de latão virado para quem senta à mesa. */
export function PhotoFrame() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      frame: crease(box([0.16, 0.21, 0.014], [0, 0.105, 0]), 30),
      inlay: merge([
        box([0.138, 0.003, 0.002], [0, 0.105 + 0.093, -0.0075]),
        box([0.138, 0.003, 0.002], [0, 0.105 - 0.093, -0.0075]),
        box([0.003, 0.186, 0.002], [-0.0675, 0.105, -0.0075]),
        box([0.003, 0.186, 0.002], [0.0675, 0.105, -0.0075]),
      ]),
      leg: box([0.02, 0.15, 0.006], [0, 0.07, 0.05], { rot: [0.5, 0, 0] }),
    }),
    [],
  );
  const lacquer = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.12, envMapIntensity: 1.5 }),
    [],
  );
  const photo = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: tex(makeCanvas(128, 168, paintPhotoPlaceholder), { clamp: true }),
      roughness: 0.3,
    });
    new THREE.TextureLoader().load(
      '/textures/foto.jpg',
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        m.map = t;
        m.needsUpdate = true;
      },
      undefined,
      () => undefined,
    );
    return m;
  }, []);
  return (
    <Interactive id="photo" label="objects.photo">
      <group rotation={[0.18, 0, 0]} name="photo-frame">
        <mesh geometry={geo.frame} material={lacquer} />
        <mesh geometry={geo.leg} material={lacquer} />
        <mesh geometry={geo.inlay} material={mat.brass} />
        <mesh position={[0, 0.105, -0.0075]} rotation={[0, Math.PI, 0]} material={photo}>
          <planeGeometry args={[0.125, 0.175]} />
        </mesh>
      </group>
    </Interactive>
  );
}

/** Vapor subindo da caneca de café (três fiapos que sobem e somem). */
export function Steam() {
  const { tex: t } = lib();
  const puffs = useRef<THREE.Sprite[]>([]);
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: t.glowSoft,
        color: '#d8d0c4',
        transparent: true,
        opacity: 0.12,
        depthWrite: false,
      }),
    [t],
  );
  const materials = useMemo(() => [0, 1, 2].map(() => material.clone()), [material]);
  useFrame(({ clock }) => {
    puffs.current.forEach((sprite, i) => {
      if (!sprite) return;
      const phase = (clock.elapsedTime * 0.35 + i / 3) % 1;
      sprite.position.set(Math.sin(phase * 6 + i) * 0.01, 0.1 + phase * 0.18, 0);
      const size = 0.04 + phase * 0.08;
      sprite.scale.set(size, size * 1.6, 1);
      (sprite.material as THREE.SpriteMaterial).opacity = Math.sin(phase * Math.PI) * 0.16;
    });
  });
  return (
    <group name="steam">
      {materials.map((m, i) => (
        <sprite
          key={i}
          ref={(el) => {
            if (el) puffs.current[i] = el;
          }}
          material={m}
        />
      ))}
    </group>
  );
}
