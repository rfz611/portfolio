import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { certificates } from '../content/certificates';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintMagazine } from '../textures/room';
import { Interactive } from './Interactive';
import { frontPose, tablePose, type Pose } from './magazinePoses';

const W = 0.22;
const D = 0.29;
const LIFT = 0.012;
const geometry = new THREE.BoxGeometry(W, 0.008, D);

const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const parentQuat = new THREE.Quaternion();

/**
 * Revistas largadas na mesa (0,22 × 0,29 m): cada uma é um certificado,
 * com nome de revista inventado e o curso em destaque na capa.
 * Ficam espalhadas, todas à vista. Na mesa, passar o mouse levanta um
 * pouco a revista apontada (com contorno e o nome); clicar traz a revista
 * para a frente da câmera, acesa, para ler a capa.
 */
export function Magazines() {
  const { t } = useTranslation();
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const onTable = useScene((s) => s.view === 'mesa');
  const opened = useScene((s) => s.magazine);
  const hoveredId = useScene((s) => s.hovered?.id ?? null);
  const setView = useScene((s) => s.setView);
  const setMagazine = useScene((s) => s.setMagazine);
  const inProgress = t('certificates.inProgress');
  const group = useRef<THREE.Group>(null);
  const items = useRef<(THREE.Mesh | null)[]>([]);

  const covers = useMemo(
    () =>
      certificates.map((cert, index) => {
        const map = tex(
          makeCanvas(512, 676, (c, w, h) =>
            paintMagazine(c, w, h, {
              title: cert.magazine,
              headline: t(`certificates.${cert.id}`),
              sub: `${cert.provider} · ${cert.year ?? inProgress}`,
              color: cert.color,
              issue: index + 4,
            }),
          ),
          { clamp: true },
        );
        const cover = new THREE.MeshStandardMaterial({
          map,
          roughness: 0.35,
          envMapIntensity: 0.8,
          emissive: '#ffffff',
          emissiveMap: map,
          emissiveIntensity: 0,
        });
        // faces da caixa: +x, -x, +y (capa), -y, +z, -z
        return { cover, faces: [mat.paper, mat.paper, cover, mat.paper, mat.paper, mat.paper] };
      }),
    [t, inProgress, mat],
  );

  useFrame(({ camera, size }, delta) => {
    const parent = group.current;
    if (!parent) return;
    parent.updateWorldMatrix(true, false);
    parent.getWorldQuaternion(parentQuat).invert();
    const k = 1 - Math.exp(-delta * 9);
    certificates.forEach((cert, index) => {
      const mesh = items.current[index];
      if (!mesh) return;
      let pose: Pose;
      if (opened === index && onTable) {
        frontPose(
          camera as THREE.PerspectiveCamera,
          size.width / size.height,
          W,
          D,
          tmpPos,
          tmpQuat,
        );
        parent.worldToLocal(tmpPos);
        tmpQuat.premultiply(parentQuat);
        pose = { position: tmpPos, quaternion: tmpQuat };
      } else {
        const lifted = onTable && opened === null && hoveredId === `magazine-${cert.id}`;
        pose = tablePose(index, lifted ? LIFT : 0);
      }
      mesh.position.lerp(pose.position, k);
      mesh.quaternion.slerp(pose.quaternion, k);
      const glow = opened === index && onTable ? 0.55 : 0;
      const cover = covers[index].cover;
      cover.emissiveIntensity += (glow - cover.emissiveIntensity) * k;
    });
  });

  return (
    <Interactive
      id="magazines"
      label="objects.magazines"
      enabled={home}
      onClick={() => setView('mesa')}
    >
      <group ref={group} position={[-0.08, 0.424, 0.05]} name="magazines">
        {certificates.map((cert, index) => {
          const start = tablePose(index);
          return (
            <Interactive
              key={cert.id}
              id={`magazine-${cert.id}`}
              label={`certificates.${cert.id}`}
              enabled={onTable && opened === null}
              onClick={() => {
                setMagazine(index);
                useScene.getState().setHovered(null);
              }}
            >
              <mesh
                ref={(mesh) => {
                  items.current[index] = mesh;
                }}
                name={`magazine-${cert.id}`}
                geometry={geometry}
                material={covers[index].faces}
                position={start.position}
                quaternion={start.quaternion}
                renderOrder={opened === index ? 5 : 0}
              />
            </Interactive>
          );
        })}
      </group>
    </Interactive>
  );
}
