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
      {/* parede do fundo (sul): paisagem grande entre arandelas e o pôr do sol */}
      <Painting
        map={pieces.landscape}
        size={[1.7, 1.05]}
        position={[-1.2, 1.78, south]}
        rotationY={Math.PI}
      />
      <Sconce position={[-2.55, 1.85, south]} rotationY={Math.PI} />
      <Sconce position={[0.15, 1.85, south]} rotationY={Math.PI} />
      <Painting
        map={pieces.sunset}
        size={[1.1, 0.82]}
        position={[2.6, 1.78, south]}
        rotationY={Math.PI}
      />
      {/* parede esquerda (oeste): pôster perto do escritório e um quadro sobre a poltrona */}
      <Painting map={poster} size={[0.68, 1.0]} position={[west, 1.72, -3.3]} rotationY={HALF_PI} />
      <Sconce position={[west, 1.85, -2.4]} rotationY={HALF_PI} />
      <Painting
        map={pieces.landscapeSmall}
        size={[0.9, 0.62]}
        position={[west, 1.8, 3.4]}
        rotationY={HALF_PI}
      />
      {/* pontas do sofá */}
      <SideTable position={[PIT.x0 + 0.42, -PIT.depth, PIT.z0 + 0.42]} />
      <SideTable position={[PIT.x0 + 0.42, -PIT.depth, PIT.z1 - 0.42]} />
      <Throw position={[1.05, -0.03, PIT.z0 + 0.1]} rotationY={0} />
    </group>
  );
}
