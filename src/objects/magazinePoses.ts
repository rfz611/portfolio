import * as THREE from 'three';

export interface Pose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Lugar de cada revista na mesa: espalhadas em 2 × 2, cada uma levemente
 * torta, sem uma cobrir a capa da outra (x, z, giro).
 */
const SPREAD: [number, number, number][] = [
  [-0.118, -0.155, 0.08],
  [0.118, -0.15, -0.06],
  [-0.122, 0.162, -0.05],
  [0.112, 0.168, 0.1],
];

const yaw = (angle: number) => new THREE.Quaternion().setFromAxisAngle(UP, angle);

/** Revista deitada na mesa; o parâmetro lift a levanta um pouco (mouse em cima). */
export function tablePose(index: number, lift = 0): Pose {
  const [x, z, angle] = SPREAD[index % SPREAD.length];
  return { position: new THREE.Vector3(x, index * 0.0006 + lift, z), quaternion: yaw(angle) };
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
