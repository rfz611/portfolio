import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { BILLBOARD } from '../config/layout';
import { palette } from '../config/palette';
import { makeCanvas, tex } from '../textures/canvas';
import { hdr, lib } from '../textures/library';
import { box, merge } from './geo';

/** Arte do outdoor: fundo preto, moldura dourada, o nome em letra de cartaz e a função embaixo. */
function paintBillboard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  name: string,
  role: string,
) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#120a08');
  g.addColorStop(1, '#050304');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = palette.brass;
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, w - 28, h - 28);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(26, 26, w - 52, h - 52);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#efe0bd';
  let size = h * 0.36;
  ctx.font = `italic 600 ${size}px "Bodoni Moda", serif`;
  while (ctx.measureText(name).width > w * 0.86 && size > 20) {
    size -= 2;
    ctx.font = `italic 600 ${size}px "Bodoni Moda", serif`;
  }
  ctx.fillText(name, w / 2, h * 0.44);
  ctx.fillStyle = palette.amber;
  const spaced = role.toUpperCase().split('').join(' ');
  let small = h * 0.08;
  ctx.font = `600 ${small}px "Manrope Variable", sans-serif`;
  while (ctx.measureText(spaced).width > w * 0.84 && small > 8) {
    small -= 1;
    ctx.font = `600 ${small}px "Manrope Variable", sans-serif`;
  }
  ctx.fillText(spaced, w / 2, h * 0.74);
}

/**
 * Outdoor gigante com o nome do Raphael na fachada de um prédio em frente,
 * iluminado por refletores no alto (no lugar do letreiro no vidro).
 */
export function Billboard() {
  const { t } = useTranslation();
  const { mat } = lib();
  const name = t('home.name');
  const role = `${t('home.role')} · ${t('home.place')}`;
  const face = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(1024, 370, (c, w, h) => paintBillboard(c, w, h, name, role)),
          { clamp: true, aniso: 8 },
        ),
        color: hdr('#ffffff', 1.15),
        toneMapped: false,
      }),
    [name, role],
  );
  const { x, y, z, w, h, yaw } = BILLBOARD;
  // tudo é montado em volta da origem e o grupo gira para olhar a janela
  const geo = useMemo(() => {
    const lamps: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 5; k++) {
      const lx = -w / 2 + 3 + k * ((w - 6) / 4);
      lamps.push(box([0.5, 0.25, 2.2], [lx, h / 2 + 1.2, 1.4]));
    }
    return {
      // prédio atrás do outdoor, com janelas
      tower: box([40, 140, 30], [0, -95 - y + 70, -16], { uv: 7 }),
      frame: merge([
        box([w + 1.2, 1.0, 0.8], [0, h / 2 + 0.5, -0.4]),
        box([w + 1.2, 1.0, 0.8], [0, -h / 2 - 0.5, -0.4]),
        box([0.8, h + 2, 0.8], [-w / 2 - 0.6, 0, -0.4]),
        box([0.8, h + 2, 0.8], [w / 2 + 0.6, 0, -0.4]),
        box([w, 0.3, 1.6], [0, -h / 2 - 1.2, 0.5]),
      ]),
      lamps: merge(lamps),
    };
  }, [y, w, h]);
  const facade = useMemo(() => new THREE.MeshBasicMaterial({ map: mat.cityB.map }), [mat]);
  const lampGlow = useMemo(
    () => new THREE.MeshBasicMaterial({ color: hdr('#fff1d6', 1.6), toneMapped: false }),
    [],
  );
  return (
    <group name="billboard" position={[x, y, z]} rotation={[0, yaw, 0]}>
      <mesh geometry={geo.tower} material={facade} />
      <mesh geometry={geo.frame} material={mat.darkMetal} />
      <mesh geometry={geo.lamps} material={lampGlow} />
      <mesh position={[0, 0, 0.05]} material={face}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </group>
  );
}
