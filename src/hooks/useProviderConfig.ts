import { useState, useEffect } from 'react';
import * as browser from "webextension-polyfill";
import { useTranslation } from 'react-i18next';

export const useProviderConfig = () => {
  const { i18n } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiEndpointInput, setApiEndpointInput] = useState<string>('');

  // 加载设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedProvider = await browser.storage.local.get('selectedProvider');
        const providerToLoad = (savedProvider.selectedProvider as string) || 'openai';
        
        // 加载提供商特定的API配置
        const savedApiKey = await browser.storage.local.get(`${providerToLoad}ApiKey`);
        const savedApiEndpoint = await browser.storage.local.get(`${providerToLoad}ApiEndpoint`);
        
        // 加载通用API配置作为备选
        const savedGenericApiKey = await browser.storage.local.get('apiKey');
        const savedGenericApiEndpoint = await browser.storage.local.get('apiEndpoint');
        
        const savedLanguage = await browser.storage.local.get('language');

        setSelectedProvider(providerToLoad);
        
        // 使用提供商特定的配置，如果没有则使用通用配置
        const apiKeyToUse = (savedApiKey[`${providerToLoad}ApiKey`] as string) || 
                          (savedGenericApiKey.apiKey as string) || 
                          '';
        
        const apiEndpointToUse = (savedApiEndpoint[`${providerToLoad}ApiEndpoint`] as string) || 
                                (savedGenericApiEndpoint.apiEndpoint as string) || 
                                '';
        
        setApiKey(apiKeyToUse);
        setApiKeyInput(apiKeyToUse);
        setApiEndpoint(apiEndpointToUse);
        setApiEndpointInput(apiEndpointToUse);
        if (savedLanguage.language) {
          i18n.changeLanguage(savedLanguage.language as string);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleProviderChange = async (provider: string) => {
    setSelectedProvider(provider);

    // 保存新提供商
    await browser.storage.local.set({ selectedProvider: provider });

    // 根据新提供商加载相应的API Key和Endpoint
    const savedApiKey = await browser.storage.local.get(`${provider}ApiKey`);
    const savedApiEndpoint = await browser.storage.local.get(`${provider}ApiEndpoint`);

    if (savedApiKey[`${provider}ApiKey`]) {
      setApiKey(savedApiKey[`${provider}ApiKey`] as string);
      setApiKeyInput(savedApiKey[`${provider}ApiKey`] as string);
    } else {
      setApiKey('');
      setApiKeyInput('');
    }

    if (savedApiEndpoint[`${provider}ApiEndpoint`]) {
      setApiEndpoint(savedApiEndpoint[`${provider}ApiEndpoint`] as string);
      setApiEndpointInput(savedApiEndpoint[`${provider}ApiEndpoint`] as string);
    } else {
      // 默认端点
      let defaultEndpoint = '';
      switch (provider) {
        case 'openai':
          defaultEndpoint = 'https://api.openai.com/v1';
          break;
        case 'anthropic':
          defaultEndpoint = 'https://api.anthropic.com/v1';
          break;
        case 'google':
          defaultEndpoint = 'https://generativelanguage.googleapis.com/v1beta/openai';
          break;
        case 'openrouter':
          defaultEndpoint = 'https://openrouter.ai/api/v1';
          break;
        case 'ollama':
          defaultEndpoint = 'http://localhost:11434/v1/';
          break;
        default:
          defaultEndpoint = '';
      }
      setApiEndpoint(defaultEndpoint);
      setApiEndpointInput(defaultEndpoint);
    }
  };

  const saveSettings = async (selectedLanguage?: string) => {
    try {
      // 保存当前提供商的API Key和Endpoint
      await browser.storage.local.set({
        selectedProvider,
        apiKey: apiKeyInput,
        apiEndpoint: apiEndpointInput,
        [`${selectedProvider}ApiKey`]: apiKeyInput,
        [`${selectedProvider}ApiEndpoint`]: apiEndpointInput
      });

      setApiKey(apiKeyInput);
      setApiEndpoint(apiEndpointInput);

      // 保存语言设置
      const languageToSave = selectedLanguage || i18n.language;
      await browser.storage.local.set({ language: languageToSave });
      
      // 更新i18n语言
      i18n.changeLanguage(languageToSave);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return {
    selectedProvider,
    setSelectedProvider,
    apiKey,
    setApiKey,
    apiEndpoint,
    setApiEndpoint,
    apiKeyInput,
    setApiKeyInput,
    apiEndpointInput,
    setApiEndpointInput,
    handleProviderChange,
    saveSettings
  };
};