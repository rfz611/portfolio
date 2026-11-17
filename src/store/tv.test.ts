import { describe, expect, it } from 'vitest';
import { projects } from '../content/projects';
import { stepChannel } from './tv';
import { useScene } from './useScene';

describe('canais da TV', () => {
  it('começa no canal 01', () => {
    expect(useScene.getState().tvChannel).toBe(0);
    expect(projects[0].channel).toBe('01');
  });

  it('avança, volta e dá a volta entre os canais', () => {
    useScene.setState({ tvChannel: 0 });
    stepChannel(1);
    expect(useScene.getState().tvChannel).toBe(1 % projects.length);
    stepChannel(-1);
    expect(useScene.getState().tvChannel).toBe(0);
    stepChannel(-1);
    expect(useScene.getState().tvChannel).toBe(projects.length - 1);
  });

  it('todo canal tem nome, tecnologias e print definidos', () => {
    for (const project of projects) {
      expect(project.tech.length).toBeGreaterThan(0);
      expect(project.image).toMatch(/^\/textures\/projects\//);
    }
  });
});
