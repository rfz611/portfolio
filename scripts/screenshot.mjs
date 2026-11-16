/**
 * Tira prints do site em desktop e celular para conferir cada fase.
 * Uso: node scripts/screenshot.mjs <pasta-de-saida> [plano ...]
 *   ex.: node scripts/screenshot.mjs docs/prints/fase-1 home discos
 * Precisa do servidor de desenvolvimento rodando (npm run dev).
 * Variáveis: SHOT_URL (padrão http://localhost:5173), SHOT_ONLY=desktop|mobile,
 *            SHOT_QUALITY=high|medium|low, SHOT_WAIT (ms depois da transição).
 */
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import puppeteer from 'puppeteer-core';

const BROWSERS = [
  process.env.SHOT_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);

const HASH = {
  home: '',
  janela: '#inicio',
  tv: '#projetos',
  pc: '#sobre',
  motor: '#skills',
  mesa: '#certificados',
  discos: '#discos',
  interior: '#contato',
  carro: '#garagem',
  texto: '',
};

const [outDir = 'docs/prints/tmp', ...views] = process.argv.slice(2);
const url = process.env.SHOT_URL ?? 'http://localhost:5173';
const quality = process.env.SHOT_QUALITY;
const wait = Number(process.env.SHOT_WAIT ?? 2600);
const devices = [
  { name: 'desktop', width: 1440, height: 810, deviceScaleFactor: 1, isMobile: false },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
].filter((d) => !process.env.SHOT_ONLY || d.name === process.env.SHOT_ONLY);

const executablePath = BROWSERS.find((p) => existsSync(p));
if (!executablePath) throw new Error('Chrome ou Edge não encontrado. Defina SHOT_BROWSER.');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars'],
});

for (const device of devices) {
  const page = await browser.newPage();
  await page.setViewport(device);
  page.on('pageerror', (error) => console.log(`[erro ${device.name}]`, error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') console.log(`[console ${device.name}]`, message.text());
  });
  for (const view of views.length ? views : ['home']) {
    const prefs = { lang: 'pt', mode: view === 'texto' ? 'text' : '3d', autoQuality: !quality };
    if (quality) prefs.quality = quality;
    await page.evaluateOnNewDocument((state) => {
      localStorage.setItem('rfz-portfolio', JSON.stringify({ state, version: 1 }));
    }, prefs);
    await page.goto(`${url}/${HASH[view] ?? ''}`, { waitUntil: 'load' });
    if (view !== 'texto') {
      await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });
    }
    await new Promise((resolve) => setTimeout(resolve, wait));
    const file = join(outDir, `${view}-${device.name}.png`);
    await page.screenshot({ path: file });
    const info = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const gl = canvas?.getContext('webgl2');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return {
        fps: window.__fps,
        gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'desconhecida',
      };
    });
    console.log(`${file}  fps=${info.fps ?? '-'}  ${String(info.gpu).slice(0, 60)}`);
  }
  await page.close();
}
await browser.close();
