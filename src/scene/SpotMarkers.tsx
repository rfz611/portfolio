import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { SPOTS } from '../camera/spots';
import { palette } from '../config/palette';
import { useScene } from '../store/useScene';

const HALF_PI = Math.PI / 2;

/**
 * Círculos âmbar no chão marcando para onde dá para andar. Passar o mouse
 * acende e mostra o nome do lugar; clicar leva a câmera até lá.
 */
export function SpotMarkers() {
  const { t } = useTranslation();
  const home = useScene((s) => s.view === 'home');
  const current = useScene((s) => s.spot);
  const hovered = useScene((s) => s.hovered?.id);
  const group = useRef<THREE.Group>(null!);
  const geo = useMemo(
    () => ({
      ring: new THREE.RingGeometry(0.17, 0.21, 32).rotateX(-HALF_PI),
      dot: new THREE.CircleGeometry(0.05, 16).rotateX(-HALF_PI),
      hit: new THREE.CircleGeometry(0.32, 16).rotateX(-HALF_PI),
    }),
    [],
  );
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: palette.amber,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  );
  const bright = useMemo(() => {
    const m = material.clone();
    m.opacity = 0.9;
    return m;
  }, [material]);
  const invisible = useMemo(
    () => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    [],
  );

  // pulsa devagar para chamar a atenção sem incomodar
  useFrame(({ clock }) => {
    material.opacity = 0.22 + 0.16 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2));
  });

  if (!home) return null;
  return (
    <group ref={group} name="spot-markers">
      {SPOTS.map((spot, i) => {
        if (i === current || !spot.marker) return null;
        const id = `spot-${spot.id}`;
        const on = hovered === id;
        const over = (event: ThreeEvent<PointerEvent>) => {
          event.stopPropagation();
          useScene.getState().setHovered({
            id,
            label: spot.label,
            text: `${t('nav3d.goTo')}: ${t(spot.label)}`,
          });
        };
        const out = () => {
          if (useScene.getState().hovered?.id === id) useScene.getState().setHovered(null);
        };
        const click = (event: ThreeEvent<MouseEvent>) => {
          event.stopPropagation();
          if (event.delta > 6) return;
          useScene.getState().setSpot(i);
        };
        return (
          <group key={spot.id} position={spot.marker}>
            <mesh geometry={geo.ring} material={on ? bright : material} renderOrder={7} />
            <mesh geometry={geo.dot} material={on ? bright : material} renderOrder={7} />
            <mesh
              geometry={geo.hit}
              material={invisible}
              onPointerOver={over}
              onPointerOut={out}
              onClick={click}
            />
          </group>
        );
      })}
    </group>
  );
}
