import { useMemo } from 'react';
import * as THREE from 'three';
import { crease, lathe } from '../scene/geo';

/**
 * Bloco de metal ondulado: uma caixa subdividida cuja frente e verso
 * recebem ondas verticais, como metal amassado.
 */
function wavyBlock(w: number, h: number, d: number, amp: number, seed: number) {
  const g = new THREE.BoxGeometry(w, h, d, 18, 22, 2);
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
    // as bordas ficam retas; o meio ondula
    const edge = Math.min(1, Math.min(u, 1 - u) * 8) * Math.min(1, Math.min(v, 1 - v) * 10);
    p.setZ(i, z + Math.sign(z) * wave * amp * edge);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Perfume de frasco retangular de metal grafite ondulado, com uma bala
 * dourada cravada na lateral direita e a tampa quadrada ondulada com um
 * botão dourado (pedido do Raphael, a partir da foto que ele mandou).
 * Sem nome de marca escrito.
 */
export function GhostPerfume() {
  const geo = useMemo(
    () => ({
      body: wavyBlock(0.07, 0.085, 0.03, 0.0025, 1.3).translate(0, 0.0425, 0),
      cap: wavyBlock(0.032, 0.03, 0.026, 0.0015, 4.1).translate(0, 0.1, 0),
      neck: new THREE.CylinderGeometry(0.008, 0.008, 0.01, 12).translate(0, 0.088, 0),
      bullet: crease(
        lathe(
          [
            [0.001, 0],
            [0.0075, 0],
            [0.0075, 0.018],
            [0.0068, 0.026],
            [0.0045, 0.033],
            [0.001, 0.037],
          ],
          { seg: 14 },
        ),
        35,
      )
        .rotateZ(-Math.PI / 2)
        .translate(0.02, 0.045, 0.004),
      button: new THREE.CylinderGeometry(0.006, 0.006, 0.003, 16)
        .rotateX(Math.PI / 2)
        .translate(-0.006, 0.104, 0.0145),
    }),
    [],
  );
  const metal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#a39b93',
        metalness: 0.65,
        roughness: 0.28,
        envMapIntensity: 1.6,
      }),
    [],
  );
  const gold = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#d9b25a',
        metalness: 1,
        roughness: 0.22,
        envMapIntensity: 2,
      }),
    [],
  );
  return (
    <group name="perfume">
      <mesh geometry={geo.body} material={metal} />
      <mesh geometry={geo.neck} material={metal} />
      <mesh geometry={geo.cap} material={metal} />
      <mesh geometry={geo.bullet} material={gold} />
      <mesh geometry={geo.button} material={gold} />
    </group>
  );
}
