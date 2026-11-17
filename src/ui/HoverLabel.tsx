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
      const x = Math.min(event.clientX + 16, window.innerWidth - ref.current.offsetWidth - 8);
      ref.current.style.transform = `translate(${x}px, ${event.clientY + 18}px)`;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hovered]);

  return (
    <div ref={ref} className={`hover-label${hovered ? ' is-on' : ''}`} aria-hidden="true">
      {hovered ? `> ${hovered.text ?? t(hovered.label)}` : ''}
    </div>
  );
}
