/**
 * Monta o build já pronto para a Vercel (.vercel/output), com as músicas e
 * os vídeos de public/ junto. A Vercel não constrói o site a partir do
 * GitHub (vercel.json desliga isso), porque o Git não tem esses arquivos.
 *
 * Uso: npm run deploy  (build + esta montagem + vercel deploy --prebuilt --prod)
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';

const out = '.vercel/output';
if (!existsSync('dist/index.html')) {
  console.error('Rode o build antes (npm run build).');
  process.exit(1);
}
for (const dir of ['audio', 'videos']) {
  if (!existsSync(`dist/${dir}`))
    console.warn(`Aviso: dist/${dir} não existe; o site vai sem ${dir}.`);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('dist', `${out}/static`, { recursive: true });
writeFileSync(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        // os arquivos de assets/ têm o hash no nome: podem ficar em cache para sempre
        {
          src: '/assets/(.*)',
          headers: { 'cache-control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        { handle: 'filesystem' },
      ],
    },
    null,
    2,
  ),
);
console.log(`Pronto: ${out} montado a partir de dist/.`);
