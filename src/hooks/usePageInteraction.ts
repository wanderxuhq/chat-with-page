import { useState, useEffect, useRef } from 'react';
import { browser } from 'wxt/browser';

export const usePageInteraction = () => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('');
  const previousUrlRef = useRef<string>('');
  const activeTabIdRef = useRef<number | null>(null);

  // Get current page URL
  useEffect(() => {
    const getCurrentPageUrl = async () => {
      try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.url) {
          const newUrl = tabs[0].url;
          const newTitle = tabs[0].title || '';
          previousUrlRef.current = newUrl;
          if (tabs[0].id) {
            activeTabIdRef.current = tabs[0].id;
          }
          setCurrentUrl(newUrl);
          setCurrentPageTitle(newTitle);
        }
      } catch (error) {
        console.warn('Failed to get current page URL:', error);
      }
    };

    getCurrentPageUrl();

    // Listen for tab updates (URL changes)
    const onTabUpdated = async (tabId: number, changeInfo: any, tab: any) => {
      if (changeInfo.status === 'complete' && tab.active) {
        const newUrl = tab.url || '';
        const newTitle = tab.title || '';
        previousUrlRef.current = newUrl;
        setCurrentUrl(newUrl);
        setCurrentPageTitle(newTitle);
      }
    };

    // Listen for tab activation (switching to another tab)
    const onTabActivated = async (activeInfo: Browser.tabs.OnActivatedInfo) => {
      activeTabIdRef.current = activeInfo.tabId;
      try {
        const tab = await browser.tabs.get(activeInfo.tabId);
        
        if (activeTabIdRef.current !== activeInfo.tabId) return;

        if (tab?.url) {
          const newUrl = tab.url;
          const newTitle = tab.title || '';
          previousUrlRef.current = newUrl;
          setCurrentUrl(newUrl);
          setCurrentPageTitle(newTitle);
        }
      } catch (error) {
        console.warn('Failed to handle tab activation:', error);
      }
    };

    // Check if tabs API is available
    if (browser.tabs && browser.tabs.onUpdated && browser.tabs.onActivated) {
      browser.tabs.onUpdated.addListener(onTabUpdated);
      browser.tabs.onActivated.addListener(onTabActivated);

      return () => {
        browser.tabs.onUpdated.removeListener(onTabUpdated);
        browser.tabs.onActivated.removeListener(onTabActivated);
      };
    }

    return () => {};
  }, []);

  return {
    currentUrl,
    currentPageTitle,
  };
};