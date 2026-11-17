import { beforeEach, describe, expect, it, vi } from 'vitest';

interface FakeHowl {
  options: { src: string[]; format?: string[]; html5?: boolean; volume?: number };
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  fade: ReturnType<typeof vi.fn>;
  volume: ReturnType<typeof vi.fn>;
}

const created: FakeHowl[] = [];

vi.mock('howler', () => {
  class Howl {
    options: FakeHowl['options'];
    private current: number;
    play = vi.fn();
    pause = vi.fn();
    stop = vi.fn();
    unload = vi.fn();
    off = vi.fn();
    playing = vi.fn(() => false);
    duration = vi.fn(() => 200);
    seek = vi.fn(() => 50);
    fade = vi.fn();
    volume = vi.fn((value?: number) => {
      if (typeof value === 'number') this.current = value;
      return this.current;
    });
    constructor(options: FakeHowl['options']) {
      this.options = options;
      this.current = options.volume ?? 1;
      created.push(this as unknown as FakeHowl);
    }
  }
  return { Howl, Howler: { mute: vi.fn() } };
});

vi.mock('./sfx', () => ({ makeSfx: () => null }));

import { DEFAULT_VOLUME, MAX_VOLUME, useScene } from '../store/useScene';
import {
  chooseTrack,
  FADE_IN_MS,
  needleDown,
  nextTrackId,
  pause,
  progress,
  resetPlayerForTests,
  resume,
} from './player';

const music = () => created.filter((h) => h.options.html5);

describe('player de música', () => {
  beforeEach(() => {
    created.length = 0;
    resetPlayerForTests();
    useScene.setState({
      trackId: 'raining',
      deck: 'idle',
      requestedTrackId: null,
      volume: DEFAULT_VOLUME,
      muted: false,
      availability: {},
    });
  });

  it('nada toca sozinho: sem clique não existe áudio', () => {
    expect(created).toHaveLength(0);
    expect(useScene.getState().deck).toBe('idle');
  });

  it('escolher um disco começa a troca, mas o som só entra quando a agulha desce', () => {
    chooseTrack('pearls');
    expect(useScene.getState().deck).toBe('changing');
    expect(useScene.getState().requestedTrackId).toBe('pearls');
    expect(music()).toHaveLength(0);

    needleDown('pearls');
    const [howl] = music();
    expect(howl.options.src).toEqual(['/audio/pearls.ogg', '/audio/pearls.mp3']);
    expect(howl.options.volume).toBe(0);
    expect(howl.play).toHaveBeenCalledOnce();
    expect(howl.fade).toHaveBeenCalledWith(0, DEFAULT_VOLUME, FADE_IN_MS);
    expect(useScene.getState().deck).toBe('playing');
    expect(useScene.getState().trackId).toBe('pearls');
  });

  it('o fade de entrada nunca passa de 60%', () => {
    useScene.setState({ volume: 5 });
    chooseTrack('roads');
    needleDown('roads');
    expect(music()[0].fade).toHaveBeenCalledWith(0, MAX_VOLUME, FADE_IN_MS);
  });

  it('mexer no volume ajusta a faixa que está tocando', () => {
    chooseTrack('roads');
    needleDown('roads');
    useScene.getState().setVolume(0.2);
    expect(music()[0].volume).toHaveBeenCalledWith(0.2);
  });

  it('pausa e volta sem trocar de disco', () => {
    chooseTrack('crime');
    needleDown('crime');
    pause();
    expect(useScene.getState().deck).toBe('paused');
    expect(music()[0].pause).toHaveBeenCalledOnce();
    resume();
    expect(useScene.getState().deck).toBe('playing');
    expect(music()).toHaveLength(1);
  });

  it('ignora disco com o selo "em breve"', () => {
    useScene.getState().setAvailability('atm', 'missing');
    chooseTrack('atm');
    expect(useScene.getState().deck).toBe('idle');
  });

  it('ignora a agulha de um pedido antigo', () => {
    chooseTrack('pearls');
    chooseTrack('roads');
    needleDown('pearls');
    expect(music()).toHaveLength(0);
    needleDown('roads');
    expect(useScene.getState().trackId).toBe('roads');
  });

  it('o próximo disco pula os que faltam e dá a volta na estante', () => {
    const ids = ['a', 'b', 'c'];
    expect(nextTrackId('a', {}, ids)).toBe('b');
    expect(nextTrackId('a', { b: 'missing' }, ids)).toBe('c');
    expect(nextTrackId('c', {}, ids)).toBe('a');
    expect(nextTrackId('a', { b: 'missing', c: 'missing' }, ids)).toBeNull();
  });

  it('informa o progresso da faixa para a agulha andar', () => {
    expect(progress()).toBe(0);
    chooseTrack('eyes');
    needleDown('eyes');
    expect(progress()).toBeCloseTo(0.25);
  });
});
