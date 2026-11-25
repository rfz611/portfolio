import { Howl, Howler } from 'howler';
import { trackById, tracks, trackSources } from '../content/tracks';
import { MAX_VOLUME, useScene, type Availability } from '../store/useScene';
import { makeSfx } from './sfx';

/**
 * Player de música (Howler.js).
 *
 * Regras da especificação:
 * - nada toca sozinho: o som só começa depois de um clique do visitante;
 * - a faixa entra com fade de 0 até o volume em 2 s;
 * - o volume nunca passa de 60%;
 * - chuva em loop a 2% (o Raphael pediu mais baixo que os 4% da especificação) e chiado de vinil a 5% enquanto um disco toca.
 *
 * A cena 3D cuida da coreografia (disco voando, agulha descendo) e avisa
 * aqui quando a agulha encosta no disco (needleDown).
 */
export const FADE_IN_MS = 2000;
export const FADE_OUT_MS = 700;
export const RAIN_VOLUME = 0.02;
export const CRACKLE_VOLUME = 0.05;

interface Deck {
  id: string;
  howl: Howl;
}

let deck: Deck | null = null;
let ambience: {
  rain: Howl;
  crackle: Howl;
  click: Howl;
  ice: Howl;
  pour: Howl;
  tvStatic: Howl;
  boot: Howl;
} | null = null;
let subscribed = false;

const store = () => useScene.getState();

/** Próximo disco disponível depois de `fromId`, pulando os "em breve". */
export function nextTrackId(
  fromId: string,
  availability: Record<string, Availability>,
  ids: string[] = tracks.map((t) => t.id),
): string | null {
  const start = Math.max(0, ids.indexOf(fromId));
  for (let step = 1; step < ids.length; step++) {
    const id = ids[(start + step) % ids.length];
    if (availability[id] !== 'missing') return id;
  }
  return null;
}

function subscribe() {
  if (subscribed) return;
  subscribed = true;
  Howler.mute(store().muted);
  useScene.subscribe((state, prev) => {
    if (state.volume !== prev.volume && deck && state.deck === 'playing') {
      deck.howl.volume(Math.min(state.volume, MAX_VOLUME));
    }
    if (state.muted !== prev.muted) Howler.mute(state.muted);
  });
}

/** Primeiro clique do visitante: libera o áudio e liga a chuva bem baixinha. */
export function unlockAudio() {
  subscribe();
  if (ambience) return;
  const sfx = makeSfx();
  if (!sfx) return;
  ambience = {
    rain: new Howl({ src: [sfx.rain], format: ['wav'], loop: true, volume: 0 }),
    crackle: new Howl({ src: [sfx.crackle], format: ['wav'], loop: true, volume: 0 }),
    click: new Howl({ src: [sfx.click], format: ['wav'], volume: 0.12 }),
    ice: new Howl({ src: [sfx.ice], format: ['wav'], volume: 0.1 }),
    pour: new Howl({ src: [sfx.pour], format: ['wav'], volume: 0.08 }),
    tvStatic: new Howl({ src: [sfx.tvStatic], format: ['wav'], volume: 0.05 }),
    boot: new Howl({ src: [sfx.boot], format: ['wav'], volume: 0.09 }),
  };
  ambience.rain.play();
  ambience.rain.fade(0, RAIN_VOLUME, 3000);
}

function setCrackle(on: boolean) {
  if (!ambience) return;
  const { crackle } = ambience;
  if (on) {
    if (!crackle.playing()) crackle.play();
    crackle.fade(crackle.volume(), CRACKLE_VOLUME, 600);
  } else {
    crackle.fade(crackle.volume(), 0, 400);
  }
}

export function playClick() {
  ambience?.click.play();
}

/** Gelo do copo: desligado a pedido (o tilintar incomodava). */
export function playIce() {}

/** Chiado curto da TV (ao ligar e ao trocar de canal). */
export function playStatic() {
  ambience?.tvStatic.play();
}

/** Som de inicialização do notebook. */
export function playBoot() {
  ambience?.boot.play();
}

/** Som do drink sendo servido. */
export function playPour() {
  unlockAudio();
}

function release(target: Deck, fadeMs: number) {
  const { howl } = target;
  howl.off('end');
  howl.fade(howl.volume(), 0, fadeMs);
  window.setTimeout(() => {
    howl.stop();
    howl.unload();
  }, fadeMs + 60);
}

/**
 * O visitante escolheu um disco. A música atual some em fade e a cena
 * começa a troca; o áudio novo só entra em needleDown.
 */
export function chooseTrack(id: string) {
  const s = store();
  if (!trackById(id) || s.availability[id] === 'missing') return;
  unlockAudio();
  if (id === s.trackId && s.deck === 'playing') return;
  if (id === s.trackId && s.deck === 'paused') {
    resume();
    return;
  }
  if (deck) {
    release(deck, FADE_OUT_MS);
    deck = null;
  }
  setCrackle(false);
  playClick();
  s.requestTrack(id);
}

function fail(id: string, howl: Howl) {
  if (deck?.howl !== howl) return;
  howl.unload();
  deck = null;
  setCrackle(false);
  store().setAvailability(id, 'missing');
  store().setDeck('idle');
}

/** A agulha encostou no disco: a faixa entra com fade de 2 s. */
export function needleDown(id: string) {
  const s = store();
  if (s.requestedTrackId !== id) return;
  subscribe();
  const howl = new Howl({
    src: trackSources(id),
    format: ['opus', 'mp3'],
    html5: true,
    volume: 0,
    onend: () => {
      if (deck?.howl === howl) next();
    },
    onloaderror: () => fail(id, howl),
    onplayerror: () => fail(id, howl),
  });
  deck = { id, howl };
  howl.play();
  howl.fade(0, Math.min(s.volume, MAX_VOLUME), FADE_IN_MS);
  setCrackle(true);
  s.setDeck('playing', id);
}

export function pause() {
  if (!deck || store().deck !== 'playing') return;
  deck.howl.pause();
  setCrackle(false);
  store().setDeck('paused');
}

export function resume() {
  if (!deck || store().deck !== 'paused') return;
  deck.howl.volume(Math.min(store().volume, MAX_VOLUME));
  deck.howl.play();
  setCrackle(true);
  store().setDeck('playing');
}

export function togglePlay() {
  const s = store();
  if (s.deck === 'playing') pause();
  else if (s.deck === 'paused') resume();
  else if (s.deck === 'idle') chooseTrack(s.trackId);
}

export function next() {
  const s = store();
  const id = nextTrackId(s.requestedTrackId ?? s.trackId, s.availability);
  if (id) chooseTrack(id);
}

/** Quanto da faixa já tocou (0 a 1): a agulha anda com isso. */
export function progress(): number {
  if (!deck) return 0;
  const duration = deck.howl.duration();
  const position = deck.howl.seek();
  return duration > 0 && typeof position === 'number' ? position / duration : 0;
}

/**
 * Confere quais faixas existem na origem (pasta /audio ou bucket R2).
 * As que não existirem ganham o selo "em breve".
 */
export async function probeAvailability(ids: string[] = tracks.map((t) => t.id)) {
  for (const id of ids) {
    if (store().availability[id] && store().availability[id] !== 'unknown') continue;
    const result = await new Promise<Availability>((resolve) => {
      const audio = new Audio();
      const timer = window.setTimeout(() => resolve('unknown'), 8000);
      const finish = (value: Availability) => {
        window.clearTimeout(timer);
        audio.removeAttribute('src');
        audio.load();
        resolve(value);
      };
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => finish('ok');
      audio.onerror = () => finish('missing');
      audio.src = trackSources(id)[1];
    });
    store().setAvailability(id, result);
  }
}

/** Só para os testes: volta o módulo ao estado inicial. */
export function resetPlayerForTests() {
  deck = null;
  ambience = null;
}

/* ---------- rádio do carro ---------- */

let radio: Howl | null = null;
let radioPausedDeck = false;

/**
 * Entrou no carro: o toca-discos baixa em fade e o rádio toca uma faixa de
 * garagem (Jukebox Joints ou E. Coli). Sem clique do visitante, não toca.
 */
export function startCarRadio() {
  const s = store();
  const garage = tracks.filter((t) => t.garage && s.availability[t.id] !== 'missing');
  if (!garage.length || radio || !ambience) return;
  const pick = garage[Math.floor(Math.random() * garage.length)];
  radioPausedDeck = false;
  if (deck && s.deck === 'playing') {
    const howl = deck.howl;
    howl.fade(howl.volume(), 0, FADE_OUT_MS);
    window.setTimeout(() => {
      if (store().deck === 'playing' && deck?.howl === howl) pause();
    }, FADE_OUT_MS + 40);
    radioPausedDeck = true;
  }
  const howl = new Howl({
    src: trackSources(pick.id),
    format: ['opus', 'mp3'],
    html5: true,
    loop: true,
    volume: 0,
    onloaderror: () => {
      if (radio === howl) radio = null;
    },
  });
  radio = howl;
  howl.play();
  howl.fade(0, Math.min(s.volume, MAX_VOLUME) * 0.85, FADE_IN_MS);
}

/** Saiu do carro: o rádio some em fade e o disco volta de onde parou. */
export function stopCarRadio() {
  if (radio) {
    const howl = radio;
    radio = null;
    howl.fade(howl.volume(), 0, FADE_OUT_MS);
    window.setTimeout(() => {
      howl.stop();
      howl.unload();
    }, FADE_OUT_MS + 60);
  }
  if (radioPausedDeck) {
    radioPausedDeck = false;
    resume();
  }
}
