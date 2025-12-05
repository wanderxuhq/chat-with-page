import * as browser from "webextension-polyfill"
import { useEffect, useState } from "react"
import { marked } from "marked"
import { getMainContent } from "./get-main-content"
import { escape } from "./escape"

marked.use({
  renderer: {
    codespan: function ({ text }) {
      return `<code class="custom-codespan">${escape(text, true)}</code>`
    }
  }
})
interface Message {
  role: "user" | "assistant"
  content: string
}

interface Chunk {
  error?: string
  choices?: {
    delta?: {
      content?: string
    }
  }[]
}

function IndexSidePanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [loading, setLoading] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [apiEndpointInput, setApiEndpointInput] = useState("")
  const [highlightMap, setHighlightMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await browser.storage.local.get(["apiKey", "apiEndpoint"])
      if (data.apiKey) {
        setApiKey(data.apiKey as string)
      }
      if (data.apiEndpoint) {
        setApiEndpoint(data.apiEndpoint as string)
      }
    }
    fetchSettings()

    return () => {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then((tabs) => {
          const activeTab = tabs[0]
          if (activeTab && activeTab.id) {
            browser.scripting.executeScript({
              target: { tabId: activeTab.id },
              func: () => {
                document
                  .querySelectorAll("[data-summary-ref-id]")
                  .forEach((el) => {
                    el.removeAttribute("data-summary-ref-id")
                  })
              }
            })
          }
        })
    }
  }, [])

  const saveSettings = async () => {
    await browser.storage.local.set({
      apiKey: apiKeyInput,
      apiEndpoint: apiEndpointInput
    })
    setApiKey(apiKeyInput)
    setApiEndpoint(apiEndpointInput)
    console.log("Settings saved")
  }

  const scrollToOriginalText = async (refId: string) => {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
      })
      const activeTab = tabs[0]
      if (activeTab && activeTab.id) {
        await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: (id: string) => {
            const element = document.querySelector(
              `[data-summary-ref-id="${id}"]`
            ) as HTMLElement
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" })
              const originalColor = element.style.backgroundColor
              element.style.backgroundColor = "yellow"
              setTimeout(() => {
                element.style.backgroundColor = originalColor
              }, 2000)
            }
          },
          args: [refId]
        })
      }
    } catch (error) {
      console.error("Error scrolling to text:", error)
    }
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      let current: HTMLElement | null = target
      while (current && !current.classList.contains("summary-link")) {
        current = current.parentElement
      }

      if (current && current.classList.contains("summary-link")) {
        event.preventDefault()
        const refId = current.dataset.refId
        if (refId) {
          scrollToOriginalText(refId)
        }
      }
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [highlightMap])

  const processAIOutput = (rawContent: string) => {
    let refCounter = 1
    const refIdToNumber: Record<string, number> = {}

    const processedContent = rawContent.replace(
      /\[REF(\w+)\]/g,
      (match, refId) => {
        if (refIdToNumber[refId] === undefined) {
          refIdToNumber[refId] = refCounter++
        }
        const refNumber = refIdToNumber[refId]
        return `<a href="#" class="summary-link" data-ref-id="${refId}"><sup>[${refNumber}]</sup></a>`
      }
    )
    return processedContent
  }

  const summarizePage = async () => {
    setLoading(true)
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
      })
      const activeTab = tabs[0]

      if (activeTab && activeTab.id) {
        const results = await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: () => document.documentElement.outerHTML
        })

        if (results && results.length > 0) {
          const pageHtml = results[0].result as string
          const doc = new DOMParser().parseFromString(pageHtml, "text/html")
          const articleBody = getMainContent(doc)

          if (articleBody) {
            const keyElements = Array.from(
              articleBody.querySelectorAll(
                "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre"
              )
            )

            const elementsToMark = keyElements
              .map((el) => {
                const text = (el as HTMLElement).innerText?.trim()
                if (text && text.length > 10) {
                  return {
                    tagName: el.tagName,
                    text: text
                  }
                }
                return null
              })
              .filter((el): el is { tagName: string; text: string } => el !== null)

            const markedElementsResults = await browser.scripting.executeScript(
              {
                target: { tabId: activeTab.id },
                func: (elements: { tagName: string; text: string }[]) => {
                  const markedTexts: { text: string; index: string }[] = []
                  let elementCounter = 0
                  if (elements) {
                    for (const elInfo of elements) {
                      const candidates = document.querySelectorAll(
                        elInfo.tagName
                      )
                      for (const candidate of Array.from(candidates)) {
                        if (
                          (candidate as HTMLElement).innerText?.trim() ===
                          elInfo.text
                        ) {
                          let elementIndex: string
                          if (!candidate.hasAttribute("data-summary-ref-id")) {
                            candidate.setAttribute(
                              "data-summary-ref-id",
                              `${elementCounter}`
                            )
                            elementIndex = elementCounter.toString()
                            elementCounter++
                          } else {
                            elementIndex = candidate.getAttribute(
                              "data-summary-ref-id"
                            )
                          }
                          markedTexts.push({
                            text: elInfo.text,
                            index: elementIndex
                          })

                          break
                        }
                      }
                    }
                  }
                  return markedTexts
                },
                args: [elementsToMark]
              }
            )

            const markedTexts =
              markedElementsResults && markedElementsResults[0]
                ? (markedElementsResults[0].result as {
                    text: string
                    index: string
                  }[])
                : []

            if (!markedTexts || markedTexts.length === 0) {
              setMessages([
                ...messages,
                { role: "assistant", content: "无法提取页面关键内容" }
              ])
              setLoading(false)
              return
            }

            let aiInputText = ""
            const newHighlightMap: Record<string, string> = {}
            markedTexts.forEach((marked) => {
              const refId = marked.index
              aiInputText += `[REF${refId}] ${marked.text}\n`
              newHighlightMap[refId] = marked.text
            })

            setHighlightMap(newHighlightMap)

            const userMessageContent = "请总结当前页面"
            const newMessagesForUI: Message[] = [
              ...messages,
              { role: "user", content: userMessageContent },
              { role: "assistant", content: "" }
            ]
            setMessages(newMessagesForUI)

            const messagesForAI: Message[] = [
              ...messages,
              { role: "user", content: `${userMessageContent}:\n${aiInputText}` }
            ]

            const port = browser.runtime.connect({ name: "summarize" })
            port.postMessage({ messages: messagesForAI })
            port.onMessage.addListener((chunk: Chunk) => {
              if (chunk.error) {
                setMessages((prevMessages) => {
                  const lastMessage = prevMessages[prevMessages.length - 1]
                  return [
                    ...prevMessages.slice(0, -1),
                    {
                      ...lastMessage,
                      content: lastMessage.content + chunk.error
                    }
                  ]
                })
                return
              }

              const delta = chunk.choices[0]?.delta?.content || ""
              if (delta) {
                setMessages((prevMessages) => {
                  const lastMessage = prevMessages[prevMessages.length - 1]
                  const newContent = lastMessage.content + delta
                  return [
                    ...prevMessages.slice(0, -1),
                    {
                      ...lastMessage,
                      content: newContent
                    }
                  ]
                })
              }
            })
            port.onDisconnect.addListener(() => {
              setLoading(false)
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1]
                if (lastMessage.role === "assistant") {
                  const processedContent = processAIOutput(
                    lastMessage.content
                  )
                  return [
                    ...prevMessages.slice(0, -1),
                    { ...lastMessage, content: processedContent }
                  ]
                }
                return prevMessages
              })
            })
          } else {
            setMessages([
              ...messages,
              { role: "assistant", content: "无法提取页面内容" }
            ])
          }
        }
      }
    } catch (error) {
      console.error("Error summarizing page:", error)
      setMessages([...messages, { role: "assistant", content: "无法总结页面" }])
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim()) {
      return
    }
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: input },
      { role: "assistant", content: "" }
    ]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const port = browser.runtime.connect({ name: "summarize" })
      port.postMessage({ messages: newMessages })
      port.onMessage.addListener((chunk: Chunk) => {
        if (chunk.error) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1]
            return [
              ...prevMessages.slice(0, -1),
              {
                ...lastMessage,
                content: lastMessage.content + chunk.error
              }
            ]
          })
          return
        }

        const delta = chunk.choices[0]?.delta?.content || ""
        if (delta) {
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1]
            return [
              ...prevMessages.slice(0, -1),
              {
                ...lastMessage,
                content: lastMessage.content + delta
              }
            ]
          })
        }
      })
      port.onDisconnect.addListener(() => {
        setLoading(false)
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1]
          if (lastMessage.role === "assistant") {
            const processedContent = processAIOutput(lastMessage.content)
            return [
              ...prevMessages.slice(0, -1),
              { ...lastMessage, content: processedContent }
            ]
          }
          return prevMessages
        })
      })
    } catch (error) {
      console.error("Error sending message to background script:", error)
      setMessages([
        ...messages,
        { role: "assistant", content: "Error sending message" }
      ])
      setLoading(false)
    }
  }

  if (!apiKey) {
    return (
      <div style={{ padding: 16 }}>
        <h2>设置</h2>
        <input
          type="text"
          onChange={(e) => setApiKeyInput(e.target.value)}
          value={apiKeyInput}
          placeholder="输入您的 OpenAI API 密钥"
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            marginBottom: 8
          }}
        />
        <input
          type="text"
          onChange={(e) => setApiEndpointInput(e.target.value)}
          value={apiEndpointInput}
          placeholder="输入您的 API 端点"
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box"
          }}
        />
        <button
          onClick={saveSettings}
          style={{
            width: "100%",
            padding: 8,
            marginTop: 8
          }}>
          保存
        </button>
      </div>
    )
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: 16
      }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: 8,
              textAlign: msg.role === "user" ? "right" : "left"
            }}>
            <div
              style={{
                display: "inline-block",
                padding: 8,
                borderRadius: 4,
                backgroundColor: msg.role === "user" ? "#dcf8c6" : "#f1f0f0"
              }}
              dangerouslySetInnerHTML={{
                __html: marked.parse(msg.content)
              }}></div>
          </div>
        ))}
        {loading && <div>加载中...</div>}
      </div>
      <div style={{ display: "flex", marginTop: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={sendMessage} style={{ padding: 8, marginLeft: 8 }}>
          发送
        </button>
        <button onClick={summarizePage} style={{ padding: 8, marginLeft: 8 }}>
          总结页面
        </button>
      </div>
    </div>
  )
}

export default IndexSidePanel
