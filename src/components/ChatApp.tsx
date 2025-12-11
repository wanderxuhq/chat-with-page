import React, { useState, useEffect, useCallback } from "react"
import type { Message } from '../types/index';
import { sendMessage, summarizePage } from '../utils/chatUtils';

// 导入hooks
import { useChatHistory } from '../hooks/useChatHistory';
import { useModelManagement } from '../hooks/useModelManagement';
import { useProviderConfig } from '../hooks/useProviderConfig';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { usePageInteraction } from '../hooks/usePageInteraction';
import { useTextHighlighting } from '../hooks/useTextHighlighting';
import { useGlobalStyles } from '../hooks/useGlobalStyles';

// 导入组件
import { SettingsPanel, MessageList, ModelSelector, InputPanel } from "./index";
import ChatHeader from './ChatHeader';
import ChatBody from './ChatBody';
import ChatFooter from './ChatFooter';

function ChatApp() {
  // ======================================
  // 1. 状态管理与Hooks
  // ======================================
  // 使用全局样式hook
  useGlobalStyles();
  
  // 组件内部状态
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // 外部hooks
  const { t, i18n, languages, selectedLanguage, saveLanguage } = useLanguageManagement();
  const { messages, setMessages, input, setInput, clearChatHistory } = useChatHistory();
  const { selectedProvider, setSelectedProvider, apiKey, setApiKey, apiEndpoint, setApiEndpoint, apiKeyInput, setApiKeyInput, apiEndpointInput, setApiEndpointInput, handleProviderChange, saveSettings: saveProviderSettings } = useProviderConfig();
  const { models, selectedModel, setSelectedModel, modelSearchTerm, setModelSearchTerm, showModelList, setShowModelList, fetchingModels, saveSelectedModel, fetchModels } = useModelManagement(apiKey, apiEndpoint, selectedProvider);
  const { currentPageUrl } = usePageInteraction(messages);
  const { highlightMap, setHighlightMap } = useTextHighlighting(messages);
  
  // ======================================
  // 2. 常量定义
  // ======================================
  // 主流AI提供商预置配置
  const aiProviders = [
    { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
    { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1" },
    { id: "google", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
    { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
    { id: "ollama", name: "Ollama", baseUrl: "http://localhost:11434/v1/" },
    { id: "custom", name: "自定义", baseUrl: "" }
  ];
  
  // ======================================
  // 3. 副作用处理
  // ======================================
  // 当apiKey、apiEndpoint或selectedProvider变化时获取模型列表
  useEffect(() => {
    if (apiKey && apiEndpoint) {
      fetchModels();
    }
  }, [apiKey, apiEndpoint, selectedProvider, fetchModels]);
  
  // 当selectedModel变化时，更新modelSearchTerm
  useEffect(() => {
    setModelSearchTerm(selectedModel);
  }, [selectedModel]);
  
  // 自动保存聊天记录和highlightMap到localStorage
  useEffect(() => {
    if (currentPageUrl && messages.length > 0) {
      localStorage.setItem(`chat_history_${currentPageUrl}`, JSON.stringify({
        messages,
        highlightMap
      }));
    }
  }, [messages, highlightMap, currentPageUrl]);
  
  // 自动加载聊天记录和highlightMap
  useEffect(() => {
    if (currentPageUrl) {
      const savedHistory = localStorage.getItem(`chat_history_${currentPageUrl}`);
      if (savedHistory) {
        try {
          const parsedData = JSON.parse(savedHistory) as {
            messages: Message[];
            highlightMap: Record<string, string>;
          };
          // 确保messages是数组
          if (Array.isArray(parsedData.messages)) {
            setMessages(parsedData.messages);
          } else {
            console.error("Invalid messages format in saved data");
            setMessages([]);
          }
          setHighlightMap(parsedData.highlightMap || {});
        } catch (error) {
          console.error("Error parsing saved chat history:", error);
          // 解析失败时确保messages是数组
          setMessages([]);
          setHighlightMap({});
        }
      }
    }
  }, [currentPageUrl]);
  
  // ======================================
  // 4. 事件处理函数 (使用 useCallback 优化)
  // ======================================
  // 保存设置
  const saveSettings = useCallback(async () => {
    try {
      // 保存提供商配置
      await saveProviderSettings(selectedLanguage);
      
      // 保存语言设置
      await saveLanguage(selectedLanguage);
      
      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [saveProviderSettings, selectedLanguage, saveLanguage, setShowSettings]);
  
  // 处理页面总结
  const handleSummarizePage = useCallback(async () => {
    await summarizePage(setLoading, setMessages, selectedModel, selectedLanguage, messages, setHighlightMap);
  }, [setLoading, setMessages, selectedModel, selectedLanguage, messages, setHighlightMap, summarizePage]);
  
  // 处理消息发送
  const handleSendMessage = useCallback(() => {
    if (modelSearchTerm.trim() && modelSearchTerm.trim() !== selectedModel) {
      saveSelectedModel(modelSearchTerm.trim());
    }
    sendMessage(input, messages, setMessages, selectedModel, selectedLanguage, highlightMap, setLoading);
    setInput("");
  }, [modelSearchTerm, selectedModel, saveSelectedModel, input, messages, setMessages, selectedLanguage, highlightMap, setLoading, setInput, sendMessage]);

  if (!apiKey && !showSettings) {
    return (
      <SettingsPanel
        selectedProvider={selectedProvider}
        aiProviders={aiProviders}
        apiEndpointInput={apiEndpointInput}
        apiKeyInput={apiKeyInput}
        selectedLanguage={selectedLanguage}
        languages={languages}
        t={t}
        handleProviderChange={handleProviderChange}
        setApiEndpointInput={setApiEndpointInput}
        setApiKeyInput={setApiKeyInput}
        setSelectedLanguage={saveLanguage}
        saveSettings={saveSettings}
        i18n={i18n}
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        padding: 16,
        overflow: "hidden",
        boxSizing: "border-box",
        margin: 0
      }}
    >
      {/* 设置按钮 */}
      {showSettings ? (
        <SettingsPanel
          selectedProvider={selectedProvider}
          aiProviders={aiProviders}
          apiEndpointInput={apiEndpointInput}
          apiKeyInput={apiKeyInput}
          selectedLanguage={selectedLanguage}
          languages={languages}
          t={t}
          handleProviderChange={handleProviderChange}
          setApiEndpointInput={setApiEndpointInput}
          setApiKeyInput={setApiKeyInput}
          setSelectedLanguage={saveLanguage}
          saveSettings={saveSettings}
          i18n={i18n}
        />
      ) : (
        <>
          {/* 聊天头部 */}
          <ChatHeader
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            clearChatHistory={clearChatHistory}
            t={t}
          />
          
          {/* 消息列表 */}
          <ChatBody
            messages={messages}
            loading={loading}
            t={t}
          />
          
          {/* 聊天底部 */}
          <ChatFooter
            models={models}
            selectedModel={selectedModel}
            modelSearchTerm={modelSearchTerm}
            showModelList={showModelList}
            fetchingModels={fetchingModels}
            input={input}
            setInput={setInput}
            t={t}
            setModelSearchTerm={setModelSearchTerm}
            setShowModelList={setShowModelList}
            saveSelectedModel={saveSelectedModel}
            sendMessage={handleSendMessage}
            summarizePage={handleSummarizePage}
          />
        </>
      )}
    </div>
  );
}

export default ChatApp;
