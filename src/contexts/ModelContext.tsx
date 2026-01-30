import React, { createContext, useContext, ReactNode } from 'react';
import { useProviderConfig } from '../hooks/useProviderConfig';
import { useModelManagement } from '../hooks/useModelManagement';

interface ModelContextValue {
  models: string[];
  selectedModel: string;
  modelSearchTerm: string;
  showModelList: boolean;
  fetchingModels: boolean;
  setModelSearchTerm: (term: string) => void;
  setShowModelList: (show: boolean) => void;
  saveSelectedModel: (model: string) => void;
  fetchModels: () => Promise<void>;
}

const ModelContext = createContext<ModelContextValue | null>(null);

export const useModel = (): ModelContextValue => {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};

interface ModelProviderProps {
  children: ReactNode;
}

export const ModelProvider: React.FC<ModelProviderProps> = ({ children }) => {
  const {
    selectedProvider,
    apiKeyInput,
    apiEndpointInput,
  } = useProviderConfig();
  
  const {
    models,
    selectedModel,
    modelSearchTerm,
    showModelList,
    fetchingModels,
    setModelSearchTerm,
    setShowModelList,
    saveSelectedModel,
    fetchModels
  } = useModelManagement(apiKeyInput, apiEndpointInput, selectedProvider);

  const contextValue: ModelContextValue = {
    models,
    selectedModel,
    modelSearchTerm,
    showModelList,
    fetchingModels,
    setModelSearchTerm,
    setShowModelList,
    saveSelectedModel,
    fetchModels
  };

  return (
    <ModelContext.Provider value={contextValue}>
      {children}
    </ModelContext.Provider>
  );
};