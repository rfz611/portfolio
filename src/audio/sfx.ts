import { mulberry32 } from '../textures/random';

/**
 * Sons de ambiente feitos no código (nada é baixado): chuva em loop,
 * chiado de vinil e um clique. Cada um vira um pequeno arquivo WAV em
 * memória, que o Howler toca como qualquer outro áudio.
 */
const RATE = 22050;

function toWavUrl(samples: Float32Array): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  text(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, RATE, true);
  view.setUint32(28, RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  text(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s * 32767, true);
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}

/** Emenda o fim no começo para o loop não dar estalo. */
function seamless(raw: Float32Array, length: number): Float32Array {
  const overlap = raw.length - length;
  const out = raw.slice(0, length);
  for (let i = 0; i < overlap; i++) {
    const t = i / overlap;
    out[i] = raw[i] * t + raw[length + i] * (1 - t);
  }
  return out;
}

function rain(): Float32Array {
  const r = mulberry32(7);
  const length = RATE * 6;
  const raw = new Float32Array(length + RATE);
  let low = 0;
  let high = 0;
  let previous = 0;
  for (let i = 0; i < raw.length; i++) {
    const white = r() * 2 - 1;
    low += (white - low) * 0.22; // tira o agudo áspero
    high = 0.985 * (high + low - previous); // tira o grave
    previous = low;
    const swell = 0.8 + 0.2 * Math.sin((i / RATE) * 0.9) * Math.sin((i / RATE) * 0.37 + 1);
    raw[i] = high * 1.6 * swell;
  }
  // pingos soltos
  for (let n = 0; n < 260; n++) {
    const at = Math.floor(r() * (raw.length - 400));
    const gain = 0.15 + r() * 0.3;
    const freq = 900 + r() * 2600;
    for (let i = 0; i < 300; i++) {
      raw[at + i] += Math.sin((i / RATE) * 6.283 * freq) * Math.exp(-i / 40) * gain;
    }
  }
  return seamless(raw, length);
}

function crackle(): Float32Array {
  const r = mulberry32(19);
  const length = RATE * 4;
  const raw = new Float32Array(length + RATE / 2);
  let low = 0;
  for (let i = 0; i < raw.length; i++) {
    low += (r() * 2 - 1 - low) * 0.5;
    raw[i] = low * 0.12; // chiado de fundo
  }
  for (let n = 0; n < 70; n++) {
    const at = Math.floor(r() * (raw.length - 200));
    const gain = (0.25 + r() * 0.75) * (r() > 0.85 ? 1 : 0.45);
    const decay = 6 + r() * 26;
    const sign = r() > 0.5 ? 1 : -1;
    for (let i = 0; i < 160; i++) raw[at + i] += sign * Math.exp(-i / decay) * gain;
  }
  return seamless(raw, length);
}

function click(): Float32Array {
  const out = new Float32Array(Math.floor(RATE * 0.06));
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.sin((i / RATE) * 6.283 * 1800) * Math.exp(-i / 60) * 0.8;
  }
  return out;
}

/** Chiado de TV fora do ar: ruído branco que some rápido. */
function tvStatic(): Float32Array {
  const r = mulberry32(31);
  const out = new Float32Array(Math.floor(RATE * 0.45));
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    out[i] = (r() * 2 - 1) * 0.5 * Math.min(1, (1 - t) * 3);
  }
  return out;
}

/** Som de ligar o computador: quatro notas suaves subindo, com um eco curto. */
function boot(): Float32Array {
  const out = new Float32Array(Math.floor(RATE * 2));
  const notes: [number, number][] = [
    [0, 523.25],
    [0.13, 659.25],
    [0.26, 783.99],
    [0.39, 1046.5],
  ];
  for (const [at, freq] of notes) {
    const start = Math.floor(at * RATE);
    for (let i = 0; start + i < out.length; i++) {
      const t = i / RATE;
      const env = Math.min(1, t * 60) * Math.exp(-t * 2.4);
      const tone = Math.sin(t * 6.283 * freq) + 0.3 * Math.sin(t * 6.283 * freq * 2);
      out[start + i] += tone * env * 0.18;
    }
  }
  // eco
  const delay = Math.floor(RATE * 0.18);
  for (let i = out.length - 1; i >= delay; i--) out[i] += out[i - delay] * 0.3;
  return out;
}

/** Líquido caindo no copo: chiado filtrado que vai ficando mais grave. */
function pour(): Float32Array {
  const r = mulberry32(23);
  const out = new Float32Array(Math.floor(RATE * 1.5));
  let low = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / out.length;
    const cut = 0.35 - t * 0.25;
    low += (r() * 2 - 1 - low) * cut;
    const env = Math.min(1, t * 12) * Math.min(1, (1 - t) * 6);
    out[i] = low * 0.5 * env * (0.8 + 0.2 * Math.sin(i * 0.05));
  }
  return out;
}

/** Gelo tilintando no copo: três batidinhas agudas. */
function ice(): Float32Array {
  const out = new Float32Array(Math.floor(RATE * 0.5));
  const hits: [number, number, number][] = [
    [0, 2900, 0.5],
    [0.09, 3700, 0.35],
    [0.21, 3200, 0.28],
  ];
  for (const [at, freq, gain] of hits) {
    const start = Math.floor(at * RATE);
    for (let i = 0; start + i < out.length; i++) {
      out[start + i] += Math.sin((i / RATE) * 6.283 * freq) * Math.exp(-i / 700) * gain;
    }
  }
  return out;
}

export interface Sfx {
  rain: string;
  crackle: string;
  click: string;
  ice: string;
  pour: string;
  tvStatic: string;
  boot: string;
}

let cache: Sfx | null = null;

export function makeSfx(): Sfx | null {
  if (cache) return cache;
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return null;
  cache = {
    rain: toWavUrl(rain()),
    crackle: toWavUrl(crackle()),
    click: toWavUrl(click()),
    ice: toWavUrl(ice()),
    pour: toWavUrl(pour()),
    tvStatic: toWavUrl(tvStatic()),
    boot: toWavUrl(boot()),
  };
  return cache;
}
