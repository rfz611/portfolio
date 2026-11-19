/// <reference types="vitest/config" />
import { existsSync, readdirSync, rmSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Lista os .glb que existem em public/models.
 * O site usa o modelo do código por padrão; se um arquivo com o nome da
 * tabela de modelos aparecer nessa pasta, ele entra no lugar.
 */
function modelsManifest(): Plugin {
  const id = 'virtual:models-manifest';
  return {
    name: 'models-manifest',
    resolveId: (source) => (source === id ? `\0${id}` : null),
    load(source) {
      if (source !== `\0${id}`) return null;
      const dir = 'public/models';
      const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.glb')) : [];
      return `export default ${JSON.stringify(files)};`;
    },
  };
}

/**
 * Depois do build, tira de dist/ o que é só de trabalho na pasta de músicas
 * (os arquivos originais, as capas brutas e o recado): o site usa só os
 * .ogg e .mp3 já convertidos.
 */
function trimAudio(): Plugin {
  return {
    name: 'trim-audio',
    apply: 'build',
    closeBundle() {
      for (const path of ['dist/audio/originais', 'dist/audio/capas', 'dist/audio/LEIA-ME.txt']) {
        rmSync(path, { recursive: true, force: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), modelsManifest(), trimAudio()],
  build: { chunkSizeWarningLimit: 1600 },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
  },
});
