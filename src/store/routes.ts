import type { ViewId } from './useScene';

/** Cada seção tem endereço próprio (#projetos, #sobre...) que abre direto nela. */
export const HASH_TO_VIEW: Record<string, ViewId> = {
  inicio: 'janela',
  projetos: 'tv',
  sobre: 'pc',
  skills: 'motor',
  certificados: 'mesa',
  discos: 'discos',
  contato: 'interior',
  garagem: 'carro',
};

const VIEW_TO_HASH = Object.fromEntries(
  Object.entries(HASH_TO_VIEW).map(([hash, view]) => [view, hash]),
) as Partial<Record<ViewId, string>>;

export function viewFromHash(hash: string): ViewId {
  const key = hash.replace(/^#/, '').toLowerCase();
  return HASH_TO_VIEW[key] ?? 'home';
}

export function hashFromView(view: ViewId): string {
  const hash = VIEW_TO_HASH[view];
  return hash ? `#${hash}` : '';
}

/** Ordem do menu de texto. */
export const NAV_ITEMS: { hash: string; labelKey: string }[] = [
  { hash: 'inicio', labelKey: 'nav.home' },
  { hash: 'projetos', labelKey: 'nav.projects' },
  { hash: 'sobre', labelKey: 'nav.about' },
  { hash: 'skills', labelKey: 'nav.skills' },
  { hash: 'certificados', labelKey: 'nav.certificates' },
  { hash: 'discos', labelKey: 'nav.records' },
  { hash: 'contato', labelKey: 'nav.contact' },
  { hash: 'garagem', labelKey: 'nav.garage' },
];
