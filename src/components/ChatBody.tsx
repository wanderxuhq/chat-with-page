import React, { useRef, useEffect } from 'react';
import MessageList from './MessageList';
import type { Message } from '../types/index';

interface ChatBodyProps {
  messages: Message[];
  loading: boolean;
  t: (key: string) => string;
}

const ChatBody: React.FC<ChatBodyProps> = ({ messages, loading, t }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 当消息变化或加载状态变化时，滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, overflowY: "auto", marginBottom: 16, paddingRight: 8 }}
    >
      <MessageList
        messages={messages}
        loading={loading}
        t={t}
      />
    </div>
  );
};

export default ChatBody;
