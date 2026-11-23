import { useEffect, useState } from 'react';
import { chooseTrack, unlockAudio } from '../audio/player';
import { useScene } from '../store/useScene';

/** O tour só existe com ?tour no endereço (para gravar um vídeo curto). */
const TOUR =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('tour');

type Step = [seconds: number, run: () => void];

const s = () => useScene.getState();

/**
 * Roteiro de ~42 s: sala (olhando o bar), TV com os dois projetos, o disco
 * tocando, a poltrona com a ficha de um livro, a janela com a cidade, o
 * notebook aberto (sem abrir nada nele), a garagem com o farol acendendo e
 * o motor. Usa as mesmas ações dos cliques de verdade.
 */
const STEPS: Step[] = [
  [0, () => s().setSpot(0)],
  [1.4, () => s().setGlance([3.3, 1.3, -2.9])], // olha o bar
  [3.2, () => s().setGlance(null)],
  [
    4.6,
    () => {
      s().setTvChannel(0);
      s().setView('tv');
    },
  ],
  [8.6, () => s().setTvChannel(1)],
  [12.4, () => s().setView('discos')],
  [13.6, () => chooseTrack('pearls')],
  [19.2, () => s().setSpot(4)], // poltrona com os livros
  [20.8, () => s().setDossier('magnolia')],
  [23.8, () => s().setDossier(null)],
  [24.4, () => s().setView('janela')],
  [29, () => s().setView('pc')],
  [33, () => s().setView('carro')],
  [
    34.6,
    () => {
      if (!s().headlights) s().toggleHeadlights();
    },
  ],
  [37.6, () => s().setView('motor')],
  [38.8, () => s().setSkill('backend')],
  [42, () => s().setSpot(7)], // vista geral para fechar
];

/**
 * Botão "Iniciar tour" (o clique também libera o som: música e chuva).
 * Durante o tour, a interface some (body.is-tour) para o vídeo ficar limpo.
 */
export function Tour() {
  const ready = useScene((st) => st.ready);
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');

  useEffect(() => {
    if (state !== 'running') return;
    document.body.classList.add('is-tour');
    const timers = STEPS.map(([sec, run]) => window.setTimeout(run, sec * 1000));
    const end = window.setTimeout(() => setState('done'), 45000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
      document.body.classList.remove('is-tour');
    };
  }, [state]);

  if (!TOUR || !ready || state !== 'idle') return null;
  return (
    <div className="tour-start">
      <button
        type="button"
        className="button"
        onClick={() => {
          unlockAudio();
          setState('running');
        }}
      >
        ▶ Iniciar tour (≈40 s)
      </button>
    </div>
  );
}
