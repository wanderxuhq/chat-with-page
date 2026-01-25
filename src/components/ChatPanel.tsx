import React, { useState, useEffect, useCallback, useMemo } from "react"
import { browser } from "wxt/browser";

// Import hooks
import { usePageInteraction } from '../hooks/usePageInteraction';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useTheme } from '../hooks/useTheme';

// Import components
import { ChatHeader, ChatBody, ChatFooter, ChatHistoryList, SettingsPanel } from "./index";
import { ChatProvider } from '../contexts/ChatContext';
import { ModelProvider } from "@/contexts/ModelContext";

interface ChatSessionProps {
  url: string;
  title?: string;
  isActive: boolean;
  onShowSettings: (show: boolean) => void;
  isHistoryOpen: boolean;
  onShowHistory: (show: boolean) => void;
}

const ChatSession: React.FC<ChatSessionProps> = ({ 
  url, 
  title, 
  isActive, 
  onShowSettings, 
  isHistoryOpen,
  onShowHistory 
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
      <ChatProvider initialPageUrl={url} currentPageTitle={title}>
        <ChatHeader
          showSettings={false} 
          setShowSettings={onShowSettings}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showHistory={isHistoryOpen} 
          setShowHistory={onShowHistory}
        />

        <ChatBody
          searchTerm={searchTerm}
        />

        <ChatFooter />
      </ChatProvider>
    </div>
  );
};

// Main chat content component
export default function ChatPanel() {
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Theme and styles
  const { colors } = useTheme();
  useGlobalStyles(colors);

  // Page interaction - used to determine which session is active
  const { currentUrl, currentPageTitle } = usePageInteraction();

  // Session management
  const [activeSessions, setActiveSessions] = useState<{url: string, title?: string}[]>([]);
  
  // Local cache of tab states to avoid full re-scans on every event
  // We use a Ref so it's stable across renders and doesn't trigger re-renders itself
  const tabsMapRef = React.useRef<Map<number, {url: string, title?: string}>>(new Map());
  
  // Also keep current page info in a ref for access inside stable event handlers
  const currentInfoRef = React.useRef({ url: currentUrl, title: currentPageTitle });

  // Update ref when props change
  useEffect(() => {
    currentInfoRef.current = { url: currentUrl, title: currentPageTitle };
    updateSessions(); // Trigger update immediately
  }, [currentUrl, currentPageTitle]);

  // Core logic to derive unique sessions from local state
  const updateSessions = useCallback(() => {
    const uniqueSessions = new Map<string, string | undefined>();
    
    // 1. Add sessions from known tabs
    for (const tab of tabsMapRef.current.values()) {
        if (tab.url && !uniqueSessions.has(tab.url)) {
            uniqueSessions.set(tab.url, tab.title);
        }
    }

    // 2. Ensure current session is always present (priority)
    const { url, title } = currentInfoRef.current;
    if (url && !uniqueSessions.has(url)) {
        uniqueSessions.set(url, title);
    }

    setActiveSessions(Array.from(uniqueSessions.entries()).map(([u, t]) => ({ url: u, title: t })));
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
        backgroundColor: colors.bgPrimary,
        transition: 'background-color 0.2s',
      }}
    >
      {showSettings ? (
        <SettingsPanel hasClose={true} onClose={() => setShowSettings(false)} />
      ) : (
        <ModelProvider>
          {activeSessions.map(session => (
            <ChatSession
              key={session.url}
              url={session.url}
              title={session.title}
              isActive={session.url === currentUrl}
              onShowSettings={setShowSettings}
              isHistoryOpen={showHistory}
              onShowHistory={setShowHistory}
            />
          ))}

          {showHistory && (
            <ChatHistoryList
              currentUrl={currentUrl}
              onClose={() => setShowHistory(false)}
            />
          )}
        </ModelProvider>
      )}
    </div>
  );
}
