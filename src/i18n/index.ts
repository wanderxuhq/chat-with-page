import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { waitForBrowser } from '../utils/browserApi';

import translationZhCN from './locales/zh-CN.json';
import translationEnUS from './locales/en-US.json';
import translationJaJP from './locales/ja-JP.json';
import translationKoKR from './locales/ko-KR.json';
import translationFrFR from './locales/fr-FR.json';
import translationDeDE from './locales/de-DE.json';
import translationEsES from './locales/es-ES.json';
import translationRuRU from './locales/ru-RU.json';

// Get browser language, supported languages list
const supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU'];

// Get browser language, return supported language or default
const getBrowserLanguage = () => {
  try {
    // Get browser language
    const browserLang = navigator.language || navigator.languages?.[0] || 'en-US';

    // Normalize language code format
    const normalizedLang = browserLang.replace('_', '-').toLowerCase();

    // Check if browser language is directly supported
    if (supportedLanguages.includes(browserLang)) {
      return browserLang;
    }

    // Check if normalized language matches
    for (const lang of supportedLanguages) {
      if (lang.toLowerCase() === normalizedLang) {
        return lang;
      }
    }

    // Check if main language part is supported (e.g., en-US -> en)
    const langPrefix = normalizedLang.split('-')[0];

    const matchingLang = supportedLanguages.find(lang =>
      lang.toLowerCase().startsWith(langPrefix)
    );

    if (matchingLang) {
      return matchingLang;
    }

    // Special handling for Chinese-related languages
    if (langPrefix === 'zh') {
      return 'zh-CN';
    }

    return 'en-US';
  } catch (error) {
    console.error('Error getting browser language:', error);
    return 'en-US';
  }
};

// Load saved language from browser.storage.local asynchronously
const loadSavedLanguage = async () => {
  try {
    const browser = await waitForBrowser();
    const result = await browser.storage.local.get('selectedLanguage');
    if (result.selectedLanguage && result.selectedLanguage !== i18n.language) {
      i18n.changeLanguage(result.selectedLanguage as string);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

// Define translation resources
const resources = {
  'zh-CN': {
    translation: translationZhCN
  },
  'en-US': {
    translation: translationEnUS
  },
  'ja-JP': {
    translation: translationJaJP
  },
  'ko-KR': {
    translation: translationKoKR
  },
  'fr-FR': {
    translation: translationFrFR
  },
  'de-DE': {
    translation: translationDeDE
  },
  'es-ES': {
    translation: translationEsES
  },
  'ru-RU': {
    translation: translationRuRU
  }
};

// Initialize i18next
i18n
  .use(initReactI18next) // Pass react-i18next
  .init({
    resources,
    lng: getBrowserLanguage(), // Use browser language as default
    fallbackLng: 'en-US', // 如果当前语言的翻译不存在，使用英语
    interpolation: {
      escapeValue: false // React已经转义了，所以不需要i18next再转义
    }
  });

// Load saved language from storage asynchronously after init
loadSavedLanguage();

export default i18n;