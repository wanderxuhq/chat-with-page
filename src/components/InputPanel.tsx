import React from 'react';

interface InputPanelProps {
  input: string;
  setInput: (value: string) => void;
  modelSearchTerm: string;
  selectedModel: string;
  t: (key: string) => string;
  saveSelectedModel: (model: string) => void;
  sendMessage: () => void;
  summarizePage: () => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  input,
  setInput,
  modelSearchTerm,
  selectedModel,
  t,
  saveSelectedModel,
  sendMessage,
  summarizePage
}) => {
  const handleSendMessage = () => {
    if (modelSearchTerm.trim() && modelSearchTerm.trim() !== selectedModel) {
      saveSelectedModel(modelSearchTerm.trim());
    }
    sendMessage();
  };

  return (
    <div style={{ display: "flex", minHeight: "40px", zIndex: 10 }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            handleSendMessage();
          }
        }}
        style={{ flex: 1, padding: 8, border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "white" }}
        placeholder={t('placeholders.enterMessage')}
      />
      <button 
        onClick={handleSendMessage}
        style={{ 
          padding: 8, 
          marginLeft: 8, 
          backgroundColor: "#4CAF50", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          cursor: "pointer", 
          minWidth: "60px"
        }}
      >
        {t('send')}
      </button>
      <button 
        onClick={summarizePage}
        style={{ 
          padding: 8, 
          marginLeft: 8, 
          backgroundColor: "#2196F3", 
          color: "white", 
          border: "none", 
          borderRadius: "4px", 
          cursor: "pointer", 
          minWidth: "100px"
        }}
      >
        {t('buttons.chatWithPage')}
      </button>
    </div>
  );
};

export default InputPanel;
