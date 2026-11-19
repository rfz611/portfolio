import { useMemo } from 'react';
import * as THREE from 'three';
import { lathe, merge } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';

const HALF_PI = Math.PI / 2;

/** Folha comprida e pontuda, um pouco curvada para fora. */
function blade(height: number, width: number, lean: number, yaw: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.quadraticCurveTo(-width * 0.6, height * 0.6, 0, height);
  shape.quadraticCurveTo(width * 0.6, height * 0.6, width / 2, 0);
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape, 6);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const t = p.getY(i) / height;
    p.setZ(i, lean * t * t);
  }
  g.computeVertexNormals();
  return g.rotateY(yaw);
}

/** Folha verde-escura com as faixas claras da espada-de-são-jorge. */
function paintBlade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#1f3a1c';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 6) {
    ctx.fillStyle = y % 12 ? 'rgba(150,180,110,0.25)' : 'rgba(10,25,10,0.35)';
    ctx.fillRect(0, y, w, 3);
  }
  ctx.fillStyle = 'rgba(200,190,90,0.6)';
  ctx.fillRect(0, 0, w * 0.08, h);
  ctx.fillRect(w * 0.92, 0, w * 0.08, h);
}

/** Vaso de cerâmica preta brilhante com uma espada-de-são-jorge. */
export function SmallPlant() {
  const geo = useMemo(() => {
    const blades: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 9; k++) {
      const yaw = (k / 9) * Math.PI * 2 + (k % 2) * 0.3;
      blades.push(
        blade(0.2 + (k % 3) * 0.05, 0.04, 0.025 + (k % 2) * 0.02, yaw).translate(0, 0.1, 0),
      );
    }
    return {
      pot: lathe(
        [
          [0.001, 0],
          [0.045, 0],
          [0.06, 0.05],
          [0.058, 0.1],
          [0.05, 0.102],
          [0.05, 0.09],
        ],
        { seg: 20 },
      ),
      soil: new THREE.CircleGeometry(0.05, 16).rotateX(-HALF_PI).translate(0, 0.092, 0),
      blades: merge(blades),
    };
  }, []);
  const mats = useMemo(
    () => ({
      pot: new THREE.MeshStandardMaterial({
        color: '#141416',
        roughness: 0.18,
        envMapIntensity: 1.3,
      }),
      soil: new THREE.MeshStandardMaterial({ color: '#2a1c12', roughness: 1 }),
      leaf: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(32, 128, paintBlade)),
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
    }),
    [],
  );
  return (
    <group name="small-plant">
      <mesh geometry={geo.pot} material={mats.pot} />
      <mesh geometry={geo.soil} material={mats.soil} />
      <mesh geometry={geo.blades} material={mats.leaf} />
    </group>
  );
}

/** Folha de jiboia: coração verde com a nervura e manchas claras, fundo transparente. */
function paintIvyLeaf(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.moveTo(w / 2, h * 0.98);
  ctx.bezierCurveTo(w * 0.05, h * 0.62, w * 0.02, h * 0.18, w * 0.3, h * 0.08);
  ctx.bezierCurveTo(w * 0.42, h * 0.04, w * 0.48, h * 0.12, w / 2, h * 0.2);
  ctx.bezierCurveTo(w * 0.52, h * 0.12, w * 0.58, h * 0.04, w * 0.7, h * 0.08);
  ctx.bezierCurveTo(w * 0.98, h * 0.18, w * 0.95, h * 0.62, w / 2, h * 0.98);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#3f7a2c');
  g.addColorStop(1, '#1e4a1a');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(220,210,120,0.28)';
  for (let k = 0; k < 6; k++)
    ctx.fillRect(w * (0.2 + k * 0.1), h * (0.3 + (k % 3) * 0.15), w * 0.06, h * 0.25);
  ctx.restore();
  ctx.strokeStyle = 'rgba(190,220,140,0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, h * 0.2);
  ctx.lineTo(w / 2, h * 0.95);
  ctx.stroke();
}

/**
 * Jiboia num vaso de cerâmica creme: os galhos saem do vaso e caem pela
 * frente da caixa de som (frente = +z), com folhas de coração alternadas.
 */
export function TrailingIvy({ drop = 0.34 }: { drop?: number }) {
  const geo = useMemo(() => {
    const vines: THREE.BufferGeometry[] = [];
    const leaves: THREE.BufferGeometry[] = [];
    const paths: [number, number, number][][] = [
      [
        [-0.02, 0.1, 0.02],
        [-0.05, 0.12, 0.09],
        [-0.07, 0.04, 0.13],
        [-0.08, -drop * 0.5, 0.135],
        [-0.06, -drop, 0.13],
      ],
      [
        [0.02, 0.1, 0.03],
        [0.06, 0.11, 0.1],
        [0.08, 0.0, 0.13],
        [0.1, -drop * 0.7, 0.132],
      ],
      [
        [0.0, 0.11, -0.02],
        [0.04, 0.13, -0.07],
        [0.09, 0.08, -0.06],
        [0.12, 0.02, -0.02],
      ],
      [
        [0.0, 0.11, 0.0],
        [-0.03, 0.17, 0.02],
        [-0.06, 0.2, -0.03],
      ],
    ];
    const leaf = new THREE.PlaneGeometry(0.05, 0.055);
    paths.forEach((pts, v) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      vines.push(new THREE.TubeGeometry(curve, 16, 0.0025, 4, false));
      const count = Math.round(curve.getLength() / 0.045);
      for (let k = 1; k <= count; k++) {
        const t = k / (count + 0.5);
        const p = curve.getPointAt(t);
        const side = k % 2 ? 1 : -1;
        const g = leaf
          .clone()
          .translate(0, 0.026, 0)
          .rotateZ(side * 0.9 + (v - 1.5) * 0.15)
          .rotateY((k * 1.3 + v) % (Math.PI * 2))
          .rotateX(-0.5);
        leaves.push(g.translate(p.x, p.y, p.z));
      }
    });
    return {
      pot: lathe(
        [
          [0.001, 0],
          [0.05, 0],
          [0.062, 0.06],
          [0.066, 0.1],
          [0.058, 0.102],
          [0.056, 0.092],
        ],
        { seg: 22 },
      ),
      soil: new THREE.CircleGeometry(0.056, 16).rotateX(-HALF_PI).translate(0, 0.093, 0),
      vines: merge(vines),
      leaves: merge(leaves),
    };
  }, [drop]);
  const mats = useMemo(
    () => ({
      pot: new THREE.MeshStandardMaterial({
        color: '#d9cdb4',
        roughness: 0.35,
        envMapIntensity: 1,
      }),
      soil: new THREE.MeshStandardMaterial({ color: '#2a1c12', roughness: 1 }),
      vine: new THREE.MeshStandardMaterial({ color: '#2f5a22', roughness: 0.7 }),
      leaf: new THREE.MeshStandardMaterial({
        map: tex(makeCanvas(64, 64, paintIvyLeaf), { clamp: true }),
        transparent: true,
        alphaTest: 0.4,
        roughness: 0.5,
        side: THREE.DoubleSide,
      }),
    }),
    [],
  );
  return (
    <group name="trailing-ivy">
      <mesh geometry={geo.pot} material={mats.pot} />
      <mesh geometry={geo.soil} material={mats.soil} />
      <mesh geometry={geo.vines} material={mats.vine} />
      <mesh geometry={geo.leaves} material={mats.leaf} />
    </group>
  );
}
