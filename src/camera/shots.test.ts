import { describe, expect, it } from 'vitest';
import { ROOM } from '../config/layout';
import { VIEWS } from '../store/useScene';
import { HOME_OPTIONS, resolveShot, SHOTS } from './shots';

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
        if (!shot.frame) continue;
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

  it('as opções de plano inicial com posição fixa ficam dentro da sala', () => {
    for (const option of HOME_OPTIONS.filter((o) => o.position)) {
      for (const aspect of [16 / 9, 9 / 19.5]) {
        const pose = resolveShot('home', aspect, option);
        const [x, y, z] = pose.position;
        expect(x).toBeGreaterThan(ROOM.x0);
        expect(x).toBeLessThan(ROOM.x1);
        expect(z).toBeGreaterThan(ROOM.z0);
        expect(z).toBeLessThan(ROOM.z1);
        expect(y).toBeLessThan(ROOM.h);
        expect(pose.fov).toBeLessThanOrEqual(80);
      }
    }
  });
});

describe('pontos de vista da sala', () => {
  it('todos ficam dentro da sala (o da garagem, na garagem), e os de pé fora do rebaixo', async () => {
    const { SPOTS } = await import('./spots');
    const { GARAGE, PIT } = await import('../config/layout');
    for (const spot of SPOTS) {
      const [x, y, z] = spot.position!;
      const area = spot.id === 'garagem' ? GARAGE : ROOM;
      expect(x).toBeGreaterThan(area.x0);
      expect(x).toBeLessThan(area.x1);
      expect(z).toBeGreaterThan(ROOM.z0);
      expect(z).toBeLessThan(ROOM.z1);
      expect(y).toBeLessThan(ROOM.h);
      if (spot.id === 'sofa') continue;
      const inPit = x > PIT.x0 && x < PIT.x1 && z > PIT.z0 && z < PIT.z1;
      expect(inPit).toBe(false);
    }
  });
});
