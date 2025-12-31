import { useState, useEffect, useCallback, useRef } from 'react';
import { browser } from '../utils/browserApi';
import type { Message } from '../types/index';

export const useTextHighlighting = (messages: Message[], currentPageUrl?: string) => {
  const [highlightMap, setHighlightMap] = useState<Record<string, string>>({});
  const previousUrlRef = useRef<string>('');

  // Clear highlightMap when URL changes
  useEffect(() => {
    if (currentPageUrl && currentPageUrl !== previousUrlRef.current) {
      if (previousUrlRef.current) {
        // URL changed, clear the highlight map
        setHighlightMap({});
      }
      previousUrlRef.current = currentPageUrl;
    }
  }, [currentPageUrl]);

  // Scroll to original text position
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
              // Use a softer highlight color based on system theme
              const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
              element.style.backgroundColor = isDarkMode ? '#7c3aed' : '#fef08a';
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

  // Relabel page elements
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
  }, [highlightMap]);

  // Add click event listener for link clicks
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

  // Relabel page elements when chat history loads
  useEffect(() => {
    if (messages.length > 0) {
      // Delay execution to ensure page is loaded
      const timer = setTimeout(() => {
        relinkPageElements();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages, highlightMap, relinkPageElements]);

  // Cleanup page element reference attributes
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
