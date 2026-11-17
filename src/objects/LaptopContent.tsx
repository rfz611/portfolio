import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useScene } from '../store/useScene';
import { LaptopScreen } from '../ui/LaptopScreen';

/**
 * Encaixa a área de trabalho HTML na tela do notebook. No modo "transform"
 * do drei, 1 pixel = 1/40 m vezes a escala do grupo; a escala é escolhida
 * para a página cobrir exatamente o vidro (w × h metros). Na tela larga a
 * página tem 560 px; no celular, 400 px (letras maiores na mesma tela).
 * Só aparece quando a câmera está no notebook.
 */
export function LaptopContent({ w, h, y, z }: { w: number; h: number; y: number; z: number }) {
  const on = useScene((s) => s.view === 'pc');
  const portrait = useThree((s) => s.size.width < s.size.height);
  if (!on) return null;
  const width = portrait ? 400 : 560;
  const height = Math.round((width * h) / w);
  const scale = (w / width) * 40;
  return (
    <group position={[0, y, z]} rotation={[0, Math.PI, 0]} scale={scale}>
      <Html transform zIndexRange={[10, 0]}>
        <LaptopScreen key={width} width={width} height={height} />
      </Html>
    </group>
  );
}
