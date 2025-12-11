export interface Message {
  id: string;
  content: string;
  type: 'user' | 'assistant';
  timestamp: number;
  isGenerating?: boolean;
  references?: Array<{
    originalText: string;
    htmlElement?: HTMLElement;
    isVisible?: boolean;
  }>;
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
