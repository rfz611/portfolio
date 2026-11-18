import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { playStatic, startCarRadio, stopCarRadio } from '../audio/player';
import { contactLinks, EMAIL } from '../content/contact';
import { useScene } from '../store/useScene';

const MIN = 87.5;
const MAX = 108;
/** Quão perto da estação ainda conta como sintonizado (MHz). */
const TUNE = 0.25;

function stationAt(freq: number) {
  return contactLinks.find((l) => Math.abs(Number(l.frequency) - freq) < TUNE) ?? null;
}

/**
 * Rádio do carro (seção Contato), de dentro do carro: visor vermelho em
 * VT323, dial que gira arrastando, com a roda do mouse ou com as setas, e
 * o botão OK. As estações são os contatos (88.1 E-mail, 91.5 LinkedIn,
 * 97.3 GitHub, 101.9 Currículo); entre elas, chiado.
 */
export function CarRadio() {
  const { t } = useTranslation();
  const inCar = useScene((s) => s.view === 'interior');
  const freq = useScene((s) => s.radioFreq);
  const setFreq = useScene((s) => s.setRadioFreq);
  const [copied, setCopied] = useState(false);
  const drag = useRef<{ x: number; freq: number } | null>(null);
  const station = stationAt(freq);
  const lastStation = useRef(station);

  // entrando no carro, o rádio toca uma faixa de garagem; saindo, volta o disco
  useEffect(() => {
    if (!inCar) return;
    startCarRadio();
    return () => stopCarRadio();
  }, [inCar]);

  // chiado ao sair de uma estação
  useEffect(() => {
    if (lastStation.current && !station) playStatic();
    lastStation.current = station;
    setCopied(false);
  }, [station]);

  useEffect(() => {
    if (!inCar) return;
    const key = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        setFreq(useScene.getState().radioFreq - 0.1);
      } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        setFreq(useScene.getState().radioFreq + 0.1);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [inCar, setFreq]);

  if (!inCar) return null;

  const ok = () => {
    if (!station) return;
    if (station.id === 'email') {
      void navigator.clipboard?.writeText(EMAIL).then(() => setCopied(true));
      return;
    }
    window.open(station.href, '_blank', 'noopener');
  };

  const angle = ((freq - MIN) / (MAX - MIN)) * 300 - 150;
  return (
    <aside className="car-radio" aria-label={t('contact.title')}>
      <div className="car-radio__display" aria-live="polite">
        <span className="car-radio__freq">FM {freq.toFixed(1)}</span>
        <span className="car-radio__name">
          {station ? t(`contact.${station.id}`) : `~ ${t('radio.noise')} ~`}
        </span>
        <span className="car-radio__value">{station ? station.value : ''}</span>
      </div>
      <div className="car-radio__scale" aria-hidden="true">
        {contactLinks.map((l) => (
          <button
            key={l.id}
            type="button"
            tabIndex={-1}
            style={{ left: `${((Number(l.frequency) - MIN) / (MAX - MIN)) * 100}%` }}
            onClick={() => setFreq(Number(l.frequency))}
          >
            {l.frequency}
          </button>
        ))}
        <i style={{ left: `${((freq - MIN) / (MAX - MIN)) * 100}%` }} />
      </div>
      <div className="car-radio__controls">
        <div
          className="car-radio__dial"
          role="slider"
          tabIndex={0}
          aria-label="FM"
          aria-valuemin={MIN}
          aria-valuemax={MAX}
          aria-valuenow={freq}
          aria-valuetext={
            station ? `${freq.toFixed(1)} ${t(`contact.${station.id}`)}` : freq.toFixed(1)
          }
          style={{ transform: `rotate(${angle}deg)` }}
          onPointerDown={(event) => {
            (event.target as Element).setPointerCapture(event.pointerId);
            drag.current = { x: event.clientX - event.clientY, freq };
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const delta = event.clientX - event.clientY - drag.current.x;
            setFreq(drag.current.freq + delta * 0.05);
          }}
          onPointerUp={() => (drag.current = null)}
          onWheel={(event) => setFreq(freq + (event.deltaY > 0 ? -0.1 : 0.1))}
        />
        <button type="button" className="car-radio__ok" disabled={!station} onClick={ok}>
          {station?.id === 'email' ? (copied ? t('radio.copied') : t('radio.copy')) : t('radio.ok')}
        </button>
      </div>
      <p className="car-radio__hint">{t('radio.hint')}</p>
    </aside>
  );
}
