import { defineContentScript } from "wxt/utils/define-content-script"
import { browser } from "wxt/browser"

export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_idle",
  async main() {
    // Content script logic here
    console.log("Content script loaded")

    // Listen for messages from background or popup
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "extractContent") {
        extractContent().then(sendResponse)
        return true // Keep port open for async response
      }
    })

    async function extractContent() {
      try {
        // Extract page content
        const title = document.title
        const body = document.body.innerText
        
        // Get page URL
        const url = window.location.href
        
        return {
          title,
          body,
          url,
        }
      } catch (error) {
        console.error("Error extracting content:", error)
        return { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
})
