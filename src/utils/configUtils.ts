import { decryptValue, encryptValue } from "../utils/crypto"
import { AiProviderId, getDefaultBaseUrl } from "../config/aiProviders"
import { getSetting, setSetting } from "../db/settings"
import { db } from "../db"

export interface ProviderConfig {
  apiKey: string
  baseURL: string
  provider: string
}

/**
 * 获取完整的 Provider 配置，包含自动回退逻辑和解密
 * @param specificProvider 可选，指定获取某个 Provider 的配置，否则获取当前选中的
 */
export async function getProviderConfig(): Promise<ProviderConfig> {
  // 1. 确定要获取的 Provider
  const selectedProvider = await getSetting<string>("selectedProvider")
  const provider = selectedProvider as AiProviderId;
  
  // 2. 获取 Provider 配置和通用配置
  const providerEntry = await db.aiProviders.get(provider);
  
  const [
    genericApiKey,
    genericEndpoint
  ] = await Promise.all([
    getSetting<string>("apiKey"),
    getSetting<string>("apiEndpoint")
  ])

  const providerApiKey = providerEntry?.apiKey;
  const providerEndpoint = providerEntry?.baseUrl;

  // 3. 解析加密的 API Key (优先使用特定 Provider 配置，否则回退到通用配置)
  let encryptedApiKey = providerApiKey
  
  // 只有在没有指定 provider (即获取当前生效配置) 或者明确需要 fallback 时才使用 generic
  if (!encryptedApiKey ) {
     encryptedApiKey = genericApiKey
  }

  let apiKey = ''
  if (encryptedApiKey) {
      apiKey = await decryptValue(encryptedApiKey)
  }
  
  // 如果是后台调用且没有 Key，抛出异常；如果是 UI 调用（specificProvider），允许为空
  if (!apiKey) {
    throw new Error("API key not found. Please configure it in settings.")
  }

  // 4. 解析 Endpoint
  let baseURL = providerEndpoint
  
  if (!baseURL) {
      baseURL = genericEndpoint
  }
  
  if (!baseURL) {
      baseURL = getDefaultBaseUrl(provider)
  }

  return {
    apiKey,
    baseURL,
    provider
  }
}

/**
 * 获取用于 UI 显示的配置（不回退到 Generic，除非 Generic 是当前 Provider 的一部分逻辑）
 */
export async function getSettingsConfig(provider: AiProviderId): Promise<{ apiKey: string, baseURL: string }> {
    const providerEntry = await db.aiProviders.get(provider);
    
    const encryptedKey = providerEntry?.apiKey;
    const baseURLSetting = providerEntry?.baseUrl;

    const apiKey = encryptedKey ? await decryptValue(encryptedKey) : ''
    
    const baseURL = baseURLSetting || getDefaultBaseUrl(provider)

    return { apiKey, baseURL }
}

/**
 * 保存 Provider 配置
 */
export async function saveProviderConfig(provider: string, apiKey: string, baseURL: string): Promise<void> {
    const encryptedKey = apiKey ? await encryptValue(apiKey) : ''
    
    // Check if provider changed to clear selectedModel
    const currentProvider = await getSetting<string>('selectedProvider');
    if (currentProvider !== provider) {
        await setSetting('selectedModel', '');
    }

    // Update ai provider db structure
    const existing = await db.aiProviders.get(provider);
    
    // Create new object with explicit fields to avoid saving selectedModel if it existed in 'existing'
    // though Typescript interface should prevent it, 'existing' comes from DB which might have it.
    const newEntry = {
        id: provider,
        apiKey: encryptedKey,
        baseUrl: baseURL
    };
    
    await db.aiProviders.put(newEntry);

    // Update current setting
    await setSetting('selectedProvider', provider)
}
