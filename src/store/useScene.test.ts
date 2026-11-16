import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_TRACK } from '../content/tracks';
import { hashFromView, viewFromHash } from './routes';
import { DEFAULT_VOLUME, MAX_VOLUME, useScene } from './useScene';

describe('estado da cena', () => {
  beforeEach(() => {
    useScene.setState({ view: 'home', volume: DEFAULT_VOLUME, muted: false, deck: 'idle' });
  });

  it('começa na sala, com o disco padrão no prato e nada tocando', () => {
    const s = useScene.getState();
    expect(s.view).toBe('home');
    expect(s.trackId).toBe(DEFAULT_TRACK);
    expect(s.deck).toBe('idle');
    expect(s.volume).toBeCloseTo(0.35);
  });

  it('nunca deixa o volume passar de 60%', () => {
    useScene.getState().setVolume(1);
    expect(useScene.getState().volume).toBe(MAX_VOLUME);
    useScene.getState().setVolume(-3);
    expect(useScene.getState().volume).toBe(0);
  });

  it('liga e desliga o mudo', () => {
    useScene.getState().toggleMuted();
    expect(useScene.getState().muted).toBe(true);
    useScene.getState().toggleMuted();
    expect(useScene.getState().muted).toBe(false);
  });

  it('trocar de plano apaga o objeto apontado', () => {
    useScene.getState().setHovered({ id: 'tv', label: 'objects.tv' });
    useScene.getState().setView('tv');
    expect(useScene.getState().hovered).toBeNull();
  });

  it('pedir um disco deixa o prato em troca até a agulha descer', () => {
    useScene.getState().requestTrack('pearls');
    expect(useScene.getState().deck).toBe('changing');
    expect(useScene.getState().requestedTrackId).toBe('pearls');
    useScene.getState().setDeck('playing', 'pearls');
    expect(useScene.getState().trackId).toBe('pearls');
    expect(useScene.getState().requestedTrackId).toBeNull();
  });

  it('trocar a qualidade à mão desliga o ajuste automático', () => {
    useScene.setState({ autoQuality: true });
    useScene.getState().setQuality('low', true);
    expect(useScene.getState().autoQuality).toBe(false);
  });
});

describe('endereços das seções', () => {
  it('abre cada seção pelo endereço', () => {
    expect(viewFromHash('#projetos')).toBe('tv');
    expect(viewFromHash('#sobre')).toBe('pc');
    expect(viewFromHash('#skills')).toBe('motor');
    expect(viewFromHash('#certificados')).toBe('mesa');
    expect(viewFromHash('#contato')).toBe('interior');
    expect(viewFromHash('#discos')).toBe('discos');
  });

  it('endereço desconhecido cai no plano inicial', () => {
    expect(viewFromHash('#nada')).toBe('home');
    expect(viewFromHash('')).toBe('home');
  });

  it('vai e volta sem perder a seção', () => {
    expect(viewFromHash(hashFromView('tv'))).toBe('tv');
    expect(hashFromView('home')).toBe('');
  });
});
