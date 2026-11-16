import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { ROOM, SPOT } from '../config/layout';
import { palette } from '../config/palette';
import { lib } from '../textures/library';

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

  return (
    <>
      <hemisphereLight args={['#4a5cb0', '#1a0f14', 1.5]} />
      {/* cidade e céu entrando pelo vidro */}
      <directionalLight position={[3, 5, -12]} intensity={1.1} color="#6c84ff" />
      {/* abajures do cantinho dos discos */}
      <pointLight
        position={[ax + 0.3, 1.05, az]}
        color={palette.amber}
        intensity={30}
        distance={9}
        decay={1.8}
      />
      <pointLight
        position={[bx + 0.3, 1.05, bz]}
        color={palette.amber}
        intensity={30}
        distance={9}
        decay={1.8}
      />
      {/* luminária embutida sobre a mesa redonda */}
      <spotLight
        position={[tx, ROOM.h - 0.05, tz]}
        target-position={[tx, -0.4, tz]}
        color="#ffc98a"
        intensity={160}
        angle={0.5}
        penumbra={0.9}
        distance={6}
        decay={1.6}
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
