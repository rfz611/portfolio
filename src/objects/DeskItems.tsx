import { useMemo } from 'react';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as THREE from 'three';
import { box, crease, lathe, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';

const HALF_PI = Math.PI / 2;

/** Teclado numérico do telefone: 12 teclas claras com números. */
function paintKeypad(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1b1b1d';
  ctx.fillRect(0, 0, w, h);
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  const kw = w / 3;
  const kh = h / 4;
  keys.forEach((k, i) => {
    const x = (i % 3) * kw;
    const y = Math.floor(i / 3) * kh;
    ctx.fillStyle = '#d9d4c8';
    ctx.fillRect(x + kw * 0.14, y + kh * 0.14, kw * 0.72, kh * 0.72);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(x + kw * 0.14, y + kh * 0.78, kw * 0.72, kh * 0.08);
    ctx.fillStyle = '#1b1b1d';
    ctx.font = `600 ${kh * 0.5}px "Manrope Variable", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(k, x + kw / 2, y + kh / 2);
  });
}

/**
 * Telefone de mesa dos anos 80: base com frente inclinada e teclado,
 * fone com as duas conchas apoiado no gancho e o fio enrolado.
 */
export function DeskPhone() {
  const geo = useMemo(() => {
    const coil: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const a = t * Math.PI * 2 * 18;
      // fio enrolado saindo da lateral da base e indo até o fone
      const x = -0.11 - t * 0.08;
      const z = 0.03 + Math.sin(t * Math.PI) * 0.09;
      coil.push(
        new THREE.Vector3(x + Math.cos(a) * 0.007, 0.02 + Math.sin(a) * 0.007 + t * 0.07, z),
      );
    }
    return {
      base: new RoundedBoxGeometry(0.2, 0.06, 0.22, 3, 0.015).translate(0, 0.03, 0),
      slope: new THREE.PlaneGeometry(0.15, 0.1).rotateX(-HALF_PI + 0.45).translate(0, 0.068, 0.055),
      handset: crease(
        merge([
          new RoundedBoxGeometry(0.21, 0.026, 0.045, 2, 0.01).translate(0, 0.098, -0.03),
          new RoundedBoxGeometry(0.055, 0.04, 0.062, 2, 0.015).translate(-0.085, 0.09, -0.03),
          new RoundedBoxGeometry(0.055, 0.04, 0.062, 2, 0.015).translate(0.085, 0.09, -0.03),
        ]),
        50,
      ),
      cradle: merge([
        box([0.03, 0.02, 0.05], [-0.085, 0.067, -0.03]),
        box([0.03, 0.02, 0.05], [0.085, 0.067, -0.03]),
      ]),
      cord: new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coil), 300, 0.0022, 4, false),
    };
  }, []);
  const plastic = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.35, envMapIntensity: 1 }),
    [],
  );
  const keypad = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(96, 128, paintKeypad), { clamp: true }),
        roughness: 0.4,
      }),
    [],
  );
  return (
    <group name="phone">
      <mesh geometry={geo.base} material={plastic} />
      <mesh geometry={geo.slope} material={keypad} />
      <mesh geometry={geo.cradle} material={plastic} />
      <mesh geometry={geo.handset} material={plastic} />
      <mesh geometry={geo.cord} material={plastic} />
    </group>
  );
}

/** Caderno de couro com elástico e páginas creme, e a caneta-tinteiro em cima. */
export function Notebook() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      cover: new RoundedBoxGeometry(0.145, 0.018, 0.21, 2, 0.004).translate(0, 0.009, 0),
      pages: box([0.138, 0.012, 0.202], [0.004, 0.009, 0]),
      band: box([0.012, 0.0195, 0.212], [0.05, 0.009, 0]),
      pen: lathe(
        [
          [0.001, 0],
          [0.004, 0.01],
          [0.0055, 0.03],
          [0.006, 0.13],
          [0.0045, 0.14],
          [0.001, 0.142],
        ],
        { seg: 10 },
      )
        .rotateX(HALF_PI)
        .rotateY(0.35)
        .translate(-0.02, 0.025, -0.06),
      clip: box([0.003, 0.002, 0.04], [0.0, 0.0315, 0.02], { rot: [0, 0.35, 0] }),
    }),
    [],
  );
  const leather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#2b1610', roughness: 0.5, envMapIntensity: 0.6 }),
    [],
  );
  const paper = useMemo(() => new THREE.MeshLambertMaterial({ color: '#e8dfc8' }), []);
  const lacquer = useMemo(
    () =>
      new THREE.MeshStandardMaterial({ color: '#0d0d10', roughness: 0.15, envMapIntensity: 1.4 }),
    [],
  );
  return (
    <group name="notebook">
      <mesh geometry={geo.cover} material={leather} />
      <mesh geometry={geo.pages} material={paper} />
      <mesh geometry={geo.band} material={lacquer} />
      <mesh geometry={geo.pen} material={lacquer} />
      <mesh geometry={geo.clip} material={mat.brass} />
    </group>
  );
}

/** Caneca com alça (a alça fica virada para quem está na mesa). */
export function Mug() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      body: lathe(
        [
          [0.001, 0],
          [0.04, 0],
          [0.042, 0.095],
          [0.038, 0.095],
          [0.036, 0.01],
        ],
        { seg: 18 },
      ),
      handle: new THREE.TorusGeometry(0.026, 0.0065, 8, 16, Math.PI)
        .rotateZ(-HALF_PI)
        .translate(0.042, 0.05, 0),
      coffee: new THREE.CircleGeometry(0.037, 16).rotateX(-HALF_PI).translate(0, 0.07, 0),
    }),
    [],
  );
  const coffee = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1a0c05', roughness: 0.1 }),
    [],
  );
  return (
    <group name="mug">
      <mesh geometry={geo.body} material={mat.ceramic} />
      <mesh geometry={geo.handle} material={mat.ceramic} />
      <mesh geometry={geo.coffee} material={coffee} />
    </group>
  );
}
