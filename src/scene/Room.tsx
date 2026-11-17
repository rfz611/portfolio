import { useMemo } from 'react';
import * as THREE from 'three';
import { GARAGE, PASSAGE, PIT, ROOM } from '../config/layout';
import { retile } from '../textures/canvas';
import { lib } from '../textures/library';
import { box, flat, merge, ribbon, roundedRect, wall } from './geo';

const H = ROOM.h;
const W = ROOM.x1 - ROOM.x0;
const D = ROOM.z1 - ROOM.z0;
const GW = GARAGE.x1 - GARAGE.x0;
const TOTAL = GARAGE.x1 - ROOM.x0;
const MID_X = (ROOM.x0 + GARAGE.x1) / 2;

/**
 * A casca da cobertura: piso com a sala rebaixada, paredes, teto, vidros
 * e esquadrias. As paredes só têm a face de dentro, então a câmera do
 * plano inicial, que fica do lado de fora, enxerga através delas.
 */
export function Room() {
  const { mat, tex } = lib();

  const geo = useMemo(() => {
    const floorShape = new THREE.Shape();
    floorShape.moveTo(ROOM.x0, -ROOM.z1);
    floorShape.lineTo(ROOM.x1, -ROOM.z1);
    floorShape.lineTo(ROOM.x1, -ROOM.z0);
    floorShape.lineTo(ROOM.x0, -ROOM.z0);
    floorShape.closePath();
    floorShape.holes.push(roundedRect(PIT));

    const floor = merge([flat(floorShape, 0), flat(roundedRect(PIT), -PIT.depth)]);
    const risers = ribbon(roundedRect(PIT), 0, -PIT.depth);
    // fio de luz âmbar sob a borda do rebaixo
    const stepLight = ribbon(roundedRect(PIT), -0.025, -0.045, 1, 0.002);

    // sanca de mogno no encontro das paredes com o teto e rodapé alto
    const trim = merge([
      box([0.12, 0.16, D], [ROOM.x0 + 0.06, H - 0.08, 0]),
      box([W, 0.16, 0.12], [0, H - 0.08, ROOM.z1 - 0.06]),
      box([0.04, 0.14, D], [ROOM.x0 + 0.02, 0.07, 0]),
      box([W, 0.14, 0.04], [0, 0.07, ROOM.z1 - 0.02]),
    ]);

    // esquadrias de bronze: fachada de vidro (norte) e divisória da garagem
    const frames: THREE.BufferGeometry[] = [
      box([TOTAL, 0.22, 0.16], [MID_X, H - 0.11, ROOM.z0]),
      box([TOTAL, 0.07, 0.16], [MID_X, 0.035, ROOM.z0]),
      box([0.12, 0.22, D], [ROOM.x1, H - 0.11, 0]),
      box([0.1, 0.06, PASSAGE.z0 - ROOM.z0], [ROOM.x1, 0.03, (PASSAGE.z0 + ROOM.z0) / 2]),
      box([0.1, 0.06, ROOM.z1 - PASSAGE.z1], [ROOM.x1, 0.03, (PASSAGE.z1 + ROOM.z1) / 2]),
      box(
        [0.1, 0.08, PASSAGE.z1 - PASSAGE.z0],
        [ROOM.x1, PASSAGE.h + 0.04, (PASSAGE.z0 + PASSAGE.z1) / 2],
      ),
    ];
    for (let x = ROOM.x0; x <= GARAGE.x1 + 0.01; x += 1.5) {
      frames.push(box([0.07, H, 0.12], [Math.min(x, GARAGE.x1), H / 2, ROOM.z0]));
    }
    frames.push(box([0.07, H, 0.12], [GARAGE.x1, H / 2, ROOM.z0]));
    for (const z of [-3, -1.5, 0, PASSAGE.z0, PASSAGE.z1, ROOM.z1]) {
      frames.push(box([0.09, H, 0.09], [ROOM.x1, H / 2, z]));
    }

    const glassNorth = wall(TOTAL, H, [MID_X, H / 2, ROOM.z0], 0);
    const glassDivider = merge([
      wall(PASSAGE.z0 - ROOM.z0, H, [ROOM.x1, H / 2, (PASSAGE.z0 + ROOM.z0) / 2], Math.PI / 2),
      wall(ROOM.z1 - PASSAGE.z1, H, [ROOM.x1, H / 2, (PASSAGE.z1 + ROOM.z1) / 2], Math.PI / 2),
      wall(
        PASSAGE.z1 - PASSAGE.z0,
        H - PASSAGE.h - 0.3,
        [ROOM.x1, (H + PASSAGE.h) / 2 - 0.07, (PASSAGE.z0 + PASSAGE.z1) / 2],
        Math.PI / 2,
      ),
    ]);

    const ceilingRoom = new THREE.PlaneGeometry(W, D);
    ceilingRoom.rotateX(Math.PI / 2);
    ceilingRoom.translate(0, H, 0);
    const ceilingGarage = new THREE.PlaneGeometry(GW, D);
    ceilingGarage.rotateX(Math.PI / 2);
    ceilingGarage.translate((GARAGE.x0 + GARAGE.x1) / 2, H, 0);

    const garageFloor = new THREE.PlaneGeometry(GW, D);
    const guv = garageFloor.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < guv.count; i++) guv.setXY(i, guv.getX(i) * GW, guv.getY(i) * D);
    garageFloor.rotateX(-Math.PI / 2);
    garageFloor.translate((GARAGE.x0 + GARAGE.x1) / 2, 0, 0);

    // luminárias embutidas no teto (só o ponto de luz aparece)
    const spots: THREE.BufferGeometry[] = [];
    for (const [x, z] of [
      [-3.35, -2.4],
      [-2.2, 3.4],
      [4.3, 1.2],
      [-0.4, -3.4],
      [-4.6, -0.45],
    ]) {
      const g = new THREE.CircleGeometry(0.055, 12);
      g.rotateX(Math.PI / 2);
      g.translate(x, H - 0.004, z);
      spots.push(g);
    }

    return {
      floor,
      risers,
      stepLight,
      trim,
      frames: merge(frames),
      glassNorth,
      glassDivider,
      ceilingRoom,
      ceilingGarage,
      garageFloor,
      spots: merge(spots),
      west: wall(D, H, [ROOM.x0, H / 2, 0], Math.PI / 2),
      south: wall(W, H, [0, H / 2, ROOM.z1], Math.PI),
      garageEast: wall(D, H, [GARAGE.x1, H / 2, 0], -Math.PI / 2),
      garageSouth: wall(GW, H, [(GARAGE.x0 + GARAGE.x1) / 2, H / 2, ROOM.z1], Math.PI),
      fascia: wall(TOTAL + 0.2, 1.1, [MID_X, -0.55, ROOM.z1 + 0.01], 0),
    };
  }, []);

  const walls = useMemo(() => {
    const wallMat = (repeat: number) =>
      new THREE.MeshStandardMaterial({
        map: retile(tex.wall, repeat, 1),
        roughness: 0.58,
        envMapIntensity: 0.55,
      });
    const garageMat = (repeat: number) =>
      new THREE.MeshLambertMaterial({ map: retile(tex.garageWall, repeat, 1) });
    const ceilingGarage = new THREE.MeshLambertMaterial({ color: '#08080c' });
    return {
      west: wallMat(D / 1.2),
      south: wallMat(W / 1.2),
      garageEast: garageMat(D / 3),
      garageSouth: garageMat(GW / 3.5),
      ceilingGarage,
    };
  }, [tex]);

  return (
    <group name="room">
      <mesh geometry={geo.floor} material={mat.carpet} />
      <mesh geometry={geo.risers} material={mat.carpetRiser} />
      <mesh geometry={geo.stepLight} material={mat.amberStrip} />
      <mesh geometry={geo.trim} material={mat.mahoganyDark} />
      <mesh geometry={geo.west} material={walls.west} />
      <mesh geometry={geo.south} material={walls.south} />
      <mesh geometry={geo.ceilingRoom} material={mat.ceiling} />
      <mesh geometry={geo.frames} material={mat.bronze} />
      <mesh geometry={geo.glassNorth} material={mat.glass} renderOrder={2} />
      <mesh geometry={geo.glassDivider} material={mat.glass} renderOrder={3} />

      <mesh geometry={geo.garageFloor} material={mat.concrete} name="garage-floor" />
      <mesh geometry={geo.garageEast} material={walls.garageEast} />
      <mesh geometry={geo.garageSouth} material={walls.garageSouth} />
      <mesh geometry={geo.ceilingGarage} material={walls.ceilingGarage} />
      <mesh geometry={geo.fascia} material={mat.fascia} />
    </group>
  );
}
