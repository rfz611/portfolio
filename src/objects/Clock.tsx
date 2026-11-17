import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { box, merge } from '../scene/geo';
import { hdr, lib } from '../textures/library';
import { Interactive } from './Interactive';

const W = 128;
const H = 44;

function drawTime(ctx: CanvasRenderingContext2D, now: Date) {
  ctx.fillStyle = '#0a0000';
  ctx.fillRect(0, 0, W, H);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const colon = now.getSeconds() % 2 === 0 ? ':' : ' ';
  ctx.font = '50px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#3a0500';
  ctx.fillText('88:88', W / 2, H / 2 + 2);
  ctx.shadowColor = '#ff2a1a';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ff3b28';
  ctx.fillText(`${hours}${colon}${minutes}`, W / 2, H / 2 + 2);
  ctx.shadowBlur = 0;
}

/**
 * Relógio digital (0,20 × 0,08 × 0,08 m) com números vermelhos em VT323.
 * O visor é um plano à parte e mostra a hora real de quem visita.
 */
export function Clock() {
  const { mat } = lib();
  const display = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    drawTime(ctx, new Date());
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      color: hdr('#ffffff', 2.4),
      toneMapped: false,
    });
    return { ctx, texture, material };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      drawTime(display.ctx, new Date());
      display.texture.needsUpdate = true;
    }, 1000);
    return () => window.clearInterval(timer);
  }, [display]);

  const geo = useMemo(
    () => ({
      body: merge([
        box([0.2, 0.066, 0.08], [0, 0.033, 0]),
        box([0.19, 0.004, 0.07], [0, 0.002, 0]),
      ]),
      top: box([0.2, 0.014, 0.08], [0, 0.073, 0]),
      buttons: merge([
        box([0.03, 0.005, 0.014], [-0.05, 0.0825, -0.01]),
        box([0.03, 0.005, 0.014], [0, 0.0825, -0.01]),
        box([0.03, 0.005, 0.014], [0.05, 0.0825, -0.01]),
      ]),
    }),
    [],
  );

  return (
    <Interactive id="clock" label="objects.clock">
      <group name="clock" rotation={[0, -0.12, 0]}>
        <mesh geometry={geo.body} material={mat.blackPlastic} />
        <mesh geometry={geo.top} material={mat.walnut} />
        <mesh geometry={geo.buttons} material={mat.steel} />
        <mesh name="display" position={[0, 0.036, 0.0405]} material={display.material}>
          <planeGeometry args={[0.16, 0.052]} />
        </mesh>
      </group>
    </Interactive>
  );
}
