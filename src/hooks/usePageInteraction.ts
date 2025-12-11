import { useState, useEffect, useCallback } from 'react';
import * as browser from "webextension-polyfill";
import type { Message } from '../types/index';

export interface Chunk {
  text: string;
  html: string;
}

export const usePageInteraction = (messages: Message[]) => {
  const [currentPageUrl, setCurrentPageUrl] = useState<string>('');
  const [pageContent, setPageContent] = useState<string>('');
  const [pageChunks, setPageChunks] = useState<Chunk[]>([]);

  // 获取当前页面URL
  useEffect(() => {
    const getCurrentPageUrl = async () => {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.url) {
          setCurrentPageUrl(tabs[0].url);
        }
      } catch (error) {
        console.error('Error getting current page URL:', error);
      }
    };

    getCurrentPageUrl();

    // 监听标签页变化
    const onTabUpdated = async (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.status === 'complete' && tab.active) {
        setCurrentPageUrl(tab.url || '');
      }
    };

    browser.tabs.onUpdated.addListener(onTabUpdated);

    return () => {
      browser.tabs.onUpdated.removeListener(onTabUpdated);
    };
  }, []);

  // 清除页面元素引用属性
  useEffect(() => {
    const removeAttributes = async () => {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        
        // 添加详细的错误检查
        if (!tabs || tabs.length === 0) {
          console.log('No active tabs found');
          return;
        }
        
        const activeTab = tabs[0];
        if (!activeTab) {
          console.log('Active tab is undefined');
          return;
        }
        
        if (!activeTab.id) {
          console.log('Active tab has no ID');
          return;
        }
        
        await browser.scripting.executeScript({
          target: { tabId: activeTab.id, allFrames: true },
          func: () => {
            try {
              const elements = document.querySelectorAll('[data-chat-with-page-id]');
              elements.forEach(element => {
                element.removeAttribute('data-chat-with-page-id');
              });
              console.log(`Removed attributes from ${elements.length} elements`);
            } catch (error) {
              console.error('Error in executeScript func:', error);
            }
          }
        });
      } catch (error) {
        console.error('Error removing attributes:', error);
        console.error('Error details:', JSON.stringify(error));
      }
    };

    removeAttributes();

    return () => {
      removeAttributes();
    };
  }, []);

  // 滚动到原始文本位置
  const scrollToOriginalText = useCallback((element: HTMLElement | undefined) => {
    if (!element) return;

    try {
      // 移除所有现有高亮
      const existingHighlights = document.querySelectorAll('.chat-with-page-highlight');
      existingHighlights.forEach(highlight => {
        highlight.classList.remove('chat-with-page-highlight');
      });

      // 高亮目标元素
      element.classList.add('chat-with-page-highlight');

      // 滚动到目标元素
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });

      // 3秒后移除高亮
      setTimeout(() => {
        element.classList.remove('chat-with-page-highlight');
      }, 3000);
    } catch (error) {
      console.error('Error scrolling to original text:', error);
    }
  }, []);

  // 重新标记页面元素
  const relinkPageElements = useCallback(async () => {
    try {
      if (messages.length === 0) return;

      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]?.id) return;
      const tabId = tabs[0].id;

      await browser.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: () => {
          // 移除所有现有标记
          const elements = document.querySelectorAll('[data-chat-with-page-id]');
          elements.forEach(element => {
            element.removeAttribute('data-chat-with-page-id');
          });
        }
      });

      // 为每个消息中的引用重新标记元素
      for (const message of messages) {
        if (message.references && Array.isArray(message.references)) {
          for (const reference of message.references) {
            try {
              await browser.scripting.executeScript({
                target: { tabId, allFrames: true },
                func: (originalText: string) => {
                  const xpath = `//*[contains(text(), '${originalText.replace(/'/g, "\\'")}')]`;
                  const elements = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                  
                  if (elements.snapshotLength > 0) {
                    const element = elements.snapshotItem(0) as HTMLElement;
                    element.setAttribute('data-chat-with-page-id', `ref-${originalText.substring(0, 10)}`);
                  }
                },
                args: [reference.originalText]
              });
            } catch (error) {
              console.error('Error relinking element:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error relinking page elements:', error);
    }
  }, [messages]);

  // 当消息列表变化时，重新标记页面元素
  useEffect(() => {
    const delayRelink = setTimeout(() => {
      relinkPageElements();
    }, 1000);

    return () => clearTimeout(delayRelink);
  }, [messages, relinkPageElements]);

  // 获取页面内容
  const getPageContent = useCallback(async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return null;

      const result = await browser.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          return document.body.innerText;
        }
      });

      if (result && result[0]?.result) {
        const content = result[0].result as string;
        setPageContent(content);
        return content;
      }
      return null;
    } catch (error) {
      console.error('Error getting page content:', error);
      return null;
    }
  }, []);

  // 获取页面分块内容
  const getPageChunks = useCallback(async () => {
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return [];

      const result = await browser.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          const chunks: { text: string; html: string }[] = [];
          const paragraphs = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
          
          paragraphs.forEach(elem => {
            const text = elem.textContent?.trim() || '';
            if (text.length > 50) {
              chunks.push({
                text,
                html: elem.outerHTML
              });
            }
          });
          
          return chunks;
        }
      });

      if (result && result[0]?.result) {
        const chunks = result[0].result as Chunk[];
        setPageChunks(chunks);
        return chunks;
      }
      return [];
    } catch (error) {
      console.error('Error getting page chunks:', error);
      return [];
    }
  }, []);

  return {
    currentPageUrl,
    pageContent,
    pageChunks,
    scrollToOriginalText,
    relinkPageElements,
    getPageContent,
    getPageChunks
  };
};
