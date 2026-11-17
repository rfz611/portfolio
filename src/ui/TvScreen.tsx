import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { playStatic } from '../audio/player';
import { projects } from '../content/projects';
import { stepChannel } from '../store/tv';
import { useScene } from '../store/useScene';

/** Chiado em movimento desenhado num canvas pequeno (ampliado pelo CSS). */
function StaticNoise({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const image = ctx.createImageData(118, 90);
    let frame = 0;
    const draw = () => {
      for (let i = 0; i < image.data.length; i += 4) {
        const v = Math.random() * 255;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
        image.data[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return (
    <canvas
      ref={canvas}
      className={`tv__static${active ? ' is-on' : ''}`}
      width={118}
      height={90}
      aria-hidden="true"
    />
  );
}

/**
 * O que aparece na tela da TV (HTML de verdade, dentro do vidro): liga
 * com chiado e a linha horizontal abrindo, e mostra o canal escolhido com
 * nome, print, descrição, tecnologias e link. Nunca troca sozinha.
 */
export function TvScreen() {
  const { t } = useTranslation();
  const channel = useScene((s) => s.tvChannel);
  const [booting, setBooting] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [imageOk, setImageOk] = useState(true);
  const [videoOk, setVideoOk] = useState(true);
  const first = useRef(true);
  const project = projects[channel];

  // ao ligar: linha horizontal + chiado por 0,6 s
  useEffect(() => {
    playStatic();
    const timer = window.setTimeout(() => setBooting(false), 600);
    return () => window.clearTimeout(timer);
  }, []);

  // ao trocar de canal: chiado curto
  useEffect(() => {
    setImageOk(true);
    setVideoOk(true);
    if (first.current) {
      first.current = false;
      return;
    }
    setSwitching(true);
    playStatic();
    const timer = window.setTimeout(() => setSwitching(false), 320);
    return () => window.clearTimeout(timer);
  }, [channel]);

  // setas do teclado trocam de canal
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') stepChannel(1);
      else if (event.key === 'ArrowLeft') stepChannel(-1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className={`tv${booting ? ' is-booting' : ''}`}>
      <div className="tv__content" aria-live="polite">
        <p className="tv__osd">
          CH {project.channel}
          <span>{t('projects.title').toUpperCase()}</span>
        </p>
        <div className="tv__body">
          <figure className="tv__shot">
            {project.video && videoOk ? (
              <video
                key={project.video}
                src={project.video}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                onError={() => setVideoOk(false)}
              />
            ) : imageOk ? (
              <img src={project.image} alt="" onError={() => setImageOk(false)} />
            ) : (
              <span>{t('projects.noImage').toUpperCase()}</span>
            )}
          </figure>
          <div className="tv__head">
            <h2>{t(`projects.${project.id}.name`)}</h2>
            <ul className="tv__tags" aria-label={t('projects.tech')}>
              {project.tech.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="tv__desc">{t(`projects.${project.id}.description`)}</p>
        <div className="tv__foot">
          {project.link ? (
            <a href={project.link} target="_blank" rel="noreferrer">
              {t('projects.link').toUpperCase()} ↗
            </a>
          ) : (
            <span className="tv__soon">{t('projects.linkSoon')}</span>
          )}
          <span className="tv__ch">
            <button type="button" aria-label={t('projects.prev')} onClick={() => stepChannel(-1)}>
              ◀
            </button>
            CH
            <button type="button" aria-label={t('projects.next')} onClick={() => stepChannel(1)}>
              ▶
            </button>
          </span>
        </div>
      </div>
      <StaticNoise active={booting || switching} />
      <div className="tv__line" aria-hidden="true" />
      <div className="tv__glass" aria-hidden="true" />
    </div>
  );
}
