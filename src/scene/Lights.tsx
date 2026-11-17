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
    scene.environmentIntensity = 0.6;
    return () => {
      scene.environment = null;
    };
  }, [scene, tex]);

  const [ax, , az] = SPOT.lampA;
  const [bx, , bz] = SPOT.lampB;
  const [carX, , carZ] = SPOT.car;
  const [sx, , sz] = SPOT.shelf;
  const top = ROOM.h - 0.05;

  return (
    <>
      <hemisphereLight args={['#5a64a8', '#2a1814', 1.75]} />
      {/* cidade e céu entrando pelo vidro */}
      <directionalLight position={[3, 5, -12]} intensity={1.1} color="#6c84ff" />
      {/* abajures do cantinho dos discos */}
      <pointLight
        position={[ax + 0.95, 1.2, az]}
        color={palette.amber}
        intensity={13}
        distance={9}
        decay={1.8}
      />
      <pointLight
        position={[bx + 0.95, 1.2, bz]}
        color={palette.amber}
        intensity={13}
        distance={9}
        decay={1.8}
      />
      {/* luminária embutida sobre o toca-discos */}
      <Spot
        from={[sx + 0.9, top, sz]}
        to={[sx + 0.1, 1, sz]}
        color="#ffd2a0"
        intensity={20}
        angle={0.5}
        distance={5}
      />
      {/* spot embutido no teto, só sobre a mesa de centro: destaca o que está em
          cima dela (revistas, porta-joias, cinzeiro) sem clarear a sala */}
      <Spot
        from={[SPOT.table[0] + 0.22, top, SPOT.table[2]]}
        to={[SPOT.table[0] + 0.2, SPOT.table[1], SPOT.table[2]]}
        color="#ffd9b0"
        intensity={11}
        angle={0.26}
        distance={5}
      />
      {/* vermelho da garagem */}
      <pointLight
        position={[carX, 0.22, carZ]}
        color={palette.neonRed}
        intensity={16}
        distance={7}
        decay={2}
      />
      <pointLight
        position={[11.8, 2.6, -1]}
        color={palette.neonRed}
        intensity={10}
        distance={7}
        decay={2}
      />
    </>
  );
}
