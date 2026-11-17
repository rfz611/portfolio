import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useScene } from '../store/useScene';

const TOP_FLOOR = 45;

/** Desenha um texto em resolução baixa: ampliado pelo CSS, os pixels aparecem (estilo PS2). */
function drawPixelText(
  canvas: HTMLCanvasElement | null,
  lines: { text: string; size: number; color: string; y: number }[],
) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const line of lines) {
    ctx.font = `${line.size}px "VT323", monospace`;
    ctx.fillStyle = '#000';
    ctx.fillText(line.text, canvas.width / 2 + 1, line.y + 1);
    ctx.fillStyle = line.color;
    ctx.fillText(line.text, canvas.width / 2, line.y);
  }
}

/**
 * Tela de carregamento em forma de elevador: as portas ficam fechadas
 * enquanto o mostrador conta os andares com o progresso real e, quando
 * tudo carrega, elas se abrem e revelam a cobertura.
 */
export function Loader() {
  const { t } = useTranslation();
  const progress = useScene((s) => s.loadProgress);
  const ready = useScene((s) => s.ready);
  const [gone, setGone] = useState(false);
  const display = useRef<HTMLCanvasElement>(null);
  const plaque = useRef<HTMLCanvasElement>(null);

  const percent = Math.round((ready ? 1 : progress) * 100);
  const floor = Math.max(1, Math.round((percent / 100) * TOP_FLOOR));
  const floorText = percent >= 100 ? 'COB' : String(floor).padStart(2, '0');

  useEffect(() => {
    drawPixelText(display.current, [{ text: `▲ ${floorText}`, size: 22, color: '#ff8a3c', y: 15 }]);
  }, [floorText]);

  useEffect(() => {
    drawPixelText(plaque.current, [
      { text: t('loader.title').toUpperCase(), size: 14, color: '#2a1a08', y: 10 },
      {
        text: `${t('loader.loading')} ${String(percent).padStart(3, '0')}%`,
        size: 11,
        color: '#4a3010',
        y: 23,
      },
    ]);
  }, [t, percent]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setGone(true), 2200);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (gone) return null;
  return (
    <div className={`elevator${ready ? ' is-open' : ''}`} role="status" aria-live="polite">
      <span className="visually-hidden">
        {t('loader.title')} · {t('loader.loading')} {percent}%
      </span>
      <div className="elevator__head" aria-hidden="true">
        <canvas ref={display} className="elevator__display" width={80} height={30} />
      </div>
      <div className="elevator__door elevator__door--left" aria-hidden="true" />
      <div className="elevator__door elevator__door--right" aria-hidden="true" />
      <canvas
        ref={plaque}
        className="elevator__plaque"
        width={200}
        height={32}
        aria-hidden="true"
      />
    </div>
  );
}
