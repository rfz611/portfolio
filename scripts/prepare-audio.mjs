/**
 * Organiza as músicas e capas que o Raphael colocou em public/audio.
 *
 * Para cada faixa da tabela de música:
 *   - acha o arquivo pelo nome (venha com o nome que vier);
 *   - gera public/audio/<id>.ogg (Opus 96 kbps) e public/audio/<id>.mp3 (128 kbps);
 *   - gera a capa public/textures/covers/<id>.webp (512 × 512);
 *   - guarda os originais em public/audio/originais (nada é apagado).
 *
 * Nada aqui é baixado: o script só converte arquivos que já estão na pasta.
 * Uso: npm run audio
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, renameSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import ffmpeg from 'ffmpeg-static';

const AUDIO_DIR = 'public/audio';
const COVER_IN = join(AUDIO_DIR, 'capas');
const COVER_OUT = 'public/textures/covers';
const KEEP = join(AUDIO_DIR, 'originais');
const KEEP_COVERS = join(KEEP, 'capas');

/** Como reconhecer cada faixa pelo nome do arquivo. */
const MATCH = {
  raining: /raining but/i,
  pearls: /pearls/i,
  crime: /is it a crime/i,
  eyes: /eyes without/i,
  oldhouse: /back to the old house/i,
  exitmusic: /exit music/i,
  roads: /\broads\b/i,
  flights: /flight.?s booked/i,
  atm: /\bATM\b/,
  jukebox: /jukebox joints/i,
  ecoli: /e\.? ?coli/i,
};

const AUDIO_EXT = new Set(['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.opus']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ids = Object.keys(MATCH);
const isOutput = (file) => ids.some((id) => file === `${id}.ogg` || file === `${id}.mp3`);

function run(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  });
  return result.status === 0;
}

function list(dir, extensions) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(
    (f) => extensions.has(extname(f).toLowerCase()) && statSync(join(dir, f)).isFile(),
  );
}

if (!ffmpeg || !existsSync(ffmpeg)) {
  console.error('ffmpeg não encontrado. Rode: node node_modules/ffmpeg-static/install.js');
  process.exit(1);
}
for (const dir of [COVER_OUT, KEEP, KEEP_COVERS]) mkdirSync(dir, { recursive: true });

const songs = list(AUDIO_DIR, AUDIO_EXT).filter((f) => !isOutput(f));
const covers = list(COVER_IN, IMAGE_EXT);
const report = [];

for (const id of ids) {
  const line = { id, audio: 'faltando', capa: 'faltando' };
  const ogg = join(AUDIO_DIR, `${id}.ogg`);
  const mp3 = join(AUDIO_DIR, `${id}.mp3`);
  const webp = join(COVER_OUT, `${id}.webp`);

  const song = songs.find((f) => MATCH[id].test(f));
  if (song) {
    const input = join(AUDIO_DIR, song);
    const ok =
      run(['-i', input, '-vn', '-map_metadata', '-1', '-c:a', 'libopus', '-b:a', '96k', ogg]) &&
      run(['-i', input, '-vn', '-map_metadata', '-1', '-c:a', 'libmp3lame', '-b:a', '128k', mp3]);
    if (ok) {
      renameSync(input, join(KEEP, song));
      line.audio = 'convertido';
    } else {
      line.audio = 'ERRO na conversão';
    }
  } else if (existsSync(ogg) && existsSync(mp3)) {
    line.audio = 'ok';
  }

  const cover = covers.find((f) => MATCH[id].test(f));
  if (cover) {
    const input = join(COVER_IN, cover);
    const filter = 'scale=512:512:force_original_aspect_ratio=increase,crop=512:512';
    if (run(['-i', input, '-vf', filter, '-c:v', 'libwebp', '-quality', '82', webp])) {
      renameSync(input, join(KEEP_COVERS, cover));
      line.capa = 'convertida';
    } else {
      line.capa = 'ERRO na conversão';
    }
  } else if (existsSync(webp)) {
    line.capa = 'ok';
  }
  report.push(line);
}

console.table(report);
const missing = report.filter((r) => r.audio === 'faltando' || r.capa === 'faltando');
if (missing.length) {
  console.log('Faixas sem arquivo aparecem no site com o selo "em breve".');
}
