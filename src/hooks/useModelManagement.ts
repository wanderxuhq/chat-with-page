import { useState, useEffect, useCallback } from 'react';
import * as browser from "webextension-polyfill";

export const useModelManagement = (apiKey: string, apiEndpoint: string, selectedProvider: string) => {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelSearchTerm, setModelSearchTerm] = useState<string>('');
  const [showModelList, setShowModelList] = useState<boolean>(false);
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);

  // Get model list, use useCallback to ensure reference stability
  const fetchModels = useCallback(async () => {
    if (!apiKey || !apiEndpoint) {
      console.log('Skipping model fetch: API Key or Endpoint is empty');
      return;
    }
    
    setFetchingModels(true);
    console.log('Starting to get model list, API endpoint:', apiEndpoint);
    
    try {
      // Clear cache to ensure API request is sent every time
      localStorage.removeItem(`models_${apiEndpoint}`);
      
      // Try to get model list from cache (temporarily disabled for debugging)
      /* const cachedModels = localStorage.getItem(`models_${apiEndpoint}`)
      if (cachedModels) {
        const parsedModels = JSON.parse(cachedModels)
        setModels(parsedModels.models)
        if (parsedModels.selectedModel) {
          setSelectedModel(parsedModels.selectedModel)
        }
        console.log('Using cached model list');
        return
      } */
      
      // Get model list from API
      console.log('Sending API request to get model list:', `${apiEndpoint}/models`);
      const response = await fetch(`${apiEndpoint}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      })
      
      console.log('API response status:', response.status);
      if (response.ok) {
        const data = await response.json()
        console.log('API response data:', data);
        const modelNames = data.data.map((model: any) => model.id)
        
        console.log('Retrieved model list:', modelNames);
        setModels(modelNames)
        
        // Cache model list to localStorage
        localStorage.setItem(`models_${apiEndpoint}`, JSON.stringify({
          models: modelNames,
          timestamp: Date.now()
        }))
      } else {
        console.error('Failed to get model list, response status:', response.status);
        // Try to parse error response
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
        } catch (parseError) {
          console.error('Unable to parse error response:', parseError);
        }
      }
    } catch (error) {
      console.error("Failed to get model list:", error)
    } finally {
      setFetchingModels(false);
    }
  }, [apiKey, apiEndpoint]);

  // Get model list when API Key, Endpoint or provider changes
  useEffect(() => {
    console.log('useModelManagement: Dependencies changed, triggering fetchModels');
    console.log('Current API Key:', apiKey ? 'Set' : 'Not set');
    console.log('Current API Endpoint:', apiEndpoint);
    console.log('Current provider:', selectedProvider);
    fetchModels();
  }, [apiKey, apiEndpoint, selectedProvider, fetchModels]);

  // Load default model
  useEffect(() => {
    const loadDefaultModel = async () => {
      try {
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

  const saveSelectedModel = (modelId: string) => {
    setSelectedModel(modelId)
    
    // Save to browser.storage.local to ensure the selection is remembered when the extension is reopened
    // Also save model by provider to restore last selection when switching providers
    browser.storage.local.set({ 
      selectedModel: modelId,
      [`${selectedProvider}SelectedModel`]: modelId 
    })
      .catch(error => console.error('Error saving model to storage:', error));
    
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
