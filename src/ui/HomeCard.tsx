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
 * Seção Início, no plano da janela: com a cidade e o outdoor com o nome lá
 * fora, aparece um cartão com nome, título, a frase, o que estou
 * procurando e os botões Baixar currículo e Ver projetos.
 */
export function HomeCard() {
  const { t } = useTranslation();
  const view = useScene((s) => s.view);
  const lang = useScene((s) => s.lang);
  const setView = useScene((s) => s.setView);
  const [shown, setShown] = useState(false);
  const [cv, setCv] = useState<boolean | null>(null);
  const href = cvFiles[lang];

  // o cartão entra depois que a câmera chega na janela
  useEffect(() => {
    if (view !== 'janela') {
      setShown(false);
      return;
    }
    const timer = window.setTimeout(() => setShown(true), 1100);
    return () => window.clearTimeout(timer);
  }, [view]);

  useEffect(() => {
    let alive = true;
    void pdfExists(href).then((ok) => alive && setCv(ok));
    return () => {
      alive = false;
    };
  }, [href]);

  if (view !== 'janela') return null;
  return (
    <section className={`home-card${shown ? ' is-on' : ''}`} aria-labelledby="home-card-name">
      <p className="home-card__place">{t('home.place')}</p>
      <h2 id="home-card-name">{t('home.name')}</h2>
      <p className="home-card__role">{t('home.role')}</p>
      <p className="home-card__phrase">“{t('home.phrase')}”</p>
      <p className="home-card__status">
        <i aria-hidden="true" />
        {t('home.status')}
      </p>
      <div className="home-card__actions">
        {cv ? (
          <a className="ctl" href={href} download>
            [ {t('home.downloadCv')} ↓ ]
          </a>
        ) : (
          <span className="ctl is-disabled">[ {t('home.cvSoon')} ]</span>
        )}
        <button type="button" className="ctl" onClick={() => setView('tv')}>
          [ {t('home.seeProjects')} ▶ ]
        </button>
      </div>
    </section>
  );
}
