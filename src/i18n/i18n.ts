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

// 获取浏览器语言，支持的语言列表
const supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU'];

// 获取浏览器语言，返回支持的语言或默认语言
const getBrowserLanguage = () => {
  try {
    // 获取浏览器语言
    const browserLang = navigator.language || navigator.languages?.[0] || 'en-US';
    
    // 标准化语言代码格式
    const normalizedLang = browserLang.replace('_', '-').toLowerCase();
    
    // 检查是否直接支持浏览器语言
    if (supportedLanguages.includes(browserLang)) {
      return browserLang;
    }
    
    // 检查标准化后的语言是否匹配
    for (const lang of supportedLanguages) {
      if (lang.toLowerCase() === normalizedLang) {
        return lang;
      }
    }
    
    // 检查是否支持语言的主要部分（如en-US -> en）
    const langPrefix = normalizedLang.split('-')[0];
    
    const matchingLang = supportedLanguages.find(lang => 
      lang.toLowerCase().startsWith(langPrefix)
    );
    
    if (matchingLang) {
      return matchingLang;
    }
    
    // 特殊处理中文相关语言
    if (langPrefix === 'zh') {
      return 'zh-CN';
    }
    
    return 'en-US';
  } catch (error) {
    console.error('Error getting browser language:', error);
    return 'en-US';
  }
};

// 获取本地存储的语言设置，如果没有则使用浏览器语言
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    return savedLanguage || getBrowserLanguage();
  } catch (error) {
    console.error('Error getting saved language:', error);
    return getBrowserLanguage();
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
    fallbackLng: 'en-US', // 如果当前语言的翻译不存在，使用英语
    interpolation: {
      escapeValue: false // React已经转义了，所以不需要i18next再转义
    }
  });

export default i18n;