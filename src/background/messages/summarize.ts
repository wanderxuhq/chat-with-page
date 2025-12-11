import type { PlasmoMessaging } from "@plasmohq/messaging"
import OpenAI from "openai"
import * as browser from "webextension-polyfill"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const messages = req.body.messages

    // 获取当前选择的提供商
    const selectedProviderData = await browser.storage.local.get("selectedProvider")
    const selectedProvider = (selectedProviderData.selectedProvider as string) || "openai"
    
    // 获取提供商特定的API配置
    const apiKeyData = await browser.storage.local.get(`${selectedProvider}ApiKey`)
    const apiEndpointData = await browser.storage.local.get(`${selectedProvider}ApiEndpoint`)
    
    // 获取通用API配置作为备选
    const genericApiKeyData = await browser.storage.local.get("apiKey")
    const genericApiEndpointData = await browser.storage.local.get("apiEndpoint")

    // 使用提供商特定的配置，如果没有则使用通用配置
    const apiKey = (apiKeyData[`${selectedProvider}ApiKey`] as string) || 
                  (genericApiKeyData.apiKey as string)

    const baseURL = (apiEndpointData[`${selectedProvider}ApiEndpoint`] as string) || 
                   (genericApiEndpointData.apiEndpoint as string) || 
                   "https://api.openai.com/v1"
    
    if (!apiKey) {
      res.send({ error: "API key not found" })
      return
    }
    
    // 只使用前端传递的模型参数
    const modelToUse = req.body.model
    
    // 如果没有传递模型参数，返回错误
    if (!modelToUse) {
      res.send({ error: "Model not provided" })
      return
    }

    // 根据提供商创建不同的客户端
    if (selectedProvider === "anthropic") {
      // 处理 Anthropic API
      const anthropic = new OpenAI({
        baseURL: baseURL || "https://api.anthropic.com/v1",
        apiKey: apiKey as string,
        dangerouslyAllowBrowser: true
      })

      const stream = await anthropic.chat.completions.create({
        model: modelToUse,
        stream: true,
        messages: messages
      })

      for await (const chunk of stream) {
        res.send(chunk)
      }
    } else {
      // 默认使用 OpenAI 兼容的 API
      const openai = new OpenAI({
        baseURL: baseURL,
        apiKey: apiKey as string,
        dangerouslyAllowBrowser: true
      })

      const stream = await openai.chat.completions.create({
        model: modelToUse,
        stream: true,
        messages: messages
      })

      for await (const chunk of stream) {
        res.send(chunk)
      }
    }
    // By not returning anything, we are telling Plasmo to keep the connection open.
  } catch (error) {
    console.error("Error in background script:", error)
    res.send({ error: error.message })
  }
}

export default handler
