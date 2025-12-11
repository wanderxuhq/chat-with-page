import React from 'react';
import { marked } from 'marked';
import type { Message } from '../types/index';

interface MessageListProps {
  messages: Message[];
  loading: boolean;
  t: (key: string) => string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, loading, t }) => {
  return (
    <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, paddingRight: 8 }}>
      {(messages || []).map((msg, index) => (
        <div
          key={index}
          style={{
            marginBottom: 8,
            textAlign: msg.type === "user" ? "right" : "left"
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: 8,
              borderRadius: 4,
              backgroundColor: msg.type === "user" ? "#dcf8c6" : "#f1f0f0"
            }}
            dangerouslySetInnerHTML={{
              __html: marked.parse(msg.content)
            }}
          ></div>
        </div>
      ))}
      {loading && <div>{t('messages.loading') || '加载中...'}</div>}
    </div>
  );
};

export default MessageList;
