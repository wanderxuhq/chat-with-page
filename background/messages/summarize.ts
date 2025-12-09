import type { PlasmoMessaging } from "@plasmohq/messaging"
import OpenAI from "openai"
import * as browser from "webextension-polyfill"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("Summarize message handler called")
  try {
    const messages = req.body.messages
    console.log("Messages:", messages)

    const data = await browser.storage.local.get(["apiKey", "apiEndpoint", "selectedProvider"])
    if (!data.apiKey) {
      console.log("API key not found")
      res.send({ error: "API key not found" })
      return
    }
    console.log("API key found")

    const selectedProvider = data.selectedProvider as string || "openai"
    const baseURL = (data.apiEndpoint as string) || "https://api.openai.com/v1"
    
    // 只使用前端传递的模型参数
    const modelToUse = req.body.model
    
    // 如果没有传递模型参数，返回错误
    if (!modelToUse) {
      console.log("Model not provided")
      res.send({ error: "Model not provided" })
      return
    }

    // 根据提供商创建不同的客户端
    if (selectedProvider === "anthropic") {
      // 处理 Anthropic API
      const anthropic = new OpenAI({
        baseURL: baseURL || "https://api.anthropic.com/v1",
        apiKey: data.apiKey as string,
        dangerouslyAllowBrowser: true
      })

      console.log(`Sending request to Anthropic API at ${baseURL || "https://api.anthropic.com/v1"} using model ${modelToUse}`)
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
        apiKey: data.apiKey as string,
        dangerouslyAllowBrowser: true
      })

      console.log(`Sending request to ${selectedProvider} API at ${baseURL} using model ${modelToUse}`)
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
