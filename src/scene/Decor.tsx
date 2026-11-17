import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { PIT, ROOM } from '../config/layout';
import { palette } from '../config/palette';
import { makeCanvas, tex } from '../textures/canvas';
import { art } from '../textures/artLibrary';
import { hdr, lib } from '../textures/library';
import { paintPoster } from '../textures/art';
import { box, crease, cyl, merge } from './geo';
import { Interactive } from '../objects/Interactive';
import { coverUrl, DEFAULT_TRACK } from '../content/tracks';

const HALF_PI = Math.PI / 2;

type V3 = [number, number, number];

/** Quadro com moldura dourada em relevo, pendurado na parede. */
function Painting({
  map,
  size,
  position,
  rotationY,
}: {
  map: THREE.Texture;
  size: [number, number];
  position: V3;
  rotationY: number;
}) {
  const { mat } = lib();
  const [w, h] = size;
  const geo = useMemo(() => {
    const t = 0.07;
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
  }, [w, h]);
  const canvas = useMemo(
    () => new THREE.MeshStandardMaterial({ map, roughness: 0.55, envMapIntensity: 0.3 }),
    [map],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh geometry={geo.frame} material={mat.brass} />
      <mesh geometry={geo.inner} material={mat.mahoganyDark} />
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

/** Manta dobrada largada sobre o encosto do sofá. */
function Throw({ position, rotationY }: { position: V3; rotationY: number }) {
  const geo = useMemo(
    () =>
      crease(
        merge([
          box([0.7, 0.03, 0.34], [0, 0, 0.0]),
          box([0.7, 0.36, 0.03], [0, -0.17, 0.17], { rot: [0.12, 0, 0] }),
        ]),
        40,
      ),
    [],
  );
  const material = useMemo(() => new THREE.MeshLambertMaterial({ color: '#cdbb98' }), []);
  return (
    <mesh geometry={geo} material={material} position={position} rotation={[0, rotationY, 0.04]} />
  );
}

/** Quadros, pôster, arandelas, mesinhas e a manta: o que dá vida às paredes e ao sofá. */
export function Decor() {
  const { t } = useTranslation();
  const posterTitle = t('decor.posterTitle');
  const posterTagline = t('decor.posterTagline');
  const poster = useMemo(
    () =>
      tex(
        makeCanvas(256, 384, (c, w, h) => paintPoster(c, w, h, posterTitle, posterTagline)),
        { clamp: true },
      ),
    [posterTitle, posterTagline],
  );
  const pieces = art();
  const south = ROOM.z1 - 0.02;
  const west = ROOM.x0 + 0.02;
  return (
    <group name="decor">
      {/* parede do fundo (sul): paisagem entre arandelas e o pôster de filme */}
      <Painting
        map={pieces.landscape}
        size={[1.7, 1.05]}
        position={[-1.2, 1.78, south]}
        rotationY={Math.PI}
      />
      <Sconce position={[-2.55, 1.85, south]} rotationY={Math.PI} />
      <Sconce position={[0.15, 1.85, south]} rotationY={Math.PI} />
      <Interactive id="poster" label="objects.poster">
        <Painting
          map={poster}
          size={[0.72, 1.06]}
          position={[2.6, 1.75, south]}
          rotationY={Math.PI}
        />
      </Interactive>
      {/* parede esquerda (oeste): disco emoldurado à direita de quem está no sofá
          e "A Noite Estrelada" grande à esquerda */}
      <FramedRecord position={[west, 1.72, -3.2]} rotationY={HALF_PI} />
      <Sconce position={[west, 1.85, -2.25]} rotationY={HALF_PI} />
      <Interactive id="starry" label="objects.starry">
        <Painting
          map={pieces.starry}
          size={[1.4, 1.1]}
          position={[west, 1.78, 3.35]}
          rotationY={HALF_PI}
        />
      </Interactive>
      {/* pontas do sofá */}
      <SideTable position={[PIT.x0 + 0.42, -PIT.depth, PIT.z0 + 0.42]} />
      <SideTable position={[PIT.x0 + 0.42, -PIT.depth, PIT.z1 - 0.42]} />
      <Throw position={[1.05, -0.03, PIT.z0 + 0.1]} rotationY={0} />
    </group>
  );
}

/**
 * Disco emoldurado (como os discos de ouro em estúdio): caixa de mogno
 * com fundo de veludo escuro, a capa de "Raining but It's Ok" e o vinil
 * vermelho saindo dela, com uma plaquinha de latão.
 */
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
    new THREE.TextureLoader().load(coverUrl(DEFAULT_TRACK), (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      m.map = t;
      m.color.set('#ffffff');
      m.needsUpdate = true;
    });
    return m;
  }, []);
  const velvet = useMemo(() => new THREE.MeshLambertMaterial({ color: '#120a0c' }), []);
  return (
    <Interactive id="framed-record" label="objects.framedRecord">
      <group position={position} rotation={[0, rotationY, 0]}>
        <mesh geometry={geo.frame} material={mat.mahogany} />
        <mesh position={[0, 0, 0.008]} material={velvet}>
          <planeGeometry args={[w, h]} />
        </mesh>
        <mesh geometry={geo.disc} material={mat.vinylRed} position={[0.12, 0.02, 0.014]} />
        <mesh geometry={geo.label} material={mat.labelCream} position={[0.12, 0.02, 0.0145]} />
        <mesh position={[-0.13, 0.02, 0.018]} material={cover}>
          <planeGeometry args={[0.34, 0.34]} />
        </mesh>
        <mesh geometry={geo.plaque} material={mat.brass} />
        {/* vidro da moldura */}
        <mesh position={[0, 0, 0.066]} material={mat.clearGlass} renderOrder={6}>
          <planeGeometry args={[w, h]} />
        </mesh>
      </group>
    </Interactive>
  );
}
