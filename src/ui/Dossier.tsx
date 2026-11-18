import { useTranslation } from 'react-i18next';
import { films } from '../content/films';
import { useScene } from '../store/useScene';

/**
 * Ficha que abre ao clicar num livro (filme favorito) ou no kimono, no
 * canto da poltrona. Mostra só fatos do filme e as notas do Raphael
 * (em breve, até ele escrever). Esc ou Fechar fecham.
 */
export function Dossier() {
  const { t } = useTranslation();
  const id = useScene((s) => s.dossier);
  const setDossier = useScene((s) => s.setDossier);
  if (!id) return null;
  const film = films.find((f) => f.id === id);
  return (
    <div className="cv-sheet" role="dialog" aria-modal="false" aria-labelledby="dossier-title">
      <article className="cv-sheet__paper dossier">
        <p className="cv-sheet__place">{film ? t('dossier.film') : t('dossier.interest')}</p>
        <h2 id="dossier-title">{film ? film.title : t('dossier.giTitle')}</h2>
        <p className="cv-sheet__role">
          {film ? `${film.year} · ${t('dossier.director')} ${film.director}` : t('dossier.giSub')}
        </p>
        <p className="cv-sheet__phrase">{t('dossier.notesSoon')}</p>
        <div className="cv-sheet__actions">
          <span />
          <button type="button" className="cv-sheet__close" onClick={() => setDossier(null)}>
            {t('nav.close')}
          </button>
        </div>
      </article>
    </div>
  );
}
