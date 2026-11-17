import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { playIce, playPour } from '../audio/player';
import { box, cyl, lathe } from '../scene/geo';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { LABELS, paintLabel } from '../textures/labels';
import { lib } from '../textures/library';
import { GhostPerfume } from './GhostPerfume';
import { Interactive } from './Interactive';

const HALF_PI = Math.PI / 2;
/** Tampo do balcão (em relação ao grupo do bar) e onde o copo fica. */
const TOP = 1.07;
const GLASS: [number, number, number] = [-0.25, TOP, 0.16];
/** Garrafa parada no balcão antes de servir. */
const BOTTLE_REST: [number, number, number] = [0.08, TOP, 0.08];

type Kind = 'whisky' | 'martini' | 'negroni';

const DRINKS: Record<Kind, { liquid: string; label: number; glass: string; level: number }> = {
  whisky: { liquid: '#a85a12', label: 1, glass: '#7a3c10', level: 0.035 },
  martini: { liquid: '#d9e4e6', label: 3, glass: '#b9c7d2', level: 1 },
  negroni: { liquid: '#a3121f', label: 2, glass: '#5a0d12', level: 0.05 },
};

/**
 * Serviço do bar: escolhido o drink no cardápio, a garrafa sobe e inclina
 * sobre o copo, o filete escorre (com som), o gelo cai tilintando (uísque
 * e negroni), entra a azeitona (martini) ou a fatia de laranja (negroni)
 * e o copo desliza na direção de quem pediu. Ao lado, o perfume.
 */
export function BarService() {
  const { mat } = lib();
  const atBar = useScene((s) => s.view === 'bar');
  const drink = useScene((s) => s.drink);

  const bottle = useRef<THREE.Group>(null!);
  const glassGroup = useRef<THREE.Group>(null!);
  const liquid = useRef<THREE.Mesh>(null!);
  const coneLiquid = useRef<THREE.Mesh>(null!);
  const stream = useRef<THREE.Mesh>(null!);
  const ice = useRef<THREE.Group>(null!);
  const olive = useRef<THREE.Group>(null!);
  const orange = useRef<THREE.Mesh>(null!);
  const rocks = useRef<THREE.Group>(null!);
  const coupe = useRef<THREE.Group>(null!);

  const geo = useMemo(
    () => ({
      rocks: lathe(
        [
          [0.001, 0.004],
          [0.04, 0.004],
          [0.043, 0.095],
        ],
        { seg: 18 },
      ),
      rocksBase: cyl(0.04, 0.04, 0.008, [0, 0.004, 0], { seg: 18 }),
      martini: lathe(
        [
          [0.036, 0],
          [0.034, 0.004],
          [0.004, 0.008],
          [0.0035, 0.095],
          [0.062, 0.155],
        ],
        { seg: 18 },
      ),
      // líquido que cresce a partir do fundo (escala em y)
      liquid: cyl(0.0385, 0.039, 1, [0, 0.5, 0], { seg: 18 }).translate(0, 0.008, 0),
      cone: lathe(
        [
          [0.002, 0],
          [0.05, 0.048],
          [0.001, 0.048],
        ],
        { seg: 18 },
      ),
      cube: box([0.024, 0.024, 0.024]),
      olive: new THREE.SphereGeometry(0.011, 10, 8),
      pick: cyl(0.001, 0.001, 0.1, [0.012, 0.03, 0], { seg: 4, rot: [0, 0, -0.5] }),
      orange: new THREE.CylinderGeometry(0.035, 0.035, 0.006, 16, 1, false, 0, Math.PI).rotateX(
        HALF_PI,
      ),
      stream: cyl(0.0035, 0.0035, 1, [0, -0.5, 0], { seg: 6 }),
      bottle: lathe(
        [
          [0.001, 0],
          [0.04, 0],
          [0.04, 0.19],
          [0.03, 0.23],
          [0.013, 0.26],
          [0.013, 0.31],
        ],
        { seg: 14 },
      ),
      label: new THREE.CylinderGeometry(0.0415, 0.0415, 0.075, 14, 1, true)
        .rotateY(Math.PI)
        .translate(0, 0.11, 0),
      cap: cyl(0.015, 0.015, 0.022, [0, 0.32, 0], { seg: 8 }),
    }),
    [],
  );

  const glassMat = useMemo(() => {
    const m = mat.clearGlass.clone();
    m.side = THREE.DoubleSide;
    m.opacity = 0.32;
    return m;
  }, [mat]);
  const liquidMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: DRINKS.whisky.liquid,
        roughness: 0.1,
        transparent: true,
        opacity: 0.88,
        envMapIntensity: 1.2,
      }),
    [],
  );
  const bottleMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: DRINKS.whisky.glass,
        roughness: 0.08,
        transparent: true,
        opacity: 0.85,
        envMapIntensity: 1.8,
      }),
    [],
  );
  const labelMats = useMemo(
    () =>
      LABELS.map(
        (style) =>
          new THREE.MeshStandardMaterial({
            map: tex(
              makeCanvas(256, 64, (c, w, h) => paintLabel(c, w, h, style)),
              { clamp: true },
            ),
            roughness: 0.6,
          }),
      ),
    [],
  );
  const labelMesh = useRef<THREE.Mesh>(null!);
  const orangeMat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#e08a2a' }), []);

  // ao sair do bar, tudo volta ao lugar e o copo esvazia
  useEffect(() => {
    if (atBar) return;
    reset();
    useScene.getState().setDrinkServed(false);
  }, [atBar]);

  function reset() {
    bottle.current.position.set(...BOTTLE_REST);
    bottle.current.rotation.set(0, 0, 0);
    glassGroup.current.position.set(...GLASS);
    liquid.current.scale.y = 0.0001;
    coneLiquid.current.scale.set(0.0001, 0.0001, 0.0001);
    stream.current.scale.y = 0.0001;
    stream.current.visible = false;
    ice.current.children.forEach((c) => (c.position.y = 0.4));
    ice.current.visible = false;
    olive.current.position.y = 0.35;
    olive.current.visible = false;
    orange.current.visible = false;
  }

  useEffect(() => {
    if (!drink) return;
    const kind = drink.kind;
    const recipe = DRINKS[kind];
    reset();
    const isMartini = kind === 'martini';
    rocks.current.visible = !isMartini;
    coupe.current.visible = isMartini;
    liquidMat.color.set(recipe.liquid);
    bottleMat.color.set(recipe.glass);
    labelMesh.current.material = labelMats[recipe.label];

    // bico da garrafa inclinada fica logo acima do copo
    const tilt = 1.9;
    const height = 0.31;
    const [gx, gy, gz] = GLASS;
    const baseX = gx + Math.sin(tilt) * height + 0.008;
    const baseY = gy + 0.27;
    const tipY = baseY + Math.cos(tilt) * height;
    const stopY = isMartini ? gy + 0.13 : gy + 0.03;

    const t = gsap.timeline();
    if (!isMartini) {
      t.call(() => {
        ice.current.visible = true;
      });
      ice.current.children.forEach((cube, i) => {
        t.to(
          cube.position,
          {
            y: 0.025 + i * 0.018,
            duration: 0.35,
            ease: 'bounce.out',
            onStart: i === 0 ? playIce : undefined,
          },
          i * 0.15,
        );
      });
    }
    t.to(
      bottle.current.position,
      { x: baseX, y: baseY, z: gz, duration: 0.6, ease: 'power2.inOut' },
      0.35,
    );
    t.to(bottle.current.rotation, { z: tilt, duration: 0.55, ease: 'power2.inOut' }, 0.45);
    t.call(
      () => {
        stream.current.visible = true;
        stream.current.position.set(gx + 0.008, tipY, gz);
        playPour();
      },
      [],
      1.0,
    );
    t.to(stream.current.scale, { y: tipY - stopY, duration: 0.15 }, 1.0);
    if (isMartini) {
      t.to(coneLiquid.current.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: 'power1.out' }, 1.1);
    } else {
      t.to(liquid.current.scale, { y: recipe.level, duration: 1.2, ease: 'power1.out' }, 1.1);
    }
    t.call(
      () => {
        stream.current.visible = false;
      },
      [],
      2.35,
    );
    t.to(bottle.current.rotation, { z: 0, duration: 0.5, ease: 'power2.inOut' }, 2.35);
    t.to(
      bottle.current.position,
      {
        x: BOTTLE_REST[0],
        y: BOTTLE_REST[1],
        z: BOTTLE_REST[2],
        duration: 0.6,
        ease: 'power2.inOut',
      },
      2.4,
    );
    if (isMartini) {
      t.call(
        () => {
          olive.current.visible = true;
        },
        [],
        2.6,
      );
      t.to(olive.current.position, { y: 0.11, duration: 0.4, ease: 'bounce.out' }, 2.6);
    }
    if (kind === 'negroni') {
      t.call(
        () => {
          orange.current.visible = true;
          playIce();
        },
        [],
        2.7,
      );
    }
    t.to(
      glassGroup.current.position,
      { z: GLASS[2] + 0.24, duration: 0.8, ease: 'power2.out' },
      3.0,
    );
    t.call(() => useScene.getState().setDrinkServed(true), [], 3.4);
    return () => {
      t.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drink]);

  return (
    <>
      <group ref={bottle} position={BOTTLE_REST} name="service-bottle">
        <mesh geometry={geo.bottle} material={bottleMat} renderOrder={6} />
        <mesh ref={labelMesh} geometry={geo.label} material={labelMats[1]} />
        <mesh geometry={geo.cap} material={mat.brass} />
      </group>
      <mesh ref={stream} geometry={geo.stream} material={liquidMat} visible={false} />
      <group ref={glassGroup} position={GLASS} name="served-glass">
        <group ref={rocks}>
          <mesh ref={liquid} geometry={geo.liquid} material={liquidMat} scale={[1, 0.0001, 1]} />
          <mesh geometry={geo.rocksBase} material={glassMat} />
          <mesh geometry={geo.rocks} material={glassMat} renderOrder={6} />
          <mesh
            ref={orange}
            geometry={geo.orange}
            material={orangeMat}
            position={[0.035, 0.09, 0]}
            rotation={[0, 0.3, 0]}
            visible={false}
          />
        </group>
        <group ref={coupe} visible={false}>
          <mesh
            ref={coneLiquid}
            geometry={geo.cone}
            material={liquidMat}
            position={[0, 0.098, 0]}
            scale={[0.0001, 0.0001, 0.0001]}
          />
          <mesh geometry={geo.martini} material={glassMat} renderOrder={6} />
          <group ref={olive} position={[0, 0.35, 0]} visible={false}>
            <mesh geometry={geo.olive} material={mat.olive} />
            <mesh geometry={geo.pick} material={mat.steel} />
          </group>
        </group>
        <group ref={ice} visible={false}>
          {[
            [0.008, 0.4],
            [-0.01, 1.1],
          ].map(([x, yaw], i) => (
            <mesh
              key={i}
              geometry={geo.cube}
              material={mat.ice}
              position={[x, 0.4, i * 0.01 - 0.005]}
              rotation={[0.3, yaw, 0.2]}
            />
          ))}
        </group>
      </group>
      <Interactive id="perfume" label="objects.perfume" enabled={atBar}>
        <group position={[0.95, TOP, 0.05]} rotation={[0, -0.4, 0]}>
          <GhostPerfume />
        </group>
      </Interactive>
    </>
  );
}
