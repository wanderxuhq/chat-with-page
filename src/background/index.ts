import OpenAI from "openai"
import * as browser from "webextension-polyfill"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface PortMessage {
  messages?: Message[]
  model?: string
  language?: string
  action?: string
}

// 存储活跃的流以便可以中断
const activeStreams = new Map<string, AbortController>()

const waitForAPI = () => {
  return new Promise<typeof browser>((resolve) => {
    const checkAPI = () => {
      if (browser && browser.runtime) {
        resolve(browser)
      } else {
        setTimeout(checkAPI, 10)
      }
    }
    checkAPI()
  })
}

// 使用等待后的 API  
waitForAPI().then((browser) => {

  // Manifest V3 (Chrome/Edge)  
  chrome.action.onClicked.addListener(async (tab) => {
    await chrome.sidePanel.open({ tabId: tab.id })
  })

  /*
  // Manifest V2/V3 (Firefox)  
  if (typeof browser !== "undefined") {  
    browser.browserAction.onClicked.addListener(async (tab) => {  
      await browser.sidebarAction.open()  
    })  
  }
  */
  browser.runtime.onConnect.addListener((port) => {
    if (port.name === "summarize" || port.name === "chat") {
      const portId = `${port.name}_${Date.now()}`

      port.onMessage.addListener(async (msg: PortMessage) => {
        // 处理停止请求
        if (msg.action === "stop") {
          const controller = activeStreams.get(portId)
          if (controller) {
            controller.abort()
            activeStreams.delete(portId)
          }
          return
        }

        try {
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

          const apiEndpoint = (apiEndpointData[`${selectedProvider}ApiEndpoint`] as string) ||
                            (genericApiEndpointData.apiEndpoint as string) ||
                            "https://api.openai.com/v1"

          if (!apiKey) {
            port.postMessage({ error: "API key not found" })
            return
          }

          const openai = new OpenAI({
            baseURL: apiEndpoint,
            apiKey: apiKey as string,
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

          // 根据端口类型使用不同的系统提示
          const systemPrompt = port.name === "summarize"
            ? `你是一个善于总结的专家。你需要对用户提供的文本进行总结，${languagePrompt}。输入文本中包含 [REF***] 格式的标记，在引用原文时，必须将对应标记原封不动地紧跟在引用句的末尾。`
            : `你是一个智能助手，${languagePrompt}。如果用户提供了包含 [REF***] 格式标记的参考内容，在引用时请保留对应标记。`

          // 创建 AbortController 以便可以中断流
          const abortController = new AbortController()
          activeStreams.set(portId, abortController)

          const stream = await openai.chat.completions.create({
            model: msg.model!,
            stream: true,
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              ...msg.messages!
            ]
          }, { signal: abortController.signal })

          for await (const chunk of stream) {
            port.postMessage(chunk)
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            port.postMessage({ stopped: true })
          } else {
            port.postMessage({ error: error.message })
          }
        } finally {
          activeStreams.delete(portId)
          port.disconnect()
        }
      })
    }
  })

})
