import { useState, useEffect } from 'react';
import * as browser from "webextension-polyfill";
import type { Message } from '../types/index';

// 生成页面URL的哈希值，避免存储键包含特殊字符
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

  // 更新当前URL
  useEffect(() => {
    if (currentPageUrl) {
      setCurrentUrl(currentPageUrl);
    }
  }, [currentPageUrl]);

  // 加载聊天历史
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!currentUrl) return;
      
      try {
        const pageHash = getPageHash(currentUrl);
        const savedHistory = await browser.storage.local.get(pageHash);
        
        if (savedHistory[pageHash]) {
          try {
            const parsedHistory = JSON.parse(savedHistory[pageHash] as string) as ChatHistoryData;
            // 确保messages是数组
            if (Array.isArray(parsedHistory.messages)) {
              setMessages(parsedHistory.messages);
            } else {
              console.error('Error parsing chat history: messages is not an array');
              await clearChatHistory();
            }
          } catch (parseError) {
            console.error('Error parsing chat history:', parseError);
            // 如果解析失败，清除损坏的历史记录
            await clearChatHistory();
          }
        } else {
          // 如果当前页面没有聊天记录，清空消息
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [currentUrl]);

  // 保存聊天历史
  useEffect(() => {
    const saveChatHistory = async () => {
      if (!currentUrl) return;
      
      try {
        const serializableMessages = messages.map(msg => ({
          ...msg,
          references: msg.references?.map(ref => ({
            ...ref,
            htmlElement: undefined // 移除DOM元素引用
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
    addMessage
  };
};
