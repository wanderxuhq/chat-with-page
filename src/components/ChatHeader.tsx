import React, { useState } from 'react';

interface ChatHeaderProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  clearChatHistory: () => void;
  t: (key: string) => string;
  showSearch?: boolean;
  setShowSearch?: (show: boolean) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  matchCount?: number;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  setShowSettings,
  clearChatHistory,
  t,
  showSearch = false,
  setShowSearch,
  searchTerm = '',
  setSearchTerm,
  matchCount = 0
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 0',
      marginBottom: '8px',
    },
    iconButton: {
      width: '32px',
      height: '32px',
      padding: '0',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      color: '#6b7280',
      flexShrink: 0,
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flex: 1,
      height: '32px',
      padding: '0 10px',
      backgroundColor: '#f9fafb',
      borderRadius: '6px',
      border: '1px solid #e5e7eb',
    },
    searchInput: {
      flex: 1,
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '13px',
      outline: 'none',
      height: '100%',
      minWidth: 0,
    },
    searchCount: {
      fontSize: '11px',
      color: '#9ca3af',
      whiteSpace: 'nowrap' as const,
    },
    confirmBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      height: '32px',
      padding: '0 10px',
      backgroundColor: '#fef2f2',
      borderRadius: '6px',
      border: '1px solid #fecaca',
    },
    confirmText: {
      fontSize: '12px',
      color: '#dc2626',
      whiteSpace: 'nowrap' as const,
    },
    confirmButton: {
      padding: '4px 8px',
      fontSize: '11px',
      fontWeight: 500,
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
  };

  return (
    <div style={styles.container}>
      {/* 搜索栏 */}
      {showSearch && setShowSearch && setSearchTerm ? (
        <div style={styles.searchBar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            style={styles.searchInput}
            placeholder={t('placeholders.search') || '搜索消息...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <span style={styles.searchCount}>
              {matchCount}
            </span>
          )}
          <button
            style={{...styles.iconButton, width: '24px', height: '24px'}}
            onClick={() => {
              setShowSearch(false);
              setSearchTerm('');
            }}
            title={t('buttons.close') || '关闭'}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ) : showClearConfirm ? (
        /* 清除确认栏 */
        <div style={styles.confirmBar}>
          <span style={styles.confirmText}>{t('messages.confirmClear') || '确认清除?'}</span>
          <button
            style={{
              ...styles.confirmButton,
              backgroundColor: '#dc2626',
              color: 'white',
            }}
            onClick={() => {
              clearChatHistory();
              setShowClearConfirm(false);
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#b91c1c';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#dc2626';
            }}
          >
            {t('buttons.confirm') || '确认'}
          </button>
          <button
            style={{
              ...styles.confirmButton,
              backgroundColor: '#e5e7eb',
              color: '#374151',
            }}
            onClick={() => setShowClearConfirm(false)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#d1d5db';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
          >
            {t('buttons.cancel') || '取消'}
          </button>
        </div>
      ) : (
        setShowSearch && (
          <button
            onClick={() => setShowSearch(true)}
            style={styles.iconButton}
            title={t('buttons.search') || '搜索'}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        )
      )}

      <button
        onClick={() => setShowClearConfirm(true)}
        style={styles.iconButton}
        title={t('buttons.clear_chat')}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#fef2f2';
          e.currentTarget.style.color = '#dc2626';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#6b7280';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
      <button
        onClick={() => setShowSettings(true)}
        style={styles.iconButton}
        title={t('settings')}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6';
          e.currentTarget.style.color = '#374151';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#6b7280';
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </button>
    </div>
  );
};

export default ChatHeader;
