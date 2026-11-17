import { useMemo } from 'react';
import { SPOT } from '../config/layout';
import { Interactive } from '../objects/Interactive';
import { useScene } from '../store/useScene';
import { lib } from '../textures/library';
import { box, crease, cyl, merge } from './geo';
import { OptionalModel } from './OptionalModel';

const HALF_PI = Math.PI / 2;

/** Escrivaninha de mogno (1,60 × 0,76 × 0,75 m) com gavetas e puxadores de latão. */
function Desk() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      top: box([1.6, 0.04, 0.75], [0, 0.74, 0]),
      body: merge([
        box([0.42, 0.7, 0.7], [-0.57, 0.36, 0], { swap: true }),
        box([0.42, 0.7, 0.7], [0.57, 0.36, 0], { swap: true }),
        box([0.72, 0.5, 0.02], [0, 0.47, -0.33]),
      ]),
      handles: merge(
        [-0.57, 0.57].flatMap((x) =>
          [0.18, 0.4, 0.6].map((y) =>
            cyl(0.006, 0.006, 0.1, [x, y, 0.36], { seg: 6, rot: [0, 0, HALF_PI] }),
          ),
        ),
      ),
      seams: merge(
        [-0.57, 0.57].flatMap((x) =>
          [0.29, 0.51].map((y) => box([0.4, 0.006, 0.004], [x, y, 0.351])),
        ),
      ),
    }),
    [],
  );
  return (
    <group name="desk">
      <mesh geometry={geo.top} material={mat.varnish} />
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.seams} material={mat.mahoganyDark} />
      <mesh geometry={geo.handles} material={mat.brass} />
    </group>
  );
}

/**
 * PC bege dos anos 2000: monitor de tubo, gabinete, teclado e mouse.
 * A tela é uma peça separada ("screen"); a área de trabalho retrô entra
 * nela pelo código na Fase 3.
 */
function RetroPc() {
  const { mat } = lib();
  const geo = useMemo(
    () => ({
      monitor: crease(
        merge([
          box([0.4, 0.34, 0.12], [0, 0.21, 0.13]),
          box([0.32, 0.27, 0.24], [0, 0.2, -0.04]),
          box([0.22, 0.03, 0.2], [0, 0.015, 0.02]),
          box([0.08, 0.05, 0.08], [0, 0.045, 0.02]),
        ]),
      ),
      bezel: merge([
        box([0.36, 0.022, 0.01], [0, 0.358, 0.195]),
        box([0.36, 0.05, 0.01], [0, 0.07, 0.195]),
        box([0.022, 0.29, 0.01], [-0.17, 0.21, 0.195]),
        box([0.022, 0.29, 0.01], [0.17, 0.21, 0.195]),
      ]),
      tower: box([0.19, 0.42, 0.42], [0, 0.21, 0]),
      drives: merge([
        box([0.15, 0.04, 0.005], [0, 0.34, 0.211]),
        box([0.15, 0.04, 0.005], [0, 0.29, 0.211]),
        box([0.1, 0.012, 0.005], [0, 0.23, 0.211]),
      ]),
      keyboard: box([0.44, 0.025, 0.15], [0, 0.0125, 0]),
      mouse: box([0.055, 0.03, 0.09], [0, 0.015, 0]),
    }),
    [],
  );
  return (
    <group name="retro_pc">
      <group position={[-0.12, 0.76, -0.16]}>
        <mesh geometry={geo.monitor} material={mat.beige} />
        <mesh geometry={geo.bezel} material={mat.beigeDark} />
        <mesh name="screen" position={[0, 0.215, 0.192]} material={mat.tvScreen}>
          <planeGeometry args={[0.318, 0.27]} />
        </mesh>
        <mesh position={[0.15, 0.07, 0.201]} material={mat.ledRed}>
          <boxGeometry args={[0.008, 0.006, 0.002]} />
        </mesh>
      </group>
      <group position={[0.58, 0.76, -0.12]}>
        <mesh geometry={geo.tower} material={mat.beige} />
        <mesh geometry={geo.drives} material={mat.beigeDark} />
      </group>
      <group position={[-0.12, 0.76, 0.2]} rotation={[0.06, 0, 0]}>
        <mesh geometry={geo.keyboard} material={mat.beige} />
        <mesh position={[0, 0.0256, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.keyboard}>
          <planeGeometry args={[0.42, 0.135]} />
        </mesh>
      </group>
      <mesh geometry={geo.mouse} material={mat.beige} position={[0.24, 0.76, 0.22]} />
    </group>
  );
}

/** Escrivaninha com o PC, encostada no vidro (seção Sobre mim). */
export function DeskArea() {
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const setView = useScene((s) => s.setView);
  const [x, y, z] = SPOT.desk;
  return (
    <group position={[x, y, z]}>
      <OptionalModel file="desk.glb">
        <Desk />
      </OptionalModel>
      <Interactive id="pc" label="objects.pc" enabled={home} onClick={() => setView('pc')}>
        <OptionalModel file="retro_pc.glb">
          <RetroPc />
        </OptionalModel>
      </Interactive>
      <mesh position={[0, 0.004, 0]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
        <planeGeometry args={[2.2, 1.3]} />
      </mesh>
    </group>
  );
}
