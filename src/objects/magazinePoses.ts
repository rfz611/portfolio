import * as THREE from 'three';

export interface Pose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

const THICK = 0.0085;
const UP = new THREE.Vector3(0, 1, 0);

/** Posição (x, z) e giro de cada revista na pilha: índice 0 é a de cima. */
const LOOSE: [number, number, number][] = [
  [-0.03, 0.03, 0.12],
  [0.02, 0.12, 1.32],
  [-0.08, -0.02, -0.62],
  [0.05, 0.04, 0.45],
];

const yaw = (angle: number) => new THREE.Quaternion().setFromAxisAngle(UP, angle);

/** Lugar de cada revista na pilha largada na mesa. */
export function stackPose(index: number, count: number): Pose {
  const [x, z, angle] = LOOSE[index % LOOSE.length];
  const level = count - 1 - index;
  return { position: new THREE.Vector3(x, level * THICK, z), quaternion: yaw(angle) };
}

/** Revista que deslizou para o lado (fica à esquerda, em leque, sobre a mesa). */
export function slidPose(index: number, focus: number): Pose {
  const order = focus - 1 - index; // 0 = a que saiu primeiro... a de baixo do monte deslizado
  const [x, z, angle] = LOOSE[index % LOOSE.length];
  return {
    position: new THREE.Vector3(x - 0.24 - order * 0.025, order * THICK, z + 0.07 + order * 0.03),
    quaternion: yaw(angle + 0.35),
  };
}

const up = new THREE.Vector3();
const forward = new THREE.Vector3();
// a capa é a face +y da caixa; o topo da capa fica em -z
const FACE_CAMERA = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  Math.PI / 2,
);

/**
 * Pose da revista aberta na frente da câmera, ocupando ~80% da altura
 * (ou ~86% da largura na tela em pé), um pouco acima do centro para deixar
 * espaço para a legenda. Resultado em coordenadas do mundo.
 */
export function frontPose(
  camera: THREE.PerspectiveCamera,
  aspect: number,
  w: number,
  d: number,
  outPos: THREE.Vector3,
  outQuat: THREE.Quaternion,
) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const distance = Math.max(d / 0.78 / (2 * tanV), w / 0.86 / (2 * tanV * aspect));
  camera.getWorldDirection(forward);
  up.set(0, 1, 0).applyQuaternion(camera.quaternion);
  outPos
    .copy(camera.position)
    .addScaledVector(forward, distance)
    .addScaledVector(up, 2 * tanV * distance * 0.035);
  outQuat.copy(camera.quaternion).multiply(FACE_CAMERA);
}
