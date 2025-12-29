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
import { useHostPermission } from '../hooks/useHostPermission';

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
  const { themeMode, setThemeMode, colors } = useTheme();

  // Use global styles hook (pass theme colors)
  useGlobalStyles(colors);

  // Component internal state
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasArticle, setHasArticle] = useState<boolean | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [needsModelSelection, setNeedsModelSelection] = useState(false);

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
    // When tab changes, useChatHistory automatically loads corresponding chat history based on currentPageUrl
  }, []);

  // External hooks - Note: usePageInteraction now accepts onTabChange callback
  const { t, i18n, languages, selectedLanguage, saveLanguage } = useLanguageManagement();
  const { hasPermission, isRequesting, requestPermission } = useHostPermission();
  const { currentPageUrl, currentPageTitle } = usePageInteraction([], handleTabChange);
  const { messages, setMessages, input, setInput, clearChatHistory, isUrlSynced } = useChatHistory(currentPageUrl);
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
    // Only update session index when:
    // 1. We have a valid URL
    // 2. There are messages to save
    // 3. Messages are synced with the current URL (not from a previous tab)
    if (currentPageUrl && messages.length > 0 && isUrlSynced) {
      // Use a small delay to ensure state is stable after tab switch
      const timer = setTimeout(() => {
        updateSessionIndex(currentPageUrl, messages, currentPageTitle);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, currentPageUrl, currentPageTitle, updateSessionIndex, isUrlSynced]);

  // ======================================
  // 4. Event Handling Functions (optimized with useCallback)
  // ======================================
  // Handle selecting historical session
  const handleSelectSession = useCallback(async (session: { url: string; urlHash: string }) => {
    try {
      // First, try to find an existing tab with the same URL
      const tabs = await chrome.tabs.query({});
      const existingTab = tabs.find(tab => tab.url === session.url);

      if (existingTab && existingTab.id) {
        // Found existing tab, switch to it
        await chrome.tabs.update(existingTab.id, { active: true });
        // Also switch to the window containing this tab
        if (existingTab.windowId) {
          await chrome.windows.update(existingTab.windowId, { focused: true });
        }
      } else {
        // No existing tab found, open in new tab
        await chrome.tabs.create({ url: session.url, active: true });
      }
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
    await summarizePage(setLoading, setMessages, selectedModel, selectedLanguage, messages, setHighlightMap, () => {
      setNeedsModelSelection(true);
      // Reset after a delay
      setTimeout(() => setNeedsModelSelection(false), 100);
    });
  }, [setLoading, setMessages, selectedModel, selectedLanguage, messages, setHighlightMap, summarizePage]);

  // Handle message sending
  const handleSendMessage = useCallback(() => {
    if (modelSearchTerm.trim() && modelSearchTerm.trim() !== selectedModel) {
      saveSelectedModel(modelSearchTerm.trim());
    }
    sendMessage(input, messages, setMessages, selectedModel, selectedLanguage, highlightMap, setLoading, setHighlightMap, () => {
      setNeedsModelSelection(true);
      // Reset after a delay
      setTimeout(() => setNeedsModelSelection(false), 100);
    });
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

  // Show permission request UI first (before API key setup)
  if (hasPermission === false) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          padding: 24,
          backgroundColor: colors.bgPrimary,
          boxSizing: "border-box",
        }}
      >
        <div style={{ width: "100%", maxWidth: 340 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                boxShadow: "0 6px 20px rgba(59, 130, 246, 0.3)",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h1 style={{ color: colors.textPrimary, fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>
              {t('permission.title')}
            </h1>
            <p style={{ color: colors.textSecondary, fontSize: 13, margin: 0 }}>
              {t('permission.subtitle')}
            </p>
          </div>

          {/* Features */}
          <div
            style={{
              backgroundColor: colors.bgSecondary,
              borderRadius: 10,
              padding: 16,
              marginBottom: 12,
              border: `1px solid ${colors.borderSecondary}`,
            }}
          >
            <p style={{ color: colors.textSecondary, fontSize: 12, margin: "0 0 12px" }}>
              {t('permission.description')}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                t('permission.features.read'),
                t('permission.features.analyze'),
                t('permission.features.chat'),
              ].map((text, index) => (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ color: colors.textPrimary, fontSize: 12 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: 10,
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <p style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 1.4, margin: 0 }}>
              {t('permission.privacy')}
            </p>
          </div>

          {/* Button */}
          <button
            onClick={requestPermission}
            disabled={isRequesting}
            style={{
              width: "100%",
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: isRequesting ? colors.textSecondary : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              border: "none",
              borderRadius: 8,
              cursor: isRequesting ? "not-allowed" : "pointer",
              boxShadow: isRequesting ? "none" : "0 3px 12px rgba(59, 130, 246, 0.4)",
            }}
          >
            {isRequesting ? t('permission.requesting') : t('permission.grant')}
          </button>
        </div>
      </div>
    );
  }

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
            needsModelSelection={needsModelSelection}
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
