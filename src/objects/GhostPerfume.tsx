import { useMemo } from 'react';
import * as THREE from 'three';
import { crease, lathe } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { Interactive } from './Interactive';

/**
 * Bloco de metal ondulado: uma caixa subdividida cuja frente e verso
 * recebem ondas verticais, como metal líquido que escorreu e endureceu.
 */
function wavyBlock(w: number, h: number, d: number, amp: number, seed: number) {
  const g = new THREE.BoxGeometry(w, h, d, 22, 26, 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    if (Math.abs(z) < d / 2 - 1e-5) continue;
    const u = x / w + 0.5;
    const v = y / h + 0.5;
    const wave =
      Math.sin(u * 13 + Math.sin(v * 6 + seed) * 1.6 + seed) * 0.6 +
      Math.sin(u * 23 + v * 4 + seed * 2) * 0.25;
    // as bordas ficam retas (onde fica o nome); o meio ondula
    const edge = Math.min(1, Math.min(u, 1 - u) * 8) * Math.min(1, Math.min(v - 0.18, 1 - v) * 10);
    p.setZ(i, z + Math.sign(z) * wave * amp * Math.max(0, edge));
  }
  g.computeVertexNormals();
  return g;
}

/** Frente do frasco: grafite escovado com reflexos de metal líquido e o nome gravado embaixo. */
function paintFront(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#8c857e');
  g.addColorStop(0.5, '#5e5852');
  g.addColorStop(1, '#3e3a36');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // escovado vertical
  for (let x = 0; x < w; x += 2) {
    ctx.fillStyle = `rgba(255,255,255,${0.03 + 0.04 * Math.abs(Math.sin(x * 0.7))})`;
    ctx.fillRect(x, 0, 1, h);
  }
  // reflexos ondulados (metal líquido)
  ctx.lineWidth = 3;
  for (let k = 0; k < 9; k++) {
    ctx.strokeStyle = k % 2 ? 'rgba(230,226,220,0.28)' : 'rgba(20,18,16,0.3)';
    ctx.beginPath();
    for (let y = 0; y <= h * 0.78; y += 4) {
      const x = (k / 8) * w + Math.sin(y * 0.05 + k) * w * 0.04;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // placa lisa embaixo com o nome gravado
  ctx.fillStyle = '#45413d';
  ctx.fillRect(w * 0.08, h * 0.8, w * 0.84, h * 0.15);
  ctx.strokeStyle = 'rgba(220,214,206,0.5)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(w * 0.08, h * 0.8, w * 0.84, h * 0.15);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e4ded6';
  ctx.font = `600 ${h * 0.07}px "Bodoni Moda", Georgia, serif`;
  ctx.fillText('GHOST', w / 2, h * 0.86);
  ctx.font = `${h * 0.03}px "Manrope Variable", sans-serif`;
  ctx.fillText('S P E C T R E', w / 2, h * 0.925);
}

/**
 * Perfume de frasco retangular de metal grafite ondulado, com uma bala
 * dourada cravada na lateral direita e a tampa quadrada ondulada com um
 * botão dourado (pedido do Raphael, a partir da foto que ele mandou).
 * Detalhes: placa com o nome gravado, aro dourado no gargalo, bala com o
 * aro da base e a espoleta, e o botão com um anel em volta.
 */
export function GhostPerfume() {
  const geo = useMemo(
    () => ({
      body: wavyBlock(0.07, 0.085, 0.03, 0.0025, 1.3).translate(0, 0.0425, 0),
      cap: wavyBlock(0.032, 0.03, 0.026, 0.0015, 4.1).translate(0, 0.104, 0),
      neck: new THREE.CylinderGeometry(0.008, 0.009, 0.01, 16).translate(0, 0.089, 0),
      collar: new THREE.TorusGeometry(0.0092, 0.0016, 8, 20)
        .rotateX(Math.PI / 2)
        .translate(0, 0.0875, 0),
      bullet: crease(
        lathe(
          [
            [0.001, 0],
            [0.0078, 0],
            [0.0078, 0.0025],
            [0.0072, 0.003],
            [0.0075, 0.019],
            [0.0068, 0.027],
            [0.0045, 0.034],
            [0.001, 0.038],
          ],
          { seg: 18 },
        ),
        35,
      )
        .rotateZ(-Math.PI / 2)
        .translate(0.02, 0.045, 0.004),
      primer: new THREE.CircleGeometry(0.0032, 14)
        .rotateY(-Math.PI / 2)
        .translate(0.0199, 0.045, 0.004),
      button: new THREE.CylinderGeometry(0.006, 0.006, 0.003, 18)
        .rotateX(Math.PI / 2)
        .translate(-0.006, 0.108, 0.0145),
      buttonRing: new THREE.TorusGeometry(0.0068, 0.0009, 6, 20).translate(-0.006, 0.108, 0.0143),
    }),
    [],
  );
  const mats = useMemo(() => {
    const metal = new THREE.MeshStandardMaterial({
      color: '#a39b93',
      metalness: 0.65,
      roughness: 0.28,
      envMapIntensity: 1.6,
    });
    const front = new THREE.MeshStandardMaterial({
      map: tex(makeCanvas(256, 320, paintFront), { clamp: true, aniso: 8 }),
      metalness: 0.55,
      roughness: 0.3,
      envMapIntensity: 1.5,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: '#e0b860',
      metalness: 0.9,
      roughness: 0.2,
      envMapIntensity: 2,
    });
    const brass = new THREE.MeshStandardMaterial({
      color: '#a8823c',
      metalness: 0.9,
      roughness: 0.35,
    });
    // faces da caixa: +x, -x, +y, -y, frente (+z), verso (-z)
    return { metal, gold, brass, body: [metal, metal, metal, metal, front, metal] };
  }, []);
  return (
    <Interactive id="perfume" label="objects.perfume">
      <group name="perfume">
        <mesh geometry={geo.body} material={mats.body} />
        <mesh geometry={geo.neck} material={mats.metal} />
        <mesh geometry={geo.collar} material={mats.gold} />
        <mesh geometry={geo.cap} material={mats.metal} />
        <mesh geometry={geo.bullet} material={mats.gold} />
        <mesh geometry={geo.primer} material={mats.brass} />
        <mesh geometry={geo.button} material={mats.gold} />
        <mesh geometry={geo.buttonRing} material={mats.gold} />
      </group>
    </Interactive>
  );
}
