import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { frontPose, tablePose } from './magazinePoses';

describe('revistas', () => {
  it('ficam espalhadas: as quatro em lugares diferentes da mesa', () => {
    const spots = [0, 1, 2, 3].map((i) => tablePose(i).position);
    for (let a = 0; a < spots.length; a++) {
      for (let b = a + 1; b < spots.length; b++) {
        expect(spots[a].distanceTo(spots[b])).toBeGreaterThan(0.2);
      }
    }
  });

  it('o mouse em cima levanta a revista um pouco', () => {
    expect(tablePose(1, 0.012).position.y).toBeGreaterThan(tablePose(1).position.y);
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
