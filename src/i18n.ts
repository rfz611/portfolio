import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './content/en.json';
import pt from './content/pt.json';
import { useScene, type Lang } from './store/useScene';

/** Toda frase do site vem de pt.json / en.json. */
void i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: useScene.getState().lang,
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
});

function applyLang(lang: Lang) {
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  document.title = i18n.t('meta.title');
  const description = i18n.t('meta.description');
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
    document.querySelector(selector)?.setAttribute('content', description);
  }
  document
    .querySelector('meta[property="og:title"]')
    ?.setAttribute('content', i18n.t('meta.title'));
}

applyLang(useScene.getState().lang);

useScene.subscribe((state, prev) => {
  if (state.lang !== prev.lang) {
    void i18n.changeLanguage(state.lang).then(() => applyLang(state.lang));
  }
});

export default i18n;
