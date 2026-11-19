/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUDIO_BASE_URL?: string;
  /** Endereço do modelo do carro no site publicado (o arquivo fica fora do Git). */
  readonly VITE_CAR_MODEL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'virtual:models-manifest' {
  const files: string[];
  export default files;
}

interface Window {
  /** Marcadores usados pelo script de prints (scripts/screenshot.mjs). */
  __ready?: boolean;
  __fps?: number;
  __scene?: typeof import('./store/useScene').useScene;
  /** Estado do R3F (câmera, cena), só em desenvolvimento. */
  __three?: import('@react-three/fiber').RootState;
  /** Câmera livre para inspeção (só em desenvolvimento). */
  __cam?: { position: [number, number, number]; target: [number, number, number]; fov?: number };
}
