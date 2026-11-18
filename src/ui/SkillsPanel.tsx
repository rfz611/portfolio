import { useTranslation } from 'react-i18next';
import { skillGroups } from '../content/skills';
import { useScene } from '../store/useScene';

/**
 * Plano do motor (capô aberto): a ficha do lado mostra as tecnologias da
 * peça clicada. Sem peça escolhida, mostra a lista das peças.
 */
export function SkillsPanel() {
  const { t } = useTranslation();
  const atEngine = useScene((s) => s.view === 'motor');
  const skill = useScene((s) => s.skill);
  const setSkill = useScene((s) => s.setSkill);
  if (!atEngine) return null;
  const group = skillGroups.find((g) => g.id === skill);
  return (
    <aside className="skills-panel" aria-live="polite">
      <p className="skills-panel__title">{t('skills.title')}</p>
      {group ? (
        <>
          <h2 className="skills-panel__group">
            {t(`skills.${group.id}`)}
            <span>{t(group.partKey)}</span>
          </h2>
          <ul className="skills-panel__list">
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="skills-panel__pick">{t('skills.pick')}</p>
      )}
      <nav className="skills-panel__parts" aria-label={t('skills.title')}>
        {skillGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            className={g.id === skill ? 'is-on' : undefined}
            onClick={() => setSkill(g.id)}
          >
            {t(g.partKey)}
          </button>
        ))}
      </nav>
    </aside>
  );
}
