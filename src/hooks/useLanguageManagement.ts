import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as browser from "webextension-polyfill";

export const useLanguageManagement = () => {
  const { t, i18n } = useTranslation();
  
  // 支持的语言列表
  const languages = [
    { code: "en-US", name: "English" },
    { code: "zh-CN", name: "中文" },
    { code: "ja-JP", name: "日本語" },
    { code: "ko-KR", name: "한국어" },
    { code: "fr-FR", name: "Français" },
    { code: "de-DE", name: "Deutsch" },
    { code: "es-ES", name: "Español" },
    { code: "ru-RU", name: "Русский" }
  ];
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);

  // 加载语言设置
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await browser.storage.local.get('selectedLanguage');
        if (savedLanguage.selectedLanguage) {
          setSelectedLanguage(savedLanguage.selectedLanguage as string);
          i18n.changeLanguage(savedLanguage.selectedLanguage as string);
        } else {
          // 使用i18n检测到的浏览器语言作为默认语言
          setSelectedLanguage(i18n.language);
        }
      } catch (error) {
        console.error('Error loading language settings:', error);
      }
    };
    
    loadLanguage();
  }, [i18n]);

  // 保存语言设置
  const saveLanguage = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await browser.storage.local.set({ selectedLanguage: languageCode });
      i18n.changeLanguage(languageCode);
    } catch (error) {
      console.error('Error saving language settings:', error);
    }
  };

  return {
    t,
    i18n,
    languages,
    selectedLanguage,
    saveLanguage
  };
};
