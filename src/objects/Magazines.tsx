import { useFrame } from '@react-three/fiber';
import { Select } from '@react-three/postprocessing';
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
const hitGeometry = new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2);

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
  const setView = useScene((s) => s.setView);
  const setMagazine = useScene((s) => s.setMagazine);
  const inProgress = t('certificates.inProgress');
  // revista revelada: as de índice menor (mais em cima) saem para o lado
  const [focus, setFocus] = useState(0);
  // revista cuja área de mouse está sob o ponteiro
  const [hit, setHit] = useState<number | null>(null);
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

  // mouse sobre a beirada de uma revista de baixo: as de cima deslizam e ela aparece
  const interactive = onTable && opened === null;
  const target = interactive && hit !== null ? Math.max(hit, focus) : null;

  // saiu de cima das revistas: depois de um tempo a pilha volta ao lugar
  useEffect(() => {
    if (hit !== null) return;
    const timer = window.setTimeout(() => setFocus(0), 1400);
    return () => window.clearTimeout(timer);
  }, [hit]);

  // rótulo com o nome do curso da revista que vai abrir
  useEffect(() => {
    const store = useScene.getState();
    if (target === null) {
      if (store.hovered?.id === 'magazine') store.setHovered(null);
      return;
    }
    store.setHovered({ id: 'magazine', label: `certificates.${certificates[target].id}` });
  }, [target]);

  useEffect(() => {
    if (!onTable) {
      setFocus(0);
      setHit(null);
    }
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

  const open = (index: number) => {
    setMagazine(Math.max(index, focus));
    setHit(null);
  };

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
            <Select key={cert.id} enabled={target === index}>
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
            </Select>
          );
        })}
        {/* áreas de mouse paradas no lugar de cada revista na pilha: só o desenho
            da revista se mexe, então ela não "foge" do mouse e não fica indo e voltando */}
        {interactive &&
          certificates.map((cert, index) => {
            const start = stackPose(index, certificates.length);
            return (
              <mesh
                key={cert.id}
                geometry={hitGeometry}
                position={[start.position.x, start.position.y + 0.0046, start.position.z]}
                quaternion={start.quaternion}
                onPointerOver={(event) => {
                  event.stopPropagation();
                  setHit(index);
                  if (index > focus) setFocus(index);
                }}
                onPointerOut={() => setHit((h) => (h === index ? null : h))}
                onClick={(event) => {
                  event.stopPropagation();
                  if (event.delta > 6) return;
                  open(index);
                }}
              >
                <meshBasicMaterial visible={false} />
              </mesh>
            );
          })}
      </group>
    </Interactive>
  );
}
