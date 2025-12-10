import * as browser from "webextension-polyfill"
import { useEffect, useState, useRef } from "react"
import { marked } from "marked"
import { escape } from "./escape"
import { ReadabilityParser } from './ReadabilityParser';

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
  const [showSettings, setShowSettings] = useState(false)  
  const [selectedProvider, setSelectedProvider] = useState<string>("openai")
  // 模型选择相关状态
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [fetchingModels, setFetchingModels] = useState(false)
  // 搜索模型
  const [modelSearchTerm, setModelSearchTerm] = useState<string>(selectedModel);
  // 控制下拉列表的显示和隐藏
  const [showModelList, setShowModelList] = useState<boolean>(false);
  // 模型选择容器的引用
  const modelSelectRef = useRef<HTMLDivElement>(null);

  // 主流AI提供商预置配置
  const aiProviders = [
    { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1" },
    { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1" },
    { id: "google", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai" },
    { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1" },
    { id: "custom", name: "自定义", baseUrl: "" }
  ]

  // 获取模型列表的函数
  const fetchModels = async () => {
    if (!apiKey || !apiEndpoint) return
    
    setFetchingModels(true)
    try {
      // 尝试从缓存获取模型列表
      const cachedModels = localStorage.getItem(`models_${apiEndpoint}`)
      if (cachedModels) {
        const parsedModels = JSON.parse(cachedModels)
        setModels(parsedModels.models)
        if (parsedModels.selectedModel) {
          setSelectedModel(parsedModels.selectedModel)
        } else {
          // 不设置默认模型，保持为空
          setSelectedModel("")
        }
        setFetchingModels(false)
        return
      }
      
      // 从API获取模型列表
      const response = await fetch(`${apiEndpoint}/models`, {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const modelNames = data.data.map((model: any) => model.id)
        
        // 不设置默认模型，保持为空
        setModels(modelNames)
        setSelectedModel("")
        
        // 缓存模型列表到localStorage，但不保存selectedModel
        localStorage.setItem(`models_${apiEndpoint}`, JSON.stringify({
          models: modelNames,
          timestamp: Date.now()
        }))
      } else {
        // API获取失败时，不设置默认模型
        setSelectedModel("")
      }
    } catch (error) {
      console.error("获取模型列表失败:", error)
      // 出错时，不设置默认模型
      setSelectedModel("")
    } finally {
      setFetchingModels(false)
    }
  }
  
  useEffect(() => {
    const fetchSettings = async () => {
      const data = await browser.storage.local.get(["providerConfigs", "selectedProvider"])
      
      // 初始化provider配置结构（如果不存在）
      const providerConfigs = data.providerConfigs as Record<string, { apiKey?: string; apiEndpoint?: string }> || {};
      
      const selectedProviderValue = (data.selectedProvider as string) || aiProviders[0].id;
      
      if (data.selectedProvider) {
        setSelectedProvider(data.selectedProvider as string)
      } else {
        // 默认选择OpenAI
        const defaultProvider = aiProviders[0]
        setSelectedProvider(defaultProvider.id)
      }
      
      // 加载当前选中provider的配置
      const currentProviderConfig = providerConfigs[selectedProviderValue] || {};
      
      if (currentProviderConfig.apiKey) {
        setApiKey(currentProviderConfig.apiKey as string)
        setApiKeyInput(currentProviderConfig.apiKey as string)
      } else {
        setApiKey("")
        setApiKeyInput("")
      }
      
      if (currentProviderConfig.apiEndpoint) {
        setApiEndpoint(currentProviderConfig.apiEndpoint as string)
        setApiEndpointInput(currentProviderConfig.apiEndpoint as string)
      } else {
        // 使用provider的默认baseUrl
        const defaultProvider = aiProviders.find(p => p.id === (data.selectedProvider || aiProviders[0].id))
        if (defaultProvider) {
          setApiEndpoint(defaultProvider.baseUrl)
          setApiEndpointInput(defaultProvider.baseUrl)
        }
      }
    }
    fetchSettings()
  }, [])

  // 当apiKey、apiEndpoint或selectedProvider变化时获取模型列表
  useEffect(() => {
    if (apiKey && apiEndpoint) {
      fetchModels()
    }
  }, [apiKey, apiEndpoint, selectedProvider])

  useEffect(() => {
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

  // 处理提供商选择变化
  const handleProviderChange = async (providerId: string) => {
    // 先保存当前provider的配置
    const data = await browser.storage.local.get(["providerConfigs"])
    const providerConfigs = data.providerConfigs as Record<string, { apiKey?: string; apiEndpoint?: string }> || {};
    
    // 保存当前配置
    await browser.storage.local.set({
      providerConfigs: {
        ...providerConfigs,
        [selectedProvider]: {
          apiKey: apiKeyInput,
          apiEndpoint: apiEndpointInput
        }
      }
    });
    
    // 切换到新provider
    setSelectedProvider(providerId)
    
    // 加载新provider的配置
    const newProviderConfig = providerConfigs[providerId] || {};
    
    if (newProviderConfig.apiKey) {
      setApiKey(newProviderConfig.apiKey)
      setApiKeyInput(newProviderConfig.apiKey)
    } else {
      setApiKey("")
      setApiKeyInput("")
    }
    
    const provider = aiProviders.find(p => p.id === providerId)
    if (provider) {
      if (newProviderConfig.apiEndpoint) {
        setApiEndpoint(newProviderConfig.apiEndpoint)
        setApiEndpointInput(newProviderConfig.apiEndpoint)
      } else if (provider.id !== "custom") {
        setApiEndpoint(provider.baseUrl)
        setApiEndpointInput(provider.baseUrl)
      } else {
        setApiEndpoint("")
        setApiEndpointInput("")
      }
    }
  }

  const saveSettings = async () => {
    const data = await browser.storage.local.get(["providerConfigs"])
    const providerConfigs = data.providerConfigs as Record<string, { apiKey?: string; apiEndpoint?: string }> || {};
    
    await browser.storage.local.set({
      providerConfigs: {
        ...providerConfigs,
        [selectedProvider]: {
          apiKey: apiKeyInput,
          apiEndpoint: apiEndpointInput
        }
      },
      selectedProvider: selectedProvider
    })
    
    setApiKey(apiKeyInput)
    setApiEndpoint(apiEndpointInput)
    setShowSettings(false)
    console.log("Settings saved")
  }
  
  // 保存选择的模型到localStorage
  const saveSelectedModel = (modelId: string) => {
    setSelectedModel(modelId)
    localStorage.setItem(`models_${apiEndpoint}`, JSON.stringify({
      models: models,
      selectedModel: modelId,
      timestamp: Date.now()
    }))
    setShowModelList(false); // 选择后隐藏列表
  };

  // 处理输入框焦点
  const handleInputFocus = () => {
    setShowModelList(true);
  };

  // 点击外部隐藏列表
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectRef.current && !modelSelectRef.current.contains(event.target as Node)) {
        setShowModelList(false);
      }
    };

    // 添加事件监听器
    document.addEventListener("mousedown", handleClickOutside);
    
    // 清理事件监听器
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 当selectedModel变化时，更新modelSearchTerm
  useEffect(() => {
    setModelSearchTerm(selectedModel);
  }, [selectedModel]);

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

    // 辅助函数：处理单个引用ID并返回HTML
    const processSingleRef = (refId: string) => {
      if (refIdToNumber[refId] === undefined) {
        refIdToNumber[refId] = refCounter++
      }
      const refNumber = refIdToNumber[refId]
      return `<a href="#" class="summary-link" data-ref-id="${refId}"><sup>[${refNumber}]</sup></a>`
    }

    // 移除反引号
    let content = rawContent.replace(/`\[(.*?)\]`/g, '[$1]')

    // 处理[REFx]-[REFy]格式的范围引用
    const separateRangePattern = /\[(REF(\d+))\]-\[(REF(\d+))\]/g
    content = content.replace(separateRangePattern, (match, startRef, startId, endRef, endId) => {
      let processedRefs = ''
      const start = parseInt(startId)
      const end = parseInt(endId)
      
      if (!isNaN(start) && !isNaN(end)) {
        // 生成范围内的所有引用
        for (let i = start; i <= end; i++) {
          processedRefs += processSingleRef(i.toString())
        }
        return processedRefs
      }
      
      return match
    })

    // 处理所有引用格式
    // 首先找到所有的引用组（允许空格）
    const refPattern = /\[(REF[\d,REF\s-]+)\]/g
    let match
    const matches: Array<{ fullMatch: string; refsStr: string; index: number }> = []
    
    // 先收集所有匹配项
    while ((match = refPattern.exec(content)) !== null) {
      matches.push({
        fullMatch: match[0],
        refsStr: match[1],
        index: match.index
      })
    }
    
    // 从后往前替换，避免索引偏移
    for (let i = matches.length - 1; i >= 0; i--) {
      const { fullMatch, refsStr } = matches[i]
      let processedRefs = ''
      
      // 处理范围引用和逗号分隔引用
      const parts = refsStr.split(',')
      
      parts.forEach(part => {
        part = part.trim()
        
        // 检查是否是范围引用
        if (part.includes('-')) {
          const rangeParts = part.split('-')
          if (rangeParts.length === 2) {
            const startStr = rangeParts[0].replace('REF', '')
            const endStr = rangeParts[1].replace('REF', '')
            
            const start = parseInt(startStr)
            const end = parseInt(endStr)
            
            if (!isNaN(start) && !isNaN(end)) {
              // 生成范围内的所有引用
              for (let j = start; j <= end; j++) {
                processedRefs += processSingleRef(j.toString())
              }
              return
            }
          }
        }
        
        // 单个引用
        const refId = part.replace('REF', '')
        processedRefs += processSingleRef(refId)
      })
      
      // 替换原引用组
      content = content.replace(fullMatch, processedRefs)
    }
    
    return content
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
          const readability = new ReadabilityParser(doc, { debug: false }); // true for debug logs
          const articleBody = readability.parse().node;

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
      if (!selectedModel) {
              alert("请先选择一个模型")
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
            port.postMessage({ messages: messagesForAI, model: selectedModel })
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
    if (!selectedModel) {
      alert("请先选择一个模型")
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
      port.postMessage({ messages: newMessages, model: selectedModel })
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

  // 使用useEffect添加全局样式
  useEffect(() => {
    // 创建style元素
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏侧边栏全局滚动条 */
      body {
        overflow: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* 自定义对话记录区域滚动条 */
      div::-webkit-scrollbar {
        width: 6px;
      }
      div::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      div::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
      }
      div::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;
    // 添加到head
    document.head.appendChild(style);

    // 直接设置body样式
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // 清理函数
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const renderSettings = () => (
    <div style={{ padding: 16 }}>
      <h2>设置</h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>AI提供商</label>
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        >
          {aiProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>Base URL</label>
        <input
          type="text"
          onChange={(e) => setApiEndpointInput(e.target.value)}
          value={apiEndpointInput}
          placeholder={selectedProvider === "custom" ? "输入自定义 Base URL" : `自动填充 (${aiProviders.find(p => p.id === selectedProvider)?.baseUrl})`}
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 4, fontSize: "14px" }}>API Token</label>
        <input
          type="text"
          onChange={(e) => setApiKeyInput(e.target.value)}
          value={apiKeyInput}
          placeholder="输入您的 API Token"
          style={{
            width: "100%",
            padding: 8,
            boxSizing: "border-box",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>

      <button
        onClick={saveSettings}
        style={{
          width: "100%",
          padding: 10,
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "14px"
        }}>
        保存
      </button>
    </div>
  )

  if (!apiKey && !showSettings) {
    return renderSettings()
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        padding: 16,
        overflow: "hidden",
        boxSizing: "border-box",
        margin: 0
      }}
    >
      {/* 设置按钮 */}
      {showSettings ? (
        renderSettings()
      ) : (
        <>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowSettings(true)}
              style={{
                padding: "4px 8px",
                backgroundColor: "#f0f0f0",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px"
              }}
            >
              设置
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, paddingRight: 8 }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 8,
                  textAlign: msg.role === "user" ? "right" : "left"
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    padding: 8,
                    borderRadius: 4,
                    backgroundColor: msg.role === "user" ? "#dcf8c6" : "#f1f0f0"
                  }}
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(msg.content)
                  }}
                ></div>
              </div>
            ))}
            {loading && <div>加载中...</div>}
          </div>
          {/* 模型选择 */}
          <div style={{ marginBottom: "8px" }}>
            <div ref={modelSelectRef} style={{ position: "relative" }}>
              <div
                style={{
                  position: "relative",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "12px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                <input
                  type="text"
                  placeholder="模型"
                  value={modelSearchTerm}
                  onChange={(e) => {
                    setModelSearchTerm(e.target.value);
                    setShowModelList(true);
                  }}
                  onFocus={handleInputFocus}
                  onBlur={() => {
                    // 延迟隐藏，以便点击列表项时能触发点击事件
                    setTimeout(() => setShowModelList(false), 200);
                  }}
                  style={{
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    width: "100%",
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>
              {showModelList && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    right: 0,
                    border: "1px solid #ccc",
                    borderBottom: "none",
                    borderRadius: "4px 4px 0 0",
                    maxHeight: "200px",
                    overflowY: "auto",
                    backgroundColor: "white",
                    zIndex: 1000,
                    boxShadow: "0 -2px 5px rgba(0,0,0,0.1)"
                  }}
                >
                  {fetchingModels ? (
                    <div style={{ padding: "4px 8px", fontSize: "12px", color: "#666" }}>加载模型中...</div>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {(() => {
                        const filteredModels = models.filter(model => {
                          if (!modelSearchTerm.trim()) return true;
                          const searchTerm = modelSearchTerm.trim().toLowerCase();
                          const modelName = model.toLowerCase();
                          
                          // 实现模糊匹配，支持*f*r*e*e*格式
                          if (searchTerm.includes('*')) {
                            const regexPattern = searchTerm
                              .replace(/\*/g, '.*')
                              .replace(/\s+/g, '.*');
                            const regex = new RegExp(regexPattern);
                            return regex.test(modelName);
                          }
                          
                          // 简单的包含匹配
                          return modelName.includes(searchTerm);
                        });
                        
                        return (
                          <>
                            {filteredModels.length > 0 ? (
                              filteredModels.map(model => (
                                <li
                                  key={model}
                                  onClick={() => {
                                    saveSelectedModel(model);
                                    setModelSearchTerm(model);
                                  }}
                                  style={{
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    backgroundColor: selectedModel === model ? "#e6f7ff" : "white",
                                    borderBottom: "1px solid #f0f0f0"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                                  onMouseLeave={(e) => {
                                    if (selectedModel !== model) {
                                      e.currentTarget.style.backgroundColor = "white";
                                    } else {
                                      e.currentTarget.style.backgroundColor = "#e6f7ff";
                                    }
                                  }}
                                >
                                  {model}
                                </li>
                              ))
                            ) : (
                              <li style={{ padding: "4px 8px", fontSize: "12px", color: "#999" }}>
                                未找到匹配的模型
                              </li>
                            )}
                          </>
                        );
                      })()}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", minHeight: "40px", zIndex: 10 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  // 如果输入了自定义模型，保存它
                  if (modelSearchTerm.trim() && modelSearchTerm.trim() !== selectedModel) {
                    saveSelectedModel(modelSearchTerm.trim());
                  }
                  sendMessage();
                }
              }}
              style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "white" }}
              placeholder="请输入您的消息..."
            />
            <button onClick={() => {
              // 如果输入了自定义模型，保存它
              if (modelSearchTerm.trim() && modelSearchTerm.trim() !== selectedModel) {
                saveSelectedModel(modelSearchTerm.trim());
              }
              sendMessage();
            }} style={{ padding: 8, marginLeft: 8, backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", minWidth: "60px" }}>
              发送
            </button>
            <button onClick={summarizePage} style={{ padding: 8, marginLeft: 8, backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", minWidth: "100px" }}>
              总结页面
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default IndexSidePanel

