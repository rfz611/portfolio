import type { ThreeEvent } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import type { ReactNode } from 'react';
import { useScene } from '../store/useScene';

interface Props {
  id: string;
  /** Chave de tradução do rótulo (objects.*). */
  label: string;
  /** Texto pronto, quando o rótulo não vem das traduções (nome de faixa). */
  text?: string;
  enabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  /** Área de clique extra que não entra no contorno (ex.: vidro da janela). */
  hit?: ReactNode;
}

/** O evento veio do próprio canvas 3D (e não de uma tela HTML por cima dele)? */
function fromCanvas(event: ThreeEvent<PointerEvent | MouseEvent>) {
  return (event.nativeEvent.target as Element | null)?.tagName === 'CANVAS';
}

/**
 * Regra geral dos objetos: passar o mouse acende (contorno âmbar e rótulo
 * em VT323) e clicar leva a câmera até ele.
 */
export function Interactive({ id, label, text, enabled = true, onClick, children, hit }: Props) {
  const hovered = useScene((s) => s.hovered?.id === id);

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!fromCanvas(event)) return;
    useScene.getState().setHovered({ id, label, text });
  };
  const out = () => {
    if (useScene.getState().hovered?.id === id) useScene.getState().setHovered(null);
  };
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 6 || !fromCanvas(event)) return; // arrasto, ou clique numa tela HTML
    onClick?.();
  };

  return (
    <group
      onPointerOver={enabled ? over : undefined}
      onPointerOut={enabled ? out : undefined}
      onClick={enabled && onClick ? click : undefined}
    >
      <Select enabled={enabled && hovered}>{children}</Select>
      {enabled && hit}
    </group>
  );
}
