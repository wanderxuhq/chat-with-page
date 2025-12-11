import React from 'react';

interface ChatHeaderProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  clearChatHistory: () => void;
  t: (key: string) => string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  showSettings, 
  setShowSettings, 
  clearChatHistory, 
  t 
}) => {
  return (
    <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end", gap: "8px" }}>
      <button
        onClick={clearChatHistory}
        style={{
          padding: "4px 8px",
          backgroundColor: "#ffebee",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px",
          color: "#c62828"
        }}
      >
        {t('buttons.clear_chat')}
      </button>
      <button
        onClick={() => setShowSettings(true)}
        style={{
          padding: "4px 8px",
          backgroundColor: "#f0f0f0",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontSize: "12px"
        }}
      >
        {t('settings')}
      </button>
    </div>
  );
};

export default ChatHeader;
