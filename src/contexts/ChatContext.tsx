import React, { createContext, useContext, type ReactNode, useRef, useCallback, useEffect } from 'react';
import type { Message } from '../types';
import { sendToBackground, setupPortListeners, stopGeneration } from '../utils/backgroundComm';
import { copyMessageToClipboard, updateMessagesAndSession, buildMessages } from '../utils/messageUtils';
import { ensureSystemPrompt } from '../utils/pageContent';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { useChatSession } from '../hooks/useChatSession';

interface ChatContextValue {
  // Core state
  //tabId: number | null;
  messages: Message[];
  lastMessage: Message | null;
  isLoading: boolean;
  currentPageUrl: string;
  selectedModel: string;

  // Action methods
  setLastMessage: (message: Message | null) => void;
  sendMessage: (content: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  regenerateMessage: (messageId: string) => void;
  stopGeneration: () => void;
  clearMessages: () => void;

  // System prompt management
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export const useChat = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

import { useModel } from './ModelContext';

interface ChatProviderProps {
  children: ReactNode;
  initialPageUrl?: string;
  initialTabId?: number;
  updateSessionIndex?: (url: string, messages: Message[], pageTitle?: string) => void;
  currentPageTitle?: string;
  isActive?: boolean;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({children, currentPageTitle, initialPageUrl, initialTabId, isActive = true}) => {
  const {currentUrl: detectedUrl, currentPageTitle: fetchedPageTitle, currentTabId: detectedTabId} = usePageInteraction();
  
  // Use initialPageUrl if provided (for multi-session mode), otherwise fallback to detected URL
  const currentUrl = initialPageUrl || detectedUrl;
  
  // Use initialTabId if provided, otherwise fallback to detected Tab ID
  const currentTabId = initialTabId || detectedTabId;

  // Prioritize passed prop over fetched title to avoid shadowing
  // If we are in multi-session mode (initialPageUrl provided), we only use fetchedPageTitle if it matches our URL
  const isUrlMatch = !initialPageUrl || initialPageUrl === detectedUrl;
  const pageTitle = currentPageTitle || (isUrlMatch ? fetchedPageTitle : '');

  // Use chat history hook for message management
  const {
    messages,
    setMessages,
    lastMessage,
    setLastMessage,
    clearChatHistory,
    isLoading,
    setIsLoading,
    isUrlSynced,
    getSystemPrompt,
    setSystemPrompt
  } = useChatSession(currentUrl);

  const { loadChatHistory, saveChatHistory } = useChatHistories();

  // References
  const generatingRef = useRef(false);
  const currentPortRef = useRef<Browser.runtime.Port | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  // Other hooks
  const { selectedLanguage, t } = useLanguageManagement();
  const { selectedModel } = useModel();

  const { relinkPageElements } = useTextHighlighting(isActive);

  const cleanupCurrentPort = useCallback(() => {
    if (currentPortRef.current) {
      try {
        currentPortRef.current.disconnect();
      } catch (e) {
        // Ignore error
      }
      currentPortRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanupCurrentPort();
    };
  }, [cleanupCurrentPort]);

  useEffect(() => {
    const onTabUpdated = (tabId: number, changeInfo: any, tab: any) => {
      // Only check if URL matches current session if initialPageUrl is set
      // Otherwise we rely on the component being unmounted/remounted or currentUrl updating
      if (initialPageUrl && tab.url !== initialPageUrl) return;

      if (changeInfo.status === 'complete' && tab.active) {
        relinkPageElements(tabId);
      }
    };

    const onTabActivated = async (activeInfo: any) => {
        if (!isActive) return;
        try {
            const tab = await browser.tabs.get(activeInfo.tabId);
            if (tab.url === currentUrl) {
                relinkPageElements(activeInfo.tabId);
            }
        } catch (e) {
            console.error("Error handling tab activation:", e);
        }
    };

    if (browser.tabs) {
      if (browser.tabs.onUpdated) browser.tabs.onUpdated.addListener(onTabUpdated);
      if (browser.tabs.onActivated) browser.tabs.onActivated.addListener(onTabActivated);
      return () => {
        if (browser.tabs.onUpdated) browser.tabs.onUpdated.removeListener(onTabUpdated);
        if (browser.tabs.onActivated) browser.tabs.onActivated.removeListener(onTabActivated);
      };
    }
  }, [relinkPageElements, initialPageUrl, isActive, currentUrl]);

  // Ensure system prompt exists when messages change
  useEffect(() => {
    const checkSystemPrompt = async () => {
      if (!messages.length && currentTabId && currentUrl) {
        try {
          await ensureSystemPrompt(currentTabId, currentUrl, setSystemPrompt, selectedLanguage);
        } catch (e) {
          console.error('Failed to ensure system prompt:', e);
        }
      }
    };

    checkSystemPrompt();
  }, [messages.length, setSystemPrompt, selectedLanguage, currentTabId, currentUrl]);

  useEffect(() => {
    if (!isLoading && lastMessage) {
      setMessages([...messages, lastMessage]);

      setLastMessage(null);
      saveChatHistory(currentUrl, pageTitle, [...messages, lastMessage]);
      //TODO setSessions
    }
  }, [isLoading, lastMessage, messages, setMessages, currentUrl, pageTitle, saveChatHistory, setLastMessage]);

  // Send message
  const handleSendMessage = useCallback((content: string) => {
    // Prevent duplicate submissions
    if (!content.trim() || isLoading || generatingRef.current) return;

    // Mark as generating to prevent duplicates
    generatingRef.current = true;

    // Build messages
    const messagesForAI = buildMessages(content, messages);

    // First add user message to the messages list
    //const updatedMessages = [...messages, newUserMessage];
    setMessages(messagesForAI);

    // Set loading state
    setIsLoading(true);

    // Cleanup previous port
    cleanupCurrentPort();
    const requestId = ++requestIdRef.current;

    try {
      // Send message to background with the correct messages for AI
      const port = sendToBackground(messagesForAI, selectedModel);
      currentPortRef.current = port;

      setupPortListeners(
        port, 
        (val) => {
          if (mountedRef.current && requestId === requestIdRef.current) {
            setLastMessage(val);
          }
        },
        () => {
          if (mountedRef.current && requestId === requestIdRef.current) {
            setIsLoading(false);
            generatingRef.current = false;
          }
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      generatingRef.current = false;
    }
  }, [selectedModel, messages, setMessages, setLastMessage, isLoading, setIsLoading, cleanupCurrentPort]);


  // Edit message
  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (generatingRef.current || isLoading) return;
    generatingRef.current = true;

    try {
      const index = messages.findIndex(msg => msg.id === messageId);
      if (index < 0 || messages[index].role !== 'user') {
        generatingRef.current = false;
        return;
      }

      const updatedUserMessage = { ...messages[index], content: newContent };
      const newMessages = [...messages.slice(0, index), updatedUserMessage];

      setMessages(newMessages);
      setIsLoading(true);

      // Cleanup previous port
      cleanupCurrentPort();
      const requestId = ++requestIdRef.current;

      const port = sendToBackground(newMessages, selectedModel);
      currentPortRef.current = port;

      setupPortListeners(
        port, 
        (val) => {
          if (mountedRef.current && requestId === requestIdRef.current) {
            setLastMessage(val);
          }
        },
        () => {
          if (mountedRef.current && requestId === requestIdRef.current) {
            setIsLoading(false);
            generatingRef.current = false;
          }
        }
      );
    } catch (error) {
      console.error('Failed to edit message:', error);
      setIsLoading(false);
      generatingRef.current = false;
    }
  }, [selectedModel, messages, setMessages, setLastMessage, isLoading, setIsLoading, cleanupCurrentPort]);

  // Regenerate message
  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    if (generatingRef.current || isLoading) return;
    generatingRef.current = true;

    const index = messages.findIndex(msg => msg.id === messageId);
    if (index <= 0 || messages[index].role !== 'assistant') return;

    try {
      const newMessages = messages.slice(0, index);
      setMessages(newMessages);
      setIsLoading(true);

      // Cleanup previous port
      cleanupCurrentPort();
      const requestId = ++requestIdRef.current;

      const port = sendToBackground(newMessages, selectedModel);
      currentPortRef.current = port;

      setupPortListeners(
        port, 
        (val) => {
          if (mountedRef.current && requestId === requestIdRef.current) {
            setLastMessage(val);
          }
        },
        () => {
          if (mountedRef.current && requestId === requestIdRef.current) {
            setIsLoading(false);
            generatingRef.current = false;
          }
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setIsLoading(false);
      generatingRef.current = false;
    }
  }, [selectedModel, messages, setMessages, setLastMessage, isLoading, setIsLoading, cleanupCurrentPort]);

  // Stop generation
  const handleStopGeneration = useCallback(() => {
    stopGeneration(currentPortRef.current, () => {
      setIsLoading(false);
    });
    generatingRef.current = false;
  }, [setIsLoading]);

  // Clear messages
  const handleClearMessages = useCallback(async () => {
    await clearChatHistory();
  }, [clearChatHistory]);

  // Copy message
  // const handleCopyMessage = useCallback(async (content: string) => {
  //   await copyMessageToClipboard(content);
  // }, []);

  // Provide context value
  const contextValue: ChatContextValue = {
    //tabId,
    messages,
    lastMessage,
    isLoading,
    currentPageUrl: currentUrl,
    //currentPageTitle,
    selectedModel: selectedModel,
    setLastMessage,
    sendMessage: handleSendMessage,
    editMessage: handleEditMessage,
    regenerateMessage: handleRegenerateMessage,
    stopGeneration: handleStopGeneration,
    clearMessages: handleClearMessages,
    // copyMessage: handleCopyMessage,
    systemPrompt: getSystemPrompt(),
    setSystemPrompt
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};