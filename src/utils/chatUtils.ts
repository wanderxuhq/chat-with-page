// 聊天工具函数
import type { Message } from '../types/index';
import * as browser from "webextension-polyfill"
import { ReadabilityParser } from '../ReadabilityParser';

// 当前活跃的端口，用于停止生成
let currentPort: browser.Runtime.Port | null = null;

// 停止生成函数
export const stopGeneration = () => {
  if (currentPort) {
    try {
      currentPort.postMessage({ action: "stop" });
      currentPort.disconnect();
    } catch (e) {
      // 忽略错误
    }
    currentPort = null;
  }
};

// 处理AI输出的内容，将引用转换为可点击的链接
export const processAIOutput = (rawContent: string) => {
  let refCounter = 1;
  const refIdToNumber: Record<string, number> = {};
  const allRefIds: string[] = [];

  // 辅助函数：处理单个引用ID并返回HTML
  const processSingleRef = (refId: string) => {
    if (refIdToNumber[refId] === undefined) {
      refIdToNumber[refId] = refCounter++;
    }
    const refNumber = refIdToNumber[refId];
    return `<a href="#" class="summary-link" data-ref-id="${refId}"><sup>[${refNumber}]</sup></a>`;
  };

  // 移除反引号
  let content = rawContent.replace(/`\[(.*?)\]`/g, '[$1]');

  // 收集所有需要处理的引用ID（保持出现顺序）
  const collectRefIds = (text: string) => {
    // 处理[REFx]-[REFy]格式的范围引用
    const separateRangePattern = /\[(REF(\d+))\]-\[(REF(\d+))\]/g;
    let match;
    while ((match = separateRangePattern.exec(text)) !== null) {
      const start = parseInt(match[2]);
      const end = parseInt(match[4]);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          const refId = i.toString();
          if (!allRefIds.includes(refId)) {
            allRefIds.push(refId);
          }
        }
      }
    }

    // 处理所有引用格式
    const refPattern = /\[(REF[\d,REF\s-]+)\]/g;
    while ((match = refPattern.exec(text)) !== null) {
      const refsStr = match[1];
      const parts = refsStr.split(',');
      parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
          const rangeParts = part.split('-');
          if (rangeParts.length === 2) {
            const startStr = rangeParts[0].replace('REF', '');
            const endStr = rangeParts[1].replace('REF', '');
            const start = parseInt(startStr);
            const end = parseInt(endStr);
            if (!isNaN(start) && !isNaN(end)) {
              for (let j = start; j <= end; j++) {
                const refId = j.toString();
                if (!allRefIds.includes(refId)) {
                  allRefIds.push(refId);
                }
              }
              return;
            }
          }
        }
        // 单个引用
        const refId = part.replace('REF', '');
        if (!allRefIds.includes(refId)) {
          allRefIds.push(refId);
        }
      });
    }
  };

  // 先收集所有引用ID
  collectRefIds(content);

  // 按照出现顺序为每个引用ID分配序号
  allRefIds.forEach(refId => {
    if (refIdToNumber[refId] === undefined) {
      refIdToNumber[refId] = refCounter++;
    }
  });

  // 处理[REFx]-[REFy]格式的范围引用
  const separateRangePattern = /\[(REF(\d+))\]-\[(REF(\d+))\]/g;
  content = content.replace(separateRangePattern, (match, startRef, startId, endRef, endId) => {
    let processedRefs = '';
    const start = parseInt(startId);
    const end = parseInt(endId);

    if (!isNaN(start) && !isNaN(end)) {
      // 生成范围内的所有引用
      for (let i = start; i <= end; i++) {
        processedRefs += processSingleRef(i.toString());
      }
      return processedRefs;
    }

    return match;
  });

  // 处理所有引用格式
  // 首先找到所有的引用组（允许空格）
  const refPattern = /\[(REF[\d,REF\s-]+)\]/g;
  let match;
  const matches: Array<{ fullMatch: string; refsStr: string; index: number }> = [];
  
  // 先收集所有匹配项
  while ((match = refPattern.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      refsStr: match[1],
      index: match.index
    });
  }
  
  // 从后往前替换，避免索引偏移
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, refsStr } = matches[i];
    let processedRefs = '';

    // 处理范围引用和逗号分隔引用
    const parts = refsStr.split(',');

    parts.forEach(part => {
      part = part.trim();
      
      // 检查是否是范围引用
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length === 2) {
          const startStr = rangeParts[0].replace('REF', '');
          const endStr = rangeParts[1].replace('REF', '');
          
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          
          if (!isNaN(start) && !isNaN(end)) {
            // 生成范围内的所有引用
            for (let j = start; j <= end; j++) {
              processedRefs += processSingleRef(j.toString());
            }
            return;
          }
        }
      }
      
      // 单个引用
      const refId = part.replace('REF', '');
      processedRefs += processSingleRef(refId);
    });

    // 替换原引用组
    content = content.replace(fullMatch, processedRefs);
  }
  
  return content;
};

// 保存选择的模型到localStorage
export const saveSelectedModel = (modelId: string, models: any[], apiEndpoint: string, setSelectedModel: (modelId: string) => void, setShowModelList: (show: boolean) => void) => {
  setSelectedModel(modelId);
  localStorage.setItem(`models_${apiEndpoint}`, JSON.stringify({
    models: models,
    selectedModel: modelId,
    timestamp: Date.now()
  }));
  setShowModelList(false); // 选择后隐藏列表
};

// 滚动到原始文本位置
export const scrollToOriginalText = async (refId: string) => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];
    if (activeTab && activeTab.id) {
      await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (id: string) => {
          const element = document.querySelector(
            `[data-summary-ref-id="${id}"]`
          ) as HTMLElement;
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            const originalColor = element.style.backgroundColor;
            element.style.backgroundColor = "yellow";
            setTimeout(() => {
              element.style.backgroundColor = originalColor;
            }, 2000);
          }
        },
        args: [refId]
      });
    }
  } catch (error) {
    console.error("Error scrolling to text:", error);
  }
};

// 页面总结函数
export const summarizePage = async (setLoading: (loading: boolean) => void, setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void, selectedModel: string, selectedLanguage: string, messages: Message[], setHighlightMap: (highlightMap: Record<string, string>) => void) => {
  setLoading(true);
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];

    if (activeTab && activeTab.id) {
      const results = await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: () => document.documentElement.outerHTML
      });

      if (results && results.length > 0) {
        const pageHtml = results[0].result as string;
        const doc = new DOMParser().parseFromString(pageHtml, "text/html");
        const readability = new ReadabilityParser(doc, { debug: false }); // true for debug logs
        const articleBody = readability.parse().node;

        if (articleBody) {
          const keyElements = Array.from(
            articleBody.querySelectorAll(
              "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre"
            )
          );

          const elementsToMark = keyElements
            .map((el) => {
              const text = (el as HTMLElement).innerText?.trim();
              if (text && text.length > 10) {
                return {
                  tagName: el.tagName,
                  text: text
                };
              }
              return null;
            })
            .filter((el): el is { tagName: string; text: string } => el !== null);

          const markedElementsResults = await browser.scripting.executeScript(
            {
              target: { tabId: activeTab.id },
              func: (elements: { tagName: string; text: string }[]) => {
                const markedTexts: { text: string; index: string }[] = [];
                let elementCounter = 0;
                if (elements) {
                  for (const elInfo of elements) {
                    const candidates = document.querySelectorAll(
                      elInfo.tagName
                    );
                    for (const candidate of Array.from(candidates)) {
                      if (
                        (candidate as HTMLElement).innerText?.trim() ===
                        elInfo.text
                      ) {
                        let elementIndex: string;
                        if (!candidate.hasAttribute("data-summary-ref-id")) {
                          candidate.setAttribute(
                            "data-summary-ref-id",
                            `${elementCounter}`
                          );
                          elementIndex = elementCounter.toString();
                          elementCounter++;
                        } else {
                          elementIndex = candidate.getAttribute(
                            "data-summary-ref-id"
                          ) || "";
                          // 确保elementIndex是字符串类型，防止null值
                        }
                        markedTexts.push({
                          text: elInfo.text,
                          index: elementIndex
                        });

                        break;
                      }
                    }
                  }
                }
                return markedTexts;
              },
              args: [elementsToMark]
            }
          );


          const markedTexts =
            markedElementsResults && markedElementsResults[0]
              ? (markedElementsResults[0].result as {
                text: string
                index: string
              }[])
              : [];

          if (!markedTexts || markedTexts.length === 0) {
            setMessages([
              ...messages,
              { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "无法提取页面关键内容", timestamp: Date.now() }
            ]);
            setLoading(false);
            return;
          }
          if (!selectedModel) {
            alert("请先选择一个模型");
            setLoading(false);
            return;
          }

          let aiInputText = "";
          const newHighlightMap: Record<string, string> = {};
          markedTexts.forEach((marked) => {
            const refId = marked.index;
            aiInputText += `[REF${refId}] ${marked.text}\n`;
            newHighlightMap[refId] = marked.text;
          });

          setHighlightMap(newHighlightMap);

          const userMessageContent = "请总结当前页面";
          // 根据选择的语言添加提示
          const languagePrompt = selectedLanguage === "zh-CN" ? "请用中文回答：" : 
                                selectedLanguage === "en-US" ? "Please answer in English:" :
                                selectedLanguage === "ja-JP" ? "日本語で回答してください：" :
                                selectedLanguage === "ko-KR" ? "한국어로 답변해 주세요：" :
                                selectedLanguage === "fr-FR" ? "Veuillez répondre en français:" :
                                selectedLanguage === "de-DE" ? "Bitte antworten Sie auf Deutsch:" :
                                selectedLanguage === "es-ES" ? "Por favor, responda en español:" :
                                selectedLanguage === "ru-RU" ? "Пожалуйста, ответьте на русском:" : "";
          
          const newMessagesForUI: Message[] = [
            ...messages,
            { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "user", content: userMessageContent, timestamp: Date.now() },
            { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "", timestamp: Date.now(), isGenerating: true }
          ];
          setMessages(newMessagesForUI);

          const messagesForAI: any[] = [
            ...messages.map(msg => ({ role: msg.type === "user" ? "user" : "assistant", content: msg.content })),
            { role: "user", content: `${languagePrompt}${userMessageContent}:\n${aiInputText}` }
          ];

          const port = browser.runtime.connect({ name: "summarize" });
          currentPort = port;
          port.postMessage({ messages: messagesForAI, model: selectedModel, language: selectedLanguage });
          port.onMessage.addListener((chunk: any) => {
            if (chunk.stopped) {
              return;
            }
            if (chunk.error) {
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                return [
                  ...prevMessages.slice(0, -1),
                  {
                    ...lastMessage,
                    content: lastMessage.content + chunk.error
                  }
                ];
              });
              return;
            }

            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                const newContent = lastMessage.content + delta;
                return [
                  ...prevMessages.slice(0, -1),
                  {
                    ...lastMessage,
                    content: newContent
                  }
                ];
              });
            }
          });
          port.onDisconnect.addListener(() => {
            currentPort = null;
            setLoading(false);
            setMessages((prevMessages: Message[]) => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (lastMessage.type === "assistant") {
                const processedContent = processAIOutput(
                  lastMessage.content
                );
                return [
                  ...prevMessages.slice(0, -1),
                  { ...lastMessage, content: processedContent, isGenerating: false }
                ];
              }
              return prevMessages;
            });
          });
        } else {
          setMessages([
            ...messages,
            { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "无法提取页面内容", timestamp: Date.now() }
          ]);
        }
      }
    }
  } catch (error) {
    console.error("Error summarizing page:", error);
    setMessages([...messages, { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "无法总结页面", timestamp: Date.now() }]);
    setLoading(false);
  }
};

// 检测页面是否有文章内容，并返回页面上下文
export const getPageContext = async (setHighlightMap?: (highlightMap: Record<string, string>) => void): Promise<{
  hasArticle: boolean;
  context: string;
  highlightMap: Record<string, string>;
}> => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];

    if (!activeTab || !activeTab.id) {
      return { hasArticle: false, context: '', highlightMap: {} };
    }

    // 获取页面HTML
    const results = await browser.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => document.documentElement.outerHTML
    });

    if (!results || results.length === 0) {
      return { hasArticle: false, context: '', highlightMap: {} };
    }

    const pageHtml = results[0].result as string;
    const doc = new DOMParser().parseFromString(pageHtml, "text/html");
    const readability = new ReadabilityParser(doc, { debug: false });
    const parseResult = readability.parse();

    // 如果解析成功且有足够的文章内容
    if (parseResult && parseResult.textContent && parseResult.textContent.length > 200) {
      const articleBody = parseResult.node;
      const keyElements = Array.from(
        articleBody.querySelectorAll(
          "p, h1, h2, h3, h4, h5, h6, li, blockquote, pre"
        )
      );

      const elementsToMark = keyElements
        .map((el) => {
          const text = (el as HTMLElement).innerText?.trim();
          if (text && text.length > 10) {
            return {
              tagName: el.tagName,
              text: text
            };
          }
          return null;
        })
        .filter((el): el is { tagName: string; text: string } => el !== null);

      // 在页面上标记元素
      const markedElementsResults = await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (elements: { tagName: string; text: string }[]) => {
          const markedTexts: { text: string; index: string }[] = [];
          let elementCounter = 0;
          if (elements) {
            for (const elInfo of elements) {
              const candidates = document.querySelectorAll(elInfo.tagName);
              for (const candidate of Array.from(candidates)) {
                if ((candidate as HTMLElement).innerText?.trim() === elInfo.text) {
                  let elementIndex: string;
                  if (!candidate.hasAttribute("data-summary-ref-id")) {
                    candidate.setAttribute("data-summary-ref-id", `${elementCounter}`);
                    elementIndex = elementCounter.toString();
                    elementCounter++;
                  } else {
                    elementIndex = candidate.getAttribute("data-summary-ref-id") || "";
                  }
                  markedTexts.push({
                    text: elInfo.text,
                    index: elementIndex
                  });
                  break;
                }
              }
            }
          }
          return markedTexts;
        },
        args: [elementsToMark]
      });

      const markedTexts = markedElementsResults && markedElementsResults[0]
        ? (markedElementsResults[0].result as { text: string; index: string }[])
        : [];

      if (markedTexts && markedTexts.length > 0) {
        let aiInputText = "";
        const newHighlightMap: Record<string, string> = {};
        markedTexts.forEach((marked) => {
          const refId = marked.index;
          aiInputText += `[REF${refId}] ${marked.text}\n`;
          newHighlightMap[refId] = marked.text;
        });

        if (setHighlightMap) {
          setHighlightMap(newHighlightMap);
        }

        return {
          hasArticle: true,
          context: aiInputText,
          highlightMap: newHighlightMap
        };
      }
    }

    // 没有文章内容，返回整个页面HTML
    // 截取body内容，限制长度
    const bodyContent = doc.body?.innerHTML || pageHtml;
    const truncatedHtml = bodyContent.length > 50000
      ? bodyContent.substring(0, 50000) + '...(内容已截断)'
      : bodyContent;

    return {
      hasArticle: false,
      context: truncatedHtml,
      highlightMap: {}
    };
  } catch (error) {
    console.error("Error getting page context:", error);
    return { hasArticle: false, context: '', highlightMap: {} };
  }
};

// 发送消息函数
export const sendMessage = async (
  userMessageContent: string,
  messages: Message[],
  setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  selectedModel: string,
  selectedLanguage: string,
  highlightMap: Record<string, string>,
  setLoading: (loading: boolean) => void,
  setHighlightMap?: (highlightMap: Record<string, string>) => void
) => {
  console.log('sendMessage called', { userMessageContent, selectedModel, selectedLanguage });
  if (!userMessageContent.trim()) {
    console.log('sendMessage: empty input, returning');
    return;
  }
  if (!selectedModel) {
    console.log('sendMessage: no model selected');
    alert("请先选择一个模型");
    return;
  }
  setLoading(true);

  // 根据选择的语言添加提示
  const languagePrompt = selectedLanguage === "zh-CN" ? "请用中文回答：" :
                        selectedLanguage === "en-US" ? "Please answer in English:" :
                        selectedLanguage === "ja-JP" ? "日本語で回答してください：" :
                        selectedLanguage === "ko-KR" ? "한국어로 답변해 주세요：" :
                        selectedLanguage === "fr-FR" ? "Veuillez répondre en français:" :
                        selectedLanguage === "de-DE" ? "Bitte antworten Sie auf Deutsch:" :
                        selectedLanguage === "es-ES" ? "Por favor, responda en español:" :
                        selectedLanguage === "ru-RU" ? "Пожалуйста, ответьте на русском:" : "";

  // 构建消息
  const newMessagesForUI: Message[] = [
    ...messages,
    { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "user", content: userMessageContent, timestamp: Date.now() },
    { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "", timestamp: Date.now(), isGenerating: true }
  ];
  setMessages(newMessagesForUI);

  // 自动检测页面内容并构建上下文
  let aiInputText = `${languagePrompt}${userMessageContent}`;
  let shouldProcessRefs = false; // 是否需要处理 REF 引用

  // 如果已有highlightMap，使用它；否则自动检测页面内容
  if (Object.keys(highlightMap).length > 0) {
    aiInputText += "\n\n参考内容：\n";
    Object.entries(highlightMap).forEach(([refId, text]) => {
      aiInputText += `[REF${refId}] ${text}\n`;
    });
    shouldProcessRefs = true;
  } else {
    // 自动获取页面上下文
    const pageContext = await getPageContext(setHighlightMap);
    if (pageContext.context) {
      if (pageContext.hasArticle) {
        // 有文章时使用 REF 格式
        aiInputText += "\n\n页面文章内容：\n" + pageContext.context;
        shouldProcessRefs = true;
      } else {
        // 没有文章时直接使用 HTML，不需要 REF 处理
        aiInputText += "\n\n页面HTML内容：\n" + pageContext.context;
        shouldProcessRefs = false;
      }
    }
  }

  // 添加到消息历史
  const messagesForAI: any[] = [
    ...messages.map(msg => ({ role: msg.type === "user" ? "user" : "assistant", content: msg.content })),
    { role: "user", content: aiInputText }
  ];

  // 发送到AI并处理响应
  const port = browser.runtime.connect({ name: "chat" });
  currentPort = port;
  port.postMessage({ messages: messagesForAI, model: selectedModel, language: selectedLanguage });

  port.onMessage.addListener((chunk: any) => {
    if (chunk.stopped) {
      return;
    }
    if (chunk.error) {
      setMessages((prevMessages: Message[]) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        return [
          ...prevMessages.slice(0, -1),
          {
            ...lastMessage,
            content: lastMessage.content + chunk.error,
            isGenerating: false
          }
        ];
      });
      return;
    }

    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      setMessages((prevMessages: Message[]) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        const newContent = lastMessage.content + delta;
        return [
          ...prevMessages.slice(0, -1),
          {
            ...lastMessage,
            content: newContent
          }
        ];
      });
    }
  });

  port.onDisconnect.addListener(() => {
    currentPort = null;
    setLoading(false);
    setMessages((prevMessages: Message[]) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      if (lastMessage.type === "assistant") {
        // 只有当有文章时才处理 REF 引用
        const processedContent = shouldProcessRefs
          ? processAIOutput(lastMessage.content)
          : lastMessage.content;
        return [
          ...prevMessages.slice(0, -1),
          { ...lastMessage, content: processedContent, isGenerating: false }
        ];
      }
      return prevMessages;
    });
  });
};

// 清除聊天记录
export const clearChatHistory = (setMessages: (messages: Message[]) => void, currentPageUrl: string) => {
  setMessages([]);
  if (currentPageUrl) {
    localStorage.removeItem(`chat_history_${currentPageUrl}`);
  }
};

// 重新生成消息
export const regenerateMessage = async (
  messageIndex: number,
  messages: Message[],
  setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  selectedModel: string,
  selectedLanguage: string,
  highlightMap: Record<string, string>,
  setLoading: (loading: boolean) => void,
  setHighlightMap?: (highlightMap: Record<string, string>) => void
) => {
  // 找到对应的用户消息（assistant消息之前的user消息）
  if (messageIndex <= 0 || messages[messageIndex].type !== 'assistant') return;

  const userMessageIndex = messageIndex - 1;
  if (messages[userMessageIndex].type !== 'user') return;

  const userMessage = messages[userMessageIndex];

  // 删除从用户消息开始的所有后续消息
  const newMessages = messages.slice(0, userMessageIndex);
  setMessages(newMessages);

  // 重新发送消息
  await sendMessage(
    userMessage.content,
    newMessages,
    setMessages,
    selectedModel,
    selectedLanguage,
    highlightMap,
    setLoading,
    setHighlightMap
  );
};

// 编辑消息并重新发送
export const editAndResendMessage = async (
  messageIndex: number,
  newContent: string,
  messages: Message[],
  setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  selectedModel: string,
  selectedLanguage: string,
  highlightMap: Record<string, string>,
  setLoading: (loading: boolean) => void,
  setHighlightMap?: (highlightMap: Record<string, string>) => void
) => {
  if (messages[messageIndex].type !== 'user') return;

  // 删除从该消息开始的所有后续消息
  const newMessages = messages.slice(0, messageIndex);
  setMessages(newMessages);

  // 重新发送编辑后的消息
  await sendMessage(
    newContent,
    newMessages,
    setMessages,
    selectedModel,
    selectedLanguage,
    highlightMap,
    setLoading,
    setHighlightMap
  );
};

// 复制消息内容到剪贴板
export const copyMessageToClipboard = async (content: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy message:', error);
    return false;
  }
};

// 重新标记页面元素
export const relinkPageElements = async (highlightMap: Record<string, string>) => {
  if (!Object.keys(highlightMap).length) return;

  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];

    if (activeTab && activeTab.id) {
      await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (map: Record<string, string>) => {
          // 将highlightMap转换为数组以便处理
          const elementsToRelink = Object.entries(map)
            .map(([index, text]) => ({ index, text }))
            .filter(el => el.text && el.text.length > 10);

          if (elementsToRelink.length > 0) {
            for (const elInfo of elementsToRelink) {
              // 查找所有可能的标签类型
              const possibleTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "pre"];
              for (const tag of possibleTags) {
                const candidates = document.querySelectorAll(tag);
                for (const candidate of Array.from(candidates)) {
                  if ((candidate as HTMLElement).innerText?.trim() === elInfo.text) {
                    // 只在没有标记时添加
                    if (!candidate.hasAttribute("data-summary-ref-id")) {
                      candidate.setAttribute(
                        "data-summary-ref-id",
                        elInfo.index
                      );
                    }
                    break;
                  }
                }
              }
            }
          }
        },
        args: [highlightMap]
      });
    }
  } catch (error) {
    console.error("Error relinking page elements:", error);
  }
};
