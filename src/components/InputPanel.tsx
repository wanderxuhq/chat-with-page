import React from 'react';

interface InputPanelProps {
  input: string;
  setInput: (value: string) => void;
  t: (key: string) => string;
  sendMessage: () => void;
  summarizePage: () => void;
}

const InputPanel: React.FC<InputPanelProps> = ({
  input,
  setInput,
  t,
  sendMessage,
  summarizePage
}) => {

  const styles = {
    container: {
      display: 'flex',
      gap: '6px',
      zIndex: 10,
      padding: '8px 0',
      borderTop: '1px solid #e5e7eb',
      flexWrap: 'wrap' as const,
    },
    input: {
      flex: 1,
      minWidth: '120px',
      padding: '8px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
    },
    sendButton: {
      padding: '8px 12px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      whiteSpace: 'nowrap' as const,
    },
    summarizeButton: {
      padding: '8px 12px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: 500,
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '4px',
      whiteSpace: 'nowrap' as const,
    },
  };

  return (
    <div style={styles.container}>
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
          e.currentTarget.style.borderColor = '#4CAF50';
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db';
          e.currentTarget.style.boxShadow = 'none';
        }}
        style={styles.input}
        placeholder={t('placeholders.enterMessage')}
      />
      <button
        onClick={sendMessage}
        style={styles.sendButton}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#45a049';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#4CAF50';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
        {t('send')}
      </button>
      <button
        onClick={summarizePage}
        style={styles.summarizeButton}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        {t('buttons.chatWithPage')}
      </button>
    </div>
  );
};

export default InputPanel;
