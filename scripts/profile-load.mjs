/**
 * Mede a abertura do site num celular simulado (CPU 4x mais lenta, como o
 * PageSpeed): tempo até a cena ficar pronta, tarefas longas e, com
 * PROFILE=1, as funções que mais gastam a thread principal.
 * Uso: node scripts/profile-load.mjs [url]   (padrão http://localhost:5173)
 */
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const url = process.argv[2] ?? 'http://localhost:5173';
const throttle = Number(process.env.CPU ?? 4);
const executablePath = [
  process.env.SHOT_BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
]
  .filter(Boolean)
  .find((p) => existsSync(p));

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: process.env.SWIFTSHADER
    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
await page.emulate({
  viewport: { width: 412, height: 823, deviceScaleFactor: 1.75, isMobile: true, hasTouch: true },
  userAgent:
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
});
const cdp = await page.createCDPSession();
await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle });
await page.evaluateOnNewDocument(() => {
  window.__long = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries())
      window.__long.push([Math.round(e.startTime), Math.round(e.duration)]);
  }).observe({ type: 'longtask', buffered: true });
  localStorage.clear();
});
if (process.env.PROFILE) {
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await cdp.send('Profiler.start');
}
const t0 = Date.now();
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__ready === true, { timeout: 300000, polling: 200 });
const readyAt = Date.now() - t0;
// a cena continua montando depois de pronta (etapas adiadas): mede mais 8 s
await new Promise((r) => setTimeout(r, Number(process.env.AFTER ?? 8000)));
const long = await page.evaluate(() => window.__long);
const quality = await page.evaluate(() => window.__scene?.getState().quality);
const tbt = long.reduce((s, [, d]) => s + Math.max(0, d - 50), 0);
const busy = long.reduce((s, [, d]) => s + d, 0);
console.log(
  `qualidade ${quality} · pronto em ${readyAt} ms · ${long.length} tarefas longas · soma ${busy} ms · TBT ${tbt} ms`,
);
console.log(
  'maiores:',
  [...long]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([s, d]) => `${d}@${s}`)
    .join(' '),
);

if (process.env.PROFILE) {
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map();
  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const dt = profile.timeDeltas;
  profile.samples.forEach((id, i) => {
    const n = byId.get(id);
    const f = n.callFrame;
    const key = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/')}:${f.lineNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0) / 1000);
  });
  // tarefas: trechos contínuos sem "(idle)", com as funções que mais pesam em cada um
  const runs = [];
  let run = null;
  let clock = 0;
  profile.samples.forEach((id, i) => {
    const ms = (dt[i] ?? 0) / 1000;
    clock += ms;
    const f = byId.get(id).callFrame;
    if (f.functionName === '(idle)') {
      if (run) runs.push(run);
      run = null;
      return;
    }
    run ??= { at: clock, ms: 0, fns: new Map() };
    run.ms += ms;
    const key = `${f.functionName || '(anon)'}:${f.lineNumber + 1}`;
    run.fns.set(key, (run.fns.get(key) ?? 0) + ms);
  });
  if (run) runs.push(run);
  for (const r of runs.filter((r) => r.ms > Number(process.env.RUN_MIN ?? 700))) {
    const fns = [...r.fns].sort((a, b) => b[1] - a[1]).slice(0, 7);
    console.log(
      `tarefa ${r.ms.toFixed(0)} ms @${r.at.toFixed(0)}: ${fns.map(([k, v]) => `${k} ${v.toFixed(0)}`).join(' | ')}`,
    );
  }
  const top = [...self.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, Number(process.env.TOP ?? 40));
  for (const [k, ms] of top) console.log(`${ms.toFixed(0).padStart(7)} ms  ${k}`);
}
await browser.close();
