import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, crease, cyl } from '../../scene/geo';
import { useScene } from '../../store/useScene';
import { Interactive } from '../Interactive';
import {
  AXLE,
  buildCarBody,
  DOOR_HINGE,
  FRONT_X,
  HOOD_HINGE,
  REAR_X,
  WHEEL,
  type CarBodyGeometry,
} from './carBody';
import { Engine } from './Engine';
import { Interior } from './Interior';
import { join, useCarMaterials, type CarMats } from './materials';

const HALF_PI = Math.PI / 2;
type P = [number, number, number];

function rbox(size: P, pos: P, radius = 0.02) {
  return new RoundedBoxGeometry(size[0], size[1], size[2], 2, radius).translate(...pos);
}

/**
 * Remendo que acompanha a lataria por cima (faróis, saídas de ar do capô):
 * uma grade x × z cuja altura vem da superfície, um pouco acima dela.
 * corners: [x0, x1] × [zIn, zOut], com a quina de fora puxada (taper).
 */
function surfacePatch(
  body: CarBodyGeometry,
  [x0, x1]: [number, number],
  [z0, z1]: [number, number],
  lift = 0.006,
  taper = 0,
) {
  const nx = 6;
  const nz = 6;
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= nx; i++) {
    for (let k = 0; k <= nz; k++) {
      const u = k / nz;
      const v = i / nx;
      const z = z0 + (z1 - z0) * u;
      const x = x0 + (x1 - x0) * v + taper * u * v;
      pos.push(x, body.surfaceY(x, z) + lift, z);
      uv.push(u, 1 - v);
    }
  }
  for (let i = 0; i < nx; i++) {
    for (let k = 0; k < nz; k++) {
      const a = i * (nz + 1) + k;
      const b = a + 1;
      const c = a + nz + 1;
      const d = c + 1;
      index.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  // a face tem de olhar para cima: se a ordem saiu invertida, vira
  const n = g.attributes.normal as THREE.BufferAttribute;
  if (n.getY(0) < 0) {
    index.reverse();
    g.setIndex(index);
    g.computeVertexNormals();
  }
  return g;
}

/** Aerofólio alto sobre a tampa do porta-malas: perfil de asa estendido. */
function wing() {
  const s = new THREE.Shape();
  s.moveTo(-0.17, 0);
  s.quadraticCurveTo(-0.1, 0.05, 0.05, 0.035);
  s.quadraticCurveTo(0.14, 0.025, 0.17, 0.0);
  s.quadraticCurveTo(0.05, 0.005, -0.17, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.56, bevelEnabled: false, curveSegments: 6 });
  g.translate(0, 0, -0.78).rotateZ(0.1).translate(2.0, 1.25, 0);
  return g;
}

/** Uma roda: pneu, lateral, disco de freio, pinça vermelha e a roda de cinco raios. */
function Wheel({ x, side, m }: { x: number; side: 1 | -1; m: CarMats }) {
  const geo = useMemo(
    () => ({
      tire: crease(
        cyl(WHEEL.r, WHEEL.r, WHEEL.w, [0, 0, 0], { seg: 28, rot: [HALF_PI, 0, 0] }),
        50,
      ),
      face: new THREE.CircleGeometry(WHEEL.r * 0.985, 28),
      rim: new THREE.CircleGeometry(WHEEL.r * 0.7, 28),
      disc: cyl(0.16, 0.16, 0.025, [0, 0, 0], { seg: 24, rot: [HALF_PI, 0, 0] }),
      caliper: rbox([0.09, 0.12, 0.05], [-0.1, 0.08, 0], 0.015),
    }),
    [],
  );
  const out = (WHEEL.w / 2 + 0.002) * side;
  const faceRot: P = [0, side > 0 ? 0 : Math.PI, 0];
  return (
    <group position={[x, WHEEL.r, WHEEL.z * side]}>
      <mesh geometry={geo.tire} material={m.rubber} />
      <mesh geometry={geo.face} material={m.tireSide} position={[0, 0, out]} rotation={faceRot} />
      <mesh geometry={geo.disc} material={m.disc} position={[0, 0, out - 0.05 * side]} />
      <mesh geometry={geo.caliper} material={m.caliper} position={[0, 0, out - 0.03 * side]} />
      <mesh
        geometry={geo.rim}
        material={m.rim}
        position={[0, 0, out + 0.006 * side]}
        rotation={faceRot}
      />
    </group>
  );
}

/**
 * Sedã esportivo no formato do Lancer Evolution da referência, amarelo
 * metálico, sem marca nem emblema: para-lamas alargados, capô com as
 * saídas de ar, grade em escudo, boca grande com o intercooler à mostra,
 * faróis nas quinas, aerofólio alto, escapamento grande e rodas de cinco
 * raios com pinças vermelhas. Clicando no carro, a câmera vai até ele; aí:
 * capô (skills no motor), porta (entra: rádio com os contatos e
 * porta-luvas com o currículo) e faróis (ligam e desligam).
 */
export function Car() {
  const m = useCarMaterials();
  const view = useScene((s) => s.view);
  const headlights = useScene((s) => s.headlights);
  const setView = useScene((s) => s.setView);
  const hood = useRef<THREE.Group>(null);
  const door = useRef<THREE.Group>(null);
  const atCar = view === 'carro';

  const geo = useMemo(() => {
    const body = buildCarBody();
    const hx = HOOD_HINGE.x;
    const hy = HOOD_HINGE.y;
    // peças do capô em coordenadas da dobradiça
    const onHood = (g: THREE.BufferGeometry) => g.translate(-hx, -hy, 0);
    const front = FRONT_X - 0.004;
    const rear = REAR_X + 0.004;
    return {
      ...body,
      // fundo do carro e os forros escuros das caixas de roda
      under: box([4.2, 0.02, 1.26], [(FRONT_X + REAR_X) / 2, 0.2, 0]),
      wells: join(
        [AXLE.front, AXLE.rear].flatMap((x) =>
          [1, -1].map((s) =>
            new THREE.CylinderGeometry(0.39, 0.39, 0.24, 18, 1, true, -HALF_PI, Math.PI)
              .rotateX(HALF_PI)
              .translate(x, WHEEL.r, (WHEEL.z - 0.02) * s),
          ),
        ),
      ),
      // faróis nas quinas de cima do bico, acompanhando a curva
      headL: surfacePatch(body, [-2.235, -2.03], [0.3, 0.76], 0.006, 0.07),
      headR: surfacePatch(body, [-2.235, -2.03], [-0.3, -0.76], 0.006, 0.07),
      // frente: grade em escudo, boca de baixo com o intercooler, lábio e faróis de neblina
      shield: new THREE.PlaneGeometry(0.62, 0.17).rotateY(-HALF_PI).translate(front, 0.45, 0),
      mouthMesh: new THREE.PlaneGeometry(1.14, 0.17)
        .rotateY(-HALF_PI)
        .translate(front - 0.002, 0.27, 0),
      lip: join([
        box([0.16, 0.025, 1.5], [FRONT_X + 0.05, 0.165, 0]),
        box([0.05, 0.05, 0.12], [front, 0.27, 0.62]),
        box([0.05, 0.05, 0.12], [front, 0.27, -0.62]),
      ]),
      // moldura preta da boca de baixo e as caixinhas dos faróis de neblina
      mouthFrame: join([
        box([0.03, 0.025, 1.2], [front, 0.36, 0]),
        box([0.03, 0.025, 1.2], [front, 0.18, 0]),
        box([0.03, 0.2, 0.025], [front, 0.27, 0.59]),
        box([0.03, 0.2, 0.025], [front, 0.27, -0.59]),
      ]),
      fogHousings: join([
        box([0.03, 0.1, 0.14], [front, 0.29, 0.68]),
        box([0.03, 0.1, 0.14], [front, 0.29, -0.68]),
      ]),
      fogs: join([
        new THREE.CircleGeometry(0.036, 16).rotateY(-HALF_PI).translate(front - 0.017, 0.29, 0.68),
        new THREE.CircleGeometry(0.036, 16).rotateY(-HALF_PI).translate(front - 0.017, 0.29, -0.68),
      ]),
      // traseira: lanternas largas, placa lisa, difusor e o escapamento grande
      tails: join([
        new THREE.PlaneGeometry(0.48, 0.13).rotateY(HALF_PI).translate(rear, 0.82, 0.55),
        new THREE.PlaneGeometry(0.48, 0.13)
          .scale(-1, 1, 1)
          .rotateY(HALF_PI)
          .translate(rear, 0.82, -0.55),
      ]),
      plate: new THREE.PlaneGeometry(0.52, 0.12).rotateY(HALF_PI).translate(rear, 0.55, 0),
      diffuser: join([
        box([0.2, 0.06, 1.3], [REAR_X - 0.06, 0.27, 0]),
        ...[-0.4, -0.2, 0, 0.2, 0.4].map((z) => box([0.18, 0.08, 0.012], [REAR_X - 0.05, 0.24, z])),
      ]),
      exhaust: join([
        cyl(0.06, 0.06, 0.2, [REAR_X - 0.02, 0.3, -0.5], { seg: 16, rot: [0, 0, HALF_PI] }),
      ]),
      exhaustIn: cyl(0.045, 0.045, 0.01, [REAR_X + 0.081, 0.3, -0.5], {
        seg: 14,
        rot: [0, 0, HALF_PI],
      }),
      wing: wing(),
      wingStands: join([
        rbox([0.12, 0.27, 0.03], [1.98, 1.11, 0.52], 0.01),
        rbox([0.12, 0.27, 0.03], [1.98, 1.11, -0.52], 0.01),
        rbox([0.38, 0.14, 0.015], [2.0, 1.23, 0.79], 0.005),
        rbox([0.38, 0.14, 0.015], [2.0, 1.23, -0.79], 0.005),
      ]),
      // retrovisores (na quina do vidro) e maçanetas
      mirrors: join(
        [1, -1].flatMap((s) => [
          crease(rbox([0.15, 0.1, 0.12], [-0.46, 1.0, 0.98 * s], 0.035), 40),
          box([0.06, 0.03, 0.12], [-0.46, 0.95, 0.9 * s]),
        ]),
      ),
      handles: join([
        box([0.12, 0.025, 0.02], [0.86, 0.81, -0.885]),
        box([0.12, 0.025, 0.02], [0.86, 0.81, 0.885]),
        box([0.12, 0.025, 0.02], [0.24, 0.79, -0.88]),
      ]),
      doorHandle: box([0.12, 0.025, 0.02], [0.8, 0.29, 0.012]),
      doorCard: new THREE.PlaneGeometry(0.86, 0.44).rotateY(Math.PI).translate(0.46, 0.18, -0.08),
      // capô: tomada de ar no meio e as duas saídas de ar
      // tomada de ar elevada no meio do capô, com a boca escura virada para a frente
      scoop: onHood(
        crease(
          new RoundedBoxGeometry(0.3, 0.07, 0.46, 3, 0.03)
            .rotateZ(0.09)
            .translate(-1.72, body.surfaceY(-1.72, 0) + 0.012, 0),
          40,
        ),
      ),
      scoopMouth: onHood(
        new THREE.PlaneGeometry(0.4, 0.04)
          .rotateY(-HALF_PI)
          .translate(-1.873, body.surfaceY(-1.72, 0) + 0.02, 0),
      ),
      vents: onHood(
        join([
          surfacePatch(body, [-1.5, -1.2], [0.24, 0.5], 0.004),
          surfacePatch(body, [-1.5, -1.2], [-0.24, -0.5], 0.004),
        ]),
      ),
    };
  }, []);

  // capô e porta abrem conforme o plano da câmera; faróis acendem
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-delta * 5);
    if (hood.current) {
      const target = view === 'motor' ? -1.05 : 0;
      hood.current.rotation.z += (target - hood.current.rotation.z) * k;
    }
    if (door.current) {
      const target = view === 'interior' ? -1.05 : 0;
      door.current.rotation.y += (target - door.current.rotation.y) * k;
    }
    m.headlight.emissiveIntensity +=
      ((headlights ? 2.6 : 0.06) - m.headlight.emissiveIntensity) * k;
    m.fog.emissiveIntensity += ((headlights ? 1.8 : 0.15) - m.fog.emissiveIntensity) * k;
    m.taillight.emissiveIntensity += ((headlights ? 1.3 : 0.4) - m.taillight.emissiveIntensity) * k;
  });

  return (
    <Interactive
      id="car"
      label="objects.car"
      enabled={view === 'home'}
      onClick={() => setView('carro')}
    >
      <group name="car">
        <mesh geometry={geo.body} material={m.paint} />
        <mesh geometry={geo.body} material={m.paintInner} />
        <mesh geometry={geo.trim} material={m.trim} />
        <mesh geometry={geo.glass} material={m.glass} renderOrder={2} />
        <mesh geometry={geo.under} material={m.matte} />
        <mesh geometry={geo.wells} material={m.matte} />
        <mesh geometry={geo.shield} material={m.grille} />
        <mesh geometry={geo.mouthMesh} material={m.intercooler} />
        <mesh geometry={geo.mouthFrame} material={m.trim} />
        <mesh geometry={geo.fogHousings} material={m.matte} />
        <mesh geometry={geo.lip} material={m.matte} />
        <mesh geometry={geo.fogs} material={m.fog} />
        <mesh geometry={geo.tails} material={m.taillight} />
        <mesh geometry={geo.plate} material={m.matte} />
        <mesh geometry={geo.diffuser} material={m.matte} />
        <mesh geometry={geo.exhaust} material={m.chrome} />
        <mesh geometry={geo.exhaustIn} material={m.matte} />
        <mesh geometry={geo.wing} material={m.alu} />
        <mesh geometry={geo.wingStands} material={m.carbon} />
        <mesh geometry={geo.mirrors} material={m.paint} />
        <mesh geometry={geo.handles} material={m.trim} />
        {[AXLE.front, AXLE.rear].flatMap((x) =>
          ([1, -1] as const).map((side) => <Wheel key={`${x}${side}`} x={x} side={side} m={m} />),
        )}
        <Interactive
          id="headlights"
          label="objects.headlights"
          enabled={atCar}
          onClick={() => useScene.getState().toggleHeadlights()}
        >
          <group>
            <mesh geometry={geo.headL} material={m.headlight} />
            <mesh geometry={geo.headR} material={m.headlight} />
          </group>
        </Interactive>
        <Interactive
          id="hood"
          label="objects.hood"
          enabled={atCar}
          onClick={() => setView('motor')}
        >
          <group ref={hood} position={HOOD_HINGE.toArray()}>
            <mesh geometry={geo.hood} material={m.paint} />
            <mesh geometry={geo.hood} material={m.paintInner} />
            <mesh geometry={geo.scoop} material={m.paint} />
            <mesh geometry={geo.scoopMouth} material={m.mesh} />
            <mesh geometry={geo.vents} material={m.louvers} />
          </group>
        </Interactive>
        <Interactive
          id="door"
          label="objects.door"
          enabled={atCar}
          onClick={() => setView('interior')}
        >
          <group ref={door} position={DOOR_HINGE.toArray()}>
            <mesh geometry={geo.door} material={m.paint} />
            <mesh geometry={geo.door} material={m.paintInner} />
            <mesh geometry={geo.doorGlass} material={m.glass} renderOrder={2} />
            <mesh geometry={geo.doorTrim} material={m.trim} />
            <mesh geometry={geo.doorHandle} material={m.trim} />
            <mesh geometry={geo.doorCard} material={m.doorCard} />
          </group>
        </Interactive>
        <Engine m={m} />
        <Interior m={m} />
      </group>
    </Interactive>
  );
}
