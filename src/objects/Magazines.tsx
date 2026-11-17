import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { certificates } from '../content/certificates';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintMagazine } from '../textures/room';
import { Interactive } from './Interactive';
import { frontPose, slidPose, stackPose, type Pose } from './magazinePoses';

const W = 0.22;
const D = 0.29;
const geometry = new THREE.BoxGeometry(W, 0.008, D);

const tmpPos = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const parentQuat = new THREE.Quaternion();

/**
 * Revistas largadas na mesa (0,22 × 0,29 m): cada uma é um certificado,
 * com nome de revista inventado e o curso em destaque na capa.
 * Na mesa: passar o mouse na beirada de uma revista faz as de cima
 * deslizarem para o lado e revela ela inteira; clicar traz a revista para
 * a frente da câmera, acesa, para ler a capa.
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
  // revista revelada: as de índice menor (mais em cima) saem para o lado
  const [focus, setFocus] = useState(0);
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

  // passar o mouse numa revista de baixo revela ela (as de cima deslizam)
  useEffect(() => {
    const index = certificates.findIndex((c) => hoveredId === `magazine-${c.id}`);
    if (index >= 0) {
      if (index > focus) setFocus(index);
      return;
    }
    // saiu das revistas: depois de um tempo a pilha volta ao lugar
    const timer = window.setTimeout(() => setFocus(0), 1400);
    return () => window.clearTimeout(timer);
  }, [hoveredId, focus]);

  useEffect(() => {
    if (!onTable) setFocus(0);
  }, [onTable]);

  useFrame(({ camera, size }, delta) => {
    const parent = group.current;
    if (!parent) return;
    parent.updateWorldMatrix(true, false);
    parent.getWorldQuaternion(parentQuat).invert();
    const k = 1 - Math.exp(-delta * 9);
    certificates.forEach((_, index) => {
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
      } else if (index < focus && onTable) {
        pose = slidPose(index, focus);
      } else {
        pose = stackPose(index, certificates.length);
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
      <group ref={group} position={[-0.17, 0.424, 0.1]} name="magazines">
        {certificates.map((cert, index) => {
          const start = stackPose(index, certificates.length);
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
