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
    // Remove ref tags before copying to clipboard
    let cleanedContent = content;
    
    // Remove reference ranges like [REF1]-[REF5]
    const separateRangePattern = /\[(REF(\d+))\]-\[(REF(\d+))\]/g;
    cleanedContent = cleanedContent.replace(separateRangePattern, '');
    
    // Remove combined references like [REF1,REF2,REF3-REF5]
    const refPattern = /\[(REF[\d,REF\s-]+)\]/g;
    cleanedContent = cleanedContent.replace(refPattern, '');
    
    await navigator.clipboard.writeText(cleanedContent);
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
