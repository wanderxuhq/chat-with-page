import type { Message } from '../types/index';
import React from 'react';

// Generate message ID
export const generateMessageId = (): string => {
  return Date.now().toString() + Math.random().toString(36).substring(2, 11);
};

// Build messages for UI and AI
export const buildMessages = (userContent: string, prevMessages: Message[]) => {
  // Build new messages for UI
  const newUserMessage: Message = { id: generateMessageId(), role: 'user', content: userContent };

  return [
    ...prevMessages,
    newUserMessage
  ];
};

// Copy message to clipboard
export const copyMessageToClipboard = async (content: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    // Silently handle errors
    return false;
  }
};

// Update messages and session index
export const updateMessagesAndSession = (
  newMessages: Message[] | ((prev: Message[]) => Message[]),
  currentMessages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  updateSessionIndex?: (url: string, messages: Message[], title?: string) => void,
  url?: string,
  title?: string
) => {
  setMessages(newMessages);
  if (updateSessionIndex && url) {
    const messagesArray = typeof newMessages === 'function' ? newMessages(currentMessages) : newMessages;
    updateSessionIndex(url, messagesArray, title);
  }
};
