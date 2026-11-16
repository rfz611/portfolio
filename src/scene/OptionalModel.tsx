import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Suspense, useMemo, type ReactNode } from 'react';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import files from 'virtual:models-manifest';

/** Existe um .glb com esse nome em public/models? */
const hasModel = (file: string): boolean => files.includes(file);

function Glb({ file }: { file: string }) {
  const gl = useThree((s) => s.gl);
  const ktx2 = useMemo(() => new KTX2Loader().setTranscoderPath('/basis/').detectSupport(gl), [gl]);
  const { scene } = useGLTF(`/models/${file}`, false, true, (loader) => {
    // o drei usa a cópia do carregador em three-stdlib; a interface é a mesma
    loader.setKTX2Loader(ktx2 as never);
  });
  return <primitive object={scene} />;
}

/**
 * Todo objeto da cena é modelado no código (children). Se um dia existir
 * em public/models um .glb com o nome da tabela de modelos, ele entra no
 * lugar, sem mudar mais nada. É só uma melhoria opcional para o futuro.
 */
export function OptionalModel({ file, children }: { file: string; children: ReactNode }) {
  if (!hasModel(file)) return <>{children}</>;
  return (
    <Suspense fallback={children}>
      <Glb file={file} />
    </Suspense>
  );
}
