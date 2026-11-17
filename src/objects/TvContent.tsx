import { Html } from '@react-three/drei';
import { useScene } from '../store/useScene';
import { TvScreen } from '../ui/TvScreen';
import { TV_SCREEN } from './recordLayout';

/**
 * Encaixa a tela HTML no vidro da TV. No modo "transform" do drei,
 * 1 pixel da página = 1/40 de metro; com o grupo em escala 0,04, a página
 * de 470 × 355 px ocupa exatamente os 0,47 × 0,355 m do vidro.
 * Só aparece quando a câmera está na TV; fora disso a TV fica desligada.
 */
export function TvContent() {
  const on = useScene((s) => s.view === 'tv');
  if (!on) return null;
  return (
    <group position={[TV_SCREEN.x, TV_SCREEN.y, TV_SCREEN.z + 0.022]} scale={0.04}>
      <Html transform zIndexRange={[10, 0]} className="tv-anchor">
        <TvScreen />
      </Html>
    </group>
  );
}
