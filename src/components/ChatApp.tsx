import React, { useState, useEffect, useCallback } from "react"
import type { Message } from '../types/index';
import { sendMessage, summarizePage, stopGeneration, regenerateMessage, editAndResendMessage, copyMessageToClipboard, getPageContext } from '../utils/chatUtils';

// Import hooks
import { useChatHistory } from '../hooks/useChatHistory';
import { useModelManagement } from '../hooks/useModelManagement';
import { useProviderConfig } from '../hooks/useProviderConfig';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { usePageInteraction } from '../hooks/usePageInteraction';
import { useTextHighlighting } from '../hooks/useTextHighlighting';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useTheme } from '../hooks/useTheme';
import { useChatSessions } from '../hooks/useChatSessions';

// Import components
import { SettingsPanel, MessageList, ModelSelector, InputPanel } from "./index";
import ChatHeader from './ChatHeader';
import ChatBody from './ChatBody';
import ChatFooter from './ChatFooter';
import ChatHistoryList from './ChatHistoryList';

function ChatApp() {
  // ======================================
  // 1. State Management and Hooks
  // ======================================
  // Use theme hook
  const { themeMode, setThemeMode, isDark, colors } = useTheme();

  // Use global styles hook (pass theme colors)
  useGlobalStyles(colors);

  // Component internal state
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasArticle, setHasArticle] = useState<boolean | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Chat session management
  const {
    sessions,
    updateSessionIndex,
    deleteSession,
    getSessionMessages,
    getPageHash
  } = useChatSessions();

  // Tab change handling
  const handleTabChange = useCallback((newUrl: string, oldUrl: string) => {
    console.log('Tab changed from', oldUrl, 'to', newUrl);
    // When tab changes, useChatHistory automatically loads corresponding chat history based on currentPageUrl
  }, []);

  // External hooks - Note: usePageInteraction now accepts onTabChange callback
  const { t, i18n, languages, selectedLanguage, saveLanguage } = useLanguageManagement();
  const { currentPageUrl } = usePageInteraction([], handleTabChange);
  const { messages, setMessages, input, setInput, clearChatHistory } = useChatHistory(currentPageUrl);
  const { selectedProvider, setSelectedProvider, apiKey, setApiKey, apiEndpoint, setApiEndpoint, apiKeyInput, setApiKeyInput, apiEndpointInput, setApiEndpointInput, handleProviderChange, saveSettings: saveProviderSettings } = useProviderConfig();
  const { models, selectedModel, setSelectedModel, modelSearchTerm, setModelSearchTerm, showModelList, setShowModelList, fetchingModels, saveSelectedModel, fetchModels } = useModelManagement(apiKey, apiEndpoint, selectedProvider);
  const { highlightMap, setHighlightMap, scrollToOriginalText, relinkPageElements } = useTextHighlighting(messages);

  // Calculate search match count
  const matchCount = searchTerm.trim()
    ? messages.filter(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase())).length
    : 0;

  // Current URL hash
  const currentUrlHash = currentPageUrl ? getPageHash(currentPageUrl) : '';

  // ======================================
  // 2. Constant Definitions
  // ======================================
  // Mainstream AI provider preset configurations
  const aiProviders = [
    { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
    { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1" },
    { id: "google", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
    { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
    { id: "ollama", name: "Ollama", baseUrl: "http://localhost:11434/v1/" },
    { id: "custom", name: "Custom", baseUrl: "" }
  ];

  // ======================================
  // 3. Side Effects Handling
  // ======================================
  // Fetch model list when apiKey, apiEndpoint, or selectedProvider changes
  useEffect(() => {
    if (apiKey && apiEndpoint) {
      fetchModels();
    }
  }, [apiKey, apiEndpoint, selectedProvider, fetchModels]);

  // Update modelSearchTerm when selectedModel changes
  useEffect(() => {
    setModelSearchTerm(selectedModel);
  }, [selectedModel]);

  // Relabel page elements when chat history loads
  useEffect(() => {
    if (messages.length > 0) {
      // Delay execution to ensure page is loaded
      const timer = setTimeout(() => {
        relinkPageElements();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, relinkPageElements]);

  // Detect if page has article content
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

  // Update session index when messages change
  useEffect(() => {
    if (currentPageUrl && messages.length > 0) {
      updateSessionIndex(currentPageUrl, messages);
    }
  }, [messages, currentPageUrl, updateSessionIndex]);

  // ======================================
  // 4. Event Handling Functions (optimized with useCallback)
  // ======================================
  // Handle selecting historical session
  const handleSelectSession = useCallback(async (session: { url: string; urlHash: string }) => {
    // Open selected URL in new tab, which will automatically trigger tab change and load corresponding chat history
    try {
      await chrome.tabs.create({ url: session.url, active: true });
      setShowHistory(false);
    } catch (error) {
      console.error('Error opening session URL:', error);
    }
  }, []);

  // Handle deleting session
  const handleDeleteSession = useCallback(async (urlHash: string) => {
    await deleteSession(urlHash);
  }, [deleteSession]);

  // Save settings
  const saveSettings = useCallback(async () => {
    try {
      // Save provider configuration
      await saveProviderSettings(selectedLanguage);

      // Save language settings
      await saveLanguage(selectedLanguage);

      setShowSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [saveProviderSettings, selectedLanguage, saveLanguage, setShowSettings]);

  // Handle page summary
  const handleSummarizePage = useCallback(async () => {
    await summarizePage(setLoading, setMessages, selectedModel, selectedLanguage, messages, setHighlightMap);
  }, [setLoading, setMessages, selectedModel, selectedLanguage, messages, setHighlightMap, summarizePage]);

  // Handle message sending
  const handleSendMessage = useCallback(() => {
    console.log('handleSendMessage called', { input, selectedModel, modelSearchTerm });
    if (modelSearchTerm.trim() && modelSearchTerm.trim() !== selectedModel) {
      saveSelectedModel(modelSearchTerm.trim());
    }
    sendMessage(input, messages, setMessages, selectedModel, selectedLanguage, highlightMap, setLoading, setHighlightMap);
    setInput("");
  }, [modelSearchTerm, selectedModel, saveSelectedModel, input, messages, setMessages, selectedLanguage, highlightMap, setLoading, setInput, setHighlightMap]);

  // Handle stop generation
  const handleStopGeneration = useCallback(() => {
    stopGeneration();
    setLoading(false);
    // Mark last message as completed
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

  // Handle copy message
  const handleCopyMessage = useCallback(async (content: string) => {
    await copyMessageToClipboard(content);
  }, []);

  // Handle edit message
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

  // Handle regenerate
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
      {/* Settings button */}
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
          {/* Chat header */}
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
            showHistory={showHistory}
            setShowHistory={setShowHistory}
            hasHistory={sessions.length > 0}
          />

          {/* Message list */}
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

          {/* Chat footer */}
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

          {/* Chat history popup */}
          {showHistory && (
            <ChatHistoryList
              sessions={sessions}
              currentUrlHash={currentUrlHash}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onClose={() => setShowHistory(false)}
              t={t}
              colors={colors}
            />
          )}
        </>
      )}
    </div>
  );
}

export default ChatApp;
