import { projects } from '../content/projects';
import { useScene } from './useScene';

/** Troca de canal da TV: anda para a frente ou para trás, dando a volta. */
export function stepChannel(step: number) {
  const s = useScene.getState();
  s.setTvChannel((s.tvChannel + step + projects.length) % projects.length);
}
