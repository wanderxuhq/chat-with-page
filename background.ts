import { isProbablyReaderable, Readability } from "@mozilla/readability"
import OpenAI from "openai"

// A function to use as callback
function doStuffWithDom(domContent) {
  console.log("I received the following DOM content:", domContent)
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  console.log("background msg", msg)
  // If the received message has the expected format...
  // Call the specified callback, passing
  // the web-page's DOM content as argument
  if (msg.content !== undefined) {
    (async () => {
        const openai = new OpenAI({
          //apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
          baseURL: "https://p.ice9.cc/openai/v1",
          //baseURL: "https://api.groq.com/openai/v1",
          //baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
          //baseURL: "http://localhost:11434/v1/",
          //baseURL: "https://api.moonshot.cn/v1/",

          // required but ignored
          apiKey: "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", //groq
          //apiKey: "sk-b45886f7cb714f21821fe3420c1bfbce", //qwen
          //apiKey: "ollama",
          //apiKey: "sk-bvEyRC5BF251WRPjCJ5weFJUZpekYaPdSFO2mBetvuMmD0El", // kimi
          dangerouslyAllowBrowser: true,
        })

        const chatCompletion = await openai.chat.completions.create({
          model: "llama3-70b-8192",
          //model: "qwen-long",
          //model: "llama3",
          //model: "moonshot-v1-8k",
          messages: [
            {
              role: "system",
              content: `你需要总结提供的文字，并使用中文回答`
            },
            {
              role: "user",
              content: msg.content
            }
          ]
        })

        console.log("chatCompletion", chatCompletion)

        sendResponse(chatCompletion);
    })()

    return true;
  }

  return false;
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
