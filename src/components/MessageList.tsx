import React, { useState } from 'react';
import { marked } from 'marked';
import type { Message } from '../types/index';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  t: (key: string) => string;
  searchTerm?: string;
  onCopy?: (content: string) => void;
  onEdit?: (index: number, content: string) => void;
  onRegenerate?: (index: number) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loading,
  t,
  searchTerm = '',
  onCopy,
  onEdit,
  onRegenerate
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const styles = {
    container: {
      flex: 1,
      overflowY: 'auto' as const,
      marginBottom: '16px',
      paddingRight: '8px',
    },
    messageWrapper: (isUser: boolean) => ({
      marginBottom: '12px',
      textAlign: (isUser ? 'right' : 'left') as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    }),
    messageBubble: (isUser: boolean, isHighlighted: boolean) => ({
      display: 'inline-block',
      padding: '10px 14px',
      borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
      backgroundColor: isHighlighted ? '#fef3c7' : (isUser ? '#4CAF50' : '#f3f4f6'),
      color: isUser ? 'white' : '#1f2937',
      maxWidth: '85%',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
      lineHeight: '1.5',
      wordBreak: 'break-word' as const,
      border: isHighlighted ? '2px solid #f59e0b' : 'none',
    }),
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      backgroundColor: '#f3f4f6',
      borderRadius: '12px 12px 12px 4px',
      maxWidth: '80px',
    },
    loadingDots: {
      display: 'flex',
      gap: '4px',
    },
    dot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#9ca3af',
      borderRadius: '50%',
      animation: 'pulse 1.4s ease-in-out infinite',
    },
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
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s, color 0.2s',
    },
    editTextarea: {
      width: '100%',
      minHeight: '80px',
      padding: '10px 14px',
      borderRadius: '12px',
      border: '2px solid #4CAF50',
      fontSize: '14px',
      lineHeight: '1.5',
      resize: 'vertical' as const,
      outline: 'none',
      fontFamily: 'inherit',
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

  const handleCopy = async (content: string, index: number) => {
    if (onCopy) {
      onCopy(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleStartEdit = (index: number, content: string) => {
    setEditingIndex(index);
    setEditContent(content);
  };

  const handleSaveEdit = (index: number) => {
    if (onEdit && editContent.trim()) {
      onEdit(index, editContent.trim());
    }
    setEditingIndex(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditContent('');
  };

  const highlightSearchTerm = (content: string, term: string): string => {
    if (!term.trim()) return content;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return content.replace(regex, '<mark style="background-color: #fef3c7; padding: 1px 2px; border-radius: 2px;">$1</mark>');
  };

  const isMessageHighlighted = (content: string): boolean => {
    if (!searchTerm.trim()) return false;
    return content.toLowerCase().includes(searchTerm.toLowerCase());
  };

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes pulse {
            0%, 80%, 100% { opacity: 0.4; transform: scale(0.8); }
            40% { opacity: 1; transform: scale(1); }
          }
          .message-content p { margin: 0 0 8px 0; }
          .message-content p:last-child { margin-bottom: 0; }
          .message-content ul, .message-content ol { margin: 8px 0; padding-left: 20px; }
          .message-content code { background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; font-size: 13px; }
          .message-content pre { background: #1f2937; color: #f3f4f6; padding: 12px; border-radius: 8px; overflow-x: auto; }
          .message-content pre code { background: none; padding: 0; }
          .user-message .message-content code { background: rgba(255,255,255,0.2); }
          .action-button:hover { background-color: #f3f4f6 !important; color: #1f2937 !important; }
        `}
      </style>
      {(messages || []).map((msg, index) => (
        <div
          key={msg.id || index}
          style={styles.messageWrapper(msg.type === "user")}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {editingIndex === index ? (
            <div style={{ width: '85%' }}>
              <textarea
                style={styles.editTextarea}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
              />
              <div style={styles.editActions}>
                <button
                  style={{ ...styles.editButton, backgroundColor: '#4CAF50', color: 'white' }}
                  onClick={() => handleSaveEdit(index)}
                >
                  {t('buttons.save') || '保存并发送'}
                </button>
                <button
                  style={{ ...styles.editButton, backgroundColor: '#e5e7eb', color: '#1f2937' }}
                  onClick={handleCancelEdit}
                >
                  {t('buttons.cancel') || '取消'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`message-content ${msg.type === "user" ? "user-message" : ""}`}
                style={styles.messageBubble(msg.type === "user", isMessageHighlighted(msg.content))}
                dangerouslySetInnerHTML={{
                  __html: searchTerm
                    ? highlightSearchTerm(marked.parse(msg.content) as string, searchTerm)
                    : marked.parse(msg.content) as string
                }}
              ></div>
              {/* 预留固定空间防止抖动 */}
              {!msg.isGenerating && (
                hoveredIndex === index ? (
                  <div style={styles.actionBar}>
                    {/* 复制按钮 */}
                    <button
                      className="action-button"
                      style={styles.actionButton}
                      onClick={() => handleCopy(msg.content, index)}
                      title={t('buttons.copy') || '复制'}
                    >
                      {copiedIndex === index ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      )}
                    </button>

                    {/* 编辑按钮 - 仅用户消息 */}
                    {msg.type === 'user' && onEdit && (
                      <button
                        className="action-button"
                        style={styles.actionButton}
                        onClick={() => handleStartEdit(index, msg.content)}
                        title={t('buttons.edit') || '编辑'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                    )}

                    {/* 重新生成按钮 - 仅 AI 消息 */}
                    {msg.type === 'assistant' && onRegenerate && (
                      <button
                        className="action-button"
                        style={styles.actionButton}
                        onClick={() => onRegenerate(index)}
                        title={t('buttons.regenerate') || '重新生成'}
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
                )
              )}
            </>
          )}
        </div>
      ))}
      {loading && (
        <div style={styles.messageWrapper(false)}>
          <div style={styles.loadingContainer}>
            <div style={styles.loadingDots}>
              <div style={{ ...styles.dot, animationDelay: '0s' }}></div>
              <div style={{ ...styles.dot, animationDelay: '0.2s' }}></div>
              <div style={{ ...styles.dot, animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
