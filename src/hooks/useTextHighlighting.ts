import { useState, useEffect, useCallback } from 'react';
import * as browser from "webextension-polyfill";
import type { Message } from '../types/index';

export const useTextHighlighting = (messages: Message[]) => {
  const [highlightMap, setHighlightMap] = useState<Record<string, string>>({});

  // 滚动到原始文本位置
  const scrollToOriginalText = useCallback(async (refId: string) => {
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
  }, []);

  // 重新标记页面元素
  const relinkPageElements = useCallback(async () => {
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
  }, [highlightMap]);

  // 添加点击事件监听器，处理链接点击
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      let current: HTMLElement | null = target;
      while (current && !current.classList.contains("summary-link")) {
        current = current.parentElement;
      }

      if (current && current.classList.contains("summary-link")) {
        event.preventDefault();
        const refId = current.dataset.refId;
        if (refId) {
          scrollToOriginalText(refId);
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [scrollToOriginalText]);

  // 当聊天记录加载时重新标记页面元素
  useEffect(() => {
    if (messages.length > 0) {
      // 延迟执行，确保页面已经加载完成
      const timer = setTimeout(() => {
        relinkPageElements();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, highlightMap, relinkPageElements]);

  // 清理页面元素引用属性
  useEffect(() => {
    const removeAttributes = async () => {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id) {
          await browser.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              document
                .querySelectorAll("[data-summary-ref-id]")
                .forEach((el) => {
                  el.removeAttribute("data-summary-ref-id");
                });
            }
          });
        }
      } catch (error) {
        console.error("Error removing attributes:", error);
      }
    };

    return () => {
      removeAttributes();
    };
  }, []);

  return {
    highlightMap,
    setHighlightMap,
    scrollToOriginalText,
    relinkPageElements
  };
};
