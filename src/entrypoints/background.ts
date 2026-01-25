import { defineBackground } from "wxt/utils/define-background"
import { browser } from "wxt/browser"
import type { AIPortMessage } from "../types"
import { getProviderConfig } from "../utils/configUtils"
import { createChatStream } from "../utils/llmUtils"

export default defineBackground(() => {
  // Store active streams for interruption
  const activeStreams = new Map<string, AbortController>()
  
  // ... (keep browser action listener logic)
  // Check if running in Firefox
  const isFirefox = navigator.userAgent.includes("Firefox")

  // Register action click listener (only in browser context)
  if (browser.action?.onClicked) {
    if (isFirefox) {
      // Firefox - use sidebarAction
      browser.action.onClicked.addListener(async () => {
        await (browser as any).sidebarAction.toggle()
      })
    } else {
      // Chrome/Edge - use sidePanel
      browser.action.onClicked.addListener(async (tab) => {
        if (tab?.id) {
          await browser.sidePanel.open({ tabId: tab.id })
        }
      })
    }
  }

  browser.runtime.onConnect.addListener((port) => {
    if (port.name === "chat") {
      const portId = `chat_${Date.now()}`

      port.onMessage.addListener(async (msg: AIPortMessage) => {

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
          // Get provider configuration
          const config = await getProviderConfig()



          // Create AbortController for stream interruption
          const abortController = new AbortController()
          activeStreams.set(portId, abortController)

          // Create chat stream
          const stream = await createChatStream(
            {
              apiKey: config.apiKey,
              baseURL: config.baseURL,
            },
            {
              model: msg.model!,
              messages: msg.messages,
            },
            abortController.signal
          )

          for await (const chunk of stream) {
            port.postMessage(chunk)
          }
        } catch (error: any) {
          console.error("Error in background script:", error)
          // Try to send error if port is still connected
          try {
            if (error.name === 'AbortError') {
              port.postMessage({ stopped: true })
            } else {
              // Ensure we send a clean error message
              port.postMessage({ error: error.message || String(error) })
            }
          } catch {
            // Port already disconnected, ignore
          }
        } finally {
          activeStreams.delete(portId)
          try {
            port.disconnect()
          } catch {
            // Already disconnected, ignore
          }
        }
      })
    }
  });
})
