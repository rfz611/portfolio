import { describe, expect, it } from 'vitest';
import { VIEWS } from '../store/useScene';
import { resolveShot, SHOTS } from './shots';

const rad = (deg: number) => (deg * Math.PI) / 180;

describe('planos de câmera', () => {
  it('todo plano existe e tem posição válida', () => {
    for (const view of VIEWS) {
      const pose = resolveShot(view, 16 / 9);
      expect(pose.position.every(Number.isFinite)).toBe(true);
      expect(pose.duration).toBeGreaterThanOrEqual(1.2);
      expect(pose.duration).toBeLessThanOrEqual(1.6);
    }
  });

  it('o enquadramento pedido cabe na tela larga e na tela em pé', () => {
    for (const aspect of [16 / 9, 9 / 19.5]) {
      for (const view of VIEWS) {
        const base = SHOTS[view];
        const shot = aspect < 1 && base.portrait ? { ...base, ...base.portrait } : base;
        const pose = resolveShot(view, aspect);
        const distance = Math.hypot(
          pose.position[0] - pose.target[0],
          pose.position[1] - pose.target[1],
          pose.position[2] - pose.target[2],
        );
        const visibleH = 2 * distance * Math.tan(rad(pose.fov) / 2);
        const visibleW = visibleH * aspect;
        expect(visibleW).toBeGreaterThanOrEqual(shot.frame[0] - 1e-6);
        expect(visibleH).toBeGreaterThanOrEqual(shot.frame[1] - 1e-6);
      }
    }
  });

  it('o plano inicial fica do lado de fora e acima do teto', () => {
    const pose = resolveShot('home', 16 / 9);
    expect(pose.position[2]).toBeGreaterThan(4.5);
    expect(pose.position[1]).toBeGreaterThan(3.4);
  });
});
