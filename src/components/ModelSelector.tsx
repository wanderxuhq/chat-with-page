import React from 'react';

interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  modelSearchTerm: string;
  showModelList: boolean;
  fetchingModels: boolean;
  t: (key: string) => string;
  setModelSearchTerm: (term: string) => void;
  setShowModelList: (show: boolean) => void;
  handleInputFocus?: () => void;
  saveSelectedModel: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  modelSearchTerm,
  showModelList,
  fetchingModels,
  t,
  setModelSearchTerm,
  setShowModelList,
  handleInputFocus,
  saveSelectedModel
}) => {
  const styles = {
    container: {
      marginBottom: '12px',
    },
    inputWrapper: {
      position: 'relative' as const,
    },
    inputContainer: {
      position: 'relative' as const,
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '13px',
      width: '100%',
      boxSizing: 'border-box' as const,
      backgroundColor: '#f9fafb',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    input: {
      padding: '10px 14px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '13px',
      width: '100%',
      boxSizing: 'border-box' as const,
      outline: 'none',
      backgroundColor: 'transparent',
    },
    dropdown: {
      position: 'absolute' as const,
      bottom: '100%',
      left: 0,
      right: 0,
      border: '1px solid #d1d5db',
      borderBottom: 'none',
      borderRadius: '8px 8px 0 0',
      maxHeight: '220px',
      overflowY: 'auto' as const,
      backgroundColor: 'white',
      zIndex: 1000,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
    },
    loadingText: {
      padding: '12px 14px',
      fontSize: '13px',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    list: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
    },
    listItem: (isSelected: boolean) => ({
      padding: '10px 14px',
      cursor: 'pointer',
      fontSize: '13px',
      backgroundColor: isSelected ? '#ecfdf5' : 'white',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background-color 0.15s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    }),
    noResults: {
      padding: '12px 14px',
      fontSize: '13px',
      color: '#9ca3af',
      textAlign: 'center' as const,
    },
    selectedIcon: {
      width: '16px',
      height: '16px',
      color: '#10b981',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.inputWrapper}>
        <div style={styles.inputContainer}>
          <input
            type="text"
            placeholder={t('labels.model')}
            value={modelSearchTerm}
            onChange={(e) => {
              setModelSearchTerm(e.target.value);
              setShowModelList(true);
            }}
            onFocus={() => {
              if (handleInputFocus) {
                handleInputFocus();
              } else {
                setShowModelList(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowModelList(false), 200);
            }}
            style={styles.input}
          />
        </div>
        {showModelList && (
          <div style={styles.dropdown}>
            {fetchingModels ? (
              <div style={styles.loadingText}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75"></path>
                </svg>
                {t('messages.loadingModels')}
              </div>
            ) : (
              <ul style={styles.list}>
                {(() => {
                  const filteredModels = models.filter(model => {
                    if (!modelSearchTerm.trim()) return true;
                    const searchTerm = modelSearchTerm.trim().toLowerCase();
                    const modelName = model.toLowerCase();

                    if (searchTerm.includes('*')) {
                      const regexPattern = searchTerm
                        .replace(/\*/g, '.*')
                        .replace(/\s+/g, '.*');
                      const regex = new RegExp(regexPattern);
                      return regex.test(modelName);
                    }

                    return modelName.includes(searchTerm);
                  });

                  return (
                    <>
                      {filteredModels.length > 0 ? (
                        filteredModels.map(model => (
                          <li
                            key={model}
                            onClick={() => {
                              saveSelectedModel(model);
                              setModelSearchTerm(model);
                            }}
                            style={styles.listItem(selectedModel === model)}
                            onMouseEnter={(e) => {
                              if (selectedModel !== model) {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedModel !== model) {
                                e.currentTarget.style.backgroundColor = 'white';
                              } else {
                                e.currentTarget.style.backgroundColor = '#ecfdf5';
                              }
                            }}
                          >
                            {selectedModel === model && (
                              <svg style={styles.selectedIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            )}
                            {model}
                          </li>
                        ))
                      ) : (
                        <li style={styles.noResults}>
                          {t('messages.noMatchingModels')}
                        </li>
                      )}
                    </>
                  );
                })()}
              </ul>
            )}
          </div>
        )}
      </div>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ModelSelector;
