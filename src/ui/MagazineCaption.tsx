import { useTranslation } from 'react-i18next';
import { certificates } from '../content/certificates';
import { useScene } from '../store/useScene';

/**
 * Legenda da revista aberta: curso, instituição e ano, com setas para
 * folhear as outras e o botão de fechar (Esc também fecha).
 */
export function MagazineCaption() {
  const { t } = useTranslation();
  const view = useScene((s) => s.view);
  const index = useScene((s) => s.magazine);
  const setMagazine = useScene((s) => s.setMagazine);
  if (view !== 'mesa' || index === null) return null;
  const cert = certificates[index];
  const step = (n: number) => setMagazine((index + n + certificates.length) % certificates.length);
  return (
    <div className="magazine-caption" role="group" aria-label={t('certificates.title')}>
      <button
        type="button"
        className="ctl"
        aria-label={t('certificates.prev')}
        onClick={() => step(-1)}
      >
        ◀
      </button>
      <p aria-live="polite">
        <strong>{t(`certificates.${cert.id}`)}</strong>
        <span>
          {cert.provider} · {cert.year ?? t('certificates.inProgress')}
        </span>
      </p>
      <button
        type="button"
        className="ctl"
        aria-label={t('certificates.next')}
        onClick={() => step(1)}
      >
        ▶
      </button>
      <button
        type="button"
        className="ctl magazine-caption__close"
        onClick={() => setMagazine(null)}
      >
        [ {t('certificates.close')} ]
      </button>
    </div>
  );
}
