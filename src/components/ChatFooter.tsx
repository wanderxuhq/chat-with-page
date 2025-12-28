import React, { useState } from 'react';
import type { ThemeColors } from '../hooks/useTheme';

interface ChatFooterProps {
  models: string[];
  selectedModel: string;
  modelSearchTerm: string;
  showModelList: boolean;
  fetchingModels: boolean;
  input: string;
  setInput: (value: string) => void;
  t: (key: string) => string;
  setModelSearchTerm: (term: string) => void;
  setShowModelList: (show: boolean) => void;
  saveSelectedModel: (model: string) => void;
  sendMessage: () => void;
  summarizePage: () => void;
  colors: ThemeColors;
}

const ChatFooter: React.FC<ChatFooterProps> = ({
  models,
  selectedModel,
  modelSearchTerm,
  showModelList,
  fetchingModels,
  input,
  setInput,
  t,
  setModelSearchTerm,
  setShowModelList,
  saveSelectedModel,
  sendMessage,
  summarizePage,
  colors
}) => {
  const [showModelSelector, setShowModelSelector] = useState(false);

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      padding: '8px 0',
      borderTop: `1px solid ${colors.borderSecondary}`,
    },
    inputRow: {
      display: 'flex',
      gap: '6px',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      minWidth: '0',
      padding: '10px 12px',
      border: `1px solid ${colors.borderPrimary}`,
      borderRadius: '8px',
      backgroundColor: colors.bgInput,
      color: colors.textPrimary,
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    iconButton: {
      width: '36px',
      height: '36px',
      padding: '0',
      backgroundColor: colors.bgTertiary,
      border: `1px solid ${colors.borderSecondary}`,
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
      color: colors.textMuted,
      flexShrink: 0,
    },
    sendButton: {
      width: '36px',
      height: '36px',
      padding: '0',
      backgroundColor: colors.primary,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s',
      flexShrink: 0,
    },
  };

  return (
    <div style={styles.container}>
      {/* 输入行 */}
      <div style={styles.inputRow}>
        {/* 模型选择器 - 点击按钮展开/收起 */}
        {showModelSelector ? (
          <div style={{
            position: 'relative',
            flex: 1,
            minWidth: '120px',
            maxWidth: '200px',
          }}>
            <input
              type="text"
              placeholder={t('labels.model')}
              value={modelSearchTerm}
              onChange={(e) => {
                setModelSearchTerm(e.target.value);
                setShowModelList(true);
              }}
              onFocus={() => setShowModelList(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowModelList(false);
                  setShowModelSelector(false);
                }, 200);
              }}
              autoFocus
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                border: `1px solid ${colors.borderPrimary}`,
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: colors.bgSecondary,
                color: colors.textPrimary,
                boxSizing: 'border-box' as const,
              }}
            />
            {showModelList && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                border: `1px solid ${colors.borderPrimary}`,
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
                maxHeight: '220px',
                overflowY: 'auto' as const,
                backgroundColor: colors.bgModelList,
                zIndex: 1000,
                boxShadow: `0 -4px 12px ${colors.shadowLight}`,
              }}>
                {fetchingModels ? (
                  <div style={{
                    padding: '12px 14px',
                    fontSize: '13px',
                    color: colors.textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                      <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75"></path>
                    </svg>
                    {t('messages.loadingModels')}
                  </div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(() => {
                      const filteredModels = models.filter(model => {
                        if (!modelSearchTerm.trim()) return true;
                        const searchTerm = modelSearchTerm.trim().toLowerCase();
                        const modelName = model.toLowerCase();
                        if (searchTerm.includes('*')) {
                          const regexPattern = searchTerm.replace(/\*/g, '.*').replace(/\s+/g, '.*');
                          const regex = new RegExp(regexPattern);
                          return regex.test(modelName);
                        }
                        return modelName.includes(searchTerm);
                      });
                      return filteredModels.length > 0 ? (
                        filteredModels.map(model => (
                          <li
                            key={model}
                            onClick={() => {
                              saveSelectedModel(model);
                              setModelSearchTerm(model);
                              setShowModelSelector(false);
                            }}
                            style={{
                              padding: '10px 14px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              color: colors.textPrimary,
                              backgroundColor: selectedModel === model ? colors.bgSelected : colors.bgModelList,
                              borderBottom: `1px solid ${colors.bgTertiary}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={(e) => {
                              if (selectedModel !== model) {
                                e.currentTarget.style.backgroundColor = colors.bgSecondary;
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = selectedModel === model ? colors.bgSelected : colors.bgModelList;
                            }}
                          >
                            {selectedModel === model && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                            {model}
                          </li>
                        ))
                      ) : (
                        <li style={{ padding: '12px 14px', fontSize: '13px', color: colors.textDisabled, textAlign: 'center' }}>
                          {t('messages.noMatchingModels')}
                        </li>
                      );
                    })()}
                  </ul>
                )}
              </div>
            )}
            <style>
              {`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}
            </style>
          </div>
        ) : (
          <button
            onClick={() => {
              setShowModelSelector(true);
              setShowModelList(true);
            }}
            style={styles.iconButton}
            title={`${t('labels.model')}: ${selectedModel}`}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgHover;
              e.currentTarget.style.color = colors.textSecondary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgTertiary;
              e.currentTarget.style.color = colors.textMuted;
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </button>
        )}

        {/* 总结页面按钮 */}
        <button
          onClick={summarizePage}
          style={styles.iconButton}
          title={t('buttons.chatWithPage')}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.infoLight;
            e.currentTarget.style.color = colors.info;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = colors.bgTertiary;
            e.currentTarget.style.color = colors.textMuted;
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
        </button>

        {/* 输入框 */}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.borderFocus;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primaryLight}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.borderPrimary;
            e.currentTarget.style.boxShadow = 'none';
          }}
          style={styles.input}
          placeholder={t('placeholders.enterMessage')}
        />

        {/* 发送按钮 */}
        <button
          onClick={sendMessage}
          style={styles.sendButton}
          title={t('send')}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = colors.primaryHover;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary;
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatFooter;
