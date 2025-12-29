import { useState, useEffect } from 'react';
import * as browser from "webextension-polyfill";
import { useTranslation } from 'react-i18next';
import { encryptValue, decryptValue, migrateToEncrypted } from '../utils/crypto';

export const useProviderConfig = () => {
  const { i18n } = useTranslation();
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiEndpointInput, setApiEndpointInput] = useState<string>('');

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedProvider = await browser.storage.local.get('selectedProvider');
        const providerToLoad = (savedProvider.selectedProvider as string) || 'openai';

        // Load provider-specific API configuration
        const savedApiKey = await browser.storage.local.get(`${providerToLoad}ApiKey`);
        const savedApiEndpoint = await browser.storage.local.get(`${providerToLoad}ApiEndpoint`);

        // Load generic API configuration as fallback
        const savedGenericApiKey = await browser.storage.local.get('apiKey');
        const savedGenericApiEndpoint = await browser.storage.local.get('apiEndpoint');

        const savedLanguage = await browser.storage.local.get('language');

        setSelectedProvider(providerToLoad);

        // Use provider-specific configuration, fallback to generic if not available
        // Decrypt API key from storage
        const encryptedKey = (savedApiKey[`${providerToLoad}ApiKey`] as string) ||
                            (savedGenericApiKey.apiKey as string) ||
                            '';
        const apiKeyToUse = encryptedKey ? await decryptValue(encryptedKey) : '';
        
        // Get default endpoint
        const getDefaultEndpoint = (provider: string) => {
          switch (provider) {
            case 'openai':
              return 'https://api.openai.com/v1';
            case 'anthropic':
              return 'https://api.anthropic.com/v1';
            case 'google':
              return 'https://generativelanguage.googleapis.com/v1beta/openai';
            case 'openrouter':
              return 'https://openrouter.ai/api/v1';
            case 'ollama':
              return 'http://localhost:11434/v1/';
            default:
              return '';
          }
        };

        const apiEndpointToUse = (savedApiEndpoint[`${providerToLoad}ApiEndpoint`] as string) ||
                                (savedGenericApiEndpoint.apiEndpoint as string) ||
                                getDefaultEndpoint(providerToLoad);
        
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

    // Save new provider
    await browser.storage.local.set({ selectedProvider: provider });

    // Load corresponding API Key and Endpoint based on new provider
    const savedApiKey = await browser.storage.local.get(`${provider}ApiKey`);
    const savedApiEndpoint = await browser.storage.local.get(`${provider}ApiEndpoint`);

    if (savedApiKey[`${provider}ApiKey`]) {
      // Decrypt API key
      const decryptedKey = await decryptValue(savedApiKey[`${provider}ApiKey`] as string);
      setApiKey(decryptedKey);
      setApiKeyInput(decryptedKey);
    } else {
      setApiKey('');
      setApiKeyInput('');
    }

    if (savedApiEndpoint[`${provider}ApiEndpoint`]) {
      setApiEndpoint(savedApiEndpoint[`${provider}ApiEndpoint`] as string);
      setApiEndpointInput(savedApiEndpoint[`${provider}ApiEndpoint`] as string);
    } else {
      // Default endpoint
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
      // Encrypt API key before saving
      const encryptedApiKey = apiKeyInput ? await encryptValue(apiKeyInput) : '';

      // Save current provider's API Key and Endpoint
      await browser.storage.local.set({
        selectedProvider,
        apiKey: encryptedApiKey,
        apiEndpoint: apiEndpointInput,
        [`${selectedProvider}ApiKey`]: encryptedApiKey,
        [`${selectedProvider}ApiEndpoint`]: apiEndpointInput
      });

      setApiKey(apiKeyInput);
      setApiEndpoint(apiEndpointInput);

      // Save language settings
      const languageToSave = selectedLanguage || i18n.language;
      await browser.storage.local.set({ language: languageToSave });
      
      // Update i18n language
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