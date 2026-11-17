import { useMemo } from 'react';
import { box, crease, cyl, merge } from '../scene/geo';
import { lib } from '../textures/library';
import { CREDENZA, CREDENZA_POS, LEDGES, SPEAKERS_X } from './recordLayout';

const HALF_PI = Math.PI / 2;

/**
 * Aparador baixo de mogno (3,00 × 0,62 × 0,50 m) com portas de almofada,
 * nicho central com o amplificador e friso de latão. Fica no espaço local
 * do cantinho (x ao longo da parede, z saindo da parede).
 */
function Credenza() {
  const { mat } = lib();
  const geo = useMemo(() => {
    const { w, h, d } = CREDENZA;
    const doors = [-1.18, -0.62, 0.62, 1.18];
    return {
      body: merge([box([w, h - 0.1, d - 0.02], [0, 0.05 + (h - 0.1) / 2, d / 2 - 0.01])]),
      top: crease(box([w + 0.06, 0.045, d + 0.04], [0, h - 0.0225, d / 2 + 0.01]), 30),
      plinth: box([w - 0.08, 0.08, d - 0.08], [0, 0.04, d / 2 - 0.04]),
      doors: merge(
        doors.map((x) => box([0.52, h - 0.2, 0.02], [x, 0.09 + (h - 0.2) / 2 + 0.01, d])),
      ),
      inset: merge(
        doors.map((x) => box([0.4, h - 0.32, 0.012], [x, 0.09 + (h - 0.2) / 2 + 0.01, d + 0.012])),
      ),
      niche: box([0.66, h - 0.2, 0.02], [0, 0.09 + (h - 0.2) / 2 + 0.01, d - 0.12]),
      pulls: merge(
        doors.map((x) =>
          cyl(0.006, 0.006, 0.12, [x + (x < 0 ? 0.2 : -0.2), 0.36, d + 0.03], { seg: 6 }),
        ),
      ),
      trim: merge([
        box([w + 0.06, 0.008, 0.008], [0, h - 0.05, d + 0.03]),
        box([w - 0.08, 0.006, 0.006], [0, 0.085, d - 0.04]),
      ]),
      amp: box([0.6, 0.12, 0.34], [0, 0.18, d - 0.3]),
    };
  }, []);
  return (
    <group name="credenza">
      <mesh geometry={geo.body} material={mat.mahogany} />
      <mesh geometry={geo.top} material={mat.varnish} />
      <mesh geometry={geo.plinth} material={mat.blackPlastic} />
      <mesh geometry={geo.doors} material={mat.mahogany} />
      <mesh geometry={geo.inset} material={mat.mahoganyDark} />
      <mesh geometry={geo.niche} material={mat.mahoganyDark} />
      <mesh geometry={geo.pulls} material={mat.brass} />
      <mesh geometry={geo.trim} material={mat.brass} />
      <mesh geometry={geo.amp} material={mat.blackPlastic} />
      <mesh position={[0, 0.18, CREDENZA.d - 0.129]} material={mat.deckFront}>
        <planeGeometry args={[0.6, 0.12]} />
      </mesh>
    </group>
  );
}

/** Caixa de som de estante em mogno, com a tela de tecido. */
function Speaker() {
  const { mat } = lib();
  const body = useMemo(() => crease(box([0.24, 0.42, 0.24], [0, 0.21, 0]), 30), []);
  return (
    <group>
      <mesh geometry={body} material={mat.mahogany} />
      <mesh position={[0, 0.21, 0.1205]} material={mat.grille}>
        <planeGeometry args={[0.21, 0.39]} />
      </mesh>
    </group>
  );
}

/** Prateleira fina de galeria com friso de latão (para as capas encostadas). */
function Ledge({ y }: { y: number }) {
  const { mat } = lib();
  const w = LEDGES.x1 - LEDGES.x0;
  const geo = useMemo(
    () => ({
      board: box([w, 0.03, 0.1], [0, -0.015, 0.05]),
      lip: box([w, 0.035, 0.012], [0, 0.0, 0.1]),
      brackets: merge(
        [-w / 2 + 0.12, w / 2 - 0.12].map((x) =>
          box([0.02, 0.07, 0.08], [x, -0.06, 0.04], { rot: [0, 0, 0] }),
        ),
      ),
    }),
    [w],
  );
  return (
    <group position={[(LEDGES.x0 + LEDGES.x1) / 2, y, 0]}>
      <mesh geometry={geo.board} material={mat.mahogany} />
      <mesh geometry={geo.lip} material={mat.brass} />
      <mesh geometry={geo.brackets} material={mat.brass} />
    </group>
  );
}

/** Aparador, caixas de som e as duas prateleiras de discos na parede. */
export function MediaWall() {
  const { mat } = lib();
  return (
    <group name="record_shelf">
      <group position={[CREDENZA_POS[0], 0, 0]}>
        <Credenza />
        <mesh position={[0, 0.004, 0.45]} rotation={[-HALF_PI, 0, 0]} material={mat.shadow}>
          <planeGeometry args={[3.6, 1.1]} />
        </mesh>
      </group>
      {SPEAKERS_X.map((x) => (
        <group key={x} position={[x, CREDENZA.h, 0.2]}>
          <Speaker />
        </group>
      ))}
      <Ledge y={LEDGES.classics} />
      <Ledge y={LEDGES.rap} />
    </group>
  );
}
