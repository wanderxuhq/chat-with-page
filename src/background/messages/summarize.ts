import type { PlasmoMessaging } from "@plasmohq/messaging"
import OpenAI from "openai"
import * as browser from "webextension-polyfill"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const messages = req.body.messages

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

    const baseURL = (apiEndpointData[`${selectedProvider}ApiEndpoint`] as string) || 
                   (genericApiEndpointData.apiEndpoint as string) || 
                   "https://api.openai.com/v1"
    
    if (!apiKey) {
      res.send({ error: "API key not found" })
      return
    }
    
    // Only use model parameter passed from frontend
    const modelToUse = req.body.model
    
    // Return error if no model parameter provided
    if (!modelToUse) {
      res.send({ error: "Model not provided" })
      return
    }

    // Create different clients based on provider
    if (selectedProvider === "anthropic") {
      // Handle Anthropic API
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
      // Default to OpenAI-compatible API
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
