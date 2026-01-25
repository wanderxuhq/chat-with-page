import Dexie, { type EntityTable } from 'dexie';
import type { Message } from '../types';

export interface ChatSessionEntry {
  url: string;
  title: string;
  messages: Message[];
  lastActive: number;
  systemPrompt?: string;
}

export interface SettingEntry {
  key: string; // Primary Key
  value: any;
}

export interface AIProviderEntry {
  id: string; // Primary Key (provider id)
  apiKey?: string;
  baseUrl: string;
  // Add other provider-specific settings here if needed
}

const db = new Dexie('ChatDatabase') as Dexie & {
  chatSessions: EntityTable<ChatSessionEntry, 'url'>;
  settings: EntityTable<SettingEntry, 'key'>;
  aiProviders: EntityTable<AIProviderEntry, 'id'>;
};

db.version(1).stores({
  chatSessions: 'url, lastActive',
  settings: 'key',
  aiProviders: 'id'
});

export { db };
