import React, { useState } from 'react';

interface SettingsPanelProps {
  selectedProvider: string;
  aiProviders: Array<{
    id: string;
    name: string;
    baseUrl: string;
  }>;
  apiEndpointInput: string;
  apiKeyInput: string;
  selectedLanguage: string;
  languages: Array<{
    code: string;
    name: string;
  }>;
  t: (key: string) => string;
  handleProviderChange: (provider: string) => void;
  setApiEndpointInput: (endpoint: string) => void;
  setApiKeyInput: (key: string) => void;
  setSelectedLanguage: (language: string) => void;
  saveSettings: () => void;
  i18n: {
    changeLanguage: (language: string) => void;
  };
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  selectedProvider,
  aiProviders,
  apiEndpointInput,
  apiKeyInput,
  selectedLanguage,
  languages,
  t,
  handleProviderChange,
  setApiEndpointInput,
  setApiKeyInput,
  setSelectedLanguage,
  saveSettings,
  i18n
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  const styles = {
    container: {
      padding: '24px',
      maxWidth: '100%',
      margin: '0 auto',
    },
    header: {
      fontSize: '20px',
      fontWeight: 600,
      marginBottom: '24px',
      color: '#1a1a1a',
      borderBottom: '2px solid #4CAF50',
      paddingBottom: '12px',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: 500,
      color: '#374151',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      boxSizing: 'border-box' as const,
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      outline: 'none',
      backgroundColor: '#fff',
    },
    select: {
      width: '100%',
      padding: '12px 14px',
      boxSizing: 'border-box' as const,
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      backgroundColor: '#fff',
      cursor: 'pointer',
      outline: 'none',
      appearance: 'none' as const,
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: 'right 12px center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '16px',
    },
    passwordWrapper: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
    },
    passwordInput: {
      width: '100%',
      padding: '12px 44px 12px 14px',
      boxSizing: 'border-box' as const,
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '14px',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      outline: 'none',
      backgroundColor: '#fff',
    },
    toggleButton: {
      position: 'absolute' as const,
      right: '12px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
    },
    saveButton: {
      width: '100%',
      padding: '14px 20px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: 500,
      transition: 'background-color 0.2s, transform 0.1s',
      marginTop: '8px',
    },
    hint: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '4px',
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>{t('settings')}</h2>

      <div style={styles.formGroup}>
        <label style={styles.label}>{t('settings_section.aiProvider')}</label>
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          style={styles.select}
        >
          {aiProviders.map(provider => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>Base URL</label>
        <input
          type="text"
          onChange={(e) => setApiEndpointInput(e.target.value)}
          value={apiEndpointInput}
          placeholder={selectedProvider === "custom" ? t('placeholders.enterCustomBaseUrl') : `${aiProviders.find(p => p.id === selectedProvider)?.baseUrl || ''}`}
          style={styles.input}
        />
        {selectedProvider !== "custom" && (
          <p style={styles.hint}>
            {t('settings_section.autoFill') || 'Leave empty to use default URL'}
          </p>
        )}
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>{t('settings_section.apiToken')}</label>
        <div style={styles.passwordWrapper}>
          <input
            type={showApiKey ? "text" : "password"}
            onChange={(e) => setApiKeyInput(e.target.value)}
            value={apiKeyInput}
            placeholder={t('messages.enterApiToken')}
            style={styles.passwordInput}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            style={styles.toggleButton}
            title={showApiKey ? "Hide" : "Show"}
          >
            {showApiKey ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <div style={styles.formGroup}>
        <label style={styles.label}>{t('settings_section.language')}</label>
        <select
          value={selectedLanguage}
          onChange={(e) => {
            const newLanguage = e.target.value;
            setSelectedLanguage(newLanguage);
            i18n.changeLanguage(newLanguage);
          }}
          style={styles.select}
        >
          {languages.map(language => (
            <option key={language.code} value={language.code}>
              {language.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={saveSettings}
        style={styles.saveButton}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = '#45a049';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = '#4CAF50';
        }}
      >
        {t('settings_section.save')}
      </button>
    </div>
  );
};

export default SettingsPanel;
