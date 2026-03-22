import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import hiTranslations from './locales/hi.json';
import paTranslations from './locales/pa.json';
import bnTranslations from './locales/bn.json';
import mlTranslations from './locales/ml.json';
import knTranslations from './locales/kn.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
      pa: { translation: paTranslations },
      bn: { translation: bnTranslations },
      ml: { translation: mlTranslations },
      kn: { translation: knTranslations }
    },
    lng: localStorage.getItem('medmate_language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
