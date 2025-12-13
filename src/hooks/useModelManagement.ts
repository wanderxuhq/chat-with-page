import { useState, useEffect, useCallback } from 'react';
import * as browser from "webextension-polyfill";

export const useModelManagement = (apiKey: string, apiEndpoint: string, selectedProvider: string) => {
  const [models, setModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [modelSearchTerm, setModelSearchTerm] = useState<string>('');
  const [showModelList, setShowModelList] = useState<boolean>(false);
  const [fetchingModels, setFetchingModels] = useState<boolean>(false);

  // 获取模型列表，使用useCallback确保引用稳定性
  const fetchModels = useCallback(async () => {
    if (!apiKey || !apiEndpoint) {
      console.log('跳过获取模型：API Key或Endpoint为空');
      return;
    }
    
    setFetchingModels(true);
    console.log('开始获取模型列表，API端点：', apiEndpoint);
    
    try {
      // 清除缓存以确保每次都发送API请求
      localStorage.removeItem(`models_${apiEndpoint}`);
      
      // 尝试从缓存获取模型列表（暂时禁用，用于调试）
      /* const cachedModels = localStorage.getItem(`models_${apiEndpoint}`)
      if (cachedModels) {
        const parsedModels = JSON.parse(cachedModels)
        setModels(parsedModels.models)
        if (parsedModels.selectedModel) {
          setSelectedModel(parsedModels.selectedModel)
        }
        console.log('使用缓存的模型列表');
        return
      } */
      
      // 从API获取模型列表
      console.log('发送API请求获取模型列表：', `${apiEndpoint}/models`);
      const response = await fetch(`${apiEndpoint}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      })
      
      console.log('API响应状态：', response.status);
      if (response.ok) {
        const data = await response.json()
        console.log('API响应数据：', data);
        const modelNames = data.data.map((model: any) => model.id)
        
        console.log('获取到的模型列表：', modelNames);
        setModels(modelNames)
        
        // 缓存模型列表到localStorage
        localStorage.setItem(`models_${apiEndpoint}`, JSON.stringify({
          models: modelNames,
          timestamp: Date.now()
        }))
      } else {
        console.error('获取模型列表失败，响应状态：', response.status);
        // 尝试解析错误响应
        try {
          const errorData = await response.json();
          console.error('错误响应数据：', errorData);
        } catch (parseError) {
          console.error('无法解析错误响应：', parseError);
        }
      }
    } catch (error) {
      console.error("获取模型列表失败:", error)
    } finally {
      setFetchingModels(false);
    }
  }, [apiKey, apiEndpoint]);

  // 当API Key、Endpoint或提供商变化时，获取模型列表
  useEffect(() => {
    console.log('useModelManagement: 依赖项变化，触发fetchModels');
    console.log('当前API Key:', apiKey ? '已设置' : '未设置');
    console.log('当前API Endpoint:', apiEndpoint);
    console.log('当前提供商:', selectedProvider);
    fetchModels();
  }, [apiKey, apiEndpoint, selectedProvider, fetchModels]);

  // 加载默认模型
  useEffect(() => {
    const loadDefaultModel = async () => {
      try {
        // 优先从 browser.storage.local 获取当前提供商的上次选择模型
        const savedProviderModel = await browser.storage.local.get(`${selectedProvider}SelectedModel`);
        if (savedProviderModel[`${selectedProvider}SelectedModel`]) {
          setSelectedModel(savedProviderModel[`${selectedProvider}SelectedModel`] as string);
          return;
        }
        // 当用户第一次使用某个提供商时，模型选择为空，需要用户手动选择
        setSelectedModel('');
        // 同时更新搜索词，保持一致
        setModelSearchTerm('');
      } catch (error) {
        console.error('Error loading default model:', error);
      }
    };

    loadDefaultModel();
  }, [selectedProvider, apiEndpoint]);

  // 当selectedModel变化时更新搜索词
  useEffect(() => {
    if (selectedModel) {
      setModelSearchTerm(selectedModel);
    }
  }, [selectedModel]);

  const saveSelectedModel = (modelId: string) => {
    setSelectedModel(modelId)
    
    // 保存到 browser.storage.local，确保插件重新打开时能记住选择
    // 同时按提供商保存模型，以便切换提供商时能恢复上次选择
    browser.storage.local.set({ 
      selectedModel: modelId,
      [`${selectedProvider}SelectedModel`]: modelId 
    })
      .catch(error => console.error('Error saving model to storage:', error));
    
    setShowModelList(false); // 选择后隐藏列表
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
