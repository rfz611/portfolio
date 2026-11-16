/**
 * Comprime modelos .glb antes de entrarem no projeto (opcional: o site já
 * funciona só com os modelos feitos no código).
 *
 * Uso: node scripts/compress-models.mjs <pasta-com-glb-originais>
 * Saída: public/models/<mesmo-nome>.glb, com malha Meshopt e texturas de
 * até 1024 px (KTX2 se o programa "ktx" estiver instalado; senão WebP).
 * Cada arquivo precisa ficar com até 3 MB.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 3 * 1024 * 1024;
const source = process.argv[2];
if (!source || !existsSync(source)) {
  console.error(
    'Informe a pasta com os .glb originais. Ex.: node scripts/compress-models.mjs modelos-brutos',
  );
  process.exit(1);
}

const outDir = 'public/models';
mkdirSync(outDir, { recursive: true });
const hasKtx = spawnSync('ktx', ['--version'], { shell: true }).status === 0;
if (!hasKtx)
  console.warn('Aviso: KTX-Software não encontrado; usando texturas WebP no lugar de KTX2.');

let failed = false;
for (const file of readdirSync(source).filter((f) => f.endsWith('.glb'))) {
  const input = join(source, file);
  const output = join(outDir, file);
  const args = [
    '--yes',
    '@gltf-transform/cli',
    'optimize',
    input,
    output,
    '--compress',
    'meshopt',
    '--texture-compress',
    hasKtx ? 'ktx2' : 'webp',
    '--texture-size',
    '1024',
  ];
  const result = spawnSync('npx', args, { stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    failed = true;
    continue;
  }
  const size = statSync(output).size;
  const mb = (size / 1024 / 1024).toFixed(2);
  if (size > MAX_BYTES) {
    failed = true;
    console.error(`✗ ${file}: ${mb} MB (acima do limite de 3 MB)`);
  } else {
    console.log(`✓ ${file}: ${mb} MB`);
  }
}
process.exit(failed ? 1 : 0);
