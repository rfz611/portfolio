import { useMemo } from 'react';
import * as THREE from 'three';
import { merge } from '../../scene/geo';
import { makeCanvas, tex } from '../../textures/canvas';
import {
  paintBodyDetail,
  paintDashPlastic,
  paintDoorCard,
  paintEvoHeadlight,
  paintGauges,
  paintGrille,
  paintIntercooler,
  paintLouvers,
  paintRadiator,
  paintRim,
  paintSeatFabric,
  paintShieldGrille,
  paintTaillight,
  paintTireSide,
  paintValveCover,
} from '../../textures/car';

/** Cor da lataria: amarelo metálico do sedã da referência. Trocar aqui muda o carro inteiro. */
export const CAR_COLOR = '#e3aa1a';

/** Une peças com e sem índice (as vincadas com crease() vêm sem índice). */
export const join = (parts: THREE.BufferGeometry[]) =>
  merge(parts.map((g) => (g.index ? g.toNonIndexed() : g)));

type Painter = (c: CanvasRenderingContext2D, w: number, h: number) => void;
const t = (w: number, h: number, paint: Painter, repeat?: [number, number]) =>
  tex(makeCanvas(w, h, paint), { clamp: !repeat, aniso: 8, repeat });

export function useCarMaterials() {
  return useMemo(() => {
    const std = (o: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(o);
    const headMap = t(256, 96, paintEvoHeadlight);
    const tailMap = t(256, 64, paintTaillight);
    return {
      paint: new THREE.MeshPhysicalMaterial({
        color: CAR_COLOR,
        map: t(2048, 512, paintBodyDetail),
        metalness: 0.45,
        roughness: 0.32,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 1.6,
      }),
      // cofre do motor e o lado de dentro da lataria
      paintInner: std({ color: '#2a2a2e', roughness: 0.9, side: THREE.BackSide }),
      bayPaint: std({ color: '#b98a16', roughness: 0.5, metalness: 0.35, envMapIntensity: 1 }),
      glass: std({
        color: '#0a0f16',
        roughness: 0.03,
        metalness: 0.45,
        transparent: true,
        opacity: 0.74,
        side: THREE.DoubleSide,
        envMapIntensity: 2.2,
        depthWrite: false,
      }),
      trim: std({ color: '#0b0b0d', roughness: 0.25, metalness: 0.2, envMapIntensity: 1.2 }),
      matte: std({ color: '#0d0d10', roughness: 0.85, envMapIntensity: 0.2 }),
      rim: std({
        map: t(256, 256, paintRim),
        transparent: true,
        alphaTest: 0.4,
        metalness: 0.4,
        roughness: 0.3,
        envMapIntensity: 1.8,
        side: THREE.DoubleSide,
      }),
      tireSide: std({ map: t(128, 128, paintTireSide), roughness: 0.9 }),
      rubber: std({ color: '#0b0b0c', roughness: 0.92 }),
      disc: std({ color: '#55585e', roughness: 0.4, metalness: 0.9 }),
      caliper: std({ color: '#b3121a', roughness: 0.35, metalness: 0.3 }),
      grille: std({
        map: t(256, 96, paintShieldGrille),
        transparent: true,
        alphaTest: 0.3,
        roughness: 0.6,
      }),
      mesh: std({ map: t(256, 64, paintGrille), roughness: 0.6 }),
      intercooler: std({ map: t(256, 64, paintIntercooler), roughness: 0.4, metalness: 0.7 }),
      louvers: std({ map: t(128, 64, paintLouvers), roughness: 0.6 }),
      headlight: std({
        map: headMap,
        emissive: '#ffffff',
        emissiveMap: headMap,
        emissiveIntensity: 0.05,
        transparent: true,
        alphaTest: 0.3,
        roughness: 0.08,
        metalness: 0.4,
      }),
      taillight: std({
        map: tailMap,
        emissive: '#ffffff',
        emissiveMap: tailMap,
        emissiveIntensity: 1.0,
        roughness: 0.12,
      }),
      fog: std({
        color: '#8f98a2',
        emissive: '#fff1d6',
        emissiveIntensity: 0.1,
        roughness: 0.1,
        metalness: 0.6,
      }),
      chrome: std({ color: '#d7dbe2', roughness: 0.12, metalness: 1, envMapIntensity: 1.6 }),
      carbon: std({ color: '#141518', roughness: 0.28, metalness: 0.4, envMapIntensity: 1.3 }),
      // interior
      seat: std({ map: t(128, 256, paintSeatFabric), roughness: 0.85 }),
      dash: std({
        map: t(256, 256, paintDashPlastic, [3, 3]),
        color: '#7a7a80',
        roughness: 0.8,
        envMapIntensity: 0.15,
      }),
      doorCard: std({ map: t(256, 128, paintDoorCard), roughness: 0.75, side: THREE.DoubleSide }),
      carpet: std({ color: '#0c0b0d', roughness: 1 }),
      leather: std({ color: '#131214', roughness: 0.55, envMapIntensity: 0.5 }),
      gauges: new THREE.MeshBasicMaterial({ map: t(256, 96, paintGauges), toneMapped: false }),
      // motor
      radiator: std({ map: t(128, 128, paintRadiator), roughness: 0.5, metalness: 0.6 }),
      valve: std({ map: t(256, 128, paintValveCover), roughness: 0.55 }),
      alu: std({ color: '#9aa0a8', roughness: 0.35, metalness: 0.9, envMapIntensity: 1.3 }),
      castIron: std({ color: '#2b2d31', roughness: 0.55, metalness: 0.7, envMapIntensity: 1 }),
      hose: std({ color: '#121214', roughness: 0.7 }),
      blueHose: std({ color: '#1f3fa8', roughness: 0.5 }),
      redCable: std({ color: '#b51a1a', roughness: 0.5 }),
      battery: std({ color: '#17181b', roughness: 0.5 }),
      batteryTop: std({ color: '#d9d4c8', roughness: 0.6 }),
      fluid: std({ color: '#e8e2cf', roughness: 0.3, transparent: true, opacity: 0.85 }),
    };
  }, []);
}

export type CarMats = ReturnType<typeof useCarMaterials>;
