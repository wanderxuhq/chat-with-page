import React, { useRef, useEffect } from 'react';
import { useLanguageManagement } from '../hooks/useLanguageManagement';
import { useModel } from '@/contexts/ModelContext';

interface ModelSelectorProps {
  setShowModelSelector: (show: boolean) => void;
  setPendingMessage: (pendingMessage: string | null) => void;
  colors: ThemeColors;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  setShowModelSelector,
  setPendingMessage,
  colors,
}) => {
  const { t } = useLanguageManagement();
  const { models, selectedModel, modelSearchTerm, setModelSearchTerm, setShowModelList, saveSelectedModel, showModelList, fetchingModels } = useModel();

  const modelInputRef = useRef<HTMLInputElement>(null);
  // Focus input when component mounts
  useEffect(() => {
    if (modelInputRef.current) {
      modelInputRef.current.focus();
    }
  }, [modelInputRef]);

  const handleModelSelect = (model: string) => {
    saveSelectedModel(model);
    setModelSearchTerm(model);
    setShowModelSelector(false);
    //set(false);
    // Don't execute pending action here - let useEffect handle it when selectedModel updates
  };

  return (
    <div style={{
      position: 'relative',
      flex: 1,
      minWidth: '120px',
      maxWidth: '200px',
    }}>
      <input
        ref={modelInputRef}
        type="text"
        placeholder={t('labels.model')}
        value={modelSearchTerm}
        onChange={(e) => {
          saveSelectedModel(e.target.value);
          setModelSearchTerm(e.target.value);
          /*
          if (doSend) {
            doSend();
            setDoSend(null);
          }
          */
        }}
        onFocus={() => setShowModelList(true)}
        onBlur={() => {
          setTimeout(() => {
            setShowModelList(false);
            setShowModelSelector(false);
            setPendingMessage(null)
          }, 200);
        }}
        autoFocus
        style={{
          width: '100%',
          height: '36px',
          padding: '0 10px',
          border:  `1px solid ${colors.borderPrimary}`,
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
                      onClick={() => handleModelSelect(model)}
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
        {
          `
            @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }
          `
        }
      </style>
    </div>
  );
};

export default ModelSelector;
