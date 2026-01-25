import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSetting, setSetting } from '../db/settings';

export const useLanguageManagement = () => {
  const { t, i18n } = useTranslation();
  
  // Supported languages list
  const languages = [
    { code: "en-US", name: "English" },
    { code: "zh-CN", name: "Chinese" },
    { code: "ja-JP", name: "Japanese" },
    { code: "ko-KR", name: "Korean" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "es-ES", name: "Spanish" },
    { code: "ru-RU", name: "Russian" }
  ];
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);

  // Load language settings
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await getSetting<string>('selectedLanguage');
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
          i18n.changeLanguage(savedLanguage);
        } else {
          // Use browser language detected by i18n as default language
          setSelectedLanguage(i18n.language);
        }
      } catch (error) {
        console.error('Error loading language settings:', error);
      }
    };
    
    loadLanguage();
  }, [i18n]);

  // Save language settings
  const saveLanguage = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await setSetting('selectedLanguage', languageCode);
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
