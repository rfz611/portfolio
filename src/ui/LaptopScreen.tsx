import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useTranslation } from 'react-i18next';
import { playBoot } from '../audio/player';
import { LANGUAGE_LEVELS, pixelRects, type PixelIconId } from './pixelIcons';

const ICONS: { id: PixelIconId; label: string }[] = [
  { id: 'about', label: 'about.aboutFile' },
  { id: 'education', label: 'about.education' },
  { id: 'experience', label: 'about.experience' },
  { id: 'languages', label: 'about.languages' },
];

/** A primeira vez que liga faz a inicialização inteira; depois, só uma piscada. */
let bootedOnce = false;

function PixelIcon({ id, size }: { id: PixelIconId; size: number }) {
  const rects = useMemo(() => pixelRects(id), [id]);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="os__icon-img"
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={1} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <span className="os__clock">
      {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
    </span>
  );
}

/** Conteúdo de cada janela (só os textos da especificação). */
function WindowBody({ id }: { id: PixelIconId }) {
  const { t } = useTranslation();
  if (id === 'about') {
    return (
      <p className="os__text">
        {t('about.aboutText')}
        <span className="os__caret" aria-hidden="true" />
      </p>
    );
  }
  if (id === 'education') {
    return (
      <ul className="os__list">
        <li>{t('about.educationUni')}</li>
        <li>{t('about.educationTech')}</li>
      </ul>
    );
  }
  if (id === 'experience') {
    return (
      <ul className="os__list">
        <li>{t('about.experienceSupport')}</li>
      </ul>
    );
  }
  return (
    <ul className="os__list os__list--langs">
      {LANGUAGE_LEVELS.map(({ key, level }) => (
        <li key={key}>
          <span>{t(key)}</span>
          <span className="os__level" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <i key={i} className={i < level ? 'is-on' : ''} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface OpenWindow {
  id: PixelIconId;
  x: number;
  y: number;
}

/**
 * Área de trabalho retrô dentro da tela do notebook (seção Sobre mim):
 * liga com o som de inicialização e mostra quatro ícones. Duplo clique
 * (ou um toque, no celular) abre uma janela que dá para arrastar pela tela.
 */
export function LaptopScreen({ width, height }: { width: number; height: number }) {
  const { t } = useTranslation();
  const [booting, setBooting] = useState(true);
  const [selected, setSelected] = useState<PixelIconId | null>(null);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const desk = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: PixelIconId; x: number; y: number; px: number; py: number } | null>(
    null,
  );
  const compact = width < 480;
  const winW = Math.round(width * (compact ? 0.8 : 0.62));
  const winH = Math.round(height * (compact ? 0.74 : 0.66));
  const bar = compact ? 20 : 18;

  useEffect(() => {
    playBoot();
    const timer = window.setTimeout(
      () => {
        bootedOnce = true;
        setBooting(false);
      },
      bootedOnce ? 350 : 1400,
    );
    return () => window.clearTimeout(timer);
  }, []);

  const clamp = (x: number, y: number) => ({
    x: Math.min(Math.max(x, 0), width - winW),
    y: Math.min(Math.max(y, bar), height - 24),
  });

  const open = (id: PixelIconId) => {
    setSelected(id);
    setWindows((list) => {
      const rest = list.filter((w) => w.id !== id);
      const existing = list.find((w) => w.id === id);
      if (existing) return [...rest, existing];
      const index = ICONS.findIndex((icon) => icon.id === id);
      const start = compact
        ? clamp((width - winW) / 2 + index * 6, bar + 8 + index * 8)
        : clamp(width * 0.27 + index * 22, bar + 12 + index * 16);
      return [...rest, { id, ...start }];
    });
  };

  const close = (id: PixelIconId) => setWindows((list) => list.filter((w) => w.id !== id));

  const coarse =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;

  // a tela está ampliada pela câmera: converte o movimento do mouse em pixels da tela
  const scale = () => {
    const el = desk.current;
    if (!el) return 1;
    return el.getBoundingClientRect().width / el.offsetWidth || 1;
  };

  const startDrag = (event: ReactPointerEvent, win: OpenWindow) => {
    if ((event.target as HTMLElement).closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: win.id, x: win.x, y: win.y, px: event.clientX, py: event.clientY };
    setWindows((list) => [...list.filter((w) => w.id !== win.id), win]);
  };

  const moveDrag = (event: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const s = scale();
    const next = clamp(d.x + (event.clientX - d.px) / s, d.y + (event.clientY - d.py) / s);
    setWindows((list) => list.map((w) => (w.id === d.id ? { ...w, ...next } : w)));
  };

  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div
      ref={desk}
      className={`os${booting ? ' is-booting' : ''}${compact ? ' os--compact' : ''}`}
      style={{ width, height }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) setSelected(null);
      }}
    >
      <div className="os__wallpaper" aria-hidden="true">
        <span>RSP</span>
      </div>

      <div className="os__bar" style={{ height: bar }}>
        <span className="os__brand">◆ RSP·OS</span>
        <span className="os__tip">{t(coarse ? 'about.tipTouch' : 'about.tip')}</span>
        <Clock />
      </div>

      <ul className="os__icons" aria-label={t('about.title')}>
        {ICONS.map((icon) => (
          <li key={icon.id}>
            <button
              type="button"
              className={`os__icon${selected === icon.id ? ' is-selected' : ''}`}
              onClick={(event) => {
                // teclado (Enter) e toque abrem direto; mouse precisa de duplo clique
                if (coarse || event.detail === 0) open(icon.id);
                else setSelected(icon.id);
              }}
              onDoubleClick={() => open(icon.id)}
            >
              <PixelIcon id={icon.id} size={compact ? 30 : 32} />
              <span>{t(icon.label)}</span>
            </button>
          </li>
        ))}
      </ul>

      {windows.map((win, index) => {
        const label = ICONS.find((icon) => icon.id === win.id)!.label;
        const active = index === windows.length - 1;
        return (
          <section
            key={win.id}
            className={`os__window${active ? ' is-active' : ''}`}
            style={{ left: win.x, top: win.y, width: winW, maxHeight: winH, zIndex: 2 + index }}
            aria-label={t(label)}
            onPointerDown={() => {
              if (!active) setWindows((list) => [...list.filter((w) => w.id !== win.id), win]);
            }}
          >
            <header
              className="os__title"
              onPointerDown={(event) => startDrag(event, win)}
              onPointerMove={moveDrag}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
            >
              <PixelIcon id={win.id} size={14} />
              <h3>{t(label)}</h3>
              <button type="button" aria-label={t('nav.close')} onClick={() => close(win.id)}>
                ×
              </button>
            </header>
            <div className="os__body">
              <WindowBody id={win.id} />
            </div>
          </section>
        );
      })}

      <div className="os__boot" aria-hidden="true">
        <p>RSP·OS</p>
        <span className="os__boot-bar">
          <i />
        </span>
      </div>
      <div className="os__glass" aria-hidden="true" />
    </div>
  );
}
