import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { processAIOutput } from '../utils/aiOutput';
import { copyMessageToClipboard } from '../utils/messageUtils';
import type { Message } from '../types/index';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { useChat } from '../contexts/ChatContext';

interface MessageProps {
  message: Message;
  searchTerm?: string;
  editingId: string | null;
  editContent: string;
  copiedId: string | null;
  hoveredId: string | null;
  setEditingId: (id: string | null) => void;
  setEditContent: (content: string) => void;
  setCopiedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  handleSaveEdit: (messageId: string) => void;
  handleCancelEdit: () => void;
  colors: ThemeColors;
}

const Message: React.FC<MessageProps> = ({
  message,
  searchTerm = '',
  editingId: editingIndex,
  editContent,
  copiedId,
  hoveredId,
  setEditingId: setEditingIndex,
  setEditContent,
  setCopiedId,
  setHoveredId,
  handleSaveEdit,
  handleCancelEdit,
  colors
}) => {
  const { t } = useLanguageManagement();
  const { regenerateMessage } = useChat();
  const [parsedContent, setParsedContent] = useState<string>('');

  useEffect(() => {
    const parseContent = async () => {
      if (message.content) {
        try {
          const parsed = processAIOutput(await marked.parse(message.content));
          setParsedContent(parsed);
        } catch (error) {
          console.error('Error parsing markdown:', error);
          setParsedContent(message.content); // 出错时使用原始内容
        }
      }
    };

    parseContent();
  }, [message.content]);

  const styles = {
    messageWrapper: (isUser: boolean) => ({
      marginBottom: '12px',
      textAlign: isUser ? 'right' as const : 'left' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    }),
    messageBubble: (isUser: boolean, isHighlighted: boolean) => ({
      display: 'inline-block',
      padding: '10px 14px',
      borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
      backgroundColor: isHighlighted ? colors.warningLight : (isUser ? colors.bgUserMessage : colors.bgMessage),
      color: isUser ? colors.textUserMessage : colors.textPrimary,
      maxWidth: '85%',
      boxShadow: `0 1px 2px ${colors.shadowLight}`,
      fontSize: '14px',
      lineHeight: '1.5',
      wordBreak: 'break-word' as const,
      border: isHighlighted ? `2px solid ${colors.warning}` : 'none',
    }),
    actionBar: {
      display: 'flex',
      gap: '4px',
      marginTop: '4px',
      height: '24px',
      minHeight: '24px',
    },
    actionBarPlaceholder: {
      height: '24px',
      minHeight: '24px',
      marginTop: '4px',
    },
    actionButton: {
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '12px',
      color: colors.textMuted,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s, color 0.2s',
    },
    editTextarea: {
      width: '80%',
      minHeight: '80px',
      padding: '10px 14px',
      borderRadius: '12px',
      border: `2px solid ${colors.primary}`,
      fontSize: '14px',
      lineHeight: '1.5',
      resize: 'vertical' as const,
      outline: 'none',
      fontFamily: 'inherit',
      backgroundColor: colors.bgInput,
      color: colors.textPrimary,
    },
    editActions: {
      display: 'flex',
      gap: '8px',
      marginTop: '8px',
    },
    editButton: {
      padding: '6px 12px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: 500,
    },
  };

  const handleCopy = async (content: string, messageId: string) => {
    await copyMessageToClipboard(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (messageId: string, content: string) => {
    setEditingIndex(messageId);
    setEditContent(content);
  };

  const highlightSearchTerm = (content: string, term: string): string => {
    if (!term.trim()) return content;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, `<mark style="background-color: ${colors.warningLight}; padding: 1px 2px; border-radius: 2px;">$1</mark>`);
  };

  const isMessageHighlighted = (content: string): boolean => {
    if (!searchTerm.trim()) return false;
    return content.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div
      style={styles.messageWrapper(message.role === "user")}
      onMouseEnter={() => setHoveredId(message.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      {editingIndex === message.id ? (
        <div style={{ width: '85%' }}>
          <textarea
            style={styles.editTextarea}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div style={styles.editActions}>
            <button
              style={{ ...styles.editButton, backgroundColor: colors.primary, color: 'white' }}
              onClick={() => handleSaveEdit(message.id)}
            >
              {t('buttons.save')}
            </button>
            <button
              style={{ ...styles.editButton, backgroundColor: colors.bgHover, color: colors.textPrimary }}
              onClick={handleCancelEdit}
            >
              {t('buttons.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div
            className={`message-content ${message.role === "user" ? "user-message" : ""}`}
            style={styles.messageBubble(message.role === "user", isMessageHighlighted(message.content))}
            dangerouslySetInnerHTML={{
              __html: searchTerm
                ? highlightSearchTerm(parsedContent, searchTerm)
                : parsedContent
            }}
          ></div>
          {hoveredId === message.id ? (
            <div style={styles.actionBar}>
                <button
                  className="action-button"
                  style={styles.actionButton}
                  onClick={() => handleCopy(message.content, message.id)}
                  title={t('buttons.copy')}
                >
                  {copiedId === message.id ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  )}
                </button>

                {message.role === 'user' && (
                  <button
                    className="action-button"
                    style={styles.actionButton}
                    onClick={() => handleStartEdit(message.id, message.content)}
                    title={t('buttons.edit')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                )}

                {message.role === 'assistant' && (
                  <button
                    className="action-button"
                    style={styles.actionButton}
                    onClick={() => regenerateMessage(message.id)}
                    title={t('buttons.regenerate')}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10"></polyline>
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                    </svg>
                  </button>
                )}
              </div>
          ) : (
            <div style={styles.actionBarPlaceholder}></div>
          )}
        </>
      )}
    </div>
  );
};

export default Message;