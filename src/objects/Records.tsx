import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import gsap from 'gsap';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { chooseTrack } from '../audio/player';
import { coverUrl, DEFAULT_TRACK, tracks, type Track } from '../content/tracks';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintLabel, paintSleeveFallback, paintSoon } from '../textures/props';
import {
  deckMotion,
  fanPoses,
  PLATTER_POS,
  shelfPoses,
  SLEEVE_SIZE,
  sleeveObjects,
  type Pose,
} from './recordLayout';

const sleeveGeo = new THREE.BoxGeometry(SLEEVE_SIZE, SLEEVE_SIZE, 0.005);
const soonGeo = new THREE.PlaneGeometry(SLEEVE_SIZE, SLEEVE_SIZE);
const discGeo = new THREE.CylinderGeometry(0.155, 0.155, 0.003, 32);
const labelGeo = new THREE.CircleGeometry(0.052, 24).rotateX(-Math.PI / 2).translate(0, 0.0018, 0);

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Capa: começa com uma arte de reserva e troca pela imagem quando ela carrega. */
function useCoverMaterial(track: Track) {
  const material = useMemo(() => {
    const fallback = tex(
      makeCanvas(256, 256, (c, w, h) =>
        paintSleeveFallback(c, w, h, {
          color: track.label,
          artist: track.artist,
          title: track.title,
        }),
      ),
      { clamp: true },
    );
    return new THREE.MeshStandardMaterial({
      map: fallback,
      emissive: '#ffffff',
      emissiveMap: fallback,
      emissiveIntensity: 0.2,
      roughness: 0.55,
      envMapIntensity: 0.5,
    });
  }, [track]);

  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(
      coverUrl(track.id),
      (loaded) => {
        if (!alive) return;
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = 4;
        material.map = loaded;
        material.emissiveMap = loaded;
        material.needsUpdate = true;
      },
      undefined,
      () => undefined, // sem capa: fica a arte de reserva
    );
    return () => {
      alive = false;
    };
  }, [track.id, material]);

  return material;
}

function Sleeve({ track, index, home, fan, open, soon }: SleeveProps) {
  const group = useRef<THREE.Group>(null!);
  const { mat } = lib();
  const cover = useCoverMaterial(track);
  const hoverId = `disc-${track.id}`;
  const hovered = useScene((s) => s.hovered?.id === hoverId);
  const missing = useScene((s) => s.availability[track.id] === 'missing');
  const materials = useMemo(
    () => [mat.kraft, mat.kraft, mat.kraft, mat.kraft, cover, mat.kraft],
    [mat, cover],
  );
  const anim = useRef({
    open,
    since: -10,
    offset: new THREE.Vector3(),
    target: new THREE.Vector3(),
  });

  useLayoutEffect(() => {
    group.current.position.copy(home.position);
    group.current.quaternion.copy(home.quaternion);
    sleeveObjects.set(track.id, group.current);
    return () => {
      sleeveObjects.delete(track.id);
    };
  }, [home, track.id]);

  useFrame(({ clock }, delta) => {
    const a = anim.current;
    if (a.open !== open) {
      a.open = open;
      a.since = clock.elapsedTime;
    }
    // as capas saem (e voltam) uma atrás da outra
    const started = clock.elapsedTime - a.since > index * 0.045;
    const inFan = started ? open : !open;
    const pose = inFan ? fan : home;
    const k = 1 - Math.exp(-delta * 7);
    a.target.copy(pose.position);
    if (inFan && hovered) {
      a.target.add(a.offset.set(0, 0.018, 0.07).applyQuaternion(pose.quaternion));
    }
    const g = group.current;
    g.position.lerp(a.target, k);
    g.quaternion.slerp(pose.quaternion, k);
    g.scale.setScalar(g.scale.x + (pose.scale - g.scale.x) * k);
  });

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    useScene.getState().setHovered({
      id: hoverId,
      label: 'objects.records',
      text: `${track.title} · ${track.artist}`,
    });
  };
  const out = () => {
    if (useScene.getState().hovered?.id === hoverId) useScene.getState().setHovered(null);
  };
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 6) return;
    chooseTrack(track.id);
  };

  return (
    <group ref={group}>
      <Select enabled={open && hovered}>
        <mesh
          geometry={sleeveGeo}
          material={materials}
          onPointerOver={open ? over : undefined}
          onPointerOut={open ? out : undefined}
          onClick={open ? click : undefined}
        />
      </Select>
      {missing && (
        <mesh geometry={soonGeo} position={[0, 0, 0.004]}>
          <meshBasicMaterial map={soon} transparent toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

interface SleeveProps {
  track: Track;
  index: number;
  home: Pose;
  fan: Pose;
  open: boolean;
  soon: THREE.Texture;
}

const FLAT_TO_SLEEVE = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  Math.PI / 2,
);
const PLATTER_VEC = new THREE.Vector3(...PLATTER_POS);
const Y_AXIS = new THREE.Vector3(0, 1, 0);

/**
 * O vinil de cada faixa mora dentro da capa. Quando a faixa é escolhida,
 * ele sai da capa, voa em arco até o prato e pousa; o anterior faz o
 * caminho de volta.
 */
function Disc({ track }: { track: Track }) {
  const group = useRef<THREE.Group>(null!);
  const { mat } = lib();
  const onPlatter = useScene((s) => (s.requestedTrackId ?? s.trackId) === track.id);
  const k = useRef({ v: track.id === DEFAULT_TRACK ? 1 : 0 });
  const tmp = useRef({
    a: new THREE.Vector3(),
    up: new THREE.Vector3(),
    qa: new THREE.Quaternion(),
    qb: new THREE.Quaternion(),
  });

  const label = useMemo(() => {
    const map = tex(
      makeCanvas(256, 256, (c, w, h) =>
        paintLabel(c, w, h, { color: track.label, artist: track.artist, title: track.title }),
      ),
      { clamp: true },
    );
    return new THREE.MeshStandardMaterial({ map, roughness: 0.7 });
  }, [track]);
  const materials = useMemo(() => {
    const face = track.vinyl ? mat.vinylRed : mat.vinylBlack;
    return [mat.vinylEdge, face, face];
  }, [mat, track.vinyl]);

  useEffect(() => {
    const tween = gsap.to(k.current, {
      v: onPlatter ? 1 : 0,
      duration: onPlatter ? 1.25 : 0.85,
      delay: onPlatter ? 0.25 : 0,
      ease: 'power2.inOut',
      overwrite: true,
    });
    return () => {
      tween.kill();
    };
  }, [onPlatter]);

  useFrame(() => {
    const v = k.current.v;
    const g = group.current;
    deckMotion.landed.set(track.id, v);
    g.visible = v > 0.002;
    if (!g.visible) return;
    const sleeve = sleeveObjects.get(track.id);
    if (!sleeve) return;
    const t = tmp.current;
    const s = sleeve.scale.x;
    const fly = smooth(0.28, 1, v);
    // sai da capa para cima, depois voa em arco até o prato
    t.up.copy(Y_AXIS).applyQuaternion(sleeve.quaternion);
    t.a.copy(sleeve.position).addScaledVector(t.up, 0.34 * s * smooth(0, 0.32, v));
    g.position.lerpVectors(t.a, PLATTER_VEC, fly);
    g.position.y += Math.sin(fly * Math.PI) * 0.14;
    t.qa.copy(sleeve.quaternion).multiply(FLAT_TO_SLEEVE);
    t.qb.setFromAxisAngle(Y_AXIS, deckMotion.spin);
    g.quaternion.slerpQuaternions(t.qa, t.qb, smooth(0.3, 0.9, v));
    g.scale.setScalar(s + (1 - s) * fly);
  });

  return (
    <group ref={group} visible={false}>
      <mesh geometry={discGeo} material={materials} />
      <mesh geometry={labelGeo} material={label} />
    </group>
  );
}

/** As 11 capas na estante, o leque no plano "discos" e os vinis. */
export function Records() {
  const { t } = useTranslation();
  const open = useScene((s) => s.view === 'discos');
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const aspect = width / Math.max(1, height);
  const home = useMemo(shelfPoses, []);
  const fan = useMemo(() => fanPoses(aspect), [aspect]);
  const soonText = t('records.soon');
  const soon = useMemo(
    () =>
      tex(
        makeCanvas(256, 256, (c, w, h) => paintSoon(c, w, h, soonText)),
        { clamp: true },
      ),
    [soonText],
  );
  // ordem do leque: Clássicos, Rap e por último o disco do prato
  const order = useMemo(
    () => [
      ...tracks.filter((x) => x.side !== 'platter'),
      ...tracks.filter((x) => x.side === 'platter'),
    ],
    [],
  );

  return (
    <>
      {order.map((track, index) => (
        <Sleeve
          key={track.id}
          track={track}
          index={index}
          home={home[track.id]}
          fan={fan[track.id]}
          open={open}
          soon={soon}
        />
      ))}
      {tracks.map((track) => (
        <Disc key={track.id} track={track} />
      ))}
    </>
  );
}
