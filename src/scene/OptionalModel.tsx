import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Suspense, useMemo, type ReactNode } from 'react';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import files from 'virtual:models-manifest';

/** Existe um .glb com esse nome em public/models? */
const hasModel = (file: string): boolean => files.includes(file);

function Glb({ file, fit }: { file: string; fit?: number }) {
  const gl = useThree((s) => s.gl);
  const ktx2 = useMemo(() => new KTX2Loader().setTranscoderPath('/basis/').detectSupport(gl), [gl]);
  const { scene } = useGLTF(`/models/${file}`, false, true, (loader) => {
    // o drei usa a cópia do carregador em three-stdlib; a interface é a mesma
    loader.setKTX2Loader(ktx2 as never);
  });
  // com fit, o modelo baixado é escalado para caber nesse tamanho e apoiado no chão do grupo
  const object = useMemo(() => {
    if (!fit) return scene;
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const k = fit / Math.max(size.x, size.y, size.z, 1e-6);
    const center = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    scene.scale.setScalar(k);
    scene.position.set(-center.x * k, -box.min.y * k, -center.z * k);
    holder.add(scene);
    return holder;
  }, [scene, fit]);
  return <primitive object={object} />;
}

/**
 * Todo objeto da cena é modelado no código (children). Se um dia existir
 * em public/models um .glb com o nome da tabela de modelos, ele entra no
 * lugar, sem mudar mais nada. É só uma melhoria opcional para o futuro.
 */
export function OptionalModel({
  file,
  fit,
  children,
}: {
  file: string;
  /** maior medida, em metros, para um modelo baixado de outro lugar */
  fit?: number;
  children: ReactNode;
}) {
  if (!hasModel(file)) return <>{children}</>;
  return (
    <Suspense fallback={children}>
      <Glb file={file} fit={fit} />
    </Suspense>
  );
}
