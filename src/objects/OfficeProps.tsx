import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { box, crease, cyl, merge } from '../scene/geo';
import { SPOT } from '../config/layout';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintNewspaper, paintScratchedY } from '../textures/office';
import { Interactive } from './Interactive';
import { SEAT_SPOT, useSeated } from './seat';

const HALF_PI = Math.PI / 2;
/** Altura da gaveta do meio (logo abaixo do tampo) e quanto ela abre. */
const DRAWER_Y = 0.665;
const DRAWER_OUT = 0.2;
/** A gaveta fica alinhada com a cadeira (que encosta em x = 0,12). */
const DRAWER_X = 0.12;

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
 * Gaveta do meio, bem na frente de quem senta: abre e fecha com um clique
 * quando a pessoa está sentada, e a câmera olha para dentro dela. Dentro,
 * maços de dinheiro, uma caixa de charutos, uma caneta e um Y riscado a
 * canivete no fundo, no canto de baixo à esquerda.
 */
export function Drawer() {
  const { mat } = lib();
  const scratchY = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(128, 128, paintScratchedY), { clamp: true }),
        transparent: true,
        roughness: 0.8,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    [],
  );
  const seated = useSeated();
  const [open, setOpen] = useState(false);
  const group = useRef<THREE.Group>(null!);
  useEffect(() => {
    if (!seated) setOpen(false);
  }, [seated]);
  // aberta, a câmera olha para dentro da gaveta; fechada, volta
  useEffect(() => {
    const [x, y, z] = SPOT.desk;
    useScene.getState().setGlance(open ? [x + DRAWER_X, y + DRAWER_Y - 0.04, z - 0.5] : null);
  }, [open]);
  useEffect(() => () => useScene.getState().setGlance(null), []);
  useEffect(() => {
    const tween = gsap.to(group.current.position, {
      z: open ? -DRAWER_OUT : 0,
      duration: 0.5,
      ease: 'power2.out',
    });
    return () => {
      tween.kill();
    };
  }, [open]);
  const geo = useMemo(
    () => ({
      face: box([0.44, 0.085, 0.02], [0, 0, -0.49]),
      pull: cyl(0.006, 0.006, 0.1, [0, 0, -0.505], { seg: 6, rot: [0, 0, HALF_PI] }),
      tray: merge([
        box([0.4, 0.01, 0.4], [0, -0.04, -0.28]),
        box([0.01, 0.07, 0.4], [-0.195, -0.01, -0.28]),
        box([0.01, 0.07, 0.4], [0.195, -0.01, -0.28]),
        box([0.4, 0.07, 0.01], [0, -0.01, -0.085]),
      ]),
      cash: merge([
        box([0.15, 0.022, 0.066], [-0.09, -0.024, -0.36], { rot: [0, 0.1, 0] }),
        box([0.15, 0.022, 0.066], [-0.08, -0.002, -0.35], { rot: [0, -0.06, 0] }),
      ]),
      bands: merge([
        box([0.03, 0.024, 0.068], [-0.09, -0.024, -0.36], { rot: [0, 0.1, 0] }),
        box([0.03, 0.024, 0.068], [-0.08, -0.002, -0.35], { rot: [0, -0.06, 0] }),
      ]),
      cigars: crease(box([0.14, 0.04, 0.09], [0.09, -0.015, -0.3]), 30),
      pen: cyl(0.005, 0.005, 0.13, [-0.07, -0.03, -0.45], { seg: 6, rot: [0, 0.12, HALF_PI] }),
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
        <group position={[DRAWER_X, DRAWER_Y, 0]}>
          <mesh geometry={geo.face} material={mat.mahogany} />
          <mesh geometry={geo.pull} material={mat.brass} />
          <mesh geometry={geo.tray} material={mat.mahoganyDark} />
          <mesh geometry={geo.cash} material={money} />
          <mesh geometry={geo.bands} material={band} />
          <mesh geometry={geo.cigars} material={mat.mahogany} />
          <mesh geometry={geo.pen} material={mat.brass} />
          {/* Y riscado no fundo, no canto de baixo à esquerda de quem olha de cima */}
          <mesh
            position={[0.12, -0.0345, -0.43]}
            rotation={[-HALF_PI, 0, Math.PI]}
            material={scratchY}
          >
            <planeGeometry args={[0.08, 0.08]} />
          </mesh>
        </group>
      </group>
    </Interactive>
  );
}

/** Foto de espera enquanto a foto do Raphael (public/textures/foto.webp) carrega. */
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
    // a foto do Raphael (de perfil, embaixo das árvores), recortada no rosto e
    // nos ombros e em preto e branco quente, como foto antiga de porta-retrato
    new THREE.ImageLoader().load('/textures/foto.webp', (image) => {
      const canvas = document.createElement('canvas');
      canvas.width = 360;
      canvas.height = 504;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // recorte: do alto da cabeça até a gola, com o rosto no meio
      const aspect = canvas.width / canvas.height;
      const sw = image.width * 0.8;
      const sh = sw / aspect;
      const sx = image.width - sw;
      const sy = image.height * 0.08;
      ctx.filter = 'grayscale(1) sepia(0.32) contrast(1.12) brightness(1.02)';
      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
      const fade = ctx.createRadialGradient(180, 220, 120, 180, 252, 330);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(1, 'rgba(20,12,6,0.45)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const t = new THREE.CanvasTexture(canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      m.map = t;
      m.needsUpdate = true;
    });
    return m;
  }, []);
  return (
    <>
      <group rotation={[0.18, 0, 0]} name="photo-frame">
        <mesh geometry={geo.frame} material={lacquer} />
        <mesh geometry={geo.leg} material={lacquer} />
        <mesh geometry={geo.inlay} material={mat.brass} />
        <mesh position={[0, 0.105, -0.0075]} rotation={[0, Math.PI, 0]} material={photo}>
          <planeGeometry args={[0.125, 0.175]} />
        </mesh>
      </group>
    </>
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

/**
 * Jornal da noite dobrado em cima da mesa (inventado): a primeira página
 * para cima, com a manchete, a foto granulada e as colunas de texto.
 */
export function Newspaper() {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(512, 680, paintNewspaper), { clamp: true, aniso: 8 }),
        roughness: 0.9,
      }),
    [],
  );
  const edge = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d8cfbc', roughness: 0.9 }),
    [],
  );
  const geo = useMemo(() => new THREE.BoxGeometry(0.29, 0.006, 0.385), []);
  return (
    <mesh
      geometry={geo}
      material={[edge, edge, material, edge, edge, edge]}
      position={[0, 0.003, 0]}
    />
  );
}
