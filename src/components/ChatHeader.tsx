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
  const styles = {
    container: {
      marginBottom: '16px',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      padding: '8px 0',
      borderBottom: '1px solid #e5e7eb',
    },
    clearButton: {
      padding: '8px 14px',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#dc2626',
      fontWeight: 500,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    settingsButton: {
      padding: '8px 14px',
      backgroundColor: '#f3f4f6',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      color: '#374151',
      fontWeight: 500,
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
  };

  return (
    <div style={styles.container}>
      <button
        onClick={clearChatHistory}
        style={styles.clearButton}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#fee2e2';
          e.currentTarget.style.borderColor = '#fca5a5';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
          e.currentTarget.style.borderColor = '#fecaca';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        {t('buttons.clear_chat')}
      </button>
      <button
        onClick={() => setShowSettings(true)}
        style={styles.settingsButton}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#e5e7eb';
          e.currentTarget.style.borderColor = '#d1d5db';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.borderColor = '#e5e7eb';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
        {t('settings')}
      </button>
    </div>
  );
};

export default ChatHeader;
