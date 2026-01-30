import { useState, useEffect, useCallback, useRef } from 'react';
import { getSetting, setSetting } from '../db/settings';

export const useModelManagement = (apiKey: string, apiEndpoint: string, selectedProvider: string) => {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelSearchTerm, setModelSearchTerm] = useState<string>('');
  const [showModelList, setShowModelList] = useState<boolean>(false);
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);
  
  // Track if we've already fetched models during initialization
  const initializedRef = useRef(false);
  // Track the current provider to detect changes
  const currentProviderRef = useRef(selectedProvider);

  // Get model list, use useCallback to ensure reference stability
  const fetchModels = useCallback(async () => {
    if (!apiKey || !apiEndpoint) {
      return;
    }

    setFetchingModels(true);

    try {
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
      }
    } catch (error) {
      console.error("Failed to get model list:", error)
    } finally {
      setFetchingModels(false);
    }
  }, [apiKey, apiEndpoint]);

  // Get model list when API Key, Endpoint or provider changes
  useEffect(() => {
    if (apiKey && apiEndpoint) {
      // Check if provider has changed
      const providerChanged = currentProviderRef.current !== selectedProvider;
      currentProviderRef.current = selectedProvider;
      
      // For initial load, only fetch once
      if (!initializedRef.current) {
        initializedRef.current = true;
        fetchModels();
      } else if (providerChanged) {
        // For provider changes, always fetch
        fetchModels();
      }
      // Ignore API key/endpoint changes during initialization
    }
  }, [apiKey, apiEndpoint, selectedProvider]);

  // Load default model
  useEffect(() => {
    const loadDefaultModel = async () => {
      try {
        // Get the globally selected model from settings
        const savedModel = await getSetting<string>('selectedModel');
        
        if (savedModel) {
          setSelectedModel(savedModel);
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
      // Save to settings to ensure the selection is remembered when the extension is reopened
      await setSetting('selectedModel', modelId);
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
