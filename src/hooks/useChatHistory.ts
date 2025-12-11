import { useState, useEffect } from 'react';
import * as browser from "webextension-polyfill";
import type { Message } from '../types/index';

export const useChatHistory = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');

  // 加载聊天历史
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const savedHistory = await browser.storage.local.get('chatHistory');
      if (savedHistory.chatHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory.chatHistory as string);
            setMessages(parsedHistory);
          } catch (parseError) {
            console.error('Error parsing chat history:', parseError);
            // 如果解析失败，清除损坏的历史记录
            clearChatHistory();
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, []);

  // 保存聊天历史
  useEffect(() => {
    const saveChatHistory = async () => {
      try {
        const serializableMessages = messages.map(msg => ({
          ...msg,
          references: msg.references?.map(ref => ({
            ...ref,
            htmlElement: undefined // 移除DOM元素引用
          }))
        }));
        await browser.storage.local.set({
          chatHistory: JSON.stringify(serializableMessages)
        });
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    };

    if (messages.length > 0) {
      saveChatHistory();
    }
  }, [messages]);

  const clearChatHistory = async () => {
    try {
      setMessages([]);
      await browser.storage.local.remove('chatHistory');
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
