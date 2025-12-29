import React, { useState, useEffect, useCallback } from "react"
import type { Message } from '../types/index';
import { sendMessage, summarizePage, stopGeneration, regenerateMessage, editAndResendMessage, copyMessageToClipboard, getPageContext } from '../utils/chatUtils';

// 导入hooks
import { useChatHistory } from '../hooks/useChatHistory';
import { useModelManagement } from '../hooks/useModelManagement';
import { useProviderConfig } from '../hooks/useProviderConfig';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { usePageInteraction } from '../hooks/usePageInteraction';
import { useTextHighlighting } from '../hooks/useTextHighlighting';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useTheme } from '../hooks/useTheme';

// 导入组件
import { SettingsPanel, MessageList, ModelSelector, InputPanel } from "./index";
import ChatHeader from './ChatHeader';
import ChatBody from './ChatBody';
import ChatFooter from './ChatFooter';

function ChatApp() {
  // ======================================
  // 1. 状态管理与Hooks
  // ======================================
  // 使用主题hook
  const { themeMode, setThemeMode, isDark, colors } = useTheme();

  // 使用全局样式hook（传入主题颜色）
  useGlobalStyles(colors);

  // 组件内部状态
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasArticle, setHasArticle] = useState<boolean | null>(null);

  // 计算搜索匹配数量
  const matchCount = searchTerm.trim()
    ? messages.filter(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase())).length
    : 0;

  // 外部hooks
  const { t, i18n, languages, selectedLanguage, saveLanguage } = useLanguageManagement();
  const { currentPageUrl } = usePageInteraction([]);
  const { messages, setMessages, input, setInput, clearChatHistory } = useChatHistory(currentPageUrl);
  const { selectedProvider, setSelectedProvider, apiKey, setApiKey, apiEndpoint, setApiEndpoint, apiKeyInput, setApiKeyInput, apiEndpointInput, setApiEndpointInput, handleProviderChange, saveSettings: saveProviderSettings } = useProviderConfig();
  const { models, selectedModel, setSelectedModel, modelSearchTerm, setModelSearchTerm, showModelList, setShowModelList, fetchingModels, saveSelectedModel, fetchModels } = useModelManagement(apiKey, apiEndpoint, selectedProvider);
  const { highlightMap, setHighlightMap, scrollToOriginalText, relinkPageElements } = useTextHighlighting(messages);

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

  // 当聊天记录加载时重新标记页面元素
  useEffect(() => {
    if (messages.length > 0) {
      // 延迟执行，确保页面已经加载完成
      const timer = setTimeout(() => {
        relinkPageElements();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, relinkPageElements]);

  // 检测页面是否有文章内容
  useEffect(() => {
    const checkArticle = async () => {
      try {
        const pageContext = await getPageContext();
        setHasArticle(pageContext.hasArticle);
      } catch (error) {
        console.error('Error checking article:', error);
        setHasArticle(false);
      }
    };

    checkArticle();
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
    console.log('handleSendMessage called', { input, selectedModel, modelSearchTerm });
    if (modelSearchTerm.trim() && modelSearchTerm.trim() !== selectedModel) {
      saveSelectedModel(modelSearchTerm.trim());
    }
    sendMessage(input, messages, setMessages, selectedModel, selectedLanguage, highlightMap, setLoading, setHighlightMap);
    setInput("");
  }, [modelSearchTerm, selectedModel, saveSelectedModel, input, messages, setMessages, selectedLanguage, highlightMap, setLoading, setInput, setHighlightMap]);

  // 处理停止生成
  const handleStopGeneration = useCallback(() => {
    stopGeneration();
    setLoading(false);
    // 标记最后一条消息为已完成
    setMessages((prevMessages: Message[]) => {
      if (prevMessages.length > 0) {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.type === 'assistant' && lastMessage.isGenerating) {
          return [
            ...prevMessages.slice(0, -1),
            { ...lastMessage, isGenerating: false }
          ];
        }
      }
      return prevMessages;
    });
  }, [setLoading, setMessages]);

  // 处理复制消息
  const handleCopyMessage = useCallback(async (content: string) => {
    await copyMessageToClipboard(content);
  }, []);

  // 处理编辑消息
  const handleEditMessage = useCallback(async (index: number, newContent: string) => {
    await editAndResendMessage(
      index,
      newContent,
      messages,
      setMessages,
      selectedModel,
      selectedLanguage,
      highlightMap,
      setLoading,
      setHighlightMap
    );
  }, [messages, setMessages, selectedModel, selectedLanguage, highlightMap, setLoading, setHighlightMap]);

  // 处理重新生成
  const handleRegenerateMessage = useCallback(async (index: number) => {
    await regenerateMessage(
      index,
      messages,
      setMessages,
      selectedModel,
      selectedLanguage,
      highlightMap,
      setLoading,
      setHighlightMap
    );
  }, [messages, setMessages, selectedModel, selectedLanguage, highlightMap, setLoading, setHighlightMap]);

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
        colors={colors}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
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
        margin: 0,
        backgroundColor: colors.bgPrimary,
        transition: 'background-color 0.2s',
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
          colors={colors}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
        />
      ) : (
        <>
          {/* 聊天头部 */}
          <ChatHeader
            showSettings={showSettings}
            setShowSettings={setShowSettings}
            clearChatHistory={clearChatHistory}
            t={t}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            matchCount={matchCount}
            colors={colors}
          />

          {/* 消息列表 */}
          <ChatBody
            messages={messages}
            loading={loading}
            t={t}
            searchTerm={searchTerm}
            onCopy={handleCopyMessage}
            onEdit={handleEditMessage}
            onRegenerate={handleRegenerateMessage}
            onStopGeneration={handleStopGeneration}
            colors={colors}
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
            colors={colors}
            hasArticle={hasArticle}
          />
        </>
      )}
    </div>
  );
}

export default ChatApp;
