import type { ThreeEvent } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
import { useRef, type ReactNode } from 'react';
import * as THREE from 'three';
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
  /** false = sem contorno amarelo (o objeto mostra o destaque do seu jeito). */
  outline?: boolean;
}

/** O evento veio do próprio canvas 3D (e não de uma tela HTML por cima dele)? */
function fromCanvas(event: ThreeEvent<PointerEvent | MouseEvent>) {
  return (event.nativeEvent.target as Element | null)?.tagName === 'CANVAS';
}

/** Peça que esconde o que está atrás dela (vidro claro, brilhos e chuva não contam). */
function isSolid(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh) || !object.visible || object.userData.passThrough)
    return false;
  const material = Array.isArray(object.material) ? object.material[0] : object.material;
  if (!material || !material.visible) return false;
  if (material.depthWrite === false) return false; // sombras no chão, brilhos
  return !(material.transparent && material.opacity < 0.5);
}

function inside(object: THREE.Object3D, root: THREE.Object3D | null) {
  for (let o: THREE.Object3D | null = object; o; o = o.parent) if (o === root) return true;
  return false;
}

/**
 * O objeto é o primeiro sólido sob o mouse? Sem isso, clicar num objeto sem
 * ação (a foto da mesa, por exemplo) acionava o que estava atrás dele.
 */
function inFront(event: ThreeEvent<PointerEvent | MouseEvent>, root: THREE.Object3D | null) {
  const first = event.intersections.find((hit) => inside(hit.object, root) || isSolid(hit.object));
  return !first || inside(first.object, root);
}

/**
 * Regra geral dos objetos: passar o mouse acende (contorno âmbar e rótulo
 * em VT323) e clicar leva a câmera até ele.
 */
export function Interactive({
  id,
  label,
  text,
  enabled = true,
  onClick,
  children,
  hit,
  outline = true,
}: Props) {
  const hovered = useScene((s) => s.hovered?.id === id);
  const root = useRef<THREE.Group>(null);

  const over = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!fromCanvas(event) || !inFront(event, root.current)) return;
    useScene.getState().setHovered({ id, label, text });
  };
  const out = () => {
    if (useScene.getState().hovered?.id === id) useScene.getState().setHovered(null);
  };
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 6 || !fromCanvas(event) || !inFront(event, root.current)) return; // arrasto, ou clique numa tela HTML
    onClick?.();
  };

  return (
    <group
      ref={root}
      onPointerOver={enabled ? over : undefined}
      onPointerOut={enabled ? out : undefined}
      onClick={enabled && onClick ? click : undefined}
    >
      <Select enabled={outline && enabled && hovered}>{children}</Select>
      {enabled && hit}
    </group>
  );
}
