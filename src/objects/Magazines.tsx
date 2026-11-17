import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';
import { certificates } from '../content/certificates';
import { useScene } from '../store/useScene';
import { makeCanvas, tex } from '../textures/canvas';
import { lib } from '../textures/library';
import { paintMagazine } from '../textures/room';
import { Interactive } from './Interactive';

const geometry = new THREE.BoxGeometry(0.22, 0.008, 0.29);

/**
 * Revistas empilhadas na mesa (0,22 × 0,29 m): cada uma é um certificado.
 * O nome da revista é inventado; o destaque da capa é o nome do curso.
 */
export function Magazines() {
  const { t } = useTranslation();
  const { mat } = lib();
  const home = useScene((s) => s.view === 'home');
  const setView = useScene((s) => s.setView);
  const inProgress = t('certificates.inProgress');

  const covers = useMemo(
    () =>
      certificates.map((cert, index) => {
        const map = tex(
          makeCanvas(256, 338, (c, w, h) =>
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
        });
        // faces da caixa: +x, -x, +y (capa), -y, +z, -z
        return [mat.paper, mat.paper, cover, mat.paper, mat.paper, mat.paper];
      }),
    [t, inProgress, mat],
  );

  return (
    <Interactive
      id="magazines"
      label="objects.magazines"
      enabled={home}
      onClick={() => setView('mesa')}
    >
      <group position={[-0.15, 0.424, 0.06]} name="magazines">
        {certificates.map((cert, index) => {
          const level = certificates.length - 1 - index;
          return (
            <mesh
              key={cert.id}
              name={`magazine-${cert.id}`}
              geometry={geometry}
              material={covers[index]}
              position={[level * 0.012, level * 0.0085, level * 0.01]}
              rotation={[0, -0.28 + level * 0.19, 0]}
            />
          );
        })}
      </group>
    </Interactive>
  );
}
