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
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "relative",
            border: "1px solid #ccc",
            borderRadius: "4px",
            fontSize: "12px",
            width: "100%",
            boxSizing: "border-box"
          }}
        >
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
            style={{
              padding: "4px 8px",
              border: "none",
              borderRadius: "4px",
              fontSize: "12px",
              width: "100%",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>
        {showModelList && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              right: 0,
              border: "1px solid #ccc",
              borderBottom: "none",
              borderRadius: "4px 4px 0 0",
              maxHeight: "200px",
              overflowY: "auto",
              backgroundColor: "white",
              zIndex: 1000,
              boxShadow: "0 -2px 5px rgba(0,0,0,0.1)"
            }}
          >
            {fetchingModels ? (
              <div style={{ padding: "4px 8px", fontSize: "12px", color: "#666" }}>{t('messages.loadingModels')}</div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
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
                            style={{
                              padding: "4px 8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              backgroundColor: selectedModel === model ? "#e6f7ff" : "white",
                              borderBottom: "1px solid #f0f0f0"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                            onMouseLeave={(e) => {
                              if (selectedModel !== model) {
                                e.currentTarget.style.backgroundColor = "white";
                              } else {
                                e.currentTarget.style.backgroundColor = "#e6f7ff";
                              }
                            }}
                          >
                            {model}
                          </li>
                        ))
                      ) : (
                        <li style={{ padding: "4px 8px", fontSize: "12px", color: "#999" }}>
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
    </div>
  );
};

export default ModelSelector;
