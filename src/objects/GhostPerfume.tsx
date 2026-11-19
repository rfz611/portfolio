import { useMemo } from 'react';
import * as THREE from 'three';
import { crease, lathe } from '../scene/geo';
import { makeCanvas, tex } from '../textures/canvas';
import { Interactive } from './Interactive';

/** Medidas do frasco (m), como na foto: mais alto que largo. */
const W = 0.074;
const H = 0.084;
const D = 0.032;
/** Onde a bala atravessa a lateral direita (em fração da largura e da altura). */
const BULLET_U = 0.93;
const BULLET_V = 0.46;
/** x da base da bala (uns 9 mm para fora da lateral) e quanto ela sai pela frente. */
const BULLET_BASE = W / 2 + 0.009;
const BULLET_Z = 0.011;

/**
 * Bloco de metal drapeado: frente e verso com dobras verticais que se
 * juntam e se torcem em direção à bala, e a borda chanfrada (as quinas
 * entram um pouco), como o frasco da foto.
 */
function drapedBlock(
  w: number,
  h: number,
  d: number,
  amp: number,
  anchor: [number, number] | null,
) {
  const g = new THREE.BoxGeometry(w, h, d, 28, 30, 2);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const u = x / w + 0.5;
    const v = y / h + 0.5;
    // chanfro: perto das bordas a espessura diminui
    const edge = Math.min(u, 1 - u, v, 1 - v);
    const bevel = Math.min(1, edge / 0.06);
    let nz = z * (0.7 + 0.3 * bevel);
    if (Math.abs(z) > d / 2 - 1e-5) {
      let fold = Math.sin(u * 15 + Math.sin(v * 5.5) * 1.4) * 0.55 + Math.sin(u * 27 + v * 3) * 0.2;
      if (anchor) {
        // as dobras se torcem em volta do ponto onde a bala entra
        const dx = u - anchor[0];
        const dy = v - anchor[1];
        const dist = Math.hypot(dx, dy * 1.2);
        const a = Math.atan2(dy, dx);
        fold += Math.sin(a * 6 + dist * 14) * 0.9 * Math.exp(-dist * 3.2);
      }
      nz += Math.sign(z) * fold * amp * bevel;
    }
    p.setZ(i, nz);
  }
  g.computeVertexNormals();
  return g;
}

/** Frente do frasco: grafite espelhado com reflexos, GHOST dourado na vertical e SPECTRE embaixo. */
function paintFront(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, '#5c5753');
  g.addColorStop(0.3, '#8d8681');
  g.addColorStop(0.55, '#4a4643');
  g.addColorStop(0.8, '#7c7570');
  g.addColorStop(1, '#3c3936');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // reflexos verticais das dobras (claros e escuros)
  for (let k = 0; k < 11; k++) {
    const x0 = (k / 10) * w;
    ctx.strokeStyle = k % 2 ? 'rgba(235,230,224,0.3)' : 'rgba(18,16,14,0.38)';
    ctx.lineWidth = 6 + (k % 3) * 4;
    ctx.beginPath();
    for (let y = 0; y <= h; y += 6) {
      const x = x0 + Math.sin(y * 0.03 + k * 1.3) * w * 0.05;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // borda chanfrada mais escura
  ctx.strokeStyle = 'rgba(15,13,12,0.55)';
  ctx.lineWidth = w * 0.04;
  ctx.strokeRect(0, 0, w, h);
  // GHOST na vertical, letras douradas finas
  ctx.fillStyle = '#d9b06a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 ${h * 0.085}px "Bodoni Moda", Georgia, serif`;
  'GHOST'.split('').forEach((ch, i) => {
    ctx.fillText(ch, w * 0.17, h * (0.27 + i * 0.085));
  });
  // SPECTRE embaixo à esquerda, prateado, com o S dentro de um quadrado
  const y = h * 0.9;
  const s = h * 0.06;
  ctx.strokeStyle = '#e4e0da';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.08, y - s * 0.62, s * 1.15, s * 1.24);
  ctx.fillStyle = '#ece8e2';
  ctx.font = `700 ${s}px "Manrope Variable", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('S', w * 0.08 + s * 0.22, y + s * 0.02);
  ctx.fillText('PECTRE', w * 0.08 + s * 1.3, y + s * 0.02);
}

/** Base da bala vista de trás (o disco dourado na tampa): aro, espoleta e gravação. */
function paintPrimer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w * 0.4, h * 0.4, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, '#f3d79a');
  g.addColorStop(1, '#a8782c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(90,60,20,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.13, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(90,60,20,0.65)';
  ctx.font = `700 ${w * 0.09}px "Manrope Variable", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPECTRE', w / 2, h * 0.25);
  ctx.fillText('GHOST', w / 2, h * 0.75);
}

/**
 * Perfume Spectre Ghost (pela foto do Raphael): frasco de metal grafite
 * espelhado e drapeado, com bordas chanfradas, GHOST dourado na vertical,
 * SPECTRE embaixo, a bala dourada cravada na lateral direita com a
 * ponta para dentro e a tampa quadrada drapeada com a base dourada de uma
 * bala cravada no canto.
 */
export function GhostPerfume() {
  const geo = useMemo(
    () => ({
      body: drapedBlock(W, H, D, 0.0028, [BULLET_U, BULLET_V]).translate(0, H / 2, 0),
      neck: new THREE.CylinderGeometry(0.009, 0.01, 0.007, 16).translate(0, H + 0.0035, 0),
      cap: drapedBlock(0.034, 0.033, 0.027, 0.0018, [0.25, 0.7]).translate(0, H + 0.0235, 0),
      // bala deitada, cravada no frasco como na foto: a ponta entra no vidro
      // (para a esquerda, meio afundada na frente) e a base com o aro fica
      // para fora da lateral direita
      bullet: crease(
        lathe(
          [
            [0.001, 0],
            [0.0082, 0],
            [0.0082, 0.003],
            [0.0076, 0.0036],
            [0.0079, 0.026],
            [0.0072, 0.034],
            [0.0048, 0.042],
            [0.0018, 0.047],
            [0.001, 0.0475],
          ],
          { seg: 20 },
        ),
        35,
      )
        .rotateZ(Math.PI / 2)
        .translate(BULLET_BASE, H * BULLET_V, BULLET_Z),
      // canaleta perto da base (a parte que fica para fora)
      bands: new THREE.TorusGeometry(0.008, 0.0007, 6, 20)
        .rotateY(Math.PI / 2)
        .translate(BULLET_BASE - 0.0045, H * BULLET_V, BULLET_Z),
      primer: new THREE.CylinderGeometry(0.0065, 0.0065, 0.003, 22)
        .rotateX(Math.PI / 2)
        .translate(-0.0075, H + 0.031, 0.0145),
    }),
    [],
  );
  const mats = useMemo(() => {
    const metal = new THREE.MeshStandardMaterial({
      color: '#8f8882',
      metalness: 0.75,
      roughness: 0.18,
      envMapIntensity: 1.8,
    });
    const front = new THREE.MeshStandardMaterial({
      map: tex(makeCanvas(296, 336, paintFront), { clamp: true, aniso: 8 }),
      metalness: 0.6,
      roughness: 0.2,
      envMapIntensity: 1.7,
    });
    const gold = new THREE.MeshStandardMaterial({
      color: '#e6c07a',
      metalness: 0.9,
      roughness: 0.16,
      envMapIntensity: 2.2,
    });
    const primer = new THREE.MeshStandardMaterial({
      map: tex(makeCanvas(128, 128, paintPrimer), { clamp: true }),
      metalness: 0.85,
      roughness: 0.22,
      envMapIntensity: 2,
    });
    // faces da caixa: +x, -x, +y, -y, frente (+z), verso (-z)
    return {
      metal,
      gold,
      body: [metal, metal, metal, metal, front, metal],
      // na tampa, a face da frente leva o disco (por isso fica lisa)
      primer: [metal, primer, primer],
    };
  }, []);
  return (
    <Interactive id="perfume" label="objects.perfume">
      <group name="perfume">
        <mesh geometry={geo.body} material={mats.body} />
        <mesh geometry={geo.neck} material={mats.metal} />
        <mesh geometry={geo.cap} material={mats.metal} />
        <mesh geometry={geo.bullet} material={mats.gold} />
        <mesh geometry={geo.bands} material={mats.gold} />
        <mesh geometry={geo.primer} material={mats.primer} />
      </group>
    </Interactive>
  );
}
