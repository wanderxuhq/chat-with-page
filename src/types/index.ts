// Message role type
export type MessageRole = 'user' | 'assistant' | 'system';

export interface BaseMessage {
  role: MessageRole;
  content: string;
}

export interface Message extends BaseMessage {
  id: string;
}

export interface ChatSession {
  url: string;
  title: string;
  pageTitle?: string;
  lastActive: number;
  messageCount: number;
  lastMessage?: string;
}

export interface AIPortMessage {
  action: 'chat' | 'summarize' | 'stop';
  messages: BaseMessage[];
  model: string;
  language: string;
  systemPrompt?: string;
  callId?: string;
}

export interface Chunk {
  id: string;
  text: string;
}

export interface Settings {
  apiKey: string;
  endpoint: string;
  model: string;
}
