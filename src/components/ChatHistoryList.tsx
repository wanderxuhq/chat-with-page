import React, { useState } from 'react';
import type { ChatSession } from '../hooks/useChatSessions';
import type { ThemeColors } from '../hooks/useTheme';

interface ChatHistoryListProps {
  sessions: ChatSession[];
  currentUrlHash: string;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (urlHash: string) => void;
  onClose: () => void;
  t: (key: string) => string;
  colors: ThemeColors;
}

const ChatHistoryList: React.FC<ChatHistoryListProps> = ({
  sessions,
  currentUrlHash,
  onSelectSession,
  onDeleteSession,
  onClose,
  t,
  colors
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('history.yesterday');
    } else if (diffDays < 7) {
      return `${diffDays} ${t('history.daysAgo')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleDelete = (e: React.MouseEvent, urlHash: string) => {
    e.stopPropagation();
    if (confirmDelete === urlHash) {
      onDeleteSession(urlHash);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(urlHash);
      // 3秒后自动取消确认状态
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: colors.bgPrimary,
          borderRadius: 12,
          width: '90%',
          maxWidth: 500,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: `0 4px 20px ${colors.shadowMedium}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.borderSecondary}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3 style={{ margin: 0, color: colors.textPrimary, fontSize: 16, fontWeight: 600 }}>
            {t('history.title')}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
              borderRadius: 4,
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.bgHover)}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {sessions.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                color: colors.textMuted,
              }}
            >
              {t('history.empty')}
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.urlHash}
                onClick={() => onSelectSession(session)}
                style={{
                  padding: '12px 20px',
                  cursor: 'pointer',
                  backgroundColor: session.urlHash === currentUrlHash ? colors.bgSelected : 'transparent',
                  borderLeft: session.urlHash === currentUrlHash ? `3px solid ${colors.primary}` : '3px solid transparent',
                  transition: 'background-color 0.15s',
                }}
                onMouseOver={(e) => {
                  if (session.urlHash !== currentUrlHash) {
                    e.currentTarget.style.backgroundColor = colors.bgHover;
                  }
                }}
                onMouseOut={(e) => {
                  if (session.urlHash !== currentUrlHash) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                    {/* 标题 */}
                    <div
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginBottom: 4,
                      }}
                      title={session.url}
                    >
                      {session.title}
                    </div>
                    {/* 最后一条消息预览 */}
                    {session.lastMessage && (
                      <div
                        style={{
                          color: colors.textMuted,
                          fontSize: 12,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {session.lastMessage}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {/* 时间和消息数 */}
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: colors.textMuted, fontSize: 11 }}>
                        {formatTime(session.lastActive)}
                      </div>
                      <div style={{ color: colors.textMuted, fontSize: 11 }}>
                        {session.messageCount} {t('history.messages')}
                      </div>
                    </div>
                    {/* 删除按钮 */}
                    <button
                      onClick={(e) => handleDelete(e, session.urlHash)}
                      style={{
                        background: confirmDelete === session.urlHash ? colors.danger : 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: confirmDelete === session.urlHash ? '#fff' : colors.textMuted,
                        borderRadius: 4,
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={(e) => {
                        if (confirmDelete !== session.urlHash) {
                          e.currentTarget.style.backgroundColor = colors.dangerLight;
                          e.currentTarget.style.color = colors.danger;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (confirmDelete !== session.urlHash) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = colors.textMuted;
                        }
                      }}
                      title={confirmDelete === session.urlHash ? t('buttons.confirm') : t('history.delete')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryList;
