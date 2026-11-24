import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { paintDeskClockDial } from '../textures/clock';
import { lib } from '../textures/library';

/** Medidas do relógio (m): caixa de 0,16 × 0,17 com 0,055 de fundo, mostrador de 0,12. */
const W = 0.16;
const H = 0.17;
const D = 0.055;
const R = 0.06;
const BASE = 0.012;

/**
 * Relógio de mesa comum, no mogno da própria mesa: caixa de madeira com
 * os cantos arredondados sobre uma base, aro fino de latão e mostrador
 * marfim com números e ponteiros pretos, marcando a hora real de quem visita.
 */
export function Clock() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      case: new RoundedBoxGeometry(W, H, D, 4, 0.018),
      base: box([W + 0.02, BASE, D + 0.014], [0, -H / 2 - BASE / 2, 0]),
      bezel: new THREE.TorusGeometry(R + 0.003, 0.0045, 8, 40).translate(0, 0.008, D / 2 + 0.001),
      face: new THREE.CircleGeometry(R, 40).translate(0, 0.008, D / 2 + 0.0005),
      glass: new THREE.CircleGeometry(R, 40).translate(0, 0.008, D / 2 + 0.004),
    }),
    [],
  );

  // mostrador redesenhado a cada minuto (hora real de quem visita)
  const dial = useMemo(() => {
    const canvas = makeCanvas(256, 256, (c, w, h) => paintDeskClockDial(c, w, h, new Date()));
    return { canvas, texture: tex(canvas, { clamp: true }) };
  }, []);
  const minute = useRef(-1);
  useFrame(() => {
    const now = new Date();
    if (now.getMinutes() === minute.current) return;
    minute.current = now.getMinutes();
    const ctx = dial.canvas.getContext('2d');
    if (!ctx) return;
    paintDeskClockDial(ctx, dial.canvas.width, dial.canvas.height, now);
    dial.texture.needsUpdate = true;
  });

  const mats = useMemo(
    () => ({
      dial: new THREE.MeshStandardMaterial({
        map: dial.texture,
        roughness: 0.55,
        envMapIntensity: 0.4,
        emissive: '#ffffff',
        emissiveMap: dial.texture,
        emissiveIntensity: 0.08,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.07,
        roughness: 0.02,
        metalness: 0.4,
        envMapIntensity: 2,
        depthWrite: false,
      }),
    }),
    [dial],
  );

  return (
    <>
      <group name="clock" rotation={[0, -0.12, 0]}>
        <group position={[0, BASE + H / 2, 0]}>
          <mesh geometry={geo.case} material={mat.mahogany} />
          <mesh geometry={geo.base} material={mat.mahoganyDark} />
          <mesh geometry={geo.bezel} material={mat.brass} />
          <mesh geometry={geo.face} material={mats.dial} />
          <mesh geometry={geo.glass} material={mats.glass} renderOrder={3} />
        </group>
      </group>
    </>
  );
}
