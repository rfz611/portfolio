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
export function Engine({ m }: { m: CarMats }) {
  const atEngine = useScene((s) => s.view === 'motor');
  const setSkill = useScene((s) => s.setSkill);

  const geo = useMemo(() => {
    // Layout do cofre (x do para-choque, -2,05, até a parede de fogo, -1,15;
    // z até ±0,6; y do assoalho, 0,30, até embaixo do capô, ~0,76 na frente
    // e ~0,88 atrás). Da frente para trás: intercooler, radiador com as
    // ventoinhas, escape com o turbo, o motor transversal, o coletor de
    // admissão e, junto da parede de fogo, bateria (+z) e fusíveis (-z).
    const cyls = [-0.18, -0.06, 0.06, 0.18];
    const BX = -1.55; // centro do motor
    return {
      // parede de fogo atrás e os para-lamas internos, baixos (não podem passar da lataria)
      bay: join([
        box([0.03, 0.5, 1.24], [-1.125, 0.55, 0]),
        box([0.86, 0.24, 0.03], [-1.57, 0.42, 0.62]),
        box([0.86, 0.24, 0.03], [-1.57, 0.42, -0.62]),
      ]),
      // torres da suspensão, nos cantos de trás do cofre
      towers: join([
        cyl(0.075, 0.09, 0.26, [-1.45, 0.61, 0.56], { seg: 14 }),
        cyl(0.075, 0.09, 0.26, [-1.45, 0.61, -0.56], { seg: 14 }),
      ]),
      bayFloor: box([0.92, 0.02, 1.22], [-1.6, 0.3, 0]),
      strutTops: join([
        cyl(0.045, 0.045, 0.02, [-1.45, 0.75, 0.56], { seg: 10 }),
        cyl(0.045, 0.045, 0.02, [-1.45, 0.75, -0.56], { seg: 10 }),
      ]),

      // ---- Linguagens: o motor (bloco, cabeçote, tampa vermelha, bobinas)
      block: join([
        crease(rbox([0.34, 0.3, 0.56], [BX, 0.45, 0.02], 0.02), 40),
        crease(rbox([0.3, 0.09, 0.54], [BX, 0.645, 0.02], 0.015), 40),
        box([0.32, 0.34, 0.04], [BX, 0.48, 0.32]),
        cyl(0.065, 0.065, 0.035, [BX - 0.02, 0.4, 0.355], { seg: 18, rot: [HALF_PI, 0, 0] }),
      ]),
      valve: crease(rbox([0.24, 0.05, 0.5], [BX, 0.714, 0.02], 0.018), 40),
      plugs: join([
        box([0.07, 0.014, 0.42], [BX, 0.745, 0.02]),
        ...cyls.map((z) => box([0.045, 0.026, 0.045], [BX, 0.757, z + 0.02])),
        cyl(0.022, 0.022, 0.026, [BX + 0.08, 0.75, 0.22], { seg: 10 }),
      ]),

      // ---- Back-end: admissão de ar (turbo, intercooler, canos, coletor)
      intakeAlu: join([
        // coletor atrás do motor, com os quatro dutos entrando no cabeçote
        crease(rbox([0.1, 0.1, 0.44], [-1.3, 0.665, 0.02], 0.03), 40),
        ...cyls.map((z) =>
          tube(
            [
              [-1.32, 0.64, z + 0.02],
              [-1.36, 0.6, z + 0.02],
              [-1.4, 0.635, z + 0.02],
            ],
            0.022,
            10,
          ),
        ),
        // corpo de borboleta na ponta do coletor
        cyl(0.045, 0.045, 0.07, [-1.3, 0.665, 0.275], { seg: 14, rot: [HALF_PI, 0, 0] }),
        // cano frio: do corpo de borboleta, por entre o motor e a torre, até o intercooler
        tube(
          [
            [-1.3, 0.665, 0.31],
            [-1.36, 0.68, 0.41],
            [-1.62, 0.64, 0.41],
            [-1.8, 0.55, 0.44],
            [-1.95, 0.42, 0.5],
            [-2.08, 0.32, 0.5],
          ],
          0.033,
        ),
        // cano quente: da saída do turbo até a outra ponta do intercooler
        tube(
          [
            [-1.8, 0.46, -0.46],
            [-1.9, 0.4, -0.52],
            [-2.0, 0.34, -0.53],
            [-2.08, 0.32, -0.5],
          ],
          0.03,
        ),
        // escudo térmico do coletor de escape, na frente do motor
        box([0.05, 0.15, 0.4], [-1.755, 0.56, 0.02]),
      ]),
      turbo: join([
        cyl(0.07, 0.07, 0.09, [-1.76, 0.46, -0.36], { seg: 16, rot: [HALF_PI, 0, 0] }),
        cyl(0.06, 0.06, 0.07, [-1.76, 0.46, -0.44], { seg: 16, rot: [HALF_PI, 0, 0] }),
      ]),
      filter: join([
        tube(
          [
            [-1.74, 0.47, -0.47],
            [-1.68, 0.5, -0.5],
            [-1.62, 0.5, -0.4],
          ],
          0.026,
          10,
        ),
        cyl(0.062, 0.05, 0.11, [-1.56, 0.5, -0.4], { seg: 14, rot: [0, 0, HALF_PI] }),
      ]),
      intercooler: box([0.05, 0.14, 1.04], [-2.12, 0.3, 0]),

      // ---- Front-end: radiador, ventoinhas e mangueiras de água
      radiator: box([0.04, 0.32, 0.9], [-1.98, 0.5, 0]),
      shroud: join([
        box([0.025, 0.32, 0.86], [-1.945, 0.5, 0]),
        cyl(0.13, 0.13, 0.025, [-1.925, 0.5, 0.2], { seg: 20, rot: [0, 0, HALF_PI] }),
        cyl(0.13, 0.13, 0.025, [-1.925, 0.5, -0.2], { seg: 20, rot: [0, 0, HALF_PI] }),
        cyl(0.03, 0.03, 0.05, [-1.91, 0.5, 0.2], { seg: 10, rot: [0, 0, HALF_PI] }),
        cyl(0.03, 0.03, 0.05, [-1.91, 0.5, -0.2], { seg: 10, rot: [0, 0, HALF_PI] }),
      ]),
      hoses: join([
        // de cima do radiador até a válvula termostática, na frente do cabeçote
        tube(
          [
            [-1.96, 0.64, -0.3],
            [-1.85, 0.68, -0.26],
            [-1.76, 0.67, -0.2],
            [-1.71, 0.645, -0.18],
          ],
          0.022,
        ),
        // de baixo do radiador até a bomba d'água, na ponta do motor
        tube(
          [
            [-1.96, 0.38, 0.3],
            [-1.82, 0.36, 0.33],
            [-1.66, 0.4, 0.35],
          ],
          0.022,
        ),
      ]),
      coolant: crease(rbox([0.08, 0.1, 0.08], [-1.84, 0.62, 0.56], 0.015), 40),

      // ---- Bancos de dados: bateria junto da parede de fogo e os cabos
      battery: crease(rbox([0.2, 0.18, 0.15], [-1.24, 0.44, 0.45], 0.012), 40),
      batteryTop: box([0.18, 0.012, 0.13], [-1.24, 0.535, 0.45]),
      terminals: join([
        cyl(0.014, 0.014, 0.03, [-1.31, 0.55, 0.41], { seg: 8 }),
        cyl(0.014, 0.014, 0.03, [-1.17, 0.55, 0.41], { seg: 8 }),
        box([0.025, 0.018, 0.17], [-1.24, 0.555, 0.45]),
      ]),
      plus: tube(
        [
          [-1.31, 0.565, 0.41],
          [-1.36, 0.5, 0.36],
          [-1.39, 0.4, 0.32],
          [-1.4, 0.36, 0.28],
        ],
        0.011,
      ),
      minus: tube(
        [
          [-1.17, 0.565, 0.41],
          [-1.16, 0.5, 0.52],
          [-1.16, 0.42, 0.6],
        ],
        0.011,
      ),

      // ---- Ferramentas: caixa de fusíveis e o chicote até as bobinas
      fuses: join([
        crease(rbox([0.18, 0.1, 0.13], [-1.24, 0.45, -0.45], 0.015), 40),
        crease(rbox([0.19, 0.028, 0.14], [-1.24, 0.512, -0.45], 0.012), 40),
      ]),
      harness: join([
        tube(
          [
            [-1.3, 0.52, -0.4],
            [-1.36, 0.62, -0.3],
            [-1.46, 0.765, -0.2],
            [-1.52, 0.77, -0.14],
          ],
          0.012,
        ),
        tube(
          [
            [-1.17, 0.5, -0.42],
            [-1.16, 0.55, -0.34],
            [-1.16, 0.6, -0.26],
          ],
          0.012,
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
      <mesh geometry={geo.bay} material={m.bayPaint} />
      <mesh geometry={geo.towers} material={m.bayPaint} />
      <mesh geometry={geo.bayFloor} material={m.matte} />
      <mesh geometry={geo.strutTops} material={m.castIron} />
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
