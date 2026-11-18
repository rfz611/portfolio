import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cvFiles } from '../content/contact';
import { useScene } from '../store/useScene';

/** O PDF existe mesmo? (o servidor de desenvolvimento devolve a página para arquivo que falta) */
async function pdfExists(href: string) {
  try {
    const response = await fetch(href, { method: 'HEAD' });
    return response.ok && (response.headers.get('content-type') ?? '').includes('pdf');
  } catch {
    return false;
  }
}

/**
 * A folha do currículo: clicando nos papéis da mesa do escritório, abre
 * uma folha datilografada com nome, curso, cidade, a frase, o que estou
 * procurando e o botão de baixar o PDF. Esc ou Fechar devolvem à sala.
 */
export function CvSheet() {
  const { t } = useTranslation();
  const open = useScene((s) => s.cvOpen);
  const lang = useScene((s) => s.lang);
  const setCvOpen = useScene((s) => s.setCvOpen);
  const [cv, setCv] = useState<boolean | null>(null);
  const href = cvFiles[lang];

  useEffect(() => {
    let alive = true;
    void pdfExists(href).then((ok) => alive && setCv(ok));
    return () => {
      alive = false;
    };
  }, [href]);

  if (!open) return null;
  return (
    <div className="cv-sheet" role="dialog" aria-modal="false" aria-labelledby="cv-sheet-name">
      <article className="cv-sheet__paper">
        <p className="cv-sheet__place">{t('home.place')}</p>
        <h2 id="cv-sheet-name">{t('home.name')}</h2>
        <p className="cv-sheet__role">{t('home.role')}</p>
        <p className="cv-sheet__phrase">{t('home.phrase')}</p>
        <p className="cv-sheet__status">{t('home.status')}</p>
        <div className="cv-sheet__actions">
          {cv ? (
            <a className="cv-sheet__button" href={href} download>
              {t('home.downloadCv')} ↓
            </a>
          ) : (
            <span className="cv-sheet__button is-disabled">{t('home.cvSoon')}</span>
          )}
          <button type="button" className="cv-sheet__close" onClick={() => setCvOpen(false)}>
            {t('nav.close')}
          </button>
        </div>
      </article>
    </div>
  );
}
