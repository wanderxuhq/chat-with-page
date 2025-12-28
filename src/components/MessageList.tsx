import React from 'react';
import { marked } from 'marked';
import type { Message } from '../types/index';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  t: (key: string) => string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading, t }) => {
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
      justifyContent: isUser ? 'flex-end' : 'flex-start',
    }),
    messageBubble: (isUser: boolean) => ({
      display: 'inline-block',
      padding: '10px 14px',
      borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
      backgroundColor: isUser ? '#4CAF50' : '#f3f4f6',
      color: isUser ? 'white' : '#1f2937',
      maxWidth: '85%',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      fontSize: '14px',
      lineHeight: '1.5',
      wordBreak: 'break-word' as const,
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
        `}
      </style>
      {(messages || []).map((msg, index) => (
        <div
          key={index}
          style={styles.messageWrapper(msg.type === "user")}
        >
          <div
            className={`message-content ${msg.type === "user" ? "user-message" : ""}`}
            style={styles.messageBubble(msg.type === "user")}
            dangerouslySetInnerHTML={{
              __html: marked.parse(msg.content)
            }}
          ></div>
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
