import React, { useRef, useEffect, useState } from 'react';
import MessageList from './MessageList';
import type { Message } from '../types/index';

interface ChatBodyProps {
  messages: Message[];
  loading: boolean;
  t: (key: string) => string;
  onCopy?: (content: string) => void;
  onEdit?: (index: number, content: string) => void;
  onRegenerate?: (index: number) => void;
  onStopGeneration?: () => void;
}

const ChatBody: React.FC<ChatBodyProps> = ({
  messages,
  loading,
  t,
  onCopy,
  onEdit,
  onRegenerate,
  onStopGeneration
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);

  // 当消息变化或加载状态变化时，滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // 计算匹配数量
  useEffect(() => {
    if (searchTerm.trim()) {
      const count = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      ).length;
      setMatchCount(count);
    } else {
      setMatchCount(0);
    }
  }, [searchTerm, messages]);

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '8px',
      border: '1px solid #e5e7eb',
    },
    searchInput: {
      flex: 1,
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '14px',
      outline: 'none',
      padding: '4px',
    },
    searchButton: {
      padding: '6px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      transition: 'background-color 0.2s',
    },
    searchCount: {
      fontSize: '12px',
      color: '#6b7280',
      whiteSpace: 'nowrap' as const,
    },
    messageContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      paddingRight: '8px',
    },
    stopButton: {
      display: 'flex',
      justifyContent: 'center',
      padding: '8px 0',
    },
    stopButtonInner: {
      padding: '8px 16px',
      backgroundColor: '#ef4444',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'background-color 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      {/* 搜索栏 */}
      {showSearch ? (
        <div style={styles.searchBar}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            style={styles.searchInput}
            placeholder={t('placeholders.search') || '搜索消息...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <span style={styles.searchCount}>
              {matchCount} {t('labels.matches') || '条匹配'}
            </span>
          )}
          <button
            style={styles.searchButton}
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
            title={t('buttons.close') || '关闭'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4px' }}>
          <button
            style={styles.searchButton}
            onClick={() => setShowSearch(true)}
            title={t('buttons.search') || '搜索'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      )}

      {/* 消息列表 */}
      <div ref={containerRef} style={styles.messageContainer}>
        <MessageList
          messages={messages}
          loading={loading}
          t={t}
          searchTerm={searchTerm}
          onCopy={onCopy}
          onEdit={onEdit}
          onRegenerate={onRegenerate}
        />
      </div>

      {/* 停止生成按钮 */}
      {loading && onStopGeneration && (
        <div style={styles.stopButton}>
          <button
            style={styles.stopButtonInner}
            onClick={onStopGeneration}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ef4444';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
            {t('buttons.stopGenerating') || '停止生成'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBody;
