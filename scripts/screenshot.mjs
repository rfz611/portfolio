/**
 * Tira prints do site em desktop e celular para conferir cada fase.
 * Uso: node scripts/screenshot.mjs <pasta-de-saida> [plano ...]
 *   ex.: node scripts/screenshot.mjs docs/prints/fase-1 home discos
 * Precisa do servidor de desenvolvimento rodando (npm run dev).
 * Variáveis: SHOT_URL (padrão http://localhost:5173), SHOT_ONLY=desktop|mobile,
 *            SHOT_QUALITY=high|medium|low, SHOT_WAIT (ms depois da transição),
 *            SHOT_CLICK="x,y;x,y" (cliques antes do print), SHOT_AFTER (ms depois
 *            dos cliques), SHOT_CLIP="x,y,l,a" (recorte), SHOT_SUFFIX (nome),
 *            SHOT_EVAL (expressão JS para imprimir), SHOT_HOVER="x,y".
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
  bar: '#bar',
  texto: '',
};

const [outDir = 'docs/prints/tmp', ...views] = process.argv.slice(2);
const url = process.env.SHOT_URL ?? 'http://localhost:5173';
const quality = process.env.SHOT_QUALITY;
const wait = Number(process.env.SHOT_WAIT ?? 2600);
const devices = [
  {
    name: 'desktop',
    width: 1440,
    height: 810,
    deviceScaleFactor: Number(process.env.SHOT_DPR ?? 1),
    isMobile: false,
  },
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
    await page.goto(`${url}/${process.env.SHOT_QUERY ?? ''}${HASH[view] ?? ''}`, {
      waitUntil: 'load',
    });
    if (view !== 'texto') {
      await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });
    }
    // SHOT_PRE: código rodado na página antes de esperar (ex.: trocar de ponto de vista)
    if (process.env.SHOT_PRE) await page.evaluate(process.env.SHOT_PRE);
    await new Promise((resolve) => setTimeout(resolve, wait));
    for (const point of (process.env.SHOT_CLICK ?? '').split(';').filter(Boolean)) {
      const [x, y] = point.split(',').map(Number);
      await page.mouse.move(x, y);
      await new Promise((resolve) => setTimeout(resolve, 250));
      await page.mouse.click(x, y);
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    if (process.env.SHOT_HOVER) {
      const [x, y] = process.env.SHOT_HOVER.split(',').map(Number);
      await page.mouse.move(x - 4, y - 4);
      await page.mouse.move(x, y, { steps: 4 });
    }
    if (process.env.SHOT_CLICK || process.env.SHOT_HOVER) {
      await new Promise((resolve) => setTimeout(resolve, Number(process.env.SHOT_AFTER ?? 3500)));
    }
    const suffix = process.env.SHOT_SUFFIX ? `-${process.env.SHOT_SUFFIX}` : '';
    const file = join(outDir, `${view}-${device.name}${suffix}.png`);
    const clip = process.env.SHOT_CLIP?.split(',').map(Number);
    await page.screenshot({
      path: file,
      ...(clip ? { clip: { x: clip[0], y: clip[1], width: clip[2], height: clip[3] } } : {}),
    });
    if (process.env.SHOT_EVAL) {
      console.log('eval:', await page.evaluate(process.env.SHOT_EVAL));
    }
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
