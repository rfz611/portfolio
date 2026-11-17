import { useMemo } from 'react';
import * as THREE from 'three';
import { box, crease, cyl, merge } from '../scene/geo';
import { lib } from '../textures/library';
import { TV_SCREEN } from './recordLayout';

const HALF_PI = Math.PI / 2;

/** Vidro abaulado do tubo: um plano com a barriga para fora. */
function screenGeometry() {
  const g = new THREE.PlaneGeometry(TV_SCREEN.w, TV_SCREEN.h, 10, 8);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / (TV_SCREEN.w / 2);
    const y = p.getY(i) / (TV_SCREEN.h / 2);
    p.setZ(i, (1 - x * x) * (1 - y * y) * 0.02);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * TV de tubo (0,70 × 0,55 × 0,50 m) com gabinete de mogno, igual ao aparador.
 * A tela é uma peça separada chamada "screen": na Fase 3 o conteúdo dos
 * projetos entra nela pelo código, sem mexer no modelo.
 */
export function CrtTv() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const panelY = (v: number) => 0.275 + 0.47 * (0.5 - v);
    return {
      cabinet: box([0.7, 0.55, 0.34], [0, 0.275, 0.08]),
      plastic: merge([
        box([0.56, 0.44, 0.18], [0, 0.27, -0.165]),
        box([0.66, 0.51, 0.012], [0, 0.275, 0.2515]),
        // moldura em volta do vidro
        box([0.5, 0.02, 0.016], [TV_SCREEN.x, TV_SCREEN.y + 0.187, 0.262]),
        box([0.5, 0.02, 0.016], [TV_SCREEN.x, TV_SCREEN.y - 0.187, 0.262]),
        box([0.02, 0.39, 0.016], [TV_SCREEN.x - 0.245, TV_SCREEN.y, 0.262]),
        box([0.02, 0.39, 0.016], [TV_SCREEN.x + 0.245, TV_SCREEN.y, 0.262]),
        cyl(0.034, 0.038, 0.022, [0.245, panelY(0.19), 0.269], { seg: 16, rot: [HALF_PI, 0, 0] }),
        cyl(0.034, 0.045, 0.02, [0.12, 0.56, -0.05], { seg: 12 }),
      ]),
      screen: screenGeometry(),
      brass: crease(
        merge([
          cyl(0.014, 0.014, 0.006, [0.245, panelY(0.19), 0.282], { seg: 12, rot: [HALF_PI, 0, 0] }),
          box([0.004, 0.03, 0.006], [0.245, panelY(0.19) + 0.015, 0.282]),
          cyl(0.013, 0.015, 0.016, [0.245, panelY(0.56), 0.266], { seg: 12, rot: [HALF_PI, 0, 0] }),
          box([0.036, 0.02, 0.01], [0.223, panelY(0.42), 0.263]),
          box([0.036, 0.02, 0.01], [0.267, panelY(0.42), 0.263]),
        ]),
      ),
      led: box([0.01, 0.006, 0.004], [-0.3, 0.036, 0.259]),
    };
  }, []);

  return (
    <group name="crt_tv">
      <mesh geometry={geo.cabinet} material={mat.mahogany} />
      <mesh geometry={geo.plastic} material={mat.blackPlastic} />
      <mesh geometry={geo.brass} material={mat.brass} name="buttons" />
      <mesh geometry={geo.led} material={mat.ledRed} />
      <mesh position={[0.245, 0.275, 0.2585]} material={mat.tvPanel}>
        <planeGeometry args={[0.15, 0.47]} />
      </mesh>
      <mesh
        name="screen"
        geometry={geo.screen}
        material={mat.tvScreen}
        position={[TV_SCREEN.x, TV_SCREEN.y, TV_SCREEN.z]}
      />
    </group>
  );
}
