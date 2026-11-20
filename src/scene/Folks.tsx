import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { makeCanvas, tex } from '../textures/canvas';
import {
  paintFks,
  paintFolksSign,
  paintPavers,
  paintPubInside,
  paintStoneWall,
  paintWindowStrip,
} from '../textures/folks';
import { hdr } from '../textures/library';
import { FOLKS, GROUND_Y } from './cityLayout';
import { box, cyl, merge } from './geo';

/** Halo redondo somado à cena (luz que a rua não tem de verdade). */
function glowMaterial(color: string, strength: number) {
  const map = tex(
    makeCanvas(64, 64, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
    }),
    { clamp: true },
  );
  return new THREE.MeshBasicMaterial({
    map,
    color: hdr(color, strength),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

/**
 * Folks Pub Sertanejo, no chão da rua da esquerda (como o de Curitiba): o
 * bar com a fachada de pedra e o letreiro oval aceso por trás, a faixa de
 * janelinhas e a porta com o lustre, o pátio de bloquete com a fonte de três
 * andares iluminada de azul, o painel de pedra com FKS, as tendas brancas e
 * as plantas com luz de baixo. Tudo sem luz de verdade: o brilho vem pintado
 * nas texturas e em halos somados (a cidade inteira é assim, para ficar leve).
 */
export function Folks() {
  const [W, D] = FOLKS.size;
  const geo = useMemo(() => {
    const tent = (x: number, z: number, s: number) =>
      merge([
        new THREE.ConeGeometry(s * 0.75, s * 0.45, 4, 1, true)
          .rotateY(Math.PI / 4)
          .translate(x, 2.6 + s * 0.22, z),
        ...[
          [-1, -1],
          [1, -1],
          [-1, 1],
          [1, 1],
        ].map(([a, b]) =>
          cyl(0.06, 0.06, 2.6, [x + (a * s) / 2, 1.3, z + (b * s) / 2], { seg: 5 }),
        ),
      ]);
    return {
      plaza: new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2).translate(0, 0.08, 0),
      // o bar: caixa escura no fundo do lote, com a fachada de pedra na frente
      building: box([W, 9, 8], [0, 4.5, -D / 2 + 4]),
      facade: new THREE.PlaneGeometry(15, 9).translate(1.5, 4.5, -D / 2 + 8.03),
      sign: new THREE.PlaneGeometry(9.5, 5.4).translate(1.5, 6.4, -D / 2 + 8.1),
      strip: new THREE.PlaneGeometry(9, 1.3).translate(1.5, 3.25, -D / 2 + 8.08),
      door: new THREE.PlaneGeometry(6.5, 2.5).translate(1.5, 1.3, -D / 2 + 8.08),
      // painel de pedra solto no pátio, com FKS
      fksWall: box([7.5, 4.6, 0.7], [-8.5, 2.3, -1.5], { rot: [0, 0.35, 0] }),
      fksFront: new THREE.PlaneGeometry(7.5, 4.6)
        .rotateY(0.35)
        .translate(-8.5 + Math.sin(0.35) * 0.36, 2.3, -1.5 + Math.cos(0.35) * 0.36),
      fks: new THREE.PlaneGeometry(5.5, 2.4)
        .rotateY(0.35)
        .translate(-8.5 + Math.sin(0.35) * 0.4, 2.6, -1.5 + Math.cos(0.35) * 0.4),
      // fonte de três andares
      fountainStone: merge([
        cyl(3.1, 3.2, 0.7, [3, 0.35, 5], { seg: 28 }),
        cyl(0.35, 0.5, 1.6, [3, 1.2, 5], { seg: 10 }),
        cyl(1.5, 0.4, 0.35, [3, 2.05, 5], { seg: 20 }),
        cyl(0.22, 0.3, 0.9, [3, 2.6, 5], { seg: 8 }),
        cyl(0.9, 0.25, 0.25, [3, 3.1, 5], { seg: 16 }),
        cyl(0.12, 0.16, 0.7, [3, 3.5, 5], { seg: 8 }),
      ]),
      water: merge([
        cyl(2.85, 2.85, 0.05, [3, 0.62, 5], { seg: 28 }),
        cyl(1.35, 1.35, 0.04, [3, 2.2, 5], { seg: 20 }),
        cyl(0.8, 0.8, 0.04, [3, 3.2, 5], { seg: 16 }),
        // a água caindo de um andar para o outro
        cyl(1.42, 2.6, 1.5, [3, 1.4, 5], { seg: 20, open: true }),
        cyl(0.85, 1.3, 0.9, [3, 2.7, 5], { seg: 16, open: true }),
      ]),
      tents: merge([tent(-9, 9, 5), tent(10.5, -2, 4.5)]),
      // plantas pontudas encostadas na fachada e no painel
      plants: merge(
        [
          [-5, -D / 2 + 9],
          [-2, -D / 2 + 9.2],
          [6, -D / 2 + 9.1],
          [9, -D / 2 + 9],
          [-11.5, 0.5],
          [-6, -3.5],
        ].flatMap(([x, z]) =>
          [0, 1, 2, 3, 4].map((k) =>
            new THREE.ConeGeometry(0.12, 1.4 + (k % 3) * 0.3, 4)
              .rotateZ(((k - 2) * 0.35) as number)
              .translate(x + (k - 2) * 0.18, 0.75, z),
          ),
        ),
      ),
      // mesinhas e bancos no pátio
      tables: merge(
        [
          [-3, 7],
          [8, 7],
          [-4, 1.5],
          [9, 3],
        ].flatMap(([x, z]) => [
          cyl(0.6, 0.6, 0.06, [x, 1.05, z], { seg: 12 }),
          cyl(0.06, 0.06, 1.05, [x, 0.52, z], { seg: 6 }),
        ]),
      ),
    };
  }, [W, D]);

  const mats = useMemo(() => {
    const basic = (map: THREE.Texture, k = 1, extra: THREE.MeshBasicMaterialParameters = {}) =>
      new THREE.MeshBasicMaterial({ map, color: hdr('#ffffff', k), toneMapped: false, ...extra });
    return {
      plaza: basic(tex(makeCanvas(512, 512, paintPavers), { clamp: true }), 2.4),
      building: new THREE.MeshBasicMaterial({ color: '#0d0a0a' }),
      facade: basic(tex(makeCanvas(512, 320, (c, w, h) => paintStoneWall(c, w, h, 41, 0.3))), 1.3),
      fksWall: basic(
        tex(makeCanvas(256, 160, (c, w, h) => paintStoneWall(c, w, h, 42, 0.45))),
        1.4,
      ),
      sign: basic(tex(makeCanvas(512, 292, paintFolksSign), { clamp: true }), 1.8, {
        transparent: true,
        depthWrite: false,
      }),
      fks: basic(tex(makeCanvas(256, 112, paintFks), { clamp: true }), 1.8, {
        transparent: true,
        depthWrite: false,
      }),
      strip: basic(tex(makeCanvas(256, 40, paintWindowStrip), { clamp: true }), 1.6),
      door: basic(tex(makeCanvas(256, 100, paintPubInside), { clamp: true }), 1.6),
      stone: new THREE.MeshBasicMaterial({ color: hdr('#8a7a68', 0.9) }),
      water: new THREE.MeshBasicMaterial({
        color: hdr('#5fe0ff', 2.2),
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
      tents: new THREE.MeshBasicMaterial({
        color: hdr('#f1ece4', 1.15),
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
      plants: new THREE.MeshBasicMaterial({ color: hdr('#d8b46a', 1.2), toneMapped: false }),
      tables: new THREE.MeshBasicMaterial({ color: '#3a2a20' }),
      glowWarm: glowMaterial('#ffb35c', 1.4),
      glowBlue: glowMaterial('#4fd2ff', 1.6),
    };
  }, []);

  // a água da fonte pulsa de leve, como se corresse
  const water = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!water.current) return;
    const m = water.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.75 + 0.12 * Math.sin(clock.elapsedTime * 3.1);
  });

  const [x, z] = FOLKS.at;
  const glow = (pos: [number, number, number], size: number, material: THREE.Material) => (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
  return (
    <group
      name="folks"
      position={[x, GROUND_Y, z]}
      rotation={[0, FOLKS.yaw, 0]}
      scale={FOLKS.scale}
    >
      <mesh geometry={geo.plaza} material={mats.plaza} renderOrder={-3} />
      <mesh geometry={geo.building} material={mats.building} />
      <mesh geometry={geo.facade} material={mats.facade} />
      <mesh geometry={geo.strip} material={mats.strip} />
      <mesh geometry={geo.door} material={mats.door} />
      <mesh geometry={geo.sign} material={mats.sign} />
      <mesh geometry={geo.fksWall} material={mats.building} />
      <mesh geometry={geo.fksFront} material={mats.fksWall} />
      <mesh geometry={geo.fks} material={mats.fks} />
      <mesh geometry={geo.fountainStone} material={mats.stone} />
      <mesh ref={water} geometry={geo.water} material={mats.water} />
      <mesh geometry={geo.tents} material={mats.tents} />
      <mesh geometry={geo.plants} material={mats.plants} />
      <mesh geometry={geo.tables} material={mats.tables} />
      {/* halos: a fonte azul no chão e a luz quente na frente do bar */}
      {glow([3, 0.12, 5], 14, mats.glowBlue)}
      {glow([1.5, 0.12, -D / 2 + 10], 18, mats.glowWarm)}
      {glow([-8, 0.12, 0], 9, mats.glowWarm)}
    </group>
  );
}
