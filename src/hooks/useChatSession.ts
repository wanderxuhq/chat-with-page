import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '../types/index';
import { getPageHash, getUrlDisplayTitle } from '../utils/commonUtils';
import { db } from '../db';
import { withErrorHandling } from '../utils/errorUtils';

export const useChatSession = (currentUrl: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const [input, setInput] = useState<string>('');
  const [isUrlSynced, setIsUrlSynced] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const previousUrlRef = useRef<string>('');
  const isLoadingRef = useRef<boolean>(false);
  const syncedUrlRef = useRef<string>('');
  

  // Update the current URL and clear messages when URL changes
  useEffect(() => {
    if (currentUrl !== previousUrlRef.current) {
      setIsUrlSynced(false);
      syncedUrlRef.current = '';
      if (previousUrlRef.current) setMessages([]);
      previousUrlRef.current = currentUrl;
    }
  }, [currentUrl]);

  // Load chat history
  useEffect(() => {
    let isCurrent = true;

    const loadHistory = async () => {
      if (!currentUrl) {
        return;
      }

      await withErrorHandling(
        async () => {
          const session = await db.chatSessions.get(currentUrl);
          
          if (!isCurrent) return;

          if (session && session.messages) {
             setMessages(session.messages);
          } else {
             setMessages([]);
          }
          
          syncedUrlRef.current = currentUrl;
          setIsUrlSynced(true);
        },
        'Error loading chat history',
        undefined
      );
    };

    loadHistory();

    return () => {
      isCurrent = false;
    };
  }, [currentUrl]);

  // Get system prompt from messages
  const getSystemPrompt = useCallback(() => {
    const systemMessage = messages.find(msg => msg.role === 'system');
    return systemMessage?.content || '';
  }, [messages]);

  // Set system prompt in messages
  const setSystemPrompt = useCallback((prompt: string) => {
    setMessages(prevMessages => {
      const existingSystemIndex = prevMessages.findIndex(msg => msg.role === 'system');
      const systemMessage = {
        id: existingSystemIndex >= 0 ? prevMessages[existingSystemIndex].id : `system-${Date.now()}`,
        role: 'system' as const,
        content: prompt,
        timestamp: Date.now()
      };
      
      return existingSystemIndex >= 0 
        ? prevMessages.map((msg, i) => i === existingSystemIndex ? systemMessage : msg)
        : [systemMessage, ...prevMessages];
    });
  }, []);

  const clearChatHistory = async () => {
    if (!currentUrl) return;

    await withErrorHandling(
      async () => {
        setMessages([]);
        await db.chatSessions.delete(currentUrl);
      },
      'Error clearing chat history',
      undefined
    );
  };

  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    lastMessage,
    setLastMessage,
    clearChatHistory,
    addMessage,
    isUrlSynced,
    isLoading,
    setIsLoading,
    getSystemPrompt,
    setSystemPrompt
  };
};
