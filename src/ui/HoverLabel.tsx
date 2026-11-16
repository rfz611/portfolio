import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

/** Rótulo curto em VT323 que acompanha o mouse quando um objeto acende. */
export function HoverLabel() {
  const { t } = useTranslation();
  const hovered = useScene((s) => s.hovered);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (!ref.current) return;
      ref.current.style.transform = `translate(${event.clientX + 16}px, ${event.clientY + 18}px)`;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div ref={ref} className={`hover-label${hovered ? ' is-on' : ''}`} aria-hidden="true">
      {hovered ? `> ${t(hovered.label)}` : ''}
    </div>
  );
}
