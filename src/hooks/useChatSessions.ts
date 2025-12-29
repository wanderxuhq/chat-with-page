import { useState, useEffect, useCallback } from 'react';
import * as browser from "webextension-polyfill";
import type { Message } from '../types/index';

// Generate hash for page URL
const getPageHash = (url: string): string => {
  return `page_${url.split('://').join('_').split('.').join('_').split('/').join('_').split('?').join('_').split('&').join('_').split('#').join('_')}`;
};

// Get display title for URL (domain + path)
const getUrlDisplayTitle = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname === '/' ? '' : urlObj.pathname;
    return `${urlObj.hostname}${path}`.substring(0, 50);
  } catch {
    return url.substring(0, 50);
  }
};

export interface ChatSession {
  url: string;
  urlHash: string;
  title: string;
  lastActive: number;
  messageCount: number;
  lastMessage?: string;
}

export interface ChatHistoryData {
  messages: Message[];
  lastActive: number;
}

const SESSIONS_INDEX_KEY = 'chat_sessions_index';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all session indices
  const loadSessionsIndex = useCallback(async () => {
    try {
      setLoading(true);
      const result = await browser.storage.local.get(SESSIONS_INDEX_KEY);
      if (result[SESSIONS_INDEX_KEY]) {
        const savedSessions = JSON.parse(result[SESSIONS_INDEX_KEY] as string) as ChatSession[];
        // Sort by last active time
        savedSessions.sort((a, b) => b.lastActive - a.lastActive);
        setSessions(savedSessions);
      }
    } catch (error) {
      console.error('Error loading sessions index:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save session indices
  const saveSessionsIndex = useCallback(async (newSessions: ChatSession[]) => {
    try {
      await browser.storage.local.set({
        [SESSIONS_INDEX_KEY]: JSON.stringify(newSessions)
      });
    } catch (error) {
      console.error('Error saving sessions index:', error);
    }
  }, []);

  // Update or add session to indices
  const updateSessionIndex = useCallback(async (url: string, messages: Message[]) => {
    if (!url || messages.length === 0) return;

    const urlHash = getPageHash(url);
    const lastMessage = messages[messages.length - 1];

    const newSession: ChatSession = {
      url,
      urlHash,
      title: getUrlDisplayTitle(url),
      lastActive: Date.now(),
      messageCount: messages.length,
      lastMessage: lastMessage?.content?.substring(0, 100)
    };

    setSessions(prev => {
      const existingIndex = prev.findIndex(s => s.urlHash === urlHash);
      let newSessions: ChatSession[];

      if (existingIndex >= 0) {
        // Update existing session
        newSessions = [...prev];
        newSessions[existingIndex] = newSession;
      } else {
        // Add new session
        newSessions = [newSession, ...prev];
      }

      // Sort by last active time
      newSessions.sort((a, b) => b.lastActive - a.lastActive);

      // Save to storage
      saveSessionsIndex(newSessions);

      return newSessions;
    });
  }, [saveSessionsIndex]);

  // Remove session from indices
  const removeSessionFromIndex = useCallback(async (urlHash: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.urlHash !== urlHash);
      saveSessionsIndex(newSessions);
      return newSessions;
    });
  }, [saveSessionsIndex]);

  // Delete session (chat data and indices)
  const deleteSession = useCallback(async (urlHash: string) => {
    try {
      // Delete chat data
      await browser.storage.local.remove(urlHash);
      // Remove from indices
      await removeSessionFromIndex(urlHash);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [removeSessionFromIndex]);

  // Get chat history for specified URL
  const getSessionMessages = useCallback(async (urlHash: string): Promise<Message[]> => {
    try {
      const result = await browser.storage.local.get(urlHash);
      if (result[urlHash]) {
        const historyData = JSON.parse(result[urlHash] as string) as ChatHistoryData;
        return historyData.messages || [];
      }
    } catch (error) {
      console.error('Error getting session messages:', error);
    }
    return [];
  }, []);

  // Clear all history
  const clearAllSessions = useCallback(async () => {
    try {
      // Delete all session data
      for (const session of sessions) {
        await browser.storage.local.remove(session.urlHash);
      }
      // Clear indices
      await browser.storage.local.remove(SESSIONS_INDEX_KEY);
      setSessions([]);
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  }, [sessions]);

  // Initial load
  useEffect(() => {
    loadSessionsIndex();
  }, [loadSessionsIndex]);

  return {
    sessions,
    loading,
    updateSessionIndex,
    deleteSession,
    getSessionMessages,
    clearAllSessions,
    loadSessionsIndex,
    getPageHash
  };
};
