import React, { useState } from 'react';
import type { Message } from '../types/index';
import { useTheme } from '../hooks/useTheme';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { useChat } from '../contexts/ChatContext';
import MessageItem from './MessageItem';

interface MessageListProps {
  isGenerating: boolean;
  searchTerm?: string;
}

const MessageList: React.FC<MessageListProps> = ({
  isGenerating,
  searchTerm = ''
}) => {
  const { colors } = useTheme();
  const { t } = useLanguageManagement();
  const { messages, lastMessage, editMessage, regenerateMessage } = useChat();
  const [editingIndex, setEditingIndex] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const styles = {
    container: {
      flex: 1,
      overflowY: 'auto' as const,
      marginBottom: '16px',
      paddingRight: '8px',
    },
    messageWrapper: (isUser: boolean) => ({
      marginBottom: '12px',
      textAlign: isUser ? 'right' as const : 'left' as const,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: isUser ? 'flex-end' : 'flex-start',
    }),
    loadingContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 14px',
      backgroundColor: colors.bgMessage,
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
      backgroundColor: colors.textDisabled,
      borderRadius: '50%',
      animation: 'pulse 1.4s ease-in-out infinite',
    },
  };

  const handleSaveEdit = (messageId: string) => {
    if (editContent.trim()) {
      editMessage(messageId, editContent.trim());
    }
    setEditingIndex(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditContent('');
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
          .message-content code { background: ${colors.bgCode}; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
          .message-content pre { background: ${colors.bgCodeBlock}; color: #f3f4f6; padding: 12px; border-radius: 8px; overflow-x: auto; }
          .message-content pre code { background: none; padding: 0; }
          .message-content a { color: ${colors.info}; text-decoration: none; }
          .message-content a:hover { color: ${colors.infoHover}; text-decoration: underline; }
          .message-content blockquote { border-left: 3px solid ${colors.primary}; margin: 8px 0; padding-left: 12px; color: ${colors.textPrimary}; }
          .message-content blockquote a { color: ${colors.info}; }
          .user-message .message-content code { background: rgba(255,255,255,0.2); }
          .user-message a { color: rgba(255,255,255,0.9); text-decoration: underline; }
          .action-button:hover { background-color: ${colors.bgTertiary} !important; color: ${colors.textPrimary} !important; }
        `}
      </style>
      {(messages || []).filter(msg => msg.role !== 'system').map((msg) => (
        <MessageItem
          key={msg.id || msg.content}
          message={msg}
          searchTerm={searchTerm}
          editingId={editingIndex}
          editContent={editContent}
          copiedId={copiedId}
          hoveredId={hoveredId}
          setEditingId={setEditingIndex}
          setEditContent={setEditContent}
          setCopiedId={setCopiedId}
          setHoveredId={setHoveredId}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
        />
      ))}
      {lastMessage && <MessageItem
          key={lastMessage.id || lastMessage.content}
          message={lastMessage}
          searchTerm={searchTerm}
          editingId={editingIndex}
          editContent={editContent}
          copiedId={copiedId}
          hoveredId={hoveredId}
          setEditingId={setEditingIndex}
          setEditContent={setEditContent}
          setCopiedId={setCopiedId}
          setHoveredId={setHoveredId}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
        />}

      {isGenerating && (
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