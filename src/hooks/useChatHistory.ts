import { useState, useEffect, useRef } from 'react';
import * as browser from "webextension-polyfill";
import type { Message } from '../types/index';

// Generate a hash for the page URL to avoid special characters in storage keys
const getPageHash = (url: string): string => {
  return `page_${url.split('://').join('_').split('.').join('_').split('/').join('_').split('?').join('_').split('&').join('_').split('#').join('_')}`;
};

export interface ChatHistoryData {
  messages: Message[];
  lastActive: number;
}

export const useChatHistory = (currentPageUrl: string = '') => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [currentUrl, setCurrentUrl] = useState<string>(currentPageUrl);
  const [isUrlSynced, setIsUrlSynced] = useState<boolean>(true); // Track if messages are synced with current URL
  const previousUrlRef = useRef<string>('');
  const isLoadingRef = useRef<boolean>(false);

  // Update the current URL and clear messages immediately when URL changes
  useEffect(() => {
    if (currentPageUrl && currentPageUrl !== previousUrlRef.current) {
      // URL changed, mark as not synced and clear messages first
      if (previousUrlRef.current) {
        setIsUrlSynced(false);
        setMessages([]);
      }
      previousUrlRef.current = currentPageUrl;
      setCurrentUrl(currentPageUrl);
    }
  }, [currentPageUrl]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!currentUrl) return;

      isLoadingRef.current = true;
      setIsUrlSynced(false);

      try {
        const pageHash = getPageHash(currentUrl);
        const savedHistory = await browser.storage.local.get(pageHash);

        if (savedHistory[pageHash]) {
          try {
            const parsedHistory = JSON.parse(savedHistory[pageHash] as string) as ChatHistoryData;
            // Ensure messages is an array
            if (Array.isArray(parsedHistory.messages)) {
              setMessages(parsedHistory.messages);
            } else {
              console.error('Error parsing chat history: messages is not an array');
              setMessages([]);
            }
          } catch (parseError) {
            console.error('Error parsing chat history:', parseError);
            // Clear corrupted history if parsing fails
            setMessages([]);
          }
        } else {
          // Ensure messages are empty if current page has no chat history
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setMessages([]);
      } finally {
        isLoadingRef.current = false;
        setIsUrlSynced(true);
      }
    };

    loadChatHistory();
  }, [currentUrl]);

  // Save chat history
  useEffect(() => {
    const saveChatHistory = async () => {
      // Don't save during loading
      if (!currentUrl || isLoadingRef.current) return;

      try {
        const serializableMessages = messages.map(msg => ({
          ...msg,
          references: msg.references?.map(ref => ({
            ...ref,
            htmlElement: undefined // Remove DOM element reference
          }))
        }));

        const pageHash = getPageHash(currentUrl);
        const historyData: ChatHistoryData = {
          messages: serializableMessages,
          lastActive: Date.now()
        };

        await browser.storage.local.set({
          [pageHash]: JSON.stringify(historyData)
        });
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    };

    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages, currentUrl]);

  const clearChatHistory = async () => {
    if (!currentUrl) return;
    
    try {
      setMessages([]);
      const pageHash = getPageHash(currentUrl);
      await browser.storage.local.remove(pageHash);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    clearChatHistory,
    addMessage,
    isUrlSynced
  };
};
