import { useState, useEffect, useCallback, useRef } from 'react';
import { browser } from "wxt/browser";
import { isAccessibleUrl, extractPageContent } from '../utils/pageContent';


export const useTextHighlighting = (isActive: boolean = true) => {
  const highlightingStatus = useRef<Record<string, number>>({});

  // Scroll to original text position
  const scrollToOriginalText = useCallback(async (refId: string) => {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true
      });
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        const now = Date.now();
        const endTime = highlightingStatus.current[refId] || 0;
        // Check if highlighting is still active (add 50ms buffer to be safe)
        const shouldHighlight = now > endTime + 50;
        
        if (shouldHighlight) {
          highlightingStatus.current[refId] = now + 2000;
        }

        await browser.scripting.executeScript({
          target: { tabId: activeTab.id },
          func: (id: string, shouldHighlight: boolean) => {
            const element = document.querySelector(
              `[data-summary-ref-id="${id}"]`
            ) as HTMLElement;
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              
              if (shouldHighlight) {
                const originalColor = element.style.backgroundColor;
                // Use a softer highlight color based on system theme
                const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                element.style.backgroundColor = isDarkMode ? '#7c3aed' : '#fef08a';
                setTimeout(() => {
                  element.style.backgroundColor = originalColor;
                }, 2000);
              }
            }
          },
          args: [refId, shouldHighlight]
        });
      }
    } catch (error) {
      console.error("Error scrolling to text:", error);
    }
  }, []);

  // Relabel page elements
  const relinkPageElements = useCallback(async (tabId: number) => {
    try {
      await extractPageContent(tabId, true);
    } catch (error) {
      console.error("Error relinking page elements:", error);
    }
  }, []);

  // Add click event listener for link clicks
  useEffect(() => {
    if (!isActive) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      let current: HTMLElement | null = target;
      while (current && !current.classList.contains("summary-link")) {
        current = current.parentElement;
      }

      if (current && current.classList.contains("summary-link")) {
        // Check if the click happened within the container of this hook instance
        // But since we can't easily check React component boundaries from DOM event,
        // we rely on the fact that only the visible ChatSession should be responding.
        // However, with multiple hooks active, they all run this.
        // We should probably rely on an isActive prop or similar.
        // For now, let's just proceed. The scrollToOriginalText targets the active tab.
        // If multiple hooks run this, they just do redundant work.
        // To prevent redundancy, we can check if the event was already handled?
        if (event.defaultPrevented) return;
        
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

  // Cleanup page element reference attributes
  // In multi-session mode, we should NOT remove attributes when the hook unmounts
  // because the page might still be open and we want to keep the references.
  // Also, removing attributes from the "active" tab when a background session unmounts is dangerous.
  /*
  useEffect(() => {
    const removeAttributes = async () => {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.id && isAccessibleUrl(tabs[0].url)) {
          await browser.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
              // Only remove attributes if there are no active references
              // This prevents removing attributes that are still needed
              const hasActiveReferences = document.querySelectorAll(".summary-link").length > 0;
              if (!hasActiveReferences) {
                document
                  .querySelectorAll("[data-summary-ref-id]")
                  .forEach((el) => {
                    el.removeAttribute("data-summary-ref-id");
                  });
              }
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
  */

  return {
    scrollToOriginalText,
    relinkPageElements
  };
};
