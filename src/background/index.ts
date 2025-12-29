import OpenAI from "openai"
import * as browser from "webextension-polyfill"
import i18n from "../i18n"

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

// Store active streams for interruption
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

// Use the waited API
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
        // Handle stop request
        if (msg.action === "stop") {
          const controller = activeStreams.get(portId)
          if (controller) {
            controller.abort()
            activeStreams.delete(portId)
          }
          return
        }

        try {
          // Get currently selected provider
          const selectedProviderData = await browser.storage.local.get("selectedProvider")
          const selectedProvider = (selectedProviderData.selectedProvider as string) || "openai"

          // Get provider-specific API configuration
          const apiKeyData = await browser.storage.local.get(`${selectedProvider}ApiKey`)
          const apiEndpointData = await browser.storage.local.get(`${selectedProvider}ApiEndpoint`)

          // Get generic API configuration as fallback
          const genericApiKeyData = await browser.storage.local.get("apiKey")
          const genericApiEndpointData = await browser.storage.local.get("apiEndpoint")

          // Use provider-specific configuration, fallback to generic if not available
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

          // Set system prompt based on user-selected language
          i18n.changeLanguage(msg.language || i18n.language);
          const languagePrompt = i18n.t("languagePrompts.answerInLanguage");

          // Use different system prompts based on port type
          const systemPrompt = port.name === "summarize"
            ? `你是一个善于总结的专家。你需要对用户提供的文本进行总结，${languagePrompt}。输入文本中包含 [REF***] 格式的标记，在引用原文时，必须将对应标记原封不动地紧跟在引用句的末尾。`
            : `你是一个智能助手，${languagePrompt}。如果用户提供了包含 [REF***] 格式标记的参考内容，在引用时请保留对应标记。`

          // Create AbortController for stream interruption
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
