import { useFrame, type ThreeEvent } from '@react-three/fiber';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { needleDown, progress, togglePlay } from '../audio/player';
import { box, crease, cyl, merge } from '../scene/geo';
import { MAX_VOLUME, useScene } from '../store/useScene';
import { lib } from '../textures/library';
import { Interactive } from './Interactive';
import { deckMotion, PLATTER } from './recordLayout';

const HALF_PI = Math.PI / 2;
/** Posição do pivô do braço e ângulos de trabalho (em radianos). */
const PIVOT: [number, number, number] = [0.165, 0.128, -0.105];
const ARM_REST = 0;
const ARM_START = -0.503; // agulha no começo do disco
const ARM_END = -0.857; // agulha perto do rótulo
const PITCH_UP = -0.085;
const PITCH_REST = -0.03;
const RPM_33 = (33.33 / 60) * Math.PI * 2;

/**
 * Toca-discos (0,45 × 0,15 × 0,35 m): prato que gira, braço com agulha
 * que desce no disco e anda com a faixa, tampa de acrílico e o botão de
 * latão que regula o volume.
 */
export function Turntable() {
  const { mat } = lib();
  const view = useScene((s) => s.view);
  const requested = useScene((s) => s.requestedTrackId);
  const playing = useScene((s) => s.deck === 'playing');
  const focused = view === 'discos';

  const platter = useRef<THREE.Group>(null!);
  const yaw = useRef<THREE.Group>(null!);
  const pitch = useRef<THREE.Group>(null!);
  const knob = useRef<THREE.Group>(null!);
  const sheen = useRef<THREE.Mesh>(null!);
  const arm = useRef({ yaw: ARM_REST, pitch: PITCH_REST, busy: false, speed: 0 });
  const drag = useRef(false);

  const geo = useMemo(() => {
    const [px, , pz] = PLATTER;
    return {
      plinth: box([0.45, 0.065, 0.35], [0, 0.0445, 0]),
      deck: box([0.44, 0.006, 0.34], [0, 0.08, 0]),
      feet: merge(
        [-0.19, 0.19].flatMap((x) =>
          [-0.14, 0.14].map((z) => cyl(0.024, 0.024, 0.012, [x, 0.006, z], { seg: 10 })),
        ),
      ),
      trim: box([0.45, 0.004, 0.003], [0, 0.074, 0.1765]),
      platter: cyl(0.152, 0.152, 0.02, [0, 0.093, 0], { seg: 32, uv: 0.9 }),
      matDisc: cyl(0.148, 0.148, 0.003, [0, 0.1045, 0], { seg: 32 }),
      spindle: cyl(0.0035, 0.0035, 0.02, [0, 0.112, 0], { seg: 8 }),
      sheen: new THREE.CircleGeometry(0.153, 32).rotateX(-HALF_PI).translate(0, 0.1103, 0),
      armBase: crease(
        merge([
          cyl(0.026, 0.03, 0.03, [PIVOT[0], 0.098, PIVOT[2]], { seg: 14 }),
          cyl(0.013, 0.013, 0.028, [PIVOT[0], 0.124, PIVOT[2]], { seg: 10 }),
          cyl(0.005, 0.005, 0.028, [PIVOT[0], 0.097, PIVOT[2] + 0.15], { seg: 8 }),
          box([0.02, 0.005, 0.012], [PIVOT[0], 0.1115, PIVOT[2] + 0.15]),
        ]),
      ),
      armTube: merge([
        cyl(0.0042, 0.0042, 0.225, [0, 0, 0.09], { seg: 8, rot: [HALF_PI, 0, 0] }),
        cyl(0.017, 0.017, 0.036, [0, 0, -0.046], { seg: 12, rot: [HALF_PI, 0, 0] }),
        box([0.02, 0.004, 0.038], [0, -0.004, 0.207]),
      ]),
      cartridge: merge([
        box([0.014, 0.012, 0.022], [0, -0.012, 0.212]),
        box([0.004, 0.003, 0.02], [0.014, -0.003, 0.215]),
      ]),
      knob: crease(
        merge([
          cyl(0.02, 0.023, 0.022, [0, 0.011, 0], { seg: 20, uv: 0.2 }),
          box([0.004, 0.004, 0.018], [0, 0.022, 0.011]),
        ]),
        30,
      ),
      knobSkirt: cyl(0.028, 0.028, 0.004, [0, 0.002, 0], { seg: 20 }),
      knobHit: new THREE.CylinderGeometry(0.045, 0.045, 0.05, 12).translate(0, 0.02, 0),
      buttons: merge([
        box([0.03, 0.006, 0.018], [-0.19, 0.086, 0.15]),
        box([0.03, 0.006, 0.018], [-0.15, 0.086, 0.15]),
      ]),
      led: box([0.008, 0.004, 0.008], [-0.115, 0.085, 0.15]),
      // tampa aberta, presa por trás
      lid: merge([
        box([0.44, 0.003, 0.34], [0, 0.06, 0.17]),
        box([0.44, 0.06, 0.003], [0, 0.03, 0.34]),
        box([0.44, 0.06, 0.003], [0, 0.03, 0]),
        box([0.003, 0.06, 0.34], [-0.22, 0.03, 0.17]),
        box([0.003, 0.06, 0.34], [0.22, 0.03, 0.17]),
      ]),
      platterPos: [px, 0, pz] as [number, number, number],
    };
  }, []);

  // Coreografia de troca: braço sobe, volta ao descanso, espera o disco
  // pousar, vai até o começo do disco e desce. Só então o som entra.
  useEffect(() => {
    if (!requested) return;
    const a = arm.current;
    const swap = requested !== useScene.getState().trackId;
    a.busy = true;
    const timeline = gsap
      .timeline()
      .to(a, { pitch: PITCH_UP, duration: 0.25, ease: 'power2.out' })
      .to(a, { yaw: ARM_REST, duration: 0.45, ease: 'power2.inOut' })
      .to({}, { duration: swap ? 0.95 : 0.05 })
      .to(a, { yaw: ARM_START, duration: 0.65, ease: 'power2.inOut' })
      .to(a, { pitch: 0, duration: 0.3, ease: 'power2.in' })
      .call(() => {
        a.busy = false;
        needleDown(requested);
      });
    return () => {
      timeline.kill();
    };
  }, [requested]);

  // Se a faixa falhar (arquivo ausente), o braço volta para o descanso.
  const idle = useScene((s) => s.deck === 'idle');
  useEffect(() => {
    if (!idle) return;
    const a = arm.current;
    const timeline = gsap
      .timeline()
      .to(a, { pitch: PITCH_UP, duration: 0.25 })
      .to(a, { yaw: ARM_REST, duration: 0.5, ease: 'power2.inOut' })
      .to(a, { pitch: PITCH_REST, duration: 0.25 });
    return () => {
      timeline.kill();
    };
  }, [idle]);

  useFrame((_, delta) => {
    const a = arm.current;
    const s = useScene.getState();
    // o prato acelera e freia aos poucos, como um de verdade
    const target = s.deck === 'playing' ? RPM_33 : 0;
    a.speed += (target - a.speed) * (1 - Math.exp(-delta * 2.2));
    deckMotion.spin -= a.speed * delta;
    platter.current.rotation.y = deckMotion.spin;

    if (!a.busy && s.deck === 'playing') {
      const goal = ARM_START + (ARM_END - ARM_START) * progress();
      a.yaw += (goal - a.yaw) * (1 - Math.exp(-delta * 4));
    }
    yaw.current.rotation.y = a.yaw;
    pitch.current.rotation.x = a.pitch;

    // o botão de latão acompanha o volume
    knob.current.rotation.y = (0.75 - (s.volume / MAX_VOLUME) * 1.5) * Math.PI;

    let landed = 0;
    for (const v of deckMotion.landed.values()) landed = Math.max(landed, v);
    sheen.current.visible = landed > 0.97;
  });

  const setVolume = (delta: number) => {
    const s = useScene.getState();
    s.setVolume(s.volume + delta);
  };
  const knobDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    drag.current = true;
    (event.target as Element).setPointerCapture(event.pointerId);
  };
  const knobMove = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    event.stopPropagation();
    setVolume((event.nativeEvent.movementX - event.nativeEvent.movementY) * 0.003);
  };
  const knobUp = (event: ThreeEvent<PointerEvent>) => {
    drag.current = false;
    (event.target as Element).releasePointerCapture(event.pointerId);
  };
  const knobWheel = (event: ThreeEvent<WheelEvent>) => {
    event.stopPropagation();
    setVolume(event.nativeEvent.deltaY < 0 ? 0.03 : -0.03);
  };

  return (
    <group>
      <mesh geometry={geo.plinth} material={mat.walnut} />
      <mesh geometry={geo.deck} material={mat.darkMetal} />
      <mesh geometry={geo.feet} material={mat.rubber} />
      <mesh geometry={geo.trim} material={mat.brass} />
      <mesh geometry={geo.buttons} material={mat.steel} />
      <mesh geometry={geo.led} material={playing ? mat.amberBulb : mat.amberDim} />

      <Interactive
        id="turntable"
        label="objects.turntable"
        enabled={focused}
        onClick={focused ? togglePlay : undefined}
      >
        <group position={geo.platterPos}>
          <group ref={platter}>
            <mesh geometry={geo.platter} material={mat.platter} />
            <mesh geometry={geo.matDisc} material={mat.rubber} />
          </group>
          <mesh geometry={geo.spindle} material={mat.steel} />
          <mesh ref={sheen} geometry={geo.sheen} material={mat.vinylSheen} />
        </group>
      </Interactive>

      <mesh geometry={geo.armBase} material={mat.steel} />
      <group ref={yaw} position={PIVOT}>
        <group ref={pitch}>
          <mesh geometry={geo.armTube} material={mat.steel} />
          <mesh geometry={geo.cartridge} material={mat.blackPlastic} />
        </group>
      </group>

      <Interactive id="knob" label="objects.knob" enabled={focused}>
        <group position={[0.165, 0.083, 0.118]}>
          <mesh geometry={geo.knobSkirt} material={mat.blackPlastic} />
          <group ref={knob}>
            <mesh geometry={geo.knob} material={mat.brass} />
          </group>
          {focused && (
            <mesh
              geometry={geo.knobHit}
              onPointerDown={knobDown}
              onPointerMove={knobMove}
              onPointerUp={knobUp}
              onWheel={knobWheel}
            >
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          )}
        </group>
      </Interactive>

      <group position={[0, 0.084, -0.172]} rotation={[-1.18, 0, 0]}>
        <mesh geometry={geo.lid} material={mat.smokedGlass} renderOrder={4} />
      </group>
    </group>
  );
}
