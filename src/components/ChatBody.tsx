import React from 'react';
import MessageList from './MessageList';
import type { Message } from '../types/index';

interface ChatBodyProps {
  messages: Message[];
  loading: boolean;
  t: (key: string) => string;
}

const ChatBody: React.FC<ChatBodyProps> = ({ messages, loading, t }) => {
  return (
    <div style={{ flex: 1, overflowY: "auto", marginBottom: 16, paddingRight: 8 }}>
      <MessageList
        messages={messages}
        loading={loading}
        t={t}
      />
    </div>
  );
};

export default ChatBody;
