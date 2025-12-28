import React, { useRef, useEffect } from 'react';
import MessageList from './MessageList';
import type { Message } from '../types/index';
import type { ThemeColors } from '../hooks/useTheme';

interface ChatBodyProps {
  messages: Message[];
  loading: boolean;
  t: (key: string) => string;
  searchTerm?: string;
  onCopy?: (content: string) => void;
  onEdit?: (index: number, content: string) => void;
  onRegenerate?: (index: number) => void;
  onStopGeneration?: () => void;
  colors: ThemeColors;
}

const ChatBody: React.FC<ChatBodyProps> = ({
  messages,
  loading,
  t,
  searchTerm = '',
  onCopy,
  onEdit,
  onRegenerate,
  onStopGeneration,
  colors
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 当消息变化或加载状态变化时，滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const styles = {
    container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
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
      backgroundColor: colors.danger,
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
          colors={colors}
        />
      </div>

      {/* 停止生成按钮 */}
      {loading && onStopGeneration && (
        <div style={styles.stopButton}>
          <button
            style={styles.stopButtonInner}
            onClick={onStopGeneration}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.dangerHover;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.danger;
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
