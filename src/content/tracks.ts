/** Discos da estante (tabela "Música" da especificação). */
export type ShelfSide = 'platter' | 'classics' | 'rap';

export interface Track {
  id: string;
  artist: string;
  title: string;
  side: ShelfSide;
  /** Faixas que saem do rádio do carro. */
  garage?: boolean;
  /** Cor do rótulo do disco (e do vinil, quando colorido). */
  label: string;
  vinyl?: string;
}

export const tracks: Track[] = [
  {
    id: 'raining',
    artist: 'dublon, Tour-Maubourg, manon',
    title: "Raining but It's Ok",
    side: 'platter',
    label: '#EFE6DA',
    vinyl: '#B0101F',
  },
  { id: 'pearls', artist: 'Sade', title: 'Pearls', side: 'classics', label: '#B8893A' },
  { id: 'crime', artist: 'Sade', title: 'Is It a Crime', side: 'classics', label: '#5C0F16' },
  {
    id: 'eyes',
    artist: 'Billy Idol',
    title: 'Eyes Without A Face',
    side: 'classics',
    label: '#2D4BFF',
  },
  {
    id: 'oldhouse',
    artist: 'The Smiths',
    title: 'Back to the Old House',
    side: 'classics',
    label: '#6f7f5a',
  },
  {
    id: 'exitmusic',
    artist: 'Radiohead',
    title: 'Exit Music (For A Film)',
    side: 'classics',
    label: '#8a8f99',
  },
  { id: 'roads', artist: 'Portishead', title: 'Roads', side: 'classics', label: '#3A1450' },
  { id: 'flights', artist: 'Drake', title: "Flight's Booked", side: 'rap', label: '#c9a26a' },
  { id: 'atm', artist: 'Don Toliver', title: 'ATM', side: 'rap', label: '#D0142C' },
  {
    id: 'jukebox',
    artist: 'A$AP Rocky, Joe Fox, Kanye West',
    title: 'Jukebox Joints',
    side: 'rap',
    garage: true,
    label: '#e0d8c8',
  },
  {
    id: 'ecoli',
    artist: 'The Alchemist, Earl Sweatshirt',
    title: 'E. Coli',
    side: 'rap',
    garage: true,
    label: '#7a5a2a',
  },
];

export const DEFAULT_TRACK = 'raining';

export const trackById = (id: string): Track | undefined => tracks.find((t) => t.id === id);

/** De onde vêm os arquivos: /audio no desenvolvimento, bucket R2 em produção. */
export const AUDIO_BASE = (import.meta.env?.VITE_AUDIO_BASE_URL ?? '/audio').replace(/\/$/, '');

export const trackSources = (id: string): string[] => [
  `${AUDIO_BASE}/${id}.ogg`,
  `${AUDIO_BASE}/${id}.mp3`,
];

export const coverUrl = (id: string): string => `/textures/covers/${id}.webp`;
