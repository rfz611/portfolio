import { useEffect, useMemo, useState } from 'react';
import { playClick } from '../audio/player';
import * as THREE from 'three';
import { PIT, ROOM } from '../config/layout';
import { palette } from '../config/palette';
import { makeCanvas, tex } from '../textures/canvas';
import { art } from '../textures/artLibrary';
import { hdr, lib } from '../textures/library';
import { box, crease, cyl, merge } from './geo';
import { Interactive } from '../objects/Interactive';
import { coverUrl } from '../content/tracks';

const HALF_PI = Math.PI / 2;

type V3 = [number, number, number];

/** Quadro com moldura dourada em relevo, pendurado na parede. */
function Painting({
  map,
  size,
  position,
  rotationY,
  frame = 'gold',
}: {
  map: THREE.Texture;
  size: [number, number];
  position: V3;
  rotationY: number;
  frame?: 'gold' | 'wood';
}) {
  const { mat } = lib();
  const [w, h] = size;
  const geo = useMemo(() => {
    const t = frame === 'wood' ? 0.1 : 0.07;
    return {
      frame: crease(
        merge([
          box([w + t * 2, t, 0.05], [0, h / 2 + t / 2, 0.025]),
          box([w + t * 2, t, 0.05], [0, -h / 2 - t / 2, 0.025]),
          box([t, h, 0.05], [-w / 2 - t / 2, 0, 0.025]),
          box([t, h, 0.05], [w / 2 + t / 2, 0, 0.025]),
        ]),
        30,
      ),
      inner: merge([
        box([w + 0.02, 0.012, 0.02], [0, h / 2 + 0.006, 0.04]),
        box([w + 0.02, 0.012, 0.02], [0, -h / 2 - 0.006, 0.04]),
        box([0.012, h, 0.02], [-w / 2 - 0.006, 0, 0.04]),
        box([0.012, h, 0.02], [w / 2 + 0.006, 0, 0.04]),
      ]),
    };
  }, [w, h, frame]);
  const canvas = useMemo(
    () => new THREE.MeshStandardMaterial({ map, roughness: 0.55, envMapIntensity: 0.3 }),
    [map],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.frame} material={frame === 'wood' ? mat.mahoganyDark : mat.brass} />
      <mesh geometry={geo.inner} material={frame === 'wood' ? mat.brass : mat.mahoganyDark} />
      <mesh position={[0, 0, 0.012]} material={canvas}>
        <planeGeometry args={[w, h]} />
      </mesh>
      {/* sombra "assada" do quadro na parede */}
      <mesh position={[0.03, -0.05, 0.003]} material={mat.shadow} scale={[1, 1, 1]}>
        <planeGeometry args={[w + 0.45, h + 0.45]} />
      </mesh>
    </group>
  );
}

/** Arandela de latão com cúpula de meia-cana acesa (luz baixa, sem estourar). */
function Sconce({ position, rotationY }: { position: V3; rotationY: number }) {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      plate: crease(box([0.1, 0.22, 0.02], [0, 0, 0.01]), 30),
      arm: cyl(0.008, 0.008, 0.12, [0, -0.02, 0.07], { seg: 6, rot: [HALF_PI, 0, 0] }),
      shade: new THREE.CylinderGeometry(0.11, 0.08, 0.16, 16, 1, true, -HALF_PI, Math.PI).translate(
        0,
        0.06,
        0.12,
      ),
    }),
    [],
  );
  const glow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: mat.lampShade.map,
        color: hdr(palette.amber, 1.15),
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [mat],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.plate} material={mat.brass} />
      <mesh geometry={geo.arm} material={mat.brass} />
      <mesh geometry={geo.shade} material={glow} />
      <pointLight
        position={[0, 0.05, 0.2]}
        color={palette.amber}
        intensity={2}
        distance={3.2}
        decay={1.7}
      />
    </group>
  );
}

/** Mesinha lateral redonda de latão e vidro (fica nas pontas do sofá). */
function SideTable({ position }: { position: V3 }) {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      top: cyl(0.24, 0.24, 0.02, [0, 0.5, 0], { seg: 24 }),
      frame: merge([
        cyl(0.245, 0.245, 0.015, [0, 0.5, 0], { seg: 24, open: true }),
        cyl(0.02, 0.02, 0.49, [0, 0.25, 0], { seg: 8 }),
        cyl(0.17, 0.19, 0.02, [0, 0.01, 0], { seg: 20 }),
      ]),
      book: box([0.17, 0.035, 0.23], [0.03, 0.528, -0.03], { rot: [0, 0.3, 0] }),
    }),
    [],
  );
  return (
    <group position={position}>
      <mesh geometry={geo.frame} material={mat.brass} />
      <mesh geometry={geo.top} material={mat.smokedGlass} renderOrder={4} />
      <mesh geometry={geo.book} material={mat.leatherWine} />
    </group>
  );
}

/**
 * Luminária de quadro de latão (barra com cúpula comprida) presa em cima da
 * moldura, com um spot quente estreito apontado para a pintura.
 */
function PictureLight({ width, height, on }: { width: number; height: number; on: boolean }) {
  const { mat } = lib();
  const light = useMemo(() => new THREE.SpotLight(), []);
  const geo = useMemo(
    () => ({
      arm: box([0.025, 0.025, 0.2], [0, height / 2 + 0.12, 0.1]),
      hood: new THREE.CylinderGeometry(0.035, 0.035, width * 0.55, 14, 1, false, 0, Math.PI)
        .rotateZ(Math.PI / 2)
        .rotateX(-0.6)
        .translate(0, height / 2 + 0.12, 0.2),
      glow: box([width * 0.52, 0.008, 0.02], [0, height / 2 + 0.1, 0.205]),
    }),
    [width, height],
  );
  const glow = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr('#ffd9a0', 1.3), toneMapped: false }),
    [],
  );
  useEffect(() => {
    glow.color.copy(on ? hdr('#ffd9a0', 1.3) : new THREE.Color('#2a2016'));
  }, [on, glow]);
  return (
    <group>
      <mesh geometry={geo.arm} material={mat.brass} />
      <mesh geometry={geo.hood} material={mat.brass} />
      <mesh geometry={geo.glow} material={glow} />
      <primitive
        object={light}
        position={[0, height / 2 + 0.1, 0.32]}
        color="#ffd2a0"
        intensity={on ? 12 : 0}
        angle={0.62}
        penumbra={0.8}
        distance={3}
        decay={1.6}
      />
      <primitive object={light.target} position={[0, -0.05, 0]} />
    </group>
  );
}

/**
 * Quadro com luminária própria: clicar na pintura acende ou apaga a luz
 * de quadro (começa acesa, para dar para ver a obra no escuro da sala).
 */
function LitPainting({
  id,
  label,
  map,
  size,
  position,
  rotationY,
  frame,
}: {
  id: string;
  label: string;
  map: THREE.Texture;
  size: [number, number];
  position: V3;
  rotationY: number;
  frame?: 'gold' | 'wood';
}) {
  const [on, setOn] = useState(true);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Interactive
        id={id}
        label={label}
        onClick={() => {
          playClick();
          setOn((v) => !v);
        }}
      >
        <Painting map={map} size={size} position={[0, 0, 0]} rotationY={0} frame={frame} />
      </Interactive>
      <PictureLight width={size[0]} height={size[1]} on={on} />
    </group>
  );
}

/** Quadros, pôster, arandelas, mesinhas e a manta: o que dá vida às paredes e ao sofá. */
export function Decor() {
  const pieces = art();
  const south = ROOM.z1 - 0.02;
  const west = ROOM.x0 + 0.02;
  return (
    <group name="decor">
      {/* parede do fundo (sul), de frente para quem senta à escrivaninha:
          três quadros de filmes favoritos entre as arandelas e a paisagem à direita */}
      {/* Rembrandt largo entre as arandelas, moldura pesada de madeira e luz de quadro */}
      <LitPainting
        id="storm"
        label="objects.storm"
        map={pieces.storm}
        size={[1.95, 1.1]}
        position={[-1.2, 1.78, south]}
        rotationY={Math.PI}
        frame="wood"
      />
      <Sconce position={[-2.55, 1.85, south]} rotationY={Math.PI} />
      <Sconce position={[0.15, 1.85, south]} rotationY={Math.PI} />
      {/* parede esquerda (oeste): disco emoldurado à direita de quem está no sofá
          e o Caravaggio grande à esquerda */}
      <FramedRecord position={[west, 1.72, -3.2]} rotationY={HALF_PI} />
      <Sconce position={[west, 1.85, -2.25]} rotationY={HALF_PI} />
      {/* Caravaggio grande na parede à esquerda da TV, com luz de quadro (clique acende/apaga) */}
      <LitPainting
        id="nativity"
        label="objects.nativity"
        map={pieces.nativity}
        size={[1.02, 1.4]}
        position={[west, 1.8, 3.1]}
        rotationY={HALF_PI}
      />
      {/* pontas do sofá */}
      <SideTable position={[PIT.x0 + 0.42, -PIT.depth, PIT.z0 + 0.42]} />
      <SideTable position={[PIT.x0 + 0.42, -PIT.depth, PIT.z1 - 0.42]} />
    </group>
  );
}

/**
 * Disco de platina emoldurado, como os de estúdio: "Pearls", da Sade,
 * com a capa, o disco prateado brilhante e a plaquinha gravada.
 */
const PLATINUM_TRACK = 'pearls';

/** Plaquinha de latão gravada do disco de platina. */
function paintPlaque(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#b8893a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a1a08';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'italic 600 22px "Bodoni Moda", serif';
  ctx.fillText('Sade · Pearls', w / 2, h * 0.42);
  ctx.font = '700 9px "Manrope Variable", sans-serif';
  ctx.fillText('DISCO DE PLATINA', w / 2, h * 0.8);
}

function FramedRecord({ position, rotationY }: { position: V3; rotationY: number }) {
  const { mat } = lib();
  const w = 0.92;
  const h = 0.56;
  const geo = useMemo(
    () => ({
      frame: crease(
        merge([
          box([w + 0.1, 0.05, 0.07], [0, h / 2 + 0.025, 0.035]),
          box([w + 0.1, 0.05, 0.07], [0, -h / 2 - 0.025, 0.035]),
          box([0.05, h, 0.07], [-w / 2 - 0.025, 0, 0.035]),
          box([0.05, h, 0.07], [w / 2 + 0.025, 0, 0.035]),
        ]),
        30,
      ),
      disc: new THREE.CircleGeometry(0.17, 32),
      label: new THREE.CircleGeometry(0.058, 24),
      plaque: box([0.18, 0.035, 0.006], [0, -h / 2 + 0.05, 0.02]),
    }),
    [],
  );
  const cover = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#333', roughness: 0.6 });
    new THREE.TextureLoader().load(coverUrl(PLATINUM_TRACK), (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      m.map = t;
      m.color.set('#ffffff');
      m.needsUpdate = true;
    });
    return m;
  }, []);
  const velvet = useMemo(() => new THREE.MeshLambertMaterial({ color: '#120a0c' }), []);
  const platinum = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e8eaee',
        metalness: 1,
        roughness: 0.12,
        envMapIntensity: 2.2,
      }),
    [],
  );
  const plaque = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(256, 48, paintPlaque), { clamp: true }),
        metalness: 0.8,
        roughness: 0.3,
        envMapIntensity: 1.4,
      }),
    [],
  );
  return (
    <Interactive id="framed-record" label="objects.framedRecord">
      <group position={position} rotation={[0, rotationY, 0]}>
        <mesh geometry={geo.frame} material={mat.mahogany} />
        <mesh position={[0, 0, 0.008]} material={velvet}>
          <planeGeometry args={[w, h]} />
        </mesh>
        <mesh geometry={geo.disc} material={platinum} position={[0.12, 0.02, 0.014]} />
        <mesh geometry={geo.label} material={mat.labelCream} position={[0.12, 0.02, 0.0145]} />
        <mesh position={[-0.13, 0.02, 0.018]} material={cover}>
          <planeGeometry args={[0.34, 0.34]} />
        </mesh>
        <mesh geometry={geo.plaque} material={plaque} />
        {/* vidro da moldura */}
        <mesh position={[0, 0, 0.066]} material={mat.clearGlass} renderOrder={6}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
    </Interactive>
  );
}
