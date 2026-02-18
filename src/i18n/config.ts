import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enLocale from './locales/en.json';
import esLocale from './locales/es.json';

const resources = {
  en: { translation: enLocale },
  es: { translation: esLocale },
};

// Get language from localStorage or default to browser language
const getSavedLanguage = () => {
  const saved = localStorage.getItem('preferredLanguage');
  if (saved && ['en', 'es'].includes(saved)) {
    return saved;
  }
  // Detect from browser language
  const browserLang = navigator.language.split('-')[0];
  return ['es'].includes(browserLang) ? 'es' : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
