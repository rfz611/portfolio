import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { frontPose, slidPose, stackPose } from './magazinePoses';

describe('revistas', () => {
  it('a de cima da pilha fica mais alta', () => {
    expect(stackPose(0, 4).position.y).toBeGreaterThan(stackPose(3, 4).position.y);
  });

  it('a revista que desliza sai para o lado da pilha', () => {
    expect(slidPose(0, 1).position.x).toBeLessThan(stackPose(0, 4).position.x - 0.2);
  });

  it('a revista aberta fica na frente da câmera, com a capa virada para ela', () => {
    const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.08, 100);
    camera.position.set(0, 2, 0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    frontPose(camera, 16 / 9, 0.22, 0.29, pos, quat);
    expect(pos.y).toBeLessThan(2);
    expect(pos.y).toBeGreaterThan(1);
    const cover = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
    expect(cover.y).toBeGreaterThan(0.99);
  });
});
