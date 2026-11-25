import { PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Selection } from '@react-three/postprocessing';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { probeAvailability, unlockAudio } from '../audio/player';
import { CameraRig } from '../camera/CameraRig';
import { isHandheld, QUALITY } from '../config/quality';
import { useScene, type Quality } from '../store/useScene';
import { buildLibrary, isLibraryReady } from '../textures/library';
import { Bar } from './Bar';
import { City, CityFog } from './City';
import { prepareCity } from './cityGeometry';
import { CoatStand } from '../objects/PersonalItems';
import { Decor } from './Decor';
import { DeskArea } from './Desk';
import { Effects } from './Effects';
import { Folks } from './Folks';
import { Lights } from './Lights';
import { Lounge } from './Lounge';
import { Plants } from './Plants';
import { Rain } from './Rain';
import { RecordCorner } from './RecordCorner';
import { Rooftops } from './Rooftops';
import { SpotMarkers } from './SpotMarkers';
import { Room } from './Room';
import { Garage } from './Garage';
import { WindowWall } from './WindowWall';
import { SLICE_MS, yieldToBrowser } from './slices';

const ORDER: Quality[] = ['low', 'medium', 'high'];

/** Fatias da barra de carregamento: texturas, montagem da cena, shaders. */
const LOAD = { library: 0.55, stages: 0.9, compiled: 0.96 };

/**
 * A cobertura é montada em etapas, uma por tarefa do navegador, para a
 * thread principal não travar num bloco só. As luzes e a neblina entram
 * primeiro: elas fazem parte do shader de todo material, e mudar a conta
 * delas depois obrigaria a recompilar tudo.
 */
const STAGES: ReactNode[] = [
  <Fragment key="room">
    <Lights />
    <CityFog />
    <Room />
  </Fragment>,
  <RecordCorner key="records" />,
  <Lounge key="lounge" />,
  <DeskArea key="desk" />,
  <Bar key="bar" />,
  <Fragment key="decor">
    <Plants />
    <Decor />
    <SpotMarkers />
    <CoatStand position={[5.55, 0, 3.95]} />
  </Fragment>,
  <Garage key="garage" />,
  <WindowWall key="window" />,
];

/**
 * O que fica do lado de fora entra depois que o elevador abre, aos poucos e
 * só quando o navegador está ocioso: a cidade, as coberturas vizinhas, o
 * Folks e a chuva. Nenhum deles tem luz própria.
 */
const OUTSIDE: ReactNode[] = [
  <City key="city" />,
  <Rooftops key="rooftops" />,
  <Folks key="folks" />,
  <Rain key="rain" />,
];

/** Espera o navegador ficar ocioso (ou um tempo curto, onde não há como saber). */
function idle(timeout: number) {
  return new Promise<void>((resolve) => {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => resolve(), { timeout });
    } else setTimeout(resolve, 50);
  });
}

/**
 * Um objeto de cada material (o shader depende do material e do tipo de
 * objeto) e todas as texturas usadas no grupo.
 */
function compileList(group: THREE.Object3D) {
  const objects: THREE.Object3D[] = [];
  const textures = new Set<THREE.Texture>();
  const seen = new Set<string>();
  group.traverse((o) => {
    const material = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!material) return;
    const mats = Array.isArray(material) ? material : [material];
    const kind = (o as THREE.InstancedMesh).isInstancedMesh ? 'i' : o.type;
    const key = `${kind}:${mats.map((m) => m.uuid).join(',')}`;
    if (seen.has(key)) return;
    seen.add(key);
    objects.push(o);
    for (const m of mats) {
      for (const value of Object.values(m)) {
        if ((value as THREE.Texture | null)?.isTexture) textures.add(value as THREE.Texture);
      }
    }
  });
  return { objects, textures: [...textures] };
}

/**
 * Compila os shaders de um grupo escondido sem travar a página: poucos
 * materiais por tarefa e, com KHR_parallel_shader_compile, o navegador
 * termina cada um em segundo plano. Com pós-processamento a cena é desenhada
 * numa textura, e o shader muda: a compilação usa um alvo de mesmo tipo
 * para sair igual ao que vai ser usado.
 */
async function precompile(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  group: THREE.Object3D,
  post: boolean,
) {
  const { objects, textures } = compileList(group);
  // As luzes visíveis com o grupo aparecendo (como vai ficar), contadas uma
  // vez só: percorrer a cena inteira a cada material custava caro.
  const lights: THREE.Object3D[] = [];
  group.visible = true;
  scene.traverseVisible((o) => {
    if ((o as THREE.Light).isLight) lights.push(o);
  });
  group.visible = false;
  // Cena só para compilar: mesmas luzes, neblina e ambiente da de verdade
  // (tudo isso entra no shader), sem percorrer os objetos dela.
  const stage = new THREE.Scene();
  stage.fog = scene.fog;
  stage.environment = scene.environment;
  stage.traverseVisible = (callback) => lights.forEach(callback);
  // Lote da vez, passado ao three como se fosse uma cena; não lista luzes,
  // senão o three as conta duas vezes e o shader sai outro.
  let batch: THREE.Object3D[] = [];
  const proxy = {
    traverse: (callback: (o: THREE.Object3D) => void) => batch.forEach(callback),
    traverseVisible: () => {},
  } as unknown as THREE.Object3D;
  const target = post ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }) : null;
  const pending: Promise<unknown>[] = [];
  let next = 0;
  while (next < objects.length) {
    const start = performance.now();
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(target);
    try {
      while (next < objects.length && performance.now() - start < SLICE_MS) {
        batch = [objects[next++]];
        pending.push(gl.compileAsync(proxy, camera, stage));
      }
    } finally {
      gl.setRenderTarget(previous);
    }
    await yieldToBrowser();
  }
  // texturas vão para a placa de vídeo aos poucos, em vez de todas no
  // primeiro quadro desenhado
  for (let i = 0; i < textures.length;) {
    const start = performance.now();
    while (i < textures.length && performance.now() - start < SLICE_MS) {
      gl.initTexture(textures[i++]);
    }
    await yieldToBrowser();
  }
  await Promise.all(pending);
  target?.dispose();
}

/**
 * Monta as etapas uma por tarefa dentro de um grupo invisível, compila os
 * shaders em segundo plano e só então mostra tudo.
 */
function useStaged(count: number, start: boolean, onProgress?: (p: number) => void) {
  const group = useRef<THREE.Group>(null);
  const [mounted, setMounted] = useState(0);
  const [shown, setShown] = useState(false);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const post = useScene((s) => QUALITY[s.quality].post);

  useEffect(() => {
    if (!start) return;
    let alive = true;
    if (mounted < count) {
      onProgress?.(mounted / count);
      // uma etapa por tarefa: o navegador respira (e desenha) entre elas
      const timer = window.setTimeout(() => alive && setMounted((m) => m + 1), 0);
      return () => {
        alive = false;
        window.clearTimeout(timer);
      };
    }
    onProgress?.(1);
    if (group.current) {
      void precompile(gl, scene, camera, group.current, post).then(() => {
        if (alive) setShown(true);
      });
    }
    return () => {
      alive = false;
    };
    // a qualidade só pesa na compilação; mudar depois não remonta nada
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, mounted, count]);

  return { group, mounted, shown };
}

/** Avisa quando a cena já desenhou alguns quadros e mede os quadros por segundo. */
function ReadyProbe({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const acc = useRef({ time: 0, count: 0 });
  useFrame((_, delta) => {
    frames.current += 1;
    if (frames.current === 3) {
      useScene.getState().setLoadProgress(1);
      useScene.getState().setReady(true);
      window.__ready = true;
      void probeAvailability();
      onReady();
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

/** A cidade e a chuva: entram uma de cada vez, nos intervalos ociosos. */
function Outside() {
  const [go, setGo] = useState(false);
  useEffect(() => {
    let alive = true;
    // deixa o elevador abrir e a sala assentar; aí gera a cidade aos poucos
    // e só então monta as peças de fora
    void idle(1500)
      .then(prepareCity)
      .then(() => alive && setGo(true));
    return () => {
      alive = false;
    };
  }, []);
  const { group, mounted, shown } = useStaged(OUTSIDE.length, go);
  return (
    <group ref={group} visible={shown}>
      {OUTSIDE.slice(0, mounted)}
    </group>
  );
}

function World() {
  const setProgress = (p: number) =>
    useScene.getState().setLoadProgress(LOAD.library + (LOAD.stages - LOAD.library) * p);
  const { group, mounted, shown } = useStaged(STAGES.length, true, setProgress);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (shown) useScene.getState().setLoadProgress(LOAD.compiled);
  }, [shown]);

  return (
    <Selection>
      <CameraRig />
      <group ref={group} visible={shown}>
        {STAGES.slice(0, mounted)}
      </group>
      {settled && <Outside />}
      <Effects />
      {shown && <ReadyProbe onReady={() => setSettled(true)} />}
    </Selection>
  );
}

export default function Experience() {
  const quality = useScene((s) => s.quality);
  const autoQuality = useScene((s) => s.autoQuality);
  const [ready, setReady] = useState(isLibraryReady);
  const [handheld] = useState(isHandheld);

  // o som só é liberado no primeiro clique ou toque do visitante
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // no celular a qualidade automática fica no baixo, mesmo que outra visita
  // (ou a tela girada) tenha salvo um nível mais alto
  useEffect(() => {
    const state = useScene.getState();
    if (handheld && state.autoQuality && state.quality !== 'low') state.setQuality('low');
  }, [handheld]);

  useEffect(() => {
    let alive = true;
    void buildLibrary((p) => useScene.getState().setLoadProgress(p * LOAD.library)).then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const state = useScene.getState();
    if (!state.autoQuality) return;
    if (handheld && direction > 0) return;
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
      onCreated={(state) => {
        if (import.meta.env.DEV) window.__three = state;
      }}
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
