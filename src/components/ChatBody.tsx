import React, { useRef, useEffect, useMemo } from 'react';
import { MessageList } from './index';
import { useChat } from '../contexts/ChatContext';
import { useTheme } from '../hooks/useTheme';
import { useLanguageManagement } from '../hooks/useLanguageManagement';

interface ChatBodyProps {
  searchTerm?: string;
}

const ChatBody: React.FC<ChatBodyProps> = ({
  searchTerm = ''
}) => {
  const { messages, stopGeneration, isLoading, lastMessage } = useChat();
  const { colors } = useTheme();
  const { t } = useLanguageManagement();
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine if we should show the loading dots (thinking state)
  // Show dots only when loading but no message has started streaming yet
  const showLoadingDots = isLoading && !lastMessage;

  // Determine if we should show the stop button
  const showStopButton = isLoading;

  // Scroll to bottom when messages or loading state change
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, showLoadingDots, lastMessage]);

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
      {/* Message list */}
      <div ref={containerRef} style={styles.messageContainer}>
        <MessageList
          isGenerating={showLoadingDots}
          searchTerm={searchTerm}
        />
      </div>

      {/* Stop generating button */}
      {showStopButton && (
        <div style={styles.stopButton}>
          <button
            style={styles.stopButtonInner}
            onClick={stopGeneration}
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
            {t('buttons.stopGenerating')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatBody;
