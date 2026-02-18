import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enLocale from './locales/en.json';
import esLocale from './locales/es.json';
import zhLocale from './locales/zh.json';
import frLocale from './locales/fr.json';
import deLocale from './locales/de.json';
import ptBRLocale from './locales/pt-BR.json';
import jaLocale from './locales/ja.json';
import arLocale from './locales/ar.json';
import koLocale from './locales/ko.json';
import ruLocale from './locales/ru.json';
import itLocale from './locales/it.json';
import nlLocale from './locales/nl.json';
import plLocale from './locales/pl.json';
import trLocale from './locales/tr.json';
import csLocale from './locales/cs.json';
import idLocale from './locales/id.json';
import ukLocale from './locales/uk.json';
import huLocale from './locales/hu.json';
import svLocale from './locales/sv.json';
import elLocale from './locales/el.json';

const resources = {
  en: { translation: enLocale },
  es: { translation: esLocale },
  zh: { translation: zhLocale },
  fr: { translation: frLocale },
  de: { translation: deLocale },
  'pt-BR': { translation: ptBRLocale },
  ja: { translation: jaLocale },
  ar: { translation: arLocale },
  ko: { translation: koLocale },
  ru: { translation: ruLocale },
  it: { translation: itLocale },
  nl: { translation: nlLocale },
  pl: { translation: plLocale },
  tr: { translation: trLocale },
  cs: { translation: csLocale },
  id: { translation: idLocale },
  uk: { translation: ukLocale },
  hu: { translation: huLocale },
  sv: { translation: svLocale },
  el: { translation: elLocale },
};

// Auto-detect language from browser regional settings
const detectLanguage = () => {
  const browserLang = navigator.language.toLowerCase();
  const baseLang = browserLang.split('-')[0];
  
  // Support pt-BR specifically
  if (browserLang === 'pt-br' || baseLang === 'pt') {
    return 'pt-BR';
  }
  
  // Map common language codes to supported languages
  const langMap: Record<string, string> = {
    'en': 'en',
    'es': 'es',
    'zh': 'zh',
    'fr': 'fr',
    'de': 'de',
    'pt': 'pt-BR',
    'ja': 'ja',
    'ar': 'ar',
    'ko': 'ko',
    'ru': 'ru',
    'it': 'it',
    'nl': 'nl',
    'pl': 'pl',
    'tr': 'tr',
    'cs': 'cs',
    'id': 'id',
    'uk': 'uk',
    'hu': 'hu',
    'sv': 'sv',
    'el': 'el',
  };
  
  const detectedLang = langMap[baseLang];
  return detectedLang || 'en';
};

// Detect if language is RTL (right-to-left)
export const isRTLLanguage = (lang: string): boolean => {
  return lang === 'ar';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
