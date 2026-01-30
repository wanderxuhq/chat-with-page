import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import ModelSelector from './ModelSelector';
import { isAccessibleUrl } from '../utils/pageContent';

  interface ChatFooterProps {
    colors: ThemeColors;
  }

const ChatFooter: React.FC<ChatFooterProps> = ({ colors }) => {
  const { currentPageUrl, sendMessage, isLoading, selectedModel } = useChat();
  const { t } = useLanguageManagement();
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [input, setInput] = useState<string>('');
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (selectedModel && pendingMessage && !isLoading && !isSubmittingRef.current) {
      // Mark as submitting to prevent duplicate submissions
      isSubmittingRef.current = true;

      sendMessage(pendingMessage);
      setPendingMessage(null);

      // Reset submitting flag after a short delay to ensure UI has updated
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 100);
    }
  }, [selectedModel, sendMessage, isLoading, pendingMessage]);

  const handleSendMessage = () => {
    if (invokeSendMessage(input)) {
      setInput('');
    }
  };
  const handleSummarizePage = () => invokeSendMessage(t('prompts.summarizePage'));

  const invokeSendMessage = (message: string): boolean => {
    if (isLoading || isSubmittingRef.current) return false;

    setPendingMessage(message);

    if (!selectedModel) {
      // Store the pending message and open model selector
      setShowModelSelector(true);
      return true;
    }
    return true;
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      padding: '8px 0',
      borderTop: `1px solid ${colors.borderSecondary}`,
    },
    inputRow: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      minWidth: '0',
      padding: '10px 12px',
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: '8px',
      backgroundColor: colors.bgInput,
      color: colors.textPrimary,
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    iconButton: {
      width: '36px',
      height: '36px',
      padding: '0',
      backgroundColor: colors.bgTertiary,
      border: `1px solid ${colors.borderSecondary}`,
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      color: colors.textMuted,
      flexShrink: 0,
    },
    sendButton: {
      width: '36px',
      height: '36px',
      padding: '0',
      backgroundColor: colors.primary,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
      flexShrink: 0,
    },
  };

  return (
    <div style={styles.container}>
      {/* Input row */}
      <div style={styles.inputRow}>
        {/* Model selector */}
        {showModelSelector ? (
          <ModelSelector
            setShowModelSelector={setShowModelSelector}
            setPendingMessage={setPendingMessage}
            colors={colors}
          />
        ) : (
          <button
            onClick={() => {
              setShowModelSelector(true);
            }}
            style={styles.iconButton}
            title={`${t('labels.model')}: ${selectedModel}`}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgHover;
              e.currentTarget.style.color = colors.textSecondary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgTertiary;
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </button>
        )}

        {/* Summarize page button */}
        <button
          onClick={handleSummarizePage}
          style={{
            ...styles.iconButton,
            opacity: (isLoading || !isAccessibleUrl(currentPageUrl)) ? 0.6 : 1,
            cursor: (isLoading || !isAccessibleUrl(currentPageUrl)) ? 'not-allowed' : 'pointer',
          }}
          title={t('buttons.chatWithPage')}
          disabled={isLoading || !isAccessibleUrl(currentPageUrl)}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = colors.infoLight;
              e.currentTarget.style.color = colors.info;
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = colors.bgTertiary;
              e.currentTarget.style.color = colors.textMuted;
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </button>

        {/* Input box */}
        <input
          type="text"
          value={input}
          onChange={(e) => !isLoading && setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) {
              handleSendMessage();
            }
          }}
          onFocus={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = colors.borderFocus;
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primaryLight}`;
            }
          }}
          onBlur={(e) => {
            if (!isLoading) {
              e.currentTarget.style.borderColor = colors.borderPrimary;
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
          style={{
            ...styles.input,
            opacity: isLoading ? 0.6 : 1,
            cursor: isLoading ? 'not-allowed' : 'text',
          }}
          placeholder={t('placeholders.enterMessage')}
          disabled={isLoading}
        />

        {/* Send button */}
        <button
          onClick={handleSendMessage}
          style={{
            ...styles.sendButton,
            opacity: (isLoading || !isAccessibleUrl(currentPageUrl)) ? 0.6 : 1,
            cursor: (isLoading || !isAccessibleUrl(currentPageUrl)) ? 'not-allowed' : 'pointer',
          }}
          title={t('send')}
          disabled={isLoading || !isAccessibleUrl(currentPageUrl)}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = colors.primaryHover;
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = colors.primary;
            }
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatFooter;