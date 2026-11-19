import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { skillGroups, type SkillGroup } from '../../content/skills';
import { box, crease, cyl } from '../../scene/geo';
import { useScene } from '../../store/useScene';
import { Interactive } from '../Interactive';
import { join, type CarMats } from './materials';

const HALF_PI = Math.PI / 2;
type P = [number, number, number];

/** Mangueira, cano ou cabo passando pelos pontos (curva suave). */
function tube(points: P[], r: number, seg = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, seg, r, 8, false);
}

/** Caixa com cantos arredondados (peças fundidas do motor). */
function rbox(size: P, pos: P, radius = 0.015) {
  const g = new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius);
  return g.translate(...pos);
}

/**
 * Cofre do motor, com tudo ligado como num carro de verdade: motor de
 * quatro cilindros transversal com a tampa de válvulas vermelha; turbo
 * na frente soprando para o intercooler atrás do para-choque, e o cano
 * frio voltando ao corpo de borboleta e ao coletor de admissão; radiador
 * com as ventoinhas e as mangueiras até o motor; bateria com os cabos ao
 * motor de partida e à carroceria; caixa de fusíveis com o chicote até
 * as bobinas. Cada conjunto é um grupo de skills: passar o mouse acende o
 * conjunto inteiro, clicar mostra as tecnologias.
 */
export function Engine({ m, walls = true }: { m: CarMats; walls?: boolean }) {
  const atEngine = useScene((s) => s.view === 'motor');
  const setSkill = useScene((s) => s.setSkill);

  const geo = useMemo(() => {
    const cyls = [-0.18, -0.06, 0.06, 0.18];
    return {
      // cofre: parede de fogo, para-lamas internos, travessa do radiador, torres
      bay: join([
        box([0.04, 0.52, 1.28], [-0.68, 0.6, 0]),
        box([1.3, 0.26, 0.04], [-1.33, 0.6, 0.64]),
        box([1.3, 0.26, 0.04], [-1.33, 0.6, -0.64]),
        box([0.07, 0.06, 1.3], [-1.99, 0.77, 0]),
      ]),
      towers: join([
        cyl(0.085, 0.1, 0.3, [-1.33, 0.63, 0.55], { seg: 14 }),
        cyl(0.085, 0.1, 0.3, [-1.33, 0.63, -0.55], { seg: 14 }),
      ]),
      bayFloor: box([1.36, 0.02, 1.26], [-1.33, 0.3, 0]),
      strutTops: join([
        cyl(0.05, 0.05, 0.02, [-1.33, 0.79, 0.55], { seg: 10 }),
        cyl(0.05, 0.05, 0.02, [-1.33, 0.79, -0.55], { seg: 10 }),
      ]),
      // cilindro-mestre do freio e o reservatório, junto da parede de fogo
      brake: join([
        cyl(0.03, 0.03, 0.16, [-0.78, 0.66, 0.24], { seg: 10, rot: [0, 0, HALF_PI] }),
        cyl(0.035, 0.035, 0.07, [-0.8, 0.73, 0.24], { seg: 10 }),
      ]),

      // ---- Linguagens: o motor (bloco, cabeçote, tampa vermelha, bobinas)
      block: join([
        crease(rbox([0.4, 0.34, 0.6], [-1.3, 0.5, 0.02], 0.02), 40),
        crease(rbox([0.36, 0.1, 0.58], [-1.3, 0.72, 0.02], 0.015), 40),
        box([0.4, 0.42, 0.05], [-1.3, 0.56, 0.35]),
        cyl(0.07, 0.07, 0.04, [-1.3, 0.42, 0.39], { seg: 18, rot: [HALF_PI, 0, 0] }),
      ]),
      valve: crease(rbox([0.28, 0.06, 0.54], [-1.3, 0.8, 0.02], 0.02), 40),
      plugs: join([
        box([0.08, 0.016, 0.46], [-1.3, 0.836, 0.02]),
        ...cyls.map((z) => box([0.05, 0.03, 0.05], [-1.3, 0.85, z + 0.02])),
        cyl(0.025, 0.025, 0.03, [-1.22, 0.84, 0.24], { seg: 10 }),
      ]),

      // ---- Back-end: admissão de ar (turbo, intercooler, canos, coletor)
      intakeAlu: join([
        crease(rbox([0.12, 0.12, 0.46], [-1.02, 0.74, 0.02], 0.03), 40),
        ...cyls.map((z) =>
          tube(
            [
              [-1.04, 0.69, z + 0.02],
              [-1.1, 0.64, z + 0.02],
              [-1.16, 0.68, z + 0.02],
            ],
            0.025,
            10,
          ),
        ),
        cyl(0.05, 0.05, 0.08, [-1.02, 0.74, 0.3], { seg: 14, rot: [HALF_PI, 0, 0] }),
        // cano frio: do intercooler (lado +z) até o corpo de borboleta
        tube(
          [
            [-2.1, 0.3, 0.52],
            [-1.95, 0.44, 0.56],
            [-1.6, 0.62, 0.5],
            [-1.2, 0.72, 0.4],
            [-1.03, 0.74, 0.34],
          ],
          0.035,
        ),
        // cano quente: do turbo até o intercooler (lado -z)
        tube(
          [
            [-1.62, 0.5, -0.46],
            [-1.8, 0.42, -0.55],
            [-2.0, 0.34, -0.55],
            [-2.1, 0.3, -0.5],
          ],
          0.032,
        ),
        // escudo térmico do coletor de escape
        box([0.08, 0.18, 0.42], [-1.53, 0.58, -0.02]),
      ]),
      turbo: join([
        cyl(0.085, 0.085, 0.1, [-1.62, 0.5, -0.29], { seg: 16, rot: [HALF_PI, 0, 0] }),
        cyl(0.07, 0.07, 0.08, [-1.62, 0.5, -0.4], { seg: 16, rot: [HALF_PI, 0, 0] }),
      ]),
      filter: join([
        tube(
          [
            [-1.62, 0.5, -0.44],
            [-1.66, 0.56, -0.5],
            [-1.74, 0.6, -0.5],
          ],
          0.03,
          10,
        ),
        cyl(0.075, 0.06, 0.12, [-1.8, 0.6, -0.5], { seg: 14, rot: [0, 0, HALF_PI] }),
      ]),
      intercooler: box([0.06, 0.16, 1.12], [-2.15, 0.3, 0]),

      // ---- Front-end: radiador, ventoinhas e mangueiras de água
      radiator: box([0.05, 0.38, 1.0], [-1.91, 0.53, 0]),
      shroud: join([
        box([0.03, 0.38, 0.95], [-1.86, 0.53, 0]),
        cyl(0.15, 0.15, 0.03, [-1.84, 0.53, 0.22], { seg: 20, rot: [0, 0, HALF_PI] }),
        cyl(0.15, 0.15, 0.03, [-1.84, 0.53, -0.22], { seg: 20, rot: [0, 0, HALF_PI] }),
        cyl(0.035, 0.035, 0.06, [-1.82, 0.53, 0.22], { seg: 10, rot: [0, 0, HALF_PI] }),
        cyl(0.035, 0.035, 0.06, [-1.82, 0.53, -0.22], { seg: 10, rot: [0, 0, HALF_PI] }),
      ]),
      hoses: join([
        tube(
          [
            [-1.89, 0.68, -0.3],
            [-1.72, 0.74, -0.24],
            [-1.52, 0.75, -0.14],
            [-1.46, 0.74, -0.1],
          ],
          0.026,
        ),
        tube(
          [
            [-1.89, 0.38, 0.3],
            [-1.7, 0.35, 0.32],
            [-1.52, 0.4, 0.33],
          ],
          0.026,
        ),
      ]),
      coolant: crease(rbox([0.1, 0.12, 0.12], [-1.76, 0.62, 0.5], 0.02), 40),

      // ---- Bancos de dados: bateria e os cabos
      battery: crease(rbox([0.22, 0.19, 0.16], [-0.86, 0.5, 0.47], 0.012), 40),
      batteryTop: box([0.2, 0.012, 0.14], [-0.86, 0.6, 0.47]),
      terminals: join([
        cyl(0.016, 0.016, 0.03, [-0.94, 0.62, 0.43], { seg: 8 }),
        cyl(0.016, 0.016, 0.03, [-0.78, 0.62, 0.43], { seg: 8 }),
        box([0.03, 0.02, 0.2], [-0.86, 0.62, 0.47]),
      ]),
      plus: tube(
        [
          [-0.94, 0.63, 0.43],
          [-1.0, 0.6, 0.36],
          [-1.08, 0.46, 0.32],
          [-1.15, 0.4, 0.3],
        ],
        0.012,
      ),
      minus: tube(
        [
          [-0.78, 0.63, 0.43],
          [-0.72, 0.58, 0.52],
          [-0.72, 0.48, 0.6],
        ],
        0.012,
      ),

      // ---- Ferramentas: caixa de fusíveis e o chicote
      fuses: join([
        crease(rbox([0.2, 0.1, 0.15], [-0.86, 0.55, -0.48], 0.015), 40),
        crease(rbox([0.21, 0.03, 0.16], [-0.86, 0.615, -0.48], 0.012), 40),
      ]),
      harness: join([
        tube(
          [
            [-0.95, 0.58, -0.42],
            [-1.05, 0.66, -0.3],
            [-1.18, 0.8, -0.18],
            [-1.27, 0.85, -0.1],
          ],
          0.014,
        ),
        tube(
          [
            [-0.78, 0.56, -0.44],
            [-0.72, 0.6, -0.36],
            [-0.7, 0.64, -0.28],
          ],
          0.014,
        ),
      ]),
    };
  }, []);

  const groups = Object.fromEntries(skillGroups.map((g) => [g.part, g])) as Record<
    SkillGroup['part'],
    SkillGroup
  >;
  const part = (key: SkillGroup['part'], node: ReactNode) => (
    <Interactive
      key={key}
      id={`engine-${key}`}
      label={groups[key].partKey}
      enabled={atEngine}
      onClick={() => setSkill(groups[key].id)}
    >
      <group>{node}</group>
    </Interactive>
  );

  return (
    <group name="engine">
      {/* paredes do cofre: com o modelo do carro, a própria lataria faz esse papel */}
      {walls && <mesh geometry={geo.bay} material={m.bayPaint} />}
      <mesh geometry={geo.towers} material={m.bayPaint} />
      <mesh geometry={geo.bayFloor} material={m.matte} />
      <mesh geometry={geo.strutTops} material={m.castIron} />
      <mesh geometry={geo.brake} material={m.fluid} />
      {part(
        'block',
        <>
          <mesh geometry={geo.block} material={m.castIron} />
          <mesh geometry={geo.valve} material={m.valve} />
          <mesh geometry={geo.plugs} material={m.matte} />
        </>,
      )}
      {part(
        'intake',
        <>
          <mesh geometry={geo.intakeAlu} material={m.alu} />
          <mesh geometry={geo.turbo} material={m.castIron} />
          <mesh geometry={geo.filter} material={m.blueHose} />
          <mesh geometry={geo.intercooler} material={m.intercooler} />
        </>,
      )}
      {part(
        'radiator',
        <>
          <mesh geometry={geo.radiator} material={m.radiator} />
          <mesh geometry={geo.shroud} material={m.matte} />
          <mesh geometry={geo.hoses} material={m.hose} />
          <mesh geometry={geo.coolant} material={m.fluid} />
        </>,
      )}
      {part(
        'battery',
        <>
          <mesh geometry={geo.battery} material={m.battery} />
          <mesh geometry={geo.batteryTop} material={m.batteryTop} />
          <mesh geometry={geo.terminals} material={m.alu} />
          <mesh geometry={geo.plus} material={m.redCable} />
          <mesh geometry={geo.minus} material={m.hose} />
        </>,
      )}
      {part(
        'fuses',
        <>
          <mesh geometry={geo.fuses} material={m.battery} />
          <mesh geometry={geo.harness} material={m.hose} />
        </>,
      )}
    </group>
  );
}
