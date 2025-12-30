// Chat utility functions
import type { Message } from '../types/index';
import type { Runtime } from 'webextension-polyfill';
import { browser, waitForBrowser } from './browserApi';
import { ReadabilityParser } from '../ReadabilityParser';
import { escape } from '../../escape';
import i18n from '../i18n';

// Currently active port for stopping generation
let currentPort: Runtime.Port | null = null;


// Stop generation function
export const stopGeneration = () => {
  if (currentPort) {
    try {
      currentPort.postMessage({ action: "stop" });
      currentPort.disconnect();
    } catch (e) {
      // Ignore error
    }
    currentPort = null;
  }
};

// Process AI output content, converting references to clickable links
export const processAIOutput = (rawContent: string) => {
  let refCounter = 1;
  const refIdToNumber: Record<string, number> = {};
  const allRefIds: string[] = [];

  // Helper function: process single reference ID and return HTML
  const processSingleRef = (refId: string) => {
    // Validate refId is a safe numeric string to prevent XSS
    const sanitizedRefId = refId.replace(/[^0-9]/g, '');
    if (!sanitizedRefId || sanitizedRefId !== refId) {
      return ''; // Invalid refId, skip
    }

    if (refIdToNumber[sanitizedRefId] === undefined) {
      refIdToNumber[sanitizedRefId] = refCounter++;
    }
    const refNumber = refIdToNumber[sanitizedRefId];
    return `<a href="#" class="summary-link" data-ref-id="${escape(sanitizedRefId, true)}"><sup>[${refNumber}]</sup></a>`;
  };

  // Remove backticks
  let content = rawContent.replace(/`\[(.*?)\]`/g, '[$1]');

  // Collect all reference IDs to process (preserve order)
  const collectRefIds = (text: string) => {
    // Process range references in [REFx]-[REFy] format
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

    // Process all reference formats
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
        // Single reference
        const refId = part.replace('REF', '');
        if (!allRefIds.includes(refId)) {
          allRefIds.push(refId);
        }
      });
    }
  };

  // First collect all reference IDs
  collectRefIds(content);

  // Assign sequence numbers to each reference ID by appearance order
  allRefIds.forEach(refId => {
    if (refIdToNumber[refId] === undefined) {
      refIdToNumber[refId] = refCounter++;
    }
  });

  // Process range references in [REFx]-[REFy] format
  const separateRangePattern = /\[(REF(\d+))\]-\[(REF(\d+))\]/g;
  content = content.replace(separateRangePattern, (match, startRef, startId, endRef, endId) => {
    let processedRefs = '';
    const start = parseInt(startId);
    const end = parseInt(endId);

    if (!isNaN(start) && !isNaN(end)) {
      // Generate all references in the range
      for (let i = start; i <= end; i++) {
        processedRefs += processSingleRef(i.toString());
      }
      return processedRefs;
    }

    return match;
  });

  // Process all reference formats
  // First find all reference groups (allowing spaces)
  const refPattern = /\[(REF[\d,REF\s-]+)\]/g;
  let match;
  const matches: Array<{ fullMatch: string; refsStr: string; index: number }> = [];
  
  // First collect all matches
  while ((match = refPattern.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      refsStr: match[1],
      index: match.index
    });
  }
  
  // Replace from end to beginning to avoid index shifts
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, refsStr } = matches[i];
    let processedRefs = '';

    // Process range and comma-separated references
    const parts = refsStr.split(',');

    parts.forEach(part => {
      part = part.trim();
      
      // Check if it's a range reference
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length === 2) {
          const startStr = rangeParts[0].replace('REF', '');
          const endStr = rangeParts[1].replace('REF', '');
          
          const start = parseInt(startStr);
          const end = parseInt(endStr);
          
          if (!isNaN(start) && !isNaN(end)) {
            // Generate all references in the range
            for (let j = start; j <= end; j++) {
              processedRefs += processSingleRef(j.toString());
            }
            return;
          }
        }
      }
      
      // Single reference
      const refId = part.replace('REF', '');
      processedRefs += processSingleRef(refId);
    });

    // Replace original reference group
    content = content.replace(fullMatch, processedRefs);
  }
  
  return content;
};

// Save selected model to browser.storage.local
export const saveSelectedModel = async (modelId: string, models: any[], apiEndpoint: string, setSelectedModel: (modelId: string) => void, setShowModelList: (show: boolean) => void) => {
  setSelectedModel(modelId);
  try {
    const browser = await waitForBrowser();
    await browser.storage.local.set({
      [`models_${apiEndpoint}`]: JSON.stringify({
        models: models,
        selectedModel: modelId,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('Error saving selected model:', error);
  }
  setShowModelList(false); // Hide list after selection
};

// Scroll to original text position
export const scrollToOriginalText = async (refId: string) => {
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];
    if (activeTab && activeTab.id && isAccessibleUrl(activeTab.url)) {
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

// Page summary function
export const summarizePage = async (setLoading: (loading: boolean) => void, setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void, selectedModel: string, selectedLanguage: string, messages: Message[], setHighlightMap: (highlightMap: Record<string, string>) => void, onNoModelSelected?: () => void) => {
  setLoading(true);
  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];

    if (activeTab && activeTab.id && isAccessibleUrl(activeTab.url)) {
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
                          // Ensure elementIndex is string type to prevent null values
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
              { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "Failed to extract key page content", timestamp: Date.now() }
            ]);
            setLoading(false);
            return;
          }
          if (!selectedModel) {
            setLoading(false);
            onNoModelSelected?.();
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

          const userMessageContent = i18n.t("prompts.summarizePage");
          // Add prompt based on selected language
          i18n.changeLanguage(selectedLanguage || i18n.language);
          const languagePrompt = i18n.t("languagePrompts.answerInLanguage");
          
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
            { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "Failed to extract page content", timestamp: Date.now() }
          ]);
        }
      }
    }
  } catch (error) {
    console.error("Error summarizing page:", error);
    setMessages([...messages, { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "Failed to summarize page", timestamp: Date.now() }]);
    setLoading(false);
  }
};

// Check if a URL is accessible by the extension
const isAccessibleUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  // chrome://, edge://, about:, chrome-extension://, moz-extension:// etc. are not accessible
  const inaccessibleProtocols = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'moz-extension://',
    'opera://',
    'brave://',
    'vivaldi://'
  ];
  return !inaccessibleProtocols.some(protocol => url.startsWith(protocol));
};

// Detect if page has article content and return page context
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

    // Check if the URL is accessible
    if (!isAccessibleUrl(activeTab.url)) {
      return { hasArticle: false, context: '', highlightMap: {} };
    }

    // Get page HTML
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

    // If parsing successful and has sufficient article content
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

      // Mark elements on the page
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

    // No article content, extract meaningful text content
    // Clone body to avoid modifying the original
    const bodyClone = doc.body?.cloneNode(true) as HTMLElement;
    if (!bodyClone) {
      return { hasArticle: false, context: '', highlightMap: {} };
    }

    // Remove elements that LLM cannot understand
    const elementsToRemove = bodyClone.querySelectorAll(
      'script, style, noscript, iframe, object, embed, svg, canvas, video, audio, map, picture, source'
    );
    elementsToRemove.forEach(el => el.remove());

    // Process images: replace with alt text or remove
    const images = bodyClone.querySelectorAll('img');
    images.forEach(img => {
      const alt = img.getAttribute('alt')?.trim();
      if (alt) {
        const textNode = doc.createTextNode(`[Image: ${alt}]`);
        img.parentNode?.replaceChild(textNode, img);
      } else {
        img.remove();
      }
    });

    // Remove hidden elements
    const allElements = bodyClone.querySelectorAll('*');
    allElements.forEach(el => {
      const style = (el as HTMLElement).style;
      if (style?.display === 'none' || style?.visibility === 'hidden') {
        el.remove();
      }
    });

    // Extract text content and clean up whitespace
    const textContent = bodyClone.innerText || bodyClone.textContent || '';
    const cleanedContent = textContent
      .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
      .replace(/[ \t]+/g, ' ')     // Reduce multiple spaces
      .trim();

    const truncatedContent = cleanedContent.length > 50000
      ? cleanedContent.substring(0, 50000) + '...(content truncated)'
      : cleanedContent;

    return {
      hasArticle: false,
      context: truncatedContent,
      highlightMap: {}
    };
  } catch (error) {
    console.error("Error getting page context:", error);
    return { hasArticle: false, context: '', highlightMap: {} };
  }
};

// Send message function
export const sendMessage = async (
  userMessageContent: string,
  messages: Message[],
  setMessages: (messages: Message[] | ((prevMessages: Message[]) => Message[])) => void,
  selectedModel: string,
  selectedLanguage: string,
  highlightMap: Record<string, string>,
  setLoading: (loading: boolean) => void,
  setHighlightMap?: (highlightMap: Record<string, string>) => void,
  onNoModelSelected?: () => void
) => {
  if (!userMessageContent.trim()) {
    return;
  }
  if (!selectedModel) {
    onNoModelSelected?.();
    return;
  }
  setLoading(true);

  // Add prompt based on selected language
  i18n.changeLanguage(selectedLanguage || i18n.language);
  const languagePrompt = i18n.t("languagePrompts.answerInLanguage");

  // Build messages
  const newMessagesForUI: Message[] = [
    ...messages,
    { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "user", content: userMessageContent, timestamp: Date.now() },
    { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), type: "assistant", content: "", timestamp: Date.now(), isGenerating: true }
  ];
  setMessages(newMessagesForUI);

  // Automatically detect page content and build context
  let aiInputText = `${languagePrompt}${userMessageContent}`;
  let shouldProcessRefs = false; // Whether to process REF references

  // Use highlightMap if exists; otherwise automatically detect page content
  if (Object.keys(highlightMap).length > 0) {
    aiInputText += "\n\nReference content:\n";
    Object.entries(highlightMap).forEach(([refId, text]) => {
      aiInputText += `[REF${refId}] ${text}\n`;
    });
    shouldProcessRefs = true;
  } else {
    // Automatically get page context
    const pageContext = await getPageContext(setHighlightMap);
    if (pageContext.context) {
      if (pageContext.hasArticle) {
        // Use REF format when article exists
        aiInputText += "\n\nPage article content:\n" + pageContext.context;
        shouldProcessRefs = true;
      } else {
        // Use HTML directly when no article, no need for REF processing
        aiInputText += "\n\nPage HTML content:\n" + pageContext.context;
        shouldProcessRefs = false;
      }
    }
  }

  // Add to message history
  const messagesForAI: any[] = [
    ...messages.map(msg => ({ role: msg.type === "user" ? "user" : "assistant", content: msg.content })),
    { role: "user", content: aiInputText }
  ];

  // Send to AI and process response
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
        // Process REF references only when article exists
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

// Clear chat history
export const clearChatHistory = async (setMessages: (messages: Message[]) => void, currentPageUrl: string) => {
  setMessages([]);
  if (currentPageUrl) {
    try {
      const browser = await waitForBrowser();
      await browser.storage.local.remove(`chat_history_${currentPageUrl}`);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  }
};

// Regenerate message
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
  // Find corresponding user message (user message before assistant message)
  if (messageIndex <= 0 || messages[messageIndex].type !== 'assistant') return;

  const userMessageIndex = messageIndex - 1;
  if (messages[userMessageIndex].type !== 'user') return;

  const userMessage = messages[userMessageIndex];

  // Delete all messages after the user message
  const newMessages = messages.slice(0, userMessageIndex);
  setMessages(newMessages);

  // Resend message
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

// Edit message and resend
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

  // Delete all messages after this message
  const newMessages = messages.slice(0, messageIndex);
  setMessages(newMessages);

  // Resend edited message
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

// Copy message content to clipboard
export const copyMessageToClipboard = async (content: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (error) {
    console.error('Failed to copy message:', error);
    return false;
  }
};

// Relabel page elements
export const relinkPageElements = async (highlightMap: Record<string, string>) => {
  if (!Object.keys(highlightMap).length) return;

  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true
    });
    const activeTab = tabs[0];

    if (activeTab && activeTab.id && isAccessibleUrl(activeTab.url)) {
      await browser.scripting.executeScript({
        target: { tabId: activeTab.id },
        func: (map: Record<string, string>) => {
          // Convert highlightMap to array for processing
          const elementsToRelink = Object.entries(map)
            .map(([index, text]) => ({ index, text }))
            .filter(el => el.text && el.text.length > 10);

          if (elementsToRelink.length > 0) {
            for (const elInfo of elementsToRelink) {
              // Find all possible tag types
              const possibleTags = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "blockquote", "pre"];
              for (const tag of possibleTags) {
                const candidates = document.querySelectorAll(tag);
                for (const candidate of Array.from(candidates)) {
                  if ((candidate as HTMLElement).innerText?.trim() === elInfo.text) {
                    // Only add when not already marked
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
