import { useState, useEffect, useCallback } from 'react';
import type { Message, ChatSession } from '../types/index';
import { getPageHash, getUrlDisplayTitle } from '../utils/commonUtils';
import { db } from '../db';

export const useChatHistories = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const allSessions = await db.chatSessions.orderBy('lastActive').reverse().toArray();
      const formattedSessions: ChatSession[] = allSessions.map(s => ({
        ...s,
        messageCount: s.messages.length,
        lastMessage: s.messages.length > 0 ? s.messages[s.messages.length - 1].content : undefined
      }));
      setSessions(formattedSessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load all session indices
  const loadChatHistory = useCallback(async (pageUrl: string): Promise<Message[]> => {
    try {
      const session = await db.chatSessions.get(pageUrl);
      return session?.messages || [];
    } catch (error) {
      console.error('Error loading chat history:', error);
      return [];
    }
  }, []);

  // Save session indices
  const saveChatHistory = useCallback(async (pageUrl: string, title: string, messages: Message[], ) => {
    try {
      
      await db.chatSessions.put({
        url: pageUrl,
        title: title,
        messages,
        lastActive: Date.now()
      });
      
      loadSessions();
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, [loadSessions]);

  // Delete session (chat data and indices)
  const deleteHistory = useCallback(async (url: string) => {
    try {
      await db.chatSessions.delete(url);
      loadSessions();
    } catch (error) {
      console.error('Error deleting history:', error);
    }
  }, [loadSessions]);

  // Get chat history for specified URL
  const getSessionMessages = useCallback(async (url: string): Promise<Message[]> => {
    try {
      const session = await db.chatSessions.get(url);
      return session?.messages || [];
    } catch (error) {
      console.error('Error getting session messages:', error);
      return [];
    }
  }, []);

  // Clear all history
  const clearAllSessions = useCallback(async () => {
    try {
      await db.chatSessions.clear();
      setSessions([]);
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  }, []);

  return {
    sessions,
    loading,
    loadChatHistory,
    saveChatHistory,
    deleteHistory,
    getSessionMessages,
    clearAllSessions,
    getPageHash
  };
};