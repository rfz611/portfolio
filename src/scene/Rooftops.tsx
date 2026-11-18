import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { makeCanvas, tex } from '../textures/canvas';
import { paintNoirWindows, paintPartyGlow, paintRooftopSign } from '../textures/city';
import { hdr } from '../textures/library';
import { mulberry32 } from '../textures/random';
import { FACADE_UV, GROUND_Y, ROOFTOPS, type Rooftop } from './cityLayout';
import { box, cyl, merge } from './geo';

type Mats = ReturnType<typeof useRoofMats>;

function useRoofMats() {
  return useMemo(
    () => ({
      // prédio antigo de tijolo, janelas quentes e poucas acesas
      brick: new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(256, 256, (c, w, h) => paintNoirWindows(c, w, h, 263, 0.2)),
          { aniso: 8 },
        ),
        color: '#c98a68',
      }),
      // hotel moderno: janelas mais claras e frias, muitas acesas
      hotel: new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(256, 256, (c, w, h) => paintNoirWindows(c, w, h, 251, 0.45)),
          { aniso: 8 },
        ),
        color: '#b4bfd6',
      }),
      crown: new THREE.MeshBasicMaterial({ color: hdr('#e8c48a', 0.95), toneMapped: false }),
      tank: new THREE.MeshBasicMaterial({ color: '#1d1714' }),
      door: new THREE.MeshBasicMaterial({ color: hdr('#ffb36a', 1.3), toneMapped: false }),
      slab: new THREE.MeshBasicMaterial({ color: '#141015' }),
      deck: new THREE.MeshBasicMaterial({ color: '#7a4a28' }),
      darkDeck: new THREE.MeshBasicMaterial({ color: '#2a1630' }),
      wood: new THREE.MeshBasicMaterial({ color: '#2a150b' }),
      people: new THREE.MeshBasicMaterial({ color: '#060405' }),
      bulb: new THREE.MeshBasicMaterial({ color: hdr('#ffc27a', 2.2), toneMapped: false }),
      shelf: new THREE.MeshBasicMaterial({ color: hdr('#d27a36', 0.95), toneMapped: false }),
      lantern: new THREE.MeshBasicMaterial({ color: hdr('#ff3420', 2.2), toneMapped: false }),
      violet: new THREE.MeshBasicMaterial({ color: hdr('#b45cff', 2), toneMapped: false }),
      booth: new THREE.MeshBasicMaterial({ color: hdr('#4fd8ff', 1.6), toneMapped: false }),
    }),
    [],
  );
}

/** Figura de gente vista de longe: corpo e cabeça (1,8 m). */
function figure(x: number, z: number, scale = 1) {
  return merge([
    cyl(0.2 * scale, 0.27 * scale, 1.45 * scale, [x, 0.73 * scale, z], { seg: 6 }),
    new THREE.SphereGeometry(0.17 * scale, 6, 4).translate(x, 1.62 * scale, z),
  ]);
}

/** Lâmpadas penduradas numa curva (varal), de a até b, com a barriga no meio. */
function stringLights(a: THREE.Vector3, b: THREE.Vector3, sag: number, step: number) {
  const n = Math.max(2, Math.round(a.distanceTo(b) / step));
  const bulbs: THREE.BufferGeometry[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = a.clone().lerp(b, t);
    p.y -= sag * 4 * t * (1 - t);
    bulbs.push(new THREE.SphereGeometry(0.2, 6, 4).translate(p.x, p.y, p.z));
  }
  return merge(bulbs);
}

/**
 * Prédio de cada cobertura, bem diferentes entre si: o do bar é antigo e
 * baixo, de tijolo, com cornija larga, caixa d'água sobre pés e a casinha
 * da escada com a porta acesa; o do hotel é moderno, de janelas claras, com
 * uma faixa de luz em volta do topo.
 */
function Building({ roof, mats }: { roof: Rooftop; mats: Mats }) {
  const [w, d] = roof.size;
  const old = roof.kind === 'bar';
  const geo = useMemo(() => {
    const height = roof.top - GROUND_Y;
    const parapet = old ? 1.0 : 1.3;
    const extras: THREE.BufferGeometry[] = [];
    if (old) {
      // caixa d'água de madeira sobre pés, no canto de trás à esquerda
      const tx = -w / 2 + 3;
      const tz = -d / 2 + 3;
      extras.push(cyl(1.6, 1.6, 2.8, [tx, 4.4, tz], { seg: 10 }));
      extras.push(new THREE.ConeGeometry(1.8, 0.9, 10).translate(tx, 6.25, tz));
      for (const [lx, lz] of [
        [-1.1, -1.1],
        [1.1, -1.1],
        [-1.1, 1.1],
        [1.1, 1.1],
      ]) {
        extras.push(box([0.2, 3, 0.2], [tx + lx, 1.5, tz + lz]));
      }
      // casinha da escada no canto de trás à direita
      extras.push(box([3.6, 3, 3.2], [w / 2 - 3, 1.5, -d / 2 + 2.8]));
    }
    return {
      body: box([w, height, d], [0, -height / 2, 0], { uv: FACADE_UV }),
      slab: old
        ? box([w + 1.6, 1.0, d + 1.6], [0, -0.52, 0])
        : box([w + 0.4, 0.4, d + 0.4], [0, -0.22, 0]),
      parapet: merge([
        box([w, parapet, 0.4], [0, parapet / 2, d / 2 - 0.2]),
        box([w, parapet, 0.4], [0, parapet / 2, -d / 2 + 0.2]),
        box([0.4, parapet, d], [w / 2 - 0.2, parapet / 2, 0]),
        box([0.4, parapet, d], [-w / 2 + 0.2, parapet / 2, 0]),
      ]),
      extras: extras.length ? merge(extras) : null,
      door: old
        ? new THREE.PlaneGeometry(1.1, 2.1).translate(w / 2 - 3, 1.05, -d / 2 + 4.41)
        : null,
      // faixa de luz em volta do topo do hotel
      crown: old
        ? null
        : merge([
            box([w + 0.5, 0.35, 0.1], [0, -1.6, d / 2 + 0.2]),
            box([w + 0.5, 0.35, 0.1], [0, -1.6, -d / 2 - 0.2]),
            box([0.1, 0.35, d + 0.5], [w / 2 + 0.2, -1.6, 0]),
            box([0.1, 0.35, d + 0.5], [-w / 2 - 0.2, -1.6, 0]),
          ]),
      deck: new THREE.PlaneGeometry(w - 1.2, d - 1.2).rotateX(-Math.PI / 2).translate(0, 0.06, 0),
    };
  }, [w, d, roof.top, old]);
  return (
    <>
      <mesh geometry={geo.body} material={old ? mats.brick : mats.hotel} />
      <mesh geometry={geo.slab} material={mats.slab} />
      <mesh geometry={geo.parapet} material={mats.slab} />
      <mesh geometry={geo.deck} material={old ? mats.deck : mats.darkDeck} />
      {geo.extras && <mesh geometry={geo.extras} material={mats.tank} />}
      {geo.door && <mesh geometry={geo.door} material={mats.door} />}
      {geo.crown && <mesh geometry={geo.crown} material={mats.crown} />}
    </>
  );
}

/**
 * Bar na cobertura: deck de madeira, balcão sob uma pérgola de ripas com a
 * prateleira de garrafas acesa embaixo, letreiro de neon em cima, varais de
 * lâmpadas, mesinhas com vela e gente em pé conversando.
 */
function RoofBar({ roof, mats }: { roof: Rooftop; mats: Mats }) {
  const [w, d] = roof.size;
  const sign = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(
          makeCanvas(512, 168, (c, cw, ch) => paintRooftopSign(c, cw, ch, 'bar')),
          {
            clamp: true,
          },
        ),
        color: hdr('#ffffff', 1.1),
        toneMapped: false,
        transparent: true,
      }),
    [],
  );
  const geo = useMemo(() => {
    const r = mulberry32(4411);
    const back = -d / 2 + 4;
    const lines: THREE.BufferGeometry[] = [];
    const posts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 5; k++) {
      const z = back + 4.5 + k * ((d - 10.5) / 4);
      const a = new THREE.Vector3(-w / 2 + 2, 4.2, z);
      const b = new THREE.Vector3(w / 2 - 2, 4.2, z);
      lines.push(stringLights(a, b, 1.1, 1.5));
      posts.push(cyl(0.1, 0.12, 4.3, [a.x, 2.15, z], { seg: 6 }));
      posts.push(cyl(0.1, 0.12, 4.3, [b.x, 2.15, z], { seg: 6 }));
    }
    const tables: THREE.BufferGeometry[] = [];
    const candles: THREE.BufferGeometry[] = [];
    const people: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 8; k++) {
      const x = -w / 2 + 5 + (k % 4) * ((w - 10) / 3) + (r() - 0.5) * 2;
      const z = back + 8 + Math.floor(k / 4) * 9 + (r() - 0.5) * 2;
      tables.push(cyl(0.6, 0.15, 1.05, [x, 0.52, z], { seg: 10 }));
      candles.push(new THREE.SphereGeometry(0.12, 6, 4).translate(x, 1.15, z));
      // duas ou três pessoas em volta de cada mesa
      const around = 2 + Math.floor(r() * 2);
      for (let p = 0; p < around; p++) {
        const a = r() * Math.PI * 2;
        people.push(figure(x + Math.cos(a) * 1.1, z + Math.sin(a) * 1.1, 0.95 + r() * 0.1));
      }
    }
    // gente encostada no balcão
    for (let k = 0; k < 6; k++) {
      people.push(figure(-5 + k * 2 + (r() - 0.5), back + 2.2, 0.95 + r() * 0.1));
    }
    return {
      bulbs: merge([...lines, ...candles]),
      posts: merge([...posts, ...tables]),
      people: merge(people),
      counter: box([10, 1.15, 1.4], [0, 0.58, back]),
      counterGlow: box([10, 0.08, 0.25], [0, 1.18, back + 0.6]),
      shelf: new THREE.PlaneGeometry(8, 0.9).translate(0, 1.7, back - 1.55),
      shelfBack: box([10, 2.6, 0.5], [0, 1.3, back - 1.85]),
      pergola: merge([
        ...[-5.4, 5.4].flatMap((px) => [
          box([0.22, 3.3, 0.22], [px, 1.65, back - 1.6]),
          box([0.22, 3.3, 0.22], [px, 1.65, back + 2.2]),
        ]),
        box([11.4, 0.22, 0.22], [0, 3.3, back - 1.6]),
        box([11.4, 0.22, 0.22], [0, 3.3, back + 2.2]),
        ...Array.from({ length: 9 }, (_, k) =>
          box([0.18, 0.14, 4.4], [-5 + k * 1.25, 3.45, back + 0.3]),
        ),
      ]),
      sign: new THREE.PlaneGeometry(7, 2.3).translate(0, 4.9, back - 1.7),
    };
  }, [w, d]);
  return (
    <>
      <mesh geometry={geo.shelfBack} material={mats.wood} />
      <mesh geometry={geo.pergola} material={mats.wood} />
      <mesh geometry={geo.shelf} material={mats.shelf} />
      <mesh geometry={geo.counter} material={mats.wood} />
      <mesh geometry={geo.counterGlow} material={mats.bulb} />
      <mesh geometry={geo.sign} material={sign} />
      <mesh geometry={geo.posts} material={mats.wood} />
      <mesh geometry={geo.bulbs} material={mats.bulb} />
      <mesh geometry={geo.people} material={mats.people} />
    </>
  );
}

const BEAMS: { color: string; x: number; tilt: number; phase: number }[] = [
  { color: '#ff2fd0', x: -6, tilt: 0.35, phase: 0 },
  { color: '#2fd8ff', x: -2, tilt: -0.25, phase: 1.7 },
  { color: '#9a52ff', x: 2, tilt: 0.25, phase: 3.1 },
  { color: '#ffb030', x: 6, tilt: -0.35, phase: 4.4 },
];
const CROWD = 54;

/**
 * Festa ao ar livre na cobertura: um pagode de madeira de dois telhados
 * sobre a cabine do DJ, lanternas vermelhas, pista com brilho colorido que
 * pulsa, gente dançando e feixes de luz coloridos balançando no céu.
 */
function RoofParty({ roof, mats }: { roof: Rooftop; mats: Mats }) {
  const [w, d] = roof.size;
  const stage = -d / 2 + 6;
  const glow = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: tex(makeCanvas(256, 256, paintPartyGlow), { clamp: true }),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const beamMats = useMemo(() => {
    // o feixe some aos poucos para cima (forte na base, nada na ponta)
    const fade = tex(
      makeCanvas(4, 256, (c, w, h) => {
        const g = c.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#000000');
        g.addColorStop(0.55, '#8a8a8a');
        g.addColorStop(1, '#ffffff');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }),
      { clamp: true },
    );
    return BEAMS.map(
      (b) =>
        new THREE.MeshBasicMaterial({
          color: b.color,
          map: fade,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          side: THREE.DoubleSide,
          fog: false,
        }),
    );
  }, []);
  const geo = useMemo(() => {
    const posts: THREE.BufferGeometry[] = [];
    for (const [px, pz] of [
      [-4.2, -2.6],
      [4.2, -2.6],
      [-4.2, 2.6],
      [4.2, 2.6],
    ]) {
      posts.push(cyl(0.22, 0.22, 4.6, [px, 3.1, stage + pz], { seg: 6 }));
    }
    const lanterns: THREE.BufferGeometry[] = [];
    for (const [lx, lz] of [
      [-5.6, -3.6],
      [5.6, -3.6],
      [-5.6, 3.6],
      [5.6, 3.6],
    ]) {
      lanterns.push(
        new THREE.SphereGeometry(0.42, 8, 6).scale(1, 1.3, 1).translate(lx, 4.9, stage + lz),
      );
    }
    // varal de lâmpadas roxas em volta da mureta
    const edge: THREE.BufferGeometry[] = [];
    for (let x = -w / 2 + 1; x <= w / 2 - 1; x += 2.2) {
      edge.push(new THREE.SphereGeometry(0.2, 6, 4).translate(x, 1.35, d / 2 - 0.3));
    }
    for (let z = -d / 2 + 1; z <= d / 2 - 1; z += 2.2) {
      edge.push(new THREE.SphereGeometry(0.2, 6, 4).translate(-w / 2 + 0.3, 1.35, z));
      edge.push(new THREE.SphereGeometry(0.2, 6, 4).translate(w / 2 - 0.3, 1.35, z));
    }
    return {
      platform: box([11, 0.8, 7], [0, 0.4, stage]),
      posts: merge(posts),
      roof1: new THREE.ConeGeometry(8.2, 2.3, 4, 1)
        .rotateY(Math.PI / 4)
        .scale(1, 1, 0.8)
        .translate(0, 6.5, stage),
      roof2: new THREE.ConeGeometry(4.8, 2.1, 4, 1)
        .rotateY(Math.PI / 4)
        .scale(1, 1, 0.8)
        .translate(0, 8.1, stage),
      spire: cyl(0.08, 0.2, 2.2, [0, 9.9, stage], { seg: 6 }),
      lanterns: merge(lanterns),
      booth: box([4.2, 1.1, 1.3], [0, 1.35, stage + 1.6]),
      edge: merge(edge),
      floor: new THREE.PlaneGeometry(w * 0.85, d * 0.75)
        .rotateX(-Math.PI / 2)
        .translate(0, 0.12, stage + d * 0.42),
      person: figure(0, 0),
      beam: new THREE.CylinderGeometry(3.4, 0.25, 48, 14, 1, true).translate(0, 24, 0),
    };
  }, [w, d, stage]);

  const crowd = useRef<THREE.InstancedMesh>(null);
  const spots = useMemo(() => {
    const r = mulberry32(5150);
    return Array.from({ length: CROWD }, () => ({
      x: (r() - 0.5) * (w - 8),
      z: stage + 6 + r() * (d - 13),
      phase: r() * Math.PI * 2,
      speed: 3.6 + r() * 1.4,
      scale: 0.92 + r() * 0.14,
    }));
  }, [w, d, stage]);
  const beams = useRef<(THREE.Mesh | null)[]>([]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const mesh = crowd.current;
    if (mesh) {
      spots.forEach((s, i) => {
        dummy.position.set(s.x, Math.abs(Math.sin(t * s.speed + s.phase)) * 0.22, s.z);
        dummy.scale.setScalar(s.scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    // a pista pulsa no ritmo (uns 124 batidas por minuto)
    const beat = Math.pow(0.5 + 0.5 * Math.cos(t * Math.PI * 2 * (124 / 60)), 3);
    glow.opacity = 0.45 + beat * 0.45;
    beams.current.forEach((beam, i) => {
      if (!beam) return;
      const b = BEAMS[i];
      beam.rotation.z = b.tilt + Math.sin(t * 0.7 + b.phase) * 0.35;
      beam.rotation.x = Math.sin(t * 0.5 + b.phase * 1.3) * 0.3;
    });
  });

  return (
    <>
      <mesh geometry={geo.floor} material={glow} />
      <mesh geometry={geo.platform} material={mats.wood} />
      <mesh geometry={geo.posts} material={mats.wood} />
      <mesh geometry={geo.roof1} material={mats.wood} />
      <mesh geometry={geo.roof2} material={mats.wood} />
      <mesh geometry={geo.spire} material={mats.wood} />
      <mesh geometry={geo.lanterns} material={mats.lantern} />
      <mesh geometry={geo.booth} material={mats.booth} />
      <mesh geometry={geo.edge} material={mats.violet} />
      <instancedMesh ref={crowd} args={[geo.person, mats.people, CROWD]} frustumCulled={false} />
      {BEAMS.map((b, i) => (
        <mesh
          key={i}
          ref={(m) => {
            beams.current[i] = m;
          }}
          geometry={geo.beam}
          material={beamMats[i]}
          position={[b.x, 1.9, stage + 1]}
        />
      ))}
    </>
  );
}

/** Coberturas vivas na frente da janela (bar e festa). */
export function Rooftops() {
  const mats = useRoofMats();
  return (
    <group name="rooftops">
      {ROOFTOPS.map((roof) => (
        <group
          key={roof.kind}
          position={[roof.at[0], roof.top, roof.at[1]]}
          rotation={[0, roof.yaw, 0]}
        >
          <Building roof={roof} mats={mats} />
          {roof.kind === 'bar' ? (
            <RoofBar roof={roof} mats={mats} />
          ) : (
            <RoofParty roof={roof} mats={mats} />
          )}
        </group>
      ))}
    </group>
  );
}
