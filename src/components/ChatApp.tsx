import React, { useState, useEffect } from "react"

// Import hooks
import { useHostPermission } from '../hooks/useHostPermission';
import { useTheme } from '../hooks/useTheme';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useProviderConfig } from '../hooks/useProviderConfig';

// Import components
import { SettingsPanel, PermissionRequest, ChatPanel } from "./index";

// Error boundary component
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error in ChatApp:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function ChatApp() {
  const [showSettings, setShowSettings] = useState(false);
  const { loaded: providerLoaded, selectedProvider } = useProviderConfig();
  const { loaded: permissionLoaded, hasPermission, isRequesting, requestPermission } = useHostPermission();

  // Theme and styles
  const { colors, themeMode, setThemeMode } = useTheme();
  useGlobalStyles(colors);

  useEffect(() => {
    setShowSettings(!selectedProvider);
  }, [selectedProvider]);

  // 1. Loading Guard
  // 当配置或权限还没加载完时，直接返回 null。
  // 因为读取本地 IndexedDB 极快，用户几乎感觉不到空白，直接看到最终界面。
  // 这避免了 "默认显示ChatPanel -> 突然跳到Settings" 的闪屏问题。
  if (!providerLoaded || !permissionLoaded) {
    return null;
  }

  // 2. Permission Check
  if (!hasPermission) {
    return (
      <PermissionRequest
        requestPermission={requestPermission}
        isRequesting={isRequesting}
      />
    );
  }

  // 3. Configuration Check
  if (showSettings) {
    return <SettingsPanel hasClose={false} onClose={() => setShowSettings(false)} colors={colors} themeMode={themeMode} setThemeMode={setThemeMode}  />;
  }

  // 4. Main UI
  return <ChatPanel />;
}

export default ChatApp;
