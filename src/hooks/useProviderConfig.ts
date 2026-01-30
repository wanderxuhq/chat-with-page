import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getSettingsConfig, saveProviderConfig } from '../utils/configUtils';
import { AiProviderId } from '@/config/aiProviders';
import { getSetting, setSetting } from '../db/settings';

export const useProviderConfig = () => {
  const { i18n } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [apiEndpoint, setApiEndpoint] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiEndpointInput, setApiEndpointInput] = useState<string>('');

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load initial provider
        const savedProvider = await getSetting<string>('selectedProvider');
        
        // Use ConfigService to get settings
        if (savedProvider) {
          const providerToLoad = savedProvider as AiProviderId;
          const { apiKey: loadedKey, baseURL: loadedEndpoint } = await getSettingsConfig(providerToLoad);
          
          // Load language
          const savedLanguage = await getSetting<string>('language');
          
          setSelectedProvider(providerToLoad);
          setApiKey(loadedKey);
          setApiKeyInput(loadedKey);
          setApiEndpoint(loadedEndpoint);
          setApiEndpointInput(loadedEndpoint);
          
          if (savedLanguage) {
            i18n.changeLanguage(savedLanguage);
          }
        }
        setLoaded(true);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, [i18n]);

  const handleProviderChange = async (provider: AiProviderId) => {
    setSelectedProvider(provider);

    // Save new provider selection immediately (optional, but consistent with old behavior)
    // await setSetting('selectedProvider', provider);

    // Load corresponding API Key and Endpoint based on new provider
    const { apiKey: loadedKey, baseURL: loadedEndpoint } = await getSettingsConfig(provider);

    setApiKey(loadedKey);
    setApiKeyInput(loadedKey);
    setApiEndpoint(loadedEndpoint);
    setApiEndpointInput(loadedEndpoint);
  };

  const saveSettings = async (selectedLanguage?: string) => {
    try {
      // Use ConfigService to save provider config
      await saveProviderConfig(selectedProvider, apiKeyInput, apiEndpointInput);

      // Save language separately if provided
      if (selectedLanguage) {
        await setSetting('language', selectedLanguage);
        i18n.changeLanguage(selectedLanguage);
      }

      // Update local state to reflect saved values
      setApiKey(apiKeyInput);
      setApiEndpoint(apiEndpointInput);
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  };

  return {
    loaded,
    selectedProvider,
    apiKey,
    apiEndpoint,
    apiKeyInput,
    apiEndpointInput,
    setApiKeyInput,
    setApiEndpointInput,
    handleProviderChange,
    saveSettings
  };
};
