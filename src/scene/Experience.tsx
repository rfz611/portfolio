import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Selection } from '@react-three/postprocessing';
import { useEffect, useRef, useState } from 'react';
import { probeAvailability, unlockAudio } from '../audio/player';
import { CameraRig } from '../camera/CameraRig';
import { QUALITY } from '../config/quality';
import { useScene, type Quality } from '../store/useScene';
import { buildLibrary, isLibraryReady } from '../textures/library';
import { Effects } from './Effects';
import { Lights } from './Lights';
import { RecordCorner } from './RecordCorner';
import { Room } from './Room';

const ORDER: Quality[] = ['low', 'medium', 'high'];

/** Avisa quando a cena já desenhou alguns quadros e mede os quadros por segundo. */
function ReadyProbe() {
  const frames = useRef(0);
  const acc = useRef({ time: 0, count: 0 });
  useFrame((_, delta) => {
    frames.current += 1;
    if (frames.current === 4) {
      useScene.getState().setLoadProgress(1);
      useScene.getState().setReady(true);
      window.__ready = true;
      void probeAvailability();
    }
    acc.current.time += delta;
    acc.current.count += 1;
    if (acc.current.time >= 1) {
      window.__fps = Math.round(acc.current.count / acc.current.time);
      acc.current = { time: 0, count: 0 };
    }
  });
  return null;
}

function World() {
  return (
    <Selection>
      <CameraRig />
      <Lights />
      <Room />
      <RecordCorner />
      <Effects />
      <ReadyProbe />
    </Selection>
  );
}

export default function Experience() {
  const quality = useScene((s) => s.quality);
  const autoQuality = useScene((s) => s.autoQuality);
  const [ready, setReady] = useState(isLibraryReady);

  // o som só é liberado no primeiro clique ou toque do visitante
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    let alive = true;
    void buildLibrary((p) => useScene.getState().setLoadProgress(p * 0.92)).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const state = useScene.getState();
    if (!state.autoQuality) return;
    const next = ORDER[ORDER.indexOf(state.quality) + direction];
    if (next) state.setQuality(next);
  };

  return (
    <Canvas
      className="stage"
      dpr={QUALITY[quality].dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 36, near: 0.08, far: 900, position: [0, 9, 17] }}
      onPointerMissed={() => useScene.getState().setHovered(null)}
    >
      <color attach="background" args={['#04050d']} />
      {autoQuality && (
        <PerformanceMonitor
          bounds={() => [42, 57]}
          flipflops={2}
          onDecline={() => step(-1)}
          onIncline={() => step(1)}
        />
      )}
      {ready && <World />}
    </Canvas>
  );
}
