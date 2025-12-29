import React, { useState } from 'react';
import type { ThemeColors } from '../hooks/useTheme';

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
  colors: ThemeColors;
  showHistory?: boolean;
  setShowHistory?: (show: boolean) => void;
  hasHistory?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  setShowSettings,
  clearChatHistory,
  t,
  showSearch = false,
  setShowSearch,
  searchTerm = '',
  setSearchTerm,
  matchCount = 0,
  colors,
  showHistory = false,
  setShowHistory,
  hasHistory = false
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
      color: colors.textMuted,
      flexShrink: 0,
    },
    searchBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flex: 1,
      height: '32px',
      padding: '0 10px',
      backgroundColor: colors.bgSecondary,
      borderRadius: '6px',
      border: `1px solid ${colors.borderSecondary}`,
    },
    searchInput: {
      flex: 1,
      border: 'none',
      backgroundColor: 'transparent',
      fontSize: '13px',
      outline: 'none',
      height: '100%',
      minWidth: 0,
      color: colors.textPrimary,
    },
    searchCount: {
      fontSize: '11px',
      color: colors.textDisabled,
      whiteSpace: 'nowrap' as const,
    },
    confirmBar: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      height: '32px',
      padding: '0 10px',
      backgroundColor: colors.dangerLight,
      borderRadius: '6px',
      border: `1px solid ${colors.dangerBorder}`,
    },
    confirmText: {
      fontSize: '12px',
      color: colors.textConfirm,
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
      {/* Search bar */}
      {showSearch && setShowSearch && setSearchTerm ? (
        <div style={styles.searchBar}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.textDisabled} strokeWidth="2">
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
              e.currentTarget.style.backgroundColor = colors.bgTertiary;
              e.currentTarget.style.color = colors.textSecondary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      ) : showClearConfirm ? (
        /* Clear confirmation bar */
        <div style={styles.confirmBar}>
          <span style={styles.confirmText}>{t('messages.confirmClear') || '确认清除?'}</span>
          <button
            style={{
              ...styles.confirmButton,
              backgroundColor: colors.danger,
              color: 'white',
            }}
            onClick={() => {
              clearChatHistory();
              setShowClearConfirm(false);
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.dangerHover;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.danger;
            }}
          >
            {t('buttons.confirm') || '确认'}
          </button>
          <button
            style={{
              ...styles.confirmButton,
              backgroundColor: colors.bgHover,
              color: colors.textSecondary,
            }}
            onClick={() => setShowClearConfirm(false)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.borderPrimary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgHover;
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
              e.currentTarget.style.backgroundColor = colors.bgTertiary;
              e.currentTarget.style.color = colors.textSecondary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = colors.textMuted;
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
        title={t('buttons.clearChat')}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = colors.dangerLight;
          e.currentTarget.style.color = colors.danger;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.textMuted;
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>

      {/* History button */}
      {setShowHistory && (
        <button
          onClick={() => setShowHistory(true)}
          style={{
            ...styles.iconButton,
            position: 'relative',
          }}
          title={t('history.title') || '聊天历史'}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.bgTertiary;
            e.currentTarget.style.color = colors.textSecondary;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {hasHistory && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                backgroundColor: colors.primary,
                borderRadius: '50%',
              }}
            />
          )}
        </button>
      )}

      <button
        onClick={() => setShowSettings(true)}
        style={styles.iconButton}
        title={t('settings.title')}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = colors.bgTertiary;
          e.currentTarget.style.color = colors.textSecondary;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = colors.textMuted;
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
