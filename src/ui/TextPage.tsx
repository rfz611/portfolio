import { useTranslation } from 'react-i18next';
import { certificates } from '../content/certificates';
import { contactLinks, cvFiles } from '../content/contact';
import { projects } from '../content/projects';
import { skillGroups } from '../content/skills';
import { useScene } from '../store/useScene';
import { RecordCrate } from './RecordCrate';

/** Nome com o sobrenome do meio (Scharf) em neon, como o letreiro da sala. */
function NeonName({ name }: { name: string }) {
  const [first, middle, ...rest] = name.split(' ');
  if (!middle) return <>{name}</>;
  return (
    <>
      <span className="hero__first">{first}</span>
      <span className="hero__neon">{middle}</span>
      <span className="hero__last">{rest.join(' ')}</span>
    </>
  );
}

/**
 * Página de texto completa: aparece quando não há WebGL ou quando a pessoa
 * prefere não explorar o 3D. Tem todo o conteúdo do portfólio, com o clima
 * da cobertura: mogno e vinho, o nome em neon, os projetos em telas de TV
 * de tubo, o sobre mim como o arquivo do notebook e o contato no dial do rádio.
 */
export function TextPage({ webgl }: { webgl: boolean }) {
  const { t } = useTranslation();
  const setMode = useScene((s) => s.setMode);
  return (
    <div className="text-page">
      {!webgl && <p className="text-page__notice">{t('ui.noWebgl')}</p>}

      <section id="inicio" className="hero" aria-labelledby="t-inicio">
        <div className="hero__photo" aria-hidden="true" />
        <p className="eyebrow">{t('textPage.kicker')}</p>
        <h2 id="t-inicio" className="display hero__name">
          <NeonName name={t('home.name')} />
        </h2>
        <p className="lead">
          {t('home.role')} · {t('home.place')}
        </p>
        <p>{t('home.phrase')}</p>
        <p className="status">{t('home.status')}</p>
        <p className="actions">
          <a className="button" href={cvFiles.pt} download>
            {t('home.downloadCv')}
          </a>
          <a className="button button--ghost" href="#projetos">
            {t('home.seeProjects')}
          </a>
          {webgl && (
            <button
              type="button"
              className="button button--ghost"
              onClick={() => {
                window.scrollTo(0, 0);
                setMode('3d');
              }}
            >
              {t('textPage.enter3d')}
            </button>
          )}
        </p>
      </section>

      <section id="projetos" aria-labelledby="t-projetos">
        <h2 id="t-projetos">{t('projects.title')}</h2>
        {projects.map((project) => (
          <article key={project.id} className="card card--tv">
            <p className="crt">
              {t('projects.channel')} {project.channel}
            </p>
            <h3>{t(`projects.${project.id}.name`)}</h3>
            <p>{t(`projects.${project.id}.description`)}</p>
            <ul className="tags" aria-label={t('projects.tech')}>
              {project.tech.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
            {project.link ? (
              <a href={project.link} target="_blank" rel="noreferrer">
                {t('projects.link')} ↗
              </a>
            ) : (
              <p className="muted">{t('projects.linkSoon')}</p>
            )}
          </article>
        ))}
      </section>

      <section id="sobre" aria-labelledby="t-sobre">
        <h2 id="t-sobre">{t('about.title')}</h2>
        <div className="file">
          <p className="file__bar">{t('about.aboutFile')}</p>
          {t('about.aboutText')
            .split(/\n\n/)
            .map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
        </div>
        <h3>{t('about.education')}</h3>
        <ul>
          <li>{t('about.educationUni')}</li>
          <li>{t('about.educationTech')}</li>
        </ul>
        <h3>{t('about.experience')}</h3>
        <p>{t('about.experienceSupport')}</p>
        <h3>{t('about.languages')}</h3>
        <ul>
          <li>{t('about.langPt')}</li>
          <li>{t('about.langEn')}</li>
          <li>{t('about.langEs')}</li>
          <li>{t('about.langIt')}</li>
        </ul>
      </section>

      <section id="skills" aria-labelledby="t-skills">
        <h2 id="t-skills">{t('skills.title')}</h2>
        <dl className="skills">
          {skillGroups.map((group) => (
            <div key={group.id}>
              <dt>
                {t(`skills.${group.id}`)}
                <span className="crt">{t(group.partKey)}</span>
              </dt>
              <dd>{group.items.join(' · ')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="certificados" aria-labelledby="t-certificados">
        <h2 id="t-certificados">{t('certificates.title')}</h2>
        <ul>
          {certificates.map((cert) => (
            <li key={cert.id}>
              <strong>{t(`certificates.${cert.id}`)}</strong>, {cert.provider},{' '}
              {cert.year ?? t('certificates.inProgress')}
            </li>
          ))}
        </ul>
      </section>

      <section id="discos" aria-labelledby="t-discos">
        <h2 id="t-discos">{t('records.title')}</h2>
        <RecordCrate />
      </section>

      <section id="contato" aria-labelledby="t-contato">
        <h2 id="t-contato">{t('contact.title')}</h2>
        <ul className="contact radio">
          {contactLinks.map((link) => (
            <li key={link.id}>
              <span className="crt">{link.frequency}</span>{' '}
              <a
                href={link.href}
                target={link.id === 'email' ? undefined : '_blank'}
                rel="noreferrer"
              >
                {t(`contact.${link.id}`)}
                {link.id !== 'cv' ? `: ${link.value}` : ''}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
