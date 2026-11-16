/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUDIO_BASE_URL?: string;
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
}
