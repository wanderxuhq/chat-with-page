/**
 * AI Provider Configuration
 * Centralized configuration for all supported AI providers
 */

export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
}

export const aiProviders: AIProvider[] = [
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
  { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1" },
  { id: "google", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
  { id: "xai", name: "XAI", baseUrl: "https://api.x.ai/v1" },
  { id: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
  { id: "qwen", name: "Qwen", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1" },
  { id: "doubao", name: "Doubao", baseUrl: "https://ark.cn-beijing.volces.com/api/v3" },
  { id: "kimi", name: "Kimi", baseUrl: "https://api.moonshot.ai/v1" },
  { id: "glm", name: "Glm", baseUrl: "https://open.bigmodel.cn/api/paas/v4/" },
  { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
  { id: "siliconflow", name: "Siliconflow", baseUrl: "https://api.siliconflow.cn/v1/" },
  { id: "ollama", name: "Ollama", baseUrl: "http://localhost:11434/v1/" },
  { id: "custom", name: "Custom", baseUrl: "" }
];

/**
 * Get the default base URL for a provider
 * @param providerId - The provider ID
 * @returns The default base URL, or empty string if not found
 */
export function getDefaultBaseUrl(providerId: string): string {
  const provider = aiProviders.find(p => p.id === providerId);
  return provider?.baseUrl || '';
}

/**
 * Get a provider by ID
 * @param providerId - The provider ID
 * @returns The provider configuration, or undefined if not found
 */
export function getProvider(providerId: string): AIProvider | undefined {
  return aiProviders.find(p => p.id === providerId);
}
