import OpenAI from "openai"
import * as browser from "webextension-polyfill"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface PortMessage {
  messages: Message[]
  model: string
  language: string
}

browser.runtime.onConnect.addListener((port) => {
  if (port.name === "summarize") {
    port.onMessage.addListener(async (msg: PortMessage) => {
      try {
        const data = await browser.storage.local.get(["providerConfigs", "selectedProvider"])
        
        const selectedProvider = data.selectedProvider as string || "openai"
        const providerConfigs = data.providerConfigs || {}
        const currentProviderConfig = providerConfigs[selectedProvider] || {}
        
        if (!currentProviderConfig.apiKey) {
          port.postMessage({ error: "API key not found" })
          return
        }

        const openai = new OpenAI({
          baseURL: currentProviderConfig.apiEndpoint || "https://api.openai.com/v1",
          apiKey: currentProviderConfig.apiKey as string,
          dangerouslyAllowBrowser: true
        })

        // 根据用户选择的语言设置系统提示语
        const languagePrompt = msg.language === "zh-CN" ? "并使用中文回答" : 
                              msg.language === "en-US" ? "and answer in English" :
                              msg.language === "ja-JP" ? "日本語で回答してください" :
                              msg.language === "ko-KR" ? "한국어로 답변해 주세요" :
                              msg.language === "fr-FR" ? "et répondez en français" :
                              msg.language === "de-DE" ? "und antworten Sie auf Deutsch" :
                              msg.language === "es-ES" ? "y responda en español" :
                              msg.language === "ru-RU" ? "и ответьте на русском" : "并使用中文回答"
        
        const stream = await openai.chat.completions.create({
          model: msg.model,
          stream: true,
          messages: [
            {
              role: "system",
              content: `你是一个善于总结的专家。你需要对用户提供的文本进行总结，${languagePrompt}。输入文本中包含 [REF***] 格式的标记，在引用原文时，必须将对应标记原封不动地紧跟在引用句的末尾。`
            },
            ...msg.messages
          ]
        })

        for await (const chunk of stream) {
          port.postMessage(chunk)
        }
      } catch (error) {
        port.postMessage({ error: error.message })
      } finally {
        port.disconnect()
      }
    })
  }
})
