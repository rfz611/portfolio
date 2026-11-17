import {
  Bloom,
  BrightnessContrast,
  HueSaturation,
  EffectComposer,
  N8AO,
  Noise,
  Outline,
  Sepia,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing';
import { useThree } from '@react-three/fiber';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import { useEffect } from 'react';
import * as THREE from 'three';
import { palette } from '../config/palette';
import { QUALITY } from '../config/quality';
import { useScene } from '../store/useScene';

const AMBER = new THREE.Color(palette.amber).getHex();

/**
 * Acabamento por cima do visual PS2: bloom só nas fontes de luz,
 * sombreamento de contato, contorno âmbar no objeto apontado, cor
 * sépia e dessaturada como em Max Payne 2, granulado de filme e vinheta. No nível baixo nada disso roda.
 */
export function Effects() {
  const quality = useScene((s) => s.quality);
  const tier = QUALITY[quality];
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    // sem pós-processamento, o próprio renderizador faz o tone mapping
    if (!tier.post) {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.05;
    }
  }, [gl, tier.post]);

  if (!tier.post) return null;

  return (
    <EffectComposer multisampling={tier.msaa} autoClear={false}>
      {tier.heavy ? (
        <N8AO
          halfRes
          aoRadius={0.55}
          distanceFalloff={0.6}
          intensity={2.4}
          quality="low"
          color="#03020a"
        />
      ) : (
        <></>
      )}
      <Outline
        blur
        edgeStrength={2.6}
        visibleEdgeColor={AMBER}
        hiddenEdgeColor={AMBER}
        kernelSize={KernelSize.VERY_SMALL}
        xRay={false}
      />
      <Bloom
        mipmapBlur
        luminanceThreshold={1}
        luminanceSmoothing={0.2}
        intensity={0.6}
        radius={0.72}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      {/* cor de Max Payne 2: menos saturada, puxada para o sépia, com contraste */}
      <HueSaturation saturation={-0.04} />
      <Sepia intensity={0.13} />
      <BrightnessContrast brightness={0.01} contrast={0.12} />
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.14} />
      <Vignette offset={0.25} darkness={0.78} />
    </EffectComposer>
  );
}
