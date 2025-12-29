import { useState, useEffect, useCallback } from 'react';
import * as browser from "webextension-polyfill";
import type { Message } from '../types/index';

// 生成页面URL的哈希值
const getPageHash = (url: string): string => {
  return `page_${url.split('://').join('_').split('.').join('_').split('/').join('_').split('?').join('_').split('&').join('_').split('#').join('_')}`;
};

// 获取URL的显示标题（取域名+路径）
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

  // 加载所有会话索引
  const loadSessionsIndex = useCallback(async () => {
    try {
      setLoading(true);
      const result = await browser.storage.local.get(SESSIONS_INDEX_KEY);
      if (result[SESSIONS_INDEX_KEY]) {
        const savedSessions = JSON.parse(result[SESSIONS_INDEX_KEY] as string) as ChatSession[];
        // 按最后活动时间排序
        savedSessions.sort((a, b) => b.lastActive - a.lastActive);
        setSessions(savedSessions);
      }
    } catch (error) {
      console.error('Error loading sessions index:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 保存会话索引
  const saveSessionsIndex = useCallback(async (newSessions: ChatSession[]) => {
    try {
      await browser.storage.local.set({
        [SESSIONS_INDEX_KEY]: JSON.stringify(newSessions)
      });
    } catch (error) {
      console.error('Error saving sessions index:', error);
    }
  }, []);

  // 更新或添加会话到索引
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
        // 更新现有会话
        newSessions = [...prev];
        newSessions[existingIndex] = newSession;
      } else {
        // 添加新会话
        newSessions = [newSession, ...prev];
      }

      // 按最后活动时间排序
      newSessions.sort((a, b) => b.lastActive - a.lastActive);

      // 保存到存储
      saveSessionsIndex(newSessions);

      return newSessions;
    });
  }, [saveSessionsIndex]);

  // 从索引中移除会话
  const removeSessionFromIndex = useCallback(async (urlHash: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.urlHash !== urlHash);
      saveSessionsIndex(newSessions);
      return newSessions;
    });
  }, [saveSessionsIndex]);

  // 删除会话（同时删除聊天数据和索引）
  const deleteSession = useCallback(async (urlHash: string) => {
    try {
      // 删除聊天数据
      await browser.storage.local.remove(urlHash);
      // 从索引中移除
      await removeSessionFromIndex(urlHash);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }, [removeSessionFromIndex]);

  // 获取指定URL的聊天历史
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

  // 清除所有历史记录
  const clearAllSessions = useCallback(async () => {
    try {
      // 删除所有会话数据
      for (const session of sessions) {
        await browser.storage.local.remove(session.urlHash);
      }
      // 清空索引
      await browser.storage.local.remove(SESSIONS_INDEX_KEY);
      setSessions([]);
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  }, [sessions]);

  // 初始加载
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
