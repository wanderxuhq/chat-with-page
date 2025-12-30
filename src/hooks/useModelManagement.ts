import { useState, useEffect, useCallback } from 'react';
import { waitForBrowser } from '../utils/browserApi';

export const useModelManagement = (apiKey: string, apiEndpoint: string, selectedProvider: string) => {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelSearchTerm, setModelSearchTerm] = useState<string>('');
  const [showModelList, setShowModelList] = useState<boolean>(false);
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);

  // Get model list, use useCallback to ensure reference stability
  const fetchModels = useCallback(async () => {
    if (!apiKey || !apiEndpoint) {
      return;
    }

    setFetchingModels(true);

    try {
      // Clear cache to ensure API request is sent every time
      const browser = await waitForBrowser();
      await browser.storage.local.remove(`models_${apiEndpoint}`);

      // Get model list from API
      const response = await fetch(`${apiEndpoint}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      })

      if (response.ok) {
        const data = await response.json()
        const modelNames = data.data.map((model: any) => model.id)

        setModels(modelNames)

        // Cache model list to browser.storage.local
        await browser.storage.local.set({
          [`models_${apiEndpoint}`]: JSON.stringify({
            models: modelNames,
            timestamp: Date.now()
          })
        });
      }
    } catch (error) {
      console.error("Failed to get model list:", error)
    } finally {
      setFetchingModels(false);
    }
  }, [apiKey, apiEndpoint]);

  // Get model list when API Key, Endpoint or provider changes
  useEffect(() => {
    fetchModels();
  }, [apiKey, apiEndpoint, selectedProvider, fetchModels]);

  // Load default model
  useEffect(() => {
    const loadDefaultModel = async () => {
      try {
        const browser = await waitForBrowser();
        // Prioritize getting the last selected model for the current provider from browser.storage.local
        const savedProviderModel = await browser.storage.local.get(`${selectedProvider}SelectedModel`);
        if (savedProviderModel[`${selectedProvider}SelectedModel`]) {
          setSelectedModel(savedProviderModel[`${selectedProvider}SelectedModel`] as string);
          return;
        }
        // When a user uses a provider for the first time, model selection is empty and requires manual selection
        setSelectedModel('');
        // Also update search term to maintain consistency
        setModelSearchTerm('');
      } catch (error) {
        console.error('Error loading default model:', error);
      }
    };

    loadDefaultModel();
  }, [selectedProvider, apiEndpoint]);

  // Update search term when selectedModel changes
  useEffect(() => {
    if (selectedModel) {
      setModelSearchTerm(selectedModel);
    }
  }, [selectedModel]);

  const saveSelectedModel = async (modelId: string) => {
    setSelectedModel(modelId)

    try {
      const browser = await waitForBrowser();
      // Save to browser.storage.local to ensure the selection is remembered when the extension is reopened
      // Also save model by provider to restore last selection when switching providers
      await browser.storage.local.set({
        selectedModel: modelId,
        [`${selectedProvider}SelectedModel`]: modelId
      });
    } catch (error) {
      console.error('Error saving model to storage:', error);
    }

    setShowModelList(false); // Hide list after selection
  };

  return {
    models,
    selectedModel,
    setSelectedModel,
    modelSearchTerm,
    setModelSearchTerm,
    showModelList,
    setShowModelList,
    fetchModels,
    fetchingModels,
    saveSelectedModel
  };
};
