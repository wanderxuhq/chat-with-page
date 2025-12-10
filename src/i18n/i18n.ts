import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationZhCN from './locales/zh-CN.json';
import translationEnUS from './locales/en-US.json';
import translationJaJP from './locales/ja-JP.json';
import translationKoKR from './locales/ko-KR.json';
import translationFrFR from './locales/fr-FR.json';
import translationDeDE from './locales/de-DE.json';
import translationEsES from './locales/es-ES.json';
import translationRuRU from './locales/ru-RU.json';

// 获取本地存储的语言设置，如果没有则使用默认语言
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    return savedLanguage || 'zh-CN';
  } catch (error) {
    console.error('Error getting saved language:', error);
    return 'zh-CN';
  }
};

// 定义翻译资源
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

// 初始化i18next
i18n
  .use(initReactI18next) // 传入react-i18next
  .init({
    resources,
    lng: getInitialLanguage(), // 设置默认语言
    fallbackLng: 'zh-CN', // 如果当前语言的翻译不存在，使用中文
    interpolation: {
      escapeValue: false // React已经转义了，所以不需要i18next再转义
    }
  });

export default i18n;