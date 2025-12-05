import type { PlasmoMessaging } from "@plasmohq/messaging"
import OpenAI from "openai"
import * as browser from "webextension-polyfill"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("Summarize message handler called")
  try {
    const pageContent = req.body.input
    console.log("Input:", pageContent)

    const data = await browser.storage.local.get(["apiKey", "apiEndpoint"])
    if (!data.apiKey) {
      console.log("API key not found")
      res.send({ error: "API key not found" })
      return
    }
    console.log("API key found")

    const openai = new OpenAI({
      baseURL: (data.apiEndpoint as string) || "https://api.openai.com/v1",
      apiKey: data.apiKey as string,
      dangerouslyAllowBrowser: true
    })

    console.log("Sending request to OpenAI")
    const stream = await openai.chat.completions.create({
      model: "gemini-2.5-flash",
      stream: true,
      messages: [
        {
          role: "system",
          content: `你是一个善于总结的专家。你需要对用户提供的文本进行总结，并使用中文回答。输入文本中包含 [REF***] 格式的标记，在引用原文时，必须将对应标记原封不动地紧跟在引用句的末尾。`
        },
        {
          role: "user",
          content: pageContent as string
        }
      ]
    })

    for await (const chunk of stream) {
      res.send(chunk)
    }
    // By not returning anything, we are telling Plasmo to keep the connection open.
  } catch (error) {
    console.error("Error in background script:", error)
    res.send({ error: error.message })
  }
}

export default handler
