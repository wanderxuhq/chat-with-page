import React from 'react';
import ModelSelector from './ModelSelector';
import InputPanel from './InputPanel';

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
  summarizePage
}) => {
  return (
    <>
      {/* 模型选择 */}
      <ModelSelector
        models={models}
        selectedModel={selectedModel}
        modelSearchTerm={modelSearchTerm}
        showModelList={showModelList}
        fetchingModels={fetchingModels}
        t={t}
        setModelSearchTerm={setModelSearchTerm}
        setShowModelList={setShowModelList}
        saveSelectedModel={saveSelectedModel}
      />
      
      {/* 输入面板 */}
      <InputPanel
        input={input}
        setInput={setInput}
        modelSearchTerm={modelSearchTerm}
        selectedModel={selectedModel}
        t={t}
        saveSelectedModel={saveSelectedModel}
        sendMessage={sendMessage}
        summarizePage={summarizePage}
      />
    </>
  );
};

export default ChatFooter;
