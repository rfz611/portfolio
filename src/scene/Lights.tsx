import { useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ROOM, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { lib } from '../textures/library';

type V3 = [number, number, number];

interface SpotProps {
  from: V3;
  to: V3;
  color: string;
  intensity: number;
  angle: number;
  distance: number;
}

/** Luminária embutida no teto. O alvo precisa estar na cena para a luz mirar certo. */
function Spot({ from, to, color, intensity, angle, distance }: SpotProps) {
  const light = useMemo(() => new THREE.SpotLight(), []);
  return (
    <>
      <primitive
        object={light}
        position={from}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={0.9}
        distance={distance}
        decay={1.5}
      />
      <primitive object={light.target} position={to} />
    </>
  );
}

/**
 * Luz em tempo real: quase tudo no escuro. Só entram o âmbar dos abajures,
 * o azul do bar, o vermelho da garagem e o reflexo frio da cidade.
 * Nenhuma luz projeta sombra (a sombra vem "assada" nas texturas).
 */
export function Lights() {
  const scene = useThree((s) => s.scene);
  const { tex } = lib();

  useEffect(() => {
    scene.environment = tex.env;
    scene.environmentIntensity = 1;
    return () => {
      scene.environment = null;
    };
  }, [scene, tex]);

  const [ax, , az] = SPOT.lampA;
  const [bx, , bz] = SPOT.lampB;
  const [barX, , barZ] = SPOT.bar;
  const [carX, , carZ] = SPOT.car;
  const [tx, , tz] = SPOT.table;
  const [sx, , sz] = SPOT.shelf;
  const top = ROOM.h - 0.05;

  return (
    <>
      <hemisphereLight args={['#4a5aa0', '#1a0f14', 1.15]} />
      {/* cidade e céu entrando pelo vidro */}
      <directionalLight position={[3, 5, -12]} intensity={1.1} color="#6c84ff" />
      {/* abajures do cantinho dos discos */}
      <pointLight
        position={[ax + 0.62, 1.12, az]}
        color={palette.amber}
        intensity={24}
        distance={9}
        decay={1.8}
      />
      <pointLight
        position={[bx + 0.62, 1.12, bz]}
        color={palette.amber}
        intensity={24}
        distance={9}
        decay={1.8}
      />
      {/* luminárias embutidas: toca-discos e mesa redonda */}
      <Spot
        from={[sx + 0.9, top, sz]}
        to={[sx + 0.1, 1, sz]}
        color="#ffd2a0"
        intensity={20}
        angle={0.5}
        distance={5}
      />
      <Spot
        from={[tx, top, tz]}
        to={[tx, -0.4, tz]}
        color="#ffc98a"
        intensity={160}
        angle={0.5}
        distance={6}
      />
      {/* neon azul do bar */}
      <pointLight
        position={[barX, 0.35, barZ + 0.55]}
        color={palette.neonBlue}
        intensity={36}
        distance={6}
        decay={1.8}
      />
      <pointLight
        position={[barX, 1.5, barZ - 0.6]}
        color={palette.neonBlue}
        intensity={12}
        distance={5}
        decay={1.8}
      />
      {/* vermelho da garagem */}
      <pointLight
        position={[carX, 0.22, carZ]}
        color={palette.neonRed}
        intensity={70}
        distance={10}
        decay={1.7}
      />
      <pointLight
        position={[11.8, 2.6, -1]}
        color={palette.neonRed}
        intensity={45}
        distance={10}
        decay={1.8}
      />
    </>
  );
}
