import React, { useState, useEffect, useCallback, useMemo } from "react"
import { browser } from "wxt/browser";

// Import hooks
import { usePageInteraction } from '../hooks/usePageInteraction';
import { useTheme } from '../hooks/useTheme';

// Import components
import { ChatHeader, ChatBody, ChatFooter, ChatHistoryList, SettingsPanel } from "./index";
import { ChatProvider } from '../contexts/ChatContext';
import { ModelProvider } from "@/contexts/ModelContext";

interface ChatSessionProps {
  url: string;
  title?: string;
  tabId: number;
  isActive: boolean;
  onShowSettings: (show: boolean) => void;
  isHistoryOpen: boolean;
  onShowHistory: (show: boolean) => void;
  colors: ThemeColors;
}

const ChatSession: React.FC<ChatSessionProps> = ({ 
  url, 
  title, 
  tabId,
  isActive, 
  onShowSettings, 
  isHistoryOpen,
  onShowHistory,
  colors,
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div 
      style={{ 
        display: isActive ? 'flex' : 'none', 
        flexDirection: 'column', 
        height: '100%', 
        width: '100%' 
      }}
    >
      <ChatProvider initialPageUrl={url} currentPageTitle={title} initialTabId={tabId}>
        <ChatHeader
          showSettings={false} 
          setShowSettings={onShowSettings}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showHistory={isHistoryOpen} 
          setShowHistory={onShowHistory}
          colors={colors}
        />

        <ChatBody
          searchTerm={searchTerm}
          colors={colors}
        />

        <ChatFooter colors={colors} />
      </ChatProvider>
    </div>
  );
};

// Main chat content component
export default function ChatPanel() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Theme and styles
  const { colors, themeMode, setThemeMode } = useTheme();

  // Page interaction - used to determine which session is active
  const { currentUrl, currentPageTitle, currentTabId } = usePageInteraction();

  // Session management
  const [activeSessions, setActiveSessions] = useState<{url: string, title?: string, tabId: number}[]>([]);
  
  // Local cache of tab states to avoid full re-scans on every event
  // We use a Ref so it's stable across renders and doesn't trigger re-renders itself
  const tabsMapRef = React.useRef<Map<number, {url: string, title?: string}>>(new Map());
  
  // Also keep current page info in a ref for access inside stable event handlers
  const currentInfoRef = React.useRef({ url: currentUrl, title: currentPageTitle, tabId: currentTabId });

  // Update ref when props change
  useEffect(() => {
    currentInfoRef.current = { url: currentUrl, title: currentPageTitle, tabId: currentTabId };
    updateSessions(); // Trigger update immediately
  }, [currentUrl, currentPageTitle, currentTabId]);

  // Core logic to derive unique sessions from local state
  const updateSessions = useCallback(() => {
    const uniqueSessions = new Map<string, {title?: string, tabId: number}>();
    
    // 1. Add sessions from known tabs
    for (const [tabId, tab] of tabsMapRef.current.entries()) {
        if (tab.url) {
            const existing = uniqueSessions.get(tab.url);
            
            // Logic to determine which tab ID to use for a session:
            // 1. !existing: First time seeing this URL -> Use this tab's ID.
            // 2. tabId === currentInfoRef.current.tabId: URL already exists (from another tab), 
            //    but THIS tab is the active one -> Overwrite to use this active tab's ID.
            // This ensures AI reads content from the tab the user is actually looking at.
            if (!existing || tabId === currentInfoRef.current.tabId) {
                uniqueSessions.set(tab.url, { title: tab.title, tabId });
            }
        }
    }

    // 2. Ensure current session is always present (priority)
    const { url, title, tabId } = currentInfoRef.current;
    if (url && tabId) {
        // Always force update current session to use the active tab ID
        // This ensures that when we switch tabs with same URL, we switch to the active tab ID
        uniqueSessions.set(url, { title, tabId });
    }

    setActiveSessions(Array.from(uniqueSessions.entries()).map(([u, info]) => ({ url: u, title: info.title, tabId: info.tabId })));
  }, []);

  // Initialize and listen to events
  useEffect(() => {
    if (!browser.tabs) return;

    // Initial population - run ONLY ONCE on mount to get initial state
    browser.tabs.query({}).then(tabs => {
        tabs.forEach(tab => {
            if (tab.id && tab.url) {
                tabsMapRef.current.set(tab.id, { url: tab.url, title: tab.title });
            }
        });
        updateSessions();
    }).catch(console.error);

    // Event handlers that update local cache incrementally
    // These handlers use the event data directly and do NOT query all tabs
    const onTabUpdated = (tabId: number, changeInfo: any, tab: any) => {
        // Optimization: Only update if URL or Title actually changed or if it's a complete load
        // This prevents excessive updates during loading progress
        if (changeInfo.url || changeInfo.title || changeInfo.status === 'complete') {
            if (tab.url) {
                tabsMapRef.current.set(tabId, { url: tab.url, title: tab.title });
                updateSessions();
            }
        }
    };

    const onTabRemoved = (tabId: number) => {
        tabsMapRef.current.delete(tabId);
        updateSessions();
    };

    browser.tabs.onUpdated.addListener(onTabUpdated);
    browser.tabs.onRemoved.addListener(onTabRemoved);

    return () => {
        browser.tabs.onUpdated.removeListener(onTabUpdated);
        browser.tabs.onRemoved.removeListener(onTabRemoved);
    };
  }, [updateSessions]);

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
        margin: 0,
        transition: 'background-color 0.2s',
      }}
    >
      {showSettings ? (
        <SettingsPanel colors={colors} themeMode={themeMode} setThemeMode={setThemeMode} hasClose={true} onClose={() => setShowSettings(false)} />
      ) : (
        <ModelProvider>
          {activeSessions.map(session => (
            <ChatSession
              key={session.url}
              url={session.url}
              title={session.title}
              tabId={session.tabId}
              isActive={session.url === currentUrl}
              onShowSettings={setShowSettings}
              isHistoryOpen={showHistory}
              onShowHistory={setShowHistory}
              colors={colors}
            />
          ))}

          {showHistory && (
            <ChatHistoryList
              currentUrl={currentUrl}
              onClose={() => setShowHistory(false)}
              colors={colors}
            />
          )}
        </ModelProvider>
      )}
    </div>
  );
}
